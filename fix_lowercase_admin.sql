-- 1. FIX: user_roles schema check and function update
-- In case user_roles uses user_id (referencing workers.id) instead of auth_id
CREATE OR REPLACE FUNCTION public.is_global_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user_id (from workers) has the superadmin role
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.workers w ON ur.user_id = w.id
    WHERE w.auth_id = auth.uid()
    AND LOWER(ur.role::TEXT) = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ASSICURA che Jorg abbia il ruolo Superadmin nel DB
-- Troviamo l'ID del lavoratore Jorg e lo inseriamo in user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'
FROM public.workers 
WHERE auth_id = auth.uid() 
AND username ILIKE 'jorg%'
ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin';

NOTIFY pgrst, 'reload schema';
