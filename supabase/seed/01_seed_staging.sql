-- Correction UUID sport football
DO $$
DECLARE
  v_sport_id uuid := 'e8452cc5-62e5-44e5-9a5e-87a3b1618ea2';
  v_season_id uuid := 'a1b2c3d4-0000-0000-0000-000000000002';
BEGIN

-- Saison
INSERT INTO seasons (id, label, start_date, end_date, sport_slug, is_current)
VALUES (v_season_id, '2024-2025', '2024-08-01', '2025-06-30', 'football', true)
ON CONFLICT (id) DO NOTHING;

-- Organisations
INSERT INTO organizations (id, name, short_name, city, sport_id, division, external_api_id)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000010', 'RFC Xhoffraix',   'XHOFF', 'Xhoffraix',   v_sport_id, 'Liège 2C', 'xhoffraix-001'),
  ('a1b2c3d4-0000-0000-0000-000000000011', 'FC Welkenraedt',  'WELK',  'Welkenraedt', v_sport_id, 'Liège 2C', 'welkenraedt-001'),
  ('a1b2c3d4-0000-0000-0000-000000000012', 'RFC Baelen',      'BAEL',  'Baelen',      v_sport_id, 'Liège 2C', 'baelen-001'),
  ('a1b2c3d4-0000-0000-0000-000000000013', 'US Malmedy',      'MALM',  'Malmedy',     v_sport_id, 'Liège 2C', 'malmedy-001'),
  ('a1b2c3d4-0000-0000-0000-000000000014', 'FC Spa',          'SPA',   'Spa',         v_sport_id, 'Liège 2C', 'spa-001'),
  ('a1b2c3d4-0000-0000-0000-000000000015', 'RFC Stavelot',    'STAV',  'Stavelot',    v_sport_id, 'Liège 2C', 'stavelot-001'),
  ('a1b2c3d4-0000-0000-0000-000000000016', 'US Thimister',    'THIM',  'Thimister',   v_sport_id, 'Liège 2C', 'thimister-001'),
  ('a1b2c3d4-0000-0000-0000-000000000017', 'FC Battice',      'BATT',  'Battice',     v_sport_id, 'Liège 2C', 'battice-001');

-- Equipes
INSERT INTO teams (id, organization_id, season_id, name, category)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000010', v_season_id, 'RFC Xhoffraix A',  'Première équipe'),
  ('a1b2c3d4-0000-0000-0000-000000000021', 'a1b2c3d4-0000-0000-0000-000000000011', v_season_id, 'FC Welkenraedt A', 'Première équipe'),
  ('a1b2c3d4-0000-0000-0000-000000000022', 'a1b2c3d4-0000-0000-0000-000000000012', v_season_id, 'RFC Baelen A',     'Première équipe'),
  ('a1b2c3d4-0000-0000-0000-000000000023', 'a1b2c3d4-0000-0000-0000-000000000013', v_season_id, 'US Malmedy A',     'Première équipe'),
  ('a1b2c3d4-0000-0000-0000-000000000024', 'a1b2c3d4-0000-0000-0000-000000000014', v_season_id, 'FC Spa A',         'Première équipe'),
  ('a1b2c3d4-0000-0000-0000-000000000025', 'a1b2c3d4-0000-0000-0000-000000000015', v_season_id, 'RFC Stavelot A',   'Première équipe'),
  ('a1b2c3d4-0000-0000-0000-000000000026', 'a1b2c3d4-0000-0000-0000-000000000016', v_season_id, 'US Thimister A',   'Première équipe'),
  ('a1b2c3d4-0000-0000-0000-000000000027', 'a1b2c3d4-0000-0000-0000-000000000017', v_season_id, 'FC Battice A',     'Première équipe');

