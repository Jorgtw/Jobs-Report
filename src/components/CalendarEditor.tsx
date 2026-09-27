import React, { useState } from 'react';
import type { Client, Project, User } from '../types';
import type { CalendarOccurrence, ScheduleRule, ScheduleScope } from '../services/workCalendar';
import { dateObject, localDate } from '../services/workCalendar';
import { localeMap, useTranslation } from '../contexts/LanguageContext';
import { CalendarDialog } from './CalendarDialog';

const input = 'w-full rounded-lg border border-slate-300 bg-white p-2 text-sm min-h-[42px]';
const button = 'rounded-lg border px-4 py-2 min-h-[44px]';
export interface CalendarEditorProps {
  initial: ScheduleRule;
  workerIds: string[];
  occurrence?: CalendarOccurrence;
  projects: Project[];
  clients: Client[];
  personnel: User[];
  onClose: () => void;
  onSave: (rule: ScheduleRule, workers: string[], scope: ScheduleScope, remove: boolean) => Promise<void>;
}
export function CalendarEditor({ initial, workerIds, occurrence, projects, clients, personnel, onClose, onSave }: CalendarEditorProps) {
  const { t, lang } = useTranslation();
  const recurringEdit = !!occurrence && initial.schedule_type === 'recurring';
  const occurrenceRule = { ...initial, title: occurrence?.title || initial.title, notes: occurrence?.notes ?? initial.notes,
    start_time: occurrence?.startTime ?? initial.start_time, end_time: occurrence?.endTime ?? initial.end_time,
    status: occurrence?.status || initial.status };
  const [scope, setScope] = useState<ScheduleScope>(recurringEdit ? 'this' : 'all');
  const [rule, setRule] = useState<ScheduleRule>(recurringEdit ? occurrenceRule : initial);
  const [workers, setWorkers] = useState(recurringEdit ? occurrence!.workers.map(w => w.id) : workerIds);
  const [client, setClient] = useState(projects.find(p => p.id === initial.project_id)?.clientId || '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const project = projects.find(p => p.id === rule.project_id);
  const allowedWorkers = personnel.filter(w => (!project?.assignedWorkerIds?.length || project.assignedWorkerIds.includes(w.id)) && (w.status === 'active' || workers.includes(w.id)));
  const field = (key: string, child: React.ReactNode) => <label className="flex flex-col gap-1 text-sm font-medium">{t(`calendar.${key}`)}{child}</label>;
  const changeScope = (next: ScheduleScope) => {
    setScope(next);
    setRule(next === 'this' ? occurrenceRule : { ...initial, ...(next === 'following' ? { start_date: occurrence!.date } : {}) });
    setWorkers(next === 'this' ? occurrence!.workers.map(w => w.id) : workerIds);
  };
  const save = async (remove = false) => {
    setError('');
    if (remove && !window.confirm(t('calendar.confirmDelete'))) return;
    if (!remove && (!rule.project_id || !rule.title.trim() || !workers.length || !rule.start_date ||
      (rule.end_date && rule.end_date < rule.start_date) ||
      (rule.start_time && rule.end_time && rule.end_time <= rule.start_time) ||
      (rule.schedule_type === 'recurring' && (!rule.weekdays.length || !rule.start_time || !rule.end_time)))) {
      setError(t('calendar.invalid')); return;
    }
    setPending(true);
    try { await onSave({ ...rule, title: rule.title.trim(), weekdays: rule.schedule_type === 'single' ? [] : rule.weekdays,
      end_date: rule.schedule_type === 'single' ? rule.start_date : rule.end_date }, workers, scope, remove); }
    catch { setError(t('calendar.saveError')); }
    finally { setPending(false); }
  };
  return <CalendarDialog titleId="calendar-editor-title" onClose={() => { if (!pending) onClose(); }}>
    <form onSubmit={e => { e.preventDefault(); void save(); }} className="bg-slate-50 rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[95dvh] overflow-y-auto space-y-4">
      <div className="flex items-center justify-between gap-3"><h2 id="calendar-editor-title" className="text-xl font-bold">{t(occurrence ? 'calendar.edit' : 'calendar.new')}</h2><button type="button" onClick={onClose} disabled={pending} className={button}>{t('calendar.close')}</button></div>
      {error && <p role="alert" className="text-red-700 bg-red-50 p-3 rounded-lg">{error}</p>}
      <fieldset disabled={pending} className="grid grid-cols-1 sm:grid-cols-2 gap-3 disabled:opacity-60">
        {recurringEdit && <div className="sm:col-span-2">{field('scope', <select value={scope} onChange={e => changeScope(e.target.value as ScheduleScope)} className={input}><option value="this">{t('calendar.this')}</option><option value="following">{t('calendar.following')}</option><option value="all">{t('calendar.series')}</option></select>)}<p className="text-xs text-slate-500 mt-1">{t('calendar.exceptionsKept')}</p></div>}
        {field('client', <select value={client} disabled={scope === 'this'} className={input} onChange={e => { setClient(e.target.value); setRule({ ...rule, project_id: '' }); setWorkers([]); }}><option value="">{t('calendar.choose')}</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>)}
        {field('project', <select required value={rule.project_id} disabled={scope === 'this'} className={input} onChange={e => { const p = projects.find(p => p.id === e.target.value)!; setRule({ ...rule, project_id: p.id }); setClient(p.clientId); setWorkers(workers.filter(id => !p.assignedWorkerIds?.length || p.assignedWorkerIds.includes(id))); }}><option value="">{t('calendar.choose')}</option>{projects.filter(p => (!client || p.clientId === client) && (p.status === 'active' || p.id === rule.project_id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>)}
        <div className="sm:col-span-2">{field('activity', <input required maxLength={200} className={input} value={rule.title} onChange={e => setRule({ ...rule, title: e.target.value })} />)}</div>
        {field('type', <select disabled={scope === 'this'} className={input} value={rule.schedule_type} onChange={e => setRule({ ...rule, schedule_type: e.target.value as ScheduleRule['schedule_type'], weekdays: e.target.value === 'recurring' ? [dateObject(rule.start_date).getDay()] : [] })}><option value="single">{t('calendar.single')}</option><option value="recurring">{t('calendar.recurring')}</option></select>)}
        {field('status', <select className={input} value={rule.status} onChange={e => setRule({ ...rule, status: e.target.value as ScheduleRule['status'] })}>{['planned','in_progress','completed','cancelled'].map(s => <option value={s} key={s}>{t(`calendar.${s}`)}</option>)}</select>)}
        {field('startDate', <input required type="date" className={input} disabled={scope !== 'all'} value={scope === 'this' ? occurrence!.date : rule.start_date} onChange={e => setRule({ ...rule, start_date: e.target.value })} />)}
        {rule.schedule_type === 'recurring' && scope !== 'this' && <div className="space-y-2">{field('endDate', <input type="date" min={rule.start_date} className={input} disabled={!rule.end_date} value={rule.end_date || ''} onChange={e => setRule({ ...rule, end_date: e.target.value || null })} />)}<label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={!rule.end_date} onChange={e => setRule({ ...rule, end_date: e.target.checked ? null : rule.start_date || localDate() })} />{t('calendar.noEnd')}</label></div>}
        {field('startTime', <input type="time" required={rule.schedule_type === 'recurring'} className={input} value={rule.start_time?.slice(0,5) || ''} onChange={e => setRule({ ...rule, start_time: e.target.value || null })} />)}
        {field('endTime', <input type="time" required={rule.schedule_type === 'recurring'} className={input} value={rule.end_time?.slice(0,5) || ''} onChange={e => setRule({ ...rule, end_time: e.target.value || null })} />)}
        {rule.schedule_type === 'single' && <p className="sm:col-span-2 text-xs text-slate-500">{t('calendar.optionalTime')}</p>}
        {rule.schedule_type === 'recurring' && scope !== 'this' && <fieldset className="sm:col-span-2"><legend className="text-sm font-medium mb-2">{t('calendar.weekdays')}</legend><div className="flex flex-wrap gap-2">{[1,2,3,4,5,6,0].map(day => <label key={day} className="border rounded-lg px-2 py-3 bg-white flex gap-2 items-center"><input type="checkbox" checked={rule.weekdays.includes(day)} onChange={e => setRule({ ...rule, weekdays: e.target.checked ? [...rule.weekdays,day] : rule.weekdays.filter(d => d !== day) })} />{new Date(2026,8,20+day,12).toLocaleDateString(localeMap[lang],{weekday:'short'})}</label>)}</div></fieldset>}
        <fieldset className="sm:col-span-2"><legend className="text-sm font-medium mb-2">{t('calendar.workers')}</legend><div className="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 border rounded-lg bg-white">{allowedWorkers.map(w => <label key={w.id} className="p-3 flex gap-2 items-center"><input type="checkbox" checked={workers.includes(w.id)} onChange={e => setWorkers(e.target.checked ? [...workers,w.id] : workers.filter(id => id !== w.id))} />{w.name}</label>)}</div></fieldset>
        <div className="sm:col-span-2">{field('notes', <textarea rows={3} className={input} value={rule.notes} onChange={e => setRule({ ...rule, notes: e.target.value })} />)}</div>
      </fieldset>
      <div className="flex justify-between gap-3">{occurrence && <button type="button" disabled={pending} className={`${button} text-red-700`} onClick={() => void save(true)}>{t('calendar.delete')}</button>}<button type="submit" disabled={pending} className={`${button} bg-blue-600 text-white ml-auto`}>{t(pending ? 'calendar.saving' : 'calendar.save')}</button></div>
    </form>
  </CalendarDialog>;
}
