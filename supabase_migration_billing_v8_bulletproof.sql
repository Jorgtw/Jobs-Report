-- ============================================================
-- MIGRATION: Entitlement & Billing Engine - V8 Bulletproof
-- ============================================================
-- Pattern: CQRS Event Sourcing + SKIP LOCKED Atomic Claims
-- ============================================================

-- 1. Aggiornamento schema billing_events
ALTER TABLE public.billing_events 
ADD COLUMN IF NOT EXISTS event_timestamp timestamp with time zone,
ADD COLUMN IF NOT EXISTS processing boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS retry_count int DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_error_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS locked_by uuid;

-- Index per performance sulle code di eventi
CREATE INDEX IF NOT EXISTS idx_billing_events_queue 
ON public.billing_events(processed, processing, event_timestamp);

-- 2. Aggiornamento schema company_entitlements (Monotonic State)
ALTER TABLE public.company_entitlements
ADD COLUMN IF NOT EXISTS last_event_timestamp timestamp with time zone DEFAULT '1970-01-01 00:00:00+00';

-- 3. Stored Procedure per l'Atomic Claiming (SKIP LOCKED)
CREATE OR REPLACE FUNCTION public.claim_billing_events(p_worker_id uuid, p_batch_size int)
RETURNS SETOF public.billing_events
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY 
    UPDATE public.billing_events
    SET processing = true, 
        locked_by = p_worker_id
    WHERE id IN (
        SELECT id 
        FROM public.billing_events 
        WHERE processed = false 
          AND processing = false 
          AND retry_count < 5 -- Skip dead letters
        ORDER BY event_timestamp ASC 
        FOR UPDATE SKIP LOCKED 
        LIMIT p_batch_size
    )
    RETURNING *;
END;
$$;
