-- Optional operational planning. Apply before releasing the calendar frontend.
BEGIN;

CREATE TABLE IF NOT EXISTS public.work_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  notes text NOT NULL DEFAULT '',
  schedule_type text NOT NULL CHECK (schedule_type IN ('single','recurring')),
  start_date date NOT NULL,
  end_date date,
  start_time time,
  end_time time,
  weekdays integer[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','completed','cancelled')),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date),
  CHECK (start_time IS NULL OR end_time IS NULL OR end_time > start_time),
  CHECK ((schedule_type='single' AND end_date IS NOT NULL AND end_date=start_date AND cardinality(weekdays)=0)
    OR (schedule_type='recurring' AND cardinality(weekdays) BETWEEN 1 AND 7
      AND weekdays <@ ARRAY[0,1,2,3,4,5,6] AND start_time IS NOT NULL AND end_time IS NOT NULL))
);
-- Client/address remain on the existing project: no second source of truth.
CREATE INDEX IF NOT EXISTS work_schedules_period ON public.work_schedules(company_id,start_date,end_date);
CREATE INDEX IF NOT EXISTS work_schedules_project ON public.work_schedules(project_id);
CREATE TABLE IF NOT EXISTS public.work_schedule_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES public.work_schedules(id) ON DELETE CASCADE,
  occurrence_date date NOT NULL,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  notes text NOT NULL DEFAULT '',
  start_time time,
  end_time time,
  status text NOT NULL CHECK (status IN ('planned','in_progress','completed','cancelled')),
  UNIQUE(schedule_id,occurrence_date), UNIQUE(id,schedule_id),
  CHECK (start_time IS NULL OR end_time IS NULL OR end_time > start_time)
);
CREATE TABLE IF NOT EXISTS public.work_schedule_workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES public.work_schedules(id) ON DELETE CASCADE,
  exception_id uuid,
  worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  FOREIGN KEY (exception_id,schedule_id) REFERENCES public.work_schedule_exceptions(id,schedule_id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);
CREATE UNIQUE INDEX IF NOT EXISTS work_schedule_workers_base ON public.work_schedule_workers(schedule_id,worker_id) WHERE exception_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS work_schedule_workers_override ON public.work_schedule_workers(exception_id,worker_id) WHERE exception_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS work_schedule_workers_worker ON public.work_schedule_workers(worker_id,schedule_id);

CREATE OR REPLACE FUNCTION public.calendar_manager(p_company uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_companies uc JOIN public.companies c ON c.id=uc.company_id
   WHERE uc.auth_id=auth.uid() AND uc.company_id=p_company AND c.status::text='active'
   AND lower(uc.role::text) IN ('admin','supervisor','superadmin'))
$$;

