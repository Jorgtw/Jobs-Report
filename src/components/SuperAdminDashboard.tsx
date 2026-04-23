import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Activity, 
  FileText, 
  Award, 
  TrendingUp,
  Clock
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { db } from '../services/dbService';

interface MiniCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const MiniCard: React.FC<MiniCardProps> = ({ title, value, icon, color }) => (
  <div className="bg-white px-3 py-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 transition-all hover:shadow-md hover:border-slate-200">
    <div className={`p-2 rounded-lg ${color} text-white shrink-0`}>
      {React.cloneElement(icon as React.ReactElement, { size: 14 })}
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{title}</p>
      <h3 className="text-base font-black text-slate-900 leading-none">{value}</h3>
    </div>
  </div>
);

const SuperAdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    newCompanies: 0,
    activeCompanies: 0,
    totalReports: 0,
    newPremiums: 0
  });
  const [topActive, setTopActive] = useState<{ name: string, count: number }[]>([]);
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
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-400">
      {/* Header compatto */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="text-blue-600" size={20} />
            {t('dashboard.weeklyOverview')}
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">{t('dashboard.last7DaysData')}</p>
        </div>
        <a
          href="#/companies"
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-50 hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95 whitespace-nowrap"
        >
          {t('dashboard.companiesManagement')}
        </a>
      </div>

      {/* KPI Cards (Grid Compatta) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniCard
          title={t('dashboard.newCompanies')}
          value={stats.newCompanies}
          icon={<Building2 />}
          color="bg-blue-600"
        />
        <MiniCard
          title={t('dashboard.activeCompanies')}
          value={stats.activeCompanies}
          icon={<Activity />}
          color="bg-emerald-500"
        />
        <MiniCard
          title={t('dashboard.newPremiums')}
          value={stats.newPremiums}
          icon={<Award />}
          color="bg-amber-500"
        />
        <MiniCard
          title={t('dashboard.totalReports')}
          value={stats.totalReports}
          icon={<FileText />}
          color="bg-indigo-600"
        />
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-blue-50 rounded-md text-blue-600">
            <TrendingUp size={14} />
          </div>
          <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">{t('dashboard.mostActiveWeekly')}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {topActive.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic text-center py-4 md:col-span-2">{t('common.noData')}</p>
          ) : (
            topActive.map((co, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-100 hover:bg-white transition-all group">
                <div className="flex items-center gap-2 max-w-[70%]">
                  <span className="text-[10px] font-black text-slate-300 w-4 group-hover:text-blue-400">0{idx + 1}</span>
                  <span className="text-xs font-bold text-slate-700 truncate">{co.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-blue-600">{co.count}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{t('common.reports')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default SuperAdminDashboard;
