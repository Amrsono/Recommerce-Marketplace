"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, translations, TranslationDictionary } from '../locales/translations';

interface LanguageContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof TranslationDictionary) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Load locale from localStorage on client mount
  useEffect(() => {
    const storedLocale = localStorage.getItem('used4cash_locale') as Locale;
    if (storedLocale && translations[storedLocale]) {
      setLocaleState(storedLocale);
    }
  }, []);

  // Update HTML dir and lang attributes on locale change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isRTL = locale === 'ar';
      document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', locale);
    }
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('used4cash_locale', newLocale);
  };

  const t = (key: keyof TranslationDictionary): string => {
    const dict = translations[locale] || translations['en'];
    return dict[key] || translations['en'][key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
