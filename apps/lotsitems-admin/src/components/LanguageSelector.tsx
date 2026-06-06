"use client";

import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Locale } from '@/locales/translations';

const LANGUAGES: { code: Locale; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ar', name: 'العربية', flag: '🇦🇪' },
];

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { locale, setLocale } = useLanguage();

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-2 rounded-full border border-white/10 backdrop-blur-sm"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline-block">{LANGUAGES.find(l => l.code === locale)?.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-40 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-[100]">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLocale(lang.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-blue-600/20 transition-colors ${locale === lang.code ? 'text-blue-400 font-semibold bg-blue-600/10' : 'text-slate-300'}`}
            >
              <span>{lang.flag}</span>
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
