-- Core tables: sports, seasons, organizations, teams

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sports
CREATE TABLE sports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(100) NOT NULL,
  slug sport_slug NOT NULL UNIQUE,
  color_hex varchar(7) NOT NULL DEFAULT '#000000',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seasons
CREATE TABLE seasons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  label varchar(20) NOT NULL,        -- ex: "2024-2025"
  start_date date NOT NULL,
  end_date date NOT NULL,
  sport_slug sport_slug NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Organizations (clubs)
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(200) NOT NULL,
  short_name varchar(50),
  city varchar(100),
  logo_url text,
  sport_id uuid NOT NULL REFERENCES sports(id),
  division varchar(100),
  external_api_id varchar(100),      -- ID côté VoetbalInBelgië
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Teams
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES seasons(id),
  name varchar(200) NOT NULL,
  category varchar(50),              -- "Première équipe", "U21"...
  external_api_id varchar(100),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_teams_organization ON teams(organization_id);
CREATE INDEX idx_teams_season ON teams(season_id);
CREATE INDEX idx_organizations_sport ON organizations(sport_id);
CREATE INDEX idx_seasons_sport ON seasons(sport_slug);
CREATE INDEX idx_seasons_current ON seasons(is_current) WHERE is_current = true;

-- Seed data: football sport
INSERT INTO sports (name, slug, color_hex)
VALUES ('Football', 'football', '#16a34a');
