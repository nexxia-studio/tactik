import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const BADGE_DEFINITIONS = [
  { slug: 'top_scorer', label: 'Meilleur buteur', icon: '⚽' },
  { slug: 'top_assist', label: 'Meilleur passeur', icon: '🎯' },
  { slug: 'iron_man', label: 'Homme de fer', icon: '🧱' },
  { slug: 'yellow_card_king', label: 'Boucher de l\'équipe', icon: '🟨' },
  { slug: 'red_card_king', label: 'Expulsé en chef', icon: '🟥' },
  { slug: 'attendance_king', label: 'Pilier des entraînements', icon: '🏃' },
  { slug: 'fine_leader', label: 'Champion des amendes', icon: '💸' }
]

// Retourne TOUS les joueurs avec la valeur maximale (ex-aequo)
function getTopPlayers(data: Record<string, number>, minValue = 1): string[] {
  if (!Object.keys(data).length) return []
  const maxValue = Math.max(...Object.values(data))
  if (maxValue < minValue) return []
  return Object.entries(data)
    .filter(([_, value]) => value === maxValue)
    .map(([playerId]) => playerId)
}

// Stats matchs agrégées par joueur
async function getPlayerStats(teamId: string, seasonId: string) {
  const { data: stats } = await supabase
    .from('match_stats')
    .select(`
      player_id,
      goals,
      assists,
      yellow_cards,
      red_cards,
      minutes_played,
      matches!inner(team_id, season_id, status)
    `)
    .eq('matches.team_id', teamId)
    .eq('matches.season_id', seasonId)
    .eq('matches.status', 'completed')

  if (!stats?.length) return {}

  const aggregated: Record<string, {
    goals: number
    assists: number
    yellow_cards: number
    red_cards: number
    total_cards: number
    minutes_played: number
  }> = {}

  for (const stat of stats) {
    if (!aggregated[stat.player_id]) {
      aggregated[stat.player_id] = {
        goals: 0,
        assists: 0,
        yellow_cards: 0,
        red_cards: 0,
        total_cards: 0,
        minutes_played: 0
      }
    }
    aggregated[stat.player_id].goals += stat.goals ?? 0
    aggregated[stat.player_id].assists += stat.assists ?? 0
    aggregated[stat.player_id].yellow_cards += stat.yellow_cards ?? 0
    aggregated[stat.player_id].red_cards += stat.red_cards ?? 0
    aggregated[stat.player_id].total_cards += (stat.yellow_cards ?? 0) + (stat.red_cards ?? 0)
    aggregated[stat.player_id].minutes_played += stat.minutes_played ?? 0
  }

  return aggregated
}

// Taux de présence aux entraînements par joueur
async function getAttendanceStats(teamId: string) {
  const { data: trainings } = await supabase
    .from('trainings')
    .select('id')
    .eq('team_id', teamId)
    .eq('status', 'completed')

  if (!trainings?.length) return {}

  const trainingIds = trainings.map(t => t.id)
  const totalTrainings = trainingIds.length

  const { data: attendance } = await supabase
    .from('training_attendance')
    .select('player_id, status')
    .in('training_id', trainingIds)

  if (!attendance?.length) return {}

  const presences: Record<string, number> = {}
  for (const record of attendance) {
    if (record.status === 'present' || record.status === 'late') {
      presences[record.player_id] = (presences[record.player_id] ?? 0) + 1
    }
  }

  const rates: Record<string, number> = {}
  for (const [playerId, count] of Object.entries(presences)) {
    rates[playerId] = totalTrainings > 0
      ? Math.round((count / totalTrainings) * 100)
      : 0
  }

  return rates
}

// Total amendes par joueur
async function getFineStats(teamId: string) {
  const { data: fines } = await supabase
    .from('fines')
    .select('player_id, amount')
    .eq('team_id', teamId)

  if (!fines?.length) return {}

  const totals: Record<string, number> = {}
  for (const fine of fines) {
    totals[fine.player_id] = (totals[fine.player_id] ?? 0) + (fine.amount ?? 0)
  }

  return totals
}

// Attribue un badge à un joueur
async function awardBadge(
  playerId: string,
  seasonId: string,
  teamId: string,
  badgeSlug: string
) {
  const badge = BADGE_DEFINITIONS.find(b => b.slug === badgeSlug)
  if (!badge) return

  await supabase
    .from('player_badges')
    .upsert({
      player_id: playerId,
      season_id: seasonId,
      team_id: teamId,
      badge_slug: badge.slug,
      badge_label: badge.label,
      badge_icon: badge.icon,
      is_active: true,
      awarded_at: new Date().toISOString()
    }, { onConflict: 'player_id,season_id,team_id,badge_slug' })
}

// Retire les badges aux joueurs qui ne les méritent plus
async function revokeBadge(
  seasonId: string,
  teamId: string,
  badgeSlug: string,
  keepPlayerIds: string[]
) {
  const query = supabase
    .from('player_badges')
    .update({ is_active: false })
    .eq('season_id', seasonId)
    .eq('team_id', teamId)
    .eq('badge_slug', badgeSlug)

  if (keepPlayerIds.length > 0) {
    query.not('player_id', 'in', `(${keepPlayerIds.join(',')})`)
  }

  await query
}

// Calcule tous les badges pour une équipe
async function computeBadgesForTeam(teamId: string, seasonId: string) {
  const [playerStats, attendanceStats, fineStats] = await Promise.all([
    getPlayerStats(teamId, seasonId),
    getAttendanceStats(teamId),
    getFineStats(teamId)
  ])

  // Top scorer
  const goalsMap: Record<string, number> = {}
  for (const [id, s] of Object.entries(playerStats)) goalsMap[id] = s.goals
  const topScorers = getTopPlayers(goalsMap)
  await revokeBadge(seasonId, teamId, 'top_scorer', topScorers)
  for (const p of topScorers) await awardBadge(p, seasonId, teamId, 'top_scorer')

  // Top assist
  const assistsMap: Record<string, number> = {}
  for (const [id, s] of Object.entries(playerStats)) assistsMap[id] = s.assists
  const topAssists = getTopPlayers(assistsMap)
  await revokeBadge(seasonId, teamId, 'top_assist', topAssists)
  for (const p of topAssists) await awardBadge(p, seasonId, teamId, 'top_assist')

  // Yellow card king
  const yellowMap: Record<string, number> = {}
  for (const [id, s] of Object.entries(playerStats)) yellowMap[id] = s.yellow_cards
  const yellowKings = getTopPlayers(yellowMap)
  await revokeBadge(seasonId, teamId, 'yellow_card_king', yellowKings)
  for (const p of
