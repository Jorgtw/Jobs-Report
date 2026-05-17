import React, { useState, useEffect, useMemo } from 'react';
// Triggering Vercel rebuild for professional email flow restoration - 2026-05-15
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Clock, 
  FileText, 
  Users, 
  User as UserIcon, 
  FileDown, 
  FileSpreadsheet, 
  Filter, 
  Search, 
  CheckCircle2, 
  Copy, 
  Settings
} from 'lucide-react';
import { useTranslation, localeMap } from '../contexts/LanguageContext';
import { db } from '../services/dbService';
import { authService } from '../services/authService';
import { User, Project, WorkReport, AdditionalWorker, Expense } from '../types';
import { useReports } from '../hooks/useReports';
import { useProjects } from '../hooks/useProjects';
import { useClients } from '../hooks/useClients';
import { useSubcontractors } from '../hooks/useSubcontractors';
import { useComplianceReportController } from '../hooks/useComplianceReportController';
import { useSubscription } from '../hooks/useSubscription';
import { exportToPDF, exportToExcel } from '../services/exportService';
import { 
  inputClasses, 
  filterInputClasses, 
  modalClasses, 
  FullWidthField, 
  canUserAccessProject 
} from '../App';
import { UpgradeModal } from '../components/UpgradeModal';
import { ComplianceReportModal } from '../components/ComplianceReportModal';

interface ReportsViewProps {
  user: User;
}

