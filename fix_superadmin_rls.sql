-- 1. Definisci una funzione globale e sicura per identificare i superadmin
CREATE OR REPLACE FUNCTION public.is_global_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE auth_id = auth.uid() AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Correggiamo la visibilità delle Aziende (Companies) includendo i superadmin
DROP POLICY IF EXISTS "Users can view their companies" ON public.companies;
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

-- 3. Correggiamo la visibilità dei Collaboratori (Workers) includendo i superadmin
CREATE OR REPLACE FUNCTION public.can_access_worker_v2(target_auth_id UUID, target_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- È un superadmin globale (vede tutto)
    public.is_global_superadmin()
    OR
    -- È il mio profilo
    (target_auth_id IS NOT NULL AND target_auth_id = auth.uid())
    OR
    -- Oppure appartiene a una mia azienda e io sono admin/supervisor
    (target_company_id IS NOT NULL AND public.is_admin_of_company(target_company_id))
    OR
    -- Fallback SSOT: controlla tramite user_companies bridge
    (target_auth_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.user_companies my_uc
      JOIN public.user_companies their_uc ON my_uc.company_id = their_uc.company_id
      WHERE my_uc.auth_id = auth.uid()
      AND my_uc.role::TEXT IN ('admin', 'supervisor', 'superadmin')
      AND their_uc.auth_id = target_auth_id
    ))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Riapplichiamo le policy per Workers usando la funzione aggiornata
DROP POLICY IF EXISTS "SSOT: Workers Access" ON public.workers;
DROP POLICY IF EXISTS "SSOT: Workers Update" ON public.workers;

CREATE POLICY "SSOT: Workers Access" ON public.workers
FOR SELECT TO authenticated
USING (public.can_access_worker_v2(auth_id, company_id));

CREATE POLICY "SSOT: Workers Update" ON public.workers
FOR UPDATE TO authenticated
USING (public.can_access_worker_v2(auth_id, company_id));

NOTIFY pgrst, 'reload schema';
