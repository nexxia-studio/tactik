-- Formation names like "4-3-3 offensif" exceed the original VARCHAR(10) limit.
-- Widen to unbounded TEXT so any formation key can be stored.
ALTER TABLE public.lineups
  ALTER COLUMN formation TYPE text;
