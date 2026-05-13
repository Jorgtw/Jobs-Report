-- ============================================================
-- MIGRATION: Professional SaaS Billing Architecture - V9 (Transactional Ledger)
-- ============================================================

-- 1. Table for Subscription Plans
CREATE TABLE IF NOT EXISTS public.plans (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    stripe_price_id TEXT UNIQUE, 
    reports_limit INTEGER, -- NULL for unlimited
    has_compliance BOOLEAN DEFAULT FALSE,
    has_communications BOOLEAN DEFAULT FALSE,
    has_multiworker BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Insert Default Plans
INSERT INTO public.plans (code, name, stripe_price_id, reports_limit, has_compliance, has_communications, has_multiworker)
VALUES 
    ('free', 'Piano Free', NULL, 50, FALSE, FALSE, FALSE),
    ('pro', 'Piano Pro', 'price_12345_placeholder', NULL, TRUE, TRUE, TRUE)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    stripe_price_id = EXCLUDED.stripe_price_id,
    reports_limit = EXCLUDED.reports_limit,
    has_compliance = EXCLUDED.has_compliance,
    has_communications = EXCLUDED.has_communications,
    has_multiworker = EXCLUDED.has_multiworker;

-- 3. Table for Company Subscriptions (Operational Read Model)
CREATE TABLE IF NOT EXISTS public.company_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    last_event_id TEXT,
    last_event_created_at TIMESTAMP WITH TIME ZONE, 
    
    plan_code TEXT NOT NULL REFERENCES public.plans(code) DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'inactive',
    environment TEXT DEFAULT 'live',
    
    -- Atomic Counter (Fast Path)
    reports_count INTEGER NOT NULL DEFAULT 0,
    
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT unique_company_subscription UNIQUE (company_id),
    CONSTRAINT check_subscription_status CHECK (status IN ('inactive', 'active', 'trialing', 'past_due', 'canceled', 'incomplete')),
    CONSTRAINT check_environment CHECK (environment IN ('live', 'test')),
    CONSTRAINT check_positive_counter CHECK (reports_count >= 0)
);

-- 4. Table for Webhook Idempotency
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
    event_id TEXT PRIMARY KEY,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Table for Domain Events (Event Ledger / Audit Log)
CREATE TABLE IF NOT EXISTS public.domain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- e.g., 'report.created', 'subscription.synced'
    payload JSONB NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_domain_events_company_history ON public.domain_events(company_id, created_at DESC);

-- 6. Helper Functions (Hardened Search Path)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_uid UUID;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN RETURN FALSE; END IF;
    RETURN EXISTS (SELECT 1 FROM public.workers w JOIN public.user_roles ur ON ur.user_id = w.id WHERE w.auth_id = v_uid AND ur.role = 'superadmin');
END;
$$;

CREATE OR REPLACE FUNCTION public.check_caller_membership(p_company_id UUID)
RETURNS VOID LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_uid UUID;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN RAISE EXCEPTION 'Accesso negato: sessione non trovata.'; END IF;
    IF NOT public.is_superadmin() AND NOT EXISTS (SELECT 1 FROM public.user_companies WHERE auth_id = v_uid AND company_id = p_company_id) THEN
        RAISE EXCEPTION 'Accesso negato: non appartieni a questa azienda.';
    END IF;
END;
$$;

-- 7. THE TRANSACTIONAL LEDGER TRIGGER (Atomicity Point)
CREATE OR REPLACE FUNCTION public.manage_reports_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_limit INTEGER;
    v_current INTEGER;
    v_lock_id BIGINT;
BEGIN
    v_lock_id := hashtext(COALESCE(NEW.company_id, OLD.company_id)::text)::bigint;
    PERFORM pg_advisory_xact_lock(v_lock_id);

    -- Action: INSERT or company change
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND NEW.company_id <> OLD.company_id) THEN
        SELECT p.reports_limit, s.reports_count INTO v_limit, v_current
        FROM public.company_subscriptions s
        JOIN public.plans p ON s.plan_code = p.code
        WHERE s.company_id = NEW.company_id FOR UPDATE;

        IF v_limit IS NOT NULL AND v_current >= v_limit THEN
            RAISE EXCEPTION 'Limite raggiunto per il tuo piano. Passa a Pro per continuare.';
        END IF;

        -- 1. Update Operational State
        UPDATE public.company_subscriptions SET reports_count = reports_count + 1 WHERE company_id = NEW.company_id;

        -- 2. Emit Domain Event
        INSERT INTO public.domain_events (company_id, event_type, payload)
        VALUES (NEW.company_id, 'report.created', jsonb_build_object('report_id', NEW.id, 'user_id', NEW.user_id));

        IF (TG_OP = 'UPDATE') THEN
           UPDATE public.company_subscriptions SET reports_count = GREATEST(0, reports_count - 1) WHERE company_id = OLD.company_id;
           INSERT INTO public.domain_events (company_id, event_type, payload)
           VALUES (OLD.company_id, 'report.moved_out', jsonb_build_object('report_id', NEW.id));
        END IF;
    
    -- Action: DELETE
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.company_subscriptions SET reports_count = GREATEST(0, reports_count - 1) WHERE company_id = OLD.company_id;
        INSERT INTO public.domain_events (company_id, event_type, payload)
        VALUES (OLD.company_id, 'report.deleted', jsonb_build_object('report_id', OLD.id));
    END IF;

    IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS tr_manage_reports_usage ON public.reports;
