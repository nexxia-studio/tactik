-- Extended player profile fields
-- strengths_tags / weaknesses_tags : jsonb arrays of string labels (max 3 each)
-- position_alternative_1/2 : secondary positions

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS strengths_tags        jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS weaknesses_tags       jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS position_alternative_1 text,
  ADD COLUMN IF NOT EXISTS position_alternative_2 text;
