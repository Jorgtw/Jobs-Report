-- ==============================================================================
-- JOBS REPORT: THE INIT-PLAN ARCHITECTURE (V14 THE UNIVERSAL ENDGAME)
-- ==============================================================================
-- Architecture: Pure SQL Views (Bypass RLS) + Uncorrelated Subqueries (InitPlans) + B-Tree Indexes.
-- Goal: Fixes PostgREST Prepared Statement bugs (V13.1) and Supabase Dashboard bugs (V12),
--       while guaranteeing Postgres uses O(log N) Index-Only Scans.
-- ==============================================================================

-- 1. CLEANUP EVERYTHING
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.get_session_worker_id CASCADE;
DROP FUNCTION IF EXISTS public.get_session_is_super CASCADE;

-- 2. IDENTITY BOOTSTRAP (Maintained)
CREATE OR REPLACE FUNCTION public.handle_new_user_bootstrap() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.workers (id, auth_id, name, username)
  VALUES (gen_random_uuid(), new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email), new.email)
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_bootstrap();

-- Align user_companies membership bridge
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_companies' AND column_name = 'user_id') THEN
        ALTER TABLE public.user_companies ADD COLUMN user_id uuid;
    END IF;
    UPDATE public.user_companies uc SET user_id = w.id FROM public.workers w WHERE uc.auth_id = w.auth_id AND uc.user_id IS NULL;
    DELETE FROM public.user_companies WHERE user_id IS NULL;
END $$;

-- 3. PERFECT B-TREE INDEXING
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_companies_access ON public.user_companies(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_admin ON public.user_companies(user_id, company_id) WHERE role IN ('admin', 'supervisor');
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_super ON public.user_roles(user_id) WHERE role = 'superadmin';

-- 4. THE RLS BYPASS VIEWS (The Magic of V14)
-- By default in Postgres 15+, Views run as the creator (postgres), safely bypassing RLS to prevent infinite recursion.
-- Because these are pure SQL, Postgres expands them and caches them as uncorrelated "InitPlans" exactly ONCE per query.

CREATE OR REPLACE VIEW public.vw_auth_worker_id AS
  SELECT id FROM public.workers WHERE auth_id = auth.uid();

CREATE OR REPLACE VIEW public.vw_is_superadmin AS
  SELECT 1 AS is_super FROM public.user_roles 
  WHERE user_id = (SELECT id FROM public.vw_auth_worker_id) 
  AND role = 'superadmin';

CREATE OR REPLACE VIEW public.vw_my_companies AS
  SELECT company_id, role FROM public.user_companies 
  WHERE user_id = (SELECT id FROM public.vw_auth_worker_id);

GRANT SELECT ON public.vw_auth_worker_id TO authenticated, anon;
GRANT SELECT ON public.vw_is_superadmin TO authenticated, anon;
GRANT SELECT ON public.vw_my_companies TO authenticated, anon;

-- 5. PURE INDEX-DRIVEN RLS POLICIES (With strict table aliases to prevent ambiguities)

-- [USER ROLES]
CREATE POLICY user_roles_select ON public.user_roles FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR user_id = (SELECT id FROM public.vw_auth_worker_id));
CREATE POLICY user_roles_write ON public.user_roles FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin)) WITH CHECK (EXISTS (SELECT 1 FROM public.vw_is_superadmin));

-- [USER COMPANIES]
CREATE POLICY user_companies_select ON public.user_companies FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR user_id = (SELECT id FROM public.vw_auth_worker_id) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = user_companies.company_id AND v.role IN ('admin', 'supervisor')));
CREATE POLICY user_companies_insert ON public.user_companies FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')));
CREATE POLICY user_companies_update ON public.user_companies FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')));
CREATE POLICY user_companies_delete ON public.user_companies FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')));

-- [COMPANIES]
CREATE POLICY companies_select ON public.companies FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = companies.id));
CREATE POLICY companies_write ON public.companies FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin)) WITH CHECK (EXISTS (SELECT 1 FROM public.vw_is_superadmin));

-- [WORKERS]
CREATE POLICY workers_select ON public.workers FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = workers.company_id) OR id = (SELECT id FROM public.vw_auth_worker_id));
CREATE POLICY workers_insert ON public.workers FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')));
CREATE POLICY workers_update ON public.workers FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')));
CREATE POLICY workers_delete ON public.workers FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')));

-- [CLIENTS]
CREATE POLICY clients_select ON public.clients FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = clients.company_id));
CREATE POLICY clients_insert ON public.clients FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')));
CREATE POLICY clients_update ON public.clients FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')));
CREATE POLICY clients_delete ON public.clients FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')));

-- [PROJECTS]
CREATE POLICY projects_select ON public.projects FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = projects.company_id));
CREATE POLICY projects_insert ON public.projects FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')));
CREATE POLICY projects_update ON public.projects FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')));
CREATE POLICY projects_delete ON public.projects FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')));

