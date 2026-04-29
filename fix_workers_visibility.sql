-- ==============================================================================
-- JOBS REPORT: FIX MISSING WORKERS IN RAPPORTINI
-- ==============================================================================

-- 1. Pulizia preventiva: Rimuoviamo vecchie policy
DROP POLICY IF EXISTS "SSOT: Workers Access" ON public.workers;
DROP POLICY IF EXISTS "workers_select_by_company_access" ON public.workers;
DROP POLICY IF EXISTS "Enable read access for users in same company" ON public.workers;
DROP POLICY IF EXISTS "workers_self" ON public.workers;

-- 2. Creiamo una funzione robusta e performante per l'accesso (SECURITY DEFINER)
-- Questo previene qualsiasi problema di ricorsione sulle tabelle di ponte
CREATE OR REPLACE FUNCTION public.has_company_access_v2(target_company uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_companies uc
    WHERE uc.auth_id = auth.uid()
      AND uc.company_id = target_company
  );
END;
$$;

-- 3. Policy di Lettura: Un utente puo' vedere TUTTI i workers della sua azienda
CREATE POLICY "SSOT: Workers Access" 
ON public.workers
FOR SELECT TO authenticated
USING (
  public.has_company_access_v2(company_id)
  OR
  public.is_super_admin()
);

-- Aggiorniamo la cache delle policy
NOTIFY pgrst, 'reload schema';