const ReportsView: React.FC<ReportsViewProps> = ({ user }) => {
  const { lang, t } = useTranslation();
  const { data: reports = [], createReport, updateReport, deleteReport } = useReports(user?.companyId ?? undefined, user?.id);
  const { data: projects = [] } = useProjects(user?.companyId ?? undefined, user?.id);
  const { data: clients = [] } = useClients(user?.companyId ?? undefined, user?.id);
  useSubcontractors(user?.companyId ?? undefined, user?.id);
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

    const monday = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    const mondayStr = monday.toISOString().split('T')[0];

    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayMonthStr = firstDayMonth.toISOString().split('T')[0];

    return reports.filter((r: WorkReport) => {
      if (filters.projectId && r.projectId !== filters.projectId) return false;
      if (filters.userId) {
        const isAuthor = r.userId === filters.userId;
        const isHelper = (r.additionalWorkers || []).some((aw: AdditionalWorker) => aw.userId === filters.userId);
        if (!isAuthor && !isHelper) return false;
      }
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const inDesc = r.description.toLowerCase().includes(s);
        const inNotes = (r.notes || '').toLowerCase().includes(s);
        const projName = projects.find((p: Project) => p.id === r.projectId)?.name.toLowerCase() || '';
        if (!inDesc && !inNotes && !projName.includes(s)) return false;
      }
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
    const worker = personnel.find(u => u.id === (updates.userId || currentWorker.userId));
    const isManualOverride = updates.manualTotalHours !== undefined
      ? true
      : (currentWorker.isManualOverride || false);

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

  const selectedProject = projects.find(p => p.id === formData.projectId);
  const availablePersonnel = useMemo(() => {
    if (!selectedProject || !selectedProject.assignedWorkerIds || selectedProject.assignedWorkerIds.length === 0) {
      return personnel;
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
          <button onClick={() => setFilters({ ...filters, dateRange: 'today' })} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${filters.dateRange === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('common.today')}</button>
          <button onClick={() => setFilters({ ...filters, dateRange: 'week' })} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${filters.dateRange === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('common.thisWeek')}</button>
          <button onClick={() => setFilters({ ...filters, dateRange: 'month' })} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${filters.dateRange === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('common.thisMonth')}</button>
          <button onClick={() => setFilters({ ...filters, dateRange: 'custom' })} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${filters.dateRange === 'custom' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('common.customRange')}</button>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-inner' : 'bg-white border-slate-200 text-slate-600 shadow-sm hover:border-slate-300'}`} title={t('reports.filters')}><Filter size={20} /></button>
        <button onClick={handleNewReport} data-onboarding="new-report-btn" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all"><Plus size={16} className="mr-2 inline" /><span className="hidden sm:inline">{t('reports.new')}</span><span className="sm:hidden">{t('common.addBtn')}</span></button>
      </div>

      {showFilters && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Search size={12} /> {t('reports.filters')}</h3>
            <button onClick={() => setFilters({ projectId: '', userId: '', search: '', dateRange: 'all', dateFrom: '', dateTo: '' })} className="text-[9px] items-center font-extrabold px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md hover:bg-slate-100 transition-colors uppercase">{t('reports.clearFilters')}</button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('reports.headerProject')}</label>
              <select value={filters.projectId} onChange={e => setFilters({ ...filters, projectId: e.target.value })} className={filterInputClasses}>
                <option value="">{t('reports.allProjects')}</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {user.role !== 'operator' && (
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('reports.worker')}</label>
                <select value={filters.userId} onChange={e => setFilters({ ...filters, userId: e.target.value })} className={filterInputClasses}>
                  <option value="">{t('reports.allWorkers')}</option>
                  {personnel.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('reports.filterByRange')}</label>
              <select value={filters.dateRange} onChange={e => setFilters({ ...filters, dateRange: e.target.value as any })} className={filterInputClasses}>
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
                <input type="text" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder={t('common.search')} className={filterInputClasses + " pl-7"} />
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            {filters.dateRange === 'custom' && (
              <div className="col-span-2 lg:col-span-4 grid grid-cols-2 gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('reports.dateFrom')}</label>
                  <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} className={filterInputClasses} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('reports.dateTo')}</label>
                  <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} className={filterInputClasses} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="sm:hidden divide-y divide-slate-100">
          {[...filteredReports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(r => {
            const proj = projects.find(p => p.id === r.projectId);
            const formattedDate = new Intl.DateTimeFormat(localeMap[lang as string] || 'it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(r.date));
            const totalWorkersCount = 1 + (r.additionalWorkers || []).length;
            const teamTotalHours = (r.teamTotalHours || (r.totalHours + (r.additionalWorkers?.reduce((sum: number, aw: any) => sum + (aw.totalHours || 0), 0) || 0))).toFixed(2);
            return (
              <div key={r.id} className="p-4 space-y-3 active:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-blue-600 capitalize flex items-center gap-2">{formattedDate}{r.activityType && r.activityType !== 'work' && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-black uppercase">{t(`reports.activity${r.activityType.charAt(0).toUpperCase() + r.activityType.slice(1)}` as any)}</span>}</div>
                    <div className="text-sm font-bold text-slate-900">{proj?.name || '---'}</div>
                    <div className="text-xs font-semibold text-slate-600 mt-0.5 flex items-center gap-1"><UserIcon size={12} className="text-slate-400" />{personnel.find(u => u.id === r.userId)?.name || t('reports.mainWorker')}{totalWorkersCount > 1 && <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-500">+{totalWorkersCount - 1}</span>}</div>
                    {r.description && <div className="text-xs text-slate-500 line-clamp-2 mt-1" title={r.description}>{r.description}</div>}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleComplianceClick(r)} className="p-2 text-indigo-600 bg-indigo-50 active:bg-indigo-100 rounded-lg transition-colors border border-indigo-100" title={t('reports.complianceReport')}><CheckCircle2 size={16} /></button>
                    <button onClick={() => handleDuplicate(r)} className="p-2 text-emerald-600 bg-emerald-50 active:bg-emerald-100 rounded-lg transition-colors border border-emerald-100" title={t('common.duplicate')}><Copy size={16} /></button>
                    {canEditReport(r) && (
                      <><button onClick={() => handleEdit(r)} className="p-2 text-blue-600 bg-blue-50 active:bg-blue-100 rounded-lg transition-colors border border-blue-100" title={t('common.edit')}><Pencil size={16} /></button><button onClick={() => handleDelete(r.id)} className="p-2 text-red-600 bg-red-50 active:bg-red-100 rounded-lg transition-colors border border-red-100" title={t('common.delete')}><Trash2 size={16} /></button></>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Users size={12} /> <span className="font-bold">{totalWorkersCount}</span></div>
                  <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100"><Clock size={12} /> <span className="font-bold">{teamTotalHours}h</span></div>
                  {r.invoiceStatus && <div className={`ml-auto px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tight border ${r.invoiceStatus === 'Pagato' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : r.invoiceStatus === 'Fatturato' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{r.invoiceStatus === 'Pending' ? t('common.statusPending') : (r.invoiceStatus === 'Fatturato' ? t('common.statusInvoiced') : t('common.statusPaid'))}</div>}
                </div>
              </div>
            );
          })}
          {reports.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">{t('common.noData')}</div>}
        </div>

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
                const formattedDate = new Intl.DateTimeFormat(localeMap[lang as string] || 'it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(r.date));
                const totalWorkersCount = 1 + (r.additionalWorkers || []).length;
                const teamTotalHours = (r.teamTotalHours || (r.totalHours + (r.additionalWorkers?.reduce((sum: number, aw: any) => sum + (aw.totalHours || 0), 0) || 0))).toFixed(2);
                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-3 py-1.5 text-xs font-bold text-blue-600 whitespace-nowrap capitalize">{formattedDate}</td>
                    <td className="px-3 py-1.5 text-xs font-medium text-slate-900 truncate max-w-[150px]" title={proj?.name}>{proj?.name || '---'}</td>
                    <td className="px-3 py-1.5 text-xs text-slate-700 truncate max-w-[120px]">{personnel.find(u => u.id === r.userId)?.name || t('reports.mainWorker')}{totalWorkersCount > 1 && <span className="ml-1 text-[10px] bg-slate-100 px-1 rounded text-slate-500">+{totalWorkersCount - 1}</span>}</td>
                    <td className="px-3 py-1.5 text-xs text-slate-600 truncate max-w-[150px] hidden lg:table-cell" title={r.description}>{r.description || '---'}</td>
                    <td className="px-3 py-1.5 text-center"><span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md text-[10px]">{totalWorkersCount}</span></td>
                    <td className="px-3 py-1.5 text-center"><span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md text-[10px] border border-blue-100">{teamTotalHours}h</span></td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => handleComplianceClick(r)} className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors" title={t('reports.complianceReport')}><CheckCircle2 size={14} /></button>
                        <button onClick={() => window.location.hash = '#activities'} className="text-slate-400 hover:text-indigo-600 transition-colors" title={t('reports.activityManagement')}><Settings size={14} /></button>
                        <button onClick={() => handleDuplicate(r)} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors" title={t('common.duplicate')}><Copy size={14} /></button>
                        {canEditReport(r) && (
                          <><button onClick={() => handleEdit(r)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title={t('common.edit')}><Pencil size={14} /></button><button onClick={() => handleDelete(r.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title={t('common.delete')}><Trash2 size={14} /></button></>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {reports.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-500 text-xs">{t('common.noData')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={modalClasses}>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-slate-900">{projects.find(p => p.id === formData.projectId)?.isInternal ? (editingId ? t('reports.edit') : t('reports.newInternal')) : (editingId ? t('reports.edit') : t('reports.new'))}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                <FullWidthField label={t('reports.activityType')} className="md:col-span-2">
                  <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-xs">
                    <button type="button" onClick={() => { if (formData.activityType !== 'work') setFormData({ ...formData, activityType: 'work', projectId: '', startTime: '08:00', endTime: '17:00', breakHours: 1, manualTotalHours: undefined, invoiceStatus: 'Pending' }); }} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.activityType === 'work' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('reports.activityWork')}</button>
                    <button type="button" onClick={() => { const intProj = projects.find(p => p.isInternal); setFormData({ ...formData, activityType: 'internal', projectId: intProj?.id || '', startTime: '', endTime: '', breakHours: 0, manualTotalHours: 0 }); }} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.activityType !== 'work' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{t('reports.activityInternal')} / {t('reports.activityAbsence')}</button>
                  </div>
                </FullWidthField>
                <FullWidthField label={t('reports.headerProject')}>
                  <select required value={formData.projectId} onChange={e => { const newProjectId = e.target.value; const proj = projects.find(p => p.id === newProjectId); setFormData({ ...formData, projectId: newProjectId, description: (formData.description === '' && proj?.description) ? proj.description : formData.description }); }} className={inputClasses}>
                    <option value="">{t('common.select')}</option>
                    {projects.filter(p => { if (editingId && p.id === reports.find(r => r.id === editingId)?.projectId) return true; if (!editingId && p.status !== 'active') return false; if (formData.activityType !== 'work') return p.isInternal; if (p.isInternal) return false; if (authService.canAccessAdmin(user)) return true; return canUserAccessProject(p, user.id); }).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </FullWidthField>
                {user.role === 'admin' && (
                  <FullWidthField label={t('reports.worker')}><select required value={formData.userId} onChange={e => setFormData({ ...formData, userId: e.target.value })} className={inputClasses}><option value="">{t('common.select')}</option>{personnel.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></FullWidthField>
                )}
                {formData.activityType !== 'work' && (
                  <FullWidthField label={t('reports.activityType')}><select value={formData.activityType} onChange={e => { const newType = e.target.value as any; setFormData({ ...formData, activityType: newType, manualTotalHours: 0, startTime: '', endTime: '', breakHours: 0 }); }} className={inputClasses}><option value="internal">{t('reports.activityInternal')}</option><option value="sickness">{t('reports.activitySickness')}</option><option value="holiday">{t('reports.activityHoliday')}</option></select></FullWidthField>
                )}
                <FullWidthField label={t('reports.headerDate')}><input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className={inputClasses} /></FullWidthField>
                <div className="md:col-span-2"><FullWidthField label={t('reports.description')}><textarea required rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={inputClasses} /></FullWidthField></div>
                {user.role === 'admin' && (
                  <div className="md:col-span-2 bg-blue-50 border border-blue-100 p-4 rounded-xl">
                    <FullWidthField label={t('reports.adminStatusLabel')}><select value={formData.invoiceStatus} onChange={e => setFormData({ ...formData, invoiceStatus: e.target.value })} className={inputClasses}><option value="Pending">{t('common.statusPending')}</option><option value="Fatturato">{t('common.statusInvoiced')}</option><option value="Pagato">{t('common.statusPaid')}</option></select></FullWidthField>
                  </div>
                )}
                <div className="md:col-span-2 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {user.role !== 'operator' && (
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
                      <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2"><Users size={16} className="text-blue-500" /> {t('reports.teamLabel')}</h3>
                      <button type="button" onClick={addWorker} className="text-xs font-bold text-blue-600 bg-white border border-blue-200 shadow-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"><Plus size={14} /> {t('reports.addWorker')}</button>
                    </div>
                  )}
                  <div className="hidden sm:grid grid-cols-12 gap-2 px-2 mb-1 pr-10 sm:pr-0">
                    <div className="col-span-3"></div>
                    <div className="col-span-2 px-1 text-[10px] font-extrabold text-slate-400 uppercase text-center">{t('reports.headerStart')}</div>
                    <div className="col-span-2 px-1 text-[10px] font-extrabold text-slate-400 uppercase text-center">{t('reports.headerEnd')}</div>
                    <div className="col-span-1 px-1 text-[10px] font-extrabold text-slate-400 uppercase text-center">{t('reports.headerBreak')}</div>
                    <div className="col-span-2 px-1 text-[10px] font-extrabold text-amber-500 uppercase text-center sm:border-l sm:border-transparent sm:pl-2">{t('reports.headerExtra')}</div>
                    <div className="col-span-2 px-1 text-[10px] font-extrabold text-slate-400 uppercase text-center sm:border-l sm:border-transparent sm:pl-2 pr-8">{t('reports.headerTotal')}</div>
                  </div>
                  {user.role !== 'operator' && formData.additionalWorkers.map((aw, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center shadow-sm relative pr-10 sm:pr-0">
                      <div className="col-span-12 sm:col-span-3"><select required value={aw.userId} onChange={e => updateWorker(idx, { userId: e.target.value })} className={inputClasses + " w-full"}><option value="">{t('reports.worker')}...</option>{availablePersonnel.filter(u => u.id !== formData.userId).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                      <div className="col-span-6 sm:col-span-2 flex flex-col gap-0.5"><label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerStart')}</label><input type="time" value={aw.startTime} onChange={e => updateWorker(idx, { startTime: e.target.value })} className={`${inputClasses} w-full text-center px-1 text-[11px] sm:text-sm`} /></div>
                      <div className="col-span-6 sm:col-span-2 flex flex-col gap-0.5"><label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerEnd')}</label><input type="time" value={aw.endTime} onChange={e => updateWorker(idx, { endTime: e.target.value })} className={`${inputClasses} w-full text-center px-1 text-[11px] sm:text-sm`} /></div>
                      <div className="col-span-4 sm:col-span-1 flex flex-col gap-0.5"><label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerBreak')}</label><input type="number" step="0.25" value={aw.breakHours} onChange={e => updateWorker(idx, { breakHours: parseFloat(e.target.value) || 0 })} className={`${inputClasses} w-full text-center px-1 text-[11px] sm:text-sm`} /></div>
                      <div className="col-span-4 sm:col-span-2 flex flex-col gap-0.5 sm:border-l sm:border-slate-200 sm:pl-2"><label className="text-[9px] font-extrabold text-amber-500 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerExtra')}</label><input type="number" step="0.25" value={aw.overtimeHours || ''} onChange={e => updateWorker(idx, { overtimeHours: parseFloat(e.target.value) || 0 })} placeholder="0" className={`${inputClasses} w-full text-center text-amber-600 font-bold bg-amber-50 border-amber-200 px-1 text-[11px] sm:text-sm`} /></div>
                      <div className="col-span-4 sm:col-span-2 flex flex-col gap-0.5 sm:border-l sm:border-slate-200 sm:pl-2"><label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerTotal')}</label><input type="number" step="0.01" value={aw.manualTotalHours !== undefined ? aw.manualTotalHours : ''} onChange={e => updateWorker(idx, { manualTotalHours: e.target.value === "" ? undefined : parseFloat(e.target.value) })} placeholder={db.calculateTotalHours(aw.startTime, aw.endTime, aw.breakHours).toFixed(2)} className="w-full px-1 py-1 bg-white border border-slate-200 rounded-lg text-center font-black text-blue-600 outline-none h-[30px] text-[11px] sm:text-sm" /></div>
                      <button type="button" onClick={() => removeWorker(idx)} className="absolute right-2 top-2 sm:top-1/2 sm:-translate-y-1/2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  ))}
                  <div className="bg-white p-2 rounded-xl border border-blue-200 grid grid-cols-12 gap-2 items-center shadow-sm relative pr-10 sm:pr-0">
                    <div className="col-span-12 sm:col-span-3"><div className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 truncate">{personnel.find(u => u.id === formData.userId)?.name || t('reports.mainWorker')}</div></div>
                    <div className="col-span-6 sm:col-span-2 flex flex-col gap-0.5"><label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerStart')}</label><input type="time" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className={`${inputClasses} w-full text-center px-1 text-[11px] sm:text-sm`} /></div>
                    <div className="col-span-6 sm:col-span-2 flex flex-col gap-0.5"><label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerEnd')}</label><input type="time" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className={`${inputClasses} w-full text-center px-1 text-[11px] sm:text-sm`} /></div>
                    <div className="col-span-4 sm:col-span-1 flex flex-col gap-0.5"><label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerBreak')}</label><input type="number" step="0.25" value={formData.breakHours} onChange={e => setFormData({ ...formData, breakHours: parseFloat(e.target.value) || 0 })} className={`${inputClasses} w-full text-center px-1 text-[11px] sm:text-sm`} /></div>
                    <div className="col-span-4 sm:col-span-2 flex flex-col gap-0.5 sm:border-l sm:border-slate-200 sm:pl-2"><label className="text-[9px] font-extrabold text-amber-500 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerExtra')}</label><input type="number" step="0.25" value={formData.overtimeHours || ''} onChange={e => setFormData({ ...formData, overtimeHours: parseFloat(e.target.value) || 0 })} placeholder="0" className={`${inputClasses} w-full text-center text-amber-600 font-bold bg-amber-50 border-amber-200 px-1 text-[11px] sm:text-sm`} /></div>
                    <div className="col-span-4 sm:col-span-2 flex flex-col gap-0.5 sm:border-l sm:border-slate-200 sm:pl-2"><label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight sm:hidden">{t('reports.headerTotal')}</label><input type="number" step="0.01" value={formData.manualTotalHours !== undefined ? formData.manualTotalHours : ''} onChange={e => setFormData({ ...formData, manualTotalHours: e.target.value === "" ? undefined : parseFloat(e.target.value) })} placeholder={db.calculateTotalHours(formData.startTime, formData.endTime, formData.breakHours).toFixed(2)} className="w-full px-1 py-1 bg-white border border-slate-200 rounded-lg text-center font-black text-blue-600 outline-none h-[30px] text-[11px] sm:text-sm" /></div>
                  </div>
                </div>
                <div className="md:col-span-2 bg-slate-100 border border-slate-200 text-slate-700 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-3"><div className="bg-white p-2 rounded-xl shadow-sm"><Clock className="w-5 h-5 text-blue-600" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('reports.teamTotalLabel')}</p><p className="text-xs text-slate-500">{t('reports.teamTotalSubLabel')}</p></div></div>
                  <div className="text-right"><span className="text-3xl font-black text-slate-800">{globalTotalHours.toFixed(2)}</span><span className="text-lg font-bold text-slate-800 ml-1">h</span></div>
                </div>
                <div className="md:col-span-2 space-y-3 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  <div className="flex justify-between items-center border-b border-amber-200 pb-3 mb-4">
                    <h3 className="text-sm font-bold text-amber-800 uppercase flex items-center gap-2"><FileText size={16} className="text-amber-500" /> {t('reports.extraExpensesLabel')}</h3>
                    <div className="flex items-center gap-3">{formData.expenses.length > 0 && <span className="text-sm font-black text-amber-700">{t('common.totalShort')} {formData.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0).toLocaleString(localeMap[lang], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}<button type="button" onClick={() => setFormData({ ...formData, expenses: [...formData.expenses, { type: 'CANTIERE', amount: 0, description: '', notes: '', km: '' } as any] })} className="text-xs font-bold text-amber-700 bg-white border border-amber-200 shadow-sm px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors flex items-center gap-1"><Plus size={14} /> {t('reports.addExpense')}</button></div>
                  </div>
                  {formData.expenses.length === 0 && <p className="text-xs text-amber-600 text-center py-2 opacity-60">{t('common.noData')}</p>}
                  {formData.expenses.map((exp: any, idx: number) => (
                    <div key={idx} className="bg-white p-2 rounded-xl border border-amber-200 grid grid-cols-12 gap-2 items-center shadow-sm relative pr-10 sm:pr-8">
                      <div className="col-span-12 sm:col-span-3 flex flex-col gap-0.5"><label className="text-[9px] font-extrabold text-amber-500 uppercase ml-1 tracking-tight sm:hidden">{t('reports.placeholderExpenseType')}</label><select value={exp.type || 'CANTIERE'} onChange={e => { const updated = [...formData.expenses] as any[]; updated[idx] = { ...updated[idx], type: e.target.value }; setFormData({ ...formData, expenses: updated }); }} className={`${inputClasses} w-full`}><option value="CANTIERE">{t('reports.expenseCantiere')}</option><option value="RIMBORSO">{t('reports.expenseRimborso')}</option><option value="KM">{t('reports.expenseKm')}</option></select></div>
                      {exp.type === 'KM' && <div className="col-span-6 sm:col-span-2 flex flex-col gap-0.5"><label className="text-[9px] font-extrabold text-amber-500 uppercase ml-1 tracking-tight sm:hidden">{t('reports.kmDistance')}</label><input type="number" step="1" min="1" placeholder={t('reports.kmDistance')} value={exp.km || ''} onChange={e => { const updated = [...formData.expenses] as any[]; updated[idx] = { ...updated[idx], km: e.target.value }; setFormData({ ...formData, expenses: updated }); }} className={`${inputClasses} w-full text-right`} /></div>}
                      <div className={`col-span-6 ${exp.type === 'KM' ? 'sm:col-span-2' : 'sm:col-span-4'} flex flex-col gap-0.5`}><label className="text-[9px] font-extrabold text-amber-500 uppercase ml-1 tracking-tight sm:hidden">{t('reports.amount')} (€)</label><input type="number" step="0.01" min="0" placeholder="0.00" value={exp.amount || ''} onChange={e => { const updated = [...formData.expenses] as any[]; updated[idx] = { ...updated[idx], amount: parseFloat(e.target.value) || 0 }; setFormData({ ...formData, expenses: updated }); }} className={`${inputClasses} w-full text-right`} /></div>
                      <div className={`col-span-12 ${exp.type === 'KM' ? 'sm:col-span-5' : 'sm:col-span-5'} flex flex-col gap-0.5`}><label className="text-[9px] font-extrabold text-amber-500 uppercase ml-1 tracking-tight sm:hidden">{t('reports.placeholderExpenseNotes')}</label><input type="text" placeholder={t('reports.placeholderExpenseNotes')} value={exp.description || exp.notes || ''} onChange={e => { const updated = [...formData.expenses] as any[]; updated[idx] = { ...updated[idx], description: e.target.value, notes: e.target.value }; setFormData({ ...formData, expenses: updated }); }} className={`${inputClasses} w-full`} /></div>
                      <button type="button" onClick={() => { const updated = [...formData.expenses]; updated.splice(idx, 1); setFormData({ ...formData, expenses: updated }); }} className="absolute right-2 top-2 sm:top-1/2 sm:-translate-y-1/2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center pt-6 border-t mt-8">
                <div>{editingId && canEditReport(reports.find(r => r.id === editingId)!) && <button type="button" onClick={() => handleDelete(editingId)} className="px-6 py-2.5 font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-2"><Trash2 size={16} /> {t('common.delete')}</button>}</div>
                <div className="flex gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors">{t('common.cancel')}</button><button type="submit" className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">{editingId ? t('common.update') : t('common.save')}</button></div>
              </div>
            </form>
          </div>
        </div>
      )}
      {isUpgradeModalOpen && <UpgradeModal feature={upgradeFeature} onClose={() => { setIsUpgradeModalOpen(false); setUpgradeFeature('generic'); }} />}
      {complianceReportToSign && <ComplianceReportModal report={complianceReportToSign} onClose={closeComplianceReport} onGenerate={handleGenerateCompliance} />}
    </div>
  );
};

export default ReportsView;
