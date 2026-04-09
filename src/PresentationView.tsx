import React, { useState, useContext, useEffect } from 'react';
import { useTranslation, LanguageContext } from './App';

const PresentationView: React.FC = () => {
  const { lang, setLang, t } = useTranslation() as any;
  const langContext = useContext(LanguageContext);
  
  const [openPanelKey, setOpenPanelKey] = useState<string | null>(null);
  const [showLangOverlay, setShowLangOverlay] = useState(!localStorage.getItem('ws_lang'));
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

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
      clienti: { icon:'👥', color:'#10b981' },
      personale: { icon:'🛡️', color:'#ef4444' },
      progetti: { icon:'💼', color:'#f59e0b' },
      subappalti: { icon:'📋', color:'#06b6d4' },
      rapportini: { icon:'📄', color:'#3b82f6' },
      sommario: { icon:'📑', color:'#8b5cf6' },
      profilo: { icon:'👤', color:'#6b7280' },
      assistenza: { icon:'❓', color:'#2563eb' }
    };
    return sections[key];
  };

  const SidebarItem = ({ id, icon, label }: { id: string, icon: string, label: string }) => (
    <div 
      onClick={() => setOpenPanelKey(id)}
      className={`sidebar-item flex items-center gap-3 px-6 py-[10px] text-[14px] cursor-pointer transition-all border-r-2 ${
        openPanelKey === id 
          ? 'text-[#2563eb] font-semibold bg-[#eff6ff] border-[#2563eb]' 
          : 'text-[#6b7280] hover:bg-[#f0f2f5] hover:text-[#1a1a2e] border-transparent'
      }`}
    >
      <span className="sidebar-icon w-5 text-center text-[16px]">{icon as React.ReactNode}</span>
      {label}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f2f5] font-['Inter',sans-serif] text-[#1a1a2e]">
      
      <style>{`
        .shadow-sm { box-shadow: 0 1px 3px rgba(0,0,0,0.07); }
        .shadow-lg { box-shadow: 0 10px 30px rgba(0,0,0,0.12); }
        .bg-white { background: #ffffff; }
        .border-gray { border: 1px solid #e5e7eb; }
      `}</style>

      {/* TOPNAV */}
      <nav className="sticky top-0 z-[300] h-[60px] bg-white border-b border-[#e5e7eb] px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-[10px] text-[18px] font-bold">
          <div className="w-[34px] h-[34px] bg-gradient-to-br from-[#2563eb] to-[#3b82f6] rounded-lg flex items-center justify-center text-white text-[16px]">📊</div>
          <div>Jobs<span className="text-[#2563eb]">Report</span></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 border border-[#e5e7eb] bg-white rounded-full px-3 py-1.5 text-[13px] font-medium text-[#6b7280] cursor-pointer"
            >
              🌐 <span className="uppercase">{String(currentLang)}</span>
            </button>
            {isLangDropdownOpen && (
              <div className="absolute top-[calc(100%+10px)] right-0 bg-white border border-[#e5e7eb] rounded-xl shadow-lg w-[160px] p-1.5 z-[400]">
                {['it', 'en', 'es', 'pl', 'tr', 'da'].map((l) => (
                  <div 
                    key={l} 
                    onClick={() => setLanguage(l)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-[13px] cursor-pointer hover:bg-[#f0f2f5] ${currentLang === l ? 'bg-[#eff6ff] text-[#2563eb] font-medium' : 'text-[#6b7280]'}`}
                  >
                    <span>{l === 'it' ? '🇮🇹' : l === 'en' ? '🇬🇧' : l === 'es' ? '🇪🇸' : l === 'pl' ? '🇵🇱' : l === 'tr' ? '🇹🇷' : '🇩🇰'}</span>
                    {l === 'it' ? 'Italiano' : l === 'en' ? 'English' : l === 'es' ? 'Español' : l === 'pl' ? 'Polski' : l === 'tr' ? 'Türkçe' : 'Dansk'}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <div className="text-[13px] font-semibold">Thomas Demo</div>
              <div className="text-[11px] text-[#9ca3af]">Admin</div>
            </div>
            <div className="w-[34px] h-[34px] bg-[#eff6ff] rounded-full flex items-center justify-center text-[15px]">👤</div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1">
        
        {/* SIDEBAR */}
        <aside className="w-[220px] bg-white border-r border-[#e5e7eb] py-6 sticky top-[60px] h-[calc(100vh-60px)] flex flex-col shrink-0">
          <div className="flex-1">
            {['clienti', 'personale', 'progetti', 'subappalti', 'rapportini', 'sommario', 'profilo', 'assistenza'].map((key) => {
              const sec = getSectionData(key);
              return (
                <SidebarItem 
                  key={key} 
                  id={key} 
                  icon={sec.icon} 
                  label={t(`presentation.sidebar.${key}`)} 
                />
              );
            })}
          </div>
          <div className="border-t border-[#e5e7eb] mt-3 pt-3">
            <div 
              onClick={() => window.open('https://www.jobs-report.com','_blank')}
              className="flex items-center gap-3 px-6 py-[10px] text-[14px] text-[#9ca3af] cursor-pointer hover:bg-[#f0f2f5] hover:text-[#1a1a2e]"
            >
              <span className="sidebar-icon w-5 text-center text-[16px]">↪️</span> {t('presentation.sidebar.esci')}
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className={`flex-1 p-[40px] px-[48px] transition-all duration-300 ${openPanelKey ? 'mr-[360px]' : ''}`}>
          
          <div className="flex flex-col gap-3 mb-8 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] p-6 px-8 rounded-2xl text-white shadow-sm">
            <div className="inline-block self-start bg-white/15 px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider">{t('presentation.hero.tag')}</div>
            <h2 className="text-[22px] font-bold leading-tight">{t('presentation.hero.title')}</h2>
            <p className="text-[14px] opacity-95 leading-relaxed">{t('presentation.hero.desc')}</p>
          </div>

          <div className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[#9ca3af] mb-3">{t('presentation.ui.key_features')}</div>
          
          <div className="flex flex-col gap-2">
            {['clienti', 'personale', 'progetti', 'subappalti', 'rapportini', 'sommario'].map((key) => {
              const sec = getSectionData(key);
              return (
                <div 
                  key={key}
                  onClick={() => setOpenPanelKey(key)}
                  className={`flex items-center gap-4 bg-white border border-[#e5e7eb] rounded-xl p-4 px-5 cursor-pointer shadow-sm transition-all hover:shadow-md hover:border-[#d1d5db] ${openPanelKey === key ? 'border-[#2563eb] ring-[3px] ring-[#2563eb]/10' : ''}`}
                >
                  <div className={`w-[44px] h-[44px] rounded-xl flex items-center justify-center text-[20px] shrink-0 text-white shadow-inner`} style={{ backgroundColor: sec.color }}>
                    {sec.icon as React.ReactNode}
                  </div>
                  <div className="flex-1">
                    <strong className="text-[13px] font-semibold tracking-[0.5px] uppercase">{t(`presentation.sections.${key}.title`)}</strong>
                    <p className="text-[12px] text-[#9ca3af] mt-0.5">{t(`presentation.sections.${key}.desc`)}</p>
                  </div>
                   <span className={`text-[#9ca3af] text-[18px] transition-transform ${openPanelKey === key ? 'rotate-90 text-[#2563eb]' : ''}`}>›</span>
                </div>
              );
            })}
          </div>
        </main>

        {/* DETAIL PANEL */}
        <aside className={`fixed top-[60px] right-0 w-[360px] h-[calc(100vh-60px)] bg-white border-l border-[#e5e7eb] shadow-lg flex flex-col transition-transform duration-300 z-[200] ${
          openPanelKey ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {openPanelKey && (
            <>
              <div className="p-6 px-6 pb-5 border-b border-[#e5e7eb] flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-[46px] h-[46px] rounded-xl flex items-center justify-center text-[22px] shrink-0 text-white" style={{ background: getSectionData(openPanelKey).color }}>
                    {getSectionData(openPanelKey).icon as React.ReactNode}
                  </div>
                  <div>
                    <div className="text-[16px] font-bold leading-tight">{t(`presentation.sections.${openPanelKey}.title`)}</div>
                    <div className="text-[12px] text-[#9ca3af] mt-0.5 leading-tight">{t(`presentation.sections.${openPanelKey}.desc`)}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setOpenPanelKey(null)}
                  className="w-[30px] h-[30px] bg-[#f0f2f5] text-[#9ca3af] hover:bg-[#e5e7eb] hover:text-[#1a1a2e] rounded-lg flex items-center justify-center transition-colors"
                >✕</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 px-6 space-y-6 scrollbar-thin">
                {(t(`presentation.sections.${openPanelKey}.groups`) as any || []).map((g: any, i: number) => (
                  <div key={i} className="space-y-2.5">
                    <div className="text-[11px] font-semibold tracking-[1.2px] uppercase text-[#9ca3af] mb-2.5">{g.title}</div>
                    {(g.items || []).map((it: any, j: number) => (
                      <div key={j} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: getSectionData(openPanelKey).color }}></div>
                        <p className="text-[13px] text-[#6b7280] leading-[1.5]">
                          <strong className="text-[#1a1a2e] font-medium">{it.name}</strong> — {it.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="p-4 px-6 border-t border-[#e5e7eb]">
                <button 
                  onClick={() => window.location.hash = '/richiesta-registrazione'}
                  className="w-full text-center bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium text-[14px] py-3 rounded-lg transition-all"
                >
                  {t('presentation.ui.request_demo')}
                </button>
              </div>
            </>
          )}
        </aside>

      </div>

      <footer className="bg-white border-t border-[#e5e7eb] text-center p-3.5 text-[12px] text-[#9ca3af]">
        © 2025 JobsReport · {t('presentation.ui.footer_rights')}
      </footer>

      {/* LANGUAGE OVERLAY */}
      {showLangOverlay && (
        <div className="fixed inset-0 z-[2000] bg-[#1a1a2e]/95 backdrop-blur-[8px] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[24px] text-center max-w-[500px] w-full shadow-lg animate-in slide-in-from-bottom-8 duration-500">
            <div className="text-[48px] mb-5">🌐</div>
            <h2 className="text-[24px] font-bold mb-2">{t('presentation.ui.overlay_title')}</h2>
            <p className="text-[#6b7280] text-[15px] mb-6 leading-tight">{t('presentation.ui.overlay_sub')}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'it', label: 'Italiano', flag: '🇮🇹' },
                { id: 'en', label: 'English', flag: '🇬🇧' },
                { id: 'es', label: 'Español', flag: '🇪🇸' },
                { id: 'pl', label: 'Polski', flag: '🇵🇱' },
                { id: 'tr', label: 'Türkçe', flag: '🇹🇷' },
                { id: 'da', label: 'Dansk', flag: '🇩🇰' }
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className="flex items-center justify-center gap-2 p-3 border border-[#e5e7eb] rounded-xl hover:border-[#2563eb] hover:bg-[#eff6ff] hover:text-[#2563eb] transition-all text-[15px] font-medium"
                >
                  <span>{lang.flag}</span> {lang.label}
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
