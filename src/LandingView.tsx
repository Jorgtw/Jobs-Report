import React, { useState, useContext, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { LanguageContext } from './App';
import { db } from './services/dbService';
import logoImg from './assets/logo.png';

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

// --- Login Modal (Auth logic from App.tsx) ---
const LoginModal: React.FC<{ isOpen: boolean; setOpen: (o: boolean) => void; onLogin: (u: any) => void }> = ({ isOpen, setOpen, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await db.loginUser(username, password);
      if (!user) {
        setError(t('invalidCredentials' as any));
        return;
      }
      if (user.status === 'inactive') {
        setError(t('accountDisabled' as any));
        return;
      }
      onLogin(user);
    } catch (err: any) {
      setError(err?.message || 'Errore di connessione');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="bg-white rounded-[32px] p-8 w-full max-w-md relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <img src={logoImg} alt="Logo" className="w-20 h-20 object-contain mb-4" />
          <h2 className="text-2xl font-black text-slate-900">Accedi a Jobs<span className="text-blue-600">Report</span></h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('username' as any)}</label>
            <input required value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('password' as any)}</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg border border-red-100">{error}</p>}
          
          <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 mt-2">
            {t('loginBtn' as any)}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Registration Modal ---
const RegistrationRequestModal: React.FC<{ isOpen: boolean; setOpen: (o: boolean) => void }> = ({ isOpen: open, setOpen }) => {
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', notes: '' });
  const { t } = useTranslation();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(t('registrationEmailSubject' as any));
    let bodyText = t('registrationEmailBody' as any)
      .replace('{companyName}', form.companyName)
      .replace('{contactName}', form.contactName)
      .replace('{email}', form.email)
      .replace('{phone}', form.phone || t('no' as any))
      .replace('{notes}', form.notes || '—');
    const body = encodeURIComponent(bodyText);
    window.location.href = `mailto:jtw@live.it?subject=${subject}&body=${body}`;
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="bg-white rounded-[32px] p-8 w-full max-w-sm relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-black text-slate-900 mb-6">{t('registrationTitle' as any)}</h2>
        <form onSubmit={handleSend} className="space-y-4">
            {/* Same form as PresentationView */}
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('companyName' as any)} *</label>
                <input required value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('contactNameLabel' as any)} *</label>
                <input required value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('email' as any)} *</label>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
            </div>
            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl mt-4">
                {t('sendRequest' as any)}
            </button>
        </form>
      </div>
    </div>
  );
};

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
};

