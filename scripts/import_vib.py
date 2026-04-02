#!/usr/bin/env python3
"""
VoetbalInBelgië → Tactik import
Génère un fichier SQL idempotent pour peupler :
  organizations, teams, matches (P1 / P2C / P3D Luik 2025/2026)

Usage:
  python3 scripts/import_vib.py > scripts/import_vib.sql
  # Puis coller dans Supabase SQL Editor (dashboard → SQL Editor)

Idempotence :
  - organizations : ON CONFLICT (external_api_id) DO NOTHING
    (contrainte UNIQUE ajoutée par ce script si absente)
  - teams         : ON CONFLICT (external_api_id) DO NOTHING
    (idem)
  - matches       : WHERE NOT EXISTS (team_id + match_date + opponent + source)
"""

import json
import os
import sys

# ── Fichiers source ──────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILES = {
    "471": os.path.join(BASE_DIR, "data", "p1 (1).json"),   # 1e provinciale Luik
    "474": os.path.join(BASE_DIR, "data", "p2c (1).json"),  # 2e provinciale C Luik
    "478": os.path.join(BASE_DIR, "data", "p3d (1).json"),  # 3e provinciale D Luik
}

VIB_LOGO_BASE = "https://www.voetbalinbelgie.be/images/clubs/"

# ── Helpers ──────────────────────────────────────────────────────────────────
def q(s) -> str:
    """Single-quote a SQL string, escaping internal quotes."""
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def slug_from_href(href: str) -> str:
    return href.rstrip("/").split("/")[-1]


def map_status(raw: str) -> str:
    if raw == "Gespeeld":
        return "completed"
    if raw == "Nog te spelen":
        return "scheduled"
    if raw == "Uitgesteld":
        return "postponed"
    if "orfait" in raw:
        return "completed"
    return "completed"


def has_score(status_raw: str) -> bool:
    return status_raw not in ("Nog te spelen", "Uitgesteld")


# ── Load data ────────────────────────────────────────────────────────────────
divisions = {}   # div_id → competition dict
for div_id, fpath in DATA_FILES.items():
    with open(fpath, encoding="utf-8") as fh:
        divisions[div_id] = json.load(fh)["competition"]

# Build org index: slug → {name, logo, div_ids}
org_index: dict[str, dict] = {}
for div_id, d in divisions.items():
    for r in d["links"]["related"]:
        slug = slug_from_href(r["href"])
        if slug not in org_index:
            org_index[slug] = {"name": r["name"], "logo": r["logo"], "div_ids": []}
        if div_id not in org_index[slug]["div_ids"]:
            org_index[slug]["div_ids"].append(div_id)

# ── Generate SQL ─────────────────────────────────────────────────────────────
out = []

out += [
    "-- ============================================================",
    "-- VoetbalInBelgië → Tactik  |  P1 / P2C / P3D Luik 2025/2026",
    "-- Généré par scripts/import_vib.py — safe to re-run",
    "-- ============================================================",
    "",
]

# ── Step 0 : unique constraints ───────────────────────────────────────────────
out += [
    "-- Step 0 : contraintes UNIQUE nécessaires à l'idempotence",
    "DO $$ BEGIN",
    "  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orgs_external_api_id_uq') THEN",
    "    ALTER TABLE organizations ADD CONSTRAINT orgs_external_api_id_uq UNIQUE (external_api_id);",
    "  END IF;",
    "END $$;",
    "",
    "DO $$ BEGIN",
    "  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_external_api_id_uq') THEN",
    "    ALTER TABLE teams ADD CONSTRAINT teams_external_api_id_uq UNIQUE (external_api_id);",
    "  END IF;",
    "END $$;",
    "",
]

# ── Step 1 : organizations ────────────────────────────────────────────────────
out += [
    "-- ── Step 1 : Organizations (" + str(len(org_index)) + " clubs) ──────────────────────────────",
    "INSERT INTO organizations (name, logo_url, external_api_id, division)",
    "VALUES",
]

org_rows = []
for slug, info in sorted(org_index.items()):
    divs = [divisions[did]["meta"]["title"] for did in sorted(info["div_ids"])]
    division_str = " / ".join(divs)
    logo_url = VIB_LOGO_BASE + info["logo"]
    org_rows.append(
        f"  ({q(info['name'])}, {q(logo_url)}, {q(slug)}, {q(division_str)})"
    )

out.append(",\n".join(org_rows))
out += ["ON CONFLICT (external_api_id) DO NOTHING;", ""]

# ── Step 2 : teams (1 per org per division) ───────────────────────────────────
out += [
    "-- ── Step 2 : Teams (1 équipe par club par division) ────────────────────",
]

