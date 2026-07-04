-- ============================================================
-- MIGRATION: V15 - ENTERPRISE HARDENING & AUDIT LOGGING
-- ============================================================
-- 1. Adds company_billing_audit_log for strict governance
-- 2. Refactors vw_access_control into a functional layer
-- 3. Implements grace_period_until state machine
-- ============================================================

-- 1. Extend company_billing with grace_period_until
ALTER TABLE public.company_billing 
ADD COLUMN IF NOT EXISTS grace_period_until TIMESTAMPTZ;

-- 2. Create Audit Log Table
CREATE TABLE IF NOT EXISTS public.company_billing_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    previous_state JSONB,
    new_state JSONB NOT NULL,
    triggered_by TEXT NOT NULL, -- 'system_webhook', 'admin_manual', etc.
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.company_billing_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Audit logs readable by superadmins" ON public.company_billing_audit_log;
CREATE POLICY "Audit logs readable by superadmins" ON public.company_billing_audit_log
FOR SELECT TO authenticated USING (public.is_global_superadmin());

-- 3. Stored Procedure for Atomic State Updates
CREATE OR REPLACE FUNCTION public.set_company_billing_state(
    p_company_id UUID,
    p_stripe_customer_id TEXT,
    p_stripe_subscription_id TEXT,
    p_stripe_price_id TEXT,
    p_billing_status TEXT,
    p_is_billing_active BOOLEAN,
    p_plan_code TEXT,
    p_current_period_end TIMESTAMPTZ,
    p_cancel_at_period_end BOOLEAN,
    p_grace_period_until TIMESTAMPTZ,
    p_triggered_by TEXT,
    p_reason TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_previous_state JSONB;
    v_new_state JSONB;
BEGIN
    -- Capture previous state
    SELECT to_jsonb(b) INTO v_previous_state
    FROM public.company_billing b
    WHERE b.company_id = p_company_id;

    -- Build new state JSON
    v_new_state := jsonb_build_object(
        'stripe_customer_id', p_stripe_customer_id,
        'stripe_subscription_id', p_stripe_subscription_id,
        'stripe_price_id', p_stripe_price_id,
        'billing_status', p_billing_status,
        'is_billing_active', p_is_billing_active,
        'plan_code', p_plan_code,
        'current_period_end', p_current_period_end,
        'cancel_at_period_end', p_cancel_at_period_end,
        'grace_period_until', p_grace_period_until
    );

    -- Upsert company_billing
    INSERT INTO public.company_billing (
        company_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
        billing_status, is_billing_active, plan_code, current_period_end, cancel_at_period_end,
        grace_period_until, updated_at
    )
    VALUES (
        p_company_id, p_stripe_customer_id, p_stripe_subscription_id, p_stripe_price_id,
        p_billing_status, p_is_billing_active, p_plan_code, p_current_period_end, p_cancel_at_period_end,
        p_grace_period_until, now()
    )
    ON CONFLICT (company_id) DO UPDATE SET
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        stripe_subscription_id = EXCLUDED.stripe_subscription_id,
        stripe_price_id = EXCLUDED.stripe_price_id,
        billing_status = EXCLUDED.billing_status,
        is_billing_active = EXCLUDED.is_billing_active,
        plan_code = EXCLUDED.plan_code,
        current_period_end = EXCLUDED.current_period_end,
        cancel_at_period_end = EXCLUDED.cancel_at_period_end,
        grace_period_until = EXCLUDED.grace_period_until,
        updated_at = now();

    -- Write Audit Log
    INSERT INTO public.company_billing_audit_log (
        company_id, previous_state, new_state, triggered_by, reason
    )
    VALUES (
        p_company_id, v_previous_state, v_new_state, p_triggered_by, p_reason
    );
END;
$$;

-- 4. Functional Layer for Access Control

-- Return Billing Commercial State
CREATE OR REPLACE FUNCTION public.fn_get_company_billing_state(p_company_id UUID)
RETURNS TABLE (
    plan_code TEXT,
    billing_status TEXT,
    is_billing_active BOOLEAN,
    current_period_end TIMESTAMPTZ,
    grace_period_until TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
    SELECT 
        COALESCE(b.plan_code, 'free'),
        COALESCE(b.billing_status, 'free'),
        COALESCE(b.is_billing_active, false),
        b.current_period_end,
        b.grace_period_until
    FROM public.company_billing b
    WHERE b.company_id = p_company_id;
$$;

-- Evaluate Access Logic (Grace Mode + Emergency Bypass)
CREATE OR REPLACE FUNCTION public.fn_get_company_access(p_company_id UUID)
RETURNS TABLE (
    effective_plan_code TEXT,
    is_access_granted BOOLEAN,
    operational_mode TEXT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_plan_code TEXT;
    v_billing_status TEXT;
    v_grace_period_until TIMESTAMPTZ;
    v_mode TEXT;
    v_is_granted BOOLEAN := false;
BEGIN
    -- Operational State
    SELECT COALESCE(mode, 'normal') INTO v_mode 
    FROM public.company_operational_state WHERE company_id = p_company_id;
    
    -- Billing State
    SELECT plan_code, billing_status, grace_period_until 
    INTO v_plan_code, v_billing_status, v_grace_period_until
    FROM public.fn_get_company_billing_state(p_company_id);
    
    IF v_plan_code IS NULL THEN
        v_plan_code := 'free';
        v_billing_status := 'free';
    END IF;

    -- Break-glass override
    IF v_mode = 'emergency' THEN
        RETURN QUERY SELECT v_plan_code, true, v_mode;
        RETURN;
    END IF;

    -- Strict Active state
    IF v_billing_status IN ('active', 'trialing', 'free') THEN
        v_is_granted := true;
    -- Grace period checks
    ELSIF v_billing_status IN ('past_due', 'incomplete') THEN
        IF v_grace_period_until IS NOT NULL AND now() <= v_grace_period_until THEN
            v_is_granted := true;
        ELSE
            -- Grace period expired, fallback to free logic or deny
            v_is_granted := false;
            v_plan_code := 'free'; -- Downgrade effectively
        END IF;
    ELSE
        -- Canceled, unpaid
        v_is_granted := false;
        v_plan_code := 'free';
    END IF;

    -- If plan_code is free, access is inherently granted for free tier features
    IF v_plan_code = 'free' THEN
        v_is_granted := true;
    END IF;

    RETURN QUERY SELECT v_plan_code, v_is_granted, v_mode;
END;
$$;


-- 5. Refactor vw_access_control to Compose Functions
DROP VIEW IF EXISTS public.vw_access_control;

CREATE OR REPLACE VIEW public.vw_access_control AS
SELECT 
    c.id AS company_id,
    c.name AS company_name,
    -- Commercial Truth
    COALESCE(bs.plan_code, 'free') AS plan_code,
    COALESCE(bs.billing_status, 'free') AS billing_status,
    COALESCE(bs.is_billing_active, false) AS is_billing_active,
    bs.current_period_end,
    -- Effective Access (After Grace & Break-glass)
    acc.effective_plan_code,
    acc.is_access_granted,
    acc.operational_mode,
    -- Usage (from counters)
    COALESCE(u.reports_count, 0) AS current_usage,
    -- Plan Metadata (based on effective_plan_code)
    COALESCE(p.reports_limit, 0) AS reports_limit,
    COALESCE(p.has_compliance, false) AS has_compliance,
    COALESCE(p.has_communications, false) AS has_communications,
    COALESCE(p.has_multiworker, false) AS has_multiworker
FROM public.companies c
LEFT JOIN LATERAL public.fn_get_company_billing_state(c.id) bs ON true
LEFT JOIN LATERAL public.fn_get_company_access(c.id) acc ON true
LEFT JOIN public.company_usage u ON u.company_id = c.id
LEFT JOIN public.plans p ON p.code = COALESCE(acc.effective_plan_code, 'free');

GRANT SELECT ON public.vw_access_control TO authenticated;

-- 6. Update Policy Functions to use the functional layer

CREATE OR REPLACE FUNCTION public.can_company_create_report(p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_granted BOOLEAN;
    v_effective_plan TEXT;
    v_limit INT;
    v_usage INT;
BEGIN
    SELECT is_access_granted, effective_plan_code INTO v_is_granted, v_effective_plan
    FROM public.fn_get_company_access(p_company_id);

    IF NOT v_is_granted THEN RETURN false; END IF;

    SELECT reports_limit INTO v_limit FROM public.plans WHERE code = COALESCE(v_effective_plan, 'free');
    SELECT reports_count INTO v_usage FROM public.company_usage WHERE company_id = p_company_id;

    IF v_limit IS NULL THEN RETURN true; END IF;
    RETURN COALESCE(v_usage, 0) < v_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_company_use_feature(p_company_id uuid, p_feature text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_granted BOOLEAN;
    v_effective_plan TEXT;
    v_has_compliance boolean;
    v_has_communications boolean;
    v_has_multiworker boolean;
BEGIN
    SELECT is_access_granted, effective_plan_code INTO v_is_granted, v_effective_plan
    FROM public.fn_get_company_access(p_company_id);

    IF NOT v_is_granted THEN RETURN false; END IF;

    SELECT COALESCE(p.has_compliance, false), COALESCE(p.has_communications, false), COALESCE(p.has_multiworker, false)
    INTO v_has_compliance, v_has_communications, v_has_multiworker
    FROM public.plans p
    WHERE p.code = COALESCE(v_effective_plan, 'free');

    RETURN CASE p_feature
        WHEN 'compliance' THEN v_has_compliance
        WHEN 'communications' THEN v_has_communications
        WHEN 'multiworker' THEN v_has_multiworker
        ELSE false
    END;
END;
$$;

NOTIFY pgrst, 'reload schema';
