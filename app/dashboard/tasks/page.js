'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLang } from '@/app/providers';

const STATUSES = ['todo', 'doing', 'done'];

export default function TasksPage() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, status, created_at')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setItems(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    setError('');
    const { error } = await supabase.from('tasks').insert({ title: value });
    if (error) {
      setError(error.message);
      return;
    }
    setTitle('');
    load();
  }

  async function setStatus(id, status) {
    setError('');
    const { error } = await supabase.from('tasks').update({ status }).eq('id', id);
    if (error) setError(error.message);
    else load();
  }

  async function remove(id) {
    setError('');
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) setError(error.message);
    else load();
  }

  return (
    <div className="page-wide">
      <h1 className="page-title glow">&gt; {t('tasks')}</h1>

      <form className="input-row" onSubmit={add}>
        <input
          className="text-input"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('taskPlaceholder')}
        />
        <button className="btn" disabled={!title.trim()}>{t('add')}</button>
      </form>

      {error && <div className="error">{error}</div>}

      <div className="list">
        {items.length === 0 && <div className="empty">{t('noItems')}</div>}
        {items.map((task) => (
          <div className="item" key={task.id}>
            <div className={`item-main ${task.status === 'done' ? 'done' : ''}`}>{task.title}</div>
            <select
              className="select"
              value={task.status}
              onChange={(e) => setStatus(task.id, e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{t(s)}</option>
              ))}
            </select>
            <button className="btn small ghost" onClick={() => remove(task.id)}>{t('remove')}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
