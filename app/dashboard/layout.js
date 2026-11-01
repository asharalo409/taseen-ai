'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useLang } from '@/app/providers';

const ITEMS = [
  { key: 'overview', href: '/dashboard', icon: '◈' },
  { key: 'chat', href: '/dashboard/chat', icon: '❯' },
  { key: 'activity', href: null, icon: '≡' },
  { key: 'accounts', href: null, icon: '⚿' },
  { key: 'tasks', href: null, icon: '☑' },
  { key: 'memory', href: null, icon: '◎' },
  { key: 'approvals', href: null, icon: '✓' },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang } = useLang();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
      } else {
        setEmail(data.session.user.email || '');
        setReady(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login');
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (!ready) {
    return <div className="center-screen"><span className="glow">{t('loading')}</span></div>;
  }

  return (
    <div className="shell">
      <div className={`backdrop ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand glow">&gt; {t('appName')}</div>

        {ITEMS.map((item) =>
          item.href ? (
            <Link
              key={item.key}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <span>{item.icon} {t(item.key)}</span>
            </Link>
          ) : (
            <div key={item.key} className="nav-item disabled">
              <span>{item.icon} {t(item.key)}</span>
              <span className="badge">{t('soon')}</span>
            </div>
          )
        )}

        <div className="sidebar-bottom">
          <div className="lang-switch">
            <button className={lang === 'bn' ? 'on' : ''} onClick={() => setLang('bn')}>বাংলা</button>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
          </div>
          <div className="user-email">{email}</div>
          <button className="btn small ghost" onClick={logout}>{t('logout')}</button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <button className="menu-btn" onClick={() => setOpen(true)} aria-label="menu">☰</button>
          <span className="glow">{t('appName')}</span>
        </div>
        {children}
      </main>
    </div>
  );
}
