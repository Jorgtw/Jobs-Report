-- ============================================================
-- MIGRATION: V17 - FIX VW_ACCESS_CONTROL SCHEMA
-- ============================================================
-- 1. Updates vw_access_control to expose `effective_plan_code` as `plan_code`
-- 2. Restores `is_commercial_override` for the Superadmin UI
-- ============================================================

DROP VIEW IF EXISTS public.vw_access_control;

CREATE OR REPLACE VIEW public.vw_access_control AS
SELECT 
    c.id AS company_id,
    c.name AS company_name,
    -- Frontend UI expects 'plan_code' to be the EFFECTIVE plan (including overrides)
    COALESCE(acc.effective_plan_code, 'free') AS plan_code,
    COALESCE(bs.billing_status, 'free') AS billing_status,
    COALESCE(bs.is_billing_active, false) AS is_billing_active,
    bs.current_period_end,
    -- Original Stripe truth (if needed for debugging)
    bs.plan_code AS stripe_plan_code,
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
    COALESCE(p.has_multiworker, false) AS has_multiworker,
    -- OVERRIDE METADATA (Required for Superadmin UI)
    (EXISTS(SELECT 1 FROM public.company_commercial_overrides co WHERE co.company_id = c.id)) AS is_commercial_override
FROM public.companies c
LEFT JOIN LATERAL public.fn_get_company_billing_state(c.id) bs ON true
LEFT JOIN LATERAL public.fn_get_company_access(c.id) acc ON true
LEFT JOIN public.company_usage u ON u.company_id = c.id
LEFT JOIN public.plans p ON p.code = COALESCE(acc.effective_plan_code, 'free');

GRANT SELECT ON public.vw_access_control TO authenticated;
