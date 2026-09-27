-- Additive migration; existing assignments have no terms row and remain HOURLY.
BEGIN;
CREATE TABLE IF NOT EXISTS public.project_worker_compensations (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  method text NOT NULL DEFAULT 'HOURLY' CHECK (method IN ('HOURLY','PER_UNIT','FIXED_PROJECT')),
  unit_rate numeric CHECK (unit_rate >= 0 AND unit_rate <= 1000000000000),
  unit_name text CHECK (length(unit_name) <= 80),
  fixed_amount numeric CHECK (fixed_amount >= 0 AND fixed_amount <= 1000000000000),
  PRIMARY KEY(project_id,worker_id),
  CHECK (method <> 'PER_UNIT' OR unit_rate IS NOT NULL),
  CHECK (method <> 'FIXED_PROJECT' OR fixed_amount IS NOT NULL)
);
ALTER TABLE public.project_worker_compensations ENABLE ROW LEVEL SECURITY;
-- Explicit grants: required also on deployments after 2026-10-30.
REVOKE ALL ON public.project_worker_compensations FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_worker_compensations TO authenticated;
GRANT ALL ON public.project_worker_compensations TO service_role;

DROP POLICY IF EXISTS compensation_read ON public.project_worker_compensations;
CREATE POLICY compensation_read ON public.project_worker_compensations FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (
    public.is_super_admin() OR EXISTS (
      SELECT 1 FROM public.user_companies uc WHERE uc.company_id = p.company_id AND uc.auth_id = auth.uid()
      AND (uc.role::text IN ('admin','supervisor','superadmin') OR EXISTS (
        SELECT 1 FROM public.workers w WHERE w.id = worker_id AND w.auth_id = auth.uid()
      ))
    )
  ))
);
DROP POLICY IF EXISTS compensation_manage ON public.project_worker_compensations;
CREATE POLICY compensation_manage ON public.project_worker_compensations FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (
    public.is_super_admin() OR EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = p.company_id AND uc.auth_id = auth.uid() AND uc.role::text IN ('admin','superadmin'))
  ))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (
    public.is_super_admin() OR EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = p.company_id AND uc.auth_id = auth.uid() AND uc.role::text IN ('admin','superadmin'))
  ))
);

CREATE OR REPLACE FUNCTION public.validate_compensation_company() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.projects p JOIN public.workers w ON w.company_id = p.company_id WHERE p.id = NEW.project_id AND w.id = NEW.worker_id) THEN
    RAISE EXCEPTION 'Compensation worker must belong to the project company';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_compensation_company() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS validate_compensation_company ON public.project_worker_compensations;
CREATE TRIGGER validate_compensation_company BEFORE INSERT OR UPDATE ON public.project_worker_compensations
FOR EACH ROW EXECUTE FUNCTION public.validate_compensation_company();

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS completed_quantity numeric;
ALTER TABLE public.rapportini_workers ADD COLUMN IF NOT EXISTS completed_quantity numeric;
CREATE OR REPLACE FUNCTION public.validate_completed_quantity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE project_key uuid; worker_key uuid; compensation_method text;
BEGIN
  IF NEW.completed_quantity IS NULL THEN RETURN NEW; END IF;
  IF NEW.completed_quantity < 0 OR NEW.completed_quantity::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid completed quantity'; END IF;
  IF TG_TABLE_NAME = 'reports' THEN project_key := NEW.project_id; worker_key := NEW.created_by;
  ELSE SELECT project_id INTO project_key FROM public.reports WHERE id = NEW.rapportino_id; worker_key := NEW.worker_id; END IF;
  SELECT method INTO compensation_method FROM public.project_worker_compensations WHERE project_id = project_key AND worker_id = worker_key;
  IF COALESCE(compensation_method,'HOURLY') <> 'PER_UNIT' THEN NEW.completed_quantity := NULL; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_completed_quantity() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS validate_completed_quantity ON public.reports;
CREATE TRIGGER validate_completed_quantity BEFORE INSERT OR UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.validate_completed_quantity();
DROP TRIGGER IF EXISTS validate_completed_quantity ON public.rapportini_workers;
CREATE TRIGGER validate_completed_quantity BEFORE INSERT OR UPDATE ON public.rapportini_workers FOR EACH ROW EXECUTE FUNCTION public.validate_completed_quantity();

