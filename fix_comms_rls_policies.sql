-- =======================================================================================
-- FIX: COMUNICAZIONI INTERNE RLS MIGRATION
-- RISOLVE L'ERRORE PER CUI AUTH.UID() NON MATCHAVA IL CAMPO ID MA IL NUOVO AUTH_ID
-- Da eseguire nell'SQL Editor di Supabase.
-- =======================================================================================

-- 1. DROP old broken policies
DROP POLICY IF EXISTS "Users: view relevant communications" ON public.internal_communications;
DROP POLICY IF EXISTS "Admin: manage communications" ON public.internal_communications;
DROP POLICY IF EXISTS "Admin & Users: insert and manage own communications" ON public.internal_communications;
DROP POLICY IF EXISTS "Users: manage own read receipts" ON public.communication_read_receipts;

-- Helper per semplificare (se non esiste) la presa del ruolo dell'utente
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.workers WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. POLICY RLS PER COMMUNICATIONS (Fix auth_id e superadmin)

-- Visualizzazione (Tutti gli utenti abilitati + superadmin bypass)
CREATE POLICY "Users: view relevant communications" ON public.internal_communications
    FOR SELECT USING (
        public.get_user_role() = 'superadmin' OR
        (
            company_id::uuid = public.get_user_company_id() AND (
                target_type::text = 'all' OR 
                (target_type::text = 'role' AND target_id::text = public.get_user_role()) OR
                (target_type::text = 'project' AND target_id::text IN (
                    SELECT id::text FROM public.projects 
                    WHERE assigned_worker_ids::text[] @> array[(SELECT id::text FROM public.workers WHERE auth_id = auth.uid() LIMIT 1)]
                )) OR
                (target_type::text = 'user' AND target_id::text = (SELECT id::text FROM public.workers WHERE auth_id = auth.uid() LIMIT 1)) OR
                (sender_id::uuid = (SELECT id::uuid FROM public.workers WHERE auth_id = auth.uid() LIMIT 1))
            )
        )
    );

-- Gestione: Invio e Modifica (Per chi ha permessi o creazioni proprie + superadmin bypass)
CREATE POLICY "Admin & Users: insert and manage own communications" ON public.internal_communications
    FOR ALL USING (
        public.get_user_role() = 'superadmin' OR
        (
            company_id::uuid = public.get_user_company_id() AND
            (
                public.get_user_role() IN ('admin', 'supervisor') 
                OR 
                sender_id::uuid = (SELECT id::uuid FROM public.workers WHERE auth_id = auth.uid() LIMIT 1)
            )
        )
    )
    WITH CHECK (
        public.get_user_role() = 'superadmin' OR
        (
            company_id::uuid = public.get_user_company_id() AND
            (
                public.get_user_role() IN ('admin', 'supervisor') 
                OR 
                sender_id::uuid = (SELECT id::uuid FROM public.workers WHERE auth_id = auth.uid() LIMIT 1)
            )
        )
    );

-- 3. POLICY RLS PER READ RECEIPTS (Fix auth_id e superadmin)
CREATE POLICY "Users: manage own read receipts" ON public.communication_read_receipts
    FOR ALL USING (
        public.get_user_role() = 'superadmin' OR
        user_id::uuid = (SELECT id::uuid FROM public.workers WHERE auth_id = auth.uid() LIMIT 1)
    );

-- SUCCESS
