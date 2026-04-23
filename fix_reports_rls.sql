-- 0. ASSICURIAMOCI CHE LA FUNZIONE SUPERADMIN ESISTA
CREATE OR REPLACE FUNCTION public.is_global_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE auth_id = auth.uid() AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. SISTEMIAMO LA TABELLA DEI RAPPORTINI (REPORTS)
DROP POLICY IF EXISTS "SSOT: Reports Access" ON public.reports;
-- Rimuoviamo eventuali policy col vecchio nome
DROP POLICY IF EXISTS "Users can view reports for their company" ON public.reports;
DROP POLICY IF EXISTS "Users can view their company reports" ON public.reports;

CREATE POLICY "SSOT: Reports Access" ON public.reports
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

DROP POLICY IF EXISTS "SSOT: Reports Insert" ON public.reports;
CREATE POLICY "SSOT: Reports Insert" ON public.reports
FOR INSERT TO authenticated
WITH CHECK (
  public.is_global_superadmin()
  OR
  EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_companies.company_id = reports.company_id
    AND user_companies.auth_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "SSOT: Reports Update" ON public.reports;
CREATE POLICY "SSOT: Reports Update" ON public.reports
FOR UPDATE TO authenticated
USING (
  public.is_global_superadmin()
  OR
  EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_companies.company_id = reports.company_id
    AND user_companies.auth_id = auth.uid()
  )
);


-- 2. SISTEMIAMO LA TABELLA CHE COLLEGA I COLLABORATORI AI RAPPORTINI
DROP POLICY IF EXISTS "SSOT: Rapportini Workers Access" ON public.rapportini_workers;
DROP POLICY IF EXISTS "Users can view rapportini_workers" ON public.rapportini_workers;

CREATE POLICY "SSOT: Rapportini Workers Access" ON public.rapportini_workers
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = rapportini_workers.rapportino_id
    AND (
      public.is_global_superadmin()
      OR
      EXISTS (
        SELECT 1 FROM public.user_companies uc
        WHERE uc.company_id = r.company_id
        AND uc.auth_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "SSOT: Rapportini Workers Insert" ON public.rapportini_workers;
CREATE POLICY "SSOT: Rapportini Workers Insert" ON public.rapportini_workers
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
