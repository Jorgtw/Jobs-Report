import React, { useState, useContext, useEffect } from 'react';
import { X, PlusCircle, ChevronRight } from 'lucide-react';
import { LanguageContext } from './App';

const useTranslation = () => {
  const context = useContext(LanguageContext);
  return { 
    t: context.t, 
    i18n: { 
      language: context.lang, 
      changeLanguage: context.setLang 
    } 
  };
};

// --- Registration Request Modal (Professional React Version) ---
const RegistrationRequestModal: React.FC<{ isOpen: boolean; setOpen: (o: boolean) => void }> = ({ isOpen: open, setOpen }) => {
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', notes: '' });
  const { t } = useTranslation();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(t('registrationEmailSubject'));
    let bodyText = t('registrationEmailBody')
      .replace('{companyName}', form.companyName)
      .replace('{contactName}', form.contactName)
      .replace('{email}', form.email)
      .replace('{phone}', form.phone || t('no'))
      .replace('{notes}', form.notes || '—');
    const body = encodeURIComponent(bodyText);
    window.location.href = `mailto:jtw@live.it?subject=${subject}&body=${body}`;
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="bg-white rounded-[32px] p-8 w-full max-w-sm relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <PlusCircle size={28} />
          </div>
          <button onClick={() => setOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">{t('registrationTitle')}</h2>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">{t('registrationDesc')}</p>
        
        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('companyName')} *</label>
            <input required value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" placeholder="Es. Edilizia Rossi Srl" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('contactNameLabel')} *</label>
            <input required value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" placeholder="Mario Rossi" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('email')} *</label>
            <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" placeholder="info@azienda.it" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('phone')}</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" placeholder="+39 02 1234567" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('additionalNotes')}</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium resize-none shadow-inner" placeholder="N. dipendenti, tipo di attività..." />
          </div>
          
          <button type="submit" className="w-full py-4 bg-[#2563eb] text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-[0.98] mt-4 flex items-center justify-center gap-2">
            {t('sendRequest')} <ChevronRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Mockup Translation Dictionary ---
