'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLang } from '@/app/providers';

export default function MemoryPage() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const { data, error } = await supabase
      .from('memories')
      .select('id, content, created_at')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setItems(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setError('');
    const { error } = await supabase.from('memories').insert({ content: value });
    if (error) {
      setError(error.message);
      return;
    }
    setText('');
    load();
  }

  async function remove(id) {
    setError('');
    const { error } = await supabase.from('memories').delete().eq('id', id);
    if (error) setError(error.message);
    else load();
  }

  return (
    <div className="page-wide">
      <h1 className="page-title glow">&gt; {t('memory')}</h1>
      <p className="hint">{t('memoryHint')}</p>

      <form className="input-row" onSubmit={add}>
        <input
          className="text-input"
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('memoryPlaceholder')}
        />
        <button className="btn" disabled={!text.trim()}>{t('add')}</button>
      </form>

      {error && <div className="error">{error}</div>}

      <div className="list">
        {items.length === 0 && <div className="empty">{t('noItems')}</div>}
        {items.map((m) => (
          <div className="item" key={m.id}>
            <div className="item-main">{m.content}</div>
            <button className="btn small ghost" onClick={() => remove(m.id)}>{t('remove')}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
