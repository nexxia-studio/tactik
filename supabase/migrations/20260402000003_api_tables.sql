-- ── api_cache : stocke les réponses brutes VIB avec TTL adaptatif ────────────
CREATE TABLE api_cache (
  endpoint    varchar(500) PRIMARY KEY,
  data        jsonb        NOT NULL,
  fetched_at  timestamptz  NOT NULL DEFAULT now(),
  ttl_minutes int          NOT NULL DEFAULT 60
);

-- ── api_competitions : compétitions à synchroniser ───────────────────────────
CREATE TABLE api_competitions (
  id           uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         varchar(200) NOT NULL,
  api_endpoint varchar(500) NOT NULL UNIQUE,
  sport_slug   sport_slug   NOT NULL DEFAULT 'football',
  division     varchar(100),
  is_active    boolean      NOT NULL DEFAULT true,
  created_at   timestamptz  NOT NULL DEFAULT now()
);

-- ── matches.external_api_id : contrainte UNIQUE nécessaire pour upsert ───────
-- (NULL est autorisé plusieurs fois, donc les matchs manuels sans external_api_id
--  ne sont pas affectés)
ALTER TABLE matches
  ADD CONSTRAINT matches_external_api_id_uq UNIQUE (external_api_id);

-- ── Seed : P1 / P2C / P3D Liège 2025/2026 ────────────────────────────────────
INSERT INTO api_competitions (name, api_endpoint, sport_slug, division) VALUES
  (
    '1e provinciale Luik',
    'https://api.voetbalinbelgie.be/competitions/471/',
    'football',
    '1e provinciale, Luik, Mannen'
  ),
  (
    '2e provinciale C Luik',
    'https://api.voetbalinbelgie.be/competitions/474/',
    'football',
    '2e provinciale C, Luik, Mannen'
  ),
  (
    '3e provinciale D Luik',
    'https://api.voetbalinbelgie.be/competitions/478/',
    'football',
    '3e provinciale D, Luik, Mannen'
  );

-- ── RLS : api_cache et api_competitions lisibles publiquement ─────────────────
ALTER TABLE api_cache        ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_cache_public_read" ON api_cache
  FOR SELECT USING (true);

CREATE POLICY "api_competitions_public_read" ON api_competitions
  FOR SELECT USING (true);

-- ── Cron : à exécuter manuellement dans Supabase SQL Editor ──────────────────
-- Remplacer <PROJECT_URL> et <SERVICE_ROLE_KEY> par les valeurs du projet.
--
-- SELECT cron.schedule(
--   'import-vib-matches',
--   '*/15 * * * *',
--   $$
--   SELECT net.http_post(
--     url     := '<PROJECT_URL>/functions/v1/import-matches',
--     headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb,
--     body    := '{}'::jsonb
--   );
--   $$
-- );
