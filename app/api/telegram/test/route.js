import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { sendTelegram } from '@/lib/telegram';
import { logActivity } from '@/lib/audit';

export const runtime = 'nodejs';

export async function POST(request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await sendTelegram('✅ Taseen AI: Telegram connection works.');
  await logActivity(user.id, 'telegram.test', { ok: result.ok, reason: result.reason || null });
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
