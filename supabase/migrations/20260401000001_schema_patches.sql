-- Schema patches: align DB with frontend requirements
-- All ALTER TABLE use IF NOT EXISTS / IF EXISTS for idempotency

-- ── user_profiles: onboarding flow columns ──────────────────────────────────
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

-- ── organizations: track who created the club ───────────────────────────────
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── organizations: sport_id optional (onboarding defaults to football) ───────
ALTER TABLE organizations
  ALTER COLUMN sport_id DROP NOT NULL;

-- ── teams: season_id optional (team can exist before season is assigned) ─────
ALTER TABLE teams
  ALTER COLUMN season_id DROP NOT NULL;

-- ── RLS: user can read other profiles of teammates ──────────────────────────
-- (needed for displaying team roster with user data)
CREATE POLICY "user_profiles_teammates_read" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm1
      JOIN team_members tm2 ON tm2.team_id = tm1.team_id
      WHERE tm1.user_id = auth.uid()
        AND tm2.user_id = user_profiles.id
    )
  );