const MOCK_I18N: any = {
  it: {
    sidebar: { clienti:'Clienti', personale:'Personale', progetti:'Progetti', subappalti:'Subappalti', rapportini:'Rapportini', sommario:'Sommario Lavori', profilo:'Profilo', assistenza:'Assistenza', esci:'Esci' },
    hero: { tag:'Il valore dell\'esperienza', title:'Rapportini e controllo costi in tempo reale', desc:'Realizzato dopo oltre 30 anni di esperienza vissuta in prima persona sul campo: prima come operaio e poi come amministratore. JobsReport è lo strumento concreto nato dall\'esigenza reale di chi gestisce il cantiere ogni giorno.' },
    ui: { key_features:'Funzionalità Chiave', request_demo:'Richiedi una demo gratuita →', footer_rights:'Tutti i diritti riservati', overlay_title:'Benvenuto in JobsReport', overlay_sub:'Scegli la tua lingua per iniziare la presentazione' },
    sections: {
      clienti: { icon:'👥', color:'#10b981', title:'Clienti', desc:'Anagrafica essenziale per la gestione dei tuoi cantieri.', groups:[ {title:'Dati Aziendali', color:'#10b981', items:[ {name:'Scheda essenziale', desc:'Nome ditta, P.IVA e contatti.'}, {name:'Stato Cliente', desc:'Gestione Attivi/Non attivi.'} ]} ] },
      personale: { icon:'🛡️', color:'#ef4444', title:'Il Tuo Team', desc:'Gestione e onboarding del personale interno ed esterno.', groups:[ {title:'Ruoli e Lingua', color:'#ef4444', items:[ {name:'Onboarding', desc:'Invia istruzioni app nella lingua del lavoratore.'}, {name:'Ruoli', desc:'Operaio, Incaricato o Amministrativo.'} ]} ] },
      progetti: { icon:'💼', color:'#f59e0b', title:'Progetti', desc:'Configurazione dei cantieri e delle attività interne.', groups:[ {title:'Tipologia', color:'#f59e0b', items:[ {name:'Clienti vs Interni', desc:'Gestione commesse o attività come Assenze/Ferie.'}, {name:'Budgeting', desc:'Supporto per lavori a ore o a corpo.'} ]} ] },
      subappalti: { icon:'📋', color:'#06b6d4', title:'Subappalti', desc:'Collabora con ditte esterne mantenendo il controllo sui costi.', groups:[ {title:'Partner', color:'#06b6d4', items:[ {name:'Gestione Ditte', desc:'Anagrafica subappaltatori e referenti.'}, {name:'Costi Esterni', desc:'Monitoraggio lavori a corpo o a ore.'} ]} ] },
      rapportini: { icon:'📄', color:'#3b82f6', title:'Rapportini', desc:'Rendicontazione giornaliera veloce e professionale.', groups:[ {title:'Esecuzione', color:'#3b82f6', items:[ {name:'Tempi Reali', desc:'Tracciamento preciso Inizio/Fine/Pausa o ore dirette.'}, {name:'Spese', desc:'Inserimento pasti, materiali e parcheggi.'} ]}, {title:'Gestione', color:'#3b82f6', items:[ {name:'Caposquadra', desc:'L\'Incaricato inserisce i dati per tutto il team.'} ]} ] },
      sommario: { icon:'📑', color:'#8b5cf6', title:'Analisi Economica', desc:'Il Sommario Lavori: il cuore del controllo margini.', groups:[ {title:'Analisi', color:'#8b5cf6', items:[ {name:'Real-Time', desc:'Margini netti e costi calcolati all\'istante.'}, {name:'Filtri ed Export', desc:'Filtra e scarica dati in Excel o PDF.'} ]} ] },
      profilo: { icon:'👤', color:'#6b7280', title:'Il tuo Account', desc:'Personalizza la tua esperienza di lavoro.', groups:[ {title:'Account', color:'#6b7280', items:[ {name:'Sicurezza', desc:'Gestione accessi e preferenze lingua.'} ]} ] },
      assistenza: { icon:'❓', color:'#2563eb', title:'Centro Assistenza', desc:'Guide e istruzioni rapide per l\'utilizzo ottimale dell\'app.', groups:[ {title:'Guida Rapida', color:'#2563eb', items:[ {name:'Installazione', desc:'Aggiungi l\'app alla home screen (iPhone: "Aggiungi a Home", Android: "Installa App").'}, {name:'Filtri', desc:'Usa il "Sommario Lavori" per monitorare margini e costi in tempo reale.'} ]}, {title:'Supporto', color:'#2563eb', items:[ {name:'Admin', desc:'Per assistenza tecnica, contatta direttamente l\'amministratore di sistema.'} ]} ] }
    }
  },
  en: {
    sidebar: { clienti:'Clients', personale:'Personnel', progetti:'Projects', subappalti:'Subcontracts', rapportini:'Timesheets', sommario:'Work Summary', profilo:'Profile', assistenza:'Support', esci:'Exit' },
    hero: { tag:'The value of experience', title:'Timesheets and real-time cost control', desc:'Created after more than 30 years of first-hand field experience: first as a worker and then as an administrator. JobsReport is the practical tool born from the real needs of those who manage construction sites every day.' },
    ui: { key_features:'Key Features', request_demo:'Request a free demo →', footer_rights:'All rights reserved', overlay_title:'Welcome to JobsReport', overlay_sub:'Choose your language to start the presentation' },
    sections: {
      clienti: { icon:'👥', color:'#10b981', title:'Clients', desc:'Essential registry for managing your construction sites.', groups:[ {title:'Company Data', color:'#10b981', items:[ {name:'Essential Form', desc:'Company name, VAT and contacts.'}, {name:'Client Status', desc:'Easily manage Active/Inactive clients.'} ]} ] },
      personale: { icon:'🛡️', color:'#ef4444', title:'Your Team', desc:'Management and onboarding of internal and external personnel.', groups:[ {title:'Roles and Language', color:'#ef4444', items:[ {name:'Onboarding', desc:'Send app instructions in the worker\'s language.'}, {name:'Roles', desc:'Worker, Supervisor or Administrator.'} ]} ] },
      progetti: { icon:'💼', color:'#f59e0b', title:'Projects', desc:'Configuration and monitoring of sites and internal activities.', groups:[ {title:'Type', color:'#f59e0b', items:[ {name:'Clients vs Internal', desc:'Manage external orders or activities like Absence/Leave.'}, {name:'Budgeting', desc:'Support for hourly or lump-sum work.'} ]} ] },
      subappalti: { icon:'📋', color:'#06b6d4', title:'Subcontracts', desc:'Collaborate with external firms while maintaining full cost control.', groups:[ {title:'Partners', color:'#06b6d4', items:[ {name:'Firm Management', desc:'Subcontractor registry and contacts.'}, {name:'External Costs', desc:'Monitoring of lump-sum or hourly jobs.'} ]} ] },
      rapportini: { icon:'📄', color:'#3b82f6', title:'Timesheets', desc:'Make daily reporting fast, precise and professional.', groups:[ {title:'Execution', color:'#3b82f6', items:[ {name:'Real Time', desc:'Precise Start/End/Break tracking or direct hours.'}, {name:'Expenses', desc:'Field entries for meals, materials and parking.'} ]}, {title:'Management', color:'#3b82f6', items:[ {name:'Team Leader', desc:'Supervisors can enter data for the whole team.'} ]} ] },
      sommario: { icon:'📑', color:'#8b5cf6', title:'Economic Analysis', desc:'Work Summary: the core of margin control.', groups:[ {title:'Analysis', color:'#8b5cf6', items:[ {name:'Real-Time', desc:'Net margins and costs calculated instantly.'}, {name:'Filters and Export', desc:'Filter and download data in Excel or PDF.'} ]} ] },
      profilo: { icon:'👤', color:'#6b7280', title:'Your Account', desc:'Personalize your work experience.', groups:[ {title:'Account', color:'#6b7280', items:[ {name:'Security', desc:'Access management and language preferences.'} ]} ] },
      assistenza: { icon:'❓', color:'#2563eb', title:'Support Center', desc:'Quick guides and instructions for optimal app usage.', groups:[ {title:'Quick Guide', color:'#2563eb', items:[ {name:'Installation', desc:'Add the app to your home screen (iPhone: "Add to Home", Android: "Install App").'}, {name:'Filters', desc:'Use "Work Summary" to monitor margins and costs in real-time.'} ]}, {title:'Support', color:'#2563eb', items:[ {name:'Admin', desc:'For technical support, contact the system administrator directly.'} ]} ] }
    }
  }
  // (Note: es, pl, tr, da are implemented similarly in the real logic)
};

