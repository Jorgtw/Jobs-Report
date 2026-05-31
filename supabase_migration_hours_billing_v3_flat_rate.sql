-- ============================================================
-- MIGRATION: Jobs-Report Flat-Rate Hours & Billing (V3)
-- Description: Refactored idempotent script using database RPCs
--              to avoid frontend double calculations and
--              fragile Supabase nested filters.
--              Includes Two-RPC architecture:
--              1) get_project_billing_summary (project rows only)
--              2) get_project_billing_totals (global aggregates only)
-- ============================================================

-- 1. Ensure hourly_rate exists on projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00;

-- 2. Ensure all 4 categories of hours exist on reports (rapportini)
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS ordinary_hours NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS festive_hours  NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS night_hours    NUMERIC(5, 2) NOT NULL DEFAULT 0.00;

-- 3. Add CHECK constraints to prevent negative hours
DO $$
BEGIN
    -- Constraint for ordinary_hours
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_reports_ordinary_hours_positive') THEN
        ALTER TABLE public.reports ADD CONSTRAINT chk_reports_ordinary_hours_positive CHECK (ordinary_hours >= 0);
    END IF;
    
    -- Constraint for overtime_hours
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_reports_overtime_hours_positive') THEN
        ALTER TABLE public.reports ADD CONSTRAINT chk_reports_overtime_hours_positive CHECK (overtime_hours >= 0);
    END IF;

    -- Constraint for festive_hours
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_reports_festive_hours_positive') THEN
        ALTER TABLE public.reports ADD CONSTRAINT chk_reports_festive_hours_positive CHECK (festive_hours >= 0);
    END IF;

    -- Constraint for night_hours
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_reports_night_hours_positive') THEN
        ALTER TABLE public.reports ADD CONSTRAINT chk_reports_night_hours_positive CHECK (night_hours >= 0);
    END IF;
END $$;

-- 4. Ensure travel notes and work description columns exist
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS travel_notes TEXT,
ADD COLUMN IF NOT EXISTS work_description TEXT;

-- 5. Ensure indexes are present to optimize monthly and project-based queries
CREATE INDEX IF NOT EXISTS idx_reports_project_date ON public.reports(project_id, date);
CREATE INDEX IF NOT EXISTS idx_reports_company_id ON public.reports(company_id);

-- ============================================================
-- LAYER 2: SERVICE LAYER / DATABASE FUNCTIONS (RPC)
-- This performs 100% of calculations and filtering on the server.
-- ============================================================

-- 1. PROJECT-LEVEL BILLING SUMMARY (ONLY projects list, NO union totals, NO null records)
CREATE OR REPLACE FUNCTION public.get_project_billing_summary(
    p_company_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_client_id UUID DEFAULT NULL,
    p_project_id UUID DEFAULT NULL
)
RETURNS TABLE (
    project_id UUID,
    project_title TEXT,
    hourly_rate NUMERIC,
    total_ordinary_hours NUMERIC,
    total_overtime_hours NUMERIC,
    total_festive_hours NUMERIC,
    total_night_hours NUMERIC,
    total_hours NUMERIC,
    total_billed_amount NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS project_id,
        p.title::TEXT AS project_title,
        p.hourly_rate AS hourly_rate,
        COALESCE(SUM(r.ordinary_hours), 0.00) AS total_ordinary_hours,
        COALESCE(SUM(r.overtime_hours), 0.00) AS total_overtime_hours,
        COALESCE(SUM(r.festive_hours), 0.00) AS total_festive_hours,
        COALESCE(SUM(r.night_hours), 0.00) AS total_night_hours,
        COALESCE(SUM(r.ordinary_hours + r.overtime_hours + r.festive_hours + r.night_hours), 0.00) AS total_hours,
        COALESCE(SUM(r.ordinary_hours + r.overtime_hours + r.festive_hours + r.night_hours), 0.00) * p.hourly_rate AS total_billed_amount
    FROM public.projects p
    LEFT JOIN public.reports r ON r.project_id = p.id AND r.date >= p_start_date AND r.date <= p_end_date
    WHERE p.company_id = p_company_id
      AND (p_client_id IS NULL OR p.client_id = p_client_id)
      AND (p_project_id IS NULL OR p.id = p_project_id)
    GROUP BY p.id, p.title, p.hourly_rate;
END;
$$;

-- 2. GLOBAL BILLING TOTALS (Returns a single row representing consolidated totals)
CREATE OR REPLACE FUNCTION public.get_project_billing_totals(
    p_company_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_client_id UUID DEFAULT NULL,
    p_project_id UUID DEFAULT NULL
)
RETURNS TABLE (
    total_ordinary_hours NUMERIC,
    total_overtime_hours NUMERIC,
    total_festive_hours NUMERIC,
    total_night_hours NUMERIC,
    total_hours NUMERIC,
    total_billed_amount NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(r.ordinary_hours), 0.00) AS total_ordinary_hours,
        COALESCE(SUM(r.overtime_hours), 0.00) AS total_overtime_hours,
        COALESCE(SUM(r.festive_hours), 0.00) AS total_festive_hours,
        COALESCE(SUM(r.night_hours), 0.00) AS total_night_hours,
        COALESCE(SUM(r.ordinary_hours + r.overtime_hours + r.festive_hours + r.night_hours), 0.00) AS total_hours,
        COALESCE(SUM((r.ordinary_hours + r.overtime_hours + r.festive_hours + r.night_hours) * p.hourly_rate), 0.00) AS total_billed_amount
    FROM public.projects p
    INNER JOIN public.reports r ON r.project_id = p.id AND r.date >= p_start_date AND r.date <= p_end_date
    WHERE p.company_id = p_company_id
      AND (p_client_id IS NULL OR p.client_id = p_client_id)
      AND (p_project_id IS NULL OR p.id = p_project_id);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_project_billing_summary(UUID, DATE, DATE, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_billing_totals(UUID, DATE, DATE, UUID, UUID) TO authenticated;

-- Notify PostgREST to reload schema and expose updates instantly
NOTIFY pgrst, 'reload schema';
