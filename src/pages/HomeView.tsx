import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Clock, 
  LogOut 
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
        <div className="grid grid-cols-3 gap-1 pb-1.5">
          <SmallStat label={t('common.projects')} value={stats.activeProjects} to="/projects" isLoading={loading} />
          <SmallStat label={t('common.reports')} value={stats.pendingReports} to="/reports" isLoading={loading} />
          <SmallStat label={t('common.hours')} value={stats.pendingHours.toLocaleString(localeMap[lang], { maximumFractionDigits: 1 })} to="/reports" isLoading={loading} />
        </div>

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
  const { t, lang } = useTranslation();

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

  const { hasFeature } = useSubscription(user.companyId);
  const actions = getNavLinks(t, user, hasFeature('communications'));
  const isOperator = user.role?.toLowerCase() === 'operator';

  const handleManualLogout = () => {
    db.setCompanyId(null);
    localStorage.removeItem('ws_auth');
    supabase.auth.signOut();
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

        <nav className={`grid grid-cols-2 ${isOperator ? 'sm:grid-cols-2 max-w-md' : 'sm:grid-cols-3 lg:grid-cols-4'} gap-3`}>
          {actions.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all group active:scale-[0.98]"
            >
              <div className={`${link.color} p-2.5 rounded-xl text-white shadow-sm group-hover:scale-110 transition-transform`}>
                <link.icon size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-slate-700 uppercase tracking-tight group-hover:text-blue-600 transition-colors truncate">{link.name}</span>
              </div>
            </Link>
          ))}

          {!isOperator && (
            <button
              onClick={handleManualLogout}
              className={`flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-red-400 hover:bg-red-50 transition-all group active:scale-[0.98]`}
            >
              <div className="bg-slate-100 p-2.5 rounded-xl text-slate-400 transition-colors group-hover:bg-red-500 group-hover:text-white">
                <LogOut size={18} />
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-xs font-black text-slate-500 uppercase tracking-tight group-hover:text-red-600 transition-colors truncate">{t('common.logout')}</span>
              </div>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
};

export default HomeView;

// Re-importing missing icons for getNavLinks
import { 
  Building2, 
  Users, 
  ShieldAlert, 
  Briefcase, 
  Mail, 
  ClipboardList, 
  User as UserIcon, 
  HelpCircle 
} from 'lucide-react';
import { supabase } from '../services/supabase';
