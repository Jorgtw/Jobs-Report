-- =======================================================================================
-- MIGRATION: MESSAGGI OPERATIVI PROGETTI (FASE 1)
-- Eseguire nell'SQL Editor di Supabase.
-- =======================================================================================

-- 1. CREAZIONE TABELLA MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL, -- Opzionale: collega a un rapportino specifico
    sender_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'note' CHECK (type IN ('note', 'issue', 'confirmation')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ABILITAZIONE RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. POLICY RLS (Isolamento Multi-tenant)

-- Visualizzazione: chiunque nella stessa company può vedere i messaggi dei progetti
CREATE POLICY "Users: view own company messages" ON public.messages
    FOR SELECT USING (
        company_id = public.get_user_company_id()
    );

-- Inserimento: chiunque nella stessa company può inviare messaggi
CREATE POLICY "Users: insert own company messages" ON public.messages
    FOR INSERT WITH CHECK (
        company_id = public.get_user_company_id()
    );

-- (Opzionale) SuperAdmin: accesso totale
CREATE POLICY "SuperAdmin: manage all messages" ON public.messages
    FOR ALL USING (public.is_super_admin());

-- 4. INDICI PER PERFORMANCE (Timeline progetto)
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON public.messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at_desc ON public.messages(created_at DESC);

-- 5. ABILITAZIONE REALTIME (Opzionale ma suggerito per il futuro)
-- Nota: Per attivarlo davvero devi aggiungerlo alla pubblicazione 'supabase_realtime' 
-- tramite Dashboard > Database > Replication.
