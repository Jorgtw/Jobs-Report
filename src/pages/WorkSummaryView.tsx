import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  ShieldAlert, 
  FileDown, 
  FileSpreadsheet, 
  Filter 
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation, localeMap } from '../contexts/LanguageContext';
import { db } from '../services/dbService';
import { User } from '../types';
import { useSummary } from '../hooks/useSummary';
import { useProjects } from '../hooks/useProjects';
import { useClients } from '../hooks/useClients';
import { useUsers } from '../hooks/useUsers';
import { useSubcontractors } from '../hooks/useSubcontractors';
import { exportToPDF, exportReportExcel, exportProjectSummaryToPDF } from '../services/exportService';
import { filterInputClasses, canUserAccessProject } from '../App';

interface WorkSummaryViewProps {
  user: User;
}

const WorkSummaryView: React.FC<WorkSummaryViewProps> = ({ user }) => {
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



  const groupedByProject = useMemo(() => {
    const grouped = new Map<string, any>();
    filteredData.forEach(row => {
      if (!grouped.has(row.projectId)) {
        grouped.set(row.projectId, {
          id: row.projectId,
          name: row.projectName,
          clientName: row.clientName,
          hours: 0,
          totalCost: 0,
          totalExpenses: 0,
          revenue: 0,
          margin: 0,
          dateDisplay: 'Periodo'
        });
      }
      const group = grouped.get(row.projectId);
      group.hours += row.totalHours || 0;
      group.totalExpenses += row.totalExpenses || 0;
      group.revenue += row.revenue || 0;
      group.margin += row.margin || 0;
    });
    return Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredData]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, row) => {
      acc.hours += row.totalHours || 0;
      acc.personnelCost += row.personnelCost || 0;
      acc.subcontractCost += row.subcontractorCost || 0;
      acc.totalExpenses += row.totalExpenses || 0;
      acc.totalCost += (row.personnelCost || 0) + (row.subcontractorCost || 0) + (row.totalExpenses || 0);
      acc.revenue += row.revenue || 0;
      acc.margin += row.margin || 0;
      return acc;
    }, {
      hours: 0, personnelCost: 0, subcontractCost: 0, totalExpenses: 0, totalCost: 0, revenue: 0, margin: 0
    });
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
        exportToPDF(rows, lang, user.name, { hours: totals.hours, cost: 0, revenue: totals.revenue, expenses: 0 });
      } else if (exportType === 'excel') {
        await exportReportExcel(user.companyId || '', filters, lang);
      }
      
      const idsToDelete = Array.from(new Set(filteredData.map(s => s.id.split('_')[0])));
      await db.deleteReports(idsToDelete);
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      setIsArchiveModalOpen(false);
    } catch (err: any) {
      alert(t('reports.deleteError') + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('reports.summaryTitle')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              exportProjectSummaryToPDF(groupedByProject, totals, lang, user.name);
            }}
            className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl shadow-md hover:bg-indigo-700 transition-all uppercase tracking-tight flex items-center gap-1.5"
          >
            <FileDown size={14} /> PDF
          </button>
          <button
            onClick={() => {
              exportReportExcel(user.companyId || '', { ...filters, adminStatus: adminStatus === 'Tutti' ? undefined : adminStatus }, lang);
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
                  <FileDown size={18} /> {`${t('reports.exportAndProceed')} (PDF)`}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => handleDeleteOperation('excel')}
                  className="w-full py-3 px-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <FileSpreadsheet size={18} /> {`${t('reports.exportAndProceed')} (Excel)`}
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

export default WorkSummaryView;
