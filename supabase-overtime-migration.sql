-- Script to add overtime and extra cost fields to Supabase

-- Adds overtime_hours to reports and rapportini_workers
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC DEFAULT 0;
ALTER TABLE public.rapportini_workers ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC DEFAULT 0;

-- Adds overtime and extra cost fields to workers
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS overtime_hourly_rate NUMERIC DEFAULT 0;
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS extra_cost NUMERIC DEFAULT 0;

-- Reload the schema cache in PostgREST to ensure the API sees the new columns immediately
NOTIFY pgrst, 'reload schema';
