-- 1. FIX: Superadmin access for COMPANIES
DROP POLICY IF EXISTS "SSOT: Companies Access" ON public.companies;
CREATE POLICY "SSOT: Companies Access" ON public.companies
FOR SELECT TO authenticated
USING (
  public.is_global_superadmin() 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_companies.company_id = companies.id
    AND user_companies.auth_id = auth.uid()
  )
);

-- 2. FIX: Superadmin access for REPORTS
DROP POLICY IF EXISTS "Reports Access" ON public.reports;
CREATE POLICY "Reports Access" ON public.reports
FOR SELECT TO authenticated
USING (
  public.is_global_superadmin()
  OR
  EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_companies.company_id = reports.company_id
    AND user_companies.auth_id = auth.uid()
  )
);

-- 3. FIX: Superadmin access for WORKERS
DROP POLICY IF EXISTS "SSOT: Workers Access" ON public.workers;
CREATE POLICY "SSOT: Workers Access" ON public.workers
FOR SELECT TO authenticated
USING (
  public.is_global_superadmin()
  OR
  public.can_access_worker_v2(auth_id, company_id)
);

-- 4. FIX: Superadmin access for RAPPORTINI_WORKERS
DROP POLICY IF EXISTS "Rapportini Workers Access" ON public.rapportini_workers;
CREATE POLICY "Rapportini Workers Access" ON public.rapportini_workers
FOR SELECT TO authenticated
USING (
  public.is_global_superadmin()
  OR
  EXISTS (
    SELECT 1 FROM public.reports
    WHERE reports.id = rapportini_workers.rapportino_id
  )
);

NOTIFY pgrst, 'reload schema';
