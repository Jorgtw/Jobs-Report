import React, { useState, useContext, useEffect } from 'react';
import { useTranslation, LanguageContext } from '../contexts/LanguageContext';
import { allTranslations } from '../i18n';
import { 
  Smartphone, 
  FolderKanban, 
  Clock, 
  Building, 
  FileSpreadsheet, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  ArrowRight,
  Users,
  Sparkles
} from 'lucide-react';

const PresentationView: React.FC = () => {
  const { lang, setLang, t } = useTranslation() as any;
  const langContext = useContext(LanguageContext);
  
  const [openPanelKey, setOpenPanelKey] = useState<string | null>(null);
  const [showLangOverlay, setShowLangOverlay] = useState(!localStorage.getItem('ws_lang'));
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ws_lang');
    if (saved) {
      if (setLang) setLang(saved as any);
      else if (langContext) langContext.setLang(saved as any);
    }
  }, []);

  const setLanguage = (l: string) => {
    if (setLang) setLang(l as any);
    else if (langContext) langContext.setLang(l as any);
    localStorage.setItem('ws_lang', l);
    setShowLangOverlay(false);
    setIsLangDropdownOpen(false);
  };

  const currentLang = (lang || 'it');

  const getSectionData = (key: string) => {
    const sections: any = {
      clienti: { icon: '👥', color: '#10b981' },
      personale: { icon: '🛡️', color: '#ef4444' },
      progetti: { icon: '💼', color: '#f59e0b' },
      subappalti: { icon: '📋', color: '#06b6d4' },
      rapportini: { icon: '📄', color: '#3b82f6' },
      sommario: { icon: '📑', color: '#8b5cf6' },
      profilo: { icon: '👤', color: '#6b7280' },
      assistenza: { icon: '❓', color: '#2563eb' }
    };
    return sections[key];
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const currentSectionGroups = openPanelKey 
    ? ((allTranslations as any)[currentLang]?.presentation?.sections?.[openPanelKey]?.groups || (allTranslations as any)['it']?.presentation?.sections?.[openPanelKey]?.groups || [])
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f2f5] font-['Inter',sans-serif] text-[#1a1a2e]">
      
      {/* TOPNAV */}
      <nav className="sticky top-0 z-[300] h-[64px] bg-white border-b border-[#e5e7eb] px-4 sm:px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-[36px] h-[36px] bg-gradient-to-br from-[#2563eb] to-[#3b82f6] rounded-xl flex items-center justify-center text-white text-[18px] shadow-sm">
            📊
          </div>
          <div className="text-[19px] font-black tracking-tight">
            Jobs<span className="text-[#2563eb]">Report</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Language Selector */}
          <div className="relative">
            <button 
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 border border-[#e5e7eb] bg-white rounded-full px-3 py-1.5 text-[12px] font-bold text-[#6b7280] hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
            >
              🌐 <span className="uppercase">{String(currentLang)}</span>
            </button>
            {isLangDropdownOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-[#e5e7eb] rounded-2xl shadow-xl w-[160px] p-1.5 z-[400] animate-in fade-in zoom-in-95 duration-150">
                {['it', 'en', 'es', 'pl', 'tr', 'da'].map((l) => (
                  <div 
                    key={l} 
                    onClick={() => setLanguage(l)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-[13px] font-medium cursor-pointer hover:bg-[#eff6ff] ${currentLang === l ? 'bg-[#eff6ff] text-[#2563eb] font-bold' : 'text-[#6b7280]'}`}
                  >
                    <span>{l === 'it' ? '🇮🇹' : l === 'en' ? '🇬🇧' : l === 'es' ? '🇪🇸' : l === 'pl' ? '🇵🇱' : l === 'tr' ? '🇹🇷' : '🇩🇰'}</span>
                    {l === 'it' ? 'Italiano' : l === 'en' ? 'English' : l === 'es' ? 'Español' : l === 'pl' ? 'Polski' : l === 'tr' ? 'Türkçe' : 'Dansk'}
                  </div>
                ))}
              </div>
            )}
          </div>

          <a 
            href="#/"
            className="text-[13px] font-bold text-slate-600 hover:text-[#2563eb] px-3 py-1.5 rounded-lg transition-colors hidden sm:block"
          >
            {t('presentation.hero.cta_login')}
          </a>

          <a 
            href="#/richiesta-registrazione"
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-bold px-4 py-2 rounded-xl transition-all shadow-sm shadow-blue-500/20 active:scale-95"
          >
            {t('presentation.pricing.freeCta')}
          </a>
        </div>
      </nav>

      <div className="flex flex-1 relative">
        
        {/* MAIN CONTENT AREA */}
        <main className={`flex-1 w-full p-4 sm:p-8 lg:p-10 max-w-6xl mx-auto transition-all duration-300 ${openPanelKey ? 'lg:mr-[360px]' : ''}`}>
          
          {/* HERO SECTION */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] p-6 sm:p-10 rounded-3xl text-white shadow-xl shadow-blue-950/10 mb-8 sm:mb-12">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-4 border border-white/20">
                <Sparkles size={12} className="text-amber-300" />
                {t('presentation.hero.tag')}
              </div>
              
              <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight mb-3">
                {t('presentation.hero.title')}
              </h1>

              <p className="text-base sm:text-xl font-bold text-amber-200 leading-snug mb-3">
                “{t('presentation.hero.hook')}”
              </p>
              
              <p className="text-sm sm:text-base text-blue-50 leading-relaxed mb-6 max-w-2xl font-normal">
                {t('presentation.hero.desc')}
              </p>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <a 
                  href="#/richiesta-registrazione"
                  className="inline-flex items-center gap-2 bg-white text-[#1e40af] hover:bg-blue-50 px-5 sm:px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-black/10 active:scale-95"
                >
                  <span>{t('presentation.hero.cta_primary')}</span>
                  <ArrowRight size={16} />
                </a>
                
                <a 
                  href="#/"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-4 sm:px-5 py-3 rounded-2xl font-bold text-sm text-white transition-all"
                >
                  {t('presentation.hero.cta_login')}
                </a>
              </div>
            </div>
            
            {/* Background ambient lighting */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[140%] bg-white/10 blur-3xl rounded-full pointer-events-none" />
          </div>

          {/* 1. SEZIONE FLUSSO OPERATIVO: CAMPO → UFFICIO */}
          <section className="mb-10 sm:mb-14">
            <div className="flex flex-col mb-6">
              <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">
                {t('presentation.flow.badge')}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                {t('presentation.flow.title')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {t('presentation.flow.desc')}
              </p>
            </div>

            {/* 5 Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
              {[
                { 
                  icon: Smartphone, 
                  step: t('presentation.flow.step1_title'), 
                  desc: t('presentation.flow.step1_desc'),
                  color: 'bg-blue-50 text-blue-600 border-blue-100'
                },
                { 
                  icon: FolderKanban, 
                  step: t('presentation.flow.step2_title'), 
                  desc: t('presentation.flow.step2_desc'),
                  color: 'bg-amber-50 text-amber-600 border-amber-100'
                },
                { 
                  icon: Clock, 
                  step: t('presentation.flow.step3_title'), 
                  desc: t('presentation.flow.step3_desc'),
                  color: 'bg-emerald-50 text-emerald-600 border-emerald-100'
                },
                { 
                  icon: Building, 
                  step: t('presentation.flow.step4_title'), 
                  desc: t('presentation.flow.step4_desc'),
                  color: 'bg-indigo-50 text-indigo-600 border-indigo-100'
                },
                { 
                  icon: FileSpreadsheet, 
                  step: t('presentation.flow.step5_title'), 
                  desc: t('presentation.flow.step5_desc'),
                  color: 'bg-rose-50 text-rose-600 border-rose-100'
                },
              ].map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div 
                    key={index}
                    className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 border ${item.color}`}>
                        <IconComponent size={18} />
                      </div>
                      <h3 className="text-xs font-black text-slate-900 tracking-tight leading-snug mb-1">
                        {item.step}
                      </h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Benefit Bar */}
            <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-around gap-2 sm:gap-4 text-center">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="text-rose-500 font-black">✕</span> {t('presentation.flow.benefit1')}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="text-rose-500 font-black">✕</span> {t('presentation.flow.benefit2')}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="text-rose-500 font-black">✕</span> {t('presentation.flow.benefit3')}
              </div>
            </div>
          </section>

          {/* 2. SEZIONE FUNZIONALITÀ INTERATTIVE */}
          <section className="mb-10 sm:mb-14">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">
                  {t('presentation.ui.key_features')}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  Moduli operativi completi
                </h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {['clienti', 'personale', 'progetti', 'subappalti', 'rapportini', 'sommario'].map((key) => {
                const sec = getSectionData(key);
                const isSelected = openPanelKey === key;
                return (
                  <div 
                    key={key}
                    onClick={() => setOpenPanelKey(isSelected ? null : key)}
                    className={`flex items-start gap-3.5 bg-white border rounded-2xl p-4 cursor-pointer shadow-sm transition-all hover:shadow-md hover:border-blue-300 ${
                      isSelected ? 'border-blue-600 ring-2 ring-blue-500/10' : 'border-slate-200/80'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 text-white shadow-xs" 
                      style={{ backgroundColor: sec.color }}
                    >
                      {sec.icon as React.ReactNode}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-black tracking-tight text-slate-900 uppercase">
                          {t(`presentation.sections.${key}.title`)}
                        </strong>
                        <span className={`text-slate-400 text-sm font-bold transition-transform ${isSelected ? 'rotate-90 text-blue-600' : ''}`}>
                          ›
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {t(`presentation.sections.${key}.desc`)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. SEZIONE PIANI & TRASPARENZA PREZZI */}
          <section className="mb-10 sm:mb-14">
            <div className="flex flex-col mb-6 text-center max-w-2xl mx-auto">
              <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">
                {t('presentation.pricing.badge')}
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                {t('presentation.pricing.title')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                {t('presentation.pricing.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-stretch">
              {/* Card Free */}
              <div className="bg-white border-2 border-blue-500/80 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-2.5 right-2.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  {t('presentation.pricing.freeBadge')}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {t('presentation.pricing.freeTitle')}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-blue-600">{t('presentation.pricing.freePrice')}</span>
                  </div>
                  <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
                    {t('presentation.pricing.noExpiry')}
                  </p>
                  
                  <div className="my-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Users size={13} className="text-blue-600" />
                      {t('presentation.pricing.freeUsers')}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      {t('presentation.pricing.allIncluded')}
                    </div>
                  </div>
                </div>

                <a 
                  href="#/richiesta-registrazione"
                  className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-sm active:scale-95 mt-2"
                >
                  {t('presentation.pricing.freeCta')}
                </a>
              </div>

              {/* Card Starter */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {t('presentation.pricing.starterTitle')}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{t('presentation.pricing.starterPrice')}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{t('presentation.pricing.perMonth')}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {t('presentation.pricing.perYear').replace('{price}', t('presentation.pricing.starterYearly'))}
                  </p>
                  
                  <div className="my-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Users size={13} className="text-slate-500" />
                      {t('presentation.pricing.starterUsers')}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      {t('presentation.pricing.allIncluded')}
                    </div>
                  </div>
                </div>

                <a 
                  href="#/richiesta-registrazione"
                  className="w-full text-center bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 rounded-xl transition-all border border-slate-200 mt-2"
                >
                  {t('presentation.pricing.starterCta')}
                </a>
              </div>

              {/* Card Business */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {t('presentation.pricing.businessTitle')}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{t('presentation.pricing.businessPrice')}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{t('presentation.pricing.perMonth')}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {t('presentation.pricing.perYear').replace('{price}', t('presentation.pricing.businessYearly'))}
                  </p>
                  
                  <div className="my-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Users size={13} className="text-slate-500" />
                      {t('presentation.pricing.businessUsers')}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      {t('presentation.pricing.allIncluded')}
                    </div>
                  </div>
                </div>

                <a 
                  href="#/richiesta-registrazione"
                  className="w-full text-center bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 rounded-xl transition-all border border-slate-200 mt-2"
                >
                  {t('presentation.pricing.businessCta')}
                </a>
              </div>

              {/* Card Growth */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {t('presentation.pricing.growthTitle')}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{t('presentation.pricing.growthPrice')}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{t('presentation.pricing.perMonth')}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {t('presentation.pricing.perYear').replace('{price}', t('presentation.pricing.growthYearly'))}
                  </p>
                  
                  <div className="my-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Users size={13} className="text-slate-500" />
                      {t('presentation.pricing.growthUsers')}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      {t('presentation.pricing.allIncluded')}
                    </div>
                  </div>
                </div>

                <a 
                  href="#/richiesta-registrazione"
                  className="w-full text-center bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 rounded-xl transition-all border border-slate-200 mt-2"
                >
                  {t('presentation.pricing.growthCta')}
                </a>
              </div>

              {/* Card Enterprise */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {t('presentation.pricing.enterpriseTitle')}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-900">{t('presentation.pricing.enterprisePrice')}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {t('presentation.pricing.enterpriseDesc')}
                  </p>
                  
                  <div className="my-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Users size={13} className="text-slate-500" />
                      {t('presentation.pricing.enterpriseUsers')}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      {t('presentation.pricing.allIncluded')}
                    </div>
                  </div>
                </div>

                <a 
                  href="#/richiesta-registrazione"
                  className="w-full text-center bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 rounded-xl transition-all border border-slate-200 mt-2"
                >
                  {t('presentation.pricing.enterpriseCta')}
                </a>
              </div>
            </div>
          </section>

          {/* 4. SEZIONE FAQ PRATICA */}
          <section className="mb-12">
            <div className="flex flex-col mb-6">
              <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">
                {t('presentation.faq.badge')}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {t('presentation.faq.title')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {t('presentation.faq.subtitle')}
              </p>
            </div>

            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                const isOpen = openFaqIndex === num;
                return (
                  <div 
                    key={num}
                    className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(num)}
                      className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors"
                    >
                      <span className="text-xs sm:text-sm font-black text-slate-800 tracking-tight">
                        {t(`presentation.faq.q${num}` as any)}
                      </span>
                      <span className="text-slate-400 shrink-0">
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-50 font-normal">
                        {t(`presentation.faq.a${num}` as any)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* FINAL BANNER CTA */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3 shadow-lg">
            <h3 className="text-lg sm:text-xl font-black tracking-tight">
              Pronto a semplificare la rendicontazione dei tuoi cantieri?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              Crea il tuo account in 1 minuto. Nessuna carta di credito richiesta.
            </p>
            <a 
              href="#/richiesta-registrazione"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 mt-2"
            >
              {t('presentation.hero.cta_primary')}
            </a>
          </div>

        </main>

        {/* DETAIL PANEL (Drawer for Feature Deep Dives) */}
        <aside className={`fixed top-[64px] right-0 w-full sm:w-[380px] h-[calc(100vh-64px)] bg-white border-l border-[#e5e7eb] shadow-2xl flex flex-col transition-transform duration-300 z-[200] ${
          openPanelKey ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {openPanelKey && (
            <>
              <div className="p-5 border-b border-[#e5e7eb] flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 text-white" style={{ background: getSectionData(openPanelKey).color }}>
                    {getSectionData(openPanelKey).icon as React.ReactNode}
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900 leading-tight">{t(`presentation.sections.${openPanelKey}.title`)}</div>
                    <div className="text-xs text-slate-400 mt-0.5 leading-tight">{t(`presentation.sections.${openPanelKey}.desc`)}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setOpenPanelKey(null)}
                  className="w-8 h-8 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-800 rounded-lg flex items-center justify-center transition-colors text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
                {currentSectionGroups.map((g: any, i: number) => (
                  <div key={i} className="space-y-2">
                    <div className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-1.5">{g.title}</div>
                    {(g.items || []).map((it: any, j: number) => (
                      <div key={j} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: getSectionData(openPanelKey).color }} />
                        <p className="text-xs text-slate-600 leading-normal">
                          <strong className="text-slate-900 font-bold">{it.name}</strong> — {it.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-[#e5e7eb] bg-slate-50">
                <a 
                  href="#/richiesta-registrazione"
                  className="block w-full text-center bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-black text-xs py-3 rounded-xl transition-all shadow-sm"
                >
                  {t('presentation.ui.request_demo')}
                </a>
              </div>
            </>
          )}
        </aside>

      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#e5e7eb] text-center p-4 text-[11px] text-slate-400 font-medium">
        © 2026 JobsReport · {t('presentation.ui.footer_rights')} · <a href="#/privacy" className="hover:underline">Privacy</a> · <a href="#/terms" className="hover:underline">Termini</a>
      </footer>

      {/* LANGUAGE OVERLAY (First Visit) */}
      {showLangOverlay && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white p-8 sm:p-10 rounded-3xl text-center max-w-[440px] w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-4xl mb-3">🌐</div>
            <h2 className="text-xl font-black text-slate-900 mb-1">{t('presentation.ui.overlay_title')}</h2>
            <p className="text-slate-500 text-xs mb-6 leading-normal">{t('presentation.ui.overlay_sub')}</p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'it', label: 'Italiano', flag: '🇮🇹' },
                { id: 'en', label: 'English', flag: '🇬🇧' },
                { id: 'es', label: 'Español', flag: '🇪🇸' },
                { id: 'pl', label: 'Polski', flag: '🇵🇱' },
                { id: 'tr', label: 'Türkçe', flag: '🇹🇷' },
                { id: 'da', label: 'Dansk', flag: '🇩🇰' }
              ].map((langObj) => (
                <button
                  key={langObj.id}
                  onClick={() => setLanguage(langObj.id)}
                  className="flex items-center justify-center gap-2 p-3 border border-slate-200 rounded-xl hover:border-blue-600 hover:bg-blue-50/50 hover:text-blue-600 transition-all text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <span>{langObj.flag}</span> {langObj.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PresentationView;

