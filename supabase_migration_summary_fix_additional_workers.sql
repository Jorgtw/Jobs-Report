-- ============================================================
-- MIGRATION: Fix Project Billing RPCs to include additional workers
-- Description: The previous RPCs only summed hours from the main worker
--              (reports table) and ignored additional workers (rapportini_workers).
--              This script replaces the two RPCs to correctly union both tables
--              and calculate accurate project totals.
-- ============================================================

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
    WITH report_hours AS (
        -- Main workers
        SELECT 
            r.project_id,
            COALESCE(r.ordinary_hours, 0) AS ord,
            COALESCE(r.overtime_hours, 0) AS ext,
            COALESCE(r.festive_hours, 0) AS fst,
            COALESCE(r.night_hours, 0) AS ngt,
            COALESCE(r.total_hours, 0) AS tot
        FROM public.reports r
        WHERE r.date >= p_start_date AND r.date <= p_end_date
        
        UNION ALL
        
        -- Additional workers
        SELECT 
            r.project_id,
            COALESCE(rw.ordinary_hours, 0) AS ord,
            COALESCE(rw.overtime_hours, 0) AS ext,
            COALESCE(rw.festive_hours, 0) AS fst,
            COALESCE(rw.night_hours, 0) AS ngt,
            COALESCE(rw.hours, 0) AS tot
        FROM public.rapportini_workers rw
        JOIN public.reports r ON r.id = rw.rapportino_id
        WHERE r.date >= p_start_date AND r.date <= p_end_date
    )
    SELECT 
        p.id AS project_id,
        p.title::TEXT AS project_title,
        p.hourly_rate AS hourly_rate,
        COALESCE(SUM(h.ord), 0.00) AS total_ordinary_hours,
        COALESCE(SUM(h.ext), 0.00) AS total_overtime_hours,
        COALESCE(SUM(h.fst), 0.00) AS total_festive_hours,
        COALESCE(SUM(h.ngt), 0.00) AS total_night_hours,
        COALESCE(SUM(h.tot), 0.00) AS total_hours,
        COALESCE(SUM(h.tot * p.hourly_rate), 0.00) AS total_billed_amount
    FROM public.projects p
    LEFT JOIN report_hours h ON h.project_id = p.id
    WHERE p.company_id = p_company_id
      AND (p_client_id IS NULL OR p.client_id = p_client_id)
      AND (p_project_id IS NULL OR p.id = p_project_id)
    GROUP BY p.id, p.title, p.hourly_rate;
END;
$$;


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
    WITH report_hours AS (
        -- Main workers
        SELECT 
            r.project_id,
            COALESCE(r.ordinary_hours, 0) AS ord,
            COALESCE(r.overtime_hours, 0) AS ext,
            COALESCE(r.festive_hours, 0) AS fst,
            COALESCE(r.night_hours, 0) AS ngt,
            COALESCE(r.total_hours, 0) AS tot
        FROM public.reports r
        WHERE r.date >= p_start_date AND r.date <= p_end_date
        
        UNION ALL
        
        -- Additional workers
        SELECT 
            r.project_id,
            COALESCE(rw.ordinary_hours, 0) AS ord,
            COALESCE(rw.overtime_hours, 0) AS ext,
            COALESCE(rw.festive_hours, 0) AS fst,
            COALESCE(rw.night_hours, 0) AS ngt,
            COALESCE(rw.hours, 0) AS tot
        FROM public.rapportini_workers rw
        JOIN public.reports r ON r.id = rw.rapportino_id
        WHERE r.date >= p_start_date AND r.date <= p_end_date
    )
    SELECT 
        COALESCE(SUM(h.ord), 0.00) AS total_ordinary_hours,
        COALESCE(SUM(h.ext), 0.00) AS total_overtime_hours,
        COALESCE(SUM(h.fst), 0.00) AS total_festive_hours,
        COALESCE(SUM(h.ngt), 0.00) AS total_night_hours,
        COALESCE(SUM(h.tot), 0.00) AS total_hours,
        COALESCE(SUM(h.tot * p.hourly_rate), 0.00) AS total_billed_amount
    FROM public.projects p
    INNER JOIN report_hours h ON h.project_id = p.id
    WHERE p.company_id = p_company_id
      AND (p_client_id IS NULL OR p.client_id = p_client_id)
      AND (p_project_id IS NULL OR p.id = p_project_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_project_billing_summary(UUID, DATE, DATE, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_billing_totals(UUID, DATE, DATE, UUID, UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
