-- Lineup persistence for /composition
CREATE TABLE public.lineups (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id       uuid        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  match_id      uuid        REFERENCES public.matches(id) ON DELETE SET NULL,
  formation     text        NOT NULL DEFAULT '4-3-3',
  -- slots: ordered array of player_id|null, index = formation slot index
  slots         jsonb       NOT NULL DEFAULT '[]',
  substitute_ids jsonb      NOT NULL DEFAULT '[]',
  created_by    uuid        REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(team_id, match_id)
);

ALTER TABLE public.lineups ENABLE ROW LEVEL SECURITY;

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
