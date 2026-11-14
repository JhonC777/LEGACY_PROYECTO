-- Require a verified TOTP assurance level for institutional administration.
-- Public reads of published projects and published media remain available.

CREATE POLICY "require aal2 for own admin membership"
ON public.institution_admins
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING ((SELECT auth.jwt()->>'aal') = 'aal2');

CREATE POLICY "require aal2 for institution updates"
ON public.institutions
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING ((SELECT auth.jwt()->>'aal') = 'aal2')
WITH CHECK ((SELECT auth.jwt()->>'aal') = 'aal2');

CREATE POLICY "require aal2 for project inserts"
ON public.projects
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.jwt()->>'aal') = 'aal2');

CREATE POLICY "require aal2 for project updates"
ON public.projects
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING ((SELECT auth.jwt()->>'aal') = 'aal2')
WITH CHECK ((SELECT auth.jwt()->>'aal') = 'aal2');

CREATE POLICY "require aal2 for project deletes"
ON public.projects
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING ((SELECT auth.jwt()->>'aal') = 'aal2');

-- Keep other storage buckets unaffected; harden writes to the private archive bucket.
CREATE POLICY "require aal2 for archive uploads"
ON storage.objects
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (bucket_id <> 'archive' OR (SELECT auth.jwt()->>'aal') = 'aal2');

CREATE POLICY "require aal2 for archive updates"
ON storage.objects
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (bucket_id <> 'archive' OR (SELECT auth.jwt()->>'aal') = 'aal2')
WITH CHECK (bucket_id <> 'archive' OR (SELECT auth.jwt()->>'aal') = 'aal2');

CREATE POLICY "require aal2 for archive deletes"
ON storage.objects
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (bucket_id <> 'archive' OR (SELECT auth.jwt()->>'aal') = 'aal2');
