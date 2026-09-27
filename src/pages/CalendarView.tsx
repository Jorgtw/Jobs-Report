import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { User } from '../types';
import { useTranslation, localeMap } from '../contexts/LanguageContext';
import { useProjects } from '../hooks/useProjects';
import { useClients } from '../hooks/useClients';
import { useCalendar } from '../hooks/useCalendar';
import { db } from '../services/dbService';
import { calendarService } from '../services/calendarService';
import { addDays, calendarRange, canManageCalendar, dateObject, daysInRange, localDate } from '../services/workCalendar';
import type { CalendarOccurrence, ScheduleRule } from '../services/workCalendar';
import { CalendarEditor } from '../components/CalendarEditor';
import { CalendarDialog } from '../components/CalendarDialog';

const button = 'px-3 py-2 min-h-[44px] rounded-xl border bg-white text-sm font-medium';
const statusColors: Record<string,string> = { planned: 'border-blue-200 bg-blue-50', in_progress: 'border-amber-300 bg-amber-50', completed: 'border-emerald-200 bg-emerald-50', cancelled: 'border-slate-200 bg-slate-100 opacity-70' };
export default function CalendarView({ user }: { user: User }) {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const manager = canManageCalendar(user);
  const queryClient = useQueryClient();
  const [view, setView] = useState<'month'|'week'|'today'|'upcoming'>(manager ? 'month' : 'today');
  const [day, setDay] = useState(localDate());
  const [filters, setFilters] = useState({ worker: '', client: '', project: params.get('project') || '', status: '' });
  const range = calendarRange(day,view);
  const feed = useCalendar(user,range.from,range.to);
  const { data: projects = [] } = useProjects(user.companyId || undefined,user.id);
  const { data: clients = [] } = useClients(user.companyId || undefined,user.id);
  const personnelQuery = useQuery({ queryKey: ['calendarPersonnel',user.companyId,user.id], queryFn: () => db.getUsers(), enabled: manager && !!user.companyId });
  const personnel: User[] = personnelQuery.data || [];
  const [detail, setDetail] = useState<CalendarOccurrence | null>(null);
  const [reportWorker, setReportWorker] = useState('');
  const [editor, setEditor] = useState<{ rule: ScheduleRule; workers: string[]; occurrence?: CalendarOccurrence } | null>(null);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(false);
  useEffect(() => { setDetail(null); setEditor(null); }, [user.id,user.companyId]);
  const events = useMemo(() => (feed.data || []).filter(o =>
    (!filters.worker || o.workers.some(w => w.id === filters.worker)) && (!filters.client || o.clientId === filters.client) &&
    (!filters.project || o.projectId === filters.project) && (!filters.status || o.status === filters.status)), [feed.data,filters]);
  const grouped = useMemo(() => { const map = new Map<string,CalendarOccurrence[]>(); events.forEach(o => map.set(o.date,[...(map.get(o.date)||[]),o])); return map; }, [events]);
  const dateLabel = (date: string, short = false) => dateObject(date).toLocaleDateString(localeMap[lang],{ weekday: short ? 'short' : 'long', day:'numeric', month: short ? 'short' : 'long' });
  const move = (direction: number) => {
    if (view === 'month') { const d = dateObject(day); setDay(localDate(new Date(d.getFullYear(),d.getMonth()+direction,1,12))); }
    else setDay(addDays(day,direction*(view === 'week' ? 7 : view === 'upcoming' ? 14 : 1)));
  };
  const newAssignment = () => {
    setError('');
    setEditor({ rule: { project_id: filters.project, title: '', notes: '', schedule_type: 'single', start_date: day,
      end_date: day, start_time: null, end_time: null, weekdays: [], status: 'planned' }, workers: [] });
  };
  const edit = async (o: CalendarOccurrence, duplicate = false) => {
    setOpening(true); setError('');
    try {
      const base = await calendarService.rule(user.companyId!,o.scheduleId);
      setDetail(null);
      setEditor(duplicate ? { rule: { ...base.rule, id: undefined, title: o.title, notes: o.notes, status: 'planned',
        schedule_type: 'single', start_date: o.date, end_date: o.date, weekdays: [], start_time: o.startTime, end_time: o.endTime }, workers: o.workers.map(w => w.id) }
        : { ...base, occurrence: o });
    } catch { setError(t('calendar.loadError')); } finally { setOpening(false); }
  };
  const open = (o: CalendarOccurrence) => { setDetail(o); setReportWorker(manager ? o.workers[0]?.id || '' : user.id); };
  const selectFilter = (key: keyof typeof filters, label: string, options: {id: string;name: string}[]) => <label className="text-xs font-medium flex flex-col gap-1 min-w-0">{t(`calendar.${label}`)}<select aria-label={t(`calendar.${label}`)} value={filters[key]} onChange={e => setFilters({ ...filters, [key]:e.target.value })} className="border bg-white rounded-lg p-2 min-h-[44px] text-sm w-full"><option value="">{t('calendar.all')}</option>{options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>;
  return <div className="space-y-4">
    <div className="flex flex-wrap justify-between items-center gap-3"><h1 className="text-2xl font-bold flex items-center gap-2"><CalendarDays className="text-blue-600" />{t(manager ? 'calendar.title' : 'calendar.myJobs')}</h1>{manager && <button className={`${button} !bg-blue-600 text-white flex gap-2 items-center`} onClick={newAssignment}><Plus size={18} />{t('calendar.new')}</button>}</div>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-1">{(manager ? ['month','week'] : ['today','upcoming','week']).map(v => <button key={v} className={`${button} ${view === v ? '!bg-blue-100 border-blue-300 text-blue-800' : ''}`} aria-pressed={view === v} onClick={() => { setView(v as typeof view); if (v === 'today' || v === 'upcoming') setDay(localDate()); }}>{t(`calendar.${v}`)}</button>)}</div><div className="flex items-center gap-1"><button className={button} aria-label={t('calendar.previous')} onClick={() => move(-1)}><ChevronLeft size={18} /></button><button className={button} onClick={() => setDay(localDate())}>{t('calendar.today')}</button><button className={button} aria-label={t('calendar.next')} onClick={() => move(1)}><ChevronRight size={18} /></button></div></div>
    <p className="text-lg font-semibold">{view === 'month' ? dateObject(day).toLocaleDateString(localeMap[lang],{month:'long',year:'numeric'}) : range.from === range.to ? dateLabel(day) : `${dateLabel(range.from,true)} – ${dateLabel(range.to,true)}`}</p>
    {manager && <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">{selectFilter('worker','worker',personnel)}{selectFilter('client','client',clients)}{selectFilter('project','project',projects)}{selectFilter('status','status',['planned','in_progress','completed','cancelled'].map(id => ({id,name:t(`calendar.${id}`)})))}</div>}
    {(error || feed.error || personnelQuery.error) && <div role="alert" className="bg-red-50 text-red-700 rounded-xl p-4">{error || t('calendar.loadError')}<button className={`${button} ml-2`} onClick={() => { setError(''); void feed.refetch(); if (manager) void personnelQuery.refetch(); }}>{t('calendar.retry')}</button></div>}
    {feed.isLoading ? <p role="status">{t('calendar.loading')}</p> : !feed.error && <>
      {!events.length && <p className="p-6 bg-white rounded-xl border text-slate-500">{t('calendar.empty')}</p>}
      <div className={manager ? 'grid grid-cols-1 md:grid-cols-7 gap-2' : 'space-y-3'}>{daysInRange(range.from,range.to).filter(date => manager || grouped.has(date)).map(date => <section key={date} className={`min-w-0 bg-white border rounded-xl p-2 ${date === localDate() ? 'ring-2 ring-blue-300' : ''} ${manager ? `md:min-h-[130px] ${grouped.has(date) ? '' : 'hidden md:block'}` : ''}`} aria-label={dateLabel(date)}>
        <h2 className="font-semibold text-sm mb-2">{dateLabel(date,true)}</h2><div className="space-y-2">{(grouped.get(date)||[]).map(o => <button key={`${o.scheduleId}:${o.date}`} onClick={() => open(o)} className={`w-full text-left p-2 rounded-lg border ${statusColors[o.status]} space-y-1 break-words`} aria-label={`${t('calendar.open')}: ${o.title}`}>
          <p className="text-xs font-semibold">{[o.startTime?.slice(0,5),o.endTime?.slice(0,5)].filter(Boolean).join('–')}</p><p className="font-bold text-sm">{o.title}</p><p className="text-xs">{o.clientName} · {o.projectName}</p>{o.address && <p className="text-xs text-slate-600">{o.address}</p>}{manager && <p className="text-xs">{o.workers.map(w => w.name).join(', ')}</p>}<p className="text-xs font-medium">{t(`calendar.${o.status}`)}{o.exceptionId ? ` · ${t('calendar.exception')}` : ''}</p>{!manager && <span className="block text-blue-700 font-semibold text-sm pt-1">{t('calendar.open')}</span>}
        </button>)}</div></section>)}</div>
    </>}
    {detail && <CalendarDialog titleId="calendar-detail-title" onClose={() => setDetail(null)}><div className="bg-white p-5 rounded-2xl w-full max-w-lg max-h-[90dvh] overflow-y-auto space-y-4">
      <div className="flex justify-between gap-3"><h2 className="text-xl font-bold" id="calendar-detail-title">{detail.title}</h2><button className={button} onClick={() => setDetail(null)}>{t('calendar.close')}</button></div><p>{dateLabel(detail.date)} · {[detail.startTime?.slice(0,5),detail.endTime?.slice(0,5)].filter(Boolean).join('–')}</p><p>{detail.clientName} · {detail.projectName}</p><p>{detail.address}</p><p className="whitespace-pre-wrap">{detail.notes}</p><p>{detail.workers.map(w => w.name).join(', ')}</p><p>{t(`calendar.${detail.status}`)}</p>
      {manager && <label className="block text-sm">{t('calendar.selectWorker')}<select className="block border rounded-lg p-2 w-full mt-1 min-h-[44px]" value={reportWorker} onChange={e => setReportWorker(e.target.value)}>{detail.workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>}
      {reportWorker && (detail.status !== 'cancelled' || detail.reports.some(r => r.workerId === reportWorker)) && <button className={`${button} !bg-blue-600 text-white w-full`} onClick={() => {
        const report = detail.reports.find(r => r.workerId === reportWorker);
        navigate(report ? `/reports?report=${encodeURIComponent(report.id)}` : `/reports?schedule=${encodeURIComponent(detail.scheduleId)}&date=${detail.date}&worker=${encodeURIComponent(reportWorker)}`);
      }}>{t(detail.reports.some(r => r.workerId === reportWorker) ? 'calendar.openReport' : 'calendar.createReport')}</button>}
      {manager && detail.reports.filter(r => !detail.workers.some(w => w.id === r.workerId)).map(r => <button key={`${r.id}:${r.workerId}`} className={`${button} w-full text-blue-700`} onClick={() => navigate(`/reports?report=${encodeURIComponent(r.id)}`)}>{t('calendar.openReport')} · {personnel.find(w => w.id === r.workerId)?.name || t('calendar.worker')}</button>)}
      <p className="text-xs text-slate-500">{t('calendar.actualHours')}</p>{manager && <div className="flex gap-2"><button disabled={opening} className={button} onClick={() => void edit(detail)}>{t('calendar.edit')}</button><button disabled={opening} className={button} onClick={() => void edit(detail,true)}>{t('calendar.duplicate')}</button></div>}
    </div></CalendarDialog>}
    {editor && <CalendarEditor initial={editor.rule} workerIds={editor.workers} occurrence={editor.occurrence} projects={projects} clients={clients} personnel={personnel} onClose={() => setEditor(null)} onSave={async (rule,workers,scope,remove) => {
      await calendarService.save(user.companyId!,editor.occurrence?.scheduleId || null,scope,editor.occurrence?.date || null,rule,workers,remove);
      setEditor(null);
      await Promise.all([queryClient.invalidateQueries({queryKey:['calendar']}),queryClient.invalidateQueries({queryKey:['projectPlanning']}),queryClient.invalidateQueries({queryKey:['reports']})]);
    }} />}
  </div>;
}
