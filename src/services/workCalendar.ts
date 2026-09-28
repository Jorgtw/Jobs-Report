import type { AdditionalWorker, Project, User } from '../types';

export type ScheduleStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type ScheduleScope = 'this' | 'following' | 'all';
export interface ScheduleRule {
  id?: string;
  project_id: string;
  title: string;
  notes: string;
  schedule_type: 'single' | 'recurring';
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  weekdays: number[];
  status: ScheduleStatus;
}
export interface CalendarOccurrence {
  scheduleId: string;
  date: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  address: string;
  title: string;
  notes: string;
  startTime: string | null;
  endTime: string | null;
  status: ScheduleStatus;
  scheduleType: 'single' | 'recurring';
  exceptionId: string | null;
  workers: { id: string; name: string }[];
  reports: { id: string; workerId: string }[];
}
export const canManageCalendar = (user: Pick<User, 'role'>) => ['admin', 'supervisor', 'superadmin'].includes(user.role);
// Noon + local date fields avoid UTC/DST shifting a work date.
export const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const dateObject = (day: string) => new Date(`${day}T12:00:00`);
export const addDays = (day: string, n: number) => { const d = dateObject(day); d.setDate(d.getDate()+n); return localDate(d); };
export function calendarRange(day: string, view: 'month' | 'week' | 'today' | 'upcoming') {
  const d = dateObject(day);
  if (view === 'today') return { from: day, to: day };
  if (view === 'upcoming') return { from: day, to: addDays(day, 13) };
  if (view === 'week') {
    const from = addDays(day, -((d.getDay()+6)%7));
    return { from, to: addDays(from, 6) };
  }
  const first = localDate(new Date(d.getFullYear(), d.getMonth(), 1, 12));
  const last = localDate(new Date(d.getFullYear(), d.getMonth()+1, 0, 12));
  return { from: addDays(first, -((dateObject(first).getDay()+6)%7)), to: addDays(last, 6-((dateObject(last).getDay()+6)%7)) };
}
export const daysInRange = (from: string, to: string) => {
  const days: string[] = [];
  for (let day=from; day<=to && days.length<62; day=addDays(day,1)) days.push(day);
  return days;
};
export function calendarReportDraft(o: CalendarOccurrence, workerId: string) {
  if (!o.workers.some(w => w.id === workerId) || o.status === 'cancelled') throw new Error('Invalid assignment');
  return { projectId: o.projectId, userId: workerId, date: o.date, description: o.title,
    scheduleId: o.scheduleId, scheduleDate: o.date, startTime: o.startTime?.slice(0,5) || '', endTime: o.endTime?.slice(0,5) || '', breakHours: 0,
    manualTotalHours: undefined, overtimeHours: 0, festiveHours: 0, nightHours: 0,
    completedQuantity: undefined, expenses: [], additionalWorkers: o.workers.filter(w => w.id !== workerId && !o.reports.some(r => r.workerId === w.id)).map(w => ({ userId: w.id, personName: w.name, startTime: o.startTime?.slice(0,5) || '', endTime: o.endTime?.slice(0,5) || '', breakHours: 0, totalHours: 0, overtimeHours: 0, festiveHours: 0, nightHours: 0 } as AdditionalWorker)), activityType: 'work' as const };
}

export const calendarProjectTitle = (project?: Pick<Project, 'name' | 'description'>) =>
  (project?.description?.trim() || project?.name?.trim() || '').slice(0,200);
export const calendarDefaultWorker = (occurrence: Pick<CalendarOccurrence, 'workers'>, userId: string) =>
  occurrence.workers.some(worker => worker.id === userId) ? userId : '';
// Identity-based colour remains stable when filters, dates or status change.
export function calendarProjectColor(projectId: string) {
  let hash = 0;
  for (const character of projectId) hash = (Math.imul(hash,31) + character.charCodeAt(0)) >>> 0;
  const hue = hash % 360;
  return { backgroundColor: `hsl(${hue} 78% 95%)`, borderColor: `hsl(${hue} 65% 82%)`,
    borderLeftColor: `hsl(${hue} 70% 43%)`, color: `hsl(${hue} 65% 23%)` };
}
