-- ============================================================
-- MIGRATION: Deterministic Access Control System - V12
-- ============================================================
-- Formal Verification Ready Architecture
-- Dimension A: Commercial State (Stripe ONLY)
-- Dimension B: Operational State (Break-Glass)
-- ============================================================

-- 1. DROP LEGACY MIXED STATE
DROP TRIGGER IF EXISTS audit_company_manual_overrides ON public.company_manual_overrides;
DROP VIEW IF EXISTS public.vw_access_control;
DROP VIEW IF EXISTS public.vw_effective_entitlements;
DROP TABLE IF EXISTS public.company_manual_overrides;

-- 2. CREATE DIMENSION B: OPERATIONAL STATE
CREATE TABLE public.company_operational_state (
    company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
    mode text NOT NULL DEFAULT 'normal' CHECK (mode IN ('normal', 'maintenance', 'emergency', 'investigation')),
    justification text,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id),
    CONSTRAINT chk_justification_required CHECK (
        (mode = 'normal') OR (mode != 'normal' AND justification IS NOT NULL AND trim(justification) <> '')
    )
);

ALTER TABLE public.company_operational_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can manage operational state" ON public.company_operational_state
FOR ALL TO authenticated
USING (public.is_global_superadmin())
WITH CHECK (public.is_global_superadmin());

CREATE POLICY "Users can read their company operational state" ON public.company_operational_state
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_companies
        WHERE user_companies.company_id = company_operational_state.company_id
        AND user_companies.auth_id = auth.uid()
    )
);

-- 3. AUDIT BOX (BLACK BOX)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_uid uuid REFERENCES auth.users(id),
    action text NOT NULL,
    target_table text NOT NULL,
    target_record_id uuid,
    payload jsonb,
    justification text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can read audit logs" ON public.admin_audit_logs
FOR SELECT TO authenticated
USING (public.is_global_superadmin());

-- 4. INVARIANT TRIGGER FOR AUDIT
CREATE OR REPLACE FUNCTION public.audit_operational_state_trigger()
RETURNS trigger AS $$
DECLARE
    v_old jsonb := NULL;
    v_new jsonb := NULL;
    v_target_id uuid;
    v_action text;
