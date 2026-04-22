-- ==========================================
-- SSOT FINAL MIGRATION SCRIPT (COMPLETE VERSION)
-- Goal: Replace all legacy dependencies with user_companies (Single Source of Truth)
-- ==========================================

-- 1. Helper Functions
CREATE OR REPLACE FUNCTION public.get_worker_id_v2()
RETURNS UUID AS $$
  SELECT id FROM public.workers WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. REWRITE ENTITY POLICIES (Core Tables)

-- COMPANIES
DROP POLICY IF EXISTS "Users: view own company" ON public.companies;
DROP POLICY IF EXISTS "SSOT: Companies Access" ON public.companies;
CREATE POLICY "SSOT: Companies Access" ON public.companies
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.auth_id = auth.uid() 
    AND uc.company_id = public.companies.id
  )
);

-- WORKERS (Profiles)
DROP POLICY IF EXISTS "Users: view own company workers" ON public.workers;
DROP POLICY IF EXISTS "Users: update own profile" ON public.workers;
DROP POLICY IF EXISTS "SSOT: Workers Access" ON public.workers;
CREATE POLICY "SSOT: Workers Access" ON public.workers
FOR SELECT TO authenticated
USING (
  auth_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_companies my_uc
    JOIN public.user_companies their_uc ON my_uc.company_id = their_uc.company_id
    WHERE my_uc.auth_id = auth.uid()
    AND their_uc.auth_id = public.workers.auth_id
  )
);

CREATE POLICY "SSOT: Workers Update" ON public.workers
FOR UPDATE TO authenticated
USING (auth_id = auth.uid());

-- PROJECTS
DROP POLICY IF EXISTS "Users can view projects of their company" ON public.projects;
DROP POLICY IF EXISTS "Users: manage own company projects" ON public.projects;
DROP POLICY IF EXISTS "SSOT: Projects Access" ON public.projects;
CREATE POLICY "SSOT: Projects Access" ON public.projects
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.auth_id = auth.uid() 
    AND uc.company_id = public.projects.company_id
  )
);

-- CLIENTS
DROP POLICY IF EXISTS "Users can view clients of their company" ON public.clients;
DROP POLICY IF EXISTS "Users: manage own company clients" ON public.clients;
DROP POLICY IF EXISTS "SSOT: Clients Access" ON public.clients;
CREATE POLICY "SSOT: Clients Access" ON public.clients
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.auth_id = auth.uid() 
    AND uc.company_id = public.clients.company_id
  )
);

-- SUBCONTRACTORS
DROP POLICY IF EXISTS "Users: manage own company subcontractors" ON public.subcontractors;
DROP POLICY IF EXISTS "SSOT: Subcontractors Access" ON public.subcontractors;
CREATE POLICY "SSOT: Subcontractors Access" ON public.subcontractors
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.auth_id = auth.uid() 
    AND uc.company_id = public.subcontractors.company_id
  )
);

-- REPORTS (Rapportini)
DROP POLICY IF EXISTS "Users can view reports of their company" ON public.reports;
DROP POLICY IF EXISTS "Users: select own company reports" ON public.reports;
DROP POLICY IF EXISTS "Users: insert own company reports" ON public.reports;
DROP POLICY IF EXISTS "Users: update own company reports" ON public.reports;
DROP POLICY IF EXISTS "Users: delete own company reports" ON public.reports;
DROP POLICY IF EXISTS "SSOT: Reports Access" ON public.reports;
CREATE POLICY "SSOT: Reports Access" ON public.reports
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.auth_id = auth.uid() 
    AND uc.company_id = public.reports.company_id
  )
);

-- RAPPORTINI_WORKERS (Additional Workers)
DROP POLICY IF EXISTS "Users: manage rapportini workers" ON public.rapportini_workers;
DROP POLICY IF EXISTS "SSOT: Rapportini Workers Access" ON public.rapportini_workers;
CREATE POLICY "SSOT: Rapportini Workers Access" ON public.rapportini_workers
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    JOIN public.user_companies uc ON r.company_id = uc.company_id
    WHERE r.id = public.rapportini_workers.rapportino_id
    AND uc.auth_id = auth.uid()
  )
);