-- Joueurs RFC Xhoffraix
INSERT INTO players (id, full_name, nickname, birth_date, position_preferred, foot_preferred, shirt_number, height_cm, weight_kg, external_api_id, is_claimed)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000030', 'Antoine Monie',      'Toto', '1991-03-03', 'Center back',          'right', 28, 189, 81, 'monie-001',     false),
  ('a1b2c3d4-0000-0000-0000-000000000031', 'Lucas Renard',        NULL,   '1995-06-15', 'Goalkeeper',           'right',  1, 185, 78, 'renard-001',    false),
  ('a1b2c3d4-0000-0000-0000-000000000032', 'Mathieu Dupont',      NULL,   '1998-02-20', 'Right back',           'right',  2, 178, 72, 'dupont-001',    false),
  ('a1b2c3d4-0000-0000-0000-000000000033', 'Kevin Lambert',       NULL,   '1993-09-10', 'Center back',          'left',   5, 182, 79, 'lambert-001',   false),
  ('a1b2c3d4-0000-0000-0000-000000000034', 'Thomas Lejeune',      NULL,   '1997-04-25', 'Left back',            'left',   3, 176, 70, 'lejeune-001',   false),
  ('a1b2c3d4-0000-0000-0000-000000000035', 'Nicolas Pirard',      NULL,   '1994-11-08', 'Defensive midfielder', 'right',  6, 180, 75, 'pirard-001',    false),
  ('a1b2c3d4-0000-0000-0000-000000000036', 'Julien Bastin',       NULL,   '1996-07-30', 'Central midfielder',   'right',  8, 177, 73, 'bastin-001',    false),
  ('a1b2c3d4-0000-0000-0000-000000000037', 'Sébastien Collin',    NULL,   '1999-01-14', 'Central midfielder',   'both',  10, 174, 68, 'collin-001',    false),
  ('a1b2c3d4-0000-0000-0000-000000000038', 'Maxime Gilles',       NULL,   '2000-05-22', 'Right winger',         'right',  7, 172, 66, 'gilles-001',    false),
  ('a1b2c3d4-0000-0000-0000-000000000039', 'Dylan Houben',        NULL,   '1992-08-17', 'Left winger',          'left',  11, 173, 67, 'houben-001',    false),
  ('a1b2c3d4-0000-0000-0000-000000000040', 'Romain Fastré',       NULL,   '1995-12-03', 'Striker',              'right',  9, 181, 77, 'fastre-001',    false),
  ('a1b2c3d4-0000-0000-0000-000000000041', 'Alexis Warnier',      NULL,   '2001-03-19', 'Striker',              'left',  19, 179, 74, 'warnier-001',   false),
  ('a1b2c3d4-0000-0000-0000-000000000042', 'Pierre Xhonneux',     NULL,   '1990-10-05', 'Goalkeeper',           'right', 16, 188, 83, 'xhonneux-001',  false),
  ('a1b2c3d4-0000-0000-0000-000000000043', 'Florian Bodeux',      NULL,   '1998-06-28', 'Right back',           'right',  4, 175, 71, 'bodeux-001',    false),
  ('a1b2c3d4-0000-0000-0000-000000000044', 'Christophe Masson',   NULL,   '1993-02-11', 'Defensive midfielder', 'right', 14, 183, 80, 'masson-001',    false),
  ('a1b2c3d4-0000-0000-0000-000000000045', 'Guillaume Paquay',    NULL,   '2002-09-07', 'Central midfielder',   'right', 15, 176, 69, 'paquay-001',    false),
  ('a1b2c3d4-0000-0000-0000-000000000046', 'Adrien Charlier',     NULL,   '1996-04-16', 'Left winger',          'left',  17, 171, 65, 'charlier-001',  false),
  ('a1b2c3d4-0000-0000-0000-000000000047', 'Nathan Dethier',      NULL,   '2003-07-24', 'Striker',              'right', 18, 178, 72, 'dethier-001',   false);

-- Coach
INSERT INTO coaches (id, full_name, license_level, external_api_id, is_claimed)
VALUES ('a1b2c3d4-0000-0000-0000-000000000050', 'Marc Lecomte', 'UEFA B', 'lecomte-001', false);

-- Team members
INSERT INTO team_members (team_id, player_id, coach_id, role)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000020', NULL, 'a1b2c3d4-0000-0000-0000-000000000050', 'coach'),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000030', NULL, 'player'),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000031', NULL, 'player'),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000032', NULL, 'player'),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000033', NULL, 'player'),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000034', NULL, 'player'),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000035', NULL, 'player'),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000036', NULL, 'player'),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000037', NULL, 'player'),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000038', NULL, 'player'),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000039', NULL, 'player'),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000040', NULL, 'player'),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000041', NULL, 'player'),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000042', NULL, 'player'),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000043', NULL, 'player'),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000044', NULL, 'player'),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000045', NULL, 'player'),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000046', NULL, 'player'),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000047', NULL, 'player');

