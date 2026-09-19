-- Run before deploying the simplified registration UI.
-- Complete optional company details while retaining the existing immutable VAT rule.
CREATE OR REPLACE FUNCTION public.complete_company_profile_v1(
  p_company_id UUID,
  p_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_vat_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vat TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT COALESCE(
    public.is_admin_of_company(p_company_id) OR public.is_super_admin(), FALSE
  ) THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;
  SELECT vat_number INTO v_vat FROM public.companies WHERE id = p_company_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found' USING ERRCODE = 'P0002';
  END IF;
  IF NULLIF(TRIM(p_vat_number), '') IS NOT NULL THEN
    IF NULLIF(TRIM(v_vat), '') IS NOT NULL AND TRIM(v_vat) <> TRIM(p_vat_number) THEN
      RAISE EXCEPTION 'COMPANY_VAT_ALREADY_SET' USING ERRCODE = '22023';
    END IF;
    UPDATE public.companies SET vat_number = TRIM(p_vat_number) WHERE id = p_company_id;
  END IF;
  -- The existing whitelist and this initial VAT assignment share one transaction.
  RETURN public.update_company_details_v1(p_company_id, p_name, p_email, p_phone, p_address, p_city, p_country);
END;
$$;
REVOKE ALL ON FUNCTION public.complete_company_profile_v1(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_company_profile_v1(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
NOTIFY pgrst, 'reload schema';
