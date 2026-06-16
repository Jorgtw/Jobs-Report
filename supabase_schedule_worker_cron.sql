-- ============================================================
-- SCHEDULING: Stripe Worker via pg_cron & pg_net
-- ============================================================
-- Schedula la chiamata HTTPS alla Edge Function `stripe-worker`
-- ogni 1 minuto per processare in batch la coda degli eventi.
-- ============================================================

-- Assicurati che le estensioni necessarie siano abilitate nel progetto Supabase:
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedula il job (ogni minuto)
-- NOTA: Sostituisci <TUO_PROJECT_REF> e <TUO_ANON_KEY> con i valori reali del tuo progetto.
SELECT cron.schedule(
    'invoke-stripe-worker',
    '* * * * *',
    $$
    SELECT net.http_post(
        url := 'https://gqetgbqlxljhhcaggoke.supabase.co/functions/v1/stripe-worker',
        headers := '{"Authorization": "Bearer sb_publishable_-VutZPQsHpnFTEEjizkGSw_vRAmuVvd"}'::jsonb,
        timeout_milliseconds := 5000
    );
    $$
);
