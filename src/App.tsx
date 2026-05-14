import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { supabase } from './services/supabase';
import {
  FileText,
  Users,
  Briefcase,
  LogOut,
  Menu,
  User as UserIcon,
  Globe,
  Building2,
  ClipboardList,
  ShieldAlert,
  Mail,
  HelpCircle,
  Download,
  Lock,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { db } from './services/dbService';
import { authService } from './services/authService';
import { User, Project } from './types';
import { Language } from './i18n';
import { useTranslation } from './contexts/LanguageContext';
import logoImg from './assets/logo.png';
import { useSubscription } from './hooks/useSubscription';

// --- Lazy-loaded Pages ---
const HomeView = React.lazy(() => import('./pages/HomeView'));
const ReportsView = React.lazy(() => import('./pages/ReportsView'));
const WorkSummaryView = React.lazy(() => import('./pages/WorkSummaryView'));
const ClientsView = React.lazy(() => import('./pages/ClientsView'));
const ProjectsView = React.lazy(() => import('./pages/ProjectsView'));
const SubcontractorsView = React.lazy(() => import('./pages/SubcontractorsView'));
const PersonnelView = React.lazy(() => import('./pages/PersonnelView'));
const ProfileView = React.lazy(() => import('./pages/ProfileView'));
const HelpView = React.lazy(() => import('./pages/HelpView'));
const CompaniesView = React.lazy(() => import('./pages/CompaniesView'));
const LoginView = React.lazy(() => import('./pages/LoginView'));
const RegistrationRequestView = React.lazy(() => import('./pages/RegistrationRequestView'));
const PresentationView = React.lazy(() => import('./pages/PresentationView'));
const PrivacyView = React.lazy(() => import('./pages/PrivacyView'));
const TermsView = React.lazy(() => import('./pages/TermsView'));
const ResetPasswordView = React.lazy(() => import('./pages/ResetPasswordView'));
const CommunicationsHub = React.lazy(() => import('./components/CommunicationsHub'));

// --- Local Shared Components ---
import { UpgradeModal } from './components/UpgradeModal';
import OnboardingGuide from './components/OnboardingGuide';
import AIChatAssistant from './components/AIChatAssistant';

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
const getNavLinks = (t: any, user: User | null, hasCommunications: boolean = false) => {
  const isSA = user?.role?.toLowerCase() === 'superadmin';
  const isOperator = user?.role?.toLowerCase() === 'operator';

  const links = [
    { name: t('dashboard.companiesManagement'), path: '/companies', icon: Building2, show: isSA, color: 'bg-blue-600' },
    { name: t('common.clients'), path: '/clients', icon: Users, show: !isSA && (user?.role === 'admin' || user?.role === 'supervisor'), color: 'bg-emerald-500' },
    { name: t('common.personnel'), path: '/personnel', icon: ShieldAlert, show: !isSA && (user?.role === 'admin' || user?.role === 'supervisor'), color: 'bg-rose-500' },
    { name: t('common.projects'), path: '/projects', icon: Briefcase, show: !isSA && authService.can(user, 'read', 'projects'), color: 'bg-amber-500' },
    { 
      name: t('common.internalCommMenu'), 
      path: '/communications', 
      icon: Mail, 
      show: !isSA && authService.can(user, 'read', 'communications') && (!isOperator || hasCommunications), 
      color: 'bg-blue-600', 
      premiumOnly: true 
    },
    { name: t('common.subcontractors'), path: '/subcontractors', icon: Building2, show: !isSA && authService.canAccessAdmin(user), color: 'bg-cyan-500' },
    { name: t('common.reports'), path: '/reports', icon: FileText, show: !isSA && authService.can(user, 'read', 'reports'), color: 'bg-blue-500' },
    { name: t('common.workSummary'), path: '/work-summary', icon: ClipboardList, show: !isSA && authService.can(user, 'approve', 'reports'), color: 'bg-indigo-500' },
    { name: t('auth.profile'), path: '/profile', icon: UserIcon, show: !!user && !isOperator, color: 'bg-slate-600' },
    { name: t('common.help'), path: '/help', icon: HelpCircle, show: !isSA && !!user && !isOperator, color: 'bg-blue-600' }
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

// --- User Settings Dropdown ---
const UserDropdown: React.FC<{ user: User, onLogout: () => void }> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('app_notification_audio');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('app_notification_audio', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isOperator = user.role?.toLowerCase() === 'operator';

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 ring-4 ring-white shadow-sm hover:bg-blue-200 transition-colors"
      >
        <UserIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-[100] py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-3 border-b border-slate-50">
            <p className="text-sm font-black text-slate-900 leading-none">{user.name}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {t(`projects.role${user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()}` as any)}
            </p>
          </div>

          <div className="p-2 border-b border-slate-50">
            <div className="flex items-center justify-between px-2 py-2 hover:bg-slate-50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${soundEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{t('communications.push_sound' as any)}</p>
                </div>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-10 h-5 rounded-full p-1 transition-all duration-200 ${soundEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          <nav className="p-2">
            {!isOperator && (
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all font-bold text-xs"
              >
                <UserIcon size={16} />
                {t('auth.profile')}
              </Link>
            )}
            <button
              onClick={() => { onLogout(); setIsOpen(false); }}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-xs mt-1"
            >
              <LogOut size={16} />
              {t('common.logout')}
            </button>
          </nav>
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
  const { hasFeature } = useSubscription(user.companyId);

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, setIsMobileMenuOpen]);

  const hasComms = hasFeature('communications');
  const filteredLinks = getNavLinks(t, user, hasComms);

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
                          window.location.reload();
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
              <UserDropdown user={user} onLogout={onLogout} />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};

// --- App Component ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ws_auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const activeCompId = parsed.companyId || parsed.availableCompanies?.[0]?.id;
        if (activeCompId) db.setCompanyId(activeCompId);
        if (parsed.id) db.setUserId(parsed.id);
        return parsed;
      } catch (e) {
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
  const { hasFeature } = useSubscription(user?.companyId);

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
    const h = window.location.hash;
    if (h.includes('type=recovery') || (h.includes('access_token=') && h.includes('recovery'))) {
      sessionStorage.setItem('recovery_pending', 'true');
    }
    const isRecoveryPending = sessionStorage.getItem('recovery_pending') === 'true';

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const userData = await db.getUserByAuthId(session.user.id);
          if (userData) {
            const activeCompId = userData.companyId || userData.availableCompanies?.[0]?.id;
            if (activeCompId) db.setCompanyId(activeCompId);
            db.setUserId(userData.id);
            localStorage.setItem('ws_auth', JSON.stringify(userData));
            setUser(userData);
            if (isRecoveryPending) {
              sessionStorage.removeItem('recovery_pending');
              window.location.hash = '#/reset-password';
            }
          }
        } catch (err) {
          console.error('AUTH: Initial auth error:', err);
        }
      }
      setSessionReady(true);
      setInitializing(false);
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && sessionStorage.getItem('recovery_pending') === 'true')) {
          if (session?.user) {
            const userData = await db.getUserByAuthId(session.user.id);
            if (userData) {
              const activeCompId = userData.companyId || userData.availableCompanies?.[0]?.id;
              if (activeCompId) db.setCompanyId(activeCompId);
              db.setUserId(userData.id);
              localStorage.setItem('ws_auth', JSON.stringify(userData));
              setUser(userData);
              sessionStorage.removeItem('recovery_pending');
              window.location.hash = '#/reset-password';
            }
          }
        } else if (event === 'SIGNED_IN' && !user) {
          if (session?.user) {
            const userData = await db.getUserByAuthId(session.user.id);
            if (userData) {
              const activeCompId = userData.companyId || userData.availableCompanies?.[0]?.id;
              if (activeCompId) db.setCompanyId(activeCompId);
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
    if (user && user.companyId && !isSuperAdmin) {
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

  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    if (!user) return;
    const updateUnread = async () => {
      try {
        const count = await db.getUnreadCount();
        setUnreadCount(count);
      } catch (e) {
        console.error("Unread update error:", e);
      }
    };
    updateUnread();
    window.addEventListener('refresh-unread-count', updateUnread);
    return () => window.removeEventListener('refresh-unread-count', updateUnread);
  }, [user?.id, user?.companyId]);

  const handleLogin = (u: User) => {
    if (u.availableCompanies && u.availableCompanies.length > 0) db.setCompanyId(u.availableCompanies[0].id);
    db.setUserId(u.id);
    localStorage.setItem('ws_auth', JSON.stringify(u));
    window.location.hash = '/home';
    setUser(u);
    setIsMobileMenuOpen(false);
  };
  const handleLogout = () => {
    db.setCompanyId(null);
    setUser(null);
    setAdminUser(null);
    localStorage.removeItem('ws_auth'); supabase.auth.signOut();
    localStorage.removeItem('ws_auth_admin');
    setIsSuperAdmin(false);
    setIsMobileMenuOpen(false);
  };

  const handleImpersonate = async (targetUser: User) => {
    if (!user) return;
    try {
      if (!adminUser) {
        setAdminUser(user);
        localStorage.setItem('ws_auth_admin', JSON.stringify(user));
      }
      const fullProfile = await db.getUserByAuthId(targetUser.authId!);
      if (fullProfile.availableCompanies && fullProfile.availableCompanies.length > 0) {
        db.setCompanyId(fullProfile.availableCompanies[0].id);
      } else {
        db.setCompanyId(fullProfile.companyId ?? null);
      }
      db.setUserId(fullProfile.id);
      localStorage.setItem('ws_auth', JSON.stringify(fullProfile));
      setUser(fullProfile);
      window.location.hash = '#/home';
      setIsMobileMenuOpen(false);
    } catch (err: any) {
      alert('Failed to switch user: ' + err.message);
    }
  };

  const handleBackToAdmin = () => {
    if (!adminUser) return;
    if (adminUser.availableCompanies && adminUser.availableCompanies.length > 0) db.setCompanyId(adminUser.availableCompanies[0].id);
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
      <React.Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">Caricamento...</p>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/home" replace /> : <LoginView onLogin={handleLogin} />} />
          <Route path="/richiesta-registrazione" element={<RegistrationRequestView />} />
          <Route path="/presentation" element={<PresentationView />} />
          <Route path="/privacy" element={<PrivacyView />} />
          <Route path="/terms" element={<TermsView />} />
          <Route path="/reset-password" element={<ResetPasswordView t={t} />} />
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
                    <Route path="/subcontractors" element={authService.canAccessAdmin(user) ? <SubcontractorsView /> : <Navigate to="/" />} />
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
      </React.Suspense>
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

export default App;
