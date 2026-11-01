'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLang } from '@/app/providers';

export default function OverviewPage() {
  const { t } = useLang();
  const [stats, setStats] = useState({ messages: '…', memories: '…', tasks: '…', approvals: '…' });

  useEffect(() => {
    async function load() {
      const count = (q) => q.then((r) => (r.error ? '–' : r.count ?? 0));
      const [messages, memories, tasks, approvals] = await Promise.all([
        count(supabase.from('messages').select('id', { count: 'exact', head: true })),
        count(supabase.from('memories').select('id', { count: 'exact', head: true })),
        count(supabase.from('tasks').select('id', { count: 'exact', head: true })),
        count(supabase.from('approvals').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
      ]);
      setStats({ messages, memories, tasks, approvals });
    }
    load();
  }, []);

  const cards = [
    ['statMessages', stats.messages],
    ['statMemories', stats.memories],
    ['statTasks', stats.tasks],
    ['statApprovals', stats.approvals],
  ];

  return (
    <div>
      <h1 className="page-title glow">&gt; {t('welcome')}</h1>
      <div className="grid">
        {cards.map(([key, value]) => (
          <div className="stat" key={key}>
            <div className="label">{t(key)}</div>
            <div className="value glow">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
