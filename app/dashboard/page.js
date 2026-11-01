'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { authFetch } from '@/lib/api';
import { useLang } from '@/app/providers';

export default function OverviewPage() {
  const { t } = useLang();
  const [stats, setStats] = useState({ messages: '…', memories: '…', tasks: '…', approvals: '…' });
  const [tg, setTg] = useState('');
  const [tgBusy, setTgBusy] = useState(false);

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

  async function testTelegram() {
    setTgBusy(true);
    setTg('');
    try {
      const res = await authFetch('/api/telegram/test', { method: 'POST' });
      const json = await res.json();
      setTg(res.ok ? t('telegramOk') : `${t('telegramFail')} ${json.reason || json.error || ''}`);
    } catch {
      setTg(`${t('telegramFail')} network`);
    }
    setTgBusy(false);
  }

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

      <div style={{ marginTop: 22 }}>
        <button className="btn small" onClick={testTelegram} disabled={tgBusy}>
          {tgBusy ? t('sending') : t('telegramTest')}
        </button>
        {tg && <div className="notice" style={{ marginTop: 10 }}>{tg}</div>}
      </div>
    </div>
  );
}