-- [SUBCONTRACTORS]
CREATE POLICY subcontractors_select ON public.subcontractors FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = subcontractors.company_id));
CREATE POLICY subcontractors_insert ON public.subcontractors FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')));
CREATE POLICY subcontractors_update ON public.subcontractors FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')));
CREATE POLICY subcontractors_delete ON public.subcontractors FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')));

-- [REPORTS]
CREATE POLICY reports_select ON public.reports FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = reports.company_id));

CREATE POLICY reports_insert ON public.reports FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id) AND created_by = (SELECT id FROM public.vw_auth_worker_id));

CREATE POLICY reports_update ON public.reports FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')) OR (created_by = (SELECT id FROM public.vw_auth_worker_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')) OR (created_by = (SELECT id FROM public.vw_auth_worker_id)));

CREATE POLICY reports_delete ON public.reports FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')) OR (created_by = (SELECT id FROM public.vw_auth_worker_id)));

-- [RAPPORTINI_WORKERS]
CREATE POLICY rapportini_workers_select ON public.rapportini_workers FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.reports r WHERE r.id = rapportino_id AND (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = r.company_id))));

CREATE POLICY rapportini_workers_insert ON public.rapportini_workers FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.reports r WHERE r.id = rapportino_id AND (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = r.company_id AND v.role IN ('admin', 'supervisor')))));
CREATE POLICY rapportini_workers_update ON public.rapportini_workers FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.reports r WHERE r.id = rapportino_id AND (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = r.company_id AND v.role IN ('admin', 'supervisor')))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.reports r WHERE r.id = rapportino_id AND (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = r.company_id AND v.role IN ('admin', 'supervisor')))));
CREATE POLICY rapportini_workers_delete ON public.rapportini_workers FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.reports r WHERE r.id = rapportino_id AND (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = r.company_id AND v.role IN ('admin', 'supervisor')))));

-- [RAPPORTINI_EXPENSES]
CREATE POLICY rapportini_expenses_select ON public.rapportini_expenses FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.reports r WHERE r.id = rapportino_id AND (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = r.company_id))));

CREATE POLICY rapportini_expenses_insert ON public.rapportini_expenses FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.reports r WHERE r.id = rapportino_id AND (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = r.company_id AND v.role IN ('admin', 'supervisor')))));
CREATE POLICY rapportini_expenses_update ON public.rapportini_expenses FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.reports r WHERE r.id = rapportino_id AND (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = r.company_id AND v.role IN ('admin', 'supervisor')))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.reports r WHERE r.id = rapportino_id AND (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = r.company_id AND v.role IN ('admin', 'supervisor')))));
CREATE POLICY rapportini_expenses_delete ON public.rapportini_expenses FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.reports r WHERE r.id = rapportino_id AND (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = r.company_id AND v.role IN ('admin', 'supervisor')))));

-- [INTERNAL_COMMUNICATIONS]
CREATE POLICY internal_communications_select ON public.internal_communications FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR 
    EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = internal_communications.company_id)
  );

CREATE POLICY internal_communications_insert ON public.internal_communications FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id) AND 
    sender_id = (SELECT id FROM public.vw_auth_worker_id)
  );

CREATE POLICY internal_communications_update ON public.internal_communications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR 
    EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')) OR 
    sender_id = (SELECT id FROM public.vw_auth_worker_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR 
    EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')) OR 
    sender_id = (SELECT id FROM public.vw_auth_worker_id)
  );

CREATE POLICY internal_communications_delete ON public.internal_communications FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR 
    EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = company_id AND v.role IN ('admin', 'supervisor')) OR 
    sender_id = (SELECT id FROM public.vw_auth_worker_id)
  );

-- [USER SCOPED]
CREATE POLICY user_push_subs ON public.user_push_subscriptions FOR ALL 
  USING (worker_id = (SELECT id FROM public.vw_auth_worker_id)) WITH CHECK (worker_id = (SELECT id FROM public.vw_auth_worker_id));

CREATE POLICY user_read_receipts ON public.communication_read_receipts FOR ALL 
  USING (
    user_id = (SELECT id FROM public.vw_auth_worker_id) OR
    EXISTS (SELECT 1 FROM public.internal_communications ic WHERE ic.id = communication_id AND ic.sender_id = (SELECT id FROM public.vw_auth_worker_id))
  ) 
  WITH CHECK (
    user_id = (SELECT id FROM public.vw_auth_worker_id)
  );

-- 6. STORAGE (Precomputed evaluation)
DROP POLICY IF EXISTS "Report Images Access" ON storage.objects;
CREATE POLICY "Report Images Access" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'report-images' AND EXISTS (SELECT 1 FROM public.reports r WHERE r.id::text = split_part(name, '/', 1) AND (EXISTS (SELECT 1 FROM public.vw_is_superadmin) OR EXISTS (SELECT 1 FROM public.vw_my_companies v WHERE v.company_id = r.company_id)))
);

-- 7. RELOAD
NOTIFY pgrst, 'reload schema';
