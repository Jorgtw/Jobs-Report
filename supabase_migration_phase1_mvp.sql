-- Fase 1: Vincoli UNIQUE per MVP
-- Questo script previene i doppi inserimenti a livello di database.
-- I duplicati precedenti sono già stati rimossi.

BEGIN;

-- Partita IVA
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_vat_number_key;
ALTER TABLE public.companies ADD CONSTRAINT companies_vat_number_key UNIQUE (vat_number);

-- Username Worker
ALTER TABLE public.workers DROP CONSTRAINT IF EXISTS workers_username_key;
ALTER TABLE public.workers ADD CONSTRAINT workers_username_key UNIQUE (username);

COMMIT;
