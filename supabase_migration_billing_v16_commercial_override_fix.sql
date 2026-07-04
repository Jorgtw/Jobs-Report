-- ============================================================
-- MIGRATION: V16 - FIX COMMERCIAL OVERRIDES
-- ============================================================
-- 1. Re-integrates company_commercial_overrides into fn_get_company_access
-- ============================================================

-- Evaluate Access Logic (Grace Mode + Emergency Bypass + Commercial Override)
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
    v_override_plan TEXT;
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

    -- Break-glass emergency override (Highest priority)
    IF v_mode = 'emergency' THEN
        RETURN QUERY SELECT v_plan_code, true, v_mode;
        RETURN;
    END IF;

    -- Commercial Manual Override (Second priority)
    -- This overrides the billing logic entirely because the company has been manually granted a plan.
    SELECT plan_code INTO v_override_plan 
    FROM public.company_commercial_overrides 
    WHERE company_id = p_company_id;

    IF v_override_plan IS NOT NULL THEN
        v_plan_code := v_override_plan;
        v_is_granted := true;
        -- We return immediately because override bypasses standard billing logic
        RETURN QUERY SELECT v_plan_code, v_is_granted, v_mode;
        RETURN;
    END IF;

    -- Standard Stripe Billing Logic (Strict Active State)
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
