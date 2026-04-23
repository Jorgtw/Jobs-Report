-- Aggiorniamo la funzione is_admin_of_company per renderla "insensibile alle maiuscole/minuscole"
-- (se il ruolo nel database era 'Admin' con la A maiuscola, prima falliva!)
CREATE OR REPLACE FUNCTION public.is_admin_of_company(target_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE auth_id = auth.uid()
    AND company_id = target_company_id
    AND LOWER(role::TEXT) IN ('admin', 'supervisor', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aggiorniamo anche l'RPC del contesto sessione per lo stesso motivo
CREATE OR REPLACE FUNCTION public.get_user_session_context(target_auth_id UUID DEFAULT NULL)
RETURNS TABLE (
  cid UUID,
  cname TEXT,
  urole TEXT,
  is_premium BOOLEAN
) AS $$
DECLARE
  uid UUID;
BEGIN
  uid := COALESCE(target_auth_id, auth.uid());
  
  RETURN QUERY
  SELECT 
    c.id as cid,
    c.name as cname,
    LOWER(uc.role::TEXT) as urole,
    c.is_premium
  FROM public.user_companies uc
  JOIN public.companies c ON uc.company_id = c.id
  WHERE uc.auth_id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';
