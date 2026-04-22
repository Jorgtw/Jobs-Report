-- Aggiornamento della policy di UPDATE per la tabella workers (Profili)
-- Permette agli amministratori di modificare i collaboratori della propria azienda

DROP POLICY IF EXISTS "SSOT: Workers Update" ON public.workers;

CREATE POLICY "SSOT: Workers Update" ON public.workers
FOR UPDATE TO authenticated
USING (
  -- L'utente può aggiornare se stesso
  auth_id = auth.uid() 
  OR 
  -- Oppure l'utente è un admin/supervisor in una società di cui il target fa parte
  EXISTS (
    SELECT 1 FROM public.user_companies my_uc
    JOIN public.user_companies their_uc ON my_uc.company_id = their_uc.company_id
    WHERE my_uc.auth_id = auth.uid()
    AND my_uc.role IN ('admin', 'supervisor', 'superadmin')
    AND their_uc.auth_id = public.workers.auth_id
  )
);