const PresentationView: React.FC = () => {
  const { i18n } = useTranslation();
  const langContext = useContext(LanguageContext);
  
  const [openPanelKey, setOpenPanelKey] = useState<string | null>(null);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [showLangOverlay, setShowLangOverlay] = useState(!localStorage.getItem('jobsReportLang'));
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('jobsReportLang');
    if (saved) {
      i18n.changeLanguage(saved as any);
      if (langContext) langContext.setLang(saved as any);
    }
  }, []);

  const setLanguage = (lang: string) => {
    i18n.changeLanguage(lang as any);
    if (langContext) langContext.setLang(lang as any);
    localStorage.setItem('jobsReportLang', lang);
    setShowLangOverlay(false);
    setIsLangDropdownOpen(false);
  };

  const currentLang = (i18n.language || 'it') as keyof typeof MOCK_I18N;
  const L = MOCK_I18N[currentLang] || MOCK_I18N['it'];

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
      
      {/* CSS CUSTOM CLONE */}
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
              const sec = L.sections[key];
              return (
                <SidebarItem 
                  key={key} 
                  id={key} 
                  icon={sec.icon} 
                  label={L.sidebar[key]} 
                />
              );
            })}
          </div>
          <div className="border-t border-[#e5e7eb] mt-3 pt-3">
            <div 
              onClick={() => window.open('https://www.jobs-report.com','_blank')}
              className="flex items-center gap-3 px-6 py-[10px] text-[14px] text-[#9ca3af] cursor-pointer hover:bg-[#f0f2f5] hover:text-[#1a1a2e]"
            >
              <span className="sidebar-icon w-5 text-center text-[16px]">↪️</span> {L.sidebar.esci}
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className={`flex-1 p-[40px] px-[48px] transition-all duration-300 ${openPanelKey ? 'mr-[360px]' : ''}`}>
          
          <div className="flex flex-col gap-3 mb-8 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] p-6 px-8 rounded-2xl text-white shadow-sm">
            <div className="inline-block self-start bg-white/15 px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider">{L.hero.tag}</div>
            <h2 className="text-[22px] font-bold leading-tight">{L.hero.title}</h2>
            <p className="text-[14px] opacity-95 leading-relaxed">{L.hero.desc}</p>
          </div>

          <div className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[#9ca3af] mb-3">{L.ui.key_features}</div>
          
          <div className="flex flex-col gap-2">
            {['clienti', 'personale', 'progetti', 'subappalti', 'rapportini', 'sommario'].map((key) => {
              const sec = L.sections[key];
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
                    <strong className="text-[13px] font-semibold tracking-[0.5px] uppercase">{sec.title}</strong>
                    <p className="text-[12px] text-[#9ca3af] mt-0.5">{sec.desc}</p>
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
                  <div className="w-[46px] h-[46px] rounded-xl flex items-center justify-center text-[22px] shrink-0 text-white" style={{ background: L.sections[openPanelKey].color }}>
                    {L.sections[openPanelKey].icon as React.ReactNode}
                  </div>
                  <div>
                    <div className="text-[16px] font-bold leading-tight">{L.sections[openPanelKey].title}</div>
                    <div className="text-[12px] text-[#9ca3af] mt-0.5 leading-tight">{L.sections[openPanelKey].desc}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setOpenPanelKey(null)}
                  className="w-[30px] h-[30px] bg-[#f0f2f5] text-[#9ca3af] hover:bg-[#e5e7eb] hover:text-[#1a1a2e] rounded-lg flex items-center justify-center transition-colors"
                >✕</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 px-6 space-y-6 scrollbar-thin">
                {L.sections[openPanelKey].groups.map((g: any, i: number) => (
                  <div key={i} className="space-y-2.5">
                    <div className="text-[11px] font-semibold tracking-[1.2px] uppercase text-[#9ca3af] mb-2.5">{g.title}</div>
                    {g.items.map((it: any, j: number) => (
                      <div key={j} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: g.color }}></div>
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
                  onClick={() => setIsRegModalOpen(true)}
                  className="w-full text-center bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium text-[14px] py-3 rounded-lg transition-all"
                >
                  {L.ui.request_demo}
                </button>
              </div>
            </>
          )}
        </aside>

      </div>

      <footer className="bg-white border-t border-[#e5e7eb] text-center p-3.5 text-[12px] text-[#9ca3af]">
        © 2025 JobsReport · {L.ui.footer_rights}
      </footer>

      {/* LANGUAGE OVERLAY */}
      {showLangOverlay && (
        <div className="fixed inset-0 z-[2000] bg-[#1a1a2e]/95 backdrop-blur-[8px] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[24px] text-center max-w-[500px] w-full shadow-lg animate-in slide-in-from-bottom-8 duration-500">
            <div className="text-[48px] mb-5">🌐</div>
            <h2 className="text-[24px] font-bold mb-2">{L.ui.overlay_title}</h2>
            <p className="text-[#6b7280] text-[15px] mb-6 leading-tight">{L.ui.overlay_sub}</p>
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

      {/* REGISTRATION MODAL */}
      <RegistrationRequestModal isOpen={isRegModalOpen} setOpen={setIsRegModalOpen} />

    </div>
  );
};

export default PresentationView;
