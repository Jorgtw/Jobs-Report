-- =======================================================================================
-- MIGRATION: COMUNICAZIONI INTERNE PREMIUM (FASE 2)
-- Eseguire nell'SQL Editor di Supabase.
-- =======================================================================================

-- 1. CREAZIONE TABELLA COMMUNICATIONS
CREATE TABLE IF NOT EXISTS public.internal_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'role', 'project', 'user')),
    target_id TEXT, -- Può contenere l'ID del ruolo, del progetto o dell'utente specifico
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREAZIONE TABELLA READ RECEIPTS (Puntatori di lettura)
CREATE TABLE IF NOT EXISTS public.communication_read_receipts (
    communication_id UUID NOT NULL REFERENCES public.internal_communications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (communication_id, user_id)
);

-- 3. ABILITAZIONE RLS
ALTER TABLE public.internal_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_read_receipts ENABLE ROW LEVEL SECURITY;

-- 4. POLICY RLS PER COMMUNICATIONS

-- Visualizzazione:
-- Gli utenti vedono i messaggi della loro azienda se il target coincide
CREATE POLICY "Users: view relevant communications" ON public.internal_communications
    FOR SELECT USING (
        company_id = public.get_user_company_id() AND (
            target_type = 'all' OR 
            (target_type = 'role' AND target_id = (SELECT role::text FROM public.workers WHERE id = auth.uid())) OR
            (target_type = 'project' AND target_id IN (
                -- Progetti a cui l'utente è assegnato
                SELECT id::text FROM public.projects WHERE assigned_worker_ids @> array[auth.uid()::text]
            )) OR
            (target_type = 'user' AND target_id = auth.uid()::text)
        )
    );

-- Gestione: Solo Admin/Supervisor possono inviare (nella loro azienda)
CREATE POLICY "Admin: manage communications" ON public.internal_communications
    FOR ALL USING (
        company_id = public.get_user_company_id() AND 
        public.get_user_role() IN ('admin', 'supervisor')
    );

-- 5. POLICY RLS PER READ RECEIPTS
CREATE POLICY "Users: manage own read receipts" ON public.communication_read_receipts
    FOR ALL USING (user_id = auth.uid());

-- 6. INDICI
CREATE INDEX IF NOT EXISTS idx_comm_company_id ON public.internal_communications(company_id);
CREATE INDEX IF NOT EXISTS idx_comm_created_at_desc ON public.internal_communications(created_at DESC);
