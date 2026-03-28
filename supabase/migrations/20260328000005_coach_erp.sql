-- Trainings, drills, fines, treasury, events, forum

-- Drills (exercices d'entraînement)
CREATE TABLE drills (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id uuid NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  title varchar(200) NOT NULL,
  description text,
  source_url text,
  source_type drill_source_type NOT NULL DEFAULT 'manual',
  is_public boolean NOT NULL DEFAULT false,
  sport_slug sport_slug NOT NULL DEFAULT 'football',
  thumbnail_url text,
  duration_minutes int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trainings (séances d'entraînement)
CREATE TABLE trainings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES seasons(id),
  scheduled_at timestamptz NOT NULL,
  location varchar(200),
  status varchar(20) NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Training drills (exercices dans une séance, ordonnés)
CREATE TABLE training_drills (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_id uuid NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  drill_id uuid NOT NULL REFERENCES drills(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,   -- ordre dans la séance
  phase training_phase NOT NULL DEFAULT 'warmup',
  duration_minutes int,
  notes text,
  CONSTRAINT unique_drill_position UNIQUE (training_id, position)
);

-- Training attendance (présences)
CREATE TABLE training_attendance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_id uuid NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status attendance_status NOT NULL DEFAULT 'present',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_player_training UNIQUE (training_id, player_id)
);

-- Events (activités extra-sportives)
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  title varchar(200) NOT NULL,
  type varchar(50) NOT NULL DEFAULT 'other', -- 'team_outing', 'friendly', 'other'
  scheduled_at timestamptz NOT NULL,
  location varchar(200),
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Fine rules (liste des amendes et tarifs)
CREATE TABLE fine_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  label varchar(200) NOT NULL,       -- "Retard entraînement"
  amount numeric(8,2) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Fines (amendes individuelles)
CREATE TABLE fines (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  fine_rule_id uuid REFERENCES fine_rules(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  reason varchar(200) NOT NULL,
  amount numeric(8,2) NOT NULL,
  is_paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Team treasury (cagnotte de l'équipe)
CREATE TABLE team_treasury (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE UNIQUE,
  total_collected numeric(10,2) NOT NULL DEFAULT 0,
  total_spent numeric(10,2) NOT NULL DEFAULT 0,
  season_goal text,                  -- "Souper de fin de saison"
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Treasury expenses (dépenses de la cagnotte)
CREATE TABLE treasury_expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  label varchar(200) NOT NULL,
  amount numeric(8,2) NOT NULL,
  spent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Forum posts
CREATE TABLE forum_posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title varchar(300) NOT NULL,
  body text NOT NULL,
  category forum_category NOT NULL DEFAULT 'general',
  sport_slug sport_slug NOT NULL DEFAULT 'football',
  metadata jsonb DEFAULT '{}',       -- données structurées selon catégorie
  is_pinned boolean NOT NULL DEFAULT false,
  is_closed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Forum replies
CREATE TABLE forum_replies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_drills_coach ON drills(coach_id);
CREATE INDEX idx_drills_public ON drills(is_public) WHERE is_public = true;
CREATE INDEX idx_trainings_team ON trainings(team_id);
CREATE INDEX idx_trainings_scheduled ON trainings(scheduled_at);
CREATE INDEX idx_training_drills_training ON training_drills(training_id);
CREATE INDEX idx_training_attendance_training ON training_attendance(training_id);
CREATE INDEX idx_training_attendance_player ON training_attendance(player_id);
CREATE INDEX idx_fines_team ON fines(team_id);
CREATE INDEX idx_fines_player ON fines(player_id);
CREATE INDEX idx_fines_paid ON fines(is_paid);
CREATE INDEX idx_fine_rules_team ON fine_rules(team_id);
CREATE INDEX idx_forum_posts_category ON forum_posts(category);
CREATE INDEX idx_forum_posts_sport ON forum_posts(sport_slug);
CREATE INDEX idx_forum_replies_post ON forum_replies(post_id);

-- Triggers updated_at
CREATE TRIGGER trigger_drills_updated_at
  BEFORE UPDATE ON drills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_trainings_updated_at
  BEFORE UPDATE ON trainings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_forum_posts_updated_at
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_forum_replies_updated_at
  BEFORE UPDATE ON forum_replies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: recalcule total_collected quand une amende est payée
CREATE OR REPLACE FUNCTION update_treasury_on_fine_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_paid = true AND OLD.is_paid = false THEN
    INSERT INTO team_treasury (team_id, total_collected)
    VALUES (NEW.team_id, NEW.amount)
    ON CONFLICT (team_id) DO UPDATE
    SET total_collected = team_treasury.total_collected + NEW.amount,
        updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fine_paid_treasury
  AFTER UPDATE ON fines
  FOR EACH ROW EXECUTE FUNCTION update_treasury_on_fine_paid();

-- Trigger: recalcule total_spent quand une dépense est ajoutée
CREATE OR REPLACE FUNCTION update_treasury_on_expense()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team_treasury (team_id, total_spent)
  VALUES (NEW.team_id, NEW.amount)
  ON CONFLICT (team_id) DO UPDATE
  SET total_spent = team_treasury.total_spent + NEW.amount,
      updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expense_treasury
  AFTER INSERT ON treasury_expenses
  FOR EACH ROW EXECUTE FUNCTION update_treasury_on_expense();
