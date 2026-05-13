
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { supabase } from './services/supabase';
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
  AlertCircle,
  Eye,
  Download,
  Copy,
  Search,
  Filter,
  Mail,
  HelpCircle,
  CheckCircle2,
  Lock,
  Settings,
  MapPin,
  Phone,
} from 'lucide-react';
import { db } from './services/dbService';
import { authService } from './services/authService';
import { User, Role, UserStatus, Client, Project, WorkReport, Subcontractor, AdditionalWorker, Expense } from './types';
import { Language } from './i18n';
import { useTranslation, localeMap } from './contexts/LanguageContext';
import { exportToPDF, exportToExcel } from './services/exportService';
import logoImg from './assets/logo.png';
import { useSubcontractors } from './hooks/useSubcontractors';
import { useClients } from './hooks/useClients';
import { useProjects } from './hooks/useProjects';
import { useReports } from './hooks/useReports';
import { useSummary } from './hooks/useSummary';
import { useUsers } from './hooks/useUsers';
import ProfileView from './pages/ProfileView';
import ResetPasswordView from './pages/ResetPasswordView';
import Tooltip from './components/common/Tooltip';
import { useComplianceReportController } from './hooks/useComplianceReportController';
import { useSubscription } from './hooks/useSubscription';

// --- Local Components ---
import PresentationView from './PresentationView';
import LoginView from './LoginView';
import PrivacyView from './PrivacyView';
import TermsView from './TermsView';
import { RegistrationRequestView } from './RegistrationRequestView';
import CompaniesView from './pages/CompaniesView';
import { UpgradeModal } from './components/UpgradeModal';
import { ComplianceReportModal } from './components/ComplianceReportModal';
import OnboardingGuide from './components/OnboardingGuide';
import AIChatAssistant from './components/AIChatAssistant';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import CommunicationsHub from './components/CommunicationsHub';
import HelpView from './pages/HelpView';

export const canUserAccessProject = (project: Partial<Project>, userId: string) => {
  if (!project.assignedWorkerIds || project.assignedWorkerIds.length === 0) return true;
  return project.assignedWorkerIds.includes(userId);
};

// --- Shared Styles ---
export const inputClasses = "flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 shadow-sm text-sm disabled:bg-slate-50";
export const filterInputClasses = "flex-1 px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 shadow-sm text-xs disabled:bg-slate-50";
export const modalClasses = "bg-white sm:rounded-3xl p-4 sm:p-8 w-full h-full sm:h-auto sm:max-w-4xl relative z-10 shadow-2xl animate-in sm:zoom-in-95 duration-300 overflow-y-auto sm:max-h-[95vh]";

export const FullWidthField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = "" }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{label}:</label>
    {children}
  </div>
);

// --- Navigation Config ---
const getNavLinks = (t: any, user: User | null) => {
  const isSA = user?.role?.toLowerCase() === 'superadmin';

  const links = [
    { name: t('dashboard.companiesManagement'), path: '/companies', icon: Building2, show: isSA, color: 'bg-blue-600' },
    { name: t('common.clients'), path: '/clients', icon: Users, show: !isSA && (user?.role === 'admin' || user?.role === 'supervisor'), color: 'bg-emerald-500' },
    { name: t('common.personnel'), path: '/personnel', icon: ShieldAlert, show: !isSA && (user?.role === 'admin' || user?.role === 'supervisor'), color: 'bg-rose-500' },
    { name: t('common.projects'), path: '/projects', icon: Briefcase, show: !isSA && authService.can(user, 'read', 'projects'), color: 'bg-amber-500' },
    { name: t('common.internalCommMenu'), path: '/communications', icon: Mail, show: !isSA && authService.can(user, 'read', 'communications'), color: 'bg-blue-600', premiumOnly: true },
    { name: t('common.subcontractors'), path: '/subcontractors', icon: Building2, show: !isSA && authService.canAccessAdmin(user), color: 'bg-cyan-500' },
    { name: t('common.reports'), path: '/reports', icon: FileText, show: !isSA && authService.can(user, 'read', 'reports'), color: 'bg-blue-500' },
    { name: t('common.workSummary'), path: '/work-summary', icon: ClipboardList, show: !isSA && authService.can(user, 'approve', 'reports'), color: 'bg-indigo-500' },
    { name: t('auth.profile'), path: '/profile', icon: UserIcon, show: !!user, color: 'bg-slate-600' },
    { name: t('common.help'), path: '/help', icon: HelpCircle, show: !isSA && !!user, color: 'bg-blue-600' }
  ];

  return links.filter(l => l.show);
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
        <span>{t('common.installApp')}</span>
      </button>
    );
  }

  return (
    <button onClick={install} className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all text-sm mb-4">
      <Download className="w-4 h-4" />
      {t('common.installApp')}
    </button>
  );
};