BEGIN
    -- Se non ci sono cambiamenti di mode, ignoriamo (es. update updated_at)
    IF TG_OP = 'UPDATE' AND OLD.mode = NEW.mode THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        v_new := row_to_json(NEW);
        v_target_id := NEW.company_id;
        v_action := 'OPERATIONAL_MODE_' || upper(NEW.mode);
    ELSIF TG_OP = 'UPDATE' THEN
        v_old := row_to_json(OLD);
        v_new := row_to_json(NEW);
        v_target_id := NEW.company_id;
        v_action := 'OPERATIONAL_MODE_' || upper(NEW.mode);
        
        -- Invariante logica demandata al constraint chk_justification_required
        
    ELSIF TG_OP = 'DELETE' THEN
        v_old := row_to_json(OLD);
        v_target_id := OLD.company_id;
        v_action := 'OPERATIONAL_MODE_NORMAL_IMPLICIT';
    END IF;

    INSERT INTO public.admin_audit_logs (
        admin_uid,
        action,
        target_table,
        target_record_id,
        payload,
        justification
    ) VALUES (
        auth.uid(),
        v_action,
        TG_TABLE_NAME,
        v_target_id,
        jsonb_build_object(
            'old_state', v_old,
            'new_state', v_new,
            'db_user', current_user
        ),
        COALESCE(CASE WHEN TG_OP = 'DELETE' THEN 'Deleted' ELSE NEW.justification END, 'State change')
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_company_operational_state
AFTER INSERT OR UPDATE OR DELETE ON public.company_operational_state
FOR EACH ROW EXECUTE FUNCTION public.audit_operational_state_trigger();


-- 5. RECREATE ACCESS CONTROL VIEW
-- Ora si basa SOLO sulla Dimension A (Stripe/Entitlements) per il billing, ma espone la Dimension B
CREATE OR REPLACE VIEW public.vw_access_control AS
SELECT 
    c.id AS company_id,
    c.name AS company_name,
    -- STATE (Pure Commercial Truth)
    COALESCE(e.plan_code, 'free') AS plan_code,
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
    (u.company_id IS NOT NULL) AS has_usage_record
FROM public.companies c
LEFT JOIN public.company_entitlements e ON e.company_id = c.id
LEFT JOIN public.company_operational_state o ON o.company_id = c.id
LEFT JOIN public.company_usage u ON u.company_id = c.id
LEFT JOIN public.plans p ON p.code = COALESCE(e.plan_code, 'free');

GRANT SELECT ON public.vw_access_control TO authenticated;

-- 6. REWRITE THE BILLING GATES (MATHEMATICAL MODEL - POLICY ALGEBRA)
-- Predicate 1: Pure Commercial Logic (Immune to Operational State)
CREATE OR REPLACE FUNCTION public.can_create_due_to_billing(p_company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
    SELECT COALESCE(
        (SELECT 
            (e.billing_status IN ('active', 'trialing', 'free'))
            AND
            (p.reports_limit IS NULL OR COALESCE(u.reports_count, 0) < p.reports_limit)
         FROM public.companies c
         LEFT JOIN public.company_entitlements e ON e.company_id = c.id
         LEFT JOIN public.company_usage u ON u.company_id = c.id
         LEFT JOIN public.plans p ON p.code = COALESCE(e.plan_code, 'free')
         WHERE c.id = p_company_id
        ),
        false
    );
$$;

-- Predicate 2: Pure Operational Logic (Immune to Commercial State)
-- Permission Matrix Dichiarativa
CREATE OR REPLACE FUNCTION public.can_write_in_current_mode(p_company_id uuid, p_action text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
    SELECT COALESCE(
        (SELECT 
            (mode = 'normal' AND p_action IN ('insert_report', 'update_report', 'delete_report'))
            OR
            (mode = 'emergency' AND p_action = 'insert_report')
            -- maintenance and investigation non permettono action (false)
         FROM public.company_operational_state
         WHERE company_id = p_company_id
        ),
        -- Fallback implicito: se non c'è stato, assumi normal
        (p_action IN ('insert_report', 'update_report', 'delete_report'))
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
BEGIN
    -- Extract Dimension A
    SELECT COALESCE(e.plan_code, 'free'), COALESCE(e.billing_status, 'free')
    INTO v_plan_code, v_billing_status
    FROM public.companies c
    LEFT JOIN public.company_entitlements e ON e.company_id = c.id
    WHERE c.id = p_company_id;

    IF v_plan_code IS NULL THEN RETURN false; END IF;

    -- Commercial Suspension
    IF v_billing_status NOT IN ('active', 'trialing', 'free') THEN
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

-- ============================================================
-- 7. RLS MATRIX PER LA TABELLA REPORTS
-- Separation of Concerns: Identity (Permissive) vs Billing & Ops (Restrictive)
-- ============================================================

-- A. Drop di tutte le policy legacy
DROP POLICY IF EXISTS "SSOT: Reports Insert" ON public.reports;
DROP POLICY IF EXISTS "SSOT: Reports Update" ON public.reports;
DROP POLICY IF EXISTS "SSOT: Reports Access" ON public.reports;
DROP POLICY IF EXISTS "Enforce report creation limits" ON public.reports;
DROP POLICY IF EXISTS "Users can view reports for their company" ON public.reports;
DROP POLICY IF EXISTS "Users can view their company reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view reports of their company" ON public.reports;
DROP POLICY IF EXISTS "Users: select own company reports" ON public.reports;
DROP POLICY IF EXISTS "Users: insert own company reports" ON public.reports;
DROP POLICY IF EXISTS "Users: update own company reports" ON public.reports;
DROP POLICY IF EXISTS "Users: delete own company reports" ON public.reports;
DROP POLICY IF EXISTS "Reports Access" ON public.reports;
DROP POLICY IF EXISTS "Isolate_Reports_By_Company" ON public.reports;
DROP POLICY IF EXISTS "reports_select" ON public.reports;
DROP POLICY IF EXISTS "reports_insert" ON public.reports;
DROP POLICY IF EXISTS "reports_update" ON public.reports;
DROP POLICY IF EXISTS "reports_delete" ON public.reports;
DROP POLICY IF EXISTS "Billing: Enforce Report Limits" ON public.reports;

-- B. LAYER 1: IDENTITY (PERMISSIVE)
CREATE POLICY "Identity: Access Reports" ON public.reports
FOR SELECT TO authenticated
USING (
  public.is_global_superadmin()
  OR EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_companies.company_id = reports.company_id
    AND user_companies.auth_id = auth.uid()
  )
);

CREATE POLICY "Identity: Insert Reports" ON public.reports
FOR INSERT TO authenticated
WITH CHECK (
  public.is_global_superadmin()
  OR EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_companies.company_id = reports.company_id
    AND user_companies.auth_id = auth.uid()
  )
);

CREATE POLICY "Identity: Update Reports" ON public.reports
FOR UPDATE TO authenticated
USING (
  public.is_global_superadmin()
  OR EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_companies.company_id = reports.company_id
    AND user_companies.auth_id = auth.uid()
  )
);

CREATE POLICY "Identity: Delete Reports" ON public.reports
FOR DELETE TO authenticated
USING (
  public.is_global_superadmin()
  OR EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_companies.company_id = reports.company_id
    AND user_companies.auth_id = auth.uid()
  )
);

-- C. LAYER 2: BILLING E OPERATION GATES (RESTRICTIVE ALGEBRA)
-- Dual Predicate RLS composition

CREATE POLICY "Restrictive: Insert Reports" ON public.reports
AS RESTRICTIVE 
FOR INSERT TO authenticated
WITH CHECK (
  public.can_create_due_to_billing(company_id)
  AND
  public.can_write_in_current_mode(company_id, 'insert_report')
);

CREATE POLICY "Restrictive: Update Reports" ON public.reports
AS RESTRICTIVE 
FOR UPDATE TO authenticated
USING (
  public.can_write_in_current_mode(company_id, 'update_report')
);

CREATE POLICY "Restrictive: Delete Reports" ON public.reports
AS RESTRICTIVE 
FOR DELETE TO authenticated
USING (
  public.can_write_in_current_mode(company_id, 'delete_report')
);

