-- Creazione tabella expenses
CREATE TABLE IF NOT EXISTS public.rapportini_expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    rapportino_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,     -- Chi ha sostenuto la spesa (economico)
    created_by UUID REFERENCES public.workers(id) ON DELETE SET NULL,    -- Chi l'ha inserita (audit)
    type TEXT NOT NULL CHECK (type IN ('CANTIERE', 'RIMBORSO', 'KM')),
    description TEXT,
    amount NUMERIC DEFAULT 0,
    km NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraint meno opinionated: controlla solo i KM, lascia libertà su RIMBORSO/CANTIERE
    CONSTRAINT check_expense_logic CHECK (
        (type = 'KM' AND km IS NOT NULL AND km > 0) OR
        (type IN ('CANTIERE', 'RIMBORSO'))
    )
);

CREATE INDEX IF NOT EXISTS idx_rapportini_expenses_rapportino_id ON public.rapportini_expenses(rapportino_id);
CREATE INDEX IF NOT EXISTS idx_rapportini_expenses_company_id ON public.rapportini_expenses(company_id);

ALTER TABLE public.rapportini_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expenses in their companies"
    ON public.rapportini_expenses FOR SELECT
    USING (EXISTS (SELECT 1 FROM user_companies WHERE user_companies.company_id = rapportini_expenses.company_id AND user_companies.user_id = auth.uid()));

CREATE POLICY "Users can insert expenses in their companies"
    ON public.rapportini_expenses FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM user_companies WHERE user_companies.company_id = rapportini_expenses.company_id AND user_companies.user_id = auth.uid()));

CREATE POLICY "Users can update expenses in their companies"
    ON public.rapportini_expenses FOR UPDATE
    USING (EXISTS (SELECT 1 FROM user_companies WHERE user_companies.company_id = rapportini_expenses.company_id AND user_companies.user_id = auth.uid()));

CREATE POLICY "Users can delete expenses in their companies"
    ON public.rapportini_expenses FOR DELETE
    USING (EXISTS (SELECT 1 FROM user_companies WHERE user_companies.company_id = rapportini_expenses.company_id AND user_companies.user_id = auth.uid()));
