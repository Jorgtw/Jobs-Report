-- Funzione per verificare se il JWT è stato correttamente propagato al DB
CREATE OR REPLACE FUNCTION public.verify_auth_context()
RETURNS JSONB AS $$
DECLARE
  current_uid UUID;
BEGIN
  current_uid := auth.uid();
  
  IF current_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_NOT_PROPAGATED: Il database non ha ricevuto un UID valido. Verifica i JWT headers.';
  END IF;

  RETURN jsonb_build_object(
    'uid', current_uid,
    'timestamp', now(),
    'role', (SELECT role FROM public.user_roles WHERE auth_id = current_uid LIMIT 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER; -- Usiamo INVOKER per testare esattamente i permessi della sessione corrente

GRANT EXECUTE ON FUNCTION public.verify_auth_context() TO authenticated;
