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
  HardHat,
  Building2,
  FileDown,
  FileSpreadsheet,
  ClipboardList,
  ShieldAlert,
  UserPlus,
  Eye,
  EyeOff,
  ChevronRight
} from 'lucide-react';
import { db } from './services/dbService';
import { User, Role, UserStatus, Client, Project, WorkReport, Subcontractor, AdditionalWorker, Expense } from './types';
import { translations, Language } from './translations';
import { exportToPDF, exportToExcel } from './services/exportService';

// --- i18n Context ---
const LanguageContext = createContext<{
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
const inputClasses = "flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 shadow-sm text-sm disabled:bg-slate-50";
const modalClasses = "bg-white rounded-2xl p-5 w-full max-w-4xl relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[95vh]";

const FullWidthField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = "" }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{label}:</label>
    {children}
  </div>
);

// --- Navigation Config ---
const getNavLinks = (t: any) => [
  { name: t('clients'), path: '/clients', icon: Users, roles: ['admin'], color: 'bg-emerald-500' },
  { name: t('projects'), path: '/projects', icon: Briefcase, roles: ['admin'], color: 'bg-amber-500' },
  { name: t('personnel'), path: '/personnel', icon: ShieldAlert, roles: ['admin'], color: 'bg-rose-500' },
  { name: t('subcontractors'), path: '/subcontractors', icon: Building2, roles: ['admin'], color: 'bg-cyan-500' },
  { name: t('reports'), path: '/reports', icon: FileText, roles: ['admin', 'operator', 'supervisor'], color: 'bg-blue-500' },
  { name: t('workSummary'), path: '/work-summary', icon: ClipboardList, roles: ['admin'], color: 'bg-indigo-500' },
];

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

