-- ============================================================
-- MIGRATION: Manual Override Protection - V11
-- ============================================================
-- Pattern: Separate Override Layer
-- Creates a dedicated table for manual overrides, ensuring
-- the Stripe worker's company_entitlements remains a pure, 
-- idempotent projection of billing_events.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.company_manual_overrides (
    company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
    plan_code text NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    updated_at timestamptz DEFAULT now()
);

-- RLS Policies
-- By default, no access from anonymous/authenticated users unless explicitly granted.
-- Service Role (and therefore the admin API / backend) bypasses RLS anyway.
ALTER TABLE public.company_manual_overrides ENABLE ROW LEVEL SECURITY;
