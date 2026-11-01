
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateReply } from '@/lib/ai/providers';
import { logActivity } from '@/lib/audit';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Taseen AI, the personal AI assistant of your owner, Taseen.
- Reply in the same language the user writes in (Bengali or English).
- Be clear, helpful, honest and concise. If you are unsure, say so.
- You currently can only chat. You cannot send emails, delete files, publish content or spend money.
- In future, any sensitive action will require the owner's explicit approval. Never claim you performed an action you did not perform.`;

export async function POST(request) {
  const user = await requireUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }

  const message =
    typeof body.message === 'string'
      ? body.message.trim()
      : '';

  if (!message || message.length > 4000) {
    return NextResponse.json(
      { error: 'Message is empty or too long' },
      { status: 400 }
    );
  }

  const db = supabaseAdmin();

  let conversationId =
    typeof body.conversationId === 'string'
      ? body.conversationId
      : null;

  if (conversationId) {
    const { data } = await db
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!data) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }
  } else {
    const { data, error } = await db
      .from('conversations')
      .insert({
        user_id: user.id,
        title: message.slice(0, 60),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Conversation creation error:', error);

      return NextResponse.json(
        { error: 'Could not create conversation' },
        { status: 500 }
      );
    }

    conversationId = data.id;
  }

  const { error: insertErr } = await db
    .from('messages')
    .insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: 'user',
      content: message,
    });

  if (insertErr) {
    console.error('Message save error:', insertErr);

    return NextResponse.json(
      { error: 'Could not save message' },
      { status: 500 }
    );
  }

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

  if (historyRes.error || memoryRes.error) {
    console.error(
      'Chat context error:',
      historyRes.error || memoryRes.error
    );

    return NextResponse.json(
      { error: 'Could not load chat context' },
      { status: 500 }
    );
  }

  let history = (historyRes.data || []).reverse();

  while (history.length && history[0].role !== 'user') {
    history.shift();
  }

  const memories = (memoryRes.data || [])
    .map((m) => `- ${m.content}`)
    .join('\n');

  const system = memories
    ? `${SYSTEM_PROMPT}\n\nThings you remember about the owner:\n${memories}`
    : SYSTEM_PROMPT;

  let reply;

  try {
    reply = await generateReply({
      system,
      messages: history,
    });
  } catch (err) {
    console.error('AI error:', err.message);

    await logActivity(user.id, 'chat.error', {
      error: String(err.message).slice(0, 200),
    });

    return NextResponse.json(
      {
        error:
          'AI provider failed. Check API key, model name and free-tier limits.',
      },
      { status: 502 }
    );
  }

  const { error: replySaveError } = await db
    .from('messages')
    .insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: 'assistant',
      content: reply,
    });

  if (replySaveError) {
    console.error('Reply save error:', replySaveError);

    return NextResponse.json(
      { error: 'Could not save AI response' },
      { status: 500 }
    );
  }

  await logActivity(user.id, 'chat.message', {
    conversationId,
  });

  return NextResponse.json({
    conversationId,
    reply,
  });
}
