-- ==============================================================================
-- JOBS REPORT: RLS DEFINITIVE PER LA TABELLA WORKERS (CASO 1 ARCHITETTURALE)
-- ==============================================================================
-- Questo script ufficializza la separazione tra:
-- - workers: Dominio Operativo Puro (SSOT del personale fisico)
-- - user_companies: ACL / Dominio di Accesso (SSOT permessi di login)
-- ==============================================================================

-- 1. Pulizia preventiva: Rimuoviamo vecchie policy potenzialmente ricorsive o ibride
DROP POLICY IF EXISTS "SSOT: Workers Update" ON public.workers;
DROP POLICY IF EXISTS "SSOT: Workers Access" ON public.workers;
DROP POLICY IF EXISTS "workers_self" ON public.workers;
DROP POLICY IF EXISTS "workers_super" ON public.workers;

DROP POLICY IF EXISTS "Users can view workers in their companies" ON public.workers;
DROP POLICY IF EXISTS "Users can insert workers in their companies" ON public.workers;
DROP POLICY IF EXISTS "Users can update workers in their companies" ON public.workers;
DROP POLICY IF EXISTS "Users can delete workers in their companies" ON public.workers;
DROP POLICY IF EXISTS "Enable read access for users in same company" ON public.workers;
DROP POLICY IF EXISTS "Enable insert for users in same company" ON public.workers;
DROP POLICY IF EXISTS "Enable update for users in same company" ON public.workers;
DROP POLICY IF EXISTS "Enable delete for users in same company" ON public.workers;

-- Rimuoviamo anche eventuali versioni precedenti di queste nuove policy
DROP POLICY IF EXISTS "workers_select_by_company_access" ON public.workers;
DROP POLICY IF EXISTS "workers_insert_by_company_access" ON public.workers;
DROP POLICY IF EXISTS "workers_update_by_company_access" ON public.workers;
DROP POLICY IF EXISTS "workers_delete_by_company_access" ON public.workers;

-- 2. Abilitiamo RLS (nel caso fosse stato disabilitato per debug)
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- 3. FUNZIONI DI SUPPORTO ACL (Cuore dell'architettura)

-- 3A. Verifica appartenenza (Membership)
CREATE OR REPLACE FUNCTION public.has_company_access(company uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_companies uc
    WHERE uc.auth_id = auth.uid()
      AND uc.company_id = company
  );
$$;

-- 3B. Verifica permesso operativo (Authorization)
CREATE OR REPLACE FUNCTION public.has_company_role(company uuid, required_role text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_companies uc
    WHERE uc.auth_id = auth.uid()
      AND uc.company_id = company
      AND uc.role::text = required_role
  );
$$;

-- ==============================================================================
-- 4. APPLICAZIONE POLICY
-- ==============================================================================

-- SELECT (Lettura: vedi solo i workers delle aziende che puoi gestire)
CREATE POLICY "workers_select_by_company_access"
ON public.workers
FOR SELECT
USING (
  public.has_company_access(company_id)
);

-- INSERT (Creazione: puoi aggiungere personale solo nelle aziende di cui sei ADMIN)
CREATE POLICY "workers_insert_by_company_access"
ON public.workers
FOR INSERT
WITH CHECK (
  public.has_company_role(company_id, 'admin')
);

-- UPDATE (Modifica: puoi modificare personale solo nelle aziende di cui sei ADMIN)
CREATE POLICY "workers_update_by_company_access"
ON public.workers
FOR UPDATE
USING (
  public.has_company_role(company_id, 'admin')
)
WITH CHECK (
  public.has_company_role(company_id, 'admin')
);

-- DELETE (Eliminazione: puoi eliminare personale solo nelle aziende di cui sei ADMIN)
CREATE POLICY "workers_delete_by_company_access"
ON public.workers
FOR DELETE
USING (
  public.has_company_role(company_id, 'admin')
);

-- ==============================================================================
-- 5. POLICY GLOBALE (Superadmin Bypass Auditabile)
-- ==============================================================================
-- Policy separate per garantire auditability sulle singole operazioni (CRUD).

-- SUPERADMIN SELECT
CREATE POLICY "workers_superadmin_select"
ON public.workers
FOR SELECT
USING (
  public.is_super_admin()
);

-- SUPERADMIN INSERT
CREATE POLICY "workers_superadmin_insert"
ON public.workers
FOR INSERT
WITH CHECK (
  public.is_super_admin()
);

-- SUPERADMIN UPDATE
CREATE POLICY "workers_superadmin_update"
ON public.workers
FOR UPDATE
USING (
  public.is_super_admin()
)
WITH CHECK (
  public.is_super_admin()
);

-- SUPERADMIN DELETE
CREATE POLICY "workers_superadmin_delete"
ON public.workers
FOR DELETE
USING (
  public.is_super_admin()
);

-- 6. Ottimizzazione Indici
-- Ci assicuriamo che l'indice cruciale per la funzione di ACL sia presente per massimizzare le performance
CREATE INDEX IF NOT EXISTS idx_user_companies_auth_company 
ON public.user_companies (auth_id, company_id);

-- Fine Script