-- 3. REWRITE STORAGE POLICIES
DROP POLICY IF EXISTS "Allow authenticated select on company bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert on company bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete on company bucket" ON storage.objects;
DROP POLICY IF EXISTS "SSOT: Storage Access" ON storage.objects;

CREATE POLICY "SSOT: Storage Access" ON storage.objects
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.auth_id = auth.uid() 
    AND uc.company_id::text = (storage.foldername(name))[1]
  )
);

-- 4. REWRITE MESSAGES POLICIES (Communications)
DROP POLICY IF EXISTS "Users can view messages for their company" ON public.internal_communications;
DROP POLICY IF EXISTS "SSOT: Communications Access" ON public.internal_communications;
DROP POLICY IF EXISTS "Users: view relevant communications" ON public.internal_communications;
DROP POLICY IF EXISTS "Admin & Users: insert and manage own communications" ON public.internal_communications;

CREATE POLICY "SSOT: Communications Access" ON public.internal_communications
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.auth_id = auth.uid() 
    AND uc.company_id = internal_communications.company_id
  )
);

-- READ RECEIPTS
DROP POLICY IF EXISTS "Users: manage own read receipts" ON public.communication_read_receipts;
DROP POLICY IF EXISTS "SSOT: Read Receipts Access" ON public.communication_read_receipts;
CREATE POLICY "SSOT: Read Receipts Access" ON public.communication_read_receipts
FOR ALL TO authenticated
USING (
  user_id = (SELECT id FROM public.workers WHERE auth_id = auth.uid() LIMIT 1)
);

-- USER_COMPANIES (Self-service access to memberships)
DROP POLICY IF EXISTS "Users: view own memberships" ON public.user_companies;
DROP POLICY IF EXISTS "SSOT: Memberships Access" ON public.user_companies;
CREATE POLICY "SSOT: Memberships Access" ON public.user_companies
FOR SELECT TO authenticated
USING (auth_id = auth.uid());

-- USER_ROLES (Self-service access to roles)
DROP POLICY IF EXISTS "Users: view own role" ON public.user_roles;
DROP POLICY IF EXISTS "SSOT: Roles Access" ON public.user_roles;
CREATE POLICY "SSOT: Roles Access" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = (SELECT id FROM public.workers WHERE auth_id = auth.uid() LIMIT 1));

-- PUSH NOTIFICATIONS
DROP POLICY IF EXISTS "Users: manage own push subscriptions" ON public.user_push_subscriptions;
DROP POLICY IF EXISTS "SSOT: Push Subscriptions Access" ON public.user_push_subscriptions;
CREATE POLICY "SSOT: Push Subscriptions Access" ON public.user_push_subscriptions
FOR ALL TO authenticated
USING (worker_id = (SELECT id FROM public.workers WHERE auth_id = auth.uid() LIMIT 1));

DROP POLICY IF EXISTS "Users: view own notification logs" ON public.push_notifications_log;
DROP POLICY IF EXISTS "SSOT: Push Logs Access" ON public.push_notifications_log;
CREATE POLICY "SSOT: Push Logs Access" ON public.push_notifications_log
FOR SELECT TO authenticated
USING (worker_id = (SELECT id FROM public.workers WHERE auth_id = auth.uid() LIMIT 1));

-- 5. SUPERADMIN OVERRIDE (Master Policy)
-- This allows superadmins to bypass the company check if needed.
-- Note: Already covered by is_super_admin() checks in many old policies, 
-- but here we rely on the specific table policies. 
-- To add global superadmin, we can add OR is_super_admin() to each policy above.

-- 6. DEPRECATION (PHASE 2)
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
BEGIN
  -- WARNING: This function is deprecated. 
  -- Now returns the first company found in the SSOT bridge table as fallback.
  RETURN (SELECT company_id FROM public.user_companies WHERE auth_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
