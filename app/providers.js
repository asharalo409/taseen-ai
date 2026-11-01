'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { dictionary } from '@/lib/i18n';

const LangContext = createContext({ lang: 'bn', setLang: () => {}, t: (k) => k });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState('bn');

  useEffect(() => {
    const saved = localStorage.getItem('taseen-lang');
    if (saved === 'bn' || saved === 'en') setLangState(saved);
  }, []);

  function setLang(next) {
    setLangState(next);
    localStorage.setItem('taseen-lang', next);
  }

  const t = (key) => dictionary[lang][key] || key;

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
