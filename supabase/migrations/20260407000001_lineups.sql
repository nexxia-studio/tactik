-- lineups table already exists in DB — just add the missing substitute_ids column,
-- ensure UNIQUE constraint exists, and ensure RLS is enabled with coach policy.

-- Add substitute_ids if not already present
ALTER TABLE public.lineups
  ADD COLUMN IF NOT EXISTS substitute_ids jsonb NOT NULL DEFAULT '[]';

-- UNIQUE(team_id, match_id) — safe to run even if constraint already exists
DO $$ BEGIN
  ALTER TABLE public.lineups
    ADD CONSTRAINT lineups_team_id_match_id_key UNIQUE (team_id, match_id);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

-- Enable RLS (idempotent)
ALTER TABLE public.lineups ENABLE ROW LEVEL SECURITY;

-- Coach CRUD policy — skip if already exists
DO $$ BEGIN
  CREATE POLICY "coaches_manage_lineups"
  ON public.lineups FOR ALL TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid() AND role = 'coach'
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid() AND role = 'coach'
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
