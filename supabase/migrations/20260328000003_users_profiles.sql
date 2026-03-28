-- Users, players, coaches, team members

-- Players (profils publics, indépendants d'un compte)
CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name varchar(200) NOT NULL,
  nickname varchar(100),
  avatar_url text,
  birth_date date,                   -- verrouillé, source API
  position_preferred varchar(50),    -- modifiable par le joueur
  foot_preferred foot_preference,    -- modifiable par le joueur
  strengths_tags jsonb DEFAULT '[]', -- ex: ["Vitesse", "Jeu aérien"]
  weaknesses_tags jsonb DEFAULT '[]',
  shirt_number int,
  height_cm int,                     -- source API, verrouillé
  weight_kg int,                     -- source API, verrouillé
  external_api_id varchar(100),      -- ID côté VoetbalInBelgië
  is_claimed boolean NOT NULL DEFAULT false,
  claimed_at timestamptz,
  xp_points int NOT NULL DEFAULT 0,
  level int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Coaches (profils publics)
CREATE TABLE coaches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name varchar(200) NOT NULL,
  avatar_url text,
  license_level varchar(50),
  external_api_id varchar(100),
  is_claimed boolean NOT NULL DEFAULT false,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User profiles (extension de auth.users)
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name varchar(200),
  role user_role NOT NULL DEFAULT 'player',
  player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  coach_id uuid REFERENCES coaches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Team members (lien user <-> équipe avec rôle)
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  coach_id uuid REFERENCES coaches(id) ON DELETE SET NULL,
  role user_role NOT NULL DEFAULT 'player',
  is_fine_manager boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_member_has_profile
    CHECK (player_id IS NOT NULL OR coach_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_players_user ON players(user_id);
CREATE INDEX idx_players_claimed ON players(is_claimed);
CREATE INDEX idx_players_external ON players(external_api_id);
CREATE INDEX idx_coaches_user ON coaches(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_player ON team_members(player_id);

-- Trigger: met à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
