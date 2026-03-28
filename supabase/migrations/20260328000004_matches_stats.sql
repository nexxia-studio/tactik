-- Matches, match stats, player badges

-- Matches
CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES seasons(id),
  opponent varchar(200) NOT NULL,
  opponent_external_id varchar(100),
  match_date timestamptz NOT NULL,
  location varchar(200),
  is_home boolean NOT NULL DEFAULT true,
  type match_type NOT NULL DEFAULT 'championship',
  status match_status NOT NULL DEFAULT 'scheduled',
  score_home int,
  score_away int,
  source match_source NOT NULL DEFAULT 'api',
  is_manual_override boolean NOT NULL DEFAULT false,
  override_reason text,
  external_api_id varchar(100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Match stats (par joueur par match)
CREATE TABLE match_stats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  goals int NOT NULL DEFAULT 0,
  assists int NOT NULL DEFAULT 0,
  yellow_cards int NOT NULL DEFAULT 0,
  red_cards int NOT NULL DEFAULT 0,
  minutes_played int NOT NULL DEFAULT 0,
  rating numeric(3,1),               -- cote 1.0 à 10.0
  source match_source NOT NULL DEFAULT 'api',
  is_manual_override boolean NOT NULL DEFAULT false,
  override_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_player_match UNIQUE (match_id, player_id),
  CONSTRAINT valid_rating CHECK (rating IS NULL OR (rating >= 1.0 AND rating <= 10.0)),
  CONSTRAINT valid_minutes CHECK (minutes_played >= 0 AND minutes_played <= 120)
);

-- Player badges (gamification)
CREATE TABLE player_badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES seasons(id),
  team_id uuid NOT NULL REFERENCES teams(id),
  badge_slug varchar(50) NOT NULL,   -- 'top_scorer', 'iron_man'...
  badge_label varchar(100) NOT NULL, -- "Meilleur buteur"
  badge_icon varchar(50),            -- slug icône ou emoji
  is_active boolean NOT NULL DEFAULT true,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_player_badge_season
    UNIQUE (player_id, season_id, team_id, badge_slug)
);

-- Indexes
CREATE INDEX idx_matches_team ON matches(team_id);
CREATE INDEX idx_matches_season ON matches(season_id);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_external ON matches(external_api_id);
CREATE INDEX idx_match_stats_match ON match_stats(match_id);
CREATE INDEX idx_match_stats_player ON match_stats(player_id);
CREATE INDEX idx_player_badges_player ON player_badges(player_id);
CREATE INDEX idx_player_badges_season ON player_badges(season_id);

-- Triggers updated_at
CREATE TRIGGER trigger_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_match_stats_updated_at
  BEFORE UPDATE ON match_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
