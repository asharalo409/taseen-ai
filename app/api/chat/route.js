import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateReply } from '@/lib/ai/providers';
import { logActivity } from '@/lib/audit';
import { sendTelegram } from '@/lib/telegram';

export const runtime = 'nodejs';
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are Taseen AI, the personal AI assistant of your owner, Taseen.
- Reply in the same language the user writes in (Bengali or English).
- Be clear, helpful, honest and concise. If you are unsure, say so.
- You can only chat. You cannot browse the web, send emails, delete files, publish content or spend money. Never claim you did something you did not do.
- If the owner shares a lasting personal fact or preference worth remembering, you may propose saving it by adding a line at the very end of your reply exactly like: [[REMEMBER: short fact]]
  This only creates a request that the owner must approve. Never say it has already been saved.`;

// Finds [[REMEMBER: ...]] tags, removes them from the visible reply, returns up to 2 proposals.
function extractProposals(reply) {
  const proposals = [];
  const cleaned = reply
    .replace(/\[\[REMEMBER:\s*([^\]]{1,300})\]\]/g, (_m, text) => {
      const value = text.trim();
      if (value && proposals.length < 2) proposals.push(value);
      return '';
    })
    .trim();
  return { cleaned: cleaned || '…', proposals };
}

export async function POST(request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > 4000) {
    return NextResponse.json({ error: 'Message is empty or too long' }, { status: 400 });
  }

  const db = supabaseAdmin();
  let conversationId = typeof body.conversationId === 'string' ? body.conversationId : null;

  if (conversationId) {
    const { data } = await db
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!data) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  } else {
    const { data, error } = await db
      .from('conversations')
      .insert({ user_id: user.id, title: message.slice(0, 60) })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: 'Could not create conversation' }, { status: 500 });
    conversationId = data.id;
  }

  const { error: insertErr } = await db
    .from('messages')
    .insert({ conversation_id: conversationId, user_id: user.id, role: 'user', content: message });
  if (insertErr) return NextResponse.json({ error: 'Could not save message' }, { status: 500 });

  const [historyRes, memoryRes] = await Promise.all([
    db
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(20),
    db
      .from('memories')
      .select('content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const history = (historyRes.data || []).reverse();
  while (history.length && history[0].role !== 'user') history.shift();

  const memories = (memoryRes.data || []).map((m) => `- ${m.content}`).join('\n');
  const system = memories
    ? `${SYSTEM_PROMPT}\n\nThings you remember about the owner:\n${memories}`
    : SYSTEM_PROMPT;

  let rawReply;
  try {
    rawReply = await generateReply({ system, messages: history });
  } catch (err) {
    const detail = String(err && err.message ? err.message : 'unknown error').slice(0, 300);
    console.error('AI error:', detail);
    await logActivity(user.id, 'chat.error', { error: detail });
    // Only the authenticated owner can reach this point, so showing the reason is safe.
    return NextResponse.json({ error: `AI provider failed. ${detail}` }, { status: 502 });
  }

  const { cleaned, proposals } = extractProposals(rawReply);

  await db
    .from('messages')
    .insert({ conversation_id: conversationId, user_id: user.id, role: 'assistant', content: cleaned });
  await logActivity(user.id, 'chat.message', { conversationId });

  // Memory proposals become PENDING approvals. Nothing is saved until the owner approves.
  let created = 0;
  for (const text of proposals) {
    const { data: approval, error } = await db
      .from('approvals')
      .insert({
        user_id: user.id,
        action_type: 'save_memory',
        summary: `Remember: ${text}`,
        payload: { text },
      })
      .select('id')
      .single();
    if (error || !approval) continue;
    created += 1;
    await logActivity(user.id, 'approval.requested', { id: approval.id, type: 'save_memory' });
    await sendTelegram(`🔔 Taseen AI approval needed\n\nRemember: ${text}\n\nOpen the dashboard → Approvals to approve or reject.`);
  }

  return NextResponse.json({ conversationId, reply: cleaned, approvals: created });
}
