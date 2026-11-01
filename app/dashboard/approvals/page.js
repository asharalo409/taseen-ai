'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { authFetch } from '@/lib/api';
import { useLang } from '@/app/providers';

export default function ApprovalsPage() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    const { data, error } = await supabase
      .from('approvals')
      .select('id, action_type, summary, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) setError(error.message);
    else setItems(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(id, decision) {
    setBusy(id);
    setError('');
    try {
      const res = await authFetch(`/api/approvals/${id}`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error || 'Error');
    } catch {
      setError('Network error');
    }
    setBusy(null);
    load();
  }

  return (
    <div className="page-wide">
      <h1 className="page-title glow">&gt; {t('approvals')}</h1>
      {error && <div className="error">{error}</div>}

      <div className="list">
        {items.length === 0 && <div className="empty">{t('noApprovals')}</div>}
        {items.map((a) => (
          <div className="item col" key={a.id}>
            <div className="row-between">
              <span className="muted">{t('action_' + a.action_type)}</span>
              <span className={`pill ${a.status}`}>{t('s_' + a.status)}</span>
            </div>
            <div className="item-main">{a.summary}</div>
            <div className="muted small-text">{new Date(a.created_at).toLocaleString()}</div>
            {a.status === 'pending' && (
              <div className="row-gap">
                <button className="btn small" disabled={busy === a.id} onClick={() => decide(a.id, 'approve')}>
                  {t('approve')}
                </button>
                <button className="btn small ghost" disabled={busy === a.id} onClick={() => decide(a.id, 'reject')}>
                  {t('reject')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
