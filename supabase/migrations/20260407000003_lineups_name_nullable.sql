-- The 'name' column on lineups is not used by the application and was NOT NULL,
-- causing upserts from the composition page to fail. Make it nullable.
ALTER TABLE public.lineups
  ALTER COLUMN name DROP NOT NULL;
