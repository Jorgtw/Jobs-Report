-- Username identifies the company account. Email is contact information.
-- Transactional, rerunnable; aborts on incompatible existing usernames.
BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS workers_username_normalized_key
  ON public.workers (lower(btrim(username))) WHERE username IS NOT NULL AND btrim(username) <> '';
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS access_deleted_at timestamptz;

CREATE OR REPLACE FUNCTION public.handle_new_user_bootstrap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  -- Only the trusted Admin API can set app_metadata. Client user_metadata is not trusted.
  IF new.raw_app_meta_data->>'company_account' = 'true' THEN RETURN new; END IF;
  INSERT INTO public.workers (id, auth_id, name, username)
  VALUES (gen_random_uuid(),new.id,COALESCE(new.raw_user_meta_data->>'full_name',new.email),new.email)
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT a.email::text FROM public.workers w JOIN auth.users a ON a.id=w.auth_id
  WHERE lower(btrim(w.username))=lower(btrim(p_username)) AND w.status='active'
    AND w.access_deleted_at IS NULL AND (w.company_id IS NOT NULL OR w.role='superadmin')
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_email_by_username(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO anon,authenticated,service_role;

CREATE TABLE IF NOT EXISTS public.account_recovery_limits (
  key text PRIMARY KEY, window_start timestamptz NOT NULL, attempts integer NOT NULL
);
ALTER TABLE public.account_recovery_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_recovery_limits FROM anon,authenticated;
GRANT ALL ON public.account_recovery_limits TO service_role;
CREATE OR REPLACE FUNCTION public.allow_account_recovery(p_username_hash text,p_ip_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_name integer; v_ip integer;
BEGIN
  IF p_username_hash !~ '^[a-f0-9]{64}$' OR p_ip_hash !~ '^[a-f0-9]{64}$' THEN RETURN false; END IF;
  DELETE FROM public.account_recovery_limits WHERE window_start < now()-interval '1 day';
  INSERT INTO public.account_recovery_limits AS limits VALUES ('ip:'||p_ip_hash,now(),1)
  ON CONFLICT (key) DO UPDATE SET
    attempts=CASE WHEN limits.window_start<now()-interval '15 minutes' THEN 1 ELSE limits.attempts+1 END,
    window_start=CASE WHEN limits.window_start<now()-interval '15 minutes' THEN now() ELSE limits.window_start END
  RETURNING attempts INTO v_ip;
  IF v_ip>20 THEN RETURN false; END IF;
  INSERT INTO public.account_recovery_limits AS limits VALUES ('name:'||p_username_hash,now(),1)
  ON CONFLICT (key) DO UPDATE SET
    attempts=CASE WHEN limits.window_start<now()-interval '15 minutes' THEN 1 ELSE limits.attempts+1 END,
    window_start=CASE WHEN limits.window_start<now()-interval '15 minutes' THEN now() ELSE limits.window_start END
  RETURNING attempts INTO v_name;
  RETURN v_name<=3;
END;
$$;
REVOKE ALL ON FUNCTION public.allow_account_recovery(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.allow_account_recovery(text,text) TO service_role;

CREATE TABLE IF NOT EXISTS public.account_deletion_queue (
  auth_id uuid PRIMARY KEY, resource_id uuid NOT NULL, requested_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.account_deletion_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_deletion_queue FROM anon,authenticated;
GRANT ALL ON public.account_deletion_queue TO service_role;

CREATE OR REPLACE FUNCTION public.delete_company_account_resource(p_requester uuid,p_company_id uuid DEFAULT NULL,p_worker_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_requester public.workers%ROWTYPE; v_worker public.workers%ROWTYPE;
  v_super boolean; v_company uuid; v_ids uuid[]; v_auth uuid[];
BEGIN
  IF (p_company_id IS NULL)=(p_worker_id IS NULL) THEN RAISE EXCEPTION 'ACCESS_FORBIDDEN'; END IF;
  SELECT * INTO v_requester FROM public.workers WHERE auth_id=p_requester AND status='active' AND access_deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'ACCESS_FORBIDDEN'; END IF;
  v_super:=COALESCE(v_requester.role='superadmin',false) OR EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=v_requester.id AND role='superadmin');
  IF p_company_id IS NOT NULL THEN
    IF NOT v_super THEN RAISE EXCEPTION 'ACCESS_FORBIDDEN'; END IF;
    v_company:=p_company_id;
    PERFORM 1 FROM public.companies WHERE id=v_company FOR UPDATE;
    IF NOT FOUND THEN
      IF EXISTS(SELECT 1 FROM public.account_deletion_queue WHERE resource_id=p_company_id AND requested_by=p_requester) THEN RETURN; END IF;
      RAISE EXCEPTION 'ACCESS_NOT_FOUND';
    END IF;
    PERFORM 1 FROM public.workers WHERE company_id=v_company FOR UPDATE;
    SELECT array_agg(id),array_agg(auth_id) FILTER(WHERE auth_id IS NOT NULL) INTO v_ids,v_auth FROM public.workers WHERE company_id=v_company;
  ELSE
    SELECT * INTO v_worker FROM public.workers WHERE id=p_worker_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ACCESS_NOT_FOUND'; END IF;
    v_company:=v_worker.company_id;
    IF NOT v_super AND NOT COALESCE((v_requester.company_id=v_company AND v_requester.role='admin'),false) THEN RAISE EXCEPTION 'ACCESS_FORBIDDEN'; END IF;
    v_ids:=ARRAY[p_worker_id]; v_auth:=ARRAY[v_worker.auth_id];
  END IF;
  IF EXISTS(SELECT 1 FROM public.workers w WHERE w.id=ANY(v_ids) AND
    (w.auth_id=p_requester OR w.role='superadmin' OR EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=w.id AND r.role='superadmin'))) THEN
    RAISE EXCEPTION 'ACCESS_PROTECTED_ACCOUNT';
  END IF;
  -- Fail closed for legacy identities shared across tenants; never destroy another tenant's access.
  IF EXISTS(SELECT 1 FROM public.user_companies WHERE auth_id=ANY(v_auth) AND company_id<>v_company) THEN RAISE EXCEPTION 'ACCESS_SHARED_ACCOUNT'; END IF;
  INSERT INTO public.account_deletion_queue(auth_id,resource_id,requested_by)
    SELECT value,COALESCE(p_company_id,p_worker_id),p_requester FROM unnest(v_auth) value
    WHERE value IS NOT NULL ON CONFLICT(auth_id) DO NOTHING;
  DELETE FROM public.user_companies WHERE company_id=v_company AND (p_company_id IS NOT NULL OR auth_id=ANY(v_auth));
  IF p_company_id IS NOT NULL THEN
    DELETE FROM public.rapportini_workers WHERE rapportino_id IN (SELECT id FROM public.reports WHERE company_id=v_company);
    DELETE FROM public.reports WHERE company_id=v_company;
    DELETE FROM public.internal_communications WHERE company_id=v_company;
    DELETE FROM public.project_subcontractors WHERE project_id IN (SELECT id FROM public.projects WHERE company_id=v_company);
    DELETE FROM public.projects WHERE company_id=v_company;
    DELETE FROM public.workers WHERE company_id=v_company;
    DELETE FROM public.companies WHERE id=v_company;
  ELSE
    -- Keep historical work attribution; remove the login and contact details only.
    DELETE FROM public.user_push_subscriptions WHERE worker_id=p_worker_id;
    DELETE FROM public.user_roles WHERE user_id=p_worker_id;
    UPDATE public.workers SET auth_id=NULL,username=NULL,email=NULL,status='inactive',access_deleted_at=now() WHERE id=p_worker_id;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_company_account_resource(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.delete_company_account_resource(uuid,uuid,uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
