-- ============================================================
-- MIGRATION: Entitlement & Billing Engine - V10 Minimal
-- ============================================================
-- Pattern: Minimal Production-Grade (Stripe-style)
-- Idempotent Projection without judgment
-- ============================================================

-- 1. Pulizia vecchi trigger SQL (eredità V6 e precedenti)
DROP TRIGGER IF EXISTS trg_rebuild_entitlements_from_sub ON stripe.subscriptions;
DROP FUNCTION IF EXISTS public.trigger_rebuild_from_subscriptions();
DROP FUNCTION IF EXISTS public.rebuild_company_entitlement(uuid);

-- 2. Creazione della tabella di Log (Append-only)
CREATE TABLE IF NOT EXISTS public.billing_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_event_id text UNIQUE NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    
    stripe_created_at bigint NOT NULL,
    payload jsonb NOT NULL,
    
    processed boolean DEFAULT false,
    processing boolean DEFAULT false,
    processing_lease_expires_at timestamp with time zone,
    
    retry_count int DEFAULT 0,
    last_error text
);

-- Index per performance sulle code di eventi (ordinamento)
CREATE INDEX IF NOT EXISTS idx_billing_events_queue 
ON public.billing_events(processed, processing, stripe_created_at);

-- Assicurarsi che la RLS (se abilitata) consenta le operazioni al service_role
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
-- (Nessuna policy: di default il Service Role ignora l'RLS e gli utenti web non possono accedere)

-- 3. Stored Procedure per il Claim Atomico del Worker
-- Mantiene Lease Recovery e concorrenza, senza logiche di priorità
CREATE OR REPLACE FUNCTION public.claim_billing_events(p_worker_id text, p_batch_size int)
RETURNS SETOF public.billing_events
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY 
    UPDATE public.billing_events
    SET processing = true,
        processing_lease_expires_at = now() + interval '2 minutes'
    WHERE id IN (
        SELECT id 
        FROM public.billing_events 
        WHERE processed = false 
          AND (processing = false OR processing_lease_expires_at < now())
          AND retry_count <= 10 
        ORDER BY stripe_created_at ASC
        FOR UPDATE SKIP LOCKED 
        LIMIT p_batch_size
    )
    RETURNING *;
END;
$$;
