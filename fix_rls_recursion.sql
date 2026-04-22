-- 1. Funzione per controllare se l'utente è admin di una società (Senza ricorsione RLS)
CREATE OR REPLACE FUNCTION public.is_admin_of_company(target_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE auth_id = auth.uid()
    AND company_id = target_company_id
    AND role IN ('admin', 'supervisor', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Correzione della policy RLS su user_companies (Rimozione ricorsione)
DROP POLICY IF EXISTS "SSOT: Memberships Access" ON public.user_companies;

CREATE POLICY "SSOT: Memberships Access" ON public.user_companies
FOR SELECT TO authenticated
USING (
  -- Vedo me stesso
  auth_id = auth.uid()
  OR
  -- Oppure sono un admin della società specifica (usando la funzione security definer)
  public.is_admin_of_company(company_id)
);

-- 3. Funzione di riparazione (Semplificata e sicura)
CREATE OR REPLACE FUNCTION public.repair_user_companies()
RETURNS VOID AS $$
BEGIN
  -- Sincronizza i lavoratori che hanno ancora company_id ma nessuna entry in user_companies
  INSERT INTO public.user_companies (auth_id, company_id, role)
  SELECT auth_id, company_id, role::public.app_role
  FROM public.workers
  WHERE auth_id IS NOT NULL 
  AND company_id IS NOT NULL
  ON CONFLICT (auth_id, company_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