-- Matchs
INSERT INTO matches (id, team_id, season_id, opponent, is_home, type, status, score_home, score_away, match_date, source)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000060', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, 'FC Welkenraedt', true,  'championship', 'completed', 3, 1, '2024-09-07 15:00:00+02', 'api'),
  ('a1b2c3d4-0000-0000-0000-000000000061', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, 'RFC Baelen',     false, 'championship', 'completed', 1, 1, '2024-09-14 15:00:00+02', 'api'),
  ('a1b2c3d4-0000-0000-0000-000000000062', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, 'US Malmedy',     true,  'championship', 'completed', 2, 0, '2024-09-21 15:00:00+02', 'api'),
  ('a1b2c3d4-0000-0000-0000-000000000063', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, 'FC Spa',         false, 'championship', 'completed', 0, 2, '2024-09-28 15:00:00+02', 'api'),
  ('a1b2c3d4-0000-0000-0000-000000000064', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, 'RFC Stavelot',   true,  'championship', 'completed', 4, 2, '2024-10-05 15:00:00+02', 'api'),
  ('a1b2c3d4-0000-0000-0000-000000000065', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, 'US Thimister',   false, 'championship', 'completed', 1, 3, '2024-10-12 15:00:00+02', 'api'),
  ('a1b2c3d4-0000-0000-0000-000000000066', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, 'FC Battice',     true,  'championship', 'completed', 2, 2, '2024-10-19 15:00:00+02', 'api'),
  ('a1b2c3d4-0000-0000-0000-000000000067', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, 'FC Welkenraedt', false, 'championship', 'completed', 2, 1, '2024-11-09 15:00:00+01', 'api'),
  ('a1b2c3d4-0000-0000-0000-000000000068', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, 'RFC Baelen',     true,  'championship', 'completed', 3, 0, '2024-11-16 15:00:00+01', 'api'),
  ('a1b2c3d4-0000-0000-0000-000000000069', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, 'US Malmedy',     false, 'championship', 'completed', 1, 1, '2024-11-23 15:00:00+01', 'api'),
  ('a1b2c3d4-0000-0000-0000-000000000070', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, 'FC Spa',         true,  'championship', 'completed', 3, 1, '2024-12-07 15:00:00+01', 'api'),
  ('a1b2c3d4-0000-0000-0000-000000000071', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, 'RFC Stavelot',   false, 'championship', 'completed', 0, 0, '2025-01-18 15:00:00+01', 'api'),
  ('a1b2c3d4-0000-0000-0000-000000000072', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, 'US Thimister',   true,  'championship', 'completed', 5, 1, '2025-01-25 15:00:00+01', 'api'),
  ('a1b2c3d4-0000-0000-0000-000000000073', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, 'FC Battice',     false, 'championship', 'scheduled', NULL, NULL, '2025-02-08 15:00:00+01', 'api'),
  ('a1b2c3d4-0000-0000-0000-000000000074', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, 'FC Welkenraedt', true,  'friendly',     'completed', 4, 0, '2024-08-17 15:00:00+02', 'manual');

