import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Match {
  id: string;
  team_id: string;
  season_id: string | null;
  opponent: string;
  match_date: string;
  location: string | null;
  is_home: boolean;
  type: string; // 'championship' | 'friendly' | 'cup'
  status: string; // 'scheduled' | 'completed' | 'cancelled' | 'postponed'
  score_home: number | null;
  score_away: number | null;
  source: string;
  created_at: string;
  // Populated by useMatchesByDivision / useMatchesByOrg (join)
  home_team_name?: string;
  team_logo_url?: string;
  opponent_logo_url?: string;
}

export function useMatches(teamId: string | undefined) {
  return useQuery({
    queryKey: ["matches", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("team_id", teamId!)
        .order("match_date", { ascending: true });
      if (error) throw error;
      return data as Match[];
    },
  });
}

// Division keys as imported by scripts/import_vib.py
export const DIVISIONS = [
  { key: "P1",  label: "P1",  filter: "1e provinciale" },
  { key: "P2C", label: "P2C", filter: "2e provinciale C" },
  { key: "P3D", label: "P3D", filter: "3e provinciale D" },
] as const;

export type DivisionKey = (typeof DIVISIONS)[number]["key"];

export function useMatchesByDivision(division: DivisionKey) {
  const divFilter = DIVISIONS.find((d) => d.key === division)!.filter;
  return useQuery({
    queryKey: ["matches", "division", division],
    queryFn: async () => {
      // 1. Find all organizations in this division
      const { data: orgs, error: orgError } = await supabase
        .from("organizations")
        .select("id")
        .ilike("division", `%${divFilter}%`);
      if (orgError) throw orgError;
      if (!orgs || orgs.length === 0) return [] as Match[];

      // 2. Find all teams for those organizations
      const orgIds = orgs.map((o) => o.id);
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("id")
        .in("organization_id", orgIds);
      if (teamsError) throw teamsError;
      if (!teams || teams.length === 0) return [] as Match[];

      // 3. Fetch home-perspective matches only (deduplicates VIB home+away pairs)
      //    Join teams → organizations to get the real home team name.
      const teamIds = teams.map((t) => t.id);
      const { data, error } = await supabase
        .from("matches")
        .select("*, teams(organizations(name))")
        .in("team_id", teamIds)
        .eq("is_home", true)
        .order("match_date", { ascending: true });
      if (error) throw error;

      return (data ?? []).map((m) => ({
        ...m,
        home_team_name:
          (m.teams as { organizations: { name: string } | null } | null)
            ?.organizations?.name ?? undefined,
        teams: undefined,
      })) as Match[];
    },
  });
}

/**
 * Resolves VIB team IDs for a given organization.
 * VIB teams have external_api_id in the form "slug:compId" (e.g. "ans-fc:471").
 */
export function useVibTeamIds(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["vib-team-ids", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, external_api_id, category")
        .eq("organization_id", organizationId!)
        .like("external_api_id", "%:%");
      if (error) throw error;
      return (data ?? []) as { id: string; external_api_id: string; category: string | null }[];
    },
  });
}

/**
 * Fetches all matches for the user's club (via organizationId → VIB teams).
 * Returns matches from the club's perspective (both home and away fixtures),
 * enriched with club logo and opponent logo where available.
 */
export function useMatchesByOrg(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["matches", "org", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      // 1. Get VIB team IDs for this org
      const { data: vibTeams, error: teamsError } = await supabase
        .from("teams")
        .select("id")
        .eq("organization_id", organizationId!)
        .like("external_api_id", "%:%");
      if (teamsError) throw teamsError;
      if (!vibTeams?.length) return [] as Match[];

      const teamIds = vibTeams.map((t) => t.id);

      // 2. Fetch matches + join team → org for club logo/name
      const { data: rows, error: matchError } = await supabase
        .from("matches")
        .select("*, teams(organizations(name, logo_url))")
        .in("team_id", teamIds)
        .order("match_date", { ascending: true });
      if (matchError) throw matchError;

      const matches = (rows ?? []) as any[];

      // 3. Collect unique opponent names and resolve their logos in one query
      const opponentNames = [...new Set(matches.map((m) => m.opponent as string))];
      let opponentLogoMap: Record<string, string> = {};
      if (opponentNames.length > 0) {
        const { data: opponentOrgs } = await supabase
          .from("organizations")
          .select("name, logo_url")
          .in("name", opponentNames);
        for (const o of opponentOrgs ?? []) {
          if (o.logo_url) opponentLogoMap[o.name] = o.logo_url;
        }
      }

      // 4. Shape output
      return matches.map((m) => ({
        ...m,
        team_logo_url:
          (m.teams as any)?.organizations?.logo_url ?? undefined,
        opponent_logo_url: opponentLogoMap[m.opponent] ?? undefined,
        teams: undefined,
      })) as Match[];
    },
  });
}

export function useCreateMatch(teamId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      opponent: string;
      is_home: boolean;
      match_date: string;
      location: string | null;
      type: string;
    }) => {
      if (!teamId) throw new Error("No team selected");
      const { error } = await supabase.from("matches").insert({
        team_id: teamId,
        opponent: input.opponent,
        is_home: input.is_home,
        match_date: input.match_date,
        location: input.location,
        type: input.type,
        status: "scheduled",
        source: "manual",
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches", teamId] }),
  });
}

export function useUpdateMatchScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, teamId, score_home, score_away }: {
      id: string; teamId: string; score_home: number; score_away: number;
    }) => {
      const { error } = await supabase
        .from("matches")
        .update({ score_home, score_away, status: "completed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { teamId }) => qc.invalidateQueries({ queryKey: ["matches", teamId] }),
  });
}

export function useDeleteMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, teamId }: { id: string; teamId: string }) => {
      const { error } = await supabase.from("matches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { teamId }) => qc.invalidateQueries({ queryKey: ["matches", teamId] }),
  });
}
