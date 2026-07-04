-- ============================================================
-- MIGRATION: V14 - STRIPE CUSTOMER PORTAL & BILLING SPLIT
-- ============================================================
-- Seperates pure Stripe Billing state (company_billing) from
-- App Entitlements logic (company_entitlements).
-- Establishes the 1:1 relationship between Company and Stripe Customer.
-- ============================================================

-- 1. Create company_billing (Single Source of Truth for Stripe)
CREATE TABLE IF NOT EXISTS public.company_billing (
    company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    billing_status TEXT DEFAULT 'free',
    is_billing_active BOOLEAN DEFAULT false,
    plan_code TEXT DEFAULT 'free',
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.company_billing ENABLE ROW LEVEL SECURITY;

-- Solo gli amministratori possono leggere i dettagli di billing
CREATE POLICY "Billing readable by admins" ON public.company_billing
FOR SELECT TO authenticated
USING (
    public.is_global_superadmin()
    OR EXISTS (
        SELECT 1 FROM public.user_companies uc
        WHERE uc.company_id = company_billing.company_id
        AND uc.auth_id = auth.uid()
        AND uc.role = 'admin'
    )
);

-- Solo il service_role scrive qui (via Stripe Webhook)

-- 2. Migrate existing billing data from company_entitlements
INSERT INTO public.company_billing (
    company_id,
    stripe_customer_id,
    stripe_subscription_id,
    billing_status,
    is_billing_active,
    plan_code,
    current_period_end
)
SELECT 
    company_id,
    NULL AS stripe_customer_id,
    stripe_subscription_id,
    billing_status,
    is_billing_active,
    plan_code,
    current_period_end
FROM public.company_entitlements
ON CONFLICT (company_id) DO NOTHING;

-- 3. Update the vw_access_control view to use company_billing
DROP VIEW IF EXISTS public.vw_access_control;

CREATE OR REPLACE VIEW public.vw_access_control AS
SELECT 
    c.id AS company_id,
    c.name AS company_name,
    -- STATE (Pure Commercial Truth from company_billing)
    COALESCE(b.plan_code, 'free') AS plan_code,
    COALESCE(b.billing_status, 'free') AS billing_status,
    COALESCE(b.is_billing_active, false) AS is_billing_active,
    b.current_period_end,
    -- OPERATIONAL MODE (Incident State)
    COALESCE(o.mode, 'normal') AS operational_mode,
    -- USAGE (from counters)
    COALESCE(u.reports_count, 0) AS current_usage,
    -- PLAN METADATA (from plans catalog based on billing plan_code)
    COALESCE(p.reports_limit, 0) AS reports_limit,
    COALESCE(p.has_compliance, false) AS has_compliance,
    COALESCE(p.has_communications, false) AS has_communications,
    COALESCE(p.has_multiworker, false) AS has_multiworker,
    -- DIAGNOSTIC
    (b.company_id IS NOT NULL) AS has_billing_record,
    (u.company_id IS NOT NULL) AS has_usage_record
FROM public.companies c
LEFT JOIN public.company_billing b ON b.company_id = c.id
LEFT JOIN public.company_operational_state o ON o.company_id = c.id
LEFT JOIN public.company_usage u ON u.company_id = c.id
LEFT JOIN public.plans p ON p.code = COALESCE(b.plan_code, 'free');

GRANT SELECT ON public.vw_access_control TO authenticated;

-- 4. Update Policy Functions to read from company_billing
CREATE OR REPLACE FUNCTION public.can_company_create_report(p_company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
    SELECT COALESCE(
        (SELECT 
            -- GRACEFUL MODE: Allow past_due and incomplete. Emergency bypasses commercial suspension.
            (b.billing_status IN ('active', 'trialing', 'free', 'past_due', 'incomplete') OR o.mode = 'emergency')
            AND
            (p.reports_limit IS NULL OR COALESCE(u.reports_count, 0) < p.reports_limit)
         FROM public.companies c
         LEFT JOIN public.company_billing b ON b.company_id = c.id
         LEFT JOIN public.company_usage u ON u.company_id = c.id
         LEFT JOIN public.company_operational_state o ON o.company_id = c.id
         LEFT JOIN public.plans p ON p.code = COALESCE(b.plan_code, 'free')
         WHERE c.id = p_company_id
        ),
        false
    );
$$;

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
    v_operational_mode text;
BEGIN
    -- Extract Dimension A from company_billing and Break-glass from operational_state
    SELECT COALESCE(b.plan_code, 'free'), COALESCE(b.billing_status, 'free'), COALESCE(o.mode, 'normal')
    INTO v_plan_code, v_billing_status, v_operational_mode
    FROM public.companies c
    LEFT JOIN public.company_billing b ON b.company_id = c.id
    LEFT JOIN public.company_operational_state o ON o.company_id = c.id
    WHERE c.id = p_company_id;

    IF v_plan_code IS NULL THEN RETURN false; END IF;

    -- Commercial Suspension with Graceful Mode (allow past_due/incomplete) & Emergency bypass
    IF v_operational_mode != 'emergency' AND v_billing_status NOT IN ('active', 'trialing', 'free', 'past_due', 'incomplete') THEN
        RETURN false;
    END IF;

    SELECT COALESCE(p.has_compliance, false), COALESCE(p.has_communications, false), COALESCE(p.has_multiworker, false)
    INTO v_has_compliance, v_has_communications, v_has_multiworker
    FROM public.plans p
    WHERE p.code = v_plan_code;

    RETURN CASE p_feature
        WHEN 'compliance' THEN v_has_compliance
        WHEN 'communications' THEN v_has_communications
        WHEN 'multiworker' THEN v_has_multiworker
        ELSE false
    END;
END;
$$;

NOTIFY pgrst, 'reload schema';
