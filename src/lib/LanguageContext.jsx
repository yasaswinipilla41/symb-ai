// LanguageContext — shares the active UI language app-wide and exposes a
// translation helper `t()`. The choice is persisted in localStorage ('language')
// and mirrored onto <html lang="…"> so the whole app switches live when the
// user picks a language in Settings.

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { translate } from './i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('language') || 'en');

  useEffect(() => {
    localStorage.setItem('language', lang);
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const setLang = useCallback((next) => setLangState(next || 'en'), []);
  const t = useCallback((key) => translate(lang, key), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within <LanguageProvider>');
  return ctx;
}
