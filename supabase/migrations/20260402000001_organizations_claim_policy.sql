-- Allow an authenticated user to "claim" an organization:
--   - UPDATE is allowed when created_by IS NULL (unclaimed VIB org)
--     or when the user already owns it.
--   - The WITH CHECK ensures created_by can only be set to the caller's uid.

CREATE POLICY "organizations_claim" ON organizations
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (created_by IS NULL OR created_by = auth.uid())
  )
  WITH CHECK (created_by = auth.uid());
