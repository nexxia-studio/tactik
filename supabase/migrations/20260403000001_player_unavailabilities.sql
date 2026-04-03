-- player_unavailabilities
-- Tracks periods when a player is unavailable (injury, vacation, personal, other).
-- Used by /presence to auto-mark unavailable players and by /joueurs player sheet.

CREATE TABLE public.player_unavailabilities (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id   uuid        NOT NULL REFERENCES public.players(id)    ON DELETE CASCADE,
  team_id     uuid        NOT NULL REFERENCES public.teams(id)      ON DELETE CASCADE,
  start_date  date        NOT NULL,
  end_date    date        NOT NULL,
  reason      text        NOT NULL CHECK (reason IN ('injury', 'vacation', 'personal', 'other')),
  notes       text,
  created_by  uuid        REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now(),

  CONSTRAINT end_after_start CHECK (end_date >= start_date)
);

ALTER TABLE public.player_unavailabilities ENABLE ROW LEVEL SECURITY;

-- Coaches can manage unavailabilities for their team's players
CREATE POLICY "coaches_manage_unavailabilities"
  ON public.player_unavailabilities
  FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid()
        AND role = 'coach'
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid()
        AND role = 'coach'
    )
  );

-- Index for fast lookup by player (used in presence page active-unavailability check)
CREATE INDEX player_unavailabilities_player_id_idx
  ON public.player_unavailabilities(player_id);

-- Index for date-range queries (active unavailabilities today)
CREATE INDEX player_unavailabilities_dates_idx
  ON public.player_unavailabilities(start_date, end_date);
