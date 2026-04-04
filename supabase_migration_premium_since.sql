-- ============================================================
-- MIGRATION: Add premium_since and updated_at to companies
-- ============================================================

-- 1. Add premium_since column
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS premium_since TIMESTAMP WITH TIME ZONE;

-- 2. Add last_activity_at column (useful for "Active this week" stats)
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 3. Initialize premium_since for existing Premium companies
UPDATE public.companies 
SET premium_since = created_at 
WHERE is_premium = TRUE AND premium_since IS NULL;

-- 4. Create or Replace function for automatic updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Add updated_at if not exists and attach trigger
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'updated_at') THEN
    ALTER TABLE public.companies ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_companies_updated_at ON public.companies;
CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Verify
SELECT id, name, is_premium, premium_since, created_at, last_activity_at FROM public.companies LIMIT 10;
