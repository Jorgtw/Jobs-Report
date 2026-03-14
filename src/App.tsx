import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import {
  FileText,
  Users,
  Briefcase,
  LogOut,
  Plus,
  Trash2,
  Pencil,
  Clock,
  Menu,
  X,
  User as UserIcon,
  Globe,
  Building2,
  FileDown,
  FileSpreadsheet,
  ClipboardList,
  ShieldAlert,
  Eye,
  EyeOff,
  ChevronRight,
  Download,
  Copy,
  Search,
  Filter,
  Mail,
  HelpCircle,
  Smartphone,
  Apple,
  Chrome,
  PlusCircle,
  LayoutDashboard,
} from 'lucide-react';
import { db } from './services/dbService';
import { User, Role, UserStatus, Client, Project, WorkReport, Subcontractor, AdditionalWorker, Expense } from './types';
import { translations, Language } from './translations';
import { exportToPDF, exportToExcel } from './services/exportService';
import logoImg from './assets/logo.png';
import PresentationView from './PresentationView';

// --- i18n Context ---
export const LanguageContext = createContext<{
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: keyof typeof translations['it']) => string;
}>({
  lang: 'it',
  setLang: () => { },
  t: (key) => key as string,
});

const useTranslation = () => useContext(LanguageContext);

export const localeMap: Record<string, string> = {
  it: 'it-IT',
  en: 'en-US',
  es: 'es-ES',
  pl: 'pl-PL',
  tr: 'tr-TR',
  da: 'da-DK'
};

// --- Shared Styles ---
const inputClasses = "flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 shadow-sm text-sm disabled:bg-slate-50";
const filterInputClasses = "flex-1 px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 shadow-sm text-xs disabled:bg-slate-50";
const modalClasses = "bg-white rounded-2xl p-4 w-full max-w-4xl relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[95vh]";

const FullWidthField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = "" }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{label}:</label>
    {children}
  </div>
);

// --- Navigation Config ---
const getNavLinks = (t: any, isSuperAdmin: boolean = false) => {
  const links = [
    { name: t('clients'), path: '/clients', icon: Users, roles: ['admin'], color: 'bg-emerald-500' },
    { name: t('personnel'), path: '/personnel', icon: ShieldAlert, roles: ['admin'], color: 'bg-rose-500' },
    { name: t('projects'), path: '/projects', icon: Briefcase, roles: ['admin'], color: 'bg-amber-500' },
    { name: t('subcontractors'), path: '/subcontractors', icon: Building2, roles: ['admin'], color: 'bg-cyan-500' },
    { name: t('reports'), path: '/reports', icon: FileText, roles: ['admin', 'operator', 'supervisor'], color: 'bg-blue-500' },
    { name: t('workSummary'), path: '/work-summary', icon: ClipboardList, roles: ['admin'], color: 'bg-indigo-500' },
    { name: t('profile'), path: '/profile', icon: UserIcon, roles: ['admin', 'operator', 'supervisor'], color: 'bg-slate-600' },
    { name: t('help'), path: '/help', icon: HelpCircle, roles: ['admin', 'operator', 'supervisor'], color: 'bg-blue-600' }
  ];

  if (isSuperAdmin) {
    return [
      { name: t('companiesManagement'), path: '/companies', icon: Building2, roles: ['admin', 'operator', 'supervisor'], color: 'bg-purple-600' },
      { name: t('profile'), path: '/profile', icon: UserIcon, roles: ['admin', 'operator', 'supervisor'], color: 'bg-slate-600' }
    ];
  }
  return links;
};

