ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS setup_step INTEGER DEFAULT 0;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS setup_error TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS setup_failed_at TIMESTAMPTZ;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_companies_auth_id_company_id_key') THEN
        ALTER TABLE public.user_companies ADD CONSTRAINT user_companies_auth_id_company_id_key UNIQUE (auth_id, company_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workers_auth_id_company_id_key') THEN
        ALTER TABLE public.workers ADD CONSTRAINT workers_auth_id_company_id_key UNIQUE (auth_id, company_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_company_id_name_key') THEN
        ALTER TABLE public.clients ADD CONSTRAINT clients_company_id_name_key UNIQUE (company_id, name);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_company_id_title_key') THEN
        ALTER TABLE public.projects ADD CONSTRAINT projects_company_id_title_key UNIQUE (company_id, title);
    END IF;
END $$;