-- Stats joueurs
INSERT INTO match_stats (match_id, player_id, goals, assists, yellow_cards, red_cards, minutes_played, rating, source)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000060', 'a1b2c3d4-0000-0000-0000-000000000030', 0, 1, 0, 0, 90, 7.5, 'manual'),
  ('a1b2c3d4-0000-0000-0000-000000000060', 'a1b2c3d4-0000-0000-0000-000000000040', 2, 0, 0, 0, 90, 8.5, 'manual'),
  ('a1b2c3d4-0000-0000-0000-000000000060', 'a1b2c3d4-0000-0000-0000-000000000037', 1, 1, 0, 0, 85, 8.0, 'manual'),
  ('a1b2c3d4-0000-0000-0000-000000000060', 'a1b2c3d4-0000-0000-0000-000000000035', 0, 0, 1, 0, 90, 6.5, 'manual'),
  ('a1b2c3d4-0000-0000-0000-000000000060', 'a1b2c3d4-0000-0000-0000-000000000031', 0, 0, 0, 0, 90, 7.0, 'manual'),
  ('a1b2c3d4-0000-0000-0000-000000000062', 'a1b2c3d4-0000-0000-0000-000000000030', 1, 0, 0, 0, 90, 8.0, 'manual'),
  ('a1b2c3d4-0000-0000-0000-000000000062', 'a1b2c3d4-0000-0000-0000-000000000041', 1, 0, 0, 0, 78, 7.5, 'manual'),
  ('a1b2c3d4-0000-0000-0000-000000000062', 'a1b2c3d4-0000-0000-0000-000000000036', 0, 1, 0, 0, 90, 7.0, 'manual'),
  ('a1b2c3d4-0000-0000-0000-000000000062', 'a1b2c3d4-0000-0000-0000-000000000031', 0, 0, 0, 0, 90, 8.5, 'manual'),
  ('a1b2c3d4-0000-0000-0000-000000000064', 'a1b2c3d4-0000-0000-0000-000000000040', 2, 1, 0, 0, 90, 9.0, 'manual'),
  ('a1b2c3d4-0000-0000-0000-000000000064', 'a1b2c3d4-0000-0000-0000-000000000037', 1, 0, 1, 0, 90, 7.0, 'manual'),
  ('a1b2c3d4-0000-0000-0000-000000000064', 'a1b2c3d4-0000-0000-0000-000000000038', 1, 1, 0, 0, 82, 8.0, 'manual'),
  ('a1b2c3d4-0000-0000-0000-000000000064', 'a1b2c3d4-0000-0000-0000-000000000030', 0, 1, 0, 0, 90, 7.5, 'manual'),
  ('a1b2c3d4-0000-0000-0000-000000000064', 'a1b2c3d4-0000-0000-0000-000000000033', 0, 0, 1, 0, 90, 6.0, 'manual'),
  ('a1b2c3d4-0000-0000-0000-000000000072', 'a1b2c3d4-0000-0000-0000-000000000040', 3, 0, 0, 0, 90, 9.5, 'manual'),
  ('a1b2c3d4-0000-0000-0000-000000000072', 'a1b2c3d4-0000-0000-0000-000000000047', 1, 1, 0, 0, 70, 8.0, 'manual'),
  ('a1b2c3d4-0000-0000-0000-000000000072', 'a1b2c3d4-0000-0000-0000-000000000037', 1, 2, 0, 0, 90, 9.0, 'manual'),
  ('a1b2c3d4-0000-0000-0000-000000000072', 'a1b2c3d4-0000-0000-0000-000000000030', 0, 1, 0, 0, 90, 7.5, 'manual');

-- Entraînements
INSERT INTO trainings (id, team_id, season_id, scheduled_at, location, status, notes)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000080', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, '2025-01-21 19:30:00+01', 'Terrain de Xhoffraix', 'completed', 'Travail défensif avant match Stavelot'),
  ('a1b2c3d4-0000-0000-0000-000000000081', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, '2025-01-23 19:30:00+01', 'Terrain de Xhoffraix', 'completed', 'Jeux de position et transitions'),
  ('a1b2c3d4-0000-0000-0000-000000000082', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, '2025-01-28 19:30:00+01', 'Terrain de Xhoffraix', 'completed', 'Préparation match Thimister'),
  ('a1b2c3d4-0000-0000-0000-000000000083', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, '2025-02-04 19:30:00+01', 'Terrain de Xhoffraix', 'scheduled',  'Récupération + vidéo'),
  ('a1b2c3d4-0000-0000-0000-000000000084', 'a1b2c3d4-0000-0000-0000-000000000020', v_season_id, '2025-02-06 19:30:00+01', 'Terrain de Xhoffraix', 'scheduled',  'Préparation match Battice');

