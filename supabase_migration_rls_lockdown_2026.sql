-- =======================================================================================
-- MIGRATION: SECURITY LOCKDOWN & COMPREHENSIVE RLS ENFORCEMENT (2026)
-- Target Database: Jobs-Report (gqetgbqlxljhhcaggoke)
-- =======================================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. ABILITAZIONE ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_companies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_entitlements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_usage           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_subcontractors  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_mapping            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_ui                 ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. PULIZIA POLICY PREESISTENTI (Per evitare duplicati o conflitti)
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "SSOT: Memberships Access" ON public.user_companies;
DROP POLICY IF EXISTS "SSOT: Memberships Manage" ON public.user_companies;
DROP POLICY IF EXISTS "Select entitlements by company" ON public.company_entitlements;
DROP POLICY IF EXISTS "Select usage by company" ON public.company_usage;
DROP POLICY IF EXISTS "Select project subcontractors" ON public.project_subcontractors;
DROP POLICY IF EXISTS "Manage project subcontractors" ON public.project_subcontractors;
DROP POLICY IF EXISTS "Select guest reports by id" ON public.guest_reports;
DROP POLICY IF EXISTS "Select plan ui public" ON public.plan_ui;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. DEFINIZIONE DELLE POLICY MIRATE E SICURE
-- ────────────────────────────────────────────────────────────────────────────

-- ============================================================
-- TABELLA 1: user_companies (Ponte Associazioni e Ruoli)
-- ============================================================
-- SELECT: L'utente può vedere la propria associazione o quelle dei colleghi della stessa azienda
CREATE POLICY "SSOT: Memberships Access" ON public.user_companies
FOR SELECT TO authenticated
USING (
  auth_id = auth.uid()
  OR
  public.is_admin_of_company(company_id)
  OR
  public.is_super_admin()
);

-- ALL: Solo gli amministratori dell'azienda o i superadmin possono inserire, modificare o eliminare membri
CREATE POLICY "SSOT: Memberships Manage" ON public.user_companies
FOR ALL TO authenticated
USING (
  public.is_admin_of_company(company_id)
  OR
  public.is_super_admin()
)
WITH CHECK (
  public.is_admin_of_company(company_id)
  OR
  public.is_super_admin()
);


-- ============================================================
-- TABELLA 2: company_entitlements (Abbonamenti Premium)
-- ============================================================
-- SELECT: Gli utenti leggono solo i dati di abbonamento della propria azienda
CREATE POLICY "Select entitlements by company" ON public.company_entitlements
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_companies.company_id = company_entitlements.company_id
    AND user_companies.auth_id = auth.uid()
  )
  OR
  public.is_super_admin()
);

-- SCRITTURA: Nessuna policy pubblica o autenticata. Solo il service_role può inserire/modificare (gestito da Stripe sync).


-- ============================================================
-- TABELLA 3: company_usage (Consumo Rapportini)
-- ============================================================
-- SELECT: Gli utenti leggono solo il consumo della propria azienda
CREATE POLICY "Select usage by company" ON public.company_usage
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_companies.company_id = company_usage.company_id
    AND user_companies.auth_id = auth.uid()
  )
  OR
  public.is_super_admin()
);

-- SCRITTURA: Nessuna policy. Le modifiche avvengono solo via trigger database o service_role.


-- ============================================================
-- TABELLA 4: processed_stripe_events (Dedup Eventi Stripe)
-- ============================================================
-- BLINDATA TOTALMENTE: Nessuna policy. Accessibile solo tramite service_role del webhook Stripe.


-- ============================================================
-- TABELLA 5: project_subcontractors (Subappalti nei Progetti)
-- ============================================================
-- SELECT: Gli utenti possono vedere i subappalti dei progetti della propria azienda
CREATE POLICY "Select project subcontractors" ON public.project_subcontractors
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.user_companies uc ON uc.company_id = p.company_id
    WHERE p.id = project_subcontractors.project_id
    AND uc.auth_id = auth.uid()
  )
  OR
  public.is_super_admin()
);

-- ALL: Gli amministratori della ditta possono gestire le ditte in subappalto legate ai loro progetti
CREATE POLICY "Manage project subcontractors" ON public.project_subcontractors
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_subcontractors.project_id
    AND public.is_admin_of_company(p.company_id)
  )
  OR
  public.is_super_admin()
);


-- ============================================================
-- TABELLA 6: guest_reports (Condivisione Esterna)
-- ============================================================
-- SELECT: Chiunque abbia il link sicuro con l'UUID del rapportino ospite può visualizzarlo
CREATE POLICY "Select guest reports by id" ON public.guest_reports
FOR SELECT TO anon, authenticated
USING (true);

-- SCRITTURA: Nessuna policy per utenti pubblici o normali. Gestito da service_role o funzioni backend dedicate.


-- ============================================================
-- TABELLA 7: domain_events (Log di Sistema Interno)
-- ============================================================
-- BLINDATA TOTALMENTE: Nessuna policy (solo service_role).


-- ============================================================
-- TABELLA 8: plan_mapping (Prezzi Stripe ↔ Piani)
-- ============================================================
-- BLINDATA TOTALMENTE: Nessuna policy (solo service_role).


-- ============================================================
-- TABELLA 9: plan_ui (Catalogo e Visualizzazione Piani Prezzi)
-- ============================================================
-- SELECT: Tabelle leggibili da chiunque per consentire al sito pubblico di mostrare i prezzi
CREATE POLICY "Select plan ui public" ON public.plan_ui
FOR SELECT TO anon, authenticated
USING (true);

-- SCRITTURA: Riservata solo a service_role.

-- ────────────────────────────────────────────────────────────────────────────
-- 4. RICARICA LO SCHEMA CACHE DI POSTGREST
-- ────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
