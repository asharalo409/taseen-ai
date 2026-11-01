'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { authFetch } from '@/lib/api';
import { useLang } from '@/app/providers';

export default function ChatPage() {
  const { t } = useLang();
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const endRef = useRef(null);
  const formRef = useRef(null);

  // Load the latest conversation
  useEffect(() => {
    async function load() {
      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!conv) return;
      const { data: msgs } = await supabase
        .from('messages')
        .select('id, role, content')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });
      setConversationId(conv.id);
      setMessages(msgs || []);
    }
    load();
  }, []);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError('');
    setNotice('');
    setInput('');
    setLoading(true);
    setMessages((m) => [...m, { id: 'u' + Date.now(), role: 'user', content: text }]);

    try {
      const res = await authFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, conversationId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setConversationId(json.conversationId);
      setMessages((m) => [...m, { id: 'a' + Date.now(), role: 'assistant', content: json.reply }]);
      if (json.approvals > 0) setNotice(t('approvalCreated'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (formRef.current) formRef.current.requestSubmit();
    }
  }

  function newChat() {
    setConversationId(null);
    setMessages([]);
    setError('');
    setNotice('');
  }

  return (
    <div className="chat">
      <div className="chat-head">
        <h1 className="page-title glow" style={{ margin: 0 }}>&gt; {t('chat')}</h1>
        <button className="btn small ghost" onClick={newChat}>{t('newChat')}</button>
      </div>

      <div className="messages">
        {messages.length === 0 && !loading && <div className="empty">{t('emptyChat')}</div>}
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role}`}>{m.content}</div>
        ))}
        {loading && <div className="msg assistant thinking">{t('thinking')}</div>}
        <div ref={endRef} />
      </div>

      {notice && <div className="notice">{notice}</div>}
      {error && <div className="error">{error}</div>}

      <form className="composer" onSubmit={send} ref={formRef}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t('chatPlaceholder')}
          rows={1}
        />
        <button className="btn" disabled={loading || !input.trim()}>{t('send')}</button>
      </form>
    </div>
  );
}