-- The caller supplies only worker IDs visible through the existing workers RLS.
-- Return a boolean, never a roster; this also prevents partially hidden teams.
CREATE OR REPLACE FUNCTION public.calendar_roster_visible(p_schedule uuid,p_company uuid,p_visible uuid[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT public.calendar_manager(p_company)
 AND NOT EXISTS(SELECT 1 FROM public.work_schedule_workers sw JOIN public.work_schedules s ON s.id=sw.schedule_id WHERE sw.schedule_id=p_schedule AND s.company_id=p_company
   AND NOT sw.worker_id=ANY(p_visible))
$$;

ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_schedule_workers ENABLE ROW LEVEL SECURITY;
-- Workers cannot read raw series/overrides, including a colleague's replacement.
-- Their only read surface is calendar_my_occurrences, filtered AFTER exceptions.
DROP POLICY IF EXISTS calendar_manage ON public.work_schedules;
CREATE POLICY calendar_manage ON public.work_schedules FOR ALL TO authenticated
 USING (public.calendar_manager(company_id) AND EXISTS(SELECT 1 FROM public.projects p WHERE p.id=project_id AND p.company_id=work_schedules.company_id)
   AND public.calendar_roster_visible(id,company_id,ARRAY(SELECT w.id FROM public.workers w WHERE w.company_id=work_schedules.company_id)))
 WITH CHECK (public.calendar_manager(company_id) AND EXISTS(SELECT 1 FROM public.projects p WHERE p.id=project_id AND p.company_id=work_schedules.company_id));
DROP POLICY IF EXISTS calendar_manage ON public.work_schedule_exceptions;
CREATE POLICY calendar_manage ON public.work_schedule_exceptions FOR ALL TO authenticated
 USING (EXISTS(SELECT 1 FROM public.work_schedules s WHERE s.id=schedule_id))
 WITH CHECK (EXISTS(SELECT 1 FROM public.work_schedules s WHERE s.id=schedule_id));
DROP POLICY IF EXISTS calendar_manage ON public.work_schedule_workers;
CREATE POLICY calendar_manage ON public.work_schedule_workers FOR ALL TO authenticated
 USING (EXISTS(SELECT 1 FROM public.work_schedules s WHERE s.id=schedule_id) AND EXISTS(SELECT 1 FROM public.workers w WHERE w.id=worker_id))
 WITH CHECK (EXISTS(SELECT 1 FROM public.work_schedules s JOIN public.workers w ON w.company_id=s.company_id
   JOIN public.projects p ON p.id=s.project_id WHERE s.id=schedule_id AND w.id=worker_id
   AND (coalesce(cardinality(p.assigned_worker_ids),0)=0 OR w.id=ANY(p.assigned_worker_ids))));

CREATE OR REPLACE FUNCTION public.calendar_validate() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE s public.work_schedules; p public.projects;
BEGIN
 IF TG_TABLE_NAME='work_schedules' THEN
   SELECT * INTO p FROM public.projects WHERE id=NEW.project_id;
   IF p.id IS NULL OR p.company_id<>NEW.company_id THEN RAISE EXCEPTION 'Invalid calendar project'; END IF;
   IF TG_OP='UPDATE' THEN
     IF NEW.company_id<>OLD.company_id THEN RAISE EXCEPTION 'Calendar company is immutable'; END IF;
     NEW.updated_at=now();
   END IF;
 ELSIF TG_TABLE_NAME='work_schedule_workers' THEN
   SELECT * INTO s FROM public.work_schedules WHERE id=NEW.schedule_id;
   SELECT * INTO p FROM public.projects WHERE id=s.project_id;
   IF NOT EXISTS(SELECT 1 FROM public.workers w WHERE w.id=NEW.worker_id AND w.company_id=s.company_id)
     OR (coalesce(cardinality(p.assigned_worker_ids),0)>0 AND NOT NEW.worker_id=ANY(p.assigned_worker_ids))
     THEN RAISE EXCEPTION 'Worker not allowed on this project'; END IF;
 ELSE
   SELECT * INTO s FROM public.work_schedules WHERE id=NEW.schedule_id;
   IF s.id IS NULL OR s.schedule_type<>'recurring' OR NEW.occurrence_date<s.start_date
     OR (s.end_date IS NOT NULL AND NEW.occurrence_date>s.end_date)
     OR NOT extract(dow FROM NEW.occurrence_date)::int=ANY(s.weekdays)
     THEN RAISE EXCEPTION 'Invalid calendar occurrence'; END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS calendar_validate ON public.work_schedules;
CREATE TRIGGER calendar_validate BEFORE INSERT OR UPDATE ON public.work_schedules FOR EACH ROW EXECUTE FUNCTION public.calendar_validate();
DROP TRIGGER IF EXISTS calendar_validate ON public.work_schedule_exceptions;
CREATE TRIGGER calendar_validate BEFORE INSERT OR UPDATE ON public.work_schedule_exceptions FOR EACH ROW EXECUTE FUNCTION public.calendar_validate();
DROP TRIGGER IF EXISTS calendar_validate ON public.work_schedule_workers;
CREATE TRIGGER calendar_validate BEFORE INSERT OR UPDATE ON public.work_schedule_workers FOR EACH ROW EXECUTE FUNCTION public.calendar_validate();

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS schedule_id uuid REFERENCES public.work_schedules(id) ON DELETE SET NULL;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS schedule_date date;
CREATE UNIQUE INDEX IF NOT EXISTS reports_calendar_worker ON public.reports(schedule_id,schedule_date,created_by) WHERE schedule_id IS NOT NULL;

-- SECURITY INVOKER preserves existing project, worker and report RLS for managers.
CREATE OR REPLACE FUNCTION public.calendar_occurrences(p_company uuid,p_from date,p_to date)
RETURNS SETOF jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public AS $$
BEGIN
 IF p_from IS NULL OR p_to IS NULL OR p_to<p_from OR p_to-p_from>61 THEN RAISE EXCEPTION 'Calendar range must be 1–62 days'; END IF;
 RETURN QUERY
 SELECT jsonb_build_object('scheduleId',s.id,'date',d.day::date,'projectId',s.project_id,
   'projectName',p.title,'clientId',p.client_id,'clientName',c.name,'address',p.site_address,
   'title',coalesce(e.title,s.title),'notes',coalesce(e.notes,s.notes),
   'startTime',CASE WHEN e.id IS NULL THEN s.start_time ELSE e.start_time END,
   'endTime',CASE WHEN e.id IS NULL THEN s.end_time ELSE e.end_time END,
   'status',coalesce(e.status,s.status),'scheduleType',s.schedule_type,'exceptionId',e.id,
   'workers',coalesce((SELECT jsonb_agg(jsonb_build_object('id',w.id,'name',w.name) ORDER BY w.name)
     FROM public.work_schedule_workers sw JOIN public.workers w ON w.id=sw.worker_id
     WHERE sw.schedule_id=s.id AND sw.exception_id IS NOT DISTINCT FROM e.id),'[]'::jsonb),
   'reports',coalesce((SELECT jsonb_agg(jsonb_build_object('id',linked.id,'workerId',linked.worker_id)) FROM (
     SELECT r.id,r.created_by AS worker_id FROM public.reports r WHERE r.schedule_id=s.id AND r.schedule_date=d.day::date
     UNION
     SELECT r.id,rw.worker_id FROM public.reports r JOIN public.rapportini_workers rw ON rw.rapportino_id=r.id
       WHERE r.schedule_id=s.id AND r.schedule_date=d.day::date
   ) linked),'[]'::jsonb))
 FROM public.work_schedules s JOIN public.projects p ON p.id=s.project_id
 LEFT JOIN public.clients c ON c.id=p.client_id
 CROSS JOIN LATERAL generate_series(greatest(s.start_date,p_from)::timestamp,
   least(coalesce(s.end_date,p_to),p_to)::timestamp,interval '1 day') d(day)
 LEFT JOIN public.work_schedule_exceptions e ON e.schedule_id=s.id AND e.occurrence_date=d.day::date
 WHERE s.company_id=p_company AND s.start_date<=p_to AND (s.end_date IS NULL OR s.end_date>=p_from)
 AND ((s.schedule_type='single' AND d.day::date=s.start_date) OR (s.schedule_type='recurring' AND extract(dow FROM d.day)::int=ANY(s.weekdays)))
 ORDER BY d.day,s.start_time,s.id;
END $$;

CREATE OR REPLACE FUNCTION public.calendar_my_occurrences(p_company uuid,p_from date,p_to date)
RETURNS SETOF jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE me uuid;
BEGIN
 SELECT w.id INTO me FROM public.workers w JOIN public.user_companies uc ON uc.auth_id=w.auth_id AND uc.company_id=w.company_id
 JOIN public.companies c ON c.id=w.company_id
 WHERE w.auth_id=auth.uid() AND w.company_id=p_company AND w.status::text='active' AND c.status::text='active';
 IF me IS NULL THEN RETURN; END IF;
 RETURN QUERY SELECT o || jsonb_build_object(
   'workers',(SELECT jsonb_agg(w) FROM jsonb_array_elements(o->'workers') w WHERE w->>'id'=me::text),
   'reports',coalesce((SELECT jsonb_agg(r) FROM jsonb_array_elements(o->'reports') r WHERE r->>'workerId'=me::text),'[]'::jsonb))
 FROM public.calendar_occurrences(p_company,p_from,p_to) o
 WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(o->'workers') w WHERE w->>'id'=me::text);
END $$;

-- Validate only the optional link. Legacy/manual reports take the unchanged path.
CREATE OR REPLACE FUNCTION public.calendar_validate_report() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.work_schedules; e public.work_schedule_exceptions;
BEGIN
 IF NEW.schedule_id IS NULL THEN NEW.schedule_date=NULL; RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND NEW.schedule_id IS NOT DISTINCT FROM OLD.schedule_id
   AND NEW.schedule_date IS NOT DISTINCT FROM OLD.schedule_date AND NEW.project_id IS NOT DISTINCT FROM OLD.project_id
   AND NEW.date IS NOT DISTINCT FROM OLD.date AND NEW.created_by IS NOT DISTINCT FROM OLD.created_by
   AND NEW.company_id IS NOT DISTINCT FROM OLD.company_id THEN RETURN NEW; END IF;
 SELECT * INTO s FROM public.work_schedules WHERE id=NEW.schedule_id;
 -- A split may move a historical link without rewriting the report or its roster.
 IF TG_OP='UPDATE' AND OLD.schedule_id IS NOT NULL AND public.calendar_manager(NEW.company_id)
   AND s.company_id=NEW.company_id AND s.project_id=NEW.project_id
   AND NEW.schedule_date IS NOT DISTINCT FROM OLD.schedule_date AND NEW.project_id IS NOT DISTINCT FROM OLD.project_id
   AND NEW.date IS NOT DISTINCT FROM OLD.date AND NEW.created_by IS NOT DISTINCT FROM OLD.created_by
   AND NEW.company_id IS NOT DISTINCT FROM OLD.company_id THEN RETURN NEW; END IF;
 SELECT * INTO e FROM public.work_schedule_exceptions WHERE schedule_id=s.id AND occurrence_date=NEW.schedule_date;
 IF s.id IS NULL OR s.company_id<>NEW.company_id OR s.project_id<>NEW.project_id OR NEW.schedule_date IS NULL
   OR NEW.date::date<>NEW.schedule_date OR NEW.schedule_date<s.start_date
   OR (s.end_date IS NOT NULL AND NEW.schedule_date>s.end_date)
   OR (s.schedule_type='recurring' AND NOT extract(dow FROM NEW.schedule_date)::int=ANY(s.weekdays))
   OR coalesce(e.status,s.status)='cancelled'
   OR NOT EXISTS(SELECT 1 FROM public.work_schedule_workers sw WHERE sw.schedule_id=s.id
      AND sw.exception_id IS NOT DISTINCT FROM e.id AND sw.worker_id=NEW.created_by)
   OR NOT EXISTS(SELECT 1 FROM public.user_companies uc WHERE uc.auth_id=auth.uid() AND uc.company_id=s.company_id
      AND (lower(uc.role::text) IN ('admin','supervisor','superadmin') OR EXISTS(SELECT 1 FROM public.workers w WHERE w.id=NEW.created_by AND w.auth_id=auth.uid())))
 THEN RAISE EXCEPTION 'Invalid or unauthorized report assignment'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS calendar_validate_report ON public.reports;
CREATE TRIGGER calendar_validate_report BEFORE INSERT OR UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.calendar_validate_report();

-- All writes (rule, exceptions and roster) commit or roll back together under RLS.
CREATE OR REPLACE FUNCTION public.calendar_save(p_company uuid,p_id uuid,p_scope text,p_date date,p_data jsonb,p_workers uuid[],p_delete boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE old public.work_schedules; item public.work_schedules; target uuid; ex uuid; effective_date date;
BEGIN
 IF NOT public.calendar_manager(p_company) THEN RAISE EXCEPTION 'Calendar management denied'; END IF;
 IF p_scope NOT IN ('all','this','following') THEN RAISE EXCEPTION 'Invalid edit scope'; END IF;
 IF p_id IS NOT NULL THEN
   SELECT * INTO old FROM public.work_schedules WHERE id=p_id AND company_id=p_company FOR UPDATE;
   IF old.id IS NULL THEN RAISE EXCEPTION 'Assignment unavailable'; END IF;
   IF old.schedule_type='single' THEN p_scope='all'; END IF;
 END IF;
 IF p_scope<>'all' AND (old.id IS NULL OR p_date IS NULL OR p_date<old.start_date
   OR (old.end_date IS NOT NULL AND p_date>old.end_date) OR NOT extract(dow FROM p_date)::int=ANY(old.weekdays))
 THEN RAISE EXCEPTION 'Invalid occurrence'; END IF;
 IF p_delete AND p_scope='all' THEN DELETE FROM public.work_schedules WHERE id=p_id; RETURN p_id; END IF;
 IF p_delete AND p_scope='following' THEN
   IF p_date=old.start_date THEN DELETE FROM public.work_schedules WHERE id=p_id;
   ELSE
     UPDATE public.reports SET schedule_id=NULL,schedule_date=NULL WHERE schedule_id=p_id AND schedule_date>=p_date;
     DELETE FROM public.work_schedule_exceptions WHERE schedule_id=p_id AND occurrence_date>=p_date;
     UPDATE public.work_schedules SET end_date=p_date-1 WHERE id=p_id;
   END IF;
   RETURN p_id;
 END IF;
 IF NOT p_delete AND coalesce(cardinality(p_workers),0)=0 THEN RAISE EXCEPTION 'Select at least one worker'; END IF;
 IF p_scope='this' THEN
   INSERT INTO public.work_schedule_exceptions(schedule_id,occurrence_date,title,notes,start_time,end_time,status)
   VALUES(p_id,p_date,CASE WHEN p_delete THEN old.title ELSE p_data->>'title' END,
     coalesce(p_data->>'notes',''),nullif(p_data->>'start_time','')::time,nullif(p_data->>'end_time','')::time,
     CASE WHEN p_delete THEN 'cancelled' ELSE p_data->>'status' END)
   ON CONFLICT(schedule_id,occurrence_date) DO UPDATE SET title=excluded.title,notes=excluded.notes,
     start_time=excluded.start_time,end_time=excluded.end_time,status=excluded.status RETURNING id INTO ex;
   DELETE FROM public.work_schedule_workers WHERE exception_id=ex;
   INSERT INTO public.work_schedule_workers(schedule_id,exception_id,worker_id)
     SELECT p_id,ex,w FROM unnest(CASE WHEN p_delete THEN ARRAY[]::uuid[] ELSE p_workers END) w;
   RETURN p_id;
 END IF;
 item=jsonb_populate_record(NULL::public.work_schedules,p_data);
 effective_date=CASE WHEN p_scope='following' THEN p_date ELSE item.start_date END;
 IF p_scope='following' AND p_date=old.start_date THEN p_scope='all'; END IF;
 IF p_id IS NULL OR p_scope='following' THEN
   INSERT INTO public.work_schedules(company_id,project_id,title,notes,schedule_type,start_date,end_date,start_time,end_time,weekdays,status)
   VALUES(p_company,item.project_id,item.title,coalesce(item.notes,''),item.schedule_type,effective_date,
     CASE WHEN item.schedule_type='single' THEN effective_date ELSE item.end_date END,item.start_time,item.end_time,coalesce(item.weekdays,'{}'),item.status)
   RETURNING id INTO target;
 ELSE
   target=p_id;
   UPDATE public.work_schedules SET project_id=item.project_id,title=item.title,notes=coalesce(item.notes,''),schedule_type=item.schedule_type,
     start_date=effective_date,end_date=CASE WHEN item.schedule_type='single' THEN effective_date ELSE item.end_date END,
     start_time=item.start_time,end_time=item.end_time,weekdays=coalesce(item.weekdays,'{}'),status=item.status WHERE id=target;
   DELETE FROM public.work_schedule_workers WHERE schedule_id=target AND exception_id IS NULL;
 END IF;
 INSERT INTO public.work_schedule_workers(schedule_id,worker_id) SELECT target,w FROM unnest(p_workers) w;
 IF p_scope='following' THEN
   -- Preserve report identity and explicit exceptions while splitting atomically.
   UPDATE public.work_schedule_exceptions SET schedule_id=target WHERE schedule_id=p_id AND occurrence_date>=p_date
     AND item.schedule_type='recurring' AND (item.end_date IS NULL OR occurrence_date<=item.end_date)
     AND extract(dow FROM occurrence_date)::int=ANY(item.weekdays);
   UPDATE public.work_schedule_workers sw SET schedule_id=target FROM public.work_schedule_exceptions e
     WHERE sw.exception_id=e.id AND e.schedule_id=target AND sw.schedule_id=p_id;
   UPDATE public.reports SET schedule_id=target WHERE schedule_id=p_id AND schedule_date>=p_date;
   DELETE FROM public.work_schedule_exceptions WHERE schedule_id=p_id AND occurrence_date>=p_date;
   UPDATE public.work_schedules SET end_date=p_date-1 WHERE id=p_id;
 END IF;
 RETURN target;
END $$;

CREATE OR REPLACE FUNCTION public.calendar_validate_relations() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE s public.work_schedules; p public.projects;
BEGIN
 SELECT * INTO s FROM public.work_schedules WHERE id=NEW.id;
 IF s.id IS NULL THEN RETURN NULL; END IF;
 SELECT * INTO p FROM public.projects WHERE id=s.project_id;
 IF EXISTS(SELECT 1 FROM public.work_schedule_workers sw JOIN public.workers w ON w.id=sw.worker_id
   WHERE sw.schedule_id=s.id AND (w.company_id<>s.company_id OR
   (coalesce(cardinality(p.assigned_worker_ids),0)>0 AND NOT w.id=ANY(p.assigned_worker_ids))))
   OR EXISTS(SELECT 1 FROM public.reports r WHERE r.schedule_id=s.id AND r.project_id<>s.project_id)
 THEN RAISE EXCEPTION 'Project conflicts with assigned workers or linked reports'; END IF;
 RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS calendar_validate_relations ON public.work_schedules;
CREATE CONSTRAINT TRIGGER calendar_validate_relations AFTER INSERT OR UPDATE ON public.work_schedules
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.calendar_validate_relations();

CREATE OR REPLACE FUNCTION public.calendar_feed(p_company uuid,p_from date,p_to date) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public AS $$
DECLARE result jsonb;
BEGIN
 IF public.calendar_manager(p_company) THEN
   SELECT coalesce(jsonb_agg(o),'[]'::jsonb) INTO result FROM public.calendar_occurrences(p_company,p_from,p_to) o;
 ELSE
   SELECT coalesce(jsonb_agg(o),'[]'::jsonb) INTO result FROM public.calendar_my_occurrences(p_company,p_from,p_to) o;
 END IF;
 RETURN result;
END $$;

REVOKE ALL ON public.work_schedules,public.work_schedule_workers,public.work_schedule_exceptions FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.work_schedules,public.work_schedule_workers,public.work_schedule_exceptions TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.calendar_manager(uuid),public.calendar_validate(),public.calendar_validate_report(),public.calendar_occurrences(uuid,date,date),public.calendar_my_occurrences(uuid,date,date),public.calendar_save(uuid,uuid,text,date,jsonb,uuid[],boolean) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.calendar_validate_relations() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.calendar_manager(uuid),public.calendar_occurrences(uuid,date,date),public.calendar_my_occurrences(uuid,date,date),public.calendar_save(uuid,uuid,text,date,jsonb,uuid[],boolean) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.calendar_feed(uuid,date,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.calendar_feed(uuid,date,date) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.calendar_roster_visible(uuid,uuid,uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.calendar_roster_visible(uuid,uuid,uuid[]) TO authenticated,service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
