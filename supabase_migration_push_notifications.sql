-- =======================================================================================
-- MIGRATION: PUSH NOTIFICATIONS (MODULO PREMIUM)
-- Eseguire nell'SQL Editor di Supabase.
-- =======================================================================================

-- 1. FUNZIONE HELPER PER RECUPERARE IL WORKER_ID DALL'AUTH_ID
CREATE OR REPLACE FUNCTION public.get_worker_id_by_auth()
RETURNS UUID AS $$
  SELECT id FROM public.workers WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. TABELLA: SOTTOSCRIZIONI PUSH (Token FCM)
CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL,
    device_info JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(worker_id, fcm_token)
);

-- 3. TABELLA: LOG NOTIFICHE (Deduplicazione e Audit)
CREATE TABLE IF NOT EXISTS public.push_notifications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID NOT NULL REFERENCES public.internal_communications(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped', 'already_sent')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ABILITAZIONE RLS
ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications_log ENABLE ROW LEVEL SECURITY;

-- 5. POLICY RLS PER user_push_subscriptions
-- L'utente può gestire solo i propri token push
CREATE POLICY "Users: manage own push subscriptions" ON public.user_push_subscriptions
    FOR ALL USING (worker_id = public.get_worker_id_by_auth());

-- 6. POLICY RLS PER push_notifications_log
-- L'utente può vedere i log delle notifiche a lui indirizzate
CREATE POLICY "Users: view own notification logs" ON public.push_notifications_log
    FOR SELECT USING (worker_id = public.get_worker_id_by_auth());

-- 7. INDICI PER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_push_subs_worker_id ON public.user_push_subscriptions(worker_id);
CREATE INDEX IF NOT EXISTS idx_push_log_comm_worker ON public.push_notifications_log(communication_id, worker_id);

-- 8. TRIGGER PER AGGIORNARE updated_at IN user_push_subscriptions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_push_subs_updated_at
    BEFORE UPDATE ON public.user_push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
