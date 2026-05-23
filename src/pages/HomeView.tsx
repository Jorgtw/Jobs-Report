import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Clock, 
  LogOut,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Wallet,
  Briefcase,
  Building2, 
  Users, 
  HardHat, 
  Mail, 
  ClipboardList, 
  User as UserIcon, 
  HelpCircle 
} from 'lucide-react';
import { db } from '../services/dbService';
import { authService } from '../services/authService';
import { User } from '../types';
import { useTranslation, localeMap } from '../contexts/LanguageContext';
import { useSubscription } from '../hooks/useSubscription';
import SuperAdminDashboard from '../components/SuperAdminDashboard';

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
      const compId = db.getCompanyIdSafe();
      if (!compId) return;
      
      setLoading(true);
      try {
        const [summary, allProjects] = await Promise.all([
          db.getSummary(),
          db.getProjects()
        ]);

        const activeProjectsCount = allProjects.filter((p: any) => p.status?.toUpperCase() === 'ATTIVO' || p.status?.toLowerCase() === 'active').length;
        const pendingData = summary.filter((s: any) => (s.invoiceStatus || 'Pending') === 'Pending');

        const pendingReports = new Set(pendingData.map((s: any) => s.id.split('_')[0])).size;
        const pendingHours = pendingData.reduce((acc: number, s: any) => acc + (s.totalHours || 0), 0);
        const pendingExpenses = pendingData.reduce((acc: number, s: any) => acc + (s.cost || 0) + (s.totalExpenses || 0), 0);
        const pendingToInvoice = pendingData.reduce((acc: number, s: any) => acc + (s.revenue || 0), 0);
        const pendingMargin = pendingToInvoice - pendingExpenses;

        setStats({
          activeProjects: activeProjectsCount,
          pendingReports,
          pendingHours,
          pendingExpenses,
          pendingToInvoice,
          pendingMargin
        });
      } catch (err) {
        console.error("Error loading stats:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [db.getCompanyIdSafe()]);

  const SmallStat = ({ label, value, to, valueColor = "text-slate-900", isLoading, icon: Icon }: { label: string, value: string | number, to: string, valueColor?: string, isLoading?: boolean, icon: React.ElementType }) => (
    <Link to={to} className="flex flex-col p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 shadow-sm hover:shadow-md transition-all group active:scale-[0.98]">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
          <Icon size={16} />
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">{label}</span>
      </div>
      {isLoading ? (
        <span className="inline-block w-16 h-6 bg-slate-100 animate-pulse rounded mt-1" />
      ) : (
        <span className={`text-lg sm:text-xl font-bold tracking-tight truncate ${valueColor}`} title={String(value)}>{value}</span>
      )}
    </Link>
  );

  const formatNum = (val: number) => val.toLocaleString(localeMap[lang], { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-2 mb-3 ml-1">
        <h2 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">{t('dashboard.worksInProgress')}</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SmallStat label={t('common.projects')} value={stats.activeProjects} to="/projects" icon={Briefcase} isLoading={loading} />
        <SmallStat label={t('common.reports')} value={stats.pendingReports} to="/reports" icon={FileText} isLoading={loading} />
        <SmallStat label={t('common.hours')} value={stats.pendingHours.toLocaleString(localeMap[lang], { maximumFractionDigits: 1 })} to="/reports" icon={Clock} isLoading={loading} />
        <SmallStat label={t('dashboard.estimatedExpenses')} value={formatNum(stats.pendingExpenses)} to="/work-summary" valueColor="text-rose-600" icon={TrendingDown} isLoading={loading} />
        <SmallStat label={t('dashboard.toInvoice')} value={formatNum(stats.pendingToInvoice)} to="/work-summary" valueColor="text-blue-600" icon={Wallet} isLoading={loading} />
        <SmallStat label={t('dashboard.margin')} value={formatNum(stats.pendingMargin)} to="/work-summary" valueColor={stats.pendingMargin >= 0 ? "text-emerald-600" : "text-rose-600"} icon={TrendingUp} isLoading={loading} />
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

interface HomeViewProps {
  user: User;
  isSuperAdmin: boolean;
}

const HomeView: React.FC<HomeViewProps> = ({ user, isSuperAdmin }) => {
  const { t } = useTranslation();

  const getNavLinks = (t: any, user: User | null, hasCommunications: boolean = false) => {
    const isSA = user?.role?.toLowerCase() === 'superadmin';
    const isOperator = authService.isOperator(user);

    const links = [
      { name: t('dashboard.companiesManagement'), path: '/companies', icon: Building2, show: isSA, color: 'bg-blue-600' },
      { name: t('common.clients'), path: '/clients', icon: Users, show: !isSA && (user?.role === 'admin' || user?.role === 'supervisor'), color: 'bg-emerald-500' },
      { name: t('common.personnel'), path: '/personnel', icon: HardHat, show: !isSA && (user?.role === 'admin' || user?.role === 'supervisor'), color: 'bg-rose-500' },
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

  const { hasFeature } = useSubscription(user.companyId);
  const actions = getNavLinks(t, user, hasFeature('communications'));
  const isOperator = authService.isOperator(user);

  const handleManualLogout = async () => {
    try {
      // 1. Set specific app status to prevent resolution loops during logout
      db.setCompanyId(null);
      localStorage.removeItem('ws_auth');
      localStorage.removeItem('ws_auth_admin');
      
      // 2. Perform server-side sign out (await to ensure storage is cleared)
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("SignOut error (ignoring to proceed with local cleanup):", err);
    } finally {
      // 3. Force full reload to clean memory state
      window.location.href = '/';
    }
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
          <Link 
            to="/reports" 
            className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-200 flex items-center justify-between group hover:scale-[1.01] transition-all active:scale-[0.99] mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Plus size={24} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-black uppercase tracking-tight leading-tight">{t('reports.new')}</h3>
                <p className="text-[10px] font-bold text-blue-100 opacity-80 leading-tight mt-0.5">{t('reports.activityManagement')}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-blue-200 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      ))}

      <div className="mt-6">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
          {isSuperAdmin ? 'Strumenti Rapidi' : t('common.quickMenu')}
        </h3>

        <nav className="flex flex-wrap gap-4 sm:gap-6 mt-4">
          {actions.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="flex flex-col items-center justify-center w-28 h-28 sm:w-36 sm:h-36 bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.05)] rounded-[1.5rem] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all group active:scale-[0.98]"
            >
              <div className={`${link.color.replace('bg-', 'text-')} mb-3 group-hover:-translate-y-1 transition-transform`}>
                <link.icon size={36} strokeWidth={2} />
              </div>
              <span className="text-[12px] font-semibold text-slate-700 capitalize tracking-tight text-center group-hover:text-blue-600 transition-colors">{link.name}</span>
            </Link>
          ))}

          {!isOperator && (
            <button
              onClick={handleManualLogout}
              className="flex flex-col items-center justify-center w-28 h-28 sm:w-36 sm:h-36 bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.05)] rounded-[1.5rem] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all group active:scale-[0.98]"
            >
              <div className="text-slate-400 mb-3 group-hover:-translate-y-1 group-hover:text-red-500 transition-all">
                <LogOut size={36} strokeWidth={2} />
              </div>
              <span className="text-[12px] font-semibold text-slate-700 capitalize tracking-tight text-center group-hover:text-red-600 transition-colors">{t('common.logout')}</span>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
};

export default HomeView;

import { supabase } from '../services/supabase';
