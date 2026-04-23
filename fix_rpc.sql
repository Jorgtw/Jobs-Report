CREATE OR REPLACE FUNCTION public.get_user_session_context_v2(target_auth_id UUID DEFAULT NULL)
RETURNS TABLE (cid UUID, cname TEXT, urole public.app_role, is_premium BOOLEAN) AS $$
DECLARE
  uid UUID;
BEGIN
  uid := COALESCE(target_auth_id, auth.uid());
  RETURN QUERY
  SELECT 
    c.id as cid,
    c.name as cname,
    uc.role as urole,
    c.is_premium
  FROM public.user_companies uc
  JOIN public.companies c ON uc.company_id = c.id
  WHERE uc.auth_id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