CREATE TRIGGER tr_manage_reports_usage
BEFORE INSERT OR DELETE OR UPDATE OF company_id ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.manage_reports_usage();

-- 8. Public RPC: Subscription Status for Frontend
CREATE OR REPLACE FUNCTION public.get_company_subscription_status(p_company_id UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_sub RECORD; v_plan RECORD;
BEGIN
    PERFORM public.check_caller_membership(p_company_id);
    SELECT * INTO v_sub FROM public.company_subscriptions WHERE company_id = p_company_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'plan_code', 'free', 'status', 'active', 'reports_count', 0, 'reports_limit', 50,
            'features', jsonb_build_object('compliance_reports', false, 'communications', false, 'multiworker', false, 'can_create_reports', true)
        );
    END IF;
    SELECT * INTO v_plan FROM public.plans WHERE code = v_sub.plan_code;
    RETURN jsonb_build_object(
        'plan_code', v_sub.plan_code, 'status', v_sub.status, 'environment', v_sub.environment,
        'current_period_end', v_sub.current_period_end, 'reports_count', v_sub.reports_count, 'reports_limit', v_plan.reports_limit,
        'features', jsonb_build_object(
            'compliance_reports', v_plan.has_compliance, 'communications', v_plan.has_communications,
            'multiworker', v_plan.has_multiworker, 'can_create_reports', (v_plan.reports_limit IS NULL OR v_sub.reports_count < v_plan.reports_limit)
        )
    );
END;
$$;

-- 9. INTERNAL WEBHOOK SYNC (Stripe-Grade Idempotency)
CREATE OR REPLACE FUNCTION public.sync_company_subscription(
    p_company_id UUID, p_stripe_customer_id TEXT, p_stripe_subscription_id TEXT, p_plan_code TEXT, p_status TEXT,
    p_environment TEXT DEFAULT 'live', p_current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_event_id TEXT DEFAULT NULL, p_event_created_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_last_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Idempotency
    IF p_event_id IS NOT NULL THEN
        BEGIN
            INSERT INTO public.processed_stripe_events (event_id) VALUES (p_event_id);
        EXCEPTION WHEN unique_violation THEN RETURN; END;
    END IF;

    -- Order check
    SELECT last_event_created_at INTO v_last_time FROM public.company_subscriptions WHERE company_id = p_company_id;
    IF v_last_time IS NOT NULL AND p_event_created_at IS NOT NULL AND p_event_created_at < v_last_time THEN RETURN; END IF;

    -- Upsert State
    INSERT INTO public.company_subscriptions (
        company_id, stripe_customer_id, stripe_subscription_id, plan_code, status, environment, 
        current_period_end, last_event_id, last_event_created_at, updated_at
    )
    VALUES (
        p_company_id, p_stripe_customer_id, p_stripe_subscription_id, p_plan_code, p_status, p_environment, 
        p_current_period_end, p_event_id, p_event_created_at, now()
    )
    ON CONFLICT (company_id) DO UPDATE SET
        stripe_customer_id = EXCLUDED.stripe_customer_id, stripe_subscription_id = EXCLUDED.stripe_subscription_id,
        plan_code = EXCLUDED.plan_code, status = EXCLUDED.status, environment = EXCLUDED.environment,
        current_period_end = EXCLUDED.current_period_end, last_event_id = EXCLUDED.last_event_id,
        last_event_created_at = EXCLUDED.last_event_created_at, updated_at = now();

    -- Log Sync Event
    INSERT INTO public.domain_events (company_id, event_type, payload)
    VALUES (p_company_id, 'subscription.synced', jsonb_build_object('plan', p_plan_code, 'status', p_status, 'event_id', p_event_id));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_company_subscription FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_company_subscription FROM authenticated;

-- 10. Reconciliation & Security
CREATE OR REPLACE FUNCTION public.reconcile_company_counter(p_company_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
    UPDATE public.company_subscriptions SET reports_count = (SELECT count(*) FROM public.reports WHERE company_id = p_company_id) WHERE company_id = p_company_id;
END;
$$;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans readable by all" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Subscriptions readable by company admins" ON public.company_subscriptions FOR SELECT USING (public.is_superadmin() OR EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = company_subscriptions.company_id AND uc.auth_id = auth.uid() AND uc.role = 'admin'));

-- Initial Sync
UPDATE public.company_subscriptions s SET reports_count = (SELECT count(*) FROM public.reports r WHERE r.company_id = s.company_id);

NOTIFY pgrst, 'reload schema';
