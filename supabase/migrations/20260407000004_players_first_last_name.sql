-- Add first_name and last_name columns to players table.
-- full_name is kept for VIB-imported players that have no first/last split.

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name  text;

-- Migrate existing data: split full_name on the first space
UPDATE public.players
SET
  first_name = CASE
    WHEN position(' ' IN full_name) > 0
    THEN split_part(full_name, ' ', 1)
    ELSE full_name
  END,
  last_name = CASE
    WHEN position(' ' IN full_name) > 0
    THEN substring(full_name FROM position(' ' IN full_name) + 1)
    ELSE ''
  END
WHERE first_name IS NULL;
