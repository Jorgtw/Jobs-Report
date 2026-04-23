-- 1. Funzione Helper per verificare se l'utente è Superadmin globale (Senza ricorsione)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE auth_id = auth.uid()
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Aggiornamento delle Policy per il Superadmin Bypass

-- COMPANIES
DROP POLICY IF EXISTS "SSOT: Companies Access" ON public.companies;
CREATE POLICY "SSOT: Companies Access" ON public.companies
FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.auth_id = auth.uid() 
    AND uc.company_id = public.companies.id
  )
);

-- REPORTS
DROP POLICY IF EXISTS "SSOT: Reports Access" ON public.reports;
CREATE POLICY "SSOT: Reports Access" ON public.reports
FOR ALL TO authenticated
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.auth_id = auth.uid() 
    AND uc.company_id = public.reports.company_id
  )
);

-- PROJECTS
DROP POLICY IF EXISTS "SSOT: Projects Access" ON public.projects;
CREATE POLICY "SSOT: Projects Access" ON public.projects
FOR ALL TO authenticated
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.auth_id = auth.uid() 
    AND uc.company_id = public.projects.company_id
  )
);

-- CLIENTS
DROP POLICY IF EXISTS "SSOT: Clients Access" ON public.clients;
CREATE POLICY "SSOT: Clients Access" ON public.clients
FOR ALL TO authenticated
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.auth_id = auth.uid() 
    AND uc.company_id = public.clients.company_id
  )
);

-- SUBCONTRACTORS
DROP POLICY IF EXISTS "SSOT: Subcontractors Access" ON public.subcontractors;
CREATE POLICY "SSOT: Subcontractors Access" ON public.subcontractors
FOR ALL TO authenticated
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.auth_id = auth.uid() 
    AND uc.company_id = public.subcontractors.company_id
  )
);

-- WORKERS (SELECT) - Già corretta con master function can_access_worker ma aggiungiamo bypass esplicito per sicurezza
CREATE OR REPLACE FUNCTION public.can_access_worker(target_auth_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    target_auth_id = auth.uid()
    OR public.is_super_admin() -- SUPERADMIN BYPASS
    OR EXISTS (
      SELECT 1 FROM public.user_companies my_uc
      JOIN public.user_companies their_uc ON my_uc.company_id = their_uc.company_id
      WHERE my_uc.auth_id = auth.uid()
      AND my_uc.role::TEXT IN ('admin', 'supervisor', 'superadmin')
      AND their_uc.auth_id = target_auth_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
