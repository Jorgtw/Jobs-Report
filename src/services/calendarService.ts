import { supabase } from './supabase';
import type { CalendarOccurrence, ScheduleRule, ScheduleScope } from './workCalendar';

export const calendarService = {
  async list(companyId: string, from: string, to: string): Promise<CalendarOccurrence[]> {
    const { data, error } = await supabase.rpc('calendar_feed', { p_company: companyId, p_from: from, p_to: to });
    if (error) throw error;
    return data || [];
  },
  async rule(companyId: string, id: string): Promise<{ rule: ScheduleRule; workers: string[] }> {
    const { data, error } = await supabase.from('work_schedules').select('*, work_schedule_workers(worker_id,exception_id)').eq('company_id',companyId).eq('id',id).single();
    if (error) throw error;
    return { rule: data, workers: data.work_schedule_workers.filter((w: {exception_id: string | null}) => !w.exception_id).map((w: {worker_id: string}) => w.worker_id) };
  },
  async save(companyId: string, id: string | null, scope: ScheduleScope, date: string | null, rule: ScheduleRule, workers: string[], remove = false) {
    const { data, error } = await supabase.rpc('calendar_save', {
      p_company: companyId, p_id: id, p_scope: scope, p_date: date, p_data: rule, p_workers: workers, p_delete: remove
    });
    if (error) throw error;
    return data as string;
  }
};