for div_id, d in divisions.items():
    meta = d["meta"]
    slugs = [slug_from_href(r["href"]) for r in d["links"]["related"]]
    ext_ids = [f"{s}:{div_id}" for s in slugs]

    out += [
        f"-- {meta['title']}",
        "INSERT INTO teams (organization_id, name, category, external_api_id)",
        "SELECT o.id, o.name, " + q(meta["title"]) + ", o.external_api_id || ':' || " + q(div_id),
        "FROM organizations o",
        "WHERE o.external_api_id IN (",
        "  " + ",\n  ".join(q(s) for s in sorted(slugs)),
        ")",
        "ON CONFLICT (external_api_id) DO NOTHING;",
        "",
    ]

# ── Step 3 : matches via temp table ──────────────────────────────────────────
out += [
    "-- ── Step 3 : Matches (résultats + programme) ───────────────────────────",
    "-- Approche : table temporaire → JOIN sur organizations/teams → INSERT WHERE NOT EXISTS",
    "",
    "CREATE TEMP TABLE IF NOT EXISTS _vib_matches (",
    "  home_name  text NOT NULL,",
    "  away_name  text NOT NULL,",
    "  match_date timestamptz NOT NULL,",
    "  status     match_status NOT NULL,",
    "  score_home int,",
    "  score_away int,",
    "  div_id     text NOT NULL",
    ");",
    "",
    "TRUNCATE _vib_matches;",
    "",
    "INSERT INTO _vib_matches (home_name, away_name, match_date, status, score_home, score_away, div_id)",
    "VALUES",
]

match_rows = []
for div_id, d in divisions.items():
    all_matches = d.get("results", []) + d.get("program", [])
    for m in all_matches:
        raw_status = m.get("status", "")
        status = map_status(raw_status)
        scored = has_score(raw_status)
        sh = str(m["homeGoals"]) if scored else "NULL"
        sa = str(m["awayGoals"]) if scored else "NULL"
        match_rows.append(
            f"  ({q(m['home'])}, {q(m['away'])}, {q(m['date'])}::timestamptz, "
            f"{q(status)}::match_status, {sh}, {sa}, {q(div_id)})"
        )

out.append(",\n".join(match_rows) + ";")
out += [""]

# Home team perspective
out += [
    "-- Perspective équipe domicile",
    "INSERT INTO matches",
    "  (team_id, opponent, match_date, is_home, type, status, score_home, score_away, source)",
    "SELECT",
    "  t.id,",
    "  r.away_name,",
    "  r.match_date,",
    "  TRUE,",
    "  'championship'::match_type,",
    "  r.status::match_status,",
    "  r.score_home,",
    "  r.score_away,",
    "  'api'::match_source",
    "FROM _vib_matches r",
    "JOIN organizations o ON o.name = r.home_name",
    "JOIN teams t ON t.organization_id = o.id",
    "             AND t.external_api_id = o.external_api_id || ':' || r.div_id",
    "WHERE NOT EXISTS (",
    "  SELECT 1 FROM matches m",
    "  WHERE m.team_id = t.id",
    "    AND m.match_date = r.match_date",
    "    AND m.opponent   = r.away_name",
    "    AND m.source     = 'api'::match_source",
    ");",
    "",
]

# Away team perspective
out += [
    "-- Perspective équipe visiteur",
    "INSERT INTO matches",
    "  (team_id, opponent, match_date, is_home, type, status, score_home, score_away, source)",
    "SELECT",
    "  t.id,",
    "  r.home_name,",
    "  r.match_date,",
    "  FALSE,",
    "  'championship'::match_type,",
    "  r.status::match_status,",
    "  r.score_home,",
    "  r.score_away,",
    "  'api'::match_source",
    "FROM _vib_matches r",
    "JOIN organizations o ON o.name = r.away_name",
    "JOIN teams t ON t.organization_id = o.id",
    "             AND t.external_api_id = o.external_api_id || ':' || r.div_id",
    "WHERE NOT EXISTS (",
    "  SELECT 1 FROM matches m",
    "  WHERE m.team_id = t.id",
    "    AND m.match_date = r.match_date",
    "    AND m.opponent   = r.home_name",
    "    AND m.source     = 'api'::match_source",
    ");",
    "",
    "DROP TABLE _vib_matches;",
    "",
    "-- ── Résumé attendu ──────────────────────────────────────────────────────",
    f"-- organizations : {len(org_index)} lignes",
]

team_count = sum(len(d["links"]["related"]) for d in divisions.values())
match_count = sum(
    (len(d.get("results", [])) + len(d.get("program", []))) * 2
    for d in divisions.values()
)
out += [
    f"-- teams         : {team_count} lignes",
    f"-- matches        : {match_count} lignes (~{match_count} avec perspectives home+away)",
    "-- ============================================================",
]

print("\n".join(out))
