DROP FUNCTION IF EXISTS public.get_user_session_context();
DROP FUNCTION IF EXISTS public.get_user_session_context(UUID);

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
    uc.role::TEXT as urole,
    c.is_premium
  FROM public.user_companies uc
  JOIN public.companies c ON uc.company_id = c.id
  WHERE uc.auth_id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_session_context(UUID) TO authenticated;
NOTIFY pgrst, 'reload schema';
