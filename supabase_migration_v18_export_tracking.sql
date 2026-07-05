-- Migrazione v18: Tracking Leggero Esportazioni
-- Aggiunge un campo per tracciare se un rapportino è già stato esportato (PDF/Excel)
-- Sostituisce il vecchio e complesso sistema di fatturazione

ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS export_status VARCHAR(20) DEFAULT 'new';

-- Aggiorniamo eventuali record esistenti
UPDATE public.reports SET export_status = 'new' WHERE export_status IS NULL;
