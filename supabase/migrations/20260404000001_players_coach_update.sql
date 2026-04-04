-- ── Fix: allow coaches to update players ──────────────────────────────────────
--
-- The players table had INSERT + DELETE policies for coaches but was missing
-- an UPDATE policy. As a result, coach edits (shirt_number, position, etc.)
-- were silently blocked by RLS — the PATCH reached Supabase but matched 0 rows.
--
-- Consistent with the existing players_coach_insert and players_coach_delete
-- policies: any authenticated coach (role='coach' in team_members) may update
-- any player record.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "players_coach_update" ON players
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
        AND role = 'coach'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
        AND role = 'coach'
    )
  );
