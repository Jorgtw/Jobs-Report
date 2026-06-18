-- ==============================================================================
-- JOBS-REPORT - MIGRATION V13: COMMERCIAL OVERRIDES (INJECTION METHOD)
-- ==============================================================================

-- 1. Create the new overrides table
CREATE TABLE IF NOT EXISTS public.company_commercial_overrides (
    company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
    plan_code text NOT NULL,
    reason text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_commercial_overrides ENABLE ROW LEVEL SECURITY;

-- Policy: Only superadmin can manage overrides
DROP POLICY IF EXISTS "Superadmin manage commercial overrides" ON public.company_commercial_overrides;
CREATE POLICY "Superadmin manage commercial overrides" ON public.company_commercial_overrides
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'
        )
    );

-- Policy: Users can read their own company's override status (useful for UI)
DROP POLICY IF EXISTS "Users read their commercial overrides" ON public.company_commercial_overrides;
CREATE POLICY "Users read their commercial overrides" ON public.company_commercial_overrides
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_companies uc
            WHERE uc.company_id = company_commercial_overrides.company_id
            AND uc.user_id = auth.uid()
        )
    );


-- 2. Update vw_access_control to inject the override
CREATE OR REPLACE VIEW public.vw_access_control AS
SELECT 
    c.id AS company_id,
    c.name AS company_name,
    -- STATE (Pure Commercial Truth with Override Injection)
    COALESCE(mo.plan_code, e.plan_code, 'free') AS plan_code,
    COALESCE(e.billing_status, 'free') AS billing_status,
    COALESCE(e.is_billing_active, false) AS is_billing_active,
    e.current_period_end,
    -- OPERATIONAL MODE (Incident State)
    COALESCE(o.mode, 'normal') AS operational_mode,
    -- USAGE (from counters)
    COALESCE(u.reports_count, 0) AS current_usage,
    -- PLAN METADATA (from plans catalog)
    COALESCE(p.reports_limit, 0) AS reports_limit,
    COALESCE(p.has_compliance, false) AS has_compliance,
    COALESCE(p.has_communications, false) AS has_communications,
    -- DIAGNOSTIC
    (e.company_id IS NOT NULL) AS has_entitlement_record,
    (u.company_id IS NOT NULL) AS has_usage_record,
    -- OVERRIDE METADATA
    (mo.company_id IS NOT NULL) AS is_commercial_override
FROM public.companies c
LEFT JOIN public.company_entitlements e ON e.company_id = c.id
LEFT JOIN public.company_commercial_overrides mo ON mo.company_id = c.id
LEFT JOIN public.company_operational_state o ON o.company_id = c.id
LEFT JOIN public.company_usage u ON u.company_id = c.id
LEFT JOIN public.plans p ON p.code = COALESCE(mo.plan_code, e.plan_code, 'free');

GRANT SELECT ON public.vw_access_control TO authenticated;