// --- Language Selector ---
const LanguageSelector: React.FC = () => {
  const { lang, setLang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const languages: { code: Language; label: string }[] = [
    { code: 'it', label: 'IT' }, { code: 'en', label: 'EN' }, { code: 'es', label: 'ES' },
    { code: 'pl', label: 'PL' }, { code: 'tr', label: 'TR' }, { code: 'da', label: 'DA' },
  ];
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm">
        <Globe className="w-3.5 h-3.5 text-blue-600" />
        <span className="uppercase">{lang}</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
          {languages.map((l) => (
            <button key={l.code} onClick={() => { setLang(l.code); setIsOpen(false); }} className={`flex w-full items-center px-4 py-2.5 text-xs text-left hover:bg-blue-50 ${lang === l.code ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'}`}>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- PWA Install Hook ---
const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  return { isInstallable, install };
};

const InstallButton: React.FC<{ variant?: 'sidebar' | 'login' }> = ({ variant = 'login' }) => {
  const { isInstallable, install } = usePWAInstall();
  const { t } = useTranslation();

  if (!isInstallable) return null;

  if (variant === 'sidebar') {
    return (
      <button onClick={install} className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-blue-600 hover:bg-blue-50 transition-all font-bold mt-2 border border-blue-100">
        <Download className="w-5 h-5" />
        <span>{t('installApp')}</span>
      </button>
    );
  }

  return (
    <button onClick={install} className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all text-sm mb-4">
      <Download className="w-4 h-4" />
      {t('installApp')}
    </button>
  );
};

// --- Layout ---
const AppLayout: React.FC<{ user: User, isSuperAdmin: boolean, onLogout: () => void, children: React.ReactNode }> = ({ user, isSuperAdmin, onLogout, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const navLinks = getNavLinks(t, isSuperAdmin);
  const filteredLinks = navLinks.filter(link => isSuperAdmin ? true : link.roles.includes(user.role));

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex flex-col h-full py-6">
      <div className="px-6 mb-8 flex items-center gap-2">
        <Link to="/" onClick={onItemClick} className="flex items-center gap-2">
          <img src={logoImg} alt="Jobs Report" className="w-10 h-10 object-contain" />
          <span className="font-extrabold text-xl text-slate-900 tracking-tight">Jobs<span className="text-blue-600">Report</span></span>
        </Link>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {filteredLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            onClick={onItemClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${location.pathname === link.path ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <link.icon className={`w-5 h-5 ${location.pathname === link.path ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
            <span>{link.name}</span>
          </Link>
        ))}
      </nav>
      <div className="px-3 pt-6 border-t border-slate-100">
        <button onClick={onLogout} className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t('logout')}</span>
        </button>
        <InstallButton variant="sidebar" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden lg:block w-64 bg-white border-r border-slate-200 sticky top-0 h-screen"><SidebarContent /></aside>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
      <div className={`fixed inset-y-0 left-0 w-72 bg-white shadow-2xl transform transition-transform duration-300 z-[70] lg:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent onItemClick={() => setIsMobileMenuOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"><Menu className="w-6 h-6" /></button>
            <h2 className="text-sm font-semibold text-slate-500 hidden sm:block uppercase tracking-wider">
              {filteredLinks.find(l => l.path === location.pathname)?.name || (location.pathname === '/' ? t('welcome') : '')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">{user.name}</p>
                <p className="text-xs text-slate-500 mt-1 capitalize">{t(user.role as any)}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 ring-4 ring-white shadow-sm"><UserIcon className="w-5 h-5" /></div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};

// --- Home View (Launcher) ---
const HomeView: React.FC<{ user: User, isSuperAdmin: boolean }> = ({ user, isSuperAdmin }) => {
  const { t } = useTranslation();
  const links = getNavLinks(t, isSuperAdmin).filter(l => isSuperAdmin ? true : l.roles.includes(user.role));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="text-left">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {t('welcome')}, {user.name}
        </h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{t('activityManagement')}</p>
      </div>

      <div className="flex flex-col gap-2 max-w-2xl mx-auto">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 group flex items-center gap-4 text-left"
          >
            <div className={`${link.color} w-10 h-10 rounded-lg text-white shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shrink-0`}>
              <link.icon size={20} strokeWidth={2} />
            </div>
            <span className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors uppercase tracking-tight flex-1">{link.name}</span>
            <ChevronRight className="text-slate-300 group-hover:text-blue-500 w-5 h-5 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
};

// --- Work Summary View ---
const WorkSummaryView: React.FC<{ user: User }> = ({ user }) => {
  const { lang, t } = useTranslation();
  const [summary, setSummary] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [subcontractors, setSubcontractors] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [s, c, p, w, sub] = await Promise.all([
        db.getSummary(),
        db.getClients(),
        db.getProjects(),
        db.getUsers(),
        db.getSubcontractors(),
      ]);
      setSummary(s);
      setClients(c);
      setProjects(p);
      setUsers(w);
      setSubcontractors(sub);
    };
    load();
  }, []);

  const [filters, setFilters] = useState({
    clientId: '',
    projectId: '',
    userId: '',
    subcontractorId: '',
    dateFrom: '',
    dateTo: ''
  });

  const [adminStatus, setAdminStatus] = useState<'Tutti' | 'Fatturato' | 'Pagato' | 'Pending'>('Tutti');

  const filteredData = useMemo(() => {
    return summary.filter(s => {
      const dateMatch = (!filters.dateFrom || s.date >= filters.dateFrom) &&
        (!filters.dateTo || s.date <= filters.dateTo);
      const clientMatch = !filters.clientId || projects.find(p => p.id === s.projectId)?.clientId === filters.clientId;
      const projectMatch = !filters.projectId || s.projectId === filters.projectId;
      const userMatch = !filters.userId || s.userId === filters.userId;
      const subMatch = !filters.subcontractorId || s.subcontractorId === filters.subcontractorId;
      const adminMatch = adminStatus === 'Tutti' || (s.invoiceStatus || 'Pending') === adminStatus;
      return dateMatch && clientMatch && projectMatch && userMatch && subMatch && adminMatch;
    });
  }, [summary, filters, projects, adminStatus]);

  const totals = useMemo(() => {
    const baseTotals = filteredData.reduce((acc, s) => {
      return {
        hours: acc.hours + s.totalHours,
        personnelCost: acc.personnelCost + (s.subcontractorId ? 0 : s.cost),
        subcontractCost: acc.subcontractCost + (s.subcontractorId ? s.cost : 0),
        totalExpenses: acc.totalExpenses + (s.totalExpenses || 0),
        totalCost: acc.totalCost + s.cost + (s.totalExpenses || 0),
        revenue: acc.revenue + (s.revenue || 0)
      };
    }, { hours: 0, personnelCost: 0, subcontractCost: 0, totalExpenses: 0, totalCost: 0, revenue: 0 });
    return { ...baseTotals, margin: baseTotals.revenue - baseTotals.totalCost };
  }, [filteredData]);

  const groupedByProject = useMemo(() => {
    const map = new Map();
    filteredData.forEach(s => {
      const key = s.projectId;
      if (!map.has(key)) map.set(key, {
        id: key,
        name: s.projectName,
        clientName: s.clientName,
        hours: 0,
        totalCost: 0,
        totalExpenses: 0,
        revenue: 0,
        dates: new Set<string>()
      });
      const proj = map.get(key);
      
      proj.hours += s.totalHours;
      proj.totalCost += s.cost;
      proj.totalExpenses += (s.totalExpenses || 0);
      proj.revenue += (s.revenue || 0);
      proj.dates.add(s.date);
      if (s.isInternal) proj.isInternal = true;
    });
    return Array.from(map.values()).map(p => ({
      ...p,
      margin: p.revenue - p.totalCost - p.totalExpenses,
      dateDisplay: p.dates.size === 1 ? Array.from(p.dates)[0] : 'Periodo'
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredData]);

  const formatCurrency = (val: number) => val.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleExportPDF = () => {
    const rows = filteredData.map(s => {
      const [y, m, d] = (s.date || '').split('-');
      const formattedDate = y && m && d ? `${d}/${m}/${y.substring(2)}` : s.date;
      return {
        date: formattedDate,
        projectName: s.projectName,
        clientName: s.clientName,
        workerName: s.userName,
        description: s.description || '',
        hours: s.totalHours,
        hourlyCost: s.hourlyCost || 0,
        cost: s.cost || 0,
        expenses: s.totalExpenses || 0,
        hourlyRevenue: s.hourlyRevenue || 0,
        revenue: s.revenue || 0,
        paid: s.invoiceStatus === 'Pending' ? t('statusPending') : (s.invoiceStatus === 'Fatturato' ? t('statusInvoiced') : (s.invoiceStatus === 'Pagato' ? t('statusPaid') : (s.invoiceStatus || t('statusPending'))))
      };
    });
    exportToPDF(rows, lang, user.name);
  };

  const handleExportExcel = () => {
    const rows = filteredData.map(s => {
      const [y, m, d] = (s.date || '').split('-');
      const formattedDate = y && m && d ? `${d}/${m}/${y.substring(2)}` : s.date;
      const subName = s.subcontractorId ? subcontractors.find(sub => sub.id === s.subcontractorId)?.name : '';
      return {
        date: formattedDate,
        projectName: s.projectName,
        clientName: s.clientName,
        workerName: s.userName,
        subcontractorName: subName,
        description: s.description || '',
        hours: s.totalHours,
        hourlyCost: s.hourlyCost || 0,
        cost: s.cost || 0,
        expenses: s.totalExpenses || 0,
        hourlyRevenue: s.hourlyRevenue || 0,
        revenue: s.revenue || 0,
        paid: s.invoiceStatus === 'Pending' ? t('statusPending') : (s.invoiceStatus === 'Fatturato' ? t('statusInvoiced') : (s.invoiceStatus === 'Pagato' ? t('statusPaid') : (s.invoiceStatus || t('statusPending'))))
      };
    });
    exportToExcel(rows, lang);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{t('workSummary')}</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
          <button onClick={handleExportExcel} className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-all">
            <FileSpreadsheet size={16} className="mr-2" /> {t('exportExcelBtn')}
          </button>
          <button onClick={handleExportPDF} className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all">
            <FileDown size={16} className="mr-2" /> {t('exportPDFBtn')}
          </button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Menu size={12} /> {t('filtersAndData')}
          </h3>
          <button onClick={() => setFilters({ clientId: '', projectId: '', userId: '', subcontractorId: '', dateFrom: '', dateTo: '' })} className="text-[9px] items-center font-extrabold px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md hover:bg-slate-100 transition-colors uppercase">
            {t('clearFilters')}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('client')}</label>
            <select value={filters.clientId} onChange={e => setFilters({ ...filters, clientId: e.target.value })} className={filterInputClasses}>
              <option value="">{t('allClients')}</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('project')}</label>
            <select value={filters.projectId} onChange={e => setFilters({ ...filters, projectId: e.target.value })} className={filterInputClasses}>
              <option value="">{t('allProjects')}</option>
              {projects.filter(p => !filters.clientId || p.clientId === filters.clientId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('workerLabel')}</label>
            <select value={filters.userId} onChange={e => setFilters({ ...filters, userId: e.target.value })} className={filterInputClasses}>
              <option value="">{t('allWorkers')}</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('summarySubcontractorCompany')}</label>
            <select value={filters.subcontractorId} onChange={e => setFilters({ ...filters, subcontractorId: e.target.value })} className={filterInputClasses}>
              <option value="">{t('summaryAllCompanies')}</option>
              {subcontractors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('dateFrom')}</label>
            <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} className={filterInputClasses} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('dateTo')}</label>
            <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} className={filterInputClasses} />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-tight shrink-0">{t('adminStatusTitle')}</label>
            <div className="flex bg-slate-50 p-0.5 rounded-lg w-full sm:w-auto border border-slate-100">
              <button onClick={() => setAdminStatus('Tutti')} className={`flex-1 sm:flex-none px-3 py-1 text-[9px] font-black rounded-md transition-all ${adminStatus === 'Tutti' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{t('statusAll')}</button>
              <button onClick={() => setAdminStatus('Fatturato')} className={`flex-1 sm:flex-none px-3 py-1 text-[9px] font-black rounded-md transition-all ${adminStatus === 'Fatturato' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{t('statusInvoiced')}</button>
              <button onClick={() => setAdminStatus('Pagato')} className={`flex-1 sm:flex-none px-3 py-1 text-[9px] font-black rounded-md transition-all ${adminStatus === 'Pagato' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{t('statusPaid')}</button>
              <button onClick={() => setAdminStatus('Pending')} className={`flex-1 sm:flex-none px-3 py-1 text-[9px] font-black rounded-md transition-all ${adminStatus === 'Pending' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{t('statusPending')}</button>
            </div>
          </div>
          
          <div className="flex-shrink-0 w-full sm:w-auto sm:ml-auto">
            <select
              title="Aggiorna stato dei risultati filtrati"
              onChange={async (e) => {
                const val = e.target.value;
                if (!val) return;
                const confirmMsg = t('confirmUpdateStatus').replace('{count}', filteredData.length.toString()).replace('{status}', val === 'Pending' ? t('statusPending') : val === 'Fatturato' ? t('statusInvoiced') : t('statusPaid'));
                if (!window.confirm(confirmMsg)) {
                  e.target.value = '';
                  return;
                }
                try {
                  const ids = Array.from(new Set(filteredData.map(s => s.id.split('_')[0])));
                  await db.bulkUpdateInvoiceStatus(ids, val);
                  const newData = await db.getSummary();
                  setSummary(newData);
                } catch (err: any) {
                  alert(t('updateError') + err.message);
                }
                e.target.value = '';
              }}
              className="w-full sm:w-auto px-4 py-1.5 bg-white border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-lg shadow-sm hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
            >
              <option value="">{t('update')} {t('statusLabel')} ({filteredData.length})</option>
              <option value="Pending">{t('statusPending')}</option>
              <option value="Fatturato">{t('statusInvoiced')}</option>
              <option value="Pagato">{t('statusPaid')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 flex flex-wrap lg:flex-nowrap justify-between items-center p-4 gap-6 shadow-sm">
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('summaryHoursWorked')}</span>
          <span className="text-sm font-medium text-slate-600">{totals.hours.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h</span>
        </div>
        <div className="hidden lg:block w-px h-10 bg-slate-100"></div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('summaryPersonnelCost')}</span>
          <span className="text-sm font-medium text-slate-600">{formatCurrency(totals.personnelCost)}</span>
        </div>
        <div className="hidden lg:block w-px h-10 bg-slate-100"></div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('summarySubcontractCost')}</span>
          <span className="text-sm font-medium text-slate-600">{formatCurrency(totals.subcontractCost)}</span>
        </div>
        <div className="hidden lg:block w-px h-10 bg-slate-100"></div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest">{t('totalExpenses')}</span>
          <span className="text-sm font-medium text-amber-700/80">{formatCurrency(totals.totalExpenses)}</span>
        </div>
        <div className="hidden lg:block w-px h-10 bg-slate-100"></div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest">{t('summaryTotalGeneral')}</span>
          <span className="text-sm font-medium text-blue-700/80">{formatCurrency(totals.totalCost)}</span>
        </div>
        <div className="hidden lg:block w-px h-10 bg-slate-100"></div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{t('totalRevenue')}</span>
          <span className="text-base font-semibold text-indigo-600">{formatCurrency(totals.revenue)}</span>
        </div>
        <div className="hidden lg:block w-px h-10 bg-slate-100"></div>
        <div className="flex flex-col flex-1">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${totals.margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{t('margin')}</span>
          <span className={`text-xl font-bold ${totals.margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(totals.margin)}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3 border-b border-slate-100 bg-slate-50">
          <h2 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{t('summaryProjectSummary')}</h2>
        </div>

        {/* Mobile View: Card Layout */}
        <div className="md:hidden divide-y divide-slate-100">
          {groupedByProject.length > 0 ? groupedByProject.map((p, idx) => (
            <div key={idx} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-blue-600 capitalize">
                    {p.dateDisplay !== 'Periodo'
                      ? new Intl.DateTimeFormat(localeMap[lang as string] || 'it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(p.dateDisplay as string))
                      : t('summaryPeriod')}
                  </div>
                  <div className="text-sm font-bold text-slate-900">{p.name}</div>
                  <div className="text-[10px] font-medium text-slate-500 uppercase">{p.clientName}</div>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-black ${p.margin > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : p.margin < 0 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                  {p.margin > 0 ? '+' : ''}{formatCurrency(p.margin)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-400 uppercase tracking-tight">{t('totalHours')}</span>
                  <span className="font-black text-slate-700">{p.hours.toLocaleString('it-IT', { minimumFractionDigits: 1 })}h</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-400 uppercase tracking-tight">{t('summaryTotalCost')}</span>
                  <span className="font-black text-slate-700">{formatCurrency(p.totalCost)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-indigo-50/50 rounded-lg border border-indigo-100 col-span-2">
                  <span className="font-bold text-indigo-400 uppercase tracking-tight">{t('totalRevenue')}</span>
                  <span className="font-black text-indigo-600">{formatCurrency(p.revenue)}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">{t('noData')}</div>
          )}
        </div>

        {/* Desktop View: Compact Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-3 py-2 whitespace-nowrap">{t('headerDate')}</th>
                <th className="px-3 py-2">{t('summaryProjectName')}</th>
                <th className="px-3 py-2">{t('headerClient')}</th>
                <th className="px-3 py-2 text-right whitespace-nowrap">{t('totalHours')}</th>
                <th className="px-3 py-2 text-right whitespace-nowrap">{t('summaryTotalCost')}</th>
                <th className="px-3 py-2 text-indigo-400 text-right whitespace-nowrap">{t('totalRevenue')}</th>
                <th className="px-3 py-2 text-emerald-500 text-right whitespace-nowrap">{t('margin')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {groupedByProject.length > 0 ? groupedByProject.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-blue-600 whitespace-nowrap capitalize">
                    {p.dateDisplay !== 'Periodo'
                      ? new Intl.DateTimeFormat(localeMap[lang as string] || 'it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(p.dateDisplay as string))
                      : t('summaryPeriod')}
                  </td>
                  <td className="px-3 py-1.5 font-bold text-slate-900 truncate max-w-[150px]" title={p.name}>{p.name}</td>
                  <td className="px-3 py-1.5 text-slate-500 font-medium truncate max-w-[120px]" title={p.clientName}>{p.clientName}</td>
                  <td className="px-3 py-1.5 font-black text-slate-700 text-right whitespace-nowrap">{p.hours.toLocaleString('it-IT', { minimumFractionDigits: 1 })} h</td>
                  <td className="px-3 py-1.5 font-black text-slate-900 text-right whitespace-nowrap">{formatCurrency(p.totalCost)}</td>
                  <td className="px-3 py-1.5 font-black text-indigo-600 text-right whitespace-nowrap">{formatCurrency(p.revenue)}</td>
                  <td className="px-3 py-1.5 font-black text-right whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black ${p.margin > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : p.margin < 0 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-100 text-slate-500'}`}>
                      {p.margin > 0 ? '+' : ''}{formatCurrency(p.margin)}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">{t('noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div >
  );
};


// --- Profile View ---
const ProfileView: React.FC<{ user: User, onUpdate?: (u: User) => void }> = ({ user, onUpdate }) => {
  const { t } = useTranslation();
  const isDemoAccount = user.username?.toLowerCase().includes('demo') || false;
  const [passForm, setPassForm] = useState({ newPass: '', confirmPass: '' });
  const [profileForm, setProfileForm] = useState({
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const [monthlyHours, setMonthlyHours] = useState<number | null>(null);

  useEffect(() => {
    if (user.role === 'operator' || user.role === 'supervisor') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      db.getReports(user.id, user.role).then(reports => {
        const filtered = reports.filter(r => {
          const rDate = new Date(r.date);
          return rDate >= startOfMonth;
        });

        const total = filtered.reduce((sum: number, r: any) => {
          let h = 0;
          if (r.userId === user.id) h += (r.totalHours || 0);
          const aw = r.additionalWorkers?.find((w: any) => w.userId === user.id);
          if (aw) h += (aw.totalHours || 0);
          return sum + h;
        }, 0);

        setMonthlyHours(total);
      }).catch(console.error);
    }
  }, [user.id, user.role]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPass !== passForm.confirmPass) {
      setMessage({ text: t('passwordMismatch'), type: 'error' });
      return;
    }
    try {
      await db.updateUser(user.id, { password: passForm.newPass });
      setMessage({ text: t('passwordChanged'), type: 'success' });
      setPassForm({ newPass: '', confirmPass: '' });
    } catch (err) {
      setMessage({ text: 'Errore durante l\'aggiornamento', type: 'error' });
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.updateUser(user.id, profileForm);
      const updatedUser = { ...user, ...profileForm };
      if (onUpdate) onUpdate(updatedUser);
      setProfileMessage({ text: t('profileUpdated'), type: 'success' });
    } catch (err) {
      setProfileMessage({ text: 'Errore durante l\'aggiornamento', type: 'error' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-50">
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
            <UserIcon size={40} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{user.name}</h1>
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mt-1">{t(user.role as any)}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">@{user.username}</p>
          </div>
        </div>

        {monthlyHours !== null && (
          <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('monthlySummary')}</h3>
                <p className="text-sm text-slate-500 mt-1">{t('currentMonth')}</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-blue-600">{monthlyHours.toFixed(2)}</span>
                <span className="text-lg font-bold text-blue-600 ml-1">h</span>
              </div>
            </div>
          </div>
        )}

        {/* Contact Information Form */}
        <form onSubmit={handleProfileUpdate} className="space-y-4 mb-10 pb-10 border-b border-slate-50">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <UserIcon size={16} className="text-blue-500" /> {t('personnel')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('email')}</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                className={`${inputClasses} w-full`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('phone')}</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                className={`${inputClasses} w-full`}
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('address')}</label>
              <input
                type="text"
                value={profileForm.address}
                onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                className={`${inputClasses} w-full`}
              />
            </div>
          </div>
          {profileMessage.text && (
            <p className={`text-xs font-bold p-3 rounded-xl transition-all ${profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {profileMessage.text}
            </p>
          )}
          <button type="submit" className="w-full sm:w-auto px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all mt-2">
            {t('save')}
          </button>
        </form>

        {/* Password Change Form */}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldAlert size={16} className="text-blue-500" /> {t('changePassword')}
          </h3>
          {isDemoAccount ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm font-medium">
              La modifica della password è disabilitata per gli account dimostrativi.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('newPassword')}</label>
                  <input
                    type="password"
                    required
                    value={passForm.newPass}
                    onChange={e => setPassForm({ ...passForm, newPass: e.target.value })}
                    className={`${inputClasses} w-full`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('confirmPassword')}</label>
                  <input
                    type="password"
                    required
                    value={passForm.confirmPass}
                    onChange={e => setPassForm({ ...passForm, confirmPass: e.target.value })}
                    className={`${inputClasses} w-full`}
                  />
                </div>
              </div>
              {message.text && (
                <p className={`text-xs font-bold p-3 rounded-xl transition-all ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  {message.text}
                </p>
              )}
              <button type="submit" className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all mt-2">
                {t('update')}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

// --- Help View ---
const HelpCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode; color: string }> = ({ title, children, icon, color }) => (
  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-start gap-4">
      <div className={`p-3 rounded-2xl ${color} shrink-0`}>
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{children}</p>
      </div>
    </div>
  </div>
);

const HelpView: React.FC<{ user: User }> = ({ user }) => {
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-8 pb-10">
      <div className="text-center max-w-2xl mx-auto pt-4">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t('helpTitle')}</h1>
        <p className="text-slate-500 font-medium">{t('helpSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Common Section: PWA */}
        <HelpCard 
          title={t('helpPwaTitle')} 
          icon={<Smartphone className="text-indigo-600" />} 
          color="bg-indigo-50"
        >
          {t('helpPwaBody')}
          <div className="mt-4 flex gap-4">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <Apple size={14} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-600">iPhone: Share → Add to Home</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <Chrome size={14} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-600">Android: Menu → Install App</span>
            </div>
          </div>
        </HelpCard>

        {/* Roles based content */}
        {!isAdmin ? (
          <>
            <HelpCard 
              title={t('helpNewReportTitle')} 
              icon={<PlusCircle className="text-blue-600" />} 
              color="bg-blue-50"
            >
              {t('helpNewReportBody')}
            </HelpCard>
            <HelpCard 
              title={t('helpAdditionalWorkersTitle')} 
              icon={<Users className="text-emerald-600" />} 
              color="bg-emerald-50"
            >
              {t('helpAdditionalWorkersBody')}
            </HelpCard>
          </>
        ) : (
          <>
            <HelpCard 
              title={t('helpAdminSummaryTitle')} 
              icon={<LayoutDashboard className="text-amber-600" />} 
              color="bg-amber-50"
            >
              {t('helpAdminSummaryBody')}
            </HelpCard>
            <HelpCard 
              title={t('helpAdminPersonnelTitle')} 
              icon={<Users className="text-purple-600" />} 
              color="bg-purple-50"
            >
              {t('helpAdminPersonnelBody')}
            </HelpCard>
            <HelpCard 
              title={t('helpAdminInternalTitle')} 
              icon={<Briefcase className="text-indigo-600" />} 
              color="bg-indigo-50"
            >
              {t('helpAdminInternalBody')}
            </HelpCard>
          </>
        )}
      </div>

      <div className="bg-blue-50 rounded-3xl p-8 border border-blue-100 text-center">
        <HelpCircle className="mx-auto text-blue-500 mb-3" size={32} />
        <h3 className="font-bold text-blue-900 text-lg">{t('helpContactHeader')}</h3>
        <a href="mailto:jtw@live.it" className="text-blue-700/70 text-sm mt-1 hover:text-blue-800 transition-colors">
          {t('helpSupportContact')}
        </a>
      </div>
    </div>
  );
};

// --- Personnel View ---
const PersonnelView: React.FC<{ onImpersonate?: (u: User) => void }> = ({ onImpersonate }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [u, s] = await Promise.all([db.getUsers(), db.getSubcontractors()]);
      setUsers(u);
      setSubcontractors(s);
    };
    load();
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    role: 'operator' as Role,
    status: 'active' as UserStatus,
    hourlyRate: 0,
    overtimeHourlyRate: 0,
    extraCost: 0,
    phone: '',
    address: '',
    notes: '',
    subcontractorId: ''
  });

  const isEditingDemo = !!editingId && formData.username?.toLowerCase().includes('demo');

  const handleEdit = (u: User) => {
    setEditingId(u.id);
    setFormData({
      name: u.name,
      username: u.username,
      password: u.password,
      email: u.email || '',
      role: u.role,
      status: u.status,
      hourlyRate: u.hourlyRate || 0,
      overtimeHourlyRate: u.overtimeHourlyRate || 0,
      extraCost: u.extraCost || 0,
      phone: u.phone || '',
      address: u.address || '',
      notes: u.notes || '',
      subcontractorId: u.subcontractorId || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDelete'))) {
      await db.deleteUser(id);
      setUsers(await db.getUsers());
    }
  };

  const handleSendInstructions = (u: any) => {
    if (!u.email) {
      alert(t('placeholderEmail'));
      return;
    }
    const subject = encodeURIComponent(t('emailInstructionsSubject'));
    let bodyText = t('emailInstructionsBody');
    bodyText = bodyText.replace('{name}', u.name || '');
    bodyText = bodyText.replace('{username}', u.username || '');
    const displayedPassword = u.password || '';
    bodyText = bodyText.replace('{password}', displayedPassword);
    const body = encodeURIComponent(bodyText);
    window.location.href = `mailto:${u.email}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...formData, subcontractorId: formData.subcontractorId || undefined };
      if (editingId) {
        await db.updateUser(editingId, data);
      } else {
        await db.addUser(data);
      }
      setUsers(await db.getUsers());
      setEditingId(null);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(t('saveError') + err.message);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      username: '',
      password: 'password123',
      email: '',
      role: 'operator',
      status: 'active',
      hourlyRate: 0,
      overtimeHourlyRate: 0,
      extraCost: 0,
      phone: '',
      address: '',
      notes: '',
      subcontractorId: ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('personnel')}</h1>
        <button onClick={resetForm} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
          <Plus size={16} className="mr-2" /> {t('newUser')}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {[...users].sort((a, b) => {
          const aType = a.status === 'inactive' ? 2 : (!a.subcontractorId ? 0 : 1);
          const bType = b.status === 'inactive' ? 2 : (!b.subcontractorId ? 0 : 1);
          if (aType !== bType) return aType - bType;
          return a.name.localeCompare(b.name);
        }).map(u => {
          const sub = subcontractors.find(s => s.id === u.subcontractorId);
          return (
            <div key={u.id} className={`bg-white p-4 rounded-2xl border ${u.status === 'active' ? 'border-slate-200' : 'border-slate-100 opacity-60'} flex justify-between items-center group hover:border-blue-200 hover:shadow-md transition-all`}>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 text-base truncate">
                  {u.name}
                  {u.phone && <span className="text-sm text-slate-500 font-medium ml-2 font-normal">• {u.phone}</span>}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 truncate capitalize">
                  {t(u.role as any)} • {u.subcontractorId ? sub?.name || 'Subappalto' : t('person.internal')}
                </p>
              </div>
              <div className="flex gap-2 shrink-0 ml-4 items-center">
                {u.email && (
                  <button onClick={() => handleSendInstructions(u)} className="p-2.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors" title={t('sendInstructions')}>
                    <Mail size={18} />
                  </button>
                )}
                {onImpersonate && (
                  <button onClick={() => onImpersonate(u)} className="p-2.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors" title={t('impersonateUser')}>
                    <UserIcon size={18} />
                  </button>
                )}
                <button onClick={() => handleEdit(u)} className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"><Pencil size={18} /></button>
                <button onClick={() => handleDelete(u.id)} className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={modalClasses}>
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? t('editUser') : t('newUser')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isEditingDemo && (
                <div className="bg-amber-50 text-amber-800 p-3 rounded-xl text-xs font-semibold border border-amber-200">
                  {t('demoFieldsLocked')}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <FullWidthField label={t('person.name')}>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} disabled={isEditingDemo} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('person.type')}>
                  <select 
                    value={formData.subcontractorId} 
                    onChange={e => {
                      const subId = e.target.value;
                      const sub = subcontractors.find(s => s.id === subId);
                      setFormData({ 
                        ...formData, 
                        subcontractorId: subId,
                        hourlyRate: sub ? sub.amount : (subId === "" ? 0 : formData.hourlyRate)
                      });
                    }} 
                    className={inputClasses}
                  >
                    <option value="">{t('person.internal')}</option>
                    {Array.from(new Map(subcontractors.map(s => [s.id, s])).values()).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </FullWidthField>
                <FullWidthField label={t('person.role')}>
                  <select required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as Role })} disabled={isEditingDemo} className={inputClasses}>
                    <option value="operator">{t('operator')}</option>
                    <option value="supervisor">{t('supervisor')}</option>
                    <option value="admin">{t('adminRole')}</option>
                  </select>
                </FullWidthField>
                <FullWidthField label={t('person.phone')}>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('person.email')}>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('person.hourlyRate')}>
                  <div className="relative flex items-center">
                    <input type="number" step="0.01" value={formData.hourlyRate} onChange={e => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })} className={inputClasses} />
                  </div>
                </FullWidthField>
                <FullWidthField label={t('person.overtimeHourlyRate')}>
                  <div className="relative flex items-center">
                    <input type="number" step="0.01" value={formData.overtimeHourlyRate} onChange={e => setFormData({ ...formData, overtimeHourlyRate: parseFloat(e.target.value) || 0 })} className={inputClasses} />
                  </div>
                </FullWidthField>
                {/* Username and Password only for Internal personnel */}
                {!formData.subcontractorId && (
                  <>
                    <FullWidthField label={t('person.username')}>
                      <input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} disabled={isEditingDemo} className={inputClasses} />
                    </FullWidthField>
                    <FullWidthField label={t('person.password')}>
                      <input type="text" required={!editingId} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} disabled={isEditingDemo} className={inputClasses} />
                    </FullWidthField>
                  </>
                )}
                <div className="md:col-span-2">
                  <FullWidthField label={t('person.address')}>
                    <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className={inputClasses} />
                  </FullWidthField>
                </div>
                <div className="md:col-span-2">
                  <FullWidthField label={t('notes')}>
                    <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={inputClasses + " min-h-[60px]"} />
                  </FullWidthField>
                </div>
              </div>


              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t mt-4">
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">{t('person.status')}:</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'active' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('person.active')}</button>
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'inactive' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'inactive' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>{t('person.inactive')}</button>
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  {editingId && formData.email && (
                    <button type="button" onClick={() => handleSendInstructions(formData)} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
                      <Mail size={16} /> {t('sendInstructions')}
                    </button>
                  )}
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none px-6 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors">{t('cancel')}</button>
                  <button type="submit" className="flex-1 sm:flex-none px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                    {editingId ? t('update') : t('save')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Clients View ---
const ClientsView: React.FC = () => {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    db.getClients().then(setClients);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    vatNumber: '',
    billingAddress: '',
    mainContactName: '',
    mainContactPhone: '',
    email: '',
    status: 'active' as 'active' | 'inactive',
    notes: ''
  });

  const handleEdit = (c: Client) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      vatNumber: c.vatNumber || '',
      billingAddress: c.billingAddress || '',
      mainContactName: c.mainContactName || '',
      mainContactPhone: c.mainContactPhone || '',
      email: c.email || '',
      status: c.status || 'active',
      notes: c.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDelete'))) {
      await db.deleteClient(id);
      setClients(await db.getClients());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await db.updateClient(editingId, formData);
    } else {
      await db.addClient(formData);
    }
    setClients(await db.getClients());
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      vatNumber: '',
      billingAddress: '',
      mainContactName: '',
      mainContactPhone: '',
      email: '',
      status: 'active',
      notes: ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('clients')}</h1>
        <button onClick={resetForm} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
          <Plus size={16} className="mr-2 inline" /> {t('newClient')}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {clients.map(c => (
          <div key={c.id} className={`bg-white p-4 rounded-2xl border ${c.status === 'active' ? 'border-slate-200' : 'border-slate-100 opacity-60'} flex justify-between items-center group hover:border-blue-200 hover:shadow-md transition-all`}>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-900 text-base truncate">{c.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                {c.mainContactName ? `${c.mainContactName} ${c.mainContactPhone ? ` • ${c.mainContactPhone}` : ''}` : '---'}
              </p>
            </div>
            <div className="flex gap-2 shrink-0 ml-4 items-center">
              <button onClick={() => handleEdit(c)} className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"><Pencil size={18} /></button>
              <button onClick={() => handleDelete(c.id)} className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={modalClasses}>
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? t('editClient') : t('newClient')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-y-4 max-w-lg mx-auto">
                <FullWidthField label={t('client.companyName')}>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('client.vatNumber')}>
                  <input type="text" value={formData.vatNumber} onChange={e => setFormData({ ...formData, vatNumber: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('client.contactPerson')}>
                  <input type="text" value={formData.mainContactName} onChange={e => setFormData({ ...formData, mainContactName: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('client.phone')}>
                  <input type="tel" value={formData.mainContactPhone} onChange={e => setFormData({ ...formData, mainContactPhone: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('client.email')}>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('client.address')}>
                  <input type="text" value={formData.billingAddress} onChange={e => setFormData({ ...formData, billingAddress: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('client.notes')}>
                  <textarea rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={inputClasses} placeholder={t('placeholderNotes')} />
                </FullWidthField>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t mt-4">
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">{t('client.status')}:</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'active' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('client.active')}</button>
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'inactive' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'inactive' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>{t('client.inactive')}</button>
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none px-6 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors">{t('cancel')}</button>
                  <button type="submit" className="flex-1 sm:flex-none px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                    {editingId ? t('update') : t('save')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Projects View ---
const ProjectsView: React.FC = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [personnel, setPersonnel] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [p, c, u] = await Promise.all([db.getProjects(), db.getClients(), db.getUsers()]);
      setProjects(p);
      setClients(c.filter((cl: Client) => cl.status === 'active'));
      setPersonnel(u.filter((usr: User) => usr.status === 'active'));
    };
    load();
  }, []);

  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    description: '',
    address: '',
    notes: '',
    status: 'active' as 'active' | 'closed',
    siteContactName: '',
    siteContactPhone: '',
    siteContactEmail: '',
    siteContactRole: '',
    financialAgreement: 'hourly' as 'hourly' | 'fixed',
    sellingPrice: 0,
    isInternal: false,
    assignedWorkerIds: [] as string[]
  });

  const handleEdit = (p: Project) => {
    setEditingId(p.id);
    setFormData({
      clientId: p.clientId,
      name: p.name,
      description: p.description,
      address: p.address || '',
      notes: p.notes || '',
      status: p.status,
      siteContactName: p.siteContactName || '',
      siteContactPhone: p.siteContactPhone || '',
      siteContactEmail: p.siteContactEmail || '',
      siteContactRole: p.siteContactRole || '',
      financialAgreement: p.financialAgreement || 'hourly',
      sellingPrice: p.sellingPrice || 0,
      isInternal: p.isInternal || false,
      assignedWorkerIds: p.assignedWorkerIds || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDelete'))) {
      await db.deleteProject(id);
      setProjects(await db.getProjects());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await db.updateProject(editingId, formData);
      } else {
        await db.addProject(formData);
      }
      setProjects(await db.getProjects());
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error saving project:', error);
      alert(t('saveError') + (error.message || error.code || 'Unknown error'));
    }
  };

  const resetForm = async (isInternal = false) => {
    let internalClientId = '';
    if (isInternal) {
      const internalClient = await db.getInternalClient();
      if (internalClient) {
        internalClientId = internalClient.id;
      } else {
        internalClientId = 'internal'; // Fallback to placeholder, addProject will try again
      }
    }

    setEditingId(null);
    setFormData({
      clientId: isInternal ? internalClientId : '',
      name: '',
      description: '',
      address: '',
      notes: '',
      status: 'active',
      siteContactName: '',
      siteContactPhone: '',
      siteContactEmail: '',
      siteContactRole: '',
      financialAgreement: 'hourly',
      sellingPrice: 0,
      isInternal,
      assignedWorkerIds: []
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{t('projects')}</h1>
        <div className="flex gap-2">
          <button onClick={() => resetForm(true)} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
            <Plus size={16} /> {t('newInternalProject')}
          </button>
          <button onClick={() => resetForm(false)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2">
            <Plus size={16} /> {t('newProject')}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {projects.map(p => {
          const client = clients.find(c => c.id === p.clientId);
          return (
            <div key={p.id} className={`bg-white p-5 rounded-2xl border ${p.status === 'active' ? 'border-slate-200' : 'border-slate-100 opacity-60'} flex justify-between items-center group hover:border-blue-200 hover:shadow-md transition-all`}>
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${p.status === 'active' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
                  <Briefcase size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-lg truncate flex items-center gap-2">
                    {p.name}
                    {p.isInternal && <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">{t('isInternalProject')}</span>}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5 truncate">{p.isInternal ? t('activityInternal') : (client?.name || '---')}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 ml-4 items-center">
                <button onClick={() => handleEdit(p)} className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"><Pencil size={18} /></button>
                <button onClick={() => handleDelete(p.id)} className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={modalClasses}>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? t('editProject') : t('newProject')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <FullWidthField label={t('isInternalProject')} className="md:col-span-2">
                  <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-xs">
                    <button type="button" onClick={() => setFormData({ ...formData, isInternal: false, clientId: '' })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${!formData.isInternal ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('no')}</button>
                    <button type="button" onClick={() => setFormData({ ...formData, isInternal: true, clientId: 'internal', financialAgreement: 'fixed', sellingPrice: 0 })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.isInternal ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{t('yes')}</button>
                  </div>
                </FullWidthField>
                <FullWidthField label={t('project.client')}>
                  {!formData.isInternal && (
                    <select required value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })} className={inputClasses}>
                      <option value="">{t('select')}</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                  {formData.isInternal && (
                    <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm italic">
                      {t('activityInternal')}
                    </div>
                  )}
                </FullWidthField>
                <FullWidthField label={t('project.title')}>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <div className="md:col-span-2">
                  <FullWidthField label={t('description')}>
                    <textarea rows={2} required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={inputClasses} />
                  </FullWidthField>
                </div>
                <FullWidthField label={t('project.address')}>
                  <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className={inputClasses} />
                </FullWidthField>
                {!formData.isInternal && (
                  <FullWidthField label={t('project.billingType')}>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button type="button" onClick={() => setFormData({ ...formData, financialAgreement: 'hourly' })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.financialAgreement === 'hourly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('project.billingHourly')}</button>
                      <button type="button" onClick={() => setFormData({ ...formData, financialAgreement: 'fixed' })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.financialAgreement === 'fixed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('project.billingFixed')}</button>
                    </div>
                  </FullWidthField>
                )}
                {formData.isInternal && (
                  <FullWidthField label={t('project.billingType')}>
                    <div className="px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 text-sm font-bold">
                      {t('nonBillable')}
                    </div>
                  </FullWidthField>
                )}
                {!formData.isInternal && (
                  <FullWidthField label={t('project.amount')}>
                    <div className="relative flex items-center">
                      <input type="number" step="0.01" value={formData.sellingPrice} onChange={e => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })} className={inputClasses} />
                    </div>
                  </FullWidthField>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <FullWidthField label={t('project.contactPerson')}>
                    <input type="text" value={formData.siteContactName} onChange={e => setFormData({ ...formData, siteContactName: e.target.value })} className={inputClasses} />
                  </FullWidthField>
                  <FullWidthField label={t('project.phone')}>
                    <input type="tel" value={formData.siteContactPhone} onChange={e => setFormData({ ...formData, siteContactPhone: e.target.value })} className={inputClasses} />
                  </FullWidthField>
                </div>
                <div className="md:col-span-2">
                  <FullWidthField label={t('project.notes')}>
                    <textarea rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={inputClasses} />
                  </FullWidthField>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('project.assignedPersonnel') as any}:</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {personnel.map(u => (
                      <label key={u.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg transition-colors cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.assignedWorkerIds.includes(u.id)}
                          onChange={e => {
                            const newIds = e.target.checked 
                              ? [...formData.assignedWorkerIds, u.id]
                              : formData.assignedWorkerIds.filter(id => id !== u.id);
                            setFormData({ ...formData, assignedWorkerIds: newIds });
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs font-medium text-slate-700 group-hover:text-blue-600">{u.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t mt-4">
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">{t('project.status')}:</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'active' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('project.active')}</button>
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'closed' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'closed' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>{t('closed')}</button>
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none px-6 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors">{t('cancel')}</button>
                  <button type="submit" className="flex-1 sm:flex-none px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                    {editingId ? t('update') : t('save')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Subcontractors View ---
const SubcontractorsView: React.FC = () => {
  const { t } = useTranslation();
  const [subs, setSubs] = useState<Subcontractor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    db.getSubcontractors().then(setSubs);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    vatNumber: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    billingType: 'hourly' as 'hourly' | 'fixed',
    amount: 0,
    status: 'active' as 'active' | 'inactive',
    notes: ''
  });

  const handleEdit = (s: Subcontractor) => {
    setEditingId(s.id);
    setFormData({
      name: s.name,
      vatNumber: s.vatNumber || '',
      contactPerson: s.contactPerson || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      billingType: s.billingType || 'hourly',
      amount: s.amount || 0,
      status: s.status || 'active',
      notes: s.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDelete'))) {
      await db.deleteSubcontractor(id);
      setSubs(await db.getSubcontractors());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await db.updateSubcontractor(editingId, formData);
    } else {
      await db.addSubcontractor(formData);
    }
    setSubs(await db.getSubcontractors());
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      vatNumber: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      billingType: 'hourly',
      amount: 0,
      status: 'active',
      notes: ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('subcontractors')}</h1>
        <button onClick={resetForm} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
          <Plus size={16} className="mr-2 inline" /> {t('newSubcontractor')}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {subs.map(s => (
          <div key={s.id} className={`bg-white p-4 rounded-2xl border ${s.status === 'active' ? 'border-slate-200' : 'border-slate-100 opacity-60'} flex justify-between items-center group hover:border-blue-200 hover:shadow-md transition-all`}>
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.status === 'active' ? 'bg-cyan-50 text-cyan-500' : 'bg-slate-50 text-slate-400'}`}>
                <Building2 size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 text-base truncate">{s.name}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                  {s.contactPerson ? `${s.contactPerson} ${s.phone ? ` • ${s.phone}` : ''}` : '---'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0 ml-4 items-center">
              <button onClick={() => handleEdit(s)} className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"><Pencil size={18} /></button>
              <button onClick={() => handleDelete(s.id)} className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={modalClasses}>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? t('editSubcontractor') : t('newSubcontractor')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <FullWidthField label={t('subcontractor.companyName')}>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('vatNumber')}>
                  <input type="text" value={formData.vatNumber} onChange={e => setFormData({ ...formData, vatNumber: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('subcontractor.contactPerson')}>
                  <input type="text" value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('subcontractor.phone')}>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('subcontractor.email')}>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('subcontractor.address')}>
                  <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('subcontractor.billingType')}>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setFormData({ ...formData, billingType: 'hourly' })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.billingType === 'hourly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('subcontractor.billingHourly')}</button>
                    <button type="button" onClick={() => setFormData({ ...formData, billingType: 'fixed' })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.billingType === 'fixed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('subcontractor.billingFixed')}</button>
                  </div>
                </FullWidthField>
                <FullWidthField label={t('subcontractor.amount')}>
                  <div className="relative flex items-center">
                    <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} className={inputClasses} />
                  </div>
                </FullWidthField>
                <div className="md:col-span-2">
                  <FullWidthField label={t('subcontractor.notes')}>
                    <textarea rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={inputClasses} placeholder={t('placeholderNotes')} />
                  </FullWidthField>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t mt-4">
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">{t('subcontractor.status')}:</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'active' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('subcontractor.active')}</button>
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'inactive' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'inactive' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>{t('subcontractor.inactive')}</button>
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none px-6 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors">{t('cancel')}</button>
                  <button type="submit" className="flex-1 sm:flex-none px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                    {editingId ? t('update') : t('save')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportsView: React.FC<{ user: User }> = ({ user }) => {
  const { lang, t } = useTranslation();
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [personnel, setPersonnel] = useState<User[]>([]);

  useEffect(() => {
    const load = async () => {
      const [r, p, u] = await Promise.all([
        db.getReports(user.id, user.role),
        db.getProjects(),
        db.getUsers(),
      ]);
      setReports(r);
      setProjects(p.filter((pr: Project) => pr.status === 'active'));
      setPersonnel(u.filter((usr: User) => usr.status === 'active'));
    };
    load();
  }, []);

  const canEditReport = (r: WorkReport) => {
    if (user.role === 'admin') return true;
    if (user.role === 'supervisor') {
      // Supervisors can edit their own and reports from their assigned projects
      const isAuthor = r.userId === user.id;
      const proj = projects.find(p => p.id === r.projectId);
      const isAssigned = proj?.assignedWorkerIds?.includes(user.id);
      return isAuthor || isAssigned;
    }
    // Operators only edit what they created
    return r.userId === user.id;
  };


  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    projectId: '',
    userId: '',
    search: '',
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month' | 'custom',
    dateFrom: '',
    dateTo: ''
  });

  const filteredReports = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Calcolo inizio settimana (Lunedì)
    const monday = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    const mondayStr = monday.toISOString().split('T')[0];

    // Calcolo inizio mese
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayMonthStr = firstDayMonth.toISOString().split('T')[0];

    return reports.filter((r: WorkReport) => {
      // Filtro Progetto
      if (filters.projectId && r.projectId !== filters.projectId) return false;

      // Filtro Persona (Autore o Collaboratore aggiuntivo)
      if (filters.userId) {
        const isAuthor = r.userId === filters.userId;
        const isHelper = (r.additionalWorkers || []).some((aw: AdditionalWorker) => aw.userId === filters.userId);
        if (!isAuthor && !isHelper) return false;
      }

      // Filtro Ricerca Testo
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const inDesc = r.description.toLowerCase().includes(s);
        const inNotes = (r.notes || '').toLowerCase().includes(s);
        const projName = projects.find((p: Project) => p.id === r.projectId)?.name.toLowerCase() || '';
        if (!inDesc && !inNotes && !projName.includes(s)) return false;
      }

      // Filtro Data
      if (filters.dateRange === 'today') {
        if (r.date !== todayStr) return false;
      } else if (filters.dateRange === 'week') {
        if (r.date < mondayStr) return false;
      } else if (filters.dateRange === 'month') {
        if (r.date < firstDayMonthStr) return false;
      } else if (filters.dateRange === 'custom') {
        if (filters.dateFrom && r.date < filters.dateFrom) return false;
        if (filters.dateTo && r.date > filters.dateTo) return false;
      }

      return true;
    });
  }, [reports, filters, projects]);
  const [formData, setFormData] = useState({
    projectId: '',
    userId: user.id,
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '17:00',
    breakHours: 1,
    manualTotalHours: undefined as number | undefined,
    overtimeHours: 0,
    description: '',
    expenses: [] as Expense[],
    additionalWorkers: [] as AdditionalWorker[],
    activityType: 'work' as 'work' | 'sickness' | 'holiday' | 'internal',
    invoiceStatus: 'Pending'
  });

  const addWorker = () => {
    setFormData({
      ...formData,
      additionalWorkers: [...formData.additionalWorkers, {
        userId: '',
        startTime: formData.startTime,
        endTime: formData.endTime,
        breakHours: formData.breakHours,
        totalHours: 0,
        overtimeHours: 0,
        hourlyRate: 0,
        totalCost: 0,
        personName: '',
        personRole: '',
        membershipType: 'Interno',
        subcontractorId: undefined,
        isManualOverride: false
      } as AdditionalWorker]
    });
  };
  const removeWorker = (index: number) => {
    const newWorkers = [...formData.additionalWorkers];
    newWorkers.splice(index, 1);
    setFormData({ ...formData, additionalWorkers: newWorkers });
  };

  const updateWorker = (index: number, updates: Partial<AdditionalWorker>) => {
    const newWorkers = [...formData.additionalWorkers];
    const currentWorker = newWorkers[index];

    // Trova il worker dal personale per i dati economici
    const worker = personnel.find(u => u.id === (updates.userId || currentWorker.userId));

    // Calcola se c'è un override manuale
    const isManualOverride = updates.manualTotalHours !== undefined
      ? true
      : (currentWorker.isManualOverride || false);

    // Crea il worker aggiornato con tutti i campi
    const updatedWorker: AdditionalWorker = {
      ...currentWorker,
      ...updates,
      hourlyRate: worker?.hourlyRate || 0,
      totalCost: currentWorker.totalHours * (worker?.hourlyRate || 0),
      personName: worker?.name || '',
      personRole: worker?.role || '',
      membershipType: worker?.subcontractorId ? 'Subappalto' : 'Interno',
      subcontractorId: worker?.subcontractorId,
      isManualOverride
    };

    newWorkers[index] = updatedWorker;
    setFormData({ ...formData, additionalWorkers: newWorkers });
  };
  const currentMainWorkerHours = db.calculateTotalHours(formData.startTime, formData.endTime, formData.breakHours, formData.manualTotalHours);
  
  // Personnel filtering based on project assignment
  const selectedProject = projects.find(p => p.id === formData.projectId);
  const availablePersonnel = useMemo(() => {
    if (!selectedProject || !selectedProject.assignedWorkerIds || selectedProject.assignedWorkerIds.length === 0) {
      return personnel; // All personnel if no project selected or no assignments
    }
    return personnel.filter(u => selectedProject.assignedWorkerIds?.includes(u.id));
  }, [selectedProject, personnel]);

  const currentHelpersTotalHours = formData.additionalWorkers.reduce((sum, aw) => sum + (aw.manualTotalHours !== undefined ? aw.manualTotalHours : db.calculateTotalHours(aw.startTime, aw.endTime, aw.breakHours)), 0);
  const globalTotalHours = currentMainWorkerHours + currentHelpersTotalHours;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, notes: '', teamTotalHours: globalTotalHours };
    try {
      if (editingId) await db.updateReport(editingId, payload as any); else await db.addReport(payload as any);
      setReports(await db.getReports(user.id, user.role));
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(t('saveError') + JSON.stringify(err));
    }
  };

  const handleEdit = (r: WorkReport) => {
    setEditingId(r.id);
    setFormData({
      projectId: r.projectId,
      userId: r.userId,
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      breakHours: r.breakHours,
      manualTotalHours: r.manualTotalHours,
      overtimeHours: r.overtimeHours || 0,
      description: r.description,
      expenses: [...(r.expenses || [])],
      additionalWorkers: [...(r.additionalWorkers || [])],
      activityType: r.activityType || 'work',
      invoiceStatus: r.invoiceStatus || 'Pending'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDelete'))) {
      await db.deleteReport(id);
      setReports(await db.getReports(user.id, user.role));
      if (editingId === id) {
        setIsModalOpen(false);
        setEditingId(null);
      }
    }
  };

  const handleDuplicate = (r: WorkReport) => {
    setEditingId(null);
    setFormData({
      projectId: r.projectId,
      userId: r.userId,
      date: new Date().toISOString().split('T')[0],
      startTime: r.startTime,
      endTime: r.endTime,
      breakHours: r.breakHours,
      manualTotalHours: r.manualTotalHours,
      overtimeHours: r.overtimeHours || 0,
      description: r.description,
      expenses: [...(r.expenses || []).map(e => ({ ...e, id: '' }))],
      additionalWorkers: [...(r.additionalWorkers || [])],
      activityType: r.activityType || 'work',
      invoiceStatus: 'Pending'
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('reports')}</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-inner' : 'bg-white border-slate-200 text-slate-600 shadow-sm hover:border-slate-300'}`}
            title={t('filters')}
          >
            <Filter size={20} />
          </button>
          <button onClick={() => {
            setEditingId(null);
            setFormData({
              projectId: '',
              userId: user.id,
              date: new Date().toISOString().split('T')[0],
              startTime: '08:00',
              endTime: '17:00',
              breakHours: 1,
              manualTotalHours: undefined,
              overtimeHours: 0,
              description: '',
              expenses: [],
              additionalWorkers: [],
              activityType: 'work',
              invoiceStatus: 'Pending'
            });
            setIsModalOpen(true);
          }} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
            <Plus size={16} className="mr-2 inline" /> 
            <span className="hidden sm:inline">{t('newReport')}</span>
            <span className="sm:hidden">{t('addBtn')}</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Search size={12} /> {t('filters')}
            </h3>
            <button
              onClick={() => setFilters({ projectId: '', userId: '', search: '', dateRange: 'all', dateFrom: '', dateTo: '' })}
              className="text-[9px] items-center font-extrabold px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md hover:bg-slate-100 transition-colors uppercase"
            >
              {t('clearFilters')}
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('project')}</label>
              <select
                value={filters.projectId}
                onChange={e => setFilters({ ...filters, projectId: e.target.value })}
                className={filterInputClasses}
              >
                <option value="">{t('allProjects')}</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {user.role !== 'operator' && (
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('workerLabel')}</label>
                <select
                  value={filters.userId}
                  onChange={e => setFilters({ ...filters, userId: e.target.value })}
                  className={filterInputClasses}
                >
                  <option value="">{t('allWorkers')}</option>
                  {personnel.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('filterByRange')}</label>
              <select
                value={filters.dateRange}
                onChange={e => setFilters({ ...filters, dateRange: e.target.value as any })}
                className={filterInputClasses}
              >
                <option value="all">{t('statusAll')}</option>
                <option value="today">{t('today')}</option>
                <option value="week">{t('thisWeek')}</option>
                <option value="month">{t('thisMonth')}</option>
                <option value="custom">{t('customRange')}</option>
              </select>
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('filters')}</label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={e => setFilters({ ...filters, search: e.target.value })}
                  placeholder={t('placeholderSearch')}
                  className={filterInputClasses + " pl-7"}
                />
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {filters.dateRange === 'custom' && (
              <div className="col-span-2 lg:col-span-4 grid grid-cols-2 gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('dateFrom')}</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
                    className={filterInputClasses}
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('dateTo')}</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
                    className={filterInputClasses}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Mobile View: Card Layout */}
        <div className="sm:hidden divide-y divide-slate-100">
          {[...filteredReports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(r => {
            const proj = projects.find(p => p.id === r.projectId);
            const dateObj = new Date(r.date);
            const formattedDate = new Intl.DateTimeFormat(localeMap[lang as string] || 'it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(dateObj);
            const totalWorkersCount = 1 + (r.additionalWorkers || []).length;
            const totalCombinedHours = (r.totalHours + (r.additionalWorkers || []).reduce((s, aw) => s + aw.totalHours, 0)).toFixed(2);

            return (
              <div key={r.id} className="p-4 space-y-3 active:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-blue-600 capitalize flex items-center gap-2">
                      {formattedDate}
                      {r.activityType && r.activityType !== 'work' && (
                        <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-black uppercase">
                          {t(`activity${r.activityType.charAt(0).toUpperCase() + r.activityType.slice(1)}` as any)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-900">{proj?.name || '---'}</div>
                    {r.description && <div className="text-xs text-slate-500 line-clamp-2 mt-0.5" title={r.description}>{r.description}</div>}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleDuplicate(r)} className="p-2 text-emerald-600 bg-emerald-50 active:bg-emerald-100 rounded-lg transition-colors border border-emerald-100" title={t('duplicate')}><Copy size={16} /></button>
                    {canEditReport(r) && (
                      <>
                        <button onClick={() => handleEdit(r)} className="p-2 text-blue-600 bg-blue-50 active:bg-blue-100 rounded-lg transition-colors border border-blue-100" title={t('edit')}><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(r.id)} className="p-2 text-red-600 bg-red-50 active:bg-red-100 rounded-lg transition-colors border border-red-100" title={t('delete')}><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    <Users size={12} /> <span className="font-bold">{totalWorkersCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                    <Clock size={12} /> <span className="font-bold">{totalCombinedHours}h</span>
                  </div>
                  {r.invoiceStatus && (
                    <div className={`ml-auto px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tight border ${
                      r.invoiceStatus === 'Pagato' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      r.invoiceStatus === 'Fatturato' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {t(r.invoiceStatus === 'Pending' ? 'statusPending' : r.invoiceStatus === 'Fatturato' ? 'statusInvoiced' : 'statusPaid' as any)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
            {reports.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">{t('noData')}</div>
          )}
        </div>

        {/* Desktop View: Compact Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest">
                <th className="px-3 py-2 font-black w-32">{t('date')}</th>
                <th className="px-3 py-2 font-black">{t('project')}</th>
                <th className="px-3 py-2 font-black hidden lg:table-cell">{t('description')}</th>
                <th className="px-3 py-2 font-black text-center w-24">{t('peopleLabel')}</th>
                <th className="px-3 py-2 font-black text-center w-24">{t('totalHoursLabel')}</th>
                <th className="px-3 py-2 font-black text-right w-36">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...filteredReports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(r => {
                const proj = projects.find(p => p.id === r.projectId);
                const dateObj = new Date(r.date);
                const formattedDate = new Intl.DateTimeFormat(localeMap[lang as string] || 'it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(dateObj);
                const totalWorkersCount = 1 + (r.additionalWorkers || []).length;
                const totalCombinedHours = (r.totalHours + (r.additionalWorkers || []).reduce((s, aw) => s + aw.totalHours, 0)).toFixed(2);

                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-3 py-1.5 text-xs font-bold text-blue-600 whitespace-nowrap capitalize">{formattedDate}</td>
                    <td className="px-3 py-1.5 text-xs font-medium text-slate-900 truncate max-w-[150px]" title={proj?.name}>{proj?.name || '---'}</td>
                    <td className="px-3 py-1.5 text-xs text-slate-600 truncate max-w-[150px] hidden lg:table-cell" title={r.description}>{r.description || '---'}</td>
                    <td className="px-3 py-1.5 text-center">
                      <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                        {totalWorkersCount}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md text-[10px] border border-blue-100">
                        {totalCombinedHours}h
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => handleDuplicate(r)} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors" title={t('duplicate')}><Copy size={14} /></button>
                        {canEditReport(r) && (
                          <>
                            <button onClick={() => handleEdit(r)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title={t('edit')}><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(r.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title={t('delete')}><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">{t('noData')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={modalClasses}>
            <div className="flex justify-between items-center mb-4 border-b pb-2"><h2 className="text-xl font-bold text-slate-900">{editingId ? t('editReport') : t('newReport')}</h2><button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                <FullWidthField label={t('project')}>
                  <select required value={formData.projectId} onChange={e => {
                    const newProjectId = e.target.value;
                    const proj = projects.find(p => p.id === newProjectId);
                    setFormData({
                      ...formData,
                      projectId: newProjectId,
                      activityType: proj?.isInternal ? 'internal' : (formData.activityType === 'internal' ? 'work' : formData.activityType),
                      description: (formData.description === '' && proj?.description) ? proj.description : formData.description
                    });
                  }} className={inputClasses}>
                    <option value="">{t('select')}</option>
                    {projects
                      .filter(p => {
                        if (user.role === 'admin' || !p.assignedWorkerIds || p.assignedWorkerIds.length === 0) return true;
                        return p.assignedWorkerIds.includes(user.id);
                      })
                      .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </FullWidthField>

                {user.role === 'admin' && (
                  <FullWidthField label={t('workerLabel')}>
                    <select
                      required
                      value={formData.userId}
                      onChange={e => setFormData({ ...formData, userId: e.target.value })}
                      className={inputClasses}
                    >
                      <option value="">{t('select')}</option>
                      {personnel.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </FullWidthField>
                )}
                <FullWidthField label={t('activityType')}>
                  <select 
                    value={formData.activityType} 
                    onChange={e => setFormData({ ...formData, activityType: e.target.value as any })} 
                    className={inputClasses}
                  >
                    <option value="work">{t('activityWork')}</option>
                    <option value="sickness">{t('activitySickness')}</option>
                    <option value="holiday">{t('activityHoliday')}</option>
                    <option value="internal">{t('activityInternal')}</option>
                  </select>
                </FullWidthField>
                <FullWidthField label={t('date')}><input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className={inputClasses} /></FullWidthField>
                <div className="md:col-span-2"><FullWidthField label={t('description')}><textarea required rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={inputClasses} /></FullWidthField></div>

                {user.role === 'admin' && (
                  <div className="md:col-span-2 bg-blue-50 border border-blue-100 p-4 rounded-xl">
                    <FullWidthField label={t('adminStatusLabel')}>
                      <select
                        value={formData.invoiceStatus}
                        onChange={e => setFormData({ ...formData, invoiceStatus: e.target.value })}
                        className={inputClasses}
                      >
                        <option value="Pending">{t('statusPending')}</option>
                        <option value="Fatturato">{t('statusInvoiced')}</option>
                        <option value="Pagato">{t('statusPaid')}</option>
                      </select>
                    </FullWidthField>
                  </div>
                )}

                <div className="md:col-span-2 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {user.role !== 'operator' && (
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
                      <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                        <Users size={16} className="text-blue-500" /> {t('teamLabel')}
                      </h3>
                      <button type="button" onClick={addWorker} className="text-xs font-bold text-blue-600 bg-white border border-blue-200 shadow-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1">
                        <Plus size={14} /> {t('addWorker')}
                      </button>
                    </div>
                  )}

                  {/* Intestazioni (visibili solo su schermi non troppo piccoli, o allineate) */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 px-2 mb-1 pr-10 sm:pr-0">
                    <div className="col-span-3"></div>
                    <div className="col-span-2 px-1 text-[10px] font-extrabold text-slate-400 uppercase text-center">{t('headerStart')}</div>
                    <div className="col-span-2 px-1 text-[10px] font-extrabold text-slate-400 uppercase text-center">{t('headerEnd')}</div>
                    <div className="col-span-1 px-1 text-[10px] font-extrabold text-slate-400 uppercase text-center">{t('headerBreak')}</div>
                    <div className="col-span-2 px-1 text-[10px] font-extrabold text-amber-500 uppercase text-center sm:border-l sm:border-transparent sm:pl-2">{t('headerExtra')}</div>
                    <div className="col-span-2 px-1 text-[10px] font-extrabold text-slate-400 uppercase text-center sm:border-l sm:border-transparent sm:pl-2 pr-8">{t('headerTotal')}</div>
                  </div>

                  {/* Riga Autore Principale */}
                  <div className="bg-white p-2 rounded-xl border border-blue-200 grid grid-cols-12 gap-2 items-center shadow-sm relative pr-10 sm:pr-0">
                    <div className="col-span-12 sm:col-span-3">
                      <div className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 truncate">
                        {personnel.find(u => u.id === formData.userId)?.name || t('mainWorker')}
                      </div>
                    </div>
                    
                    <div className="col-span-4 sm:col-span-2 flex flex-col gap-0.5">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('headerStart')}</label>
                      <input type="time" required value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className={`${inputClasses} w-full text-center px-1`} />
                    </div>
                    
                    <div className="col-span-4 sm:col-span-2 flex flex-col gap-0.5">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('headerEnd')}</label>
                      <input type="time" required value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className={`${inputClasses} w-full text-center px-1`} />
                    </div>
                    
                    <div className="col-span-4 sm:col-span-1 flex flex-col gap-0.5">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('headerBreak')}</label>
                      <input type="number" step="0.25" value={formData.breakHours} onChange={e => setFormData({ ...formData, breakHours: parseFloat(e.target.value) || 0 })} className={`${inputClasses} w-full text-center px-1`} />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-2 flex flex-col gap-0.5 sm:border-l sm:border-slate-200 sm:pl-2">
                      <label className="text-[9px] font-extrabold text-amber-500 uppercase ml-1 tracking-tight sm:hidden">{t('headerExtra')}</label>
                      <input type="number" step="0.25" value={formData.overtimeHours || ''} onChange={e => setFormData({ ...formData, overtimeHours: parseFloat(e.target.value) || 0 })} placeholder="0" className={`${inputClasses} w-full text-center text-amber-600 font-bold bg-amber-50 border-amber-200 px-1`} />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-2 flex flex-col gap-0.5 sm:border-l sm:border-slate-200 sm:pl-2">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('headerTotal')}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.manualTotalHours !== undefined ? formData.manualTotalHours : ''}
                        onChange={e => setFormData({ ...formData, manualTotalHours: e.target.value === "" ? undefined : parseFloat(e.target.value) })}
                        placeholder={db.calculateTotalHours(formData.startTime, formData.endTime, formData.breakHours).toFixed(2)}
                        className="w-full px-1 py-1 bg-white border border-slate-200 rounded-lg text-center font-black text-blue-600 outline-none h-[30px]"
                      />
                    </div>
                  </div>

                  {/* Righe Collaboratori */}
                  {user.role !== 'operator' && formData.additionalWorkers.map((aw, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center shadow-sm relative pr-10 sm:pr-0">
                      <div className="col-span-12 sm:col-span-3">
                        <select required value={aw.userId} onChange={e => updateWorker(idx, { userId: e.target.value })} className={inputClasses + " w-full"}>
                          <option value="">{t('workerLabel')}...</option>
                          {availablePersonnel.filter(u => u.id !== formData.userId).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </div>

                      <div className="col-span-4 sm:col-span-2 flex flex-col gap-0.5">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('headerStart')}</label>
                        <input type="time" value={aw.startTime} onChange={e => updateWorker(idx, { startTime: e.target.value })} className={`${inputClasses} w-full text-center px-1`} />
                      </div>
                      
                      <div className="col-span-4 sm:col-span-2 flex flex-col gap-0.5">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('headerEnd')}</label>
                        <input type="time" value={aw.endTime} onChange={e => updateWorker(idx, { endTime: e.target.value })} className={`${inputClasses} w-full text-center px-1`} />
                      </div>
                      
                      <div className="col-span-4 sm:col-span-1 flex flex-col gap-0.5">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('headerBreak')}</label>
                        <input type="number" step="0.25" value={aw.breakHours} onChange={e => updateWorker(idx, { breakHours: parseFloat(e.target.value) || 0 })} className={`${inputClasses} w-full text-center px-1`} />
                      </div>
                      
                      <div className="col-span-6 sm:col-span-2 flex flex-col gap-0.5 sm:border-l sm:border-slate-200 sm:pl-2">
                        <label className="text-[9px] font-extrabold text-amber-500 uppercase ml-1 tracking-tight sm:hidden">{t('headerExtra')}</label>
                        <input type="number" step="0.25" value={aw.overtimeHours || ''} onChange={e => updateWorker(idx, { overtimeHours: parseFloat(e.target.value) || 0 })} placeholder="0" className={`${inputClasses} w-full text-center text-amber-600 font-bold bg-amber-50 border-amber-200 px-1`} />
                      </div>
                      
                      <div className="col-span-6 sm:col-span-2 flex flex-col gap-0.5 sm:border-l sm:border-slate-200 sm:pl-2">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('headerTotal')}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={aw.manualTotalHours !== undefined ? aw.manualTotalHours : ''}
                          onChange={e => updateWorker(idx, { manualTotalHours: e.target.value === "" ? undefined : parseFloat(e.target.value) })}
                          placeholder={db.calculateTotalHours(aw.startTime, aw.endTime, aw.breakHours).toFixed(2)}
                          className="w-full px-1 py-1 bg-white border border-slate-200 rounded-lg text-center font-black text-blue-600 outline-none h-[30px]"
                        />
                      </div>
                      <button type="button" onClick={() => removeWorker(idx)} className="absolute right-2 top-2 sm:top-1/2 sm:-translate-y-1/2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>

                {/* Box Totale Complessivo */}
                <div className="md:col-span-2 bg-slate-100 border border-slate-200 text-slate-700 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl shadow-sm"><Clock className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('teamTotalLabel')}</p><p className="text-xs text-slate-500">{t('teamTotalSubLabel')}</p></div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-slate-800">{globalTotalHours.toFixed(2)}</span>
                    <span className="text-lg font-bold text-slate-800 ml-1">h</span>
                  </div>
                </div>

                {/* Sezione Spese Extra */}
                <div className="md:col-span-2 space-y-3 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  <div className="flex justify-between items-center border-b border-amber-200 pb-3 mb-4">
                    <h3 className="text-sm font-bold text-amber-800 uppercase flex items-center gap-2">
                      <FileText size={16} className="text-amber-500" /> {t('extraExpensesLabel')}
                    </h3>
                    <div className="flex items-center gap-3">
                      {formData.expenses.length > 0 && (
                        <span className="text-sm font-black text-amber-700">
                          Tot: {formData.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          expenses: [...formData.expenses, { type: '', amount: 0, notes: '' } as any]
                        })}
                        className="text-xs font-bold text-amber-700 bg-white border border-amber-200 shadow-sm px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors flex items-center gap-1"
                      >
                        <Plus size={14} /> {t('addExpense')}
                      </button>
                    </div>
                  </div>

                  {formData.expenses.length === 0 && (
                    <p className="text-xs text-amber-600 text-center py-2 opacity-60">{t('noData')}</p>
                  )}

                  {formData.expenses.map((exp: any, idx: number) => (
                    <div key={idx} className="bg-white p-2 rounded-xl border border-amber-200 grid grid-cols-12 gap-2 items-center shadow-sm relative pr-10 sm:pr-0">
                      <div className="col-span-12 sm:col-span-4 flex flex-col gap-0.5">
                        <label className="text-[9px] font-extrabold text-amber-500 uppercase ml-1 tracking-tight sm:hidden">{t('placeholderExpenseType')}</label>
                        <input
                          type="text"
                          placeholder={t('placeholderExpenseType')}
                          value={exp.type || ''}
                          onChange={e => {
                            const updated = [...formData.expenses] as any[];
                            updated[idx] = { ...updated[idx], type: e.target.value };
                            setFormData({ ...formData, expenses: updated });
                          }}
                          className={`${inputClasses} w-full`}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2 flex flex-col gap-0.5">
                        <label className="text-[9px] font-extrabold text-amber-500 uppercase ml-1 tracking-tight sm:hidden">{t('amount')}</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={exp.amount || ''}
                          onChange={e => {
                            const updated = [...formData.expenses] as any[];
                            updated[idx] = { ...updated[idx], amount: parseFloat(e.target.value) || 0 };
                            setFormData({ ...formData, expenses: updated });
                          }}
                          className={`${inputClasses} w-full text-right`}
                        />
                      </div>
                      <div className="col-span-8 sm:col-span-6 flex flex-col gap-0.5 pr-2">
                        <label className="text-[9px] font-extrabold text-amber-500 uppercase ml-1 tracking-tight sm:hidden">{t('placeholderExpenseNotes')}</label>
                        <input
                          type="text"
                          placeholder={t('placeholderExpenseNotes')}
                          value={exp.notes || ''}
                          onChange={e => {
                            const updated = [...formData.expenses] as any[];
                            updated[idx] = { ...updated[idx], notes: e.target.value };
                            setFormData({ ...formData, expenses: updated });
                          }}
                          className={`${inputClasses} w-full`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...formData.expenses];
                          updated.splice(idx, 1);
                          setFormData({ ...formData, expenses: updated });
                        }}
                        className="absolute right-2 top-2 sm:top-1/2 sm:-translate-y-1/2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

              </div>

              <div className="flex justify-between items-center pt-6 border-t mt-8">
                <div>
                  {editingId && canEditReport(reports.find(r => r.id === editingId)!) && (
                    <button type="button" onClick={() => handleDelete(editingId)} className="px-6 py-2.5 font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-2">
                      <Trash2 size={16} /> {t('delete')}
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors">{t('cancel')}</button>
                  <button type="submit" className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">{editingId ? t('update') : t('save')}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Login & Registration View ---
// --- Forgot Password Modal ---
const ForgotPasswordLink: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: '', email: '' });
  const { t } = useTranslation();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(t('forgotPasswordEmailSubject'));
    let bodyText = t('forgotPasswordEmailBody')
      .replace('{username}', form.username)
      .replace('{email}', form.email);
    const body = encodeURIComponent(bodyText);
    window.location.href = `mailto:jtw@live.it?subject=${subject}&body=${body}`;
    setOpen(false);
  };

  return (
    <>
      <button onClick={() => { setOpen(true); setForm({ username: '', email: '' }); }}
        className="text-sm text-blue-600 hover:underline font-semibold">
        {t('forgotPassword')}
      </button>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-slate-900">🔑 {t('forgotPasswordTitle')}</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">{t('forgotPasswordDesc')}</p>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('username')}</label>
                <input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder={t('username')} />
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('contactEmailLabel')}</label>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="email@esempio.com" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 text-slate-500 font-bold hover:text-slate-700 text-sm">{t('cancel')}</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">{t('sendRequest')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// --- Registration Request Modal ---
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-slate-900">🏢 {t('registrationTitle')}</h2>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">{t('registrationDesc')}</p>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('companyName')} *</label>
            <input required value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Es. Edilizia Rossi Srl" />
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('contactNameLabel')} *</label>
            <input required value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Mario Rossi" />
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('email')} *</label>
            <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="info@azienda.it" />
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('phone')}</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="+39 02 1234567" />
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('additionalNotes')}</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" placeholder="N. dipendenti, tipo di attività..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 text-slate-500 font-bold hover:text-slate-700 text-sm">{t('cancel')}</button>
            <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">{t('sendRequest')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RegistrationRequestLink: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <>
      <button onClick={() => setOpen(true)} className="text-blue-600 hover:underline font-bold">
        {t('registerLink')}
      </button>
      <RegistrationRequestModal isOpen={open} setOpen={setOpen} />
    </>
  );
};

// --- Auth View ---
const AuthView: React.FC<{ onLogin: (u: User) => void }> = ({ onLogin }) => {
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
        setError(t('invalidCredentials'));
        return;
      }

      // Note: active status is already checked inside db.loginUser, but we keep this for consistency if needed.
      if (user.status === 'inactive') {
        setError(t('accountDisabled'));
        return;
      }

      onLogin(user);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Errore di connessione al server');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSelector />
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 ring-2 ring-white shadow-sm">
          <UserIcon className="w-4 h-4" />
        </div>
      </div>
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md animate-in zoom-in-95 duration-300 border border-slate-100">
        <div className="flex flex-col items-center mb-10">
          <div className="mb-4">
            <img src={logoImg} alt="JobsReport Logo" className="w-32 h-32 object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Jobs<span className="text-blue-600">Report</span></h1>
        </div>
        <InstallButton variant="login" />
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{t('username')}</label>
            <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700" placeholder={t('username')} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{t('password')}</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm font-bold text-center bg-red-50 py-3 rounded-xl border border-red-100">{error}</p>}
          <button type="submit" disabled={!username || !password} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 text-lg">
            {t('loginBtn')}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <ForgotPasswordLink />
          <p className="text-sm text-slate-500">
            {t('noAccount')}{' '}
            <RegistrationRequestLink />
          </p>
        </div>
      </div>
    </div>
  );
};


// --- Companies Management View (SuperAdmin Only) ---
const CompaniesView: React.FC = () => {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const data = await db.getAllCompanies();
    setCompanies(data);
  };

  const [formData, setFormData] = useState({
    companyName: '',
    adminId: '',
    adminName: '',
    username: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setFormData({
      companyName: c.name,
      adminId: c.adminId || '',
      adminName: c.adminName || '',
      username: c.username || '',
      password: c.password || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDeleteCompany'))) {
      try {
        await db.deleteCompany(id);
        loadCompanies();
      } catch (err: any) {
        alert(t('deleteError') + (err.message || JSON.stringify(err)));
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    await db.toggleCompanyStatus(id, currentStatus);
    loadCompanies();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await db.updateCompanyAndAdmin(editingId, formData.companyName, formData.adminId, formData.adminName, formData.username, formData.password);
      } else {
        await db.registerCompany(formData.companyName, formData.adminName, formData.username, formData.password);
      }
      setIsModalOpen(false);
      loadCompanies();
    } catch (err: any) {
      alert(t('genericError') + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ companyName: '', adminId: '', adminName: '', username: '', password: '' });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('companiesManagement')}</h1>
        <button onClick={resetForm} className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700 transition-all">
          <Plus size={16} className="mr-2 inline" /> {t('createCompanyBtn')}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">{t('companyName')}</th>
                <th className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">{t('companyStatus')}</th>
                <th className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900">{c.name}</td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {c.status === 'active' ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleToggleStatus(c.id, c.status)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${c.status === 'active' ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`} title={c.status === 'active' ? t('deactivate') : t('activate')}>
                      {c.status === 'active' ? <><EyeOff size={16} /> Disattiva</> : <><Eye size={16} /> Attiva</>}
                    </button>
                    <button onClick={() => handleEdit(c)} className="flex items-center gap-1.5 px-3 py-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors" title={t('edit')}>
                      <Pencil size={16} /> Modifica
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors" title={t('delete')}>
                      <Trash2 size={16} /> Elimina
                    </button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-slate-500 italic">{t('noData')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={modalClasses}>
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? t('editCompany') : t('createCompanyBtn')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FullWidthField label={t('companyName')}>
                  <input type="text" required value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} className={inputClasses} placeholder="Es. Edilizia Rossi srl" />
                </FullWidthField>
                <FullWidthField label="Nome Amministratore Ditta">
                  <input type="text" required value={formData.adminName} onChange={e => setFormData({ ...formData, adminName: e.target.value })} className={inputClasses} placeholder="Mario Rossi" />
                </FullWidthField>
                <FullWidthField label="Username Amministratore">
                  <input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className={inputClasses} placeholder="mario.rossi" />
                </FullWidthField>
                <FullWidthField label="Password Amministratore">
                  <input type="text" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className={inputClasses} placeholder="Password temporanea" />
                </FullWidthField>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors">{t('cancel')}</button>
                <button type="submit" disabled={isSubmitting} className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50">
                  {isSubmitting ? '...' : (editingId ? t('update') : t('createCompanyBtn'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


// --- Main App Component ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ws_auth');
    if (saved) {
      const parsed = JSON.parse(saved);
      db.setCompanyId(parsed.companyId || parsed.company_id);
      return parsed;
    }
    return null;
  });
  const [adminUser, setAdminUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ws_auth_admin');
    return saved ? JSON.parse(saved) : null;
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('ws_lang') as Language) || 'it');

  useEffect(() => { localStorage.setItem('ws_lang', lang); }, [lang]);

  useEffect(() => {
    if (user && user.id) {
      if ((user.role as any) === 'superadmin') {
        setIsSuperAdmin(true);
      } else {
        db.checkIsSuperAdmin(user.id).then(setIsSuperAdmin).catch(console.error);
      }
    } else {
      setIsSuperAdmin(false);
    }
  }, [user]);

  const handleLogin = (u: User) => {
    db.setCompanyId(u.companyId || (u as any).company_id);
    localStorage.setItem('ws_auth', JSON.stringify(u));
    window.location.hash = '/'; // sempre schermata benvenuto dopo login
    setUser(u);
  };
  const handleLogout = () => {
    db.setCompanyId(null);
    setUser(null);
    setAdminUser(null);
    localStorage.removeItem('ws_auth');
    localStorage.removeItem('ws_auth_admin');
    setIsSuperAdmin(false);
  };

  const handleImpersonate = (targetUser: User) => {
    if (!user) return;
    // Save current user as admin context if not already impersonating
    if (!adminUser) {
      setAdminUser(user);
      localStorage.setItem('ws_auth_admin', JSON.stringify(user));
    }
    // Switch to target user
    db.setCompanyId(targetUser.companyId || (targetUser as any).company_id);
    localStorage.setItem('ws_auth', JSON.stringify(targetUser));
    setUser(targetUser);
    window.location.hash = '/';
  };

  const handleBackToAdmin = () => {
    if (!adminUser) return;
    db.setCompanyId(adminUser.companyId || (adminUser as any).company_id);
    localStorage.setItem('ws_auth', JSON.stringify(adminUser));
    setUser(adminUser);
    setAdminUser(null);
    localStorage.removeItem('ws_auth_admin');
    window.location.hash = '/personnel';
  };

  const t = (key: keyof typeof translations['it']): string => {
    const currentTranslations = translations[lang] || translations['it'];
    return (currentTranslations as any)[key] || (translations['it'] as any)[key] || key;
  };

  const contextValue = useMemo(() => ({ lang, setLang, t }), [lang]);

  return (
    <LanguageContext.Provider value={contextValue}>
      <HashRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/presentation" element={<PresentationView />} />

          {/* Protected Routes Wrapper */}
          <Route 
            path="/*" 
            element={
              !user ? (
                <AuthView onLogin={handleLogin} />
              ) : (
                <AppLayout user={user} isSuperAdmin={isSuperAdmin} onLogout={handleLogout}>
                  {adminUser && (
                    <div className="bg-amber-600 text-white px-4 py-2 flex justify-between items-center text-sm font-bold shadow-lg animate-in slide-in-from-top duration-300 relative z-[60]">
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={16} />
                        <span>Impersonando: <span className="underline">{user.name}</span> ({user.username})</span>
                      </div>
                      <button onClick={handleBackToAdmin} className="bg-white text-amber-600 px-3 py-1 rounded-lg hover:bg-amber-50 transition-colors flex items-center gap-1.5">
                        <LogOut size={14} /> Torna ad Admin
                      </button>
                    </div>
                  )}
                  <Routes>
                    <Route path="/" element={<HomeView user={user} isSuperAdmin={isSuperAdmin} />} />
                    <Route path="/reports" element={<ReportsView user={user} />} />
                    <Route path="/work-summary" element={user.role === 'admin' ? <WorkSummaryView user={user} /> : <Navigate to="/" />} />
                    <Route path="/clients" element={user.role === 'admin' ? <ClientsView /> : <Navigate to="/" />} />
                    <Route path="/projects" element={user.role === 'admin' ? <ProjectsView /> : <Navigate to="/" />} />
                    <Route path="/subcontractors" element={user.role === 'admin' ? <SubcontractorsView /> : <Navigate to="/" />} />
                    <Route path="/personnel" element={user.role === 'admin' ? <PersonnelView onImpersonate={handleImpersonate} /> : <Navigate to="/" />} />
                    <Route path="/companies" element={isSuperAdmin ? <CompaniesView /> : <Navigate to="/" />} />
                    <Route path="/profile" element={<ProfileView user={user} onUpdate={(updated) => { setUser(updated); localStorage.setItem('ws_auth', JSON.stringify(updated)); }} />} />
                    <Route path="/help" element={<HelpView user={user} />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </AppLayout>
              )
            } 
          />
        </Routes>
      </HashRouter>
    </LanguageContext.Provider>
  );
};

export default App;   // ✔ QUI È IL POSTO GIUSTO

