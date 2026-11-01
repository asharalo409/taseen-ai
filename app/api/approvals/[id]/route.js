import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { executeAction } from '@/lib/actions';
import { logActivity } from '@/lib/audit';

export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request, { params }) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id || !UUID.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const decision = body && body.decision;
  if (decision !== 'approve' && decision !== 'reject') {
    return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
  }

  const db = supabaseAdmin();

  // Claim the approval: only succeeds once, and only while it is still pending.
  const { data: claimed, error } = await db
    .from('approvals')
    .update({
      status: decision === 'approve' ? 'approved' : 'rejected',
      decided_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 });
  if (!claimed) {
    return NextResponse.json({ error: 'Not found or already decided' }, { status: 409 });
  }

  if (decision === 'reject') {
    await logActivity(user.id, 'approval.rejected', { id, type: claimed.action_type });
    return NextResponse.json({ status: 'rejected' });
  }

  try {
    await executeAction(user.id, claimed);
    await db.from('approvals').update({ status: 'executed' }).eq('id', id);
    await logActivity(user.id, 'approval.executed', { id, type: claimed.action_type });
    return NextResponse.json({ status: 'executed' });
  } catch (err) {
    await db.from('approvals').update({ status: 'failed' }).eq('id', id);
    await logActivity(user.id, 'approval.failed', {
      id,
      type: claimed.action_type,
      error: String(err.message).slice(0, 200),
    });
    return NextResponse.json({ status: 'failed', error: 'Action failed' }, { status: 500 });
  }
}
