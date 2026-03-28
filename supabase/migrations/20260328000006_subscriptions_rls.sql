-- Subscriptions (Stripe) + toutes les RLS policies

-- Subscriptions
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  plan subscription_plan NOT NULL DEFAULT 'solo',
  status subscription_status NOT NULL DEFAULT 'trialing',
  license_count int NOT NULL DEFAULT 1,
  licenses_used int NOT NULL DEFAULT 0,
  stripe_customer_id varchar(100),
  stripe_subscription_id varchar(100),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_licenses CHECK (licenses_used <= license_count)
);

CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Activation RLS sur toutes les tables
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fine_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Retourne le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur est membre d'une équipe
CREATE OR REPLACE FUNCTION is_team_member(p_team_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
    AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur est coach d'une équipe
CREATE OR REPLACE FUNCTION is_team_coach(p_team_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
    AND user_id = auth.uid()
    AND role = 'coach'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur est fine_manager d'une équipe
CREATE OR REPLACE FUNCTION is_fine_manager(p_team_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
    AND user_id = auth.uid()
    AND (role = 'coach' OR is_fine_manager = true)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur est club_admin
CREATE OR REPLACE FUNCTION is_club_admin(p_organization_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN team_members tm ON tm.user_id = up.id
    JOIN teams t ON t.id = tm.team_id
    WHERE up.id = auth.uid()
    AND t.organization_id = p_organization_id
    AND tm.role = 'club_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- POLICIES — DONNÉES PUBLIQUES
-- ============================================================

-- Sports: lecture publique
CREATE POLICY "sports_public_read" ON sports
  FOR SELECT USING (true);

-- Seasons: lecture publique
CREATE POLICY "seasons_public_read" ON seasons
  FOR SELECT USING (true);

-- Organizations: lecture publique
CREATE POLICY "organizations_public_read" ON organizations
  FOR SELECT USING (true);

-- Teams: lecture publique
CREATE POLICY "teams_public_read" ON teams
  FOR SELECT USING (true);

-- Players: lecture publique
CREATE POLICY "players_public_read" ON players
  FOR SELECT USING (true);

-- Coaches: lecture publique
CREATE POLICY "coaches_public_read" ON coaches
  FOR SELECT USING (true);

-- Matches: lecture publique saison en cours
CREATE POLICY "matches_public_read_current" ON matches
  FOR SELECT USING (
    season_id IN (
      SELECT id FROM seasons WHERE is_current = true
    )
  );

-- Matches: lecture historique pour utilisateurs connectés
CREATE POLICY "matches_auth_read_history" ON matches
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Match stats: lecture publique saison en cours
CREATE POLICY "match_stats_public_read_current" ON match_stats
  FOR SELECT USING (
    match_id IN (
      SELECT m.id FROM matches m
      JOIN seasons s ON s.id = m.season_id
      WHERE s.is_current = true
    )
  );

-- Match stats: lecture historique connectés
CREATE POLICY "match_stats_auth_read_history" ON match_stats
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Player badges: lecture publique
CREATE POLICY "player_badges_public_read" ON player_badges
  FOR SELECT USING (true);

-- Forum posts: lecture publique
CREATE POLICY "forum_posts_public_read" ON forum_posts
  FOR SELECT USING (true);

-- Forum replies: lecture publique
CREATE POLICY "forum_replies_public_read" ON forum_replies
  FOR SELECT USING (true);

-- Drills publics: lecture publique
CREATE POLICY "drills_public_read" ON drills
  FOR SELECT USING (is_public = true);

-- ============================================================
-- POLICIES — PROFILS UTILISATEURS
-- ============================================================

-- User profiles: lecture de son propre profil
CREATE POLICY "user_profiles_own_read" ON user_profiles
  FOR SELECT USING (id = auth.uid());

-- User profiles: mise à jour de son propre profil
CREATE POLICY "user_profiles_own_update" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

-- User profiles: création à l'inscription
CREATE POLICY "user_profiles_own_insert" ON user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Players: mise à jour de son propre profil revendiqué
CREATE POLICY "players_own_update" ON players
  FOR UPDATE USING (user_id = auth.uid() AND is_claimed = true)
  WITH CHECK (user_id = auth.uid());

-- Coaches: mise à jour de son propre profil revendiqué
CREATE POLICY "coaches_own_update" ON coaches
  FOR UPDATE USING (user_id = auth.uid() AND is_claimed = true)
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- POLICIES — ERP COACH
-- ============================================================

-- Trainings: lecture membres de l'équipe
CREATE POLICY "trainings_team_read" ON trainings
  FOR SELECT USING (is_team_member(team_id));

-- Trainings: écriture coach uniquement
CREATE POLICY "trainings_coach_write" ON trainings
  FOR ALL USING (is_team_coach(team_id));

-- Training drills: lecture membres
CREATE POLICY "training_drills_team_read" ON training_drills
  FOR SELECT USING (
    training_id IN (
      SELECT id FROM trainings WHERE is_team_member(team_id)
    )
  );

-- Training drills: écriture coach
CREATE POLICY "training_drills_coach_write" ON training_drills
  FOR ALL USING (
    training_id IN (
      SELECT id FROM trainings WHERE is_team_coach(team_id)
    )
  );

-- Training attendance: lecture membres
CREATE POLICY "training_attendance_team_read" ON training_attendance
  FOR SELECT USING (
    training_id IN (
      SELECT id FROM trainings WHERE is_team_member(team_id)
    )
  );

-- Training attendance: écriture coach
CREATE POLICY "training_attendance_coach_write" ON training_attendance
  FOR ALL USING (
    training_id IN (
      SELECT id FROM trainings WHERE is_team_coach(team_id)
    )
  );

-- Drills privés: lecture coach propriétaire
CREATE POLICY "drills_own_read" ON drills
  FOR SELECT USING (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  );

-- Drills: écriture coach propriétaire
CREATE POLICY "drills_own_write" ON drills
  FOR ALL USING (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  );

-- Events: lecture membres
CREATE POLICY "events_team_read" ON events
  FOR SELECT USING (is_team_member(team_id));

-- Events: écriture coach
CREATE POLICY "events_coach_write" ON events
  FOR ALL USING (is_team_coach(team_id));

-- ============================================================
-- POLICIES — AMENDES & TRÉSORERIE
-- ============================================================

-- Fine rules: lecture membres
CREATE POLICY "fine_rules_team_read" ON fine_rules
  FOR SELECT USING (is_team_member(team_id));

-- Fine rules: écriture fine_manager ou coach
CREATE POLICY "fine_rules_manager_write" ON fine_rules
  FOR ALL USING (is_fine_manager(team_id));

-- Fines: lecture membres
CREATE POLICY "fines_team_read" ON fines
  FOR SELECT USING (is_team_member(team_id));

-- Fines: écriture fine_manager ou coach
CREATE POLICY "fines_manager_write" ON fines
  FOR ALL USING (is_fine_manager(team_id));

-- Team treasury: lecture membres
CREATE POLICY "treasury_team_read" ON team_treasury
  FOR SELECT USING (is_team_member(team_id));

-- Team treasury: écriture fine_manager ou coach
CREATE POLICY "treasury_manager_write" ON team_treasury
  FOR ALL USING (is_fine_manager(team_id));

-- Treasury expenses: lecture membres
CREATE POLICY "treasury_expenses_team_read" ON treasury_expenses
  FOR SELECT USING (is_team_member(team_id));

-- Treasury expenses: écriture fine_manager ou coach
CREATE POLICY "treasury_expenses_manager_write" ON treasury_expenses
  FOR ALL USING (is_fine_manager(team_id));

-- ============================================================
-- POLICIES — ABONNEMENTS
-- ============================================================

-- Subscriptions: lecture club_admin uniquement
CREATE POLICY "subscriptions_admin_read" ON subscriptions
  FOR SELECT USING (is_club_admin(organization_id));

-- Subscriptions: mise à jour via service_role uniquement (Stripe webhook)
-- Pas de policy INSERT/UPDATE pour les users — géré par Edge Function

-- ============================================================
-- POLICIES — FORUM
-- ============================================================

-- Forum posts: écriture utilisateurs connectés
CREATE POLICY "forum_posts_auth_write" ON forum_posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Forum posts: mise à jour auteur uniquement
CREATE POLICY "forum_posts_own_update" ON forum_posts
  FOR UPDATE USING (user_id = auth.uid());

-- Forum replies: écriture utilisateurs connectés
CREATE POLICY "forum_replies_auth_write" ON forum_replies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Forum replies: mise à jour auteur uniquement
CREATE POLICY "forum_replies_own_update" ON forum_replies
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- TEAM MEMBERS
-- ============================================================

-- Team members: lecture membres de la même équipe
CREATE POLICY "team_members_team_read" ON team_members
  FOR SELECT USING (is_team_member(team_id));

-- Team members: gestion par coach ou club_admin
CREATE POLICY "team_members_coach_write" ON team_members
  FOR ALL USING (is_team_coach(team_id));
