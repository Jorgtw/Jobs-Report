-- ============================================================================
-- FIX DEFINITIVO: Accesso Amministratori e Superadmin ai Subappalti (SSOT)
-- ============================================================================

-- 1. RIPRISTINO RICONOSCIMENTO RUOLI (Superadmin)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.workers w ON ur.user_id = w.id
      WHERE w.auth_id = auth.uid()
      AND LOWER(ur.role) = 'superadmin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_companies
      WHERE auth_id = auth.uid()
      AND role = 'superadmin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. PULIZIA DATI CORROTTI (Risolve il problema del 403 Forbidden per gli Admin)
-- Alcuni record avevano il campo company_id impostato erroneamente all'ID utente (Auth ID)
DO $$
DECLARE
    default_id UUID;
BEGIN
    -- Cerchiamo una società valida a cui appoggiare i record orfani
    SELECT id INTO default_id FROM public.companies LIMIT 1;
    
    -- Se esiste almeno una società, procediamo con la pulizia
    IF default_id IS NOT NULL THEN
        -- Rimuoviamo associazioni SSOT errate (dove l'azienda coincide con l'utente)
        DELETE FROM public.user_companies WHERE company_id::text = auth_id::text;
        
        -- Sistemiamo i lavoratori che puntano a "se stessi" come azienda
        UPDATE public.workers SET company_id = default_id WHERE company_id::text = auth_id::text;
        
        -- Sistemiamo i subappalti che puntano a ID utente invece che a ID azienda
        UPDATE public.subcontractors SET company_id = default_id WHERE company_id NOT IN (SELECT id FROM public.companies);
        
        -- Record orfani senza azienda
        UPDATE public.subcontractors SET company_id = default_id WHERE company_id IS NULL;
    END IF;
END $$;

-- 3. AGGIORNAMENTO POLICY RLS (Subcontractors)
-- Permette agli Amministratori di gestire i subappalti della propria azienda
-- E ai Superadmin di gestire tutto.
DROP POLICY IF EXISTS "SSOT: Subcontractors Access" ON public.subcontractors;
DROP POLICY IF EXISTS "SuperAdmin: all subcontractors" ON public.subcontractors;
DROP POLICY IF EXISTS "Users: manage own company subcontractors" ON public.subcontractors;

CREATE POLICY "SSOT: Subcontractors Access" ON public.subcontractors
FOR ALL TO authenticated
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.auth_id = auth.uid() 
    AND uc.company_id = public.subcontractors.company_id
  )
)
WITH CHECK (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.user_companies uc 
    WHERE uc.auth_id = auth.uid() 
    AND uc.company_id = public.subcontractors.company_id
    AND uc.role IN ('admin', 'supervisor', 'superadmin')
  )
);

-- 4. REPAIR AUTOMATICO DELLE ASSOCIAZIONI (Assicura che gli Admin siano legati alla loro azienda)
SELECT public.repair_user_companies();

-- Forza il ricaricamento dello schema
NOTIFY pgrst, 'reload schema';
