'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLang } from '@/app/providers';

export default function ActivityPage() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('activity_log')
        .select('id, event, details, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) setError(error.message);
      else setItems(data || []);
    }
    load();
  }, []);

  return (
    <div className="page-wide">
      <h1 className="page-title glow">&gt; {t('activity')}</h1>
      <p className="hint">{t('activityHint')}</p>
      {error && <div className="error">{error}</div>}

      <div className="list">
        {items.length === 0 && <div className="empty">{t('noItems')}</div>}
        {items.map((a) => (
          <div className="item col" key={a.id}>
            <div className="row-between">
              <span className="glow">{a.event}</span>
              <span className="muted">{new Date(a.created_at).toLocaleString()}</span>
            </div>
            {a.details && Object.keys(a.details).length > 0 && (
              <div className="muted small-text">{JSON.stringify(a.details).slice(0, 300)}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
