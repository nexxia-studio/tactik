-- Core ENUM types used across the schema

CREATE TYPE sport_slug AS ENUM (
  'football',
  'rugby',
  'basketball',
  'volleyball'
);

CREATE TYPE user_role AS ENUM (
  'player',
  'coach',
  'fine_manager',
  'club_admin',
  'super_admin'
);

CREATE TYPE match_type AS ENUM (
  'championship',
  'friendly',
  'cup'
);

CREATE TYPE match_status AS ENUM (
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'postponed'
);

CREATE TYPE match_source AS ENUM (
  'api',
  'manual',
  'friendly'
);

CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent',
  'excused',
  'late'
);

CREATE TYPE training_phase AS ENUM (
  'warmup',
  'tactical',
  'technical',
  'scrimmage',
  'cooldown'
);

CREATE TYPE drill_source_type AS ENUM (
  'youtube',
  'tiktok',
  'manual',
  'other'
);

CREATE TYPE subscription_plan AS ENUM (
  'solo',
  'club'
);

CREATE TYPE subscription_status AS ENUM (
  'active',
  'cancelled',
  'past_due',
  'trialing'
);

CREATE TYPE foot_preference AS ENUM (
  'left',
  'right',
  'both'
);

CREATE TYPE forum_category AS ENUM (
  'friendly_matches',
  'drills',
  'transfers',
  'general'
);
