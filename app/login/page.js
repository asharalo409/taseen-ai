'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useLang } from '@/app/providers';

export default function LoginPage() {
  const router = useRouter();
  const { t, lang, setLang } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(t('loginError'));
      return;
    }
    router.replace('/dashboard');
  }

  return (
    <div className="center-screen">
      <form className="card" onSubmit={onSubmit}>
        <h1 className="glow">&gt; {t('appName')}</h1>
        <p className="sub">{t('tagline')}</p>

        <div className="field">
          <label>{t('email')}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="field">
          <label>{t('password')}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>

        {error && <div className="error">{error}</div>}

        <button className="btn block" disabled={loading}>
          {loading ? t('signingIn') : t('signIn')}
        </button>

        <div className="lang-switch" style={{ marginTop: 16 }}>
          <button type="button" className={lang === 'bn' ? 'on' : ''} onClick={() => setLang('bn')}>বাংলা</button>
          <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>English</button>
        </div>
      </form>
    </div>
  );
}
