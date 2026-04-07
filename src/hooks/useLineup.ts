import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Lineup {
  id: string;
  team_id: string;
  match_id: string | null;
  formation: string;
  /** Ordered array of player_id|null, index = formation slot index */
  players: (string | null)[];
  substitute_ids: string[];
  created_at: string;
  updated_at: string;
}

export function useLineup(teamId: string | undefined, matchId: string | null) {
  return useQuery({
    queryKey: ["lineup", teamId, matchId],
    enabled: !!teamId && !!matchId,
    queryFn: async () => {
      console.log("[useLineup] fetching", { teamId, matchId });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("lineups")
        .select("id, team_id, match_id, formation, players, substitute_ids, created_at, updated_at")
        .eq("team_id", teamId!)
        .eq("match_id", matchId!)
        .maybeSingle();
      console.log("[useLineup] result", { data, error });
      if (error) throw error;
      return data as Lineup | null;
    },
  });
}

export function useUpsertLineup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      team_id: string;
      match_id: string;
      formation: string;
      players: (string | null)[];
      substitute_ids: string[];
    }) => {
      const payload = { ...input, updated_at: new Date().toISOString() };
      console.log("[useUpsertLineup] upserting", payload);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("lineups")
        .upsert(payload, { onConflict: "team_id,match_id" })
        .select();
      console.log("[useUpsertLineup] result", { data, error });
      if (error) throw error;
    },
    onSuccess: (_, { team_id, match_id }) => {
      qc.invalidateQueries({ queryKey: ["lineup", team_id, match_id] });
    },
    onError: (error) => {
      console.error("[useUpsertLineup] mutation error", error);
    },
  });
}