// --- Layout ---
const AppLayout: React.FC<{
  user: User,
  isSuperAdmin: boolean,
  onLogout: () => void,
  children: React.ReactNode,
  isMobileMenuOpen: boolean,
  setIsMobileMenuOpen: (open: boolean) => void,
  unreadCount: number,
  setUser: (user: User | null) => void
}> = ({ user, onLogout, children, isMobileMenuOpen, setIsMobileMenuOpen, unreadCount, setUser }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { hasFeature } = useSubscription();

  // Close mobile menu automatically on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, setIsMobileMenuOpen]);

  const filteredLinks = getNavLinks(t, user);

  const renderSidebarContent = (onItemClick?: () => void) => (
    <div className="flex flex-col h-full py-6">
      <div className="px-6 mb-8 flex items-center gap-2">
        <Link to="/home" onClick={onItemClick} className="flex items-center gap-2">
          <img src={logoImg} alt="Jobs Report" className="w-10 h-10 object-contain" style={{ borderRadius: '8px', mixBlendMode: 'multiply', overflow: 'hidden' }} />
          <span className="font-extrabold text-xl text-slate-900 tracking-tight">Jobs<span className="text-blue-600">Report</span></span>
        </Link>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {filteredLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            onClick={onItemClick}
            data-onboarding={`sidebar-${link.path.replace('/', '')}`}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${location.pathname === link.path ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <link.icon className={`w-5 h-5 ${location.pathname === link.path ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
            <span className="truncate">{link.name}</span>
            {(link as any).premiumOnly && !hasFeature('communications') ? (
              <Lock size={12} className="ml-auto text-slate-300" />
            ) : (
              link.path === '/communications' && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                  {unreadCount}
                </span>
              )
            )}
          </Link>
        ))}
      </nav>
      <div className="px-3 pt-6 border-t border-slate-100">
        <div className="px-4 py-2 mb-2 bg-slate-50 rounded-xl opacity-60">
          <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
            <span>JobsReport Engine</span>
            <span className="text-blue-500">Build 82a70b5+</span>
          </div>
        </div>
        <button onClick={onLogout} className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t('common.logout')}</span>
        </button>
        <InstallButton variant="sidebar" />
        <Link
          to="/privacy"
          className="flex items-center justify-center mt-2 py-2 text-[10px] font-bold text-slate-300 hover:text-slate-500 uppercase tracking-widest transition-colors"
        >
          {t('common.privacy')}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden md:block w-64 bg-white border-r border-slate-200 sticky top-0 h-screen">{renderSidebarContent()}</aside>
      {isMobileMenuOpen && !document.querySelector('.onboarding-active') && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm shadow-xl z-[65]" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
      <div className={`fixed inset-y-0 left-0 w-full sm:w-72 bg-white shadow-2xl transform transition-transform duration-300 z-[70] lg:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {renderSidebarContent(() => setIsMobileMenuOpen(false))}
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-50 relative">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"><Menu className="w-6 h-6" /></button>

            {/* Mobile Company Name (Left Aligned) */}
            <span className="lg:hidden text-sm font-bold text-slate-900 uppercase tracking-tight truncate max-w-[50vw]">
              {user.companyName}
            </span>

            <h2 className="text-sm font-semibold text-slate-500 hidden lg:block uppercase tracking-wider">
              {filteredLinks.find(l => l.path === location.pathname)?.name || (location.pathname === '/' ? t('common.welcome') : '')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSelector />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">{user.name}</p>
                <div className="flex flex-col items-end mt-1">
                  {user.availableCompanies && user.availableCompanies.length > 1 ? (
                    <select
                      value={user.companyId || ''}
                      onChange={(e) => {
                        const newId = e.target.value;
                        const selected = user.availableCompanies?.find(c => c.id === newId);
                        if (selected) {
                          db.setCompanyId(newId);
                          const updated = { ...user, companyId: selected.id, companyName: selected.name, role: selected.role };
                          setUser(updated);
                          localStorage.setItem('ws_auth', JSON.stringify(updated));
                          window.location.reload(); // Refresh all hooks with new context
                        }
                      }}
                      className="text-[10px] font-extrabold text-blue-600 bg-blue-50 border-none rounded px-1.5 py-0.5 outline-none cursor-pointer hover:bg-blue-100 transition-colors uppercase tracking-tight"
                    >
                      {user.availableCompanies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-[10px] font-extrabold text-blue-600 leading-none uppercase tracking-tight">
                      {user.companyName}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 capitalize bg-slate-50 px-1.5 py-0.5 rounded mt-0.5 border border-slate-100 font-medium">
                    {t(`projects.role${user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()}` as any)}
                  </p>
                </div>
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

// --- Compact Dashboard component ---
const CompactDashboard: React.FC = () => {
  const { t, lang } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingReports: 0,
    pendingHours: 0,
    pendingExpenses: 0,
    pendingToInvoice: 0,
    pendingMargin: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      const [summary, allProjects] = await Promise.all([
        db.getSummary(),
        db.getProjects()
      ]);

      const activeProjectsCount = allProjects.filter(p => p.status?.toUpperCase() === 'ATTIVO' || p.status?.toLowerCase() === 'active').length;
      const pendingData = summary.filter(s => (s.invoiceStatus || 'Pending') === 'Pending');

      const pendingReports = new Set(pendingData.map(s => s.id.split('_')[0])).size;
      const pendingHours = pendingData.reduce((acc, s) => acc + (s.totalHours || 0), 0);
      const pendingExpenses = pendingData.reduce((acc, s) => acc + (s.cost || 0) + (s.totalExpenses || 0), 0);
      const pendingToInvoice = pendingData.reduce((acc, s) => acc + (s.revenue || 0), 0);
      const pendingMargin = pendingToInvoice - pendingExpenses;

      setStats({
        activeProjects: activeProjectsCount,
        pendingReports,
        pendingHours,
        pendingExpenses,
        pendingToInvoice,
        pendingMargin
      });
      setLoading(false);
    };
    loadStats();
  }, []);

  const SmallStat = ({ label, value, to, valueColor = "text-slate-900", isLoading }: { label: string, value: string | number, to: string, valueColor?: string, isLoading?: boolean }) => (
    <Link to={to} className="flex flex-col py-1 px-2 hover:bg-slate-50 rounded transition-colors overflow-hidden">
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight leading-none mb-0.5 truncate">{label}</span>
      {isLoading ? (
        <span className="inline-block w-8 h-3 bg-slate-100 animate-pulse rounded" />
      ) : (
        <span className={`text-sm font-black tracking-tight truncate ${valueColor}`}>{value}</span>
      )}
    </Link>
  );

  const formatNum = (val: number) => val.toLocaleString(localeMap[lang], { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-2 ml-0.5">
        <h2 className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{t('dashboard.worksInProgress')}</h2>
      </div>

      <div className="divide-y divide-slate-100">
        {/* Row 1: Counters */}
        <div className="grid grid-cols-3 gap-1 pb-1.5">
          <SmallStat label={t('common.projects')} value={stats.activeProjects} to="/projects" isLoading={loading} />
          <SmallStat label={t('common.reports')} value={stats.pendingReports} to="/reports" isLoading={loading} />
          <SmallStat label={t('common.hours')} value={stats.pendingHours.toLocaleString(localeMap[lang], { maximumFractionDigits: 1 })} to="/reports" isLoading={loading} />
        </div>

        {/* Row 2: Economic Values */}
        <div className="grid grid-cols-3 gap-1 pt-1.5">
          <SmallStat label={t('dashboard.estimatedExpenses')} value={formatNum(stats.pendingExpenses)} to="/work-summary" valueColor="text-rose-600" isLoading={loading} />
          <SmallStat label={t('dashboard.toInvoice')} value={formatNum(stats.pendingToInvoice)} to="/work-summary" valueColor="text-blue-600" isLoading={loading} />
          <SmallStat label={t('dashboard.margin')} value={formatNum(stats.pendingMargin)} to="/work-summary" valueColor={stats.pendingMargin >= 0 ? "text-emerald-600" : "text-rose-600"} isLoading={loading} />
        </div>
      </div>
    </div>
  );
};

// --- Pending Hours Card for Workers ---
const PendingHoursCard: React.FC<{ user: User }> = ({ user }) => {
  const { t, lang } = useTranslation();
  const [hours, setHours] = useState<number | null>(null);

  useEffect(() => {
    db.getReports().then(reports => {
      // Filtriamo solo i rapportini in stato "Pending" (non ancora pagati)
      const filtered = reports.filter(r => (r.invoiceStatus || 'Pending') === 'Pending');
      const total = filtered.reduce((sum: number, r: any) => {
        let h = 0;
        if (r.userId === user.id) h += (r.totalHours || 0);
        const aw = r.additionalWorkers?.find((w: any) => w.userId === user.id);
        if (aw) h += (aw.totalHours || 0);
        return sum + h;
      }, 0);
      setHours(total);
    }).catch(console.error);
  }, [user.id, user.role]);

  if (hours === null) return null;

  return (
    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm mb-4 flex items-center justify-between group hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-amber-50 rounded-md flex items-center justify-center text-amber-600">
          <Clock size={16} />
        </div>
        <div>
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{t('common.pendingHoursSummary')}</h3>
          <p className="text-[10px] font-medium text-slate-400 mt-0.5">{t('reports.pendingStatusSubtitle')}</p>
        </div>
      </div>
      <div className="text-xl font-black text-amber-600">
        {hours.toLocaleString(localeMap[lang], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        <span className="text-[10px] font-bold ml-0.5 text-slate-400">h</span>
      </div>
    </div>
  );
};

// --- Home View (Launcher) ---
const HomeView: React.FC<{ user: User, isSuperAdmin: boolean }> = ({ user, isSuperAdmin }) => {
  const { t, lang } = useTranslation();
  const actions = getNavLinks(t, user);

  const handleManualLogout = () => {
    db.setCompanyId(null);
    localStorage.removeItem('ws_auth'); supabase.auth.signOut();
    localStorage.removeItem('ws_auth_admin');
    window.location.reload();
  };

  return (
    <div className="max-w-5xl mx-auto py-4 px-2 sm:px-4 animate-in fade-in duration-500">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-slate-100 pb-2">
        <div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight">
            {t('common.welcome')}, {user.name}
          </h1>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {isSuperAdmin ? 'System Administration Console' : t('reports.activityManagement')}
          </p>
        </div>
      </div>

      {isSuperAdmin ? <SuperAdminDashboard /> : (authService.can(user, 'approve', 'reports') ? <CompactDashboard /> : (
        <div className="space-y-4">
          <PendingHoursCard user={user} />
          
          {/* Primary Action Card for Workers */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-200 relative overflow-hidden group mb-6">
            <div className="relative z-10">
              <h2 className="text-2xl font-black mb-2 tracking-tight">
                {lang === 'it' ? 'Pronto per il prossimo rapporto?' : 
                 lang === 'da' ? 'Klar til næste rapport?' : 
                 'Ready for the next report?'}
              </h2>
              <p className="text-blue-100 text-sm mb-8 max-w-xs font-medium opacity-90">
                {lang === 'it' ? 'Registra le tue ore e le attività svolte oggi in pochi secondi.' : 
                 lang === 'da' ? 'Registrer dine timer og aktiviteter udført i dag på få sekunder.' : 
                 'Record your hours and activities performed today in seconds.'}
              </p>
              <Link 
                to="/reports" 
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-600 rounded-2xl font-black shadow-lg hover:scale-105 hover:shadow-white/20 transition-all active:scale-95 uppercase tracking-widest text-xs"
              >
                <Plus size={20} /> {t('reports.new')}
              </Link>
            </div>
            
            {/* Background Decoration Icon */}
            <div className="absolute right-[-20px] bottom-[-40px] opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
              <FileText size={240} />
            </div>
          </div>
        </div>
      ))}

      <div className="mt-6">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
          {isSuperAdmin ? 'Strumenti Rapidi' : t('common.quickMenu')}
        </h3>

        <nav className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2`}>
          {actions.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all group active:scale-[0.99]"
            >
              <div className={`${link.color} p-1.5 rounded-md text-white opacity-90 group-hover:opacity-100 transition-opacity`}>
                <link.icon size={14} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight group-hover:text-blue-600 transition-colors truncate">{link.name}</span>
              </div>
            </Link>
          ))}

          <button
            onClick={handleManualLogout}
            className={`flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-all group active:scale-[0.99]`}
          >
            <div className="bg-slate-100 p-1.5 rounded-md text-slate-400 transition-colors group-hover:bg-red-500 group-hover:text-white">
              <LogOut size={14} />
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight group-hover:text-red-600 transition-colors truncate">{t('common.logout')}</span>
            </div>
          </button>
        </nav>
      </div>
    </div>
  );
};

// --- Work Summary View ---
import { useQueryClient } from '@tanstack/react-query';
const WorkSummaryView: React.FC<{ user: User }> = ({ user }) => {
  const queryClient = useQueryClient();
  const { data: clients = [] } = useClients(user?.companyId ?? undefined, user?.id);
  const { lang, t } = useTranslation();

  const { data: rawSummary = [] } = useSummary(user?.companyId ?? undefined, user?.id);
  const { data: projects = [] } = useProjects(user?.companyId ?? undefined, user?.id);
  const { data: users = [] } = useUsers(user?.companyId ?? undefined, user?.id);
  const { data: subcontractors = [] } = useSubcontractors(user?.companyId ?? undefined, user?.id);

  const summary = React.useMemo(() => {
    if (user.role === 'supervisor') {
      const assignedProjectIds = projects.filter((proj: any) => canUserAccessProject(proj, user.id)).map((proj: any) => proj.id);
      return rawSummary.filter((item: any) => assignedProjectIds.includes(item.projectId));
    }
    return rawSummary;
  }, [rawSummary, projects, user.role, user.id]);

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      proj.totalCost += (s.cost || 0) + (s.totalExpenses || 0);
      proj.totalExpenses += (s.totalExpenses || 0);
      proj.revenue += (s.revenue || 0);
      proj.dates.add(s.date);
    });

    return Array.from(map.values()).map(p => ({
      ...p,
      margin: p.revenue - p.totalCost,
      dateDisplay: p.dates.size === 1 ? Array.from(p.dates)[0] : 'Periodo'
    }));
  }, [filteredData]);

  const formatCurrency = (val: number) => val.toLocaleString(localeMap[lang], { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleDeleteOperation = async (exportType: 'pdf' | 'excel' | 'none') => {
    setIsDeleting(true);
    try {
      if (exportType === 'pdf') {
        const rows = filteredData.map(s => ({
          date: new Date(s.date).toLocaleDateString(localeMap[lang]),
          projectName: s.projectName,
          clientName: s.clientName,
          workerName: s.userName,
          description: s.description || '',
          hours: s.totalHours,
          hourlyCost: 0, cost: s.cost, expenses: s.totalExpenses || 0,
          hourlyRevenue: 0, revenue: s.revenue || 0, 
          paid: s.invoiceStatus === 'Fatturato' ? t('common.statusInvoiced') : 
                s.invoiceStatus === 'Pagato' ? t('common.statusPaid') : 
                t('common.statusPending')
        }));
        exportToPDF(rows, lang, user.name);
      } else if (exportType === 'excel') {
        const rows = filteredData.map(s => ({
          date: new Date(s.date).toLocaleDateString(localeMap[lang]),
          projectName: s.projectName,
          clientName: s.clientName,
          workerName: s.userName,
          description: s.description || '',
          hours: s.totalHours,
          hourlyCost: 0, cost: s.cost, expenses: s.totalExpenses || 0,
          hourlyRevenue: 0, revenue: s.revenue || 0, 
          paid: s.invoiceStatus === 'Fatturato' ? t('common.statusInvoiced') : 
                s.invoiceStatus === 'Pagato' ? t('common.statusPaid') : 
                t('common.statusPending')
        }));
        exportToExcel(rows, lang);
      }

      const idsToDelete = Array.from(new Set(filteredData.map(s => s.id.split('_')[0])));
      await db.deleteReports(idsToDelete);
      setIsArchiveModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    } catch (err: any) {
      alert(t('reports.deleteError') + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4 pt-2">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('common.workSummary')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const rows = filteredData.map(s => ({
                date: new Date(s.date).toLocaleDateString(localeMap[lang]),
                projectName: s.projectName,
                clientName: s.clientName,
                workerName: s.userName,
                description: s.description || '',
                hours: s.totalHours,
                hourlyCost: 0, cost: s.cost, expenses: s.totalExpenses || 0,
                hourlyRevenue: 0, revenue: s.revenue || 0, 
                paid: s.invoiceStatus === 'Fatturato' ? t('common.statusInvoiced') : 
                      s.invoiceStatus === 'Pagato' ? t('common.statusPaid') : 
                      t('common.statusPending')
              }));
              exportToPDF(rows, lang, user.name);
            }}
            className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl shadow-md hover:bg-indigo-700 transition-all uppercase tracking-tight flex items-center gap-1.5"
          >
            <FileDown size={14} /> PDF
          </button>
          <button
            onClick={() => {
              const rows = filteredData.map(s => ({
                date: new Date(s.date).toLocaleDateString(localeMap[lang]),
                projectName: s.projectName,
                clientName: s.clientName,
                workerName: s.userName,
                description: s.description || '',
                hours: s.totalHours,
                hourlyCost: 0, cost: s.cost, expenses: s.totalExpenses || 0,
                hourlyRevenue: 0, revenue: s.revenue || 0, 
                paid: s.invoiceStatus === 'Fatturato' ? t('common.statusInvoiced') : 
                      s.invoiceStatus === 'Pagato' ? t('common.statusPaid') : 
                      t('common.statusPending')
              }));
              exportToExcel(rows, lang);
            }}
            className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-xl shadow-md hover:bg-emerald-700 transition-all uppercase tracking-tight flex items-center gap-1.5"
          >
            <FileSpreadsheet size={14} /> EXCEL
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Filter size={14} /> {t('common.filtersAndData')}
          </h3>
          <button onClick={() => setFilters({ clientId: '', projectId: '', userId: '', subcontractorId: '', dateFrom: '', dateTo: '' })} className="text-[9px] items-center font-extrabold px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md hover:bg-slate-100 transition-colors uppercase">
            {t('reports.clearFilters')}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('projects.client')}</label>
            <select value={filters.clientId} onChange={e => setFilters({ ...filters, clientId: e.target.value })} className={filterInputClasses}>
              <option value="">{t('projects.allClients')}</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('projects.title')}</label>
            <select value={filters.projectId} onChange={e => setFilters({ ...filters, projectId: e.target.value })} className={filterInputClasses}>
              <option value="">{t('reports.allProjects')}</option>
              {projects.filter(p => !filters.clientId || p.clientId === filters.clientId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('reports.worker')}</label>
            <select value={filters.userId} onChange={e => setFilters({ ...filters, userId: e.target.value })} className={filterInputClasses}>
              <option value="">{t('reports.allWorkers')}</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('reports.summarySubcontractorCompany')}</label>
            <select value={filters.subcontractorId} onChange={e => setFilters({ ...filters, subcontractorId: e.target.value })} className={filterInputClasses}>
              <option value="">{t('reports.summaryAllCompanies')}</option>
              {subcontractors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('reports.dateFrom')}</label>
            <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} className={filterInputClasses} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('reports.dateTo')}</label>
            <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} className={filterInputClasses} />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-tight shrink-0">{t('reports.adminStatusTitle')}</label>
            <div className="flex bg-slate-50 p-0.5 rounded-lg w-full sm:w-auto border border-slate-100">
              <button onClick={() => setAdminStatus('Tutti')} className={`flex-1 sm:flex-none px-3 py-1 text-[9px] font-black rounded-md transition-all ${adminStatus === 'Tutti' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{t('common.statusAll')}</button>
              <button onClick={() => setAdminStatus('Pending')} className={`flex-1 sm:flex-none px-3 py-1 text-[9px] font-black rounded-md transition-all ${adminStatus === 'Pending' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{t('common.statusPending')}</button>
              <button onClick={() => setAdminStatus('Fatturato')} className={`flex-1 sm:flex-none px-3 py-1 text-[9px] font-black rounded-md transition-all ${adminStatus === 'Fatturato' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{t('common.statusInvoiced')}</button>
              <button onClick={() => setAdminStatus('Pagato')} className={`flex-1 sm:flex-none px-3 py-1 text-[9px] font-black rounded-md transition-all ${adminStatus === 'Pagato' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{t('common.statusPaid')}</button>
            </div>
          </div>

          {user.role === 'admin' && (
            <div className="flex-shrink-0 w-full sm:w-auto sm:ml-auto">
              <select
                title={t('common.updateStatusTitle')}
                onChange={async (e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const confirmMsg = t('reports.confirmUpdateStatus').replace('{count}', filteredData.length.toString()).replace('{status}', val === 'Pending' ? t('common.statusPending') : val === 'Fatturato' ? t('common.statusInvoiced') : t('common.statusPaid'));
                  if (!window.confirm(confirmMsg)) {
                    e.target.value = '';
                    return;
                  }
                  try {
                    const ids = Array.from(new Set(filteredData.map(s => s.id.split('_')[0])));
                    await db.bulkUpdateInvoiceStatus(ids, val);
                    queryClient.invalidateQueries({ queryKey: ['summary'] });
                  } catch (err: any) {
                    alert(t('reports.updateError') + err.message);
                  }
                  e.target.value = '';
                }}
                className="w-full sm:w-auto px-4 py-1.5 bg-white border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-lg shadow-sm hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                <option value="">{t('common.update')} {t('reports.statusLabel')} ({filteredData.length})</option>
                <option value="Pending">{t('common.statusPending')}</option>
                <option value="Fatturato">{t('common.statusInvoiced')}</option>
                <option value="Pagato">{t('common.statusPaid')}</option>
              </select>
            </div>
          )}

          {user.role === 'admin' && adminStatus === 'Pagato' && filteredData.length > 0 && (
            <button
              onClick={() => setIsArchiveModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={14} />
              {t('reports.archiveAndDelete')}
            </button>
          )}
        </div>
      </div>

      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isDeleting && setIsArchiveModalOpen(false)}></div>
          <div className="bg-white sm:rounded-3xl p-6 w-full h-full sm:h-auto sm:max-w-md relative z-10 shadow-2xl animate-in sm:zoom-in-95 duration-200 overflow-y-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mb-4">
                <ShieldAlert size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">{t('reports.deleteConfirmationTitle')}</h2>
              <p className="text-sm text-slate-500 mb-6">{t('reports.deleteWarning')}</p>

              <div className="w-full space-y-3">
                <button
                  disabled={isDeleting}
                  onClick={() => handleDeleteOperation('pdf')}
                  className="w-full py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-red-500/20 disabled:opacity-50"
                >
                  <FileDown size={18} /> {t('reports.exportAndProceed')} (PDF)
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => handleDeleteOperation('excel')}
                  className="w-full py-3 px-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <FileSpreadsheet size={18} /> {t('reports.exportAndProceed')} (Excel)
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => handleDeleteOperation('none')}
                  className="w-full py-3 px-4 bg-white text-slate-400 font-bold rounded-xl hover:bg-slate-50 border border-slate-200 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <Trash2 size={16} /> {t('reports.skipExportAndDelete')}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => setIsArchiveModalOpen(false)}
                  className="w-full py-3 px-4 text-slate-400 font-bold hover:text-slate-600 transition-all text-sm uppercase tracking-widest pt-2 disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 flex flex-wrap lg:flex-nowrap justify-between items-center p-4 gap-6 shadow-sm">
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('reports.summaryHoursWorked')}</span>
          <span className="text-sm font-medium text-slate-600">{totals.hours.toLocaleString(localeMap[lang], { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h</span>
        </div>
        <div className="hidden lg:block w-px h-10 bg-slate-100"></div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('reports.summaryPersonnelCost')}</span>
          <span className="text-sm font-medium text-slate-600">{formatCurrency(totals.personnelCost)}</span>
        </div>
        <div className="hidden lg:block w-px h-10 bg-slate-100"></div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('reports.summarySubcontractCost')}</span>
          <span className="text-sm font-medium text-slate-600">{formatCurrency(totals.subcontractCost)}</span>
        </div>
        <div className="hidden lg:block w-px h-10 bg-slate-100"></div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest">{t('reports.totalExpenses')}</span>
          <span className="text-sm font-medium text-amber-700/80">{formatCurrency(totals.totalExpenses)}</span>
        </div>
        <div className="hidden lg:block w-px h-10 bg-slate-100"></div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest">{t('reports.summaryTotalGeneral')}</span>
          <span className="text-sm font-medium text-blue-700/80">{formatCurrency(totals.totalCost)}</span>
        </div>
        <div className="hidden lg:block w-px h-10 bg-slate-100"></div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{t('reports.totalRevenue')}</span>
          <span className="text-base font-semibold text-indigo-600">{formatCurrency(totals.revenue)}</span>
        </div>
        <div className="hidden lg:block w-px h-10 bg-slate-100"></div>
        <div className="flex flex-col flex-1">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${totals.margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{t('reports.margin')}</span>
          <span className={`text-xl font-bold ${totals.margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(totals.margin)}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3 border-b border-slate-100 bg-slate-50">
          <h2 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{t('reports.summaryByProject')}</h2>
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
                      : t('reports.summaryPeriod')}
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
                  <span className="font-bold text-slate-400 uppercase tracking-tight">{t('reports.totalHoursLabel')}</span>
                  <span className="font-black text-slate-700">{p.hours.toLocaleString(localeMap[lang], { minimumFractionDigits: 1 })}h</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-400 uppercase tracking-tight">{t('reports.summaryTotalCost')}</span>
                  <span className="font-black text-slate-700">{formatCurrency(p.totalCost)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-indigo-50/50 rounded-lg border border-indigo-100 col-span-2">
                  <span className="font-bold text-indigo-400 uppercase tracking-tight">{t('reports.totalRevenue')}</span>
                  <span className="font-black text-indigo-600">{formatCurrency(p.revenue)}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">{t('common.noData')}</div>
          )}
        </div>

        {/* Desktop View: Compact Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-3 py-2 whitespace-nowrap">{t('reports.headerDate')}</th>
                <th className="px-3 py-2">{t('reports.summaryProjectName')}</th>
                <th className="px-3 py-2">{t('reports.headerClient')}</th>
                <th className="px-3 py-2 text-right whitespace-nowrap">{t('reports.totalHoursLabel')}</th>
                <th className="px-3 py-2 text-right whitespace-nowrap">{t('reports.summaryTotalCost')}</th>
                <th className="px-3 py-2 text-indigo-400 text-right whitespace-nowrap">{t('reports.totalRevenue')}</th>
                <th className="px-3 py-2 text-emerald-500 text-right whitespace-nowrap">{t('reports.margin')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {groupedByProject.length > 0 ? groupedByProject.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-blue-600 whitespace-nowrap capitalize">
                    {p.dateDisplay !== 'Periodo'
                      ? new Intl.DateTimeFormat(localeMap[lang as string] || 'it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(p.dateDisplay as string))
                      : t('reports.summaryPeriod')}
                  </td>
                  <td className="px-3 py-1.5 font-bold text-slate-900 truncate max-w-[150px]" title={p.name}>{p.name}</td>
                  <td className="px-3 py-1.5 text-slate-500 font-medium truncate max-w-[120px]" title={p.clientName}>{p.clientName}</td>
                  <td className="px-3 py-1.5 font-black text-slate-700 text-right whitespace-nowrap">{p.hours.toLocaleString(localeMap[lang], { minimumFractionDigits: 1 })} h</td>
                  <td className="px-3 py-1.5 font-black text-slate-900 text-right whitespace-nowrap">{formatCurrency(p.totalCost)}</td>
                  <td className="px-3 py-1.5 font-black text-indigo-600 text-right whitespace-nowrap">{formatCurrency(p.revenue)}</td>
                  <td className="px-3 py-1.5 font-black text-right whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black ${p.margin > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : p.margin < 0 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-100 text-slate-500'}`}>
                      {p.margin > 0 ? '+' : ''}{formatCurrency(p.margin)}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">{t('common.noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Profile View ---
// --- Help View ---
// --- Personnel View ---
const PersonnelView: React.FC<{ user: User, onImpersonate?: (u: User) => void }> = ({ user, onImpersonate }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<Record<string, 'success' | 'error'>>({});

  useEffect(() => {
    const load = async () => {
      // Ensure DB context is correct for this component (handle both set and clear)
      db.setCompanyId(user?.companyId ?? null);
      const [u, s] = await Promise.all([db.getUsers(), db.getSubcontractors()]);
      setUsers(u);
      setSubcontractors(s);
    };
    load();
  }, [user?.companyId]);

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
    if (confirm(t('common.confirmDelete'))) {
      await db.deleteUser(id);
      setUsers(await db.getUsers());
    }
  };

  const handleSendInstructions = async (u: any) => {
    if (!u.email) return;

    try {
      setSendingId(u.id);
      await db.sendAccessInstructions(u.id);
      setSendStatus(prev => ({ ...prev, [u.id]: 'success' }));
      setTimeout(() => setSendStatus(prev => { const next = { ...prev }; delete next[u.id]; return next; }), 3000);
    } catch (err: any) {
      console.error('Failed to send instructions:', err);
      setSendStatus(prev => ({ ...prev, [u.id]: 'error' }));
      setTimeout(() => setSendStatus(prev => { const next = { ...prev }; delete next[u.id]; return next; }), 3000);
    } finally {
      setSendingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // SSOT: We no longer block existing emails here. 
      // db.addUser handles linking existing global profiles to the current company.

      const data = { ...formData, subcontractorId: formData.subcontractorId || undefined };
      const isSensitive = !!(editingId && (formData.email !== users.find(u => u.id === editingId)?.email || formData.password !== users.find(u => u.id === editingId)?.password));

      if (editingId) {
        await db.updateUser(editingId, data);
        if (isSensitive) {
          alert(t('auth.profileUpdated'));
        }
      } else {
        await db.addUser(data);
      }
      setUsers(await db.getUsers());
      setEditingId(null);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(t('common.saveError') + err.message);
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
        <h1 className="text-2xl font-bold text-slate-900">{t('projects.personnelTitle')}</h1>
        <button onClick={resetForm} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
          <Plus size={16} className="mr-2" /> {t('projects.personnelNew')}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {[...users].sort((a, b) => {
          const aType = a.status === 'inactive' ? 2 : (!a.subcontractorId ? 0 : 1);
          const bType = b.status === 'inactive' ? 2 : (!b.subcontractorId ? 0 : 1);
          if (aType !== bType) return aType - bType;
          return a.name.localeCompare(b.name);
        }).map(u => {
          const sub = subcontractors.find(s => s.id === u.subcontractorId);
          return (
            <div key={u.id} className={`bg-white px-4 py-3 rounded-xl border ${u.status === 'active' ? 'border-slate-200' : 'border-slate-100 opacity-60'} flex justify-between items-center group hover:border-blue-200 hover:shadow-md transition-all`}>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 text-base truncate">
                  {u.name}
                  {u.phone && <span className="text-sm text-slate-500 font-medium ml-2 font-normal">• {u.phone}</span>}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 truncate capitalize">
                  {t(`projects.role${u.role.charAt(0).toUpperCase() + u.role.slice(1)}` as any)} • {u.subcontractorId ? sub?.name || t('projects.personSubcontractor') : t('projects.personInternal')}
                </p>
              </div>
              <div className="flex gap-2 shrink-0 ml-4 items-center">
                {u.email && (
                  <button
                    disabled={sendingId === u.id || !u.email}
                    onClick={() => handleSendInstructions(u)}
                    className={`p-2 rounded-lg transition-all ${sendingId === u.id ? 'bg-slate-100 text-slate-400' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}
                    title={t('auth.sendInstructions')}
                  >
                    {sendingId === u.id ? (
                      <div className="w-[18px] h-[18px] border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    ) : (
                      <Mail size={18} />
                    )}
                  </button>
                )}
                {sendStatus[u.id] && (
                  <span className={`text-xs font-bold ${sendStatus[u.id] === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {sendStatus[u.id] === 'success' ? '✓' : '✗'}
                  </span>
                )}
                {onImpersonate && (
                  <button onClick={() => onImpersonate(u)} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors" title={t('dashboard.impersonateUser')}>
                    <UserIcon size={18} />
                  </button>
                )}
                <button onClick={() => handleEdit(u)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"><Pencil size={18} /></button>
                <button onClick={() => handleDelete(u.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={modalClasses}>
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? t('projects.personnelEdit') : t('projects.personnelNew')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isEditingDemo && (
                <div className="bg-amber-50 text-amber-800 p-3 rounded-xl text-xs font-semibold border border-amber-200">
                  {t('dashboard.demoFieldsLocked')}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <FullWidthField label={t('projects.personName')}>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} disabled={isEditingDemo} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.personType')}>
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
                    <option value="">{t('projects.personInternal')}</option>
                    {Array.from(new Map(subcontractors.map(s => [s.id, s])).values()).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </FullWidthField>
                <FullWidthField label={t('projects.personRole')}>
                  <select required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as Role })} disabled={isEditingDemo} className={inputClasses}>
                    <option value="operator">{t('projects.roleOperator')}</option>
                    <option value="supervisor">{t('projects.roleSupervisor')}</option>
                    <option value="admin">{t('projects.roleAdmin')}</option>
                  </select>
                </FullWidthField>
                <FullWidthField label={t('projects.personPhone')}>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.personEmail')}>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClasses} readOnly={!!editingId} />
                </FullWidthField>
                <FullWidthField label={t('projects.personRate')}>
                  <div className="flex items-center gap-2">
                    <input type="number" step="0.01" value={formData.hourlyRate} onChange={e => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })} className={inputClasses} />
                    <Tooltip text={t('projects.tooltip_hourlyRate')} />
                  </div>
                </FullWidthField>
                <FullWidthField label={t('projects.personOvertimeRate')}>
                  <div className="flex items-center gap-2">
                    <input type="number" step="0.01" value={formData.overtimeHourlyRate} onChange={e => setFormData({ ...formData, overtimeHourlyRate: parseFloat(e.target.value) || 0 })} className={inputClasses} />
                    <Tooltip text={t('projects.tooltip_overtimeHourlyRate')} />
                  </div>
                </FullWidthField>
                {/* Fields moved to Access and Security section below */}
                <div className="md:col-span-2">
                  <FullWidthField label={t('projects.personAddress')}>
                    <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className={inputClasses} />
                  </FullWidthField>
                </div>
                <div className="md:col-span-2">
                  <FullWidthField label={t('projects.personNotes')}>
                    <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={inputClasses + " min-h-[60px]"} />
                  </FullWidthField>
                </div>
              </div>

              {/* Access and Security Section (Internal Personnel only) */}
              {!formData.subcontractorId && (
                <div className="mt-4 pt-6 border-t">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">{t('projects.accessAndSecurity')}</h3>
                  </div>

                  {editingId && (
                    <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-[10px] font-bold border border-blue-100 flex items-start gap-2 mb-4">
                      <AlertCircle size={14} className="shrink-0" />
                      {t('auth.loginCredentialsWarning')}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <FullWidthField label={t('projects.personUsername')}>
                      <input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} disabled={isEditingDemo} className={inputClasses} />
                    </FullWidthField>
                    <FullWidthField label={editingId ? t('auth.resetPassword') : t('projects.personPassword')}>
                      <div className="space-y-1">
                        <input
                          type="text"
                          required={!editingId}
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                          disabled={isEditingDemo}
                          className={inputClasses}
                          placeholder={editingId ? t('auth.passwordChangeHint') : ''}
                        />
                        {editingId && <p className="text-[9px] text-slate-400 font-medium ml-1 italic">{t('auth.passwordChangeHint')}</p>}
                      </div>
                    </FullWidthField>

                    {/* Send access instructions button integrated here */}
                    {editingId && formData.email && (
                      <div className="md:col-span-2">
                        <button
                          type="button"
                          onClick={() => handleSendInstructions({ id: editingId, email: formData.email })}
                          className="w-full px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Mail size={16} /> {t('auth.sendInstructions')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t mt-4">
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">{t('projects.personStatus')}:</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'active' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.personStatusActive')}</button>
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'inactive' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'inactive' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.personStatusInactive')}</button>
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none px-6 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors">{t('common.cancel')}</button>
                  <button type="submit" className="flex-1 sm:flex-none px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                    {editingId ? t('common.update') : t('common.save')}
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

interface ClientsViewProps {
  t: (key: string) => string;
  user: User;
}

const ClientsView: React.FC<ClientsViewProps> = ({ t, user }) => {
  const {
    data: clients = [],
    createClient,
    updateClient,
    deleteClient
  } = useClients(user?.companyId ?? undefined, user?.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const handleLocalDelete = (id: string) => {
    if (confirm(t('common.confirmDelete'))) {
      deleteClient.mutate(id);
    }
  };

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateClient.mutateAsync({ id: editingId, data: formData });
    } else {
      await createClient.mutateAsync(formData);
    }
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
        <h1 className="text-2xl font-bold text-slate-900">{t('projects.clientsTitle')}</h1>
        <button onClick={resetForm} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
          <Plus size={16} className="mr-2 inline" /> {t('projects.clientNew')}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {clients.map(c => (
          <div key={c.id} className={`bg-white px-4 py-3 rounded-xl border ${c.status === 'active' ? 'border-slate-200' : 'border-slate-100 opacity-60'} flex justify-between items-center group hover:border-blue-200 hover:shadow-md transition-all`}>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-900 text-base truncate">{c.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                {c.mainContactName ? `${c.mainContactName} ${c.mainContactPhone ? ` • ${c.mainContactPhone}` : ''}` : '---'}
              </p>
            </div>
            <div className="flex gap-2 shrink-0 ml-4 items-center">
              <button onClick={() => handleEdit(c)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"><Pencil size={18} /></button>
              <button onClick={() => handleLocalDelete(c.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={modalClasses}>
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? t('projects.clientEdit') : t('projects.clientNew')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleLocalSubmit} className="space-y-4">
              <div className="flex flex-col gap-y-4 max-w-lg mx-auto">
                <FullWidthField label={t('projects.clientName')}>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.clientVat')}>
                  <input type="text" value={formData.vatNumber} onChange={e => setFormData({ ...formData, vatNumber: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.clientContact')}>
                  <input type="text" value={formData.mainContactName} onChange={e => setFormData({ ...formData, mainContactName: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.clientPhone')}>
                  <input type="tel" value={formData.mainContactPhone} onChange={e => setFormData({ ...formData, mainContactPhone: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.clientEmail')}>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.clientAddress')}>
                  <input type="text" value={formData.billingAddress} onChange={e => setFormData({ ...formData, billingAddress: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.clientNotes')}>
                  <textarea rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={inputClasses} placeholder={t('projects.internalNotes')} />
                </FullWidthField>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t mt-4">
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">{t('projects.clientStatus')}:</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'active' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.clientActive')}</button>
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'inactive' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'inactive' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.clientInactive')}</button>
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none px-6 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors">{t('common.cancel')}</button>
                  <button type="submit" className="flex-1 sm:flex-none px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                    {editingId ? t('common.update') : t('common.save')}
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
const ProjectsView: React.FC<{ user: User }> = ({ user }) => {
  const { data: projects = [], createProject, updateProject, deleteProject } = useProjects(user?.companyId ?? undefined, user?.id);
  const { data: clients = [] } = useClients(user?.companyId ?? undefined, user?.id);
  const { t } = useTranslation();
  const [personnel, setPersonnel] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.companyId) return;
      db.setCompanyId(user.companyId);
      const [u] = await Promise.all([db.getUsers()]);
      setPersonnel(u.filter((usr: User) => usr.status === 'active'));
    };
    load();
  }, [user?.companyId]);

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
    if (confirm(t('common.confirmDelete'))) {
      await deleteProject.mutateAsync(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProject.mutateAsync({ id: editingId, data: formData });
      } else {
        await createProject.mutateAsync(formData);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error saving project:', error);
      alert(t('common.saveError') + (error.message || error.code || 'Unknown error'));
    }
  };

  const resetForm = async (isInternal = false) => {
    let internalClientId = '';
    if (isInternal) {
      const internalClient = await db.getInternalClient();
      if (internalClient) {
        internalClientId = internalClient.id;
      } else {
        internalClientId = 'internal';
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

  const editingProject = editingId ? projects.find(p => p.id === editingId) : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{t('projects.listTitle')}</h1>
        {authService.can(user, 'create', 'projects') && (
          <div className="flex gap-2">
            <button onClick={() => resetForm(false)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2">
              <Plus size={16} /> {t('projects.new')}
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2">
        {projects.filter(p => authService.can(user, 'approve', 'reports') ? true : canUserAccessProject(p, user.id)).map(p => {
          const client = clients.find(c => c.id === p.clientId);
          return (
            <div key={p.id} className={`bg-white px-4 py-3 rounded-xl border ${p.status === 'active' ? 'border-slate-200' : 'border-slate-100 opacity-60'} flex justify-between items-center group hover:border-blue-200 hover:shadow-md transition-all`}>
              <div className="flex items-center gap-4 min-w-0 cursor-pointer flex-1" onClick={() => handleEdit(p)}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${p.status === 'active' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
                  <Briefcase size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-lg truncate flex items-center gap-2">
                    {p.name}
                    {p.isInternal && <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">{t('projects.isInternal')}</span>}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5 truncate">{p.isInternal ? t('projects.activityInternal') : (client?.name || '---')}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 ml-4 items-center">
                {authService.can(user, 'delete', 'projects') && <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={18} /></button>}
                <button onClick={() => handleEdit(p)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  {authService.can(user, 'update', 'projects') ? <Pencil size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={modalClasses}>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId
                  ? (authService.can(user, 'update', 'projects') ? t('projects.edit') : (editingProject?.name || '---'))
                  : t('projects.new')
                }
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            {authService.can(user, 'update', 'projects') ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  <FullWidthField label={t('projects.isInternal')} className="md:col-span-2">
                    <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-xs">
                      <button type="button" onClick={() => setFormData({ ...formData, isInternal: false, clientId: '' })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${!formData.isInternal ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('common.no')}</button>
                      <button type="button" onClick={() => setFormData({ ...formData, isInternal: true, clientId: 'internal', financialAgreement: 'fixed', sellingPrice: 0 })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.isInternal ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{t('common.yes')}</button>
                    </div>
                  </FullWidthField>
                  <FullWidthField label={t('projects.client')}>
                    {!formData.isInternal && (
                      <select required value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })} className={inputClasses}>
                        <option value="">{t('common.select')}</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    )}
                    {formData.isInternal && (
                      <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm italic">
                        {t('projects.activityInternal')}
                      </div>
                    )}
                  </FullWidthField>
                  <FullWidthField label={t('projects.title')}>
                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClasses} />
                  </FullWidthField>
                  <div className="md:col-span-2">
                    <FullWidthField label={t('projects.descriptionLabel')}>
                      <textarea rows={2} required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={inputClasses} />
                    </FullWidthField>
                  </div>
                  <FullWidthField label={t('projects.address')}>
                    <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className={inputClasses} />
                  </FullWidthField>
                  {!formData.isInternal && (
                    <FullWidthField label={t('projects.billingType')}>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button type="button" onClick={() => setFormData({ ...formData, financialAgreement: 'hourly' })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.financialAgreement === 'hourly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.billingHourly')}</button>
                        <button type="button" onClick={() => setFormData({ ...formData, financialAgreement: 'fixed' })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.financialAgreement === 'fixed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.billingFixed')}</button>
                      </div>
                    </FullWidthField>
                  )}
                  {formData.isInternal && (
                    <FullWidthField label={t('projects.billingType')}>
                      <div className="px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 text-sm font-bold">
                        {t('projects.nonBillable')}
                      </div>
                    </FullWidthField>
                  )}
                  {!formData.isInternal && (
                    <FullWidthField label={t('projects.budgetAmount')}>
                      <div className="flex items-center gap-2">
                        <input type="number" step="0.01" value={formData.sellingPrice} onChange={e => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })} className={inputClasses} />
                        <Tooltip text={t('projects.tooltipSellingPrice')} />
                      </div>
                    </FullWidthField>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <FullWidthField label={t('projects.contactPerson')}>
                      <input type="text" value={formData.siteContactName} onChange={e => setFormData({ ...formData, siteContactName: e.target.value })} className={inputClasses} />
                    </FullWidthField>
                    <FullWidthField label={t('projects.phone')}>
                      <input type="tel" value={formData.siteContactPhone} onChange={e => setFormData({ ...formData, siteContactPhone: e.target.value })} className={inputClasses} />
                    </FullWidthField>
                  </div>
                  <div className="md:col-span-2">
                    <FullWidthField label={t('projects.internalNotes')}>
                      <textarea rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={inputClasses} />
                    </FullWidthField>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('projects.assignedPersonnel')}:</label>
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
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">{t('projects.status')}:</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button type="button" onClick={() => setFormData({ ...formData, status: 'active' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.statusActive')}</button>
                      <button type="button" onClick={() => setFormData({ ...formData, status: 'closed' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'closed' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.statusClosed')}</button>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none px-6 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors">{t('common.cancel')}</button>
                    <button type="submit" className="flex-1 sm:flex-none px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                      {editingId ? t('common.update') : t('common.save')}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Operational View for Operators/Supervisors */
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('projects.client')}</label>
                      <p className="text-lg font-bold text-slate-900">{clients.find(c => c.id === formData.clientId)?.name || '---'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('projects.title')}</label>
                      <p className="text-xl font-black text-blue-600">{formData.name}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {formData.address && (
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('projects.address')}</label>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors group"
                        >
                          <span className="font-bold border-b border-dashed border-slate-300 group-hover:border-blue-300">{formData.address}</span>
                          <MapPin size={16} className="text-blue-500" />
                        </a>
                      </div>
                    )}
                    {formData.siteContactPhone && (
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('projects.contactPerson')}</label>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{formData.siteContactName || '---'}</span>
                          <a
                            href={`tel:${formData.siteContactPhone}`}
                            className="flex items-center gap-2 text-blue-600 font-black hover:scale-105 transition-transform origin-left w-fit"
                          >
                            <Phone size={16} /> {formData.siteContactPhone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{t('projects.descriptionLabel')}</label>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium italic">
                    {formData.description || t('common.noData')}
                  </p>
                </div>

                {formData.assignedWorkerIds.length > 0 && (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">{t('projects.assignedPersonnel')}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {personnel.filter(u => formData.assignedWorkerIds.includes(u.id)).map(u => (
                        <div key={u.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <span className="text-xs font-bold text-slate-900">{u.name}</span>
                          {u.phone && (
                            <a href={`tel:${u.phone}`} className="text-blue-600 p-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                              <Phone size={14} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button onClick={() => setIsModalOpen(false)} className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px]">
                    {t('common.back' as any) || 'Chiudi'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Subcontractors View ---
const SubcontractorsView: React.FC<{ user: User }> = ({ user }) => {
  const { t } = useTranslation();
  const [subs, setSubs] = useState<Subcontractor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    db.setCompanyId(user?.companyId ?? null);
    db.getSubcontractors().then(setSubs);
  }, [user?.companyId]);

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
    if (confirm(t('common.confirmDelete'))) {
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
        <h1 className="text-2xl font-bold text-slate-900">{t('projects.subcontractorsTitle')}</h1>
        <button onClick={resetForm} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
          <Plus size={16} className="mr-2 inline" /> {t('projects.subcontractorNew')}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={modalClasses}>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? t('projects.subcontractorEdit') : t('projects.subcontractorNew')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <FullWidthField label={t('projects.subcontractorName')}>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.clientVat')}>
                  <input type="text" value={formData.vatNumber} onChange={e => setFormData({ ...formData, vatNumber: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.subcontractorContact')}>
                  <input type="text" value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.subcontractorPhone')}>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.subcontractorEmail')}>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.subcontractorAddress')}>
                  <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.subcontractorBillingType')}>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setFormData({ ...formData, billingType: 'hourly' })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.billingType === 'hourly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.billingHourly')}</button>
                    <button type="button" onClick={() => setFormData({ ...formData, billingType: 'fixed' })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.billingType === 'fixed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.billingFixed')}</button>
                  </div>
                </FullWidthField>
                <FullWidthField label={t('projects.subcontractorAmount')}>
                  <div className="relative flex items-center">
                    <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} className={inputClasses} />
                  </div>
                </FullWidthField>
                <div className="md:col-span-2">
                  <FullWidthField label={t('projects.subcontractorNotes')}>
                    <textarea rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={inputClasses} placeholder={t('projects.internalNotes')} />
                  </FullWidthField>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t mt-4">
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">{t('projects.subcontractorStatus')}:</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'active' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.subcontractorActive')}</button>
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'inactive' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'inactive' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.subcontractorInactive')}</button>
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none px-6 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors">{t('common.cancel')}</button>
                  <button type="submit" className="flex-1 sm:flex-none px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                    {editingId ? t('common.update') : t('common.save')}
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
  const { data: reports = [], createReport, updateReport, deleteReport } = useReports(user?.companyId ?? undefined, user?.id);
  const { data: projects = [] } = useProjects(user?.companyId ?? undefined, user?.id);
  const { data: clients = [] } = useClients(user?.companyId ?? undefined, user?.id);
  useSubcontractors(user?.companyId ?? undefined, user?.id); // Fetch but don't bind to local variable if unused, or just pass context
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [personnel, setPersonnel] = useState<User[]>([]);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<'communications' | 'compliance' | 'generic'>('generic');
  const { isLimitReached } = useSubscription();

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

  const handleNewReport = () => {
    if (isLimitReached) {
      setUpgradeFeature('generic');
      setIsUpgradeModalOpen(true);
      return;
    }
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
  };

  const {
    complianceReportToSign,
    openComplianceReport: handleComplianceClick,
    closeComplianceReport,
    handleGenerateCompliance
  } = useComplianceReportController(user, projects, clients, personnel, lang, (feature) => {
    setUpgradeFeature(feature);
    setIsUpgradeModalOpen(true);
  });

  useEffect(() => {
  }, []);

  useEffect(() => {
    if (!user?.companyId) return;
    db.setCompanyId(user.companyId);
    db.getUsers().then(u => setPersonnel(u.filter((usr: User) => usr.status === 'active')));
  }, [user?.companyId]);

  const canEditReport = (_r: WorkReport) => {
    return authService.can(user, 'update', 'reports');
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

  const addWorker = () => {
    setFormData({
      ...formData,
      additionalWorkers: [{
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
      } as AdditionalWorker, ...formData.additionalWorkers]
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
      if (editingId) await updateReport.mutateAsync({ id: editingId, data: payload as any }); else await createReport.mutateAsync(payload as any);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(t('common.saveError') + JSON.stringify(err));
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
    if (confirm(t('common.confirmDelete'))) {
      await deleteReport.mutateAsync(id);
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
        <h1 className="text-2xl font-bold text-slate-900">{t('reports.title')}</h1>
        <div className="flex flex-wrap gap-2 justify-end">
          {user.role !== 'admin' && (
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  const personalRows = filteredReports.map(r => {
                    const pours = r.userId === user.id ? r.totalHours : (r.additionalWorkers?.find(aw => aw.userId === user.id)?.totalHours || 0);
                    const [y, m, d] = (r.date || '').split('-');
                    return {
                      date: y && m && d ? `${d}/${m}/${y.substring(2)}` : r.date,
                      projectName: projects.find(p => p.id === r.projectId)?.name || '---',
                      clientName: clients.find(c => c.id === projects.find(p => p.id === r.projectId)?.clientId)?.name || '---',
                      workerName: user.name,
                      description: r.description || '',
                      hours: pours,
                      hourlyCost: 0, cost: 0, expenses: 0, hourlyRevenue: 0, revenue: 0,
                      paid: r.invoiceStatus === 'Pending' ? t('common.statusPending') : (r.invoiceStatus === 'Fatturato' ? t('common.statusInvoiced') : (r.invoiceStatus === 'Pagato' ? t('common.statusPaid') : (r.invoiceStatus || t('common.statusPending'))))
                    };
                  });
                  exportToPDF(personalRows, lang, user.name);
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl shadow-md hover:bg-indigo-700 transition-all uppercase tracking-tight"
                title={t('reports.personalExportPDF')}
              >
                <FileDown size={14} className="mr-1.5" /> {t('reports.personalExportPDF')}
              </button>
              <button
                onClick={() => {
                  const personalRows = filteredReports.map(r => {
                    const pours = r.userId === user.id ? r.totalHours : (r.additionalWorkers?.find(aw => aw.userId === user.id)?.totalHours || 0);
                    return {
                      date: new Date(r.date).toLocaleDateString(localeMap[lang]),
                      projectName: projects.find(p => p.id === r.projectId)?.name || '---',
                      clientName: clients.find(c => c.id === projects.find(p => p.id === r.projectId)?.clientId)?.name || '---',
                      workerName: user.name,
                      description: r.description || '',
                      hours: pours,
                      hourlyCost: 0, cost: 0, expenses: 0, hourlyRevenue: 0, revenue: 0,
                      paid: r.invoiceStatus === 'Pending' ? t('common.statusPending') : (r.invoiceStatus === 'Fatturato' ? t('common.statusInvoiced') : (r.invoiceStatus === 'Pagato' ? t('common.statusPaid') : (r.invoiceStatus || t('common.statusPending'))))
                    };
                  });
                  exportToExcel(personalRows, lang);
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-xl shadow-md hover:bg-emerald-700 transition-all uppercase tracking-tight"
                title={t('reports.personalExportExcel')}
              >
                <FileSpreadsheet size={14} className="mr-1.5" /> {t('reports.personalExportExcel')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilters({ ...filters, dateRange: 'today' })}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${filters.dateRange === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >{t('common.today')}</button>
          <button
            onClick={() => setFilters({ ...filters, dateRange: 'week' })}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${filters.dateRange === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >{t('common.thisWeek')}</button>
          <button
            onClick={() => setFilters({ ...filters, dateRange: 'month' })}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${filters.dateRange === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >{t('common.thisMonth')}</button>
          <button
            onClick={() => setFilters({ ...filters, dateRange: 'custom' })}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${filters.dateRange === 'custom' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >{t('common.customRange')}</button>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-inner' : 'bg-white border-slate-200 text-slate-600 shadow-sm hover:border-slate-300'}`}
          title={t('reports.filters')}
        >
          <Filter size={20} />
        </button>
        <button 
          onClick={handleNewReport}
          data-onboarding="new-report-btn"
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all"
        >
          <Plus size={16} className="mr-2 inline" />
          <span className="hidden sm:inline">{t('reports.new')}</span>
          <span className="sm:hidden">{t('common.addBtn')}</span>
        </button>
      </div>

      {showFilters && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Search size={12} /> {t('reports.filters')}
            </h3>
            <button
              onClick={() => setFilters({ projectId: '', userId: '', search: '', dateRange: 'all', dateFrom: '', dateTo: '' })}
              className="text-[9px] items-center font-extrabold px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md hover:bg-slate-100 transition-colors uppercase"
            >
              {t('reports.clearFilters')}
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('reports.headerProject')}</label>
              <select
                value={filters.projectId}
                onChange={e => setFilters({ ...filters, projectId: e.target.value })}
                className={filterInputClasses}
              >
                <option value="">{t('reports.allProjects')}</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {user.role !== 'operator' && (
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('reports.worker')}</label>
                <select
                  value={filters.userId}
                  onChange={e => setFilters({ ...filters, userId: e.target.value })}
                  className={filterInputClasses}
                >
                  <option value="">{t('reports.allWorkers')}</option>
                  {personnel.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('reports.filterByRange')}</label>
              <select
                value={filters.dateRange}
                onChange={e => setFilters({ ...filters, dateRange: e.target.value as any })}
                className={filterInputClasses}
              >
                <option value="all">{t('common.statusAll')}</option>
                <option value="today">{t('common.today')}</option>
                <option value="week">{t('common.thisWeek')}</option>
                <option value="month">{t('common.thisMonth')}</option>
                <option value="custom">{t('common.customRange')}</option>
              </select>
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('reports.filters')}</label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={e => setFilters({ ...filters, search: e.target.value })}
                  placeholder={t('common.search')}
                  className={filterInputClasses + " pl-7"}
                />
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {filters.dateRange === 'custom' && (
              <div className="col-span-2 lg:col-span-4 grid grid-cols-2 gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('reports.dateFrom')}</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
                    className={filterInputClasses}
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('reports.dateTo')}</label>
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
            const teamTotalHours = (r.teamTotalHours || (r.totalHours + (r.additionalWorkers?.reduce((sum: number, aw: any) => sum + (aw.totalHours || 0), 0) || 0))).toFixed(2);

            return (
              <div key={r.id} className="p-4 space-y-3 active:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-blue-600 capitalize flex items-center gap-2">
                      {formattedDate}
                      {r.activityType && r.activityType !== 'work' && (
                        <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-black uppercase">
                          {t(`reports.activity${r.activityType.charAt(0).toUpperCase() + r.activityType.slice(1)}` as any)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-900">{proj?.name || '---'}</div>
                    <div className="text-xs font-semibold text-slate-600 mt-0.5 flex items-center gap-1">
                      <UserIcon size={12} className="text-slate-400" />
                      {personnel.find(u => u.id === r.userId)?.name || t('reports.mainWorker')}
                      {totalWorkersCount > 1 && <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-500">+{totalWorkersCount - 1}</span>}
                    </div>
                    {r.description && <div className="text-xs text-slate-500 line-clamp-2 mt-1" title={r.description}>{r.description}</div>}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleComplianceClick(r)} className="p-2 text-indigo-600 bg-indigo-50 active:bg-indigo-100 rounded-lg transition-colors border border-indigo-100" title={t('reports.complianceReport')}><CheckCircle2 size={16} /></button>
                    <button onClick={() => handleDuplicate(r)} className="p-2 text-emerald-600 bg-emerald-50 active:bg-emerald-100 rounded-lg transition-colors border border-emerald-100" title={t('common.duplicate')}><Copy size={16} /></button>
                    {canEditReport(r) && (
                      <>
                        <button onClick={() => handleEdit(r)} className="p-2 text-blue-600 bg-blue-50 active:bg-blue-100 rounded-lg transition-colors border border-blue-100" title={t('common.edit')}><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(r.id)} className="p-2 text-red-600 bg-red-50 active:bg-red-100 rounded-lg transition-colors border border-red-100" title={t('common.delete')}><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    <Users size={12} /> <span className="font-bold">{totalWorkersCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                    <Clock size={12} /> <span className="font-bold">{teamTotalHours}h</span>
                  </div>
                  {r.invoiceStatus && (
                    <div className={`ml-auto px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tight border ${r.invoiceStatus === 'Pagato' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        r.invoiceStatus === 'Fatturato' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                      {r.invoiceStatus === 'Pending' ? t('common.statusPending') : (r.invoiceStatus === 'Fatturato' ? t('common.statusInvoiced') : t('common.statusPaid'))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {reports.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">{t('common.noData')}</div>
          )}
        </div>

        {/* Desktop View: Compact Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest">
                <th className="px-3 py-2 font-black w-32">{t('reports.headerDate')}</th>
                <th className="px-3 py-2 font-black">{t('reports.headerProject')}</th>
                <th className="px-3 py-2 font-black">{t('reports.worker')}</th>
                <th className="px-3 py-2 font-black hidden lg:table-cell">{t('reports.description')}</th>
                <th className="px-3 py-2 font-black text-center w-24">{t('reports.people')}</th>
                <th className="px-3 py-2 font-black text-center w-24">{t('reports.headerTotal')}</th>
                <th className="px-3 py-2 font-black text-right w-36">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...filteredReports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(r => {
                const proj = projects.find(p => p.id === r.projectId);
                const dateObj = new Date(r.date);
                const formattedDate = new Intl.DateTimeFormat(localeMap[lang as string] || 'it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(dateObj);
                const totalWorkersCount = 1 + (r.additionalWorkers || []).length;
                const teamTotalHours = (r.teamTotalHours || (r.totalHours + (r.additionalWorkers?.reduce((sum: number, aw: any) => sum + (aw.totalHours || 0), 0) || 0))).toFixed(2);

                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-3 py-1.5 text-xs font-bold text-blue-600 whitespace-nowrap capitalize">{formattedDate}</td>
                    <td className="px-3 py-1.5 text-xs font-medium text-slate-900 truncate max-w-[150px]" title={proj?.name}>{proj?.name || '---'}</td>
                    <td className="px-3 py-1.5 text-xs text-slate-700 truncate max-w-[120px]">
                      {personnel.find(u => u.id === r.userId)?.name || t('reports.mainWorker')}
                      {totalWorkersCount > 1 && <span className="ml-1 text-[10px] bg-slate-100 px-1 rounded text-slate-500">+{totalWorkersCount - 1}</span>}
                    </td>
                    <td className="px-3 py-1.5 text-xs text-slate-600 truncate max-w-[150px] hidden lg:table-cell" title={r.description}>{r.description || '---'}</td>
                    <td className="px-3 py-1.5 text-center">
                      <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                        {totalWorkersCount}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md text-[10px] border border-blue-100">
                        {teamTotalHours}h
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => handleComplianceClick(r)} className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors" title={t('reports.complianceReport')}><CheckCircle2 size={14} /></button>
                        <button onClick={() => window.location.hash = '#activities'} className="text-slate-400 hover:text-indigo-600 transition-colors" title={t('reports.activityManagement')}><Settings size={14} /></button>
                        <button onClick={() => handleDuplicate(r)} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors" title={t('common.duplicate')}><Copy size={14} /></button>
                        {canEditReport(r) && (
                          <>
                            <button onClick={() => handleEdit(r)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title={t('common.edit')}><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(r.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title={t('common.delete')}><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">{t('common.noData')}</td>
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
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-slate-900">
                {projects.find(p => p.id === formData.projectId)?.isInternal
                  ? (editingId ? t('reports.edit') : t('reports.newInternal'))
                  : (editingId ? t('reports.edit') : t('reports.new'))}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                <FullWidthField label={t('reports.activityType')} className="md:col-span-2">
                  <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const wasInternal = formData.activityType === 'internal' || formData.activityType === 'sickness' || formData.activityType === 'holiday';
                        if (wasInternal) {
                          setFormData({
                            ...formData,
                            activityType: 'work',
                            projectId: '',
                            startTime: '08:00',
                            endTime: '17:00',
                            breakHours: 1,
                            manualTotalHours: undefined,
                            invoiceStatus: 'Pending'
                          });
                        }
                      }}
                      className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.activityType === 'work' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      {t('reports.activityWork')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const intProj = projects.find(p => p.isInternal);
                        setFormData({
                          ...formData,
                          activityType: 'internal',
                          projectId: intProj?.id || '',
                          startTime: '',
                          endTime: '',
                          breakHours: 0,
                          manualTotalHours: 0
                        });
                      }}
                      className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.activityType !== 'work' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      {t('reports.activityInternal')} / {t('reports.activityAbsence')}
                    </button>
                  </div>
                </FullWidthField>

                <FullWidthField label={t('reports.headerProject')}>
                  {(() => {
                    const isInternalMode = formData.activityType !== 'work';

                    return (
                      <select
                        required
                        value={formData.projectId}
                        onChange={e => {
                          const newProjectId = e.target.value;
                          const proj = projects.find(p => p.id === newProjectId);
                          setFormData({
                            ...formData,
                            projectId: newProjectId,
                            description: (formData.description === '' && proj?.description) ? proj.description : formData.description
                          });
                        }} className={inputClasses}>
                        <option value="">{t('common.select')}</option>
                        {projects
                          .filter(p => {
                            // Always include if it's the current project of the report being edited
                            if (editingId && p.id === reports.find(r => r.id === editingId)?.projectId) return true;
                            // Only show active projects for new reports
                            if (!editingId && p.status !== 'active') return false;

                            if (isInternalMode) return p.isInternal;
                            if (p.isInternal) return false;
                            if (authService.canAccessAdmin(user)) return true;
                            return canUserAccessProject(p, user.id);
                          })
                          .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    );
                  })()}
                </FullWidthField>

                {user.role === 'admin' && (
                  <FullWidthField label={t('reports.worker')}>
                    <select
                      required
                      value={formData.userId}
                      onChange={e => setFormData({ ...formData, userId: e.target.value })}
                      className={inputClasses}
                    >
                      <option value="">{t('common.select')}</option>
                      {personnel.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </FullWidthField>
                )}
                {formData.activityType !== 'work' && (
                  <FullWidthField label={t('reports.activityType')}>
                    <select
                      value={formData.activityType}
                      onChange={e => {
                        const newType = e.target.value as any;
                        const updates: any = { activityType: newType };
                        if (['sickness', 'holiday', 'internal'].includes(newType)) {
                          updates.manualTotalHours = 0;
                          updates.startTime = '';
                          updates.endTime = '';
                          updates.breakHours = 0;
                        }
                        setFormData({ ...formData, ...updates });
                      }}
                      className={inputClasses}
                    >
                      <option value="internal">{t('reports.activityInternal')}</option>
                      <option value="sickness">{t('reports.activitySickness')}</option>
                      <option value="holiday">{t('reports.activityHoliday')}</option>
                    </select>
                  </FullWidthField>
                )}
                <FullWidthField label={t('reports.headerDate')}><input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className={inputClasses} /></FullWidthField>
                <div className="md:col-span-2"><FullWidthField label={t('reports.description')}><textarea required rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={inputClasses} /></FullWidthField></div>

                {user.role === 'admin' && (
                  <div className="md:col-span-2 bg-blue-50 border border-blue-100 p-4 rounded-xl">
                    <FullWidthField label={t('reports.adminStatusLabel')}>
                      <select
                        value={formData.invoiceStatus}
                        onChange={e => setFormData({ ...formData, invoiceStatus: e.target.value })}
                        className={inputClasses}
                      >
                        <option value="Pending">{t('common.statusPending')}</option>
                        <option value="Fatturato">{t('common.statusInvoiced')}</option>
                        <option value="Pagato">{t('common.statusPaid')}</option>
                      </select>
                    </FullWidthField>
                  </div>
                )}

                <div className="md:col-span-2 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {user.role !== 'operator' && (
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
                      <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                        <Users size={16} className="text-blue-500" /> {t('reports.teamLabel')}
                      </h3>
                      <button type="button" onClick={addWorker} className="text-xs font-bold text-blue-600 bg-white border border-blue-200 shadow-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1">
                        <Plus size={14} /> {t('reports.addWorker')}
                      </button>
                    </div>
                  )}

                  {/* Intestazioni (visibili solo su schermi non troppo piccoli, o allineate) */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 px-2 mb-1 pr-10 sm:pr-0">
                    <div className="col-span-3"></div>
                    <div className="col-span-2 px-1 text-[10px] font-extrabold text-slate-400 uppercase text-center">{t('reports.headerStart')}</div>
                    <div className="col-span-2 px-1 text-[10px] font-extrabold text-slate-400 uppercase text-center">{t('reports.headerEnd')}</div>
                    <div className="col-span-1 px-1 text-[10px] font-extrabold text-slate-400 uppercase text-center">{t('reports.headerBreak')}</div>
                    <div className="col-span-2 px-1 text-[10px] font-extrabold text-amber-500 uppercase text-center sm:border-l sm:border-transparent sm:pl-2">{t('reports.headerExtra')}</div>
                    <div className="col-span-2 px-1 text-[10px] font-extrabold text-slate-400 uppercase text-center sm:border-l sm:border-transparent sm:pl-2 pr-8">{t('reports.headerTotal')}</div>
                  </div>

                  {/* Righe Collaboratori */}
                  {user.role !== 'operator' && formData.additionalWorkers.map((aw, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center shadow-sm relative pr-10 sm:pr-0">
                      <div className="col-span-12 sm:col-span-3">
                        <select required value={aw.userId} onChange={e => updateWorker(idx, { userId: e.target.value })} className={inputClasses + " w-full"}>
                          <option value="">{t('reports.worker')}...</option>
                          {availablePersonnel.filter(u => u.id !== formData.userId).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </div>

                      <div className="col-span-6 sm:col-span-2 flex flex-col gap-0.5">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerStart')}</label>
                        <input type="time" value={aw.startTime} onChange={e => updateWorker(idx, { startTime: e.target.value })} className={`${inputClasses} w-full text-center px-1 text-[11px] sm:text-sm`} />
                      </div>

                      <div className="col-span-6 sm:col-span-2 flex flex-col gap-0.5">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerEnd')}</label>
                        <input type="time" value={aw.endTime} onChange={e => updateWorker(idx, { endTime: e.target.value })} className={`${inputClasses} w-full text-center px-1 text-[11px] sm:text-sm`} />
                      </div>

                      <div className="col-span-4 sm:col-span-1 flex flex-col gap-0.5">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerBreak')}</label>
                        <input type="number" step="0.25" value={aw.breakHours} onChange={e => updateWorker(idx, { breakHours: parseFloat(e.target.value) || 0 })} className={`${inputClasses} w-full text-center px-1 text-[11px] sm:text-sm`} />
                      </div>

                      <div className="col-span-4 sm:col-span-2 flex flex-col gap-0.5 sm:border-l sm:border-slate-200 sm:pl-2">
                        <label className="text-[9px] font-extrabold text-amber-500 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerExtra')}</label>
                        <input type="number" step="0.25" value={aw.overtimeHours || ''} onChange={e => updateWorker(idx, { overtimeHours: parseFloat(e.target.value) || 0 })} placeholder="0" className={`${inputClasses} w-full text-center text-amber-600 font-bold bg-amber-50 border-amber-200 px-1 text-[11px] sm:text-sm`} />
                      </div>

                      <div className="col-span-4 sm:col-span-2 flex flex-col gap-0.5 sm:border-l sm:border-slate-200 sm:pl-2">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerTotal')}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={aw.manualTotalHours !== undefined ? aw.manualTotalHours : ''}
                          onChange={e => updateWorker(idx, { manualTotalHours: e.target.value === "" ? undefined : parseFloat(e.target.value) })}
                          placeholder={db.calculateTotalHours(aw.startTime, aw.endTime, aw.breakHours).toFixed(2)}
                          className="w-full px-1 py-1 bg-white border border-slate-200 rounded-lg text-center font-black text-blue-600 outline-none h-[30px] text-[11px] sm:text-sm"
                        />
                      </div>
                      <button type="button" onClick={() => removeWorker(idx)} className="absolute right-2 top-2 sm:top-1/2 sm:-translate-y-1/2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  ))}

                  {/* Riga Autore Principale */}
                  <div className="bg-white p-2 rounded-xl border border-blue-200 grid grid-cols-12 gap-2 items-center shadow-sm relative pr-10 sm:pr-0">
                    <div className="col-span-12 sm:col-span-3">
                      <div className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 truncate">
                        {personnel.find(u => u.id === formData.userId)?.name || t('reports.mainWorker')}
                      </div>
                    </div>

                    <div className="col-span-6 sm:col-span-2 flex flex-col gap-0.5">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerStart')}</label>
                      <input type="time" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className={`${inputClasses} w-full text-center px-1 text-[11px] sm:text-sm`} />
                    </div>

                    <div className="col-span-6 sm:col-span-2 flex flex-col gap-0.5">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerEnd')}</label>
                      <input type="time" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className={`${inputClasses} w-full text-center px-1 text-[11px] sm:text-sm`} />
                    </div>

                    <div className="col-span-4 sm:col-span-1 flex flex-col gap-0.5">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerBreak')}</label>
                      <input type="number" step="0.25" value={formData.breakHours} onChange={e => setFormData({ ...formData, breakHours: parseFloat(e.target.value) || 0 })} className={`${inputClasses} w-full text-center px-1 text-[11px] sm:text-sm`} />
                    </div>

                    <div className="col-span-4 sm:col-span-2 flex flex-col gap-0.5 sm:border-l sm:border-slate-200 sm:pl-2">
                      <label className="text-[9px] font-extrabold text-amber-500 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerExtra')}</label>
                      <input type="number" step="0.25" value={formData.overtimeHours || ''} onChange={e => setFormData({ ...formData, overtimeHours: parseFloat(e.target.value) || 0 })} placeholder="0" className={`${inputClasses} w-full text-center text-amber-600 font-bold bg-amber-50 border-amber-200 px-1 text-[11px] sm:text-sm`} />
                    </div>

                    <div className="col-span-4 sm:col-span-2 flex flex-col gap-0.5 sm:border-l sm:border-slate-200 sm:pl-2">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerTotal')}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.manualTotalHours !== undefined ? formData.manualTotalHours : ''}
                        onChange={e => setFormData({ ...formData, manualTotalHours: e.target.value === "" ? undefined : parseFloat(e.target.value) })}
                        placeholder={db.calculateTotalHours(formData.startTime, formData.endTime, formData.breakHours).toFixed(2)}
                        className="w-full px-1 py-1 bg-white border border-slate-200 rounded-lg text-center font-black text-blue-600 outline-none h-[30px] text-[11px] sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Box Totale Complessivo */}
                <div className="md:col-span-2 bg-slate-100 border border-slate-200 text-slate-700 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl shadow-sm"><Clock className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('reports.teamTotalLabel')}</p><p className="text-xs text-slate-500">{t('reports.teamTotalSubLabel')}</p></div>
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
                      <FileText size={16} className="text-amber-500" /> {t('reports.extraExpensesLabel')}
                    </h3>
                    <div className="flex items-center gap-3">
                      {formData.expenses.length > 0 && (
                        <span className="text-sm font-black text-amber-700">
                          {t('common.totalShort')} {formData.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0).toLocaleString(localeMap[lang], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          expenses: [...formData.expenses, { type: 'CANTIERE', amount: 0, description: '', notes: '', km: '' } as any]
                        })}
                        className="text-xs font-bold text-amber-700 bg-white border border-amber-200 shadow-sm px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors flex items-center gap-1"
                      >
                        <Plus size={14} /> {t('reports.addExpense')}
                      </button>
                    </div>
                  </div>

                  {formData.expenses.length === 0 && (
                    <p className="text-xs text-amber-600 text-center py-2 opacity-60">{t('common.noData')}</p>
                  )}

                  {formData.expenses.map((exp: any, idx: number) => (
                    <div key={idx} className="bg-white p-2 rounded-xl border border-amber-200 grid grid-cols-12 gap-2 items-center shadow-sm relative pr-10 sm:pr-8">
                      <div className="col-span-12 sm:col-span-3 flex flex-col gap-0.5">
                        <label className="text-[9px] font-extrabold text-amber-500 uppercase ml-1 tracking-tight sm:hidden">{t('reports.placeholderExpenseType')}</label>
                        <select
                          value={exp.type || 'CANTIERE'}
                          onChange={e => {
                            const updated = [...formData.expenses] as any[];
                            updated[idx] = { ...updated[idx], type: e.target.value };
                            setFormData({ ...formData, expenses: updated });
                          }}
                          className={`${inputClasses} w-full`}
                        >
                          <option value="CANTIERE">{t('reports.expenseCantiere')}</option>
                          <option value="RIMBORSO">{t('reports.expenseRimborso')}</option>
                          <option value="KM">{t('reports.expenseKm')}</option>
                        </select>
                      </div>

                      {exp.type === 'KM' && (
                        <div className="col-span-6 sm:col-span-2 flex flex-col gap-0.5">
                          <label className="text-[9px] font-extrabold text-amber-500 uppercase ml-1 tracking-tight sm:hidden">{t('reports.kmDistance')}</label>
                          <input
                            type="number"
                            step="1"
                            min="1"
                            placeholder="Km percorsi"
                            value={exp.km || ''}
                            onChange={e => {
                              const updated = [...formData.expenses] as any[];
                              updated[idx] = { ...updated[idx], km: e.target.value };
                              setFormData({ ...formData, expenses: updated });
                            }}
                            className={`${inputClasses} w-full text-right`}
                          />
                        </div>
                      )}

                      <div className={`col-span-6 ${exp.type === 'KM' ? 'sm:col-span-2' : 'sm:col-span-4'} flex flex-col gap-0.5`}>
                        <label className="text-[9px] font-extrabold text-amber-500 uppercase ml-1 tracking-tight sm:hidden">{t('reports.amount')} (€)</label>
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

                      <div className={`col-span-12 ${exp.type === 'KM' ? 'sm:col-span-5' : 'sm:col-span-5'} flex flex-col gap-0.5`}>
                        <label className="text-[9px] font-extrabold text-amber-500 uppercase ml-1 tracking-tight sm:hidden">{t('reports.placeholderExpenseNotes')}</label>
                        <input
                          type="text"
                          placeholder={t('reports.placeholderExpenseNotes')}
                          value={exp.description || exp.notes || ''}
                          onChange={e => {
                            const updated = [...formData.expenses] as any[];
                            updated[idx] = { ...updated[idx], description: e.target.value, notes: e.target.value };
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
                      <Trash2 size={16} /> {t('common.delete')}
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors">{t('common.cancel')}</button>
                  <button type="submit" className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">{editingId ? t('common.update') : t('common.save')}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {isUpgradeModalOpen && (
        <UpgradeModal feature={upgradeFeature} onClose={() => { setIsUpgradeModalOpen(false); setUpgradeFeature('generic'); }} />
      )}

      {complianceReportToSign && (
        <ComplianceReportModal
          report={complianceReportToSign}
          onClose={closeComplianceReport}
          onGenerate={handleGenerateCompliance}
        />
      )}
    </div>
  );
};

// Obsolete login-related components removed

// --- Auth View ---
// AuthView removed in favor of LandingView
// --- Companies Management View (SuperAdmin Only) ---

// --- Main App Component ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ws_auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Robust hydration: prefer companyId if present, fallback to first available company
        const activeCompId = parsed.companyId || parsed.availableCompanies?.[0]?.id;
        if (activeCompId) {
          db.setCompanyId(activeCompId);
        }
        if (parsed.id) {
          db.setUserId(parsed.id);
        }
        return parsed;
      } catch (e) {
        console.error("Error parsing saved auth:", e);
        return null;
      }
    }
    return null;
  });
  const [adminUser, setAdminUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ws_auth_admin');
    return saved ? JSON.parse(saved) : null;
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { t } = useTranslation();


  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isCommsUpgradeOpen, setIsCommsUpgradeOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboarding_v1') && window.innerWidth >= 768;
  });
  const [initializing, setInitializing] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const { hasFeature } = useSubscription();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setShowOnboarding(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Check for recovery URL IMMEDIATELY on first mount, before anything async runs
    const h = window.location.hash;
    if (h.includes('type=recovery') || (h.includes('access_token=') && h.includes('recovery'))) {
      sessionStorage.setItem('recovery_pending', 'true');
      console.log('AUTH: Recovery flag saved to sessionStorage');
    }
    const isRecoveryPending = sessionStorage.getItem('recovery_pending') === 'true';

    const initAuth = async () => {
      console.log('AUTH: Starting initialization... recovery_pending:', isRecoveryPending);
      const { data: { session } } = await supabase.auth.getSession();
      console.log('AUTH: Initial session:', session ? 'PRESENT' : 'NONE', 'session.user:', session?.user ? session.user.id : 'NONE');

      if (session?.user) {
        console.log('AUTH: Session user found, fetching worker data...');
        try {
          const userData = await db.getUserByAuthId(session.user.id);
          console.log('AUTH: DB lookup result:', userData ? `FOUND (${userData.name})` : 'NOT FOUND');
          if (userData) {
            const activeCompId = userData.companyId || userData.availableCompanies?.[0]?.id;
            if (activeCompId) {
              db.setCompanyId(activeCompId);
            }
            db.setUserId(userData.id);
            localStorage.setItem('ws_auth', JSON.stringify(userData));
            setUser(userData);
            if (isRecoveryPending) {
              console.log('AUTH: Recovery pending, redirecting to profile');
              sessionStorage.removeItem('recovery_pending');
              window.location.hash = '#/reset-password';
            }
          }
        } catch (err) {
          console.error('AUTH: Initial auth error:', err);
        }
      } else {
        console.log('AUTH: No session.user available yet, waiting for onAuthStateChange...');
      }
      
      setSessionReady(true);
      setInitializing(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('AUTH EVENT:', event, 'session.user:', session?.user ? session.user.id : 'NONE');

        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && sessionStorage.getItem('recovery_pending') === 'true')) {
          console.log('AUTH: Recovery event detected in onAuthStateChange');
          if (session?.user) {
            const userData = await db.getUserByAuthId(session.user.id);
            console.log('AUTH: Recovery user lookup:', userData ? `FOUND (${userData.name})` : 'FAILED');
            if (userData) {
              const activeCompId = userData.companyId || userData.availableCompanies?.[0]?.id;
              if (activeCompId) {
                db.setCompanyId(activeCompId);
              }
              db.setUserId(userData.id);
              localStorage.setItem('ws_auth', JSON.stringify(userData));
              setUser(userData);
              sessionStorage.removeItem('recovery_pending');
              console.log('AUTH: Redirecting to profile from onAuthStateChange');
              window.location.hash = '#/reset-password';
            }
          }
        } else if (event === 'SIGNED_IN' && !user) {
          if (session?.user) {
            console.log('AUTH: Normal SIGNED_IN - fetching user data');
            const userData = await db.getUserByAuthId(session.user.id);
            if (userData) {
              const activeCompId = userData.companyId || userData.availableCompanies?.[0]?.id;
              if (activeCompId) {
                db.setCompanyId(activeCompId);
              }
              db.setUserId(userData.id);
              localStorage.setItem('ws_auth', JSON.stringify(userData));
              setUser(userData);
            }
          }
        }
      });

      setInitializing(false);
      return () => subscription.unsubscribe();
    };

    initAuth();
  }, []);


  useEffect(() => {
    if (user && user.id) {
      db.setUserId(user.id);
      if (user.role?.toLowerCase() === 'superadmin') {
        setIsSuperAdmin(true);
        db.setIsSuperAdmin(true);
        // Ensure Superadmin always has premium features locally without triggering loops
        if (!user.isPremium) {
          const updated = { ...user, isPremium: true };
          setUser(updated);
          localStorage.setItem('ws_auth', JSON.stringify(updated));
        }
      } else {
        db.checkIsSuperAdmin(user.id).then(isSA => {
          setIsSuperAdmin(isSA);
          db.setIsSuperAdmin(isSA);
        }).catch(console.error);
      }
    } else {
      setIsSuperAdmin(false);
      db.setIsSuperAdmin(false);
      db.setUserId(null);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.companyId && !isSuperAdmin) { // Don't override superadmin state with company data
      db.getCompanyDetails(user.companyId).then(comp => {
        if (comp) {
          const updatedUser = { ...user, companyName: comp.name, isPremium: comp.isPremium };
          if (user.companyName !== comp.name || user.isPremium !== comp.isPremium) {
            setUser(updatedUser);
            localStorage.setItem('ws_auth', JSON.stringify(updatedUser));
          }
        }
      }).catch(console.error);
    }
  }, [user?.companyId, user?.companyName, user?.isPremium]);

  // Unread communications Real-time subscription
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    if (!user) return;
    const updateUnread = async () => {
      try {
        const count = await db.getUnreadCount();
        setUnreadCount(count);
        (window as any).unreadCommunicationsCount = count;
      } catch (e) {
        console.error("Unread update error:", e);
      }
    };

    updateUnread();
    window.addEventListener('refresh-unread-count', updateUnread);

    const companyId = user.companyId || db.getUserIdSafe(); // Safe fallback for RLS channel
    if (!companyId) {
      return () => window.removeEventListener('refresh-unread-count', updateUnread);
    }

    const channel = supabase
      .channel('global_unread_count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'internal_communications',
          filter: `company_id=eq.${db.requireCompanyId()}`
        },
        () => {
          updateUnread();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communication_read_receipts',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          updateUnread();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('refresh-unread-count', updateUnread);
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.companyId]);

  const handleLogin = (u: User) => {
    if (u.availableCompanies && u.availableCompanies.length > 0) {
      db.setCompanyId(u.availableCompanies[0].id);
    }
    db.setUserId(u.id);
    localStorage.setItem('ws_auth', JSON.stringify(u));
    window.location.hash = '/home'; // Go to Welcome Page (HomeView) after login
    setUser(u);
    setIsMobileMenuOpen(false); // Ensure menu is closed after login
  };
  const handleLogout = () => {
    db.setCompanyId(null);
    setUser(null);
    setAdminUser(null);
    localStorage.removeItem('ws_auth'); supabase.auth.signOut();
    localStorage.removeItem('ws_auth_admin');
    setIsSuperAdmin(false);
    setIsMobileMenuOpen(false); // Reset menu state on logout
  };

  const handleImpersonate = async (targetUser: User) => {
    if (!user) return;
    try {
      // Save current user as admin context if not already impersonating
      if (!adminUser) {
        setAdminUser(user);
        localStorage.setItem('ws_auth_admin', JSON.stringify(user));
      }

      // Fetch the full profile and context for the target user (Hydration)
      // This is crucial for multi-tenant stability
      const fullProfile = await db.getUserByAuthId(targetUser.authId!);
      if (!fullProfile) {
        throw new Error('Could not resolve full profile for impersonation');
      }

      // Switch to target user
      if (fullProfile.availableCompanies && fullProfile.availableCompanies.length > 0) {
        db.setCompanyId(fullProfile.availableCompanies[0].id);
      } else {
        db.setCompanyId(fullProfile.companyId ?? null);
      }

      db.setUserId(fullProfile.id);
      localStorage.setItem('ws_auth', JSON.stringify(fullProfile));
      setUser(fullProfile);

      // Force return to home to reset all view states
      window.location.hash = '#/home';
      setIsMobileMenuOpen(false);
    } catch (err: any) {
      console.error('Impersonation failed:', err);
      alert('Failed to switch user: ' + err.message);
    }
  };

  const handleBackToAdmin = () => {
    if (!adminUser) return;
    if (adminUser.availableCompanies && adminUser.availableCompanies.length > 0) {
      db.setCompanyId(adminUser.availableCompanies[0].id);
    }
    db.setUserId(adminUser.id);
    localStorage.setItem('ws_auth', JSON.stringify(adminUser));
    setUser(adminUser);
    setAdminUser(null);
    localStorage.removeItem('ws_auth_admin');
    window.location.hash = '/personnel';
  };

  if (initializing || !sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="space-y-1">
            <p className="text-slate-900 font-extrabold text-lg tracking-tight">Jobs<span className="text-blue-600">Report</span></p>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">Verifica sessione in corso...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        {/* Public & Entrance Route */}
        <Route path="/" element={user ? <Navigate to="/home" replace /> : <LoginView onLogin={handleLogin} />} />
        <Route path="/richiesta-registrazione" element={<RegistrationRequestView />} />
        <Route path="/presentation" element={<PresentationView />} />
        <Route path="/privacy" element={<PrivacyView />} />
        <Route path="/terms" element={<TermsView />} />
        <Route path="/reset-password" element={<ResetPasswordView t={t} />} />

        {/* Protected Routes Wrapper */}
        <Route
          path="/*"
          element={
            !user ? (
              <Navigate to="/" replace />
            ) : (
              <AppLayout
                user={user}
                isSuperAdmin={isSuperAdmin}
                onLogout={handleLogout}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                unreadCount={unreadCount}
                setUser={setUser}
              >
                {adminUser && (
                  <div className="bg-amber-600 text-white px-4 py-2 flex justify-between items-center text-sm font-bold shadow-lg animate-in slide-in-from-top duration-300 relative z-[60]">
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={16} />
                      <span>{t('auth.impersonating')}: <span className="underline">{user.name}</span> ({user.username})</span>
                    </div>
                    <button onClick={handleBackToAdmin} className="bg-white text-amber-600 px-3 py-1 rounded-lg hover:bg-amber-50 transition-colors flex items-center gap-1.5">
                      <LogOut size={14} /> {t('auth.backToAdmin')}
                    </button>
                  </div>
                )}
                <Routes>
                  <Route path="/home" element={<HomeView user={user} isSuperAdmin={isSuperAdmin} />} />
                  <Route path="/reports" element={<ReportsView user={user} />} />
                  <Route path="/work-summary" element={authService.can(user, 'approve', 'reports') ? <WorkSummaryView user={user} /> : <Navigate to="/" />} />
                  <Route path="/clients" element={authService.can(user, 'read', 'clients') ? <ClientsView t={t} user={user} /> : <Navigate to="/" />} />
                  <Route path="/projects" element={<ProjectsView user={user} />} />
                  <Route path="/communications" element={<CommunicationsHub currentUser={user} isPremium={hasFeature('communications')} onUpgradeRequest={() => setIsCommsUpgradeOpen(true)} />} />
                  <Route path="/subcontractors" element={authService.canAccessAdmin(user) ? <SubcontractorsView user={user} /> : <Navigate to="/" />} />
                  <Route path="/personnel" element={authService.canAccessAdmin(user) ? <PersonnelView user={user} onImpersonate={handleImpersonate} /> : <Navigate to="/" />} />
                  <Route path="/companies" element={isSuperAdmin ? <CompaniesView /> : <Navigate to="/" />} />
                  <Route path="/profile" element={<ProfileView user={user} onUpdate={(updated) => { setUser(updated); localStorage.setItem('ws_auth', JSON.stringify(updated)); }} t={t} />} />
                  <Route path="/help" element={<HelpView user={user} isMobile={isMobile} t={t} />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </AppLayout>
            )
          }
        />
      </Routes>
      {showOnboarding && user && authService.canAccessAdmin(user) && (
        <OnboardingGuide
          userRole={user.role}
          onComplete={() => {
            localStorage.setItem('onboarding_v1', 'completed');
            setShowOnboarding(false);
            setIsMobileMenuOpen(false);
          }}
          onStepChange={(step) => {
            if (step.requiresSidebar) {
              setIsMobileMenuOpen(true);
            } else {
              if (window.innerWidth < 1024) {
                setIsMobileMenuOpen(false);
              }
            }
          }}
        />
      )}
      <AIChatAssistant />
      {isCommsUpgradeOpen && (
        <UpgradeModal feature="communications" onClose={() => setIsCommsUpgradeOpen(false)} />
      )}
    </HashRouter>
  );
};

export default App;   // ✔ QUI È IL POSTO GIUSTO
