-- ============================================================
-- MIGRATION: Entitlement & Billing Engine - V7 Event Sourced
-- ============================================================
-- Sostituisce la logica a trigger SQL con una logica a log di 
-- eventi idempotenti (Webhooks app-layer).
-- ============================================================

-- 1. Pulizia Totale dei vecchi trigger (V6 Strict e antecedenti)
DROP TRIGGER IF EXISTS trg_rebuild_entitlements_from_sub ON stripe.subscriptions;
DROP FUNCTION IF EXISTS public.trigger_rebuild_from_subscriptions();
DROP FUNCTION IF EXISTS public.rebuild_company_entitlement(uuid);

-- (Eventuali rimasugli storici)
DROP TRIGGER IF EXISTS trg_sync_company_entitlements ON stripe.subscriptions;
DROP TRIGGER IF EXISTS trg_sync_company_entitlements_items ON stripe.subscription_items;
DROP TRIGGER IF EXISTS trg_rebuild_entitlements_from_items ON stripe.subscription_items;
DROP FUNCTION IF EXISTS public.sync_company_entitlements();
DROP FUNCTION IF EXISTS public.trigger_rebuild_from_subscription_items();

-- 2. Creazione della tabella degli eventi (Append-Only Log Idempotente)
CREATE TABLE IF NOT EXISTS public.billing_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_event_id text UNIQUE NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    payload jsonb NOT NULL,
    processed boolean DEFAULT false,
    processing_error text
);

-- Index per ricerca veloce e gestione code
CREATE INDEX IF NOT EXISTS idx_billing_events_processed ON public.billing_events(processed);
CREATE INDEX IF NOT EXISTS idx_billing_events_type ON public.billing_events(type);

-- RLS (Restrict to Service Role only, webhook handlers)
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
-- Nessuna policy per anon o authenticated. Solo il service role (Edge Function) scriverà/leggerà.