-- Présences
INSERT INTO training_attendance (training_id, player_id, status)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000080', 'a1b2c3d4-0000-0000-0000-000000000030', 'present'),
  ('a1b2c3d4-0000-0000-0000-000000000080', 'a1b2c3d4-0000-0000-0000-000000000031', 'present'),
  ('a1b2c3d4-0000-0000-0000-000000000080', 'a1b2c3d4-0000-0000-0000-000000000032', 'absent'),
  ('a1b2c3d4-0000-0000-0000-000000000080', 'a1b2c3d4-0000-0000-0000-000000000033', 'present'),
  ('a1b2c3d4-0000-0000-0000-000000000080', 'a1b2c3d4-0000-0000-0000-000000000034', 'excused'),
  ('a1b2c3d4-0000-0000-0000-000000000080', 'a1b2c3d4-0000-0000-0000-000000000035', 'present'),
  ('a1b2c3d4-0000-0000-0000-000000000080', 'a1b2c3d4-0000-0000-0000-000000000036', 'present'),
  ('a1b2c3d4-0000-0000-0000-000000000080', 'a1b2c3d4-0000-0000-0000-000000000037', 'present'),
  ('a1b2c3d4-0000-0000-0000-000000000080', 'a1b2c3d4-0000-0000-0000-000000000038', 'late'),
  ('a1b2c3d4-0000-0000-0000-000000000080', 'a1b2c3d4-0000-0000-0000-000000000039', 'present'),
  ('a1b2c3d4-0000-0000-0000-000000000080', 'a1b2c3d4-0000-0000-0000-000000000040', 'present'),
  ('a1b2c3d4-0000-0000-0000-000000000080', 'a1b2c3d4-0000-0000-0000-000000000041', 'absent'),
  ('a1b2c3d4-0000-0000-0000-000000000081', 'a1b2c3d4-0000-0000-0000-000000000030', 'present'),
  ('a1b2c3d4-0000-0000-0000-000000000081', 'a1b2c3d4-0000-0000-0000-000000000031', 'present'),
  ('a1b2c3d4-0000-0000-0000-000000000081', 'a1b2c3d4-0000-0000-0000-000000000033', 'present'),
  ('a1b2c3d4-0000-0000-0000-000000000081', 'a1b2c3d4-0000-0000-0000-000000000035', 'absent'),
  ('a1b2c3d4-0000-0000-0000-000000000081', 'a1b2c3d4-0000-0000-0000-000000000036', 'present'),
  ('a1b2c3d4-0000-0000-0000-000000000081', 'a1b2c3d4-0000-0000-0000-000000000037', 'present'),
  ('a1b2c3d4-0000-0000-0000-000000000081', 'a1b2c3d4-0000-0000-0000-000000000040', 'late'),
  ('a1b2c3d4-0000-0000-0000-000000000081', 'a1b2c3d4-0000-0000-0000-000000000041', 'present');

-- Amendes
INSERT INTO fine_rules (id, team_id, label, amount, is_active)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000090', 'a1b2c3d4-0000-0000-0000-000000000020', 'Retard entraînement',     2.00, true),
  ('a1b2c3d4-0000-0000-0000-000000000091', 'a1b2c3d4-0000-0000-0000-000000000020', 'Absence non excusée',     5.00, true),
  ('a1b2c3d4-0000-0000-0000-000000000092', 'a1b2c3d4-0000-0000-0000-000000000020', 'Carton jaune',            3.00, true),
  ('a1b2c3d4-0000-0000-0000-000000000093', 'a1b2c3d4-0000-0000-0000-000000000020', 'Carton rouge',           10.00, true),
  ('a1b2c3d4-0000-0000-0000-000000000094', 'a1b2c3d4-0000-0000-0000-000000000020', 'Oubli maillot',           5.00, true),
  ('a1b2c3d4-0000-0000-0000-000000000095', 'a1b2c3d4-0000-0000-0000-000000000020', 'Téléphone réunion',       2.00, true);

-- Trésorerie
INSERT INTO team_treasury (team_id, total_collected, total_spent, season_goal)
VALUES ('a1b2c3d4-0000-0000-0000-000000000020', 47.00, 0.00, 'Souper de fin de saison');

-- Badges
INSERT INTO player_badges (player_id, season_id, team_id, badge_slug, badge_label, badge_icon, is_active)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000040', v_season_id, 'a1b2c3d4-0000-0000-0000-000000000020', 'top_scorer',       'Meilleur buteur',     '⚽', true),
  ('a1b2c3d4-0000-0000-0000-000000000037', v_season_id, 'a1b2c3d4-0000-0000-0000-000000000020', 'top_assist',       'Meilleur passeur',    '🎯', true),
  ('a1b2c3d4-0000-0000-0000-000000000031', v_season_id, 'a1b2c3d4-0000-0000-0000-000000000020', 'iron_man',         'Mur défensif',        '🧱', true),
  ('a1b2c3d4-0000-0000-0000-000000000035', v_season_id, 'a1b2c3d4-0000-0000-0000-000000000020', 'yellow_card_king', 'Boucher de l équipe', '🟨', true);

END $$;
