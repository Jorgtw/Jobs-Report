import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { localDate } from '../services/workCalendar';
import { useTranslation, localeMap } from '../contexts/LanguageContext';

export function ProjectPlanning({ projectId, companyId }: { projectId: string; companyId: string }) {
  const { t, lang } = useTranslation();
  const query = useQuery({ queryKey: ['projectPlanning',companyId,projectId], queryFn: async () => {
    const rows: any[] = [];
    for (let offset=0; ; offset+=500) {
      const { data,error } = await supabase.from('work_schedules').select('id,schedule_type,start_date,end_date,start_time,end_time,weekdays,title,work_schedule_workers(exception_id,workers(name))')
        .eq('company_id',companyId).eq('project_id',projectId).or(`end_date.is.null,end_date.gte.${localDate()}`).neq('status','cancelled').order('start_date').order('id').range(offset,offset+499);
      if (error) throw error;
      rows.push(...data);
      if (data.length<500) break;
    }
    return rows;
  }, staleTime: 30_000 });
  return <section className="rounded-xl border p-3 bg-white space-y-2"><h3 className="font-bold">{t('calendar.planning')}</h3>
    {query.isLoading ? <p>{t('calendar.loading')}</p> : query.error ? <p className="text-sm text-slate-500">{t('calendar.loadError')}</p> : query.data?.length ? query.data.map(s => <div key={s.id} className="text-sm border-b pb-2 space-y-1"><p className="font-semibold">{t(`calendar.${s.schedule_type}`)} · {s.title}</p><p>{s.weekdays.map((d: number) => new Date(2026,8,20+d,12).toLocaleDateString(localeMap[lang],{weekday:'short'})).join(', ')} · {[s.start_time?.slice(0,5),s.end_time?.slice(0,5)].filter(Boolean).join('–')}</p><p>{s.start_date} – {s.end_date || t('calendar.noEnd')}</p><p>{s.work_schedule_workers.filter((w: any) => !w.exception_id).map((w: any) => w.workers?.name).filter(Boolean).join(', ')}</p></div>) : <p>{t('calendar.none')}</p>}
    <Link to={`/calendar?project=${encodeURIComponent(projectId)}`} className="inline-block text-blue-700 font-semibold py-2">{t('calendar.viewCalendar')}</Link>
  </section>;
}
