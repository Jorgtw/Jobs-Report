-- ────────────────────────────────────────────────────────────────────────────
-- 1. CREAZIONE BUCKET "compliance-reports"
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('compliance-reports', 'compliance-reports', false)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. POLICY RLS PER "compliance-reports"
-- ────────────────────────────────────────────────────────────────────────────

-- RESET: Rimuovi eventuali policy esistenti per evitare conflitti
DROP POLICY IF EXISTS "Authenticated users: insert reports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users: select reports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users: delete reports" ON storage.objects;

-- INSERT: Permette l'upload solo nella cartella della propria azienda
CREATE POLICY "Authenticated users: insert reports" ON storage.objects
FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'compliance-reports' AND 
  (storage.foldername(name))[1] = (SELECT company_id::text FROM public.workers WHERE auth_id = auth.uid() LIMIT 1)
);

-- SELECT: Permette la lettura solo nella cartella della propria azienda
CREATE POLICY "Authenticated users: select reports" ON storage.objects
FOR SELECT TO authenticated 
USING (
  bucket_id = 'compliance-reports' AND 
  (storage.foldername(name))[1] = (SELECT company_id::text FROM public.workers WHERE auth_id = auth.uid() LIMIT 1)
);

-- DELETE: Permette la cancellazione solo nella cartella della propria azienda
CREATE POLICY "Authenticated users: delete reports" ON storage.objects
FOR DELETE TO authenticated 
USING (
  bucket_id = 'compliance-reports' AND 
  (storage.foldername(name))[1] = (SELECT company_id::text FROM public.workers WHERE auth_id = auth.uid() LIMIT 1)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. POLICY SUPER ADMIN
-- ────────────────────────────────────────────────────────────────────────────

-- Accesso totale a tutti i file nel bucket per i SuperAdmin
CREATE POLICY "SuperAdmin: manage all reports" ON storage.objects
FOR ALL TO authenticated 
USING (
  bucket_id = 'compliance-reports' AND 
  public.is_super_admin()
);
