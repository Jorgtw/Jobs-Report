import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Language, TranslationKey, resolveKey } from '../i18n';

export const LanguageContext = createContext<{
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TranslationKey) => string;
}>({
  lang: 'it',
  setLang: () => { },
  t: (key) => key as string,
});

export const useTranslation = () => useContext(LanguageContext);

export const localeMap: Record<string, string> = {
  it: 'it-IT',
  en: 'en-GB',
  es: 'es-ES',
  pl: 'pl-PL',
  tr: 'tr-TR',
  da: 'da-DK'
};

const getInitialLang = (): Language => {
  const supported: Language[] = ['it', 'en', 'es', 'pl', 'tr', 'da'];
  
  // 1. Check URL query param e.g. ?lang=en
  const urlParams = new URLSearchParams(window.location.search);
  let l = urlParams.get('lang');
  
  // 2. Check hash query param e.g. #/richiesta-registrazione?lang=en
  if (!l && window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.split('?')[1];
    l = new URLSearchParams(hashQuery).get('lang');
  }

  if (l && supported.includes(l.toLowerCase() as Language)) {
    const matched = l.toLowerCase() as Language;
    localStorage.setItem('ws_lang', matched);
    return matched;
  }

  const saved = localStorage.getItem('ws_lang') as Language;
  if (saved && supported.includes(saved)) {
    return saved;
  }

  return 'it';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(getInitialLang);

  useEffect(() => {
    localStorage.setItem('ws_lang', lang);
  }, [lang]);

  const t = useCallback((key: TranslationKey): string => {
    return resolveKey(lang, key);
  }, [lang]);

  const contextValue = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};
