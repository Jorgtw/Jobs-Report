-- 1. Enable RLS su tutte le tabelle principali collegate ai lavoratori
ALTER TABLE public.internal_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 2. Rimuoviamo eventuali policy esistenti per evitare conflitti
DROP POLICY IF EXISTS "Isolate_Communications_By_Company" ON public.internal_communications;
DROP POLICY IF EXISTS "Isolate_Reports_By_Company" ON public.reports;

-- 3. Policy Isolamento: L'utente interagisce SOLO con i record della sua azienda
-- Utilizziamo direttamente una sub-query validata nel layer auth.uid()
CREATE POLICY "Isolate_Communications_By_Company"
ON public.internal_communications
FOR ALL
USING (
  company_id = (SELECT company_id FROM public.workers WHERE id = auth.uid())
);

CREATE POLICY "Isolate_Reports_By_Company"
ON public.reports
FOR ALL
USING (
  company_id = (SELECT company_id FROM public.workers WHERE id = auth.uid())
);

-- NOTA: Queste policy mettono al sicuro MK EL-TEKNIK e Acme SRL in istanti.
-- Il motore Supabase rifiuterà a livello root letture/modifiche non allineate.
