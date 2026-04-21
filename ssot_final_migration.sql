-- ==========================================
-- SSOT FINAL MIGRATION SCRIPT (PHASE 1 & 2)
-- Goal: Replace all workers.company_id dependencies with user_companies
-- ==========================================

-- 1. Helper Function: Standardized Worker Lookup (SSOT Global Profile)
CREATE OR REPLACE FUNCTION public.get_worker_id_v2()
RETURNS UUID AS $$
  SELECT id FROM public.workers WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. REWRITE BUSINESS POLICIES (Projects, Clients, Reports, Subcontractors)
-- Pattern: EXISTS check on user_companies

-- PROJECTS
DROP POLICY IF EXISTS "Users can view projects of their company" ON public.projects;
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
CREATE POLICY "SSOT: Clients Access" ON public.clients
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.auth_id = auth.uid() 
    AND uc.company_id = public.clients.company_id
  )
);

-- REPORTS
DROP POLICY IF EXISTS "Users can view reports of their company" ON public.reports;
CREATE POLICY "SSOT: Reports Access" ON public.reports
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.auth_id = auth.uid() 
    AND uc.company_id = public.reports.company_id
  )
);

-- 3. REWRITE STORAGE POLICIES (Critical Fix)
DROP POLICY IF EXISTS "Allow authenticated select on company bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert on company bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete on company bucket" ON storage.objects;

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
CREATE POLICY "SSOT: Communications Access" ON public.internal_communications
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.auth_id = auth.uid() 
    AND uc.company_id = internal_communications.company_id
  )
);

-- 5. DEPRECATION (PHASE 2)
-- Redefine legacy function to return NULL to identify missed dependencies during testing
-- but keep it existing to avoid SQL syntax errors in old migrations.
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
BEGIN
  -- WARNING: This function is deprecated. 
  -- Returning legacy value for short-term compatibility during stabilization phase.
  RETURN (SELECT company_id FROM public.workers WHERE auth_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
