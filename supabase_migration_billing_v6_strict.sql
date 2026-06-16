-- ============================================================
-- MIGRATION: Entitlement & Billing Engine - V6 Strict
-- ============================================================
-- Pattern: Strict State Reconciliation (Zero Drift, No Merge)
-- ============================================================

-- 1. Pulizia Totale Vecchie Versioni
DROP TRIGGER IF EXISTS trg_sync_company_entitlements ON stripe.subscriptions;
DROP TRIGGER IF EXISTS trg_sync_company_entitlements_items ON stripe.subscription_items;
DROP TRIGGER IF EXISTS trg_rebuild_entitlements_from_items ON stripe.subscription_items;
DROP TRIGGER IF EXISTS trg_rebuild_entitlements_from_sub ON stripe.subscriptions;
DROP FUNCTION IF EXISTS public.sync_company_entitlements();
DROP FUNCTION IF EXISTS public.trigger_rebuild_from_subscription_items();

-- 2. Funzione di Rebuild (Strict Rebuild, Nessun Guessing)
CREATE OR REPLACE FUNCTION public.rebuild_company_entitlement(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_subscription record;
    v_price_id text;
    v_plan_code text;
BEGIN
    -- STEP 1: Trova la subscription più rilevante in assoluto per l'azienda
    -- (Ordinamento Stripe-safe per priorità di status)
    SELECT *
    INTO v_subscription
    FROM stripe.subscriptions s
    WHERE (s.metadata->>'company_id')::uuid = p_company_id
    ORDER BY
        CASE
            WHEN status IN ('active','trialing') THEN 1
            WHEN status IN ('past_due') THEN 2
            ELSE 3
        END,
        created DESC
    LIMIT 1;

    -- Se non c'è NESSUNA subscription per quest'azienda
    IF v_subscription IS NULL THEN
        -- Nessuna history Stripe: l'azienda è matematicamente 'free'
        INSERT INTO public.company_entitlements (
            company_id, plan_code, billing_status, is_billing_active
        )
        VALUES (
            p_company_id, 'free', 'free', false
        )
        ON CONFLICT (company_id) DO UPDATE SET
            plan_code = EXCLUDED.plan_code,
            billing_status = EXCLUDED.billing_status,
            is_billing_active = EXCLUDED.is_billing_active,
            stripe_subscription_id = NULL,
            updated_at = now();
        RETURN;
    END IF;

    -- STEP 2: Estrazione del price via JOIN deterministico
    SELECT si.price
    INTO v_price_id
    FROM stripe.subscription_items si
    WHERE si.subscription = v_subscription.id
    ORDER BY si.created DESC
    LIMIT 1;

    -- STEP 3: Controllo Completezza Dati (Exit if Incomplete)
    -- Se il price_id è NULL, i dati Stripe non sono ancora completamente sincronizzati (race condition)
    -- Usciamo immediatamente senza scrivere nulla per non causare drift o bloccare un upgrade a metà.
    IF v_price_id IS NULL THEN
        RETURN;
    END IF;

    -- STEP 4: Mapping sicuro
    SELECT pm.plan_code
    INTO v_plan_code
    FROM public.plan_mapping pm
    WHERE pm.stripe_price_id = v_price_id;

    -- STEP 5: Scrittura Definitiva (UPSERT FULL REPLACE)
    -- Nessun merge, nessun last-known-good. Se i dati sono completi, sovrascriviamo totalmente la riga.
    INSERT INTO public.company_entitlements (
        company_id, plan_code, billing_status, is_billing_active,
        current_period_end, stripe_subscription_id, updated_at
    )
    VALUES (
        p_company_id,
        COALESCE(v_plan_code, 'free'),
        v_subscription.status,
        v_subscription.status IN ('active', 'trialing'),
        to_timestamp(v_subscription.current_period_end),
        v_subscription.id,
        now()
    )
    ON CONFLICT (company_id) DO UPDATE SET
        plan_code = EXCLUDED.plan_code,
        billing_status = EXCLUDED.billing_status,
        is_billing_active = EXCLUDED.is_billing_active,
        current_period_end = EXCLUDED.current_period_end,
        stripe_subscription_id = EXCLUDED.stripe_subscription_id,
        updated_at = now();
END;
$$;

-- 3. Singolo Trigger Dumb (Solo Subscriptions)
CREATE OR REPLACE FUNCTION public.trigger_rebuild_from_subscriptions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_company_id uuid;
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.metadata->>'company_id' IS NOT NULL THEN
            v_company_id := (OLD.metadata->>'company_id')::uuid;
            PERFORM public.rebuild_company_entitlement(v_company_id);
        END IF;
        RETURN OLD;
    ELSE
        IF NEW.metadata->>'company_id' IS NOT NULL THEN
            v_company_id := (NEW.metadata->>'company_id')::uuid;
            PERFORM public.rebuild_company_entitlement(v_company_id);
        END IF;
        RETURN NEW;
    END IF;
END;
$$;

-- Un solo aggancio pulito
CREATE TRIGGER trg_rebuild_entitlements_from_sub
AFTER INSERT OR UPDATE OR DELETE ON stripe.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.trigger_rebuild_from_subscriptions();