// --- Layout ---
const AppLayout: React.FC<{ user: User, onLogout: () => void, children: React.ReactNode }> = ({ user, onLogout, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const navLinks = getNavLinks(t);
  const filteredLinks = navLinks.filter(link => link.roles.includes(user.role));

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex flex-col h-full py-6">
      <div className="px-6 mb-8 flex items-center gap-2">
        <Link to="/" onClick={onItemClick} className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200"><HardHat className="w-6 h-6 text-white" /></div>
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
const HomeView: React.FC<{ user: User }> = ({ user }) => {
  const { t } = useTranslation();
  const links = getNavLinks(t).filter(l => l.roles.includes(user.role));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="text-left">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {t('welcome')}, {user.name}
        </h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{t('activityManagement')}</p>
      </div>

      <div className="flex flex-col gap-4 max-w-2xl mx-auto items-stretch">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 group flex items-center gap-5 text-left"
          >
            <div className={`${link.color} w-14 h-14 rounded-2xl text-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0`}>
              <link.icon size={28} strokeWidth={2} />
            </div>
            <span className="font-extrabold text-slate-800 text-lg group-hover:text-blue-600 transition-colors uppercase tracking-tight flex-1">{link.name}</span>
            <ChevronRight className="text-slate-300 group-hover:text-blue-500 w-6 h-6 transition-colors" />
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
  }, [summary, filters, projects]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, s) => ({
      hours: acc.hours + s.totalHours,
      personnelCost: acc.personnelCost + (s.personnelCost || 0),
      subcontractCost: acc.subcontractCost + (s.subcontractorCost || 0),
      totalCost: acc.totalCost + s.cost
    }), { hours: 0, personnelCost: 0, subcontractCost: 0, totalCost: 0 });
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
        dates: new Set<string>()
      });
      const proj = map.get(key);
      proj.hours += s.totalHours;
      proj.totalCost += s.cost;
      proj.dates.add(s.date);
    });
    return Array.from(map.values()).map(p => ({
      ...p,
      dateDisplay: p.dates.size === 1 ? Array.from(p.dates)[0] : 'Periodo'
    })).sort((a, b) => b.totalCost - a.totalCost);
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
        hours: s.totalHours,
        hourlyCost: s.hourlyCost || 0,
        cost: s.cost || 0,
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
      return {
        date: formattedDate,
        projectName: s.projectName,
        clientName: s.clientName,
        workerName: s.userName,
        hours: s.totalHours,
        hourlyCost: s.hourlyCost || 0,
        cost: s.cost || 0,
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
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={handleExportExcel} className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-all">
            <FileSpreadsheet size={16} className="mr-2" /> {t('exportExcelBtn')}
          </button>
          <button onClick={handleExportPDF} className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all">
            <FileDown size={16} className="mr-2" /> {t('exportPDFBtn')}
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5 flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Menu size={14} /> {t('filtersAndData')}
          </h3>
          <button onClick={() => setFilters({ clientId: '', projectId: '', userId: '', subcontractorId: '', dateFrom: '', dateTo: '' })} className="text-[10px] items-center font-bold px-3 py-1 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors uppercase">
            {t('clearFilters')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{t('client')}</label>
            <select value={filters.clientId} onChange={e => setFilters({ ...filters, clientId: e.target.value })} className={inputClasses}>
              <option value="">{t('allClients')}</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{t('project')}</label>
            <select value={filters.projectId} onChange={e => setFilters({ ...filters, projectId: e.target.value })} className={inputClasses}>
              <option value="">{t('allProjects')}</option>
              {projects.filter(p => !filters.clientId || p.clientId === filters.clientId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{t('workerLabel')}</label>
            <select value={filters.userId} onChange={e => setFilters({ ...filters, userId: e.target.value })} className={inputClasses}>
              <option value="">{t('allWorkers')}</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{t('summarySubcontractorCompany')}</label>
            <select value={filters.subcontractorId} onChange={e => setFilters({ ...filters, subcontractorId: e.target.value })} className={inputClasses}>
              <option value="">{t('summaryAllCompanies')}</option>
              {subcontractors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{t('dateFrom')}</label>
            <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} className={inputClasses} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{t('dateTo')}</label>
            <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} className={inputClasses} />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight shrink-0">{t('adminStatusTitle')}</label>
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              <button onClick={() => setAdminStatus('Tutti')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${adminStatus === 'Tutti' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t('statusAll')}</button>
              <button onClick={() => setAdminStatus('Fatturato')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${adminStatus === 'Fatturato' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t('statusInvoiced')}</button>
              <button onClick={() => setAdminStatus('Pagato')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${adminStatus === 'Pagato' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t('statusPaid')}</button>
              <button onClick={() => setAdminStatus('Pending')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${adminStatus === 'Pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t('statusPending')}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 flex flex-wrap lg:flex-nowrap justify-between items-center p-4 gap-6 shadow-sm">
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('summaryHoursWorked')}</span>
          <span className="text-lg font-black text-slate-800">{totals.hours.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} h</span>
        </div>
        <div className="hidden lg:block w-px h-10 bg-slate-100"></div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('summaryPersonnelCost')}</span>
          <span className="text-lg font-black text-slate-800">{formatCurrency(totals.personnelCost)}</span>
        </div>
        <div className="hidden lg:block w-px h-10 bg-slate-100"></div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('summarySubcontractCost')}</span>
          <span className="text-lg font-black text-slate-800">{formatCurrency(totals.subcontractCost)}</span>
        </div>
        <div className="hidden lg:block w-px h-10 bg-slate-100"></div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{t('summaryTotalGeneral')}</span>
          <span className="text-2xl font-black text-blue-600">{formatCurrency(totals.totalCost)}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">{t('summaryProjectSummary')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider whitespace-nowrap">{t('headerDate')}</th>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">{t('summaryProjectName')}</th>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">{t('headerClient')}</th>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-right whitespace-nowrap">{t('totalHours')}</th>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-right whitespace-nowrap">{t('summaryTotalCost')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupedByProject.length > 0 ? groupedByProject.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-blue-600 whitespace-nowrap capitalize">{
                    p.dateDisplay !== 'Periodo'
                      ? new Intl.DateTimeFormat(localeMap[lang as string] || 'it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(p.dateDisplay as string))
                      : t('summaryPeriod')
                  }</td>
                  <td className="px-4 py-4 font-bold text-slate-900">{p.name}</td>
                  <td className="px-4 py-4 text-slate-600 text-xs font-semibold">{p.clientName}</td>
                  <td className="px-4 py-4 font-black text-slate-700 text-right">{p.hours.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} h</td>
                  <td className="px-4 py-4 font-black text-slate-900 text-right">{formatCurrency(p.totalCost)}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 font-medium">{t('noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div >
  );
};


// --- Personnel View ---
const PersonnelView: React.FC = () => {
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
    extraCost: 0,
    phone: '',
    address: '',
    notes: '',
    subcontractorId: ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData, subcontractorId: formData.subcontractorId || undefined };
    if (editingId) {
      await db.updateUser(editingId, data);
    } else {
      await db.addUser(data);
    }
    setUsers(await db.getUsers());
    setIsModalOpen(false);
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <FullWidthField label={t('person.name')}>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('person.type')}>
                  <select value={formData.subcontractorId} onChange={e => setFormData({ ...formData, subcontractorId: e.target.value })} className={inputClasses}>
                    <option value="">{t('person.internal')}</option>
                    {subcontractors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </FullWidthField>
                <FullWidthField label={t('person.role')}>
                  <select required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as Role })} className={inputClasses}>
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
                {/* Username and Password only for Internal personnel */}
                {!formData.subcontractorId && (
                  <>
                    <FullWidthField label={t('person.username')}>
                      <input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className={inputClasses} />
                    </FullWidthField>
                    <FullWidthField label={t('person.password')}>
                      <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className={inputClasses} />
                    </FullWidthField>
                  </>
                )}
                <div className="md:col-span-2">
                  <FullWidthField label={t('person.address')}>
                    <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className={inputClasses} />
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [p, c] = await Promise.all([db.getProjects(), db.getClients()]);
      setProjects(p);
      setClients(c.filter((cl: Client) => cl.status === 'active'));
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
    sellingPrice: 0
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
      sellingPrice: p.sellingPrice || 0
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
    if (editingId) {
      await db.updateProject(editingId, formData);
    } else {
      await db.addProject(formData);
    }
    setProjects(await db.getProjects());
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      clientId: '',
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
      sellingPrice: 0
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('projects')}</h1>
        <button onClick={resetForm} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
          <Plus size={16} className="mr-2 inline" /> {t('newProject')}
        </button>
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
                  <h3 className="font-bold text-slate-900 text-lg truncate">{p.name}</h3>
                  <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5 truncate">{client?.name || '---'}</p>
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
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? t('editProject') : t('newProject')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <FullWidthField label={t('project.client')}>
                  <select required value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })} className={inputClasses}>
                    <option value="">{t('select')}</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
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
                <FullWidthField label={t('project.billingType')}>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setFormData({ ...formData, financialAgreement: 'hourly' })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.financialAgreement === 'hourly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('project.billingHourly')}</button>
                    <button type="button" onClick={() => setFormData({ ...formData, financialAgreement: 'fixed' })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.financialAgreement === 'fixed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('project.billingFixed')}</button>
                  </div>
                </FullWidthField>
                <FullWidthField label={t('project.amount')}>
                  <div className="relative flex items-center">
                    <input type="number" step="0.01" value={formData.sellingPrice} onChange={e => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })} className={inputClasses} />
                  </div>
                </FullWidthField>
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
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? t('editSubcontractor') : t('newSubcontractor')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
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
                    <textarea rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={inputClasses} placeholder={t('placeholderNotes')} />
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
  const [formData, setFormData] = useState({
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '17:00',
    breakHours: 1,
    manualTotalHours: undefined as number | undefined,
    description: '',
    expenses: [] as Expense[],
    additionalWorkers: [] as AdditionalWorker[],
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
  const currentHelpersTotalHours = formData.additionalWorkers.reduce((sum, aw) => sum + (aw.manualTotalHours !== undefined ? aw.manualTotalHours : db.calculateTotalHours(aw.startTime, aw.endTime, aw.breakHours)), 0);
  const globalTotalHours = currentMainWorkerHours + currentHelpersTotalHours;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, userId: user.id, notes: '', teamTotalHours: globalTotalHours };
    try {
      if (editingId) await db.updateReport(editingId, payload as any); else await db.addReport(payload as any);
      setReports(await db.getReports(user.id, user.role));
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert("Errore durante il salvataggio: " + JSON.stringify(err));
    }
  };

  const handleEdit = (r: WorkReport) => {
    setEditingId(r.id);
    setFormData({
      projectId: r.projectId,
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      breakHours: r.breakHours,
      manualTotalHours: r.manualTotalHours,
      description: r.description,
      expenses: [...r.expenses],
      additionalWorkers: [...r.additionalWorkers],
      invoiceStatus: r.invoiceStatus || 'Pending'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDelete'))) {
      await db.deleteReport(id);
      setReports(await db.getReports(user.id, user.role));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('reports')}</h1>
        <button onClick={() => {
          setEditingId(null);
          setFormData({
            projectId: '',
            date: new Date().toISOString().split('T')[0],
            startTime: '08:00',
            endTime: '17:00',
            breakHours: 1,
            manualTotalHours: undefined,
            description: '',
            expenses: [],
            additionalWorkers: [],
            invoiceStatus: 'Pending'
          });
          setIsModalOpen(true);
        }} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all"><Plus size={16} className="mr-2 inline" /> {t('newReport')}</button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">{t('date')}</th>
                <th className="p-4 font-semibold">{t('project')}</th>
                <th className="p-4 font-semibold text-center">{t('peopleLabel')}</th>
                <th className="p-4 font-semibold text-center">{t('totalHoursLabel')}</th>
                <th className="p-4 font-semibold text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map(r => {
                const proj = projects.find(p => p.id === r.projectId);
                const dateObj = new Date(r.date);
                const formattedDate = new Intl.DateTimeFormat(localeMap[lang as string] || 'it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(dateObj);
                const totalWorkersCount = 1 + (r.additionalWorkers || []).length;
                const totalCombinedHours = (r.totalHours + (r.additionalWorkers || []).reduce((s, aw) => s + aw.totalHours, 0)).toFixed(2);

                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 text-sm font-semibold text-blue-600 whitespace-nowrap capitalize">{formattedDate}</td>
                    <td className="p-4 text-sm font-medium text-slate-900 max-w-[200px] truncate">{proj?.name || '---'}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-xs">
                        {totalWorkersCount}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg text-xs border border-blue-100">
                        {totalCombinedHours}h
                      </span>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleEdit(r)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Modifica"><Pencil size={18} /></button>
                        <button onClick={() => handleDelete(r.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Elimina"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Nessun dato disponibile
                  </td>
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
            <div className="flex justify-between items-center mb-6 border-b pb-4"><h2 className="text-xl font-bold text-slate-900">{editingId ? t('editReport') : t('newReport')}</h2><button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FullWidthField label={t('project')}><select required value={formData.projectId} onChange={e => setFormData({ ...formData, projectId: e.target.value })} className={inputClasses}><option value="">{t('select')}</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></FullWidthField>
                <FullWidthField label={t('date')}><input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className={inputClasses} /></FullWidthField>
                <div className="md:col-span-2"><FullWidthField label={t('description')}><textarea required rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={inputClasses} /></FullWidthField></div>

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

                <div className="md:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {editingId ? (personnel.find(u => u.id === reports.find(r => r.id === editingId)?.userId)?.name || t('mainWorker')) : user.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{t('totalHoursLabel')}:</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.manualTotalHours !== undefined ? formData.manualTotalHours : ''}
                        onChange={e => setFormData({ ...formData, manualTotalHours: e.target.value === "" ? undefined : parseFloat(e.target.value) })}
                        placeholder={db.calculateTotalHours(formData.startTime, formData.endTime, formData.breakHours).toFixed(2)}
                        className="w-20 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-black text-blue-600 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FullWidthField label={t('startTime')}><input type="time" required value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className={inputClasses} /></FullWidthField>
                    <FullWidthField label={t('endTime')}><input type="time" required value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className={inputClasses} /></FullWidthField>
                    <FullWidthField label={t('breakHoursLabel')}><input type="number" step="0.25" value={formData.breakHours} onChange={e => setFormData({ ...formData, breakHours: parseFloat(e.target.value) || 0 })} className={inputClasses} /></FullWidthField>
                  </div>
                </div>

                {/* Sezione Collaboratori */}
                <div className="md:col-span-2 space-y-4 border-t pt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <UserPlus size={16} className="text-blue-500" /> {t('teamLabel')}
                    </h3>
                    <button type="button" onClick={addWorker} className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors">
                      <Plus size={14} /> {t('addWorker')}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.additionalWorkers.map((aw, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-end shadow-sm relative pr-12">
                        <div className="flex-1 min-w-[200px]">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase mb-1 block">{t('workerLabel')}</label>
                          <select required value={aw.userId} onChange={e => updateWorker(idx, { userId: e.target.value })} className={inputClasses + " w-full"}><option value="">{t('select')}</option>{personnel.filter(u => u.id !== user.id).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                        </div>
                        <div className="w-24"><label className="text-[10px] font-extrabold text-slate-400 uppercase mb-1 block">{t('startTime')}</label><input type="time" value={aw.startTime} onChange={e => updateWorker(idx, { startTime: e.target.value })} className={inputClasses} /></div>
                        <div className="w-24"><label className="text-[10px] font-extrabold text-slate-400 uppercase mb-1 block">{t('endTime')}</label><input type="time" value={aw.endTime} onChange={e => updateWorker(idx, { endTime: e.target.value })} className={inputClasses} /></div>
                        <div className="w-20">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase mb-1 block">{t('hours')}</label>
                          <input
                            type="number"
                            step="0.01"
                            value={aw.manualTotalHours !== undefined ? aw.manualTotalHours : ''}
                            onChange={e => updateWorker(idx, { manualTotalHours: e.target.value === "" ? undefined : parseFloat(e.target.value) })}
                            placeholder={db.calculateTotalHours(aw.startTime, aw.endTime, aw.breakHours).toFixed(2)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-right font-black text-blue-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          />
                        </div>
                        <button type="button" onClick={() => removeWorker(idx)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>
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
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-8"><button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors">{t('cancel')}</button><button type="submit" className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">{editingId ? t('update') : t('save')}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Login & Registration View ---
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
      const user = await db.loginUser(username);

      if (!user || user.password !== password) {
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
          <div className="bg-blue-600 p-4 rounded-2xl mb-4 shadow-lg shadow-blue-200">
            <HardHat className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Jobs<span className="text-blue-600">Report</span></h1>
        </div>
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
      </div>
    </div>
  );
};


// --- SuperAdmin Component ---
const SuperAdminPanel: React.FC = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    adminName: '',
    username: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await db.registerCompany(formData.companyName, formData.adminName, formData.username, formData.password);
      alert('Ditta creata con successo!');
      setIsModalOpen(false);
      setFormData({ companyName: '', adminName: '', username: '', password: '' });
    } catch (err: any) {
      alert(`Errore: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 group">
        <div className="bg-purple-100 p-2 rounded-lg text-purple-600 group-hover:bg-purple-200 transition-colors">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-bold text-purple-700 group-hover:text-purple-800 tracking-tight">{t('superAdminPanel')}</p>
        </div>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={modalClasses}>
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-slate-900">{t('createCompanyBtn')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FullWidthField label="Nome Ditta">
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
                  {isSubmitting ? 'Creazione in corso...' : t('createCompanyBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
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
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('ws_lang') as Language) || 'it');

  useEffect(() => { localStorage.setItem('ws_lang', lang); }, [lang]);

  useEffect(() => {
    if (user && user.id) {
      db.checkIsSuperAdmin(user.id).then(setIsSuperAdmin).catch(console.error);
    } else {
      setIsSuperAdmin(false);
    }
  }, [user]);

  const handleLogin = (u: User) => {
    db.setCompanyId(u.companyId || (u as any).company_id);
    setUser(u);
    localStorage.setItem('ws_auth', JSON.stringify(u));
  };
  const handleLogout = () => {
    db.setCompanyId(null);
    setUser(null);
    localStorage.removeItem('ws_auth');
    setIsSuperAdmin(false);
  };

  const t = (key: keyof typeof translations['it']): string => {
    const currentTranslations = translations[lang] || translations['it'];
    return (currentTranslations as any)[key] || (translations['it'] as any)[key] || key;
  };

  const contextValue = useMemo(() => ({ lang, setLang, t }), [lang]);

  if (!user) {
    return (
      <LanguageContext.Provider value={contextValue}>
        <AuthView onLogin={handleLogin} />
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      <HashRouter>
        <AppLayout user={user} onLogout={handleLogout}>
          {isSuperAdmin && (
            <div className="fixed top-20 right-8 z-[60] bg-white rounded-2xl shadow-xl border-2 border-purple-200 p-2">
              <SuperAdminPanel />
            </div>
          )}
          <Routes>
            <Route path="/" element={<HomeView user={user} />} />
            <Route path="/reports" element={<ReportsView user={user} />} />
            <Route path="/work-summary" element={user.role === 'admin' ? <WorkSummaryView user={user} /> : <Navigate to="/" />} />
            <Route path="/clients" element={user.role === 'admin' ? <ClientsView /> : <Navigate to="/" />} />
            <Route path="/projects" element={user.role === 'admin' ? <ProjectsView /> : <Navigate to="/" />} />
            <Route path="/subcontractors" element={user.role === 'admin' ? <SubcontractorsView /> : <Navigate to="/" />} />
            <Route path="/personnel" element={user.role === 'admin' ? <PersonnelView /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AppLayout>
      </HashRouter>
    </LanguageContext.Provider>
  );
};

export default App;   // ✔ QUI È IL POSTO GIUSTO

