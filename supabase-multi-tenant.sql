-- Script to upgrade database schema for Multi-Tenancy

-- 1. Create companies table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    vat_number TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Add company_id to existing tables (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workers' AND column_name='company_id') THEN
        ALTER TABLE public.workers ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='company_id') THEN
        ALTER TABLE public.clients ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='company_id') THEN
        ALTER TABLE public.projects ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subcontractors' AND column_name='company_id') THEN
        ALTER TABLE public.subcontractors ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reports' AND column_name='company_id') THEN
        ALTER TABLE public.reports ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Update existing data to have a default company
DO $$
DECLARE
    default_company_id UUID;
BEGIN
    -- Check if a company exists
    SELECT id INTO default_company_id FROM public.companies LIMIT 1;
    
    -- If no company exists, create a default one
    IF default_company_id IS NULL THEN
        INSERT INTO public.companies (name) VALUES ('La Tua Ditta Principale') RETURNING id INTO default_company_id;
    END IF;

    -- Update all tables where company_id is null
    UPDATE public.workers SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE public.clients SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE public.projects SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE public.subcontractors SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE public.reports SET company_id = default_company_id WHERE company_id IS NULL;
    
    -- 4. After filling existing rows, make the columns NOT NULL to enforce it for future rows
    -- Uncomment after running step 3 if you are sure:
    -- ALTER TABLE public.workers ALTER COLUMN company_id SET NOT NULL;
    -- ALTER TABLE public.clients ALTER COLUMN company_id SET NOT NULL;
    -- ALTER TABLE public.projects ALTER COLUMN company_id SET NOT NULL;
    -- ALTER TABLE public.subcontractors ALTER COLUMN company_id SET NOT NULL;
    -- ALTER TABLE public.reports ALTER COLUMN company_id SET NOT NULL;
END $$;

-- 5. Create user_roles table for superadmin authorization
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES public.workers(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('superadmin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on user_roles (Optional, but good practice)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read roles (or at least their own, but reading all is often needed for admin checks)
DROP POLICY IF EXISTS "Enable read access for authenticated users on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for all users on user_roles" ON public.user_roles;
CREATE POLICY "Enable read access for all users on user_roles"
    ON public.user_roles FOR SELECT
    USING (true);

-- (To actually grant superadmin privileges, you will need to manually insert a row into user_roles linking your worker id to 'superadmin')

