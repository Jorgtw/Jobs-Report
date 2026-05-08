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

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('ws_lang') as Language) || 'it');

  useEffect(() => {
    localStorage.setItem('ws_lang', lang);
  }, [lang]);

  const t = useCallback((key: TranslationKey): string => {
    return resolveKey(lang, key);
  }, [lang]);

  const contextValue = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};
