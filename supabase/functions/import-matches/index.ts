/**
 * import-matches — Edge function VoetbalInBelgië → Tactik
 *
 * Lit les compétitions depuis api_competitions, appelle l'API VIB pour chacune,
 * upsert orgs/teams/matches, met à jour api_cache, puis déclenche compute-badges.
 *
 * TTL adaptatif (CET) :
 *   - semaine        → 240 min (4h)
 *   - weekend <15h   →  60 min (1h)
 *   - weekend ≥15h   →  15 min
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const API_KEY      = Deno.env.get('VOETBALINBELGIE_API_KEY') ?? ''
const VIB_LOGO_BASE = 'https://www.voetbalinbelgie.be/images/clubs/'

// ── TTL ───────────────────────────────────────────────────────────────────────

function getTTLMinutes(): number {
  const now = new Date()
  const day = now.getUTCDay()
  // CET = UTC+1, CEST = UTC+2. Using +1 (conservative) is sufficient for the
  // 15h boundary used to decide "after matches start".
  const hourCET = (now.getUTCHours() + 1) % 24
  const isWeekend = day === 0 || day === 6

  if (!isWeekend) return 240
  if (hourCET < 15) return 60
  return 15
}

// ── Cache ─────────────────────────────────────────────────────────────────────

async function isCacheValid(endpoint: string, ttlMinutes: number): Promise<boolean> {
  const { data } = await supabase
    .from('api_cache')
    .select('fetched_at')
    .eq('endpoint', endpoint)
    .maybeSingle()

  if (!data) return false
  const ageMin = (Date.now() - new Date(data.fetched_at).getTime()) / 60_000
  return ageMin < ttlMinutes
}

async function updateCache(endpoint: string, payload: unknown, ttlMinutes: number) {
  await supabase
    .from('api_cache')
    .upsert(
      { endpoint, data: payload, fetched_at: new Date().toISOString(), ttl_minutes: ttlMinutes },
      { onConflict: 'endpoint' },
    )
}

// ── API call ──────────────────────────────────────────────────────────────────

async function fetchCompetition(endpoint: string): Promise<any> {
  const res = await fetch(endpoint, { headers: { 'X-Api-Key': API_KEY } })
  if (!res.ok) throw new Error(`VIB API ${res.status} — ${endpoint}`)
  return res.json()
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract slug from VIB club href, e.g. ".../clubs/m/ans-fc/" → "ans-fc" */
function slugFromHref(href: string): string {
  return href.replace(/\/$/, '').split('/').pop() ?? ''
}

function mapStatus(raw: string): 'completed' | 'scheduled' | 'postponed' {
  if (raw === 'Gespeeld') return 'completed'
  if (raw === 'Uitgesteld') return 'postponed'
  if (raw.toLowerCase().includes('forfait')) return 'completed'
  return 'scheduled' // "Nog te spelen" and anything unknown
}

