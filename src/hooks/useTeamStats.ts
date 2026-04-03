import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlayerStat {
  matches: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  avgRating: number | null;
}

export interface TeamStatsData {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  avgRating: number | null;
  formData: { match: string; goals: number; conceded: number }[];
  playerStats: Record<string, PlayerStat>;
}

export function useTeamStats(teamId: string | undefined, organizationId?: string | undefined) {
  return useQuery({
    queryKey: ["team-stats", teamId, organizationId],
    enabled: !!teamId,
    queryFn: async (): Promise<TeamStatsData> => {
      // Resolve VIB team IDs (same pattern as useDashboard/useMatchesByOrg)
      let matchTeamIds: string[];
      if (organizationId) {
        const { data: vibTeams } = await supabase
          .from("teams")
          .select("id")
          .eq("organization_id", organizationId)
          .like("external_api_id", "%:%");
        if (!vibTeams?.length) {
          // org provided but no VIB teams linked — no stats to show
          return {
            matchesPlayed: 0, wins: 0, draws: 0, losses: 0,
            goalsFor: 0, goalsAgainst: 0, cleanSheets: 0,
            avgRating: null, formData: [], playerStats: {},
          };
        }
        matchTeamIds = vibTeams.map((t) => t.id);
      } else {
        matchTeamIds = [teamId!];
      }

      // 1. Completed matches with scores
      const { data: matches, error: matchesErr } = await supabase
        .from("matches")
        .select("id, is_home, score_home, score_away, match_date")
        .in("team_id", matchTeamIds)
        .eq("status", "completed")
        .not("score_home", "is", null)
        .not("score_away", "is", null)
        .order("match_date", { ascending: true });

      if (matchesErr) throw matchesErr;

      const matchList = matches ?? [];
      const matchIds = matchList.map((m) => m.id);

      // 2. Match stats for all those matches
      let rawStats: {
        player_id: string;
        goals: number;
        assists: number;
        yellow_cards: number;
        red_cards: number;
        minutes_played: number;
        rating: number | null;
      }[] = [];

      if (matchIds.length > 0) {
        const { data, error } = await supabase
          .from("match_stats")
          .select("player_id, goals, assists, yellow_cards, red_cards, minutes_played, rating")
          .in("match_id", matchIds);
        if (error) throw error;
        rawStats = data ?? [];
      }

      // 3. Team-level aggregation
      let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0, cleanSheets = 0;
      const formData: { match: string; goals: number; conceded: number }[] = [];

      // Use last 10 matches for the bar chart
      const chartMatches = matchList.slice(-10);
      chartMatches.forEach((m, i) => {
        const ours = m.is_home ? m.score_home! : m.score_away!;
        const theirs = m.is_home ? m.score_away! : m.score_home!;
        formData.push({ match: `J${matchList.indexOf(m) + 1}`, goals: ours, conceded: theirs });
      });

      matchList.forEach((m) => {
        const ours = m.is_home ? m.score_home! : m.score_away!;
        const theirs = m.is_home ? m.score_away! : m.score_home!;
        goalsFor += ours;
        goalsAgainst += theirs;
        if (ours > theirs) wins++;
        else if (ours === theirs) draws++;
        else losses++;
        if (theirs === 0) cleanSheets++;
      });

      const allRatings = rawStats
        .map((s) => s.rating)
        .filter((r): r is number => r != null);
      const avgRating =
        allRatings.length > 0
          ? +(allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
          : null;

      // 4. Per-player aggregation
      const playerMap = new Map<
        string,
        { goals: number; assists: number; yc: number; rc: number; ratings: number[]; entries: number }
      >();

      for (const s of rawStats) {
        if (!playerMap.has(s.player_id)) {
          playerMap.set(s.player_id, { goals: 0, assists: 0, yc: 0, rc: 0, ratings: [], entries: 0 });
        }
        const p = playerMap.get(s.player_id)!;
        p.goals += s.goals;
        p.assists += s.assists;
        p.yc += s.yellow_cards;
        p.rc += s.red_cards;
        p.entries++;
        if (s.rating != null) p.ratings.push(s.rating);
      }

      const playerStats: Record<string, PlayerStat> = {};
      playerMap.forEach((s, playerId) => {
        playerStats[playerId] = {
          matches: s.entries,
          goals: s.goals,
          assists: s.assists,
          yellowCards: s.yc,
          redCards: s.rc,
          avgRating:
            s.ratings.length > 0
              ? +(s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length).toFixed(1)
              : null,
        };
      });

      return {
        matchesPlayed: wins + draws + losses,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        cleanSheets,
        avgRating,
        formData,
        playerStats,
      };
    },
  });
}
