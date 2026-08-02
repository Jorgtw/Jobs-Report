-- ============================================================
-- MIGRATION: HARDENED RPC FOR COMPANY DETAILS UPDATE (V1)
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Ensure direct UPDATE policies for normal users on public.companies are removed
DROP POLICY IF EXISTS "SSOT: Companies Update" ON public.companies;
DROP POLICY IF EXISTS "SSOT: Companies Update by Admin" ON public.companies;

-- 2. Create Security Definer RPC with strict whitelist of 6 operational fields
CREATE OR REPLACE FUNCTION public.update_company_details_v1(
  p_company_id UUID,
  p_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_auth_id UUID;
  v_is_authorized BOOLEAN;
  v_result JSONB;
BEGIN
  v_caller_auth_id := auth.uid();

  -- Verify authentication
  IF v_caller_auth_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated request.' USING ERRCODE = '42501';
  END IF;

  -- Verify authorization: Caller must be Admin of target company OR SuperAdmin
  v_is_authorized := (
    public.is_admin_of_company(p_company_id)
    OR
    public.is_super_admin()
  );

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Unauthorized: User is not an Admin of target company' USING ERRCODE = '42501';
  END IF;

  -- Perform update strictly on whitelisted operational fields
  UPDATE public.companies
  SET
    name = CASE WHEN p_name IS NOT NULL AND TRIM(p_name) <> '' THEN TRIM(p_name) ELSE name END,
    email = CASE WHEN p_email IS NOT NULL THEN NULLIF(TRIM(p_email), '') ELSE email END,
    phone = CASE WHEN p_phone IS NOT NULL THEN NULLIF(TRIM(p_phone), '') ELSE phone END,
    address = CASE WHEN p_address IS NOT NULL THEN NULLIF(TRIM(p_address), '') ELSE address END,
    city = CASE WHEN p_city IS NOT NULL THEN NULLIF(TRIM(p_city), '') ELSE city END,
    country = CASE WHEN p_country IS NOT NULL THEN NULLIF(TRIM(p_country), '') ELSE country END
  WHERE id = p_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found: %', p_company_id USING ERRCODE = 'P0002';
  END IF;

  SELECT json_build_object(
    'success', true,
    'company_id', p_company_id
  )::jsonb INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execution privilege to authenticated users
GRANT EXECUTE ON FUNCTION public.update_company_details_v1(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
