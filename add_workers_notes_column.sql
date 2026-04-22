-- Aggiunta della colonna per le note interne alla tabella workers
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS internal_note TEXT;

-- Commento per chiarezza
COMMENT ON COLUMN public.workers.internal_note IS 'Note amministrative e personali del lavoratore';
