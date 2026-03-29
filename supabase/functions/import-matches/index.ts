import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const API_KEY = Deno.env.get('VOETBALINBELGIE_API_KEY')!

// TTL en minutes selon jour et heure
function getTTLMinutes(): number {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  const isWeekend = day === 0 || day === 6

  if (!isWeekend) return 240
  if (hour < 15) return 60
  return 15
}

// Vérifie si le cache est encore valide
async function isCacheValid(endpoint: string, ttlMinutes: number): Promise<boolean> {
  const { data } = await supabase
    .from('api_cache')
    .select('fetched_at, ttl_minutes')
    .eq('endpoint', endpoint)
    .single()

  if (!data) return false

  const fetchedAt = new Date(data.fetched_at)
  const now = new Date()
  const ageMinutes = (now.getTime() - fetchedAt.getTime()) / 1000 / 60

  return ageMinutes < ttlMinutes
}

// Appel API avec header auth
async function fetchCompetition(endpoint: string): Promise<any> {
  const response = await fetch(endpoint, {
    headers: { 'X-Api-Key': API_KEY }
  })

  if (!response.ok) {
    throw new Error(`API error ${response.status} for ${endpoint}`)
  }

  return response.json()
}

// Upsert dans api_cache
async function updateCache(endpoint: string, data: any, ttlMinutes: number) {
  await supabase
    .from('api_cache')
    .upsert({
      endpoint,
      data,
      fetched_at: new Date().toISOString(),
      ttl_minutes: ttlMinutes
    }, { onConflict: 'endpoint' })
}

// Parse et upsert les matchs joués
async function importResults(
  results: any[],
  teamId: string,
  seasonId: string,
  teamName: string
) {
  for (const result of results) {
    if (!result.date || !result.home || !result.away) continue

    const isHome = result.home === teamName
    const matchDate = new Date(result.date).toISOString()
    const externalId = `${result.home}-${result.away}-${result.date}`

    await supabase
      .from('matches')
      .upsert({
        team_id: teamId,
        season_id: seasonId,
        opponent: isHome ? result.away : result.home,
        is_home: isHome,
        match_date: matchDate,
        type: 'championship',
        status: 'completed',
        score_home: result.homeGoals ?? null,
        score_away: result.awayGoals ?? null,
        source: 'api',
        external_api_id: externalId
      }, { onConflict: 'external_api_id' })
  }
}

// Parse et upsert les matchs à venir
async function importProgram(
  program: any[],
  teamId: string,
  seasonId: string,
  teamName: string
) {
  for (const match of program) {
    if (!match.date || !match.home || !match.away) continue

    const isHome = match.home === teamName
    const matchDate = new Date(match.date).toISOString()
    const externalId = `${match.home}-${match.away}-${match.date}`

    await supabase
      .from('matches')
      .upsert({
        team_id: teamId,
        season_id: seasonId,
        opponent: isHome ? match.away : match.home,
        is_home: isHome,
        match_date: matchDate,
        type: 'championship',
        status: 'scheduled',
        score_home: null,
        score_away: null,
        source: 'api',
        external_api_id: externalId
      }, { onConflict: 'external_api_id' })
  }
}

// Upsert les clubs depuis le classement
async function importLeagueTable(
  leaguetable: any[],
  sportId: string,
  division: string,
  seasonId: string
) {
  for (const club of leaguetable) {
    if (!club.name) continue

    const externalId = club.name.toLowerCase().replace(/\s/g, '-')

    const { data: org } = await supabase
      .from('organizations')
      .upsert({
        name: club.name,
        short_name: club.name.substring(0, 10),
        sport_id: sportId,
        division,
        logo_url: club.logo ?? null,
        external_api_id: externalId
      }, { onConflict: 'external_api_id' })
      .select('id')
      .single()

    if (!org) continue

    await supabase
      .from('teams')
      .upsert({
        organization_id: org.id,
        season_id: seasonId,
        name: `${club.name} A`,
        category: 'Première équipe',
        external_api_id: `${org.id}-${seasonId}`
      }, { onConflict: 'external_api_id' })
  }
}

// Fonction principale
Deno.serve(async () => {
  try {
    const ttl = getTTLMinutes()

    const { data: season } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_current', true)
      .eq('sport_slug', 'football')
      .single()

    if (!season) throw new Error('No current season found')

    const { data: sport } = await supabase
      .from('sports')
      .select('id')
      .eq('slug', 'football')
      .single()

    if (!sport) throw new Error('Sport football not found')

    const { data: competitions } = await supabase
      .from('api_competitions')
      .select('*')
      .eq('is_active', true)
      .eq('sport_slug', 'football')

    if (!competitions?.length) throw new Error('No active competitions found')

    const results = []

    for (const competition of competitions) {
      const cached = await isCacheValid(competition.api_endpoint, ttl)

      if (cached) {
        results.push({ competition: competition.name, status: 'cached' })
        continue
      }

      const data = await fetchCompetition(competition.api_endpoint)
      const comp = data?.competition

      if (!comp) {
        results.push({ competition: competition.name, status: 'error', message: 'Invalid API response' })
        continue
      }

      await updateCache(competition.api_endpoint, data, ttl)

      if (comp.leaguetable?.length) {
        await importLeagueTable(
          comp.leaguetable,
          sport.id,
          competition.division,
          season.id
        )
      }

      const { data: teams } = await supabase
        .from('teams')
        .select('id, organizations(name)')
        .eq('season_id', season.id)

      if (teams?.length) {
        for (const team of teams) {
          const orgName = (team.organizations as any)?.name
          if (!orgName) continue

          if (comp.results?.length) {
            await importResults(comp.results, team.id, season.id, orgName)
          }

          if (comp.program?.length) {
            await importProgram(comp.program, team.id, season.id, orgName)
          }
        }
      }

      // Déclenche compute-badges après import réussi
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/compute-badges`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      results.push({
        competition: competition.name,
        status: 'success',
        clubs: comp.leaguetable?.length ?? 0,
        results: comp.results?.length ?? 0,
        program: comp.program?.length ?? 0
      })
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('import-matches error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
