-- Popolamento della tabella plan_mapping per far funzionare correttamente il trigger webhook
INSERT INTO public.plan_mapping (stripe_price_id, plan_code)
VALUES 
    -- STARTER
    ('price_1TcUsRQL4s145ccHKvia2EMG', 'starter'), -- mensile
    ('price_1TiAiXQL4s145ccHAMmazaPS', 'starter'), -- annuale
    
    -- BUSINESS (Premium)
    ('price_1TcV2XQL4s145ccH4HDSiFL3', 'business'), -- mensile
    ('price_1TiB2JQL4s145ccHy6agWlVL', 'business'), -- annuale
    
    -- GROWTH
    ('price_1TcV5wQL4s145ccHKMOV2i9G', 'growth'), -- mensile
    ('price_1TiB8FQL4s145ccHR00pxR76', 'growth')  -- annuale
ON CONFLICT (stripe_price_id) DO UPDATE 
SET plan_code = EXCLUDED.plan_code;
