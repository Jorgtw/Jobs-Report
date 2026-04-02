-- =======================================================================================
-- MIGRATION: SUPABASE AUTH & ROW LEVEL SECURITY (RLS)
-- Eseguire nell'SQL Editor di Supabase come singolo blocco.
-- SICURO: non cancella nessun dato esistente.
-- =======================================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- SEZIONE 1: SCHEMA — Aggiungi auth_id alla tabella workers
-- ────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workers' AND column_name = 'auth_id'
    ) THEN
        ALTER TABLE public.workers 
          ADD COLUMN auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        ALTER TABLE public.workers 
          ADD CONSTRAINT uk_workers_auth_id UNIQUE (auth_id);
    END IF;
END $$;


-- ────────────────────────────────────────────────────────────────────────────
-- SEZIONE 2: FUNZIONI HELPER (SECURITY DEFINER = eseguono come admin, bypass RLS)
-- ────────────────────────────────────────────────────────────────────────────

-- Ritorna la company_id dell'utente loggato cercando tramite auth_id
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.workers WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;


-- Durante il login: converte username → email per Supabase Auth signInWithPassword()
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT email INTO v_email 
    FROM public.workers 
    WHERE username = p_username AND status = 'active' 
    LIMIT 1;
    RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Verifica se l'utente loggato è un super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (
      SELECT id FROM public.workers WHERE auth_id = auth.uid() LIMIT 1
    ) AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ────────────────────────────────────────────────────────────────────────────
-- SEZIONE 3: ABILITAZIONE RLS SU TUTTE LE TABELLE
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.companies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractors   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapportini_workers ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────────────────────
-- SEZIONE 4: POLICY RLS PER UTENTI NORMALI
-- Ogni policy limita l'accesso ai soli record della company dell'utente loggato.
-- ────────────────────────────────────────────────────────────────────────────

-- COMPANIES: legge solo la propria azienda
CREATE POLICY "Users: view own company" ON public.companies 
  FOR SELECT USING (id = public.get_user_company_id());


-- WORKERS: legge solo i colleghi della propria company (o se stesso)
CREATE POLICY "Users: view own company workers" ON public.workers 
  FOR SELECT USING (
    company_id = public.get_user_company_id() 
    OR auth_id = auth.uid()
  );

CREATE POLICY "Users: update own profile" ON public.workers 
  FOR UPDATE USING (auth_id = auth.uid());


-- REPORTS (Rapportini): CRUD completo sulla propria company
CREATE POLICY "Users: select own company reports" ON public.reports 
  FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Users: insert own company reports" ON public.reports 
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users: update own company reports" ON public.reports 
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "Users: delete own company reports" ON public.reports 
  FOR DELETE USING (company_id = public.get_user_company_id());


-- CLIENTS, PROJECTS, SUBCONTRACTORS: CRUD completo sulla propria company
CREATE POLICY "Users: manage own company clients" ON public.clients 
  FOR ALL USING (company_id = public.get_user_company_id());

CREATE POLICY "Users: manage own company projects" ON public.projects 
  FOR ALL USING (company_id = public.get_user_company_id());

CREATE POLICY "Users: manage own company subcontractors" ON public.subcontractors 
  FOR ALL USING (company_id = public.get_user_company_id());


-- RAPPORTINI_WORKERS: join tramite rapportino_id per trovare la company
CREATE POLICY "Users: manage rapportini workers" ON public.rapportini_workers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.reports r 
      WHERE r.id = rapportini_workers.rapportino_id 
        AND r.company_id = public.get_user_company_id()
    )
  );


-- ────────────────────────────────────────────────────────────────────────────
-- SEZIONE 5: POLICY SUPER ADMIN — accesso illimitato a tutto il DB
-- ────────────────────────────────────────────────────────────────────────────

CREATE POLICY "SuperAdmin: all companies"         ON public.companies         FOR ALL USING (public.is_super_admin());
CREATE POLICY "SuperAdmin: all workers"           ON public.workers           FOR ALL USING (public.is_super_admin());
CREATE POLICY "SuperAdmin: all clients"           ON public.clients           FOR ALL USING (public.is_super_admin());
CREATE POLICY "SuperAdmin: all projects"          ON public.projects          FOR ALL USING (public.is_super_admin());
CREATE POLICY "SuperAdmin: all subcontractors"    ON public.subcontractors    FOR ALL USING (public.is_super_admin());
CREATE POLICY "SuperAdmin: all reports"           ON public.reports           FOR ALL USING (public.is_super_admin());
CREATE POLICY "SuperAdmin: all rapportini"        ON public.rapportini_workers FOR ALL USING (public.is_super_admin());

-- USER ROLES: permette di leggere il proprio ruolo (necessario per il login) e ai SuperAdmin di vedere tutto
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users: view own role" ON public.user_roles 
  FOR SELECT TO authenticated USING (
    user_id = (SELECT id FROM public.workers WHERE auth_id = auth.uid() LIMIT 1)
  );
CREATE POLICY "SuperAdmin: all roles" ON public.user_roles FOR ALL USING (public.is_super_admin());


-- ────────────────────────────────────────────────────────────────────────────
-- SEZIONE 6: VERIFICA (query di controllo — non modifica nulla)
-- ────────────────────────────────────────────────────────────────────────────

SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
