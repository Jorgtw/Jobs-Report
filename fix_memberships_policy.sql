-- Estensione della policy di SELECT per user_companies
-- Permette agli amministratori di vedere le affiliazioni dei propri collaboratori

DROP POLICY IF EXISTS "SSOT: Memberships Access" ON public.user_companies;

CREATE POLICY "SSOT: Memberships Access" ON public.user_companies
FOR SELECT TO authenticated
USING (
  -- Vedo me stesso
  auth_id = auth.uid()
  OR
  -- Oppure sono un admin/supervisor in una società comune
  EXISTS (
    SELECT 1 FROM public.user_companies my_uc
    WHERE my_uc.auth_id = auth.uid()
    AND my_uc.role IN ('admin', 'supervisor', 'superadmin')
    AND my_uc.company_id = public.user_companies.company_id
  )
);