const LandingView: React.FC<{ onLogin: (u: any) => void }> = ({ onLogin }) => {
  const { i18n } = useTranslation();
  const langContext = useContext(LanguageContext);
  
  const [openPanelKey, setOpenPanelKey] = useState<string | null>(null);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
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

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f2f5] font-['Inter',sans-serif] text-[#1a1a2e]">
      {/* 
        This mirrors PresentationView.tsx 1:1 in styles, 
        but replaces the User Info with a Login Button 
      */}
      <nav className="sticky top-0 z-[300] h-[60px] bg-white border-b border-[#e5e7eb] px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-[10px] text-[18px] font-bold">
          <div className="w-[34px] h-[34px] bg-gradient-to-br from-[#2563eb] to-[#3b82f6] rounded-lg flex items-center justify-center text-white text-[16px]">📊</div>
          <div>Jobs<span className="text-[#2563eb]">Report</span></div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsLoginModalOpen(true)} className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95">
            Accedi
          </button>
          <div className="relative">
            <button onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)} className="flex items-center gap-1.5 border border-[#e5e7eb] bg-white rounded-full px-3 py-1.5 text-[13px] font-medium text-[#6b7280]">
              🌐 <span className="uppercase">{String(currentLang)}</span>
            </button>
            {isLangDropdownOpen && (
              <div className="absolute top-[calc(100%+10px)] right-0 bg-white border border-[#e5e7eb] rounded-xl shadow-lg w-[160px] p-1.5 z-[400]">
                {['it', 'en', 'es', 'pl', 'tr', 'da'].map((l) => (
                  <div key={l} onClick={() => setLanguage(l)} className={`flex items-center gap-2 p-2 rounded-lg text-[13px] hover:bg-[#f0f2f5] ${currentLang === l ? 'bg-[#eff6ff] text-[#2563eb] font-medium' : 'text-[#6b7280]'}`}>
                    <span>{l === 'it' ? '🇮🇹' : l === 'en' ? '🇬🇧' : l === 'es' ? '🇪🇸' : l === 'pl' ? '🇵🇱' : l === 'tr' ? '🇹🇷' : '🇩🇰'}</span>
                    {l === 'it' ? 'Italiano' : l === 'en' ? 'English' : l === 'es' ? 'Español' : l === 'pl' ? 'Polski' : l === 'tr' ? 'Türkçe' : 'Dansk'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="flex flex-1">
        <aside className="w-[220px] bg-white border-r border-[#e5e7eb] py-6 sticky top-[60px] h-[calc(100vh-60px)] flex flex-col shrink-0">
          <div className="flex-1">
            {['clienti', 'personale', 'progetti', 'subappalti', 'rapportini', 'sommario', 'profilo', 'assistenza'].map((key) => {
              const sec = L.sections[key];
              return (
                <div key={key} onClick={() => setOpenPanelKey(key)} className={`flex items-center gap-3 px-6 py-[10px] text-[14px] cursor-pointer transition-all border-r-2 ${openPanelKey === key ? 'text-[#2563eb] font-semibold bg-[#eff6ff] border-[#2563eb]' : 'text-[#6b7280] hover:bg-[#f0f2f5] border-transparent'}`}>
                  <span className="w-5 text-center text-[16px]">{sec.icon as React.ReactNode}</span> {L.sidebar[key]}
                </div>
              );
            })}
          </div>
        </aside>

        <main className={`flex-1 p-[40px] px-[48px] transition-all duration-300 ${openPanelKey ? 'mr-[360px]' : ''}`}>
          <div className="flex flex-col gap-3 mb-8 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] p-6 px-8 rounded-2xl text-white shadow-sm">
            <div className="bg-white/15 px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider self-start">{L.hero.tag}</div>
            <h2 className="text-[22px] font-bold leading-tight">{L.hero.title}</h2>
            <p className="text-[14px] opacity-95 leading-relaxed">{L.hero.desc}</p>
          </div>
          <div className="flex flex-col gap-2">
            {['clienti', 'personale', 'progetti', 'subappalti', 'rapportini', 'sommario'].map((key) => {
              const sec = L.sections[key];
              return (
                <div key={key} onClick={() => setOpenPanelKey(key)} className={`flex items-center gap-4 bg-white border border-[#e5e7eb] rounded-xl p-4 px-5 cursor-pointer shadow-sm transition-all hover:shadow-md ${openPanelKey === key ? 'border-[#2563eb]' : ''}`}>
                  <div className={`w-[44px] h-[44px] rounded-xl flex items-center justify-center text-[20px] shrink-0 text-white shadow-inner`} style={{ backgroundColor: sec.color }}>{sec.icon as React.ReactNode}</div>
                  <div className="flex-1">
                    <strong className="text-[13px] font-semibold tracking-[0.5px] uppercase">{sec.title}</strong>
                    <p className="text-[12px] text-[#9ca3af] mt-0.5">{sec.desc}</p>
                  </div>
                  <span className={`text-[#9ca3af] text-[18px] ${openPanelKey === key ? 'rotate-90 text-[#2563eb]' : ''}`}>›</span>
                </div>
              );
            })}
          </div>
        </main>

        <aside className={`fixed top-[60px] right-0 w-[360px] h-[calc(100vh-60px)] bg-white border-l border-[#e5e7eb] shadow-lg flex flex-col transition-transform duration-300 z-[200] ${openPanelKey ? 'translate-x-0' : 'translate-x-full'}`}>
          {openPanelKey && (
            <>
              <div className="p-6 border-b flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-[46px] h-[46px] rounded-xl flex items-center justify-center text-[22px] text-white" style={{ background: L.sections[openPanelKey].color }}>{L.sections[openPanelKey].icon as React.ReactNode}</div>
                  <div>
                    <div className="text-[16px] font-bold">{L.sections[openPanelKey].title}</div>
                    <div className="text-[12px] text-[#9ca3af]">{L.sections[openPanelKey].desc}</div>
                  </div>
                </div>
                <button onClick={() => setOpenPanelKey(null)} className="w-[30px] h-[30px] bg-[#f0f2f5] text-[#9ca3af] rounded-lg flex items-center justify-center">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {L.sections[openPanelKey].groups.map((g: any, i: number) => (
                  <div key={i} className="space-y-2.5">
                    <div className="text-[11px] font-semibold uppercase text-[#9ca3af]">{g.title}</div>
                    {g.items.map((it: any, j: number) => (
                      <div key={j} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: g.color }}></div>
                        <p className="text-[13px] text-[#6b7280] leading-[1.5]"><strong className="text-[#1a1a2e]">{it.name}</strong> — {it.desc}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="p-6 border-t">
                <button onClick={() => setIsRegModalOpen(true)} className="w-full bg-[#2563eb] text-white font-medium text-[14px] py-3 rounded-lg">{L.ui.request_demo}</button>
              </div>
            </>
          )}
        </aside>
      </div>

      <footer className="bg-white border-t border-[#e5e7eb] text-center p-4 text-[12px] text-[#9ca3af]">© 2025 JobsReport · {L.ui.footer_rights}</footer>

      {showLangOverlay && (
        <div className="fixed inset-0 z-[2000] bg-[#1a1a2e]/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-[24px] text-center max-w-[500px] w-full shadow-lg">
            <h2 className="text-[24px] font-bold mb-2">{L.ui.overlay_title}</h2>
            <p className="text-[#6b7280] mb-6">{L.ui.overlay_sub}</p>
            <div className="grid grid-cols-2 gap-3">
              {['it', 'en', 'es', 'pl', 'tr', 'da'].map((l) => (
                <button key={l} onClick={() => setLanguage(l)} className="p-3 border rounded-xl hover:border-blue-600 hover:bg-blue-50">
                  {l === 'it' ? '🇮🇹 Italiano' : l === 'en' ? '🇬🇧 English' : l === 'es' ? '🇪🇸 Español' : l === 'pl' ? '🇵🇱 Polski' : l === 'tr' ? '🇹🇷 Türkçe' : '🇩🇰 Dansk'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <RegistrationRequestModal isOpen={isRegModalOpen} setOpen={setIsRegModalOpen} />
      <LoginModal isOpen={isLoginModalOpen} setOpen={setIsLoginModalOpen} onLogin={onLogin} />
    </div>
  );
};

export default LandingView;
