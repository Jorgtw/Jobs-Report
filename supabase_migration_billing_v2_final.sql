-- ============================================================
-- MIGRATION: Entitlement & Billing Engine - V2 Enterprise
-- ============================================================
-- Architecture: State → Policy → Enforcement
-- Stripe = billing ledger (read-only mirror)
-- Entitlements = subscription state (event-driven)
-- Policy Functions = permission decisions (the "judge")
-- View = aggregation only (no business logic)
-- ============================================================

-- ============================================================
-- LAYER 1: TABLES (Pure State Storage)
-- ============================================================

-- 1a. Product Catalog: What features does each plan offer?
CREATE TABLE IF NOT EXISTS public.plans (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    stripe_price_id TEXT UNIQUE,
    reports_limit INTEGER,          -- NULL = unlimited
    has_compliance BOOLEAN DEFAULT FALSE,
    has_communications BOOLEAN DEFAULT FALSE,
    has_multiworker BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default plans (idempotent)
INSERT INTO public.plans (code, name, stripe_price_id, reports_limit, has_compliance, has_communications, has_multiworker)
VALUES 
    ('free', 'Piano Free', NULL, 50, FALSE, FALSE, FALSE),
    ('pro', 'Piano Pro', NULL, NULL, TRUE, TRUE, TRUE)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    reports_limit = EXCLUDED.reports_limit,
    has_compliance = EXCLUDED.has_compliance,
    has_communications = EXCLUDED.has_communications,
    has_multiworker = EXCLUDED.has_multiworker;

-- 1a. Stripe Price → Internal Plan mapping
CREATE TABLE IF NOT EXISTS public.plan_mapping (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_price_id text UNIQUE NOT NULL,
    plan_code text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 1b. Entitlements: What subscription state does this company have?
-- billing_status ontology (single, exhaustive):
--   free     = no Stripe subscription, using free tier
--   active   = Stripe subscription active and paid
--   trialing = Stripe trial period
--   past_due = payment failed, grace period
--   canceled = subscription ended
CREATE TABLE IF NOT EXISTS public.company_entitlements (
    company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
    plan_code text NOT NULL DEFAULT 'free',
    billing_status text NOT NULL DEFAULT 'free',
    is_billing_active boolean NOT NULL DEFAULT false, -- TRUE only when Stripe says so
    current_period_end timestamptz,
    stripe_subscription_id text,
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT check_billing_status CHECK (
        billing_status IN ('free', 'active', 'trialing', 'past_due', 'canceled')
    )
);

-- 1c. Usage Counters (knows nothing about Stripe or plans)
CREATE TABLE IF NOT EXISTS public.company_usage (
    company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
    reports_count integer NOT NULL DEFAULT 0,
    period_start timestamptz DEFAULT now(),
    period_end timestamptz,
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT check_positive_count CHECK (reports_count >= 0)
);

-- ============================================================
-- LAYER 2: AUTO-INITIALIZATION (Trigger Only, No Seed)
-- ============================================================
-- Rule: Init creates MINIMAL free state. Stripe sync is the ONLY
-- thing that can set is_billing_active = true.

CREATE OR REPLACE FUNCTION public.init_company_billing()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.company_entitlements 
        (company_id, plan_code, billing_status, is_billing_active)
    VALUES 
        (NEW.id, 'free', 'free', false)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.company_usage (company_id, reports_count)
    VALUES (NEW.id, 0)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_init_company_billing ON public.companies;
CREATE TRIGGER trg_init_company_billing
AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.init_company_billing();

-- ============================================================
-- LAYER 3: STRIPE SYNC (Event-Driven State Update)
-- ============================================================
-- Rule: This is the ONLY writer to entitlements after init.
-- Stripe Sync Engine updates stripe.subscriptions → this trigger fires.

CREATE OR REPLACE FUNCTION public.sync_company_entitlements()
RETURNS trigger AS $$
DECLARE
    v_company_id uuid;
    v_price_id text;
    v_plan_code text;
    v_status text;
    v_period_end timestamptz;
BEGIN
    -- Guard: skip if no company mapping in metadata
    IF NEW.metadata->>'company_id' IS NULL THEN RETURN NEW; END IF;
    
    v_company_id := (NEW.metadata->>'company_id')::uuid;
    v_status := NEW.status;
    v_period_end := to_timestamp(NEW.current_period_end);

    -- Deterministic price extraction (latest item wins)
    SELECT si.price INTO v_price_id
    FROM stripe.subscription_items si
    WHERE si.subscription = NEW.id
    ORDER BY si.created DESC
    LIMIT 1;

    -- Map Stripe price to internal plan code
    SELECT pm.plan_code INTO v_plan_code
    FROM public.plan_mapping pm
    WHERE pm.stripe_price_id = v_price_id;

    -- Upsert entitlements (Stripe is the sole authority for paid state)
    INSERT INTO public.company_entitlements (
        company_id, plan_code, billing_status, is_billing_active,
        current_period_end, stripe_subscription_id, updated_at
    )
    VALUES (
        v_company_id,
        COALESCE(v_plan_code, 'free'),
        v_status,                              -- Stripe status directly
        v_status IN ('active', 'trialing'),    -- Only these two = billing active
        v_period_end,
        NEW.id,
        now()
    )
    ON CONFLICT (company_id) DO UPDATE SET
        plan_code = EXCLUDED.plan_code,
        billing_status = EXCLUDED.billing_status,
        is_billing_active = EXCLUDED.is_billing_active,
        current_period_end = EXCLUDED.current_period_end,
        stripe_subscription_id = EXCLUDED.stripe_subscription_id,
        updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_sync_company_entitlements ON stripe.subscriptions;
CREATE TRIGGER trg_sync_company_entitlements
AFTER INSERT OR UPDATE ON stripe.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.sync_company_entitlements();

-- ============================================================
-- LAYER 4: POLICY FUNCTIONS (The "Judge")
-- ============================================================
-- Rule: ALL permission decisions live here. Not in views, not in
-- the frontend, not scattered in triggers.

-- 4a. Can this company create a new report?
CREATE OR REPLACE FUNCTION public.can_company_create_report(p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_plan_code text;
    v_billing_status text;
    v_reports_count integer;
    v_reports_limit integer;
BEGIN
    -- Get entitlement state (NULL-safe extraction)
    SELECT COALESCE(e.plan_code, 'free'), COALESCE(e.billing_status, 'free')
    INTO v_plan_code, v_billing_status
    FROM public.company_entitlements e
    WHERE e.company_id = p_company_id;

    -- No entitlement record = no access
    IF NOT FOUND THEN RETURN false; END IF;

    -- Get usage
    SELECT COALESCE(u.reports_count, 0)
    INTO v_reports_count
    FROM public.company_usage u
    WHERE u.company_id = p_company_id;
    
    IF NOT FOUND THEN v_reports_count := 0; END IF;

    -- Get plan limits
    SELECT p.reports_limit
    INTO v_reports_limit
    FROM public.plans p
    WHERE p.code = v_plan_code;

    -- DECISION LOGIC:
    -- Free plan: allowed if under limit
    IF v_billing_status = 'free' THEN
        RETURN (v_reports_limit IS NULL OR v_reports_count < v_reports_limit);
    END IF;

    -- Paid plans: allowed if billing active AND under limit (or unlimited)
    IF v_billing_status IN ('active', 'trialing') THEN
        RETURN (v_reports_limit IS NULL OR v_reports_count < v_reports_limit);
    END IF;

    -- Everything else (past_due, canceled) = blocked
    RETURN false;
END;
$$;

-- 4b. Can this company use a specific feature?
-- Uses explicit CASE instead of dynamic SQL to prevent:
--   - SQL injection risk
--   - Runtime column-not-found errors
--   - Silent breakage on schema refactors
CREATE OR REPLACE FUNCTION public.can_company_use_feature(p_company_id uuid, p_feature text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_plan_code text;
    v_billing_status text;
    v_has_compliance boolean;
    v_has_communications boolean;
    v_has_multiworker boolean;
BEGIN
    -- NULL-safe extraction
    SELECT COALESCE(e.plan_code, 'free'), COALESCE(e.billing_status, 'free')
    INTO v_plan_code, v_billing_status
    FROM public.company_entitlements e
    WHERE e.company_id = p_company_id;

    IF NOT FOUND THEN RETURN false; END IF;

    -- Free tier: no premium features
    IF v_billing_status = 'free' THEN RETURN false; END IF;

    -- Paid but not active: no premium features
    IF v_billing_status NOT IN ('active', 'trialing') THEN RETURN false; END IF;

    -- Get plan features (explicit, no dynamic SQL)
    SELECT 
        COALESCE(p.has_compliance, false),
        COALESCE(p.has_communications, false),
        COALESCE(p.has_multiworker, false)
    INTO v_has_compliance, v_has_communications, v_has_multiworker
    FROM public.plans p
    WHERE p.code = v_plan_code;

    IF NOT FOUND THEN RETURN false; END IF;

    -- Explicit feature check (compile-time safe)
    RETURN CASE p_feature
        WHEN 'compliance' THEN v_has_compliance
        WHEN 'communications' THEN v_has_communications
        WHEN 'multiworker' THEN v_has_multiworker
        ELSE false  -- Unknown feature = denied
    END;
END;
$$;

-- ============================================================
-- LAYER 5: VIEW (Pure State Aggregation — NO Policy Logic)
-- ============================================================
-- Rule: View aggregates state for display/debugging ONLY.
-- Frontend calls policy functions (can_company_create_report,
-- can_company_use_feature) as RPCs for permission decisions.
-- This prevents "shadow policy" drift between view and functions.

CREATE OR REPLACE VIEW public.vw_access_control AS
SELECT 
    c.id AS company_id,
    c.name AS company_name,
    -- STATE (from entitlements)
    COALESCE(e.plan_code, 'free') AS plan_code,
    COALESCE(e.billing_status, 'free') AS billing_status,
    COALESCE(e.is_billing_active, false) AS is_billing_active,
    e.current_period_end,
    -- USAGE (from counters)
    COALESCE(u.reports_count, 0) AS current_usage,
    -- PLAN METADATA (from plans catalog)
    COALESCE(p.reports_limit, 0) AS reports_limit,
    COALESCE(p.has_compliance, false) AS has_compliance,
    COALESCE(p.has_communications, false) AS has_communications,
    -- DIAGNOSTIC (for admin/debug, not for decisions)
    (e.company_id IS NOT NULL) AS has_entitlement_record,
    (u.company_id IS NOT NULL) AS has_usage_record
FROM public.companies c
LEFT JOIN public.company_entitlements e ON e.company_id = c.id
LEFT JOIN public.company_usage u ON u.company_id = c.id
LEFT JOIN public.plans p ON p.code = e.plan_code;

GRANT SELECT ON public.vw_access_control TO authenticated;

-- ============================================================
-- LAYER 6: INITIAL BACKFILL (One-time, for existing companies)
-- ============================================================
-- This runs ONCE during migration. After this, the trigger handles
-- all new companies. No ongoing seed needed.

INSERT INTO public.company_entitlements (company_id, plan_code, billing_status, is_billing_active)
SELECT id, 'free', 'free', false
FROM public.companies
WHERE id NOT IN (SELECT company_id FROM public.company_entitlements);

INSERT INTO public.company_usage (company_id, reports_count)
SELECT id, 0
FROM public.companies
WHERE id NOT IN (SELECT company_id FROM public.company_usage);

-- Reconcile usage counters with actual report counts (period-aware)
UPDATE public.company_usage u
SET 
    reports_count = (
        SELECT count(*) FROM public.reports r 
        WHERE r.company_id = u.company_id
        AND r.created_at >= COALESCE(u.period_start, '1970-01-01'::timestamptz)
    ),
    updated_at = now()
WHERE u.period_start IS NOT NULL OR u.reports_count = 0;

-- ============================================================
-- LAYER 7: REAL-TIME USAGE TRACKING (Replaces V1 trigger)
-- ============================================================
-- Rule: Every INSERT/DELETE on reports atomically updates
-- company_usage.reports_count. No batch reconciliation needed
-- for normal operations. The backfill above is one-time only.

CREATE OR REPLACE FUNCTION public.track_report_usage()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Ensure usage row exists (defensive)
        INSERT INTO public.company_usage (company_id, reports_count)
        VALUES (NEW.company_id, 0)
        ON CONFLICT DO NOTHING;

        UPDATE public.company_usage
        SET reports_count = reports_count + 1, updated_at = now()
        WHERE company_id = NEW.company_id;

        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.company_usage
        SET reports_count = GREATEST(0, reports_count - 1), updated_at = now()
        WHERE company_id = OLD.company_id;

        RETURN OLD;

    ELSIF (TG_OP = 'UPDATE' AND NEW.company_id <> OLD.company_id) THEN
        -- Report moved between companies
        UPDATE public.company_usage
        SET reports_count = GREATEST(0, reports_count - 1), updated_at = now()
        WHERE company_id = OLD.company_id;

        INSERT INTO public.company_usage (company_id, reports_count)
        VALUES (NEW.company_id, 0)
        ON CONFLICT DO NOTHING;

        UPDATE public.company_usage
        SET reports_count = reports_count + 1, updated_at = now()
        WHERE company_id = NEW.company_id;

        RETURN NEW;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Remove old V1 trigger if it exists, then create new one
DROP TRIGGER IF EXISTS tr_manage_reports_usage ON public.reports;
DROP TRIGGER IF EXISTS trg_track_report_usage ON public.reports;
CREATE TRIGGER trg_track_report_usage
BEFORE INSERT OR DELETE OR UPDATE OF company_id ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.track_report_usage();

-- ============================================================
-- LAYER 8: RLS ENFORCEMENT (The "Bouncer")
-- ============================================================
-- Rule: The database ITSELF blocks unauthorized writes.
-- Even if someone bypasses the UI and calls the API directly,
-- the INSERT will fail if can_company_create_report() = false.
-- This is the final layer that makes the system tamper-proof.

-- Ensure RLS is enabled on reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow INSERT if the policy function says yes
-- Note: This works alongside existing RLS policies (e.g. tenant isolation)
DROP POLICY IF EXISTS "Enforce report creation limits" ON public.reports;
CREATE POLICY "Enforce report creation limits"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (
    public.can_company_create_report(company_id)
);
