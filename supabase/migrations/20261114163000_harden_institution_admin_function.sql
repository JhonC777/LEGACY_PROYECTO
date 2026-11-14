-- The function only needs to inspect the caller's own membership.
-- SECURITY INVOKER keeps the institution_admins RLS policy in force.
CREATE OR REPLACE FUNCTION public.is_institution_admin(inst_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $function$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.institution_admins ia
      WHERE ia.institution_id = inst_id
        AND ia.user_id = auth.uid()
    );
$function$;

-- RLS policies call this for authenticated institution administrators.
-- Do not expose it to unauthenticated callers.
REVOKE EXECUTE ON FUNCTION public.is_institution_admin(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_institution_admin(text) TO authenticated;
