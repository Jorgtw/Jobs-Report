import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Activity, 
  FileText, 
  Award, 
  TrendingUp,
  Clock,
  ExternalLink
} from 'lucide-react';
import { LanguageContext } from '../App';
import { db } from '../services/dbService';

interface MiniCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}

const MiniCard: React.FC<MiniCardProps> = ({ title, value, icon, color, trend }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:border-slate-200">
    <div className={`p-3 rounded-xl ${color} text-white shadow-sm ring-4 ring-white`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl font-black text-slate-900">{value}</h3>
        {trend && <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5"><TrendingUp size={10} /> {trend}</span>}
      </div>
    </div>
  </div>
);

const SuperAdminDashboard: React.FC = () => {
  const { t } = React.useContext(LanguageContext);
  const [stats, setStats] = useState({
    newCompanies: 0,
    activeCompanies: 0,
    totalReports: 0,
    newPremiums: 0
  });
  const [topActive, setTopActive] = useState<{name: string, count: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [s, top] = await Promise.all([
          db.getGlobalWeeklyStats(),
          db.getGlobalWeeklyActiveCompaniesList()
        ]);
        setStats(s);
        setTopActive(top);
      } catch (err) {
        console.error("Error loading SA dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header compatto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="text-blue-600" size={24} /> 
            {t('weeklyOverview')}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{t('last7DaysData')}</p>
        </div>
        <a 
          href="#/companies" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
        >
          {t('companiesManagement')} <ExternalLink size={14} />
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniCard 
          title={t('newCompanies')} 
          value={stats.newCompanies} 
          icon={<Building2 size={20} />} 
          color="bg-blue-600" 
        />
        <MiniCard 
          title={t('activeCompanies')} 
          value={stats.activeCompanies} 
          icon={<Activity size={20} />} 
          color="bg-emerald-500" 
        />
        <MiniCard 
          title={t('newPremiums')} 
          value={stats.newPremiums} 
          icon={<Award size={20} />} 
          color="bg-amber-500" 
        />
        <MiniCard 
          title={t('totalReports')} 
          value={stats.totalReports} 
          icon={<FileText size={20} />} 
          color="bg-indigo-600" 
        />
      </div>

      {/* Sezione Bottom: Ranking e Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Active Companies */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-4">
            <div className="p-2 bg-blue-50 rounded-lg"><TrendingUp className="text-blue-600" size={18} /></div>
            <h3 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-widest leading-none">{t('mostActiveWeekly')}</h3>
          </div>
          
          <div className="space-y-3 mt-4">
            {topActive.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">{t('noData')}</p>
            ) : (
              topActive.map((co, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-blue-50/50 hover:border-blue-100 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{co.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-blue-600">{co.count}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{t('reports')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info Box / Notes */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-all"></div>
          <div className="relative z-10">
            <div className="p-2 bg-white/10 rounded-lg w-fit mb-4"><Clock size={20} className="text-blue-400" /></div>
            <h3 className="text-lg font-black tracking-tight mb-2">{t('pendingRequestsReminder')}</h3>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-6">
              {t('pendingRequestsDesc')}
            </p>
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-sans">{t('quickSupport')}</div>
              <p className="text-xs font-bold text-slate-300">{t('quickSupportDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
