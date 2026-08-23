-- ==============================================================================
-- MIGRATION: V18 - ALLINEAMENTO PIANI E CONTROLLO SERVER-SIDE LIMITE UTENTI
-- ==============================================================================
-- Questa migrazione implementa la nuova struttura commerciale di Jobs-Report:
-- 1. Parità funzionale: tutti i piani hanno rapportini illimitati (NULL) e tutte
--    le feature operative abilitate (Compliance, Foto/Firma, Comunicazioni).
-- 2. Limite commerciale basato unicamente sul numero di utenti attivi (server-side).
--
-- NOTA IMPORTANTE:
-- I limiti utenti definiti nel CASE (5, 10, 50, 150) devono rimanere sincronizzati 
-- con il catalogo client in "src/utils/pricingConfig.ts".
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ALLINEAMENTO PIANI: RAPPORTINI ILLIMITATI E FEATURE OPERATIVE ATTIVE
-- ------------------------------------------------------------------------------
-- Manteniamo invariata la policy RLS "Enforce report creation limits" e la funzione
-- can_company_create_report(), che interpreta nativamente "reports_limit = NULL"
-- come assenza di limiti di inserimento.

UPDATE public.plans 
SET reports_limit = NULL, 
    has_compliance = TRUE, 
    has_communications = TRUE, 
    has_multiworker = TRUE;

INSERT INTO public.plans (code, name, reports_limit, has_compliance, has_communications, has_multiworker)
VALUES 
    ('free', 'Free', NULL, TRUE, TRUE, TRUE),
    ('starter', 'Starter', NULL, TRUE, TRUE, TRUE),
    ('business', 'Business', NULL, TRUE, TRUE, TRUE),
    ('growth', 'Growth', NULL, TRUE, TRUE, TRUE),
    ('enterprise', 'Enterprise', NULL, TRUE, TRUE, TRUE)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    reports_limit = NULL,
    has_compliance = TRUE,
    has_communications = TRUE,
    has_multiworker = TRUE;

-- ------------------------------------------------------------------------------
-- 2. FUNZIONE TRIGGER: CONTROLLO SERVER-SIDE LIMITE UTENTI ATTIVI
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_company_worker_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_should_check BOOLEAN := false;
    v_plan_code TEXT;
    v_max_users INT;
    v_active_count INT;
BEGIN
    -- Determina se il controllo deve essere eseguito:
    -- A. In fase di INSERT di un lavoratore attivo e interno (non subappaltatore)
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'active' AND NEW.subcontractor_id IS NULL THEN
            v_should_check := true;
        END IF;
    -- B. In fase di UPDATE quando il record diventa o passa ad essere un lavoratore interno attivo conteggiabile:
    --    - transizione da inattivo ad attivo (OLD.status IS DISTINCT FROM 'active')
    --    - transizione da subappaltatore a lavoratore interno (OLD.subcontractor_id IS NOT NULL)
    --    - cambio di azienda (OLD.company_id IS DISTINCT FROM NEW.company_id)
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status = 'active' AND NEW.subcontractor_id IS NULL AND (
            OLD.status IS DISTINCT FROM 'active'
            OR OLD.subcontractor_id IS NOT NULL
            OR OLD.company_id IS DISTINCT FROM NEW.company_id
        ) THEN
            v_should_check := true;
        END IF;
    END IF;

    -- Se non è un'attivazione/creazione di utente interno, consenti sempre l'operazione
    -- (modifiche anagrafiche, cambi di tariffa, note, disattivazioni passano sempre senza blocco)
    IF NOT v_should_check THEN
        RETURN NEW;
    END IF;

    -- Se company_id non è valorizzato, lascia passare (verrà validato da altri vincoli)
    IF NEW.company_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Ottiene il piano effettivo dell'azienda tramite la funzione canonica
    -- (gestisce Stripe, grace period, commercial override e fallback 'free')
    SELECT effective_plan_code INTO v_plan_code
    FROM public.fn_get_company_access(NEW.company_id);

    v_plan_code := COALESCE(v_plan_code, 'free');

    -- Risolve il limite massimo di utenti per il piano
    -- Sincronizzato con src/utils/pricingConfig.ts
    CASE v_plan_code
        WHEN 'free' THEN v_max_users := 5;
        WHEN 'starter' THEN v_max_users := 10;
        WHEN 'basic' THEN v_max_users := 10;
        WHEN 'business' THEN v_max_users := 50;
        WHEN 'premium' THEN v_max_users := 50;
        WHEN 'pro' THEN v_max_users := 50;
        WHEN 'growth' THEN v_max_users := 150;
        WHEN 'enterprise' THEN v_max_users := NULL; -- Nessun limite pratico
        ELSE v_max_users := 5;
    END CASE;

    -- Se il piano non ha limiti (Enterprise), consenti l'inserimento
    IF v_max_users IS NULL THEN
        RETURN NEW;
    END IF;

    -- Conta gli utenti interni attualmente attivi per l'azienda
    -- (Admin, Supervisor e Operator interni; esclude subappaltatori e inattivi)
    SELECT count(*) INTO v_active_count
    FROM public.workers
    WHERE company_id = NEW.company_id
      AND status = 'active'
      AND subcontractor_id IS NULL;

    -- Blocca solo se il numero di utenti attivi ha già raggiunto o superato il limite consentito
    IF v_active_count >= v_max_users THEN
        RAISE EXCEPTION 'USER_LIMIT_REACHED: Il piano % consente un massimo di % utenti attivi.', v_plan_code, v_max_users
            USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. TRIGGER SU PUBLIC.WORKERS
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_check_company_worker_limit ON public.workers;

CREATE TRIGGER trg_check_company_worker_limit
    BEFORE INSERT OR UPDATE ON public.workers
    FOR EACH ROW
    EXECUTE FUNCTION public.check_company_worker_limit();

-- ------------------------------------------------------------------------------
-- 4. RICARICA SCHEMA POSTGREST
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
