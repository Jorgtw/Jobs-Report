-- Apply after deploying the application without the work calendar.
-- Preserve the calendar tables, their rows and the historical report links.
BEGIN;

DROP TRIGGER IF EXISTS calendar_validate_report ON public.reports;
DROP TRIGGER IF EXISTS calendar_validate ON public.work_schedule_workers;
DROP TRIGGER IF EXISTS calendar_validate ON public.work_schedule_exceptions;
DROP TRIGGER IF EXISTS calendar_validate ON public.work_schedules;
DROP TRIGGER IF EXISTS calendar_validate_relations ON public.work_schedules;

DROP FUNCTION IF EXISTS public.calendar_feed(uuid, date, date);
DROP FUNCTION IF EXISTS public.calendar_my_occurrences(uuid, date, date);
DROP FUNCTION IF EXISTS public.calendar_occurrences(uuid, date, date);
DROP FUNCTION IF EXISTS public.calendar_save(uuid, uuid, text, date, jsonb, uuid[], boolean);
DROP FUNCTION IF EXISTS public.calendar_validate_report();
DROP FUNCTION IF EXISTS public.calendar_validate_relations();
DROP FUNCTION IF EXISTS public.calendar_validate();

DROP INDEX IF EXISTS public.reports_calendar_worker;

-- Retire direct Data API access by old app clients. Keep the existing RLS
-- policies, their helpers, and service-role access for the archived records.
REVOKE ALL ON TABLE public.work_schedules, public.work_schedule_workers,
  public.work_schedule_exceptions FROM anon, authenticated;

COMMIT;