/** VIB sends homeGoals:0 for unplayed matches — must be null in DB */
function goals(raw: string, value: number | null): number | null {
  return mapStatus(raw) === 'scheduled' || mapStatus(raw) === 'postponed' ? null : value
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async () => {
  const ttl = getTTLMinutes()
  const summary: unknown[] = []

  try {
    const { data: competitions, error: compErr } = await supabase
      .from('api_competitions')
      .select('*')
      .eq('is_active', true)

    if (compErr) throw compErr
    if (!competitions?.length) throw new Error('No active competitions found')

    // Football sport id (needed for org upsert)
    const { data: sport } = await supabase
      .from('sports')
      .select('id')
      .eq('slug', 'football')
      .maybeSingle()

    for (const comp of competitions) {
      try {
        const endpoint: string = comp.api_endpoint

        if (await isCacheValid(endpoint, ttl)) {
          summary.push({ name: comp.name, status: 'cached' })
          continue
        }

        const raw = await fetchCompetition(endpoint)
        const c = raw?.competition
        if (!c?.meta) throw new Error('Unexpected API response shape')

        await updateCache(endpoint, raw, ttl)

        const compId = String(c.meta.id)
        const related: Array<{ name: string; logo: string; href: string }> =
          c.links?.related ?? []

        // ── 1. Build name → slug map from links.related ─────────────────────
        const nameToSlug = new Map<string, string>()
        for (const r of related) {
          nameToSlug.set(r.name, slugFromHref(r.href))
        }

        // ── 2. Upsert organizations + teams ──────────────────────────────────
        if (sport) {
          for (const r of related) {
            const slug = slugFromHref(r.href)
            if (!slug) continue

            const { data: org } = await supabase
              .from('organizations')
              .upsert(
                {
                  name:             r.name,
                  logo_url:         VIB_LOGO_BASE + r.logo,
                  sport_id:         sport.id,
                  division:         c.meta.title,
                  external_api_id:  slug,
                },
                { onConflict: 'external_api_id' },
              )
              .select('id')
              .maybeSingle()

            if (!org) continue

            await supabase
              .from('teams')
              .upsert(
                {
                  organization_id:  org.id,
                  name:             r.name,
                  category:         c.meta.title,
                  external_api_id:  `${slug}:${compId}`,
                },
                { onConflict: 'external_api_id' },
              )
          }
        }

        // ── 3. Load team IDs for this competition ────────────────────────────
        const teamExtIds = [...nameToSlug.values()].map(s => `${s}:${compId}`)
        const { data: teams } = await supabase
          .from('teams')
          .select('id, external_api_id')
          .in('external_api_id', teamExtIds)

        /** slug → team uuid */
        const slugToTeamId = new Map<string, string>()
        for (const t of (teams ?? [])) {
          const slug = (t.external_api_id as string).split(':')[0]
          slugToTeamId.set(slug, t.id as string)
        }

        // ── 4. Upsert matches (home + away perspective per fixture) ───────────
        const fixtures = [...(c.results ?? []), ...(c.program ?? [])]
        let imported = 0, skipped = 0

        for (const m of fixtures) {
          if (!m.date || !m.home || !m.away) { skipped++; continue }

          const homeSlug  = nameToSlug.get(m.home)
          const awaySlug  = nameToSlug.get(m.away)
          const status    = mapStatus(m.status ?? '')
          const scoreHome = goals(m.status ?? '', m.homeGoals ?? null)
          const scoreAway = goals(m.status ?? '', m.awayGoals ?? null)
          const matchDate = new Date(m.date).toISOString()

          // Home perspective
          const homeTeamId = homeSlug ? slugToTeamId.get(homeSlug) : undefined
          if (homeTeamId) {
            await supabase.from('matches').upsert(
              {
                team_id:         homeTeamId,
                opponent:        m.away,
                match_date:      matchDate,
                is_home:         true,
                type:            'championship',
                status,
                score_home:      scoreHome,
                score_away:      scoreAway,
                source:          'api',
                external_api_id: `${homeSlug}-vs-${awaySlug ?? m.away}-${m.date}`,
              },
              { onConflict: 'external_api_id' },
            )
            imported++
          }

          // Away perspective
          const awayTeamId = awaySlug ? slugToTeamId.get(awaySlug) : undefined
          if (awayTeamId) {
            await supabase.from('matches').upsert(
              {
                team_id:         awayTeamId,
                opponent:        m.home,
                match_date:      matchDate,
                is_home:         false,
                type:            'championship',
                status,
                score_home:      scoreHome,
                score_away:      scoreAway,
                source:          'api',
                external_api_id: `${awaySlug}-at-${homeSlug ?? m.home}-${m.date}`,
              },
              { onConflict: 'external_api_id' },
            )
            imported++
          }

          if (!homeTeamId && !awayTeamId) skipped++
        }

        // ── 5. Trigger compute-badges (fire-and-forget) ───────────────────────
        fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/compute-badges`,
          {
            method:  'POST',
            headers: {
              Authorization:  `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: '{}',
          },
        ).catch((e: Error) =>
          console.warn('[import-matches] compute-badges trigger failed:', e.message),
        )

        summary.push({
          name:     comp.name,
          status:   'ok',
          ttl,
          imported,
          skipped,
          total:    fixtures.length,
        })

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[import-matches] ${comp.name}:`, msg)
        summary.push({ name: comp.name, status: 'error', error: msg })
      }
    }

    return new Response(
      JSON.stringify({ ok: true, ttl, summary }),
      { headers: { 'Content-Type': 'application/json' } },
    )

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[import-matches] fatal:', msg)
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
