import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StandingRow {
  name: string;
  logoUrl: string | null;
  isUs: boolean;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: ("W" | "D" | "L")[];
}

export interface StandingsData {
  division: string;
  rows: StandingRow[];
}

export function useStandings(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["standings", organizationId],
    enabled: !!organizationId,
    queryFn: async (): Promise<StandingsData | null> => {
      // 1. Our org info (division, name)
      const { data: ourOrg, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, division, logo_url")
        .eq("id", organizationId!)
        .maybeSingle();
      if (orgError) throw orgError;
      if (!ourOrg?.division) return null;

      // 2. All orgs in same division
      const { data: divOrgs, error: divOrgsError } = await supabase
        .from("organizations")
        .select("id, name, logo_url")
        .eq("division", ourOrg.division);
      if (divOrgsError) throw divOrgsError;

      // Map org name → { id, logoUrl } for opponent logo resolution
      const orgByName: Record<string, { id: string; logoUrl: string | null }> = {};
      for (const o of divOrgs ?? []) {
        orgByName[o.name] = { id: o.id, logoUrl: o.logo_url };
      }

      // 3. VIB teams for those orgs
      const divOrgIds = (divOrgs ?? []).map((o) => o.id);
      if (!divOrgIds.length) return null;

      const { data: divTeams, error: teamsError } = await supabase
        .from("teams")
        .select("id, organization_id")
        .in("organization_id", divOrgIds)
        .like("external_api_id", "%:%");
      if (teamsError) throw teamsError;
      if (!divTeams?.length) return null;

      const teamOrgMap: Record<string, string> = {};
      for (const t of divTeams) teamOrgMap[t.id] = t.organization_id;

      // 4. Home-perspective championship completed matches
      const teamIds = divTeams.map((t) => t.id);
      const { data: matches, error: matchError } = await supabase
        .from("matches")
        .select("team_id, opponent, score_home, score_away, match_date, teams(organizations(name, logo_url))")
        .in("team_id", teamIds)
        .eq("is_home", true)
        .eq("type", "championship")
        .eq("status", "completed")
        .order("match_date", { ascending: true });
      if (matchError) throw matchError;

      // 5. Build table
      type RowAcc = Omit<StandingRow, "form"> & { results: ("W" | "D" | "L")[] };
      const table: Record<string, RowAcc> = {};

      const getOrCreate = (name: string, logoUrl: string | null, isUs: boolean): RowAcc => {
        if (!table[name]) {
          table[name] = { name, logoUrl, isUs, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0, results: [] };
        }
        return table[name];
      };

      for (const m of matches ?? []) {
        if (m.score_home == null || m.score_away == null) continue;

        const homeName = (m.teams as any)?.organizations?.name ?? "?";
        const homeLogo: string | null = (m.teams as any)?.organizations?.logo_url ?? null;
        const awayName = m.opponent as string;
        const awayInfo = orgByName[awayName];

        const homeIsUs = teamOrgMap[m.team_id as string] === organizationId;
        const awayIsUs = awayInfo?.id === organizationId;

        const home = getOrCreate(homeName, homeLogo, homeIsUs);
        const away = getOrCreate(awayName, awayInfo?.logoUrl ?? null, awayIsUs);

        home.played++; away.played++;
        home.goalsFor += m.score_home; home.goalsAgainst += m.score_away;
        away.goalsFor += m.score_away; away.goalsAgainst += m.score_home;

        if (m.score_home > m.score_away) {
          home.wins++; home.points += 3; home.results.push("W");
          away.losses++;                  away.results.push("L");
        } else if (m.score_home === m.score_away) {
          home.draws++; home.points++; home.results.push("D");
          away.draws++; away.points++; away.results.push("D");
        } else {
          home.losses++;                  home.results.push("L");
          away.wins++; away.points += 3;  away.results.push("W");
        }
      }

      // 6. Sort: pts desc → goal diff desc → goals for desc → name asc
      const rows: StandingRow[] = Object.values(table)
        .sort((a, b) => {
          const ptsDiff = b.points - a.points;
          if (ptsDiff !== 0) return ptsDiff;
          const diffA = a.goalsFor - a.goalsAgainst;
          const diffB = b.goalsFor - b.goalsAgainst;
          if (diffB !== diffA) return diffB - diffA;
          if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
          return a.name.localeCompare(b.name);
        })
        .map((r) => ({ ...r, form: r.results.slice(-5) }));

      return { division: ourOrg.division, rows };
    },
  });
}
