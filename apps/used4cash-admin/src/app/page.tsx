"use client";

import { useState } from 'react';
import { Sparkles, ScanLine, Smartphone, ArrowRight, ShieldCheck, Zap, LogOut, X, Box, BadgeCheck, Globe, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Locale } from '@/locales/translations';

const LANGUAGES: { code: Locale; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ar', name: 'العربية', flag: '🇦🇪' },
];

export default function LandingPage() {
  const [isHovering, setIsHovering] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useLanguage();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Gradients & Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-20 w-full">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 overflow-hidden rounded-lg">
            <Image 
              src="/logo.png" 
              alt={`${t('navBrand')} Logo`}
              fill 
              className="object-contain"
              priority
            />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">{t('navBrand')}</span>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          
          {/* Language Selector */}
          <div className="relative">
            <button 
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-2 rounded-full border border-white/10 backdrop-blur-sm"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline-block">{LANGUAGES.find(l => l.code === locale)?.name}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isLangMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-[100]">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLocale(lang.code);
                      setIsLangMenuOpen(false);
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

          {/* Page Links */}
          <div className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-400">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400 hidden md:inline-block">
                {t('navWelcome')}<span className="text-slate-200 font-medium">{user.name}</span>
              </span>
              <Link href={user.role === "ADMIN" ? "/admin" : (user.role === "VENDOR" ? "/vendor" : "/profile")} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-blue-500/25">
                {user.role === "ADMIN" || user.role === "VENDOR" ? t('navDashboard') : t('navAccount')}
              </Link>
              <Link href={user.role === "ADMIN" ? "/admin" : (user.role === "VENDOR" ? "/vendor" : "/profile")} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white hover:scale-110 transition-all active:scale-95 shadow-lg shadow-blue-500/25 border border-white/10 ml-2">
                {user.name?.[0]}
              </Link>
              <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full border border-white/10 backdrop-blur-sm" title="Sign Out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/auth" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-blue-500/25">
              {t('navSignIn')}
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-24 pb-32 text-center relative z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Sparkles className="w-3.5 h-3.5 text-green-500" />
          {t('tagline')}
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight max-w-4xl text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          {t('heroTitle1')} <br className="hidden md:block" /> {t('heroTitle2')}
        </h1>

        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          {t('heroSubtitle')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          <Link
            href="/offer"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold text-lg transition-all shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.7)] flex items-center justify-center gap-2"
          >
            <span>{t('btnGetOffer')}</span>
            <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${isHovering ? (locale === 'ar' ? '-translate-x-1' : 'translate-x-1') : ''} ${locale === 'ar' ? 'rotate-180' : ''}`} />
          </Link>

          <button
            onClick={() => setShowHowItWorks(true)}
            className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full font-semibold text-lg text-slate-200 transition-colors flex items-center justify-center gap-2 backdrop-blur-sm"
          >
            <span>{t('btnHowItWorks')}</span>
          </button>
        </div>

        {/* Floating Device UI Mockup */}
        <div className="mt-24 relative w-full max-w-5xl mx-auto perspective-[2000px]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-10" />
          <div className="relative rounded-2xl md:rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden aspect-video transform-gpu rotate-x-[5deg] scale-100 hover:scale-[1.02] hover:rotate-x-[2deg] transition-all duration-700 ease-out flex items-center justify-center">

            <div className="absolute inset-0 bg-grid-slate-800/[0.2] bg-[size:20px_20px]" />
            <div className="relative z-10 text-center">
              <ScanLine className="w-16 h-16 text-blue-500 mx-auto mb-6 animate-pulse" />
              <div className="h-2 w-64 bg-slate-800 rounded-full overflow-hidden mx-auto mb-4 flex">
                <div className="h-full bg-blue-500 w-1/2 animate-[progress_2s_ease-in-out_infinite]" />
              </div>
              <p className="text-slate-400 font-medium">{t('scanningText')}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-24 border-t border-slate-800/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { icon: Zap, title: t('feature1Title'), description: t('feature1Desc') },
            { icon: Smartphone, title: t('feature2Title'), description: t('feature2Desc') },
            { icon: ShieldCheck, title: t('feature3Title'), description: t('feature3Desc') }
          ].map((feature, i) => (
            <div key={i} className={`flex flex-col items-center md:items-start text-center md:text-start group cursor-pointer`}>
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-lg">
                <feature.icon className="w-7 h-7 text-blue-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-white transition-colors">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed text-base">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-800/50 py-8 text-center text-slate-500 text-sm">
        <p>{t('footerText')}</p>
      </footer>

      {/* How it Works Modal */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowHowItWorks(false)} />

          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Glow */}
            <div className={`absolute top-0 ${locale === 'ar' ? 'left-0' : 'right-0'} w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none`} />

            <button
              onClick={() => setShowHowItWorks(false)}
              className={`absolute top-4 ${locale === 'ar' ? 'left-4' : 'right-4'} p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors z-10`}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-3xl font-bold mb-2 text-white flex items-center gap-3">
              <Box className="w-8 h-8 text-blue-500" />
              {t('modalTitle')}
            </h2>
            <p className="text-slate-400 mb-8 border-b border-slate-800/60 pb-6">
              {t('modalSubtitle')}
            </p>

            <div className={`space-y-8 relative before:absolute before:inset-y-0 ${locale === 'ar' ? 'before:right-[19px] mr-2' : 'before:left-[19px] ml-2'} before:w-0.5 before:bg-slate-800`}>
              {[
                { icon: ScanLine, title: t('modalStep1Title'), desc: t('modalStep1Desc') },
                { icon: Zap, title: t('modalStep2Title'), desc: t('modalStep2Desc') },
                { icon: ShieldCheck, title: t('modalStep3Title'), desc: t('modalStep3Desc') },
                { icon: BadgeCheck, title: t('modalStep4Title'), desc: t('modalStep4Desc') }
              ].map((step, idx) => (
                <div key={idx} className={`relative ${locale === 'ar' ? 'pr-12' : 'pl-12'} flex flex-col items-start group`}>
                  <div className={`absolute ${locale === 'ar' ? 'right-[3px]' : 'left-[3px]'} top-1 w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-500 transition-colors shadow-lg shadow-black/50`}>
                    <step.icon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-200 group-hover:text-blue-400 transition-colors mb-2 text-start">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm text-start">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-slate-800/60 flex justify-end">
              <Link
                href="/offer"
                onClick={() => setShowHowItWorks(false)}
                className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all hover:scale-105 shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] flex items-center gap-2"
              >
                {t('modalStartSelling')} <ArrowRight className={`w-4 h-4 ${locale === 'ar' ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
