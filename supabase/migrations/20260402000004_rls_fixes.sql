-- ============================================================
-- RLS audit fixes — 2026-04-02
-- Corrige les 3 trous critiques et 4 manques mineurs identifiés.
-- ============================================================

-- ── 1. matches : coaches peuvent gérer les matchs de leur équipe ──────────────

-- INSERT : un match ne peut être créé que pour une équipe dont on est coach
CREATE POLICY "matches_coach_insert" ON matches
  FOR INSERT WITH CHECK (is_team_coach(team_id));

-- UPDATE : même restriction — les matchs VIB (source='api') sont modifiables
--          pour encoder un score ou corriger un statut
CREATE POLICY "matches_coach_update" ON matches
  FOR UPDATE USING (is_team_coach(team_id));

-- DELETE : uniquement les matchs créés manuellement (source='manual')
--          Cohérent avec le check canDelete() côté frontend
CREATE POLICY "matches_coach_delete" ON matches
  FOR DELETE USING (
    is_team_coach(team_id)
    AND source = 'manual'
  );

-- ── 2. match_stats : coaches gèrent les stats de leurs matchs ────────────────

CREATE POLICY "match_stats_coach_write" ON match_stats
  FOR ALL USING (
    match_id IN (
      SELECT id FROM matches WHERE is_team_coach(team_id)
    )
  );

-- ── 3. teams : INSERT pour les membres d'une organisation ────────────────────
-- Permet à un user de créer une équipe dans l'org à laquelle il est rattaché
-- (onboarding/team + ajout d'équipes secondaires)

CREATE POLICY "teams_org_member_insert" ON teams
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM user_profiles
      WHERE id = auth.uid()
        AND organization_id IS NOT NULL
    )
  );

-- ── 4. players : coaches peuvent ajouter/supprimer des joueurs ───────────────

-- INSERT : un coach peut ajouter un joueur à son organisation
CREATE POLICY "players_coach_insert" ON players
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT t.organization_id
      FROM teams t
      WHERE is_team_coach(t.id)
    )
  );

-- DELETE : même scope
CREATE POLICY "players_coach_delete" ON players
  FOR DELETE USING (
    organization_id IN (
      SELECT t.organization_id
      FROM teams t
      WHERE is_team_coach(t.id)
    )
  );

-- ── 5. coaches : auto-insertion à la création du profil ──────────────────────

CREATE POLICY "coaches_own_insert" ON coaches
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ── 6. forum : suppression de ses propres messages ───────────────────────────

CREATE POLICY "forum_posts_own_delete" ON forum_posts
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "forum_replies_own_delete" ON forum_replies
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- NOTE — organizations UPDATE (non corrigé, décision produit)
-- La policy "organizations_claim" (migration 20260402000001) permet à
-- l'owner d'une org de modifier n'importe quelle colonne (name, logo,
-- external_api_id…). Elle est intentionnellement permissive pour
-- laisser les coaches personnaliser leur club.
-- Si cela devient un problème, restreindre via une vue RLS ou une
-- colonne-level security séparée.
-- ============================================================