-- SECURITY INVOKER: project RLS and assignment RLS are both applied. All writes
-- commit together; a rejected term cannot leave a partially saved project.
CREATE OR REPLACE FUNCTION public.save_project_with_compensations(p_project_id uuid, p_project jsonb, p_terms jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE saved public.projects; payload public.projects; entry record;
BEGIN
  -- Do not rely on legacy project write policies: explicitly bind the caller
  -- to the requested company, while retaining normal service-role operations.
  IF current_user NOT IN ('postgres','service_role','supabase_admin') AND NOT (
    COALESCE(public.is_super_admin(),false) OR EXISTS (
      SELECT 1 FROM public.user_companies uc
      WHERE uc.auth_id=auth.uid() AND uc.company_id=(p_project->>'company_id')::uuid
      AND uc.role::text IN ('admin','supervisor','superadmin')
    )
  ) THEN RAISE EXCEPTION 'Project access denied' USING ERRCODE='42501'; END IF;
  SELECT * INTO payload FROM jsonb_populate_record(NULL::public.projects,p_project);
  IF p_project_id IS NULL THEN
    INSERT INTO public.projects(company_id,client_id,title,description,site_address,contact_person,phone,internal_note,status,economic_type,hourly_sale_price,total_amount,is_internal,assigned_worker_ids,created_at)
    VALUES(payload.company_id,payload.client_id,payload.title,payload.description,payload.site_address,payload.contact_person,payload.phone,payload.internal_note,payload.status,payload.economic_type,payload.hourly_sale_price,payload.total_amount,payload.is_internal,payload.assigned_worker_ids,COALESCE(payload.created_at,now()))
    RETURNING * INTO saved;
  ELSE
    SELECT * INTO saved FROM public.projects WHERE id=p_project_id AND company_id=payload.company_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Project not found or access denied' USING ERRCODE='42501'; END IF;
    SELECT * INTO payload FROM jsonb_populate_record(saved,p_project);
    UPDATE public.projects SET client_id=payload.client_id,title=payload.title,description=payload.description,
      site_address=payload.site_address,contact_person=payload.contact_person,phone=payload.phone,internal_note=payload.internal_note,
      status=payload.status,economic_type=payload.economic_type,hourly_sale_price=payload.hourly_sale_price,total_amount=payload.total_amount,
      is_internal=payload.is_internal,assigned_worker_ids=payload.assigned_worker_ids
    WHERE id=p_project_id AND company_id=payload.company_id RETURNING * INTO saved;
    IF NOT FOUND THEN RAISE EXCEPTION 'Project not found or access denied' USING ERRCODE='42501'; END IF;
  END IF;
  IF p_terms IS NOT NULL THEN
    IF jsonb_typeof(p_terms) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid compensation map'; END IF;
    FOR entry IN SELECT * FROM jsonb_each(p_terms) LOOP
      IF jsonb_typeof(entry.value) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid compensation terms'; END IF;
      IF entry.value ? 'unitRate' AND jsonb_typeof(entry.value->'unitRate') <> 'number' THEN RAISE EXCEPTION 'Invalid unit rate'; END IF;
      IF entry.value ? 'fixedAmount' AND jsonb_typeof(entry.value->'fixedAmount') <> 'number' THEN RAISE EXCEPTION 'Invalid fixed amount'; END IF;
      IF entry.value ? 'unitName' AND jsonb_typeof(entry.value->'unitName') <> 'string' THEN RAISE EXCEPTION 'Invalid unit name'; END IF;
      INSERT INTO public.project_worker_compensations(project_id,worker_id,method,unit_rate,unit_name,fixed_amount)
      VALUES(saved.id,entry.key::uuid,entry.value->>'method',(entry.value->>'unitRate')::numeric,entry.value->>'unitName',(entry.value->>'fixedAmount')::numeric)
      ON CONFLICT(project_id,worker_id) DO UPDATE SET method=EXCLUDED.method,unit_rate=EXCLUDED.unit_rate,unit_name=EXCLUDED.unit_name,fixed_amount=EXCLUDED.fixed_amount;
    END LOOP;
  END IF;
  RETURN to_jsonb(saved) || jsonb_build_object('worker_compensations',COALESCE((SELECT jsonb_agg(to_jsonb(c)) FROM public.project_worker_compensations c WHERE c.project_id=saved.id),'[]'::jsonb));
END;
$$;
REVOKE ALL ON FUNCTION public.save_project_with_compensations(uuid,jsonb,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_project_with_compensations(uuid,jsonb,jsonb) TO authenticated,service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
