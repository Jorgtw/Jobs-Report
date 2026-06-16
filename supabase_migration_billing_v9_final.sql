-- ============================================================
-- MIGRATION: Entitlement & Billing Engine - V9 Final
-- ============================================================
-- Pattern: CQRS Event Sourcing + Lease Recovery + Priority
-- ============================================================

-- 1. Aggiornamento schema billing_events (Leases & Priorities)
ALTER TABLE public.billing_events 
ADD COLUMN IF NOT EXISTS processing_lease_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS event_priority int DEFAULT 0;

-- 2. Aggiornamento schema company_entitlements (Full Monotonic State)
ALTER TABLE public.company_entitlements
ADD COLUMN IF NOT EXISTS last_event_priority int DEFAULT 0;

-- 3. Stored Procedure per l'Atomic Claiming con Lease Recovery
CREATE OR REPLACE FUNCTION public.claim_billing_events(p_worker_id uuid, p_batch_size int)
RETURNS SETOF public.billing_events
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY 
    UPDATE public.billing_events
    SET processing = true,
        processing_lease_expires_at = now() + interval '2 minutes',
        locked_by = p_worker_id
    WHERE id IN (
        SELECT id 
        FROM public.billing_events 
        WHERE processed = false 
          AND (processing = false OR processing_lease_expires_at < now())
          AND retry_count < 5 
        ORDER BY event_timestamp ASC, event_priority ASC
        FOR UPDATE SKIP LOCKED 
        LIMIT p_batch_size
    )
    RETURNING *;
END;
$$;
