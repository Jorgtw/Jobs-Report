-- Aggiunta della policy di DELETE per la tabella workers
DROP POLICY IF EXISTS "SSOT: Workers Delete" ON public.workers;

CREATE POLICY "SSOT: Workers Delete" ON public.workers
FOR DELETE TO authenticated
USING (
  -- L'utente può eliminare se stesso (raro)
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
