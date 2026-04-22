-- 1. Pulizia totale delle policy sospette
DROP POLICY IF EXISTS "SSOT: Workers Access" ON public.workers;
DROP POLICY IF EXISTS "SSOT: Workers Update" ON public.workers;
DROP POLICY IF EXISTS "SSOT: Memberships Access" ON public.user_companies;

-- 2. Funzione master per verificare se l'utente ha accesso a un profilo (Security Definer)
CREATE OR REPLACE FUNCTION public.can_access_worker(target_auth_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- È il mio profilo
    target_auth_id = auth.uid()
    OR
    -- Oppure sono un admin di una società di cui fa parte il target
    EXISTS (
      SELECT 1 FROM public.user_companies my_uc
      JOIN public.user_companies their_uc ON my_uc.company_id = their_uc.company_id
      WHERE my_uc.auth_id = auth.uid()
      AND my_uc.role::TEXT IN ('admin', 'supervisor', 'superadmin')
      AND their_uc.auth_id = target_auth_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Applicazione delle nuove policy pulite (Usando le funzioni master)
CREATE POLICY "SSOT: Workers Access" ON public.workers
FOR SELECT TO authenticated
USING (public.can_access_worker(auth_id));

CREATE POLICY "SSOT: Workers Update" ON public.workers
FOR UPDATE TO authenticated
USING (public.can_access_worker(auth_id));

CREATE POLICY "SSOT: Memberships Access" ON public.user_companies
FOR SELECT TO authenticated
USING (
  auth_id = auth.uid()
  OR
  public.is_admin_of_company(company_id)
);

-- Assicuriamoci che is_admin_of_company sia perfetta
CREATE OR REPLACE FUNCTION public.is_admin_of_company(target_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE auth_id = auth.uid()
    AND company_id = target_company_id
    AND role::TEXT IN ('admin', 'supervisor', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
