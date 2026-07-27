-- ==============================================================================
-- MIGRAZIONE SUPABASE: Aggiunta colonne estese per spese (rapportini_expenses)
-- Risolve l'errore: PGRST204 Could not find the 'billable_amount' column
-- ==============================================================================

-- 1. Aggiunta delle 4 colonne richieste dallo strato applicativo (dbService.ts)
ALTER TABLE public.rapportini_expenses
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS vat_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_billable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS billable_amount NUMERIC DEFAULT NULL;

-- 2. Aggiornamento forzato della cache dello schema di PostgREST (Supabase API)
NOTIFY pgrst, 'reload schema';
