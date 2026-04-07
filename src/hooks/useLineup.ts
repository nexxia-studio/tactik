import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Lineup {
  id: string;
  team_id: string;
  match_id: string | null;
  formation: string;
  slots: (string | null)[];
  substitute_ids: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useLineup(teamId: string | undefined, matchId: string | null) {
  return useQuery({
    queryKey: ["lineup", teamId, matchId],
    enabled: !!teamId && !!matchId,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("lineups")
        .select("*")
        .eq("team_id", teamId!)
        .eq("match_id", matchId!)
        .maybeSingle();
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
      slots: (string | null)[];
      substitute_ids: string[];
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("lineups")
        .upsert(
          { ...input, updated_at: new Date().toISOString() },
          { onConflict: "team_id,match_id" }
        );
      if (error) throw error;
    },
    onSuccess: (_, { team_id, match_id }) => {
      qc.invalidateQueries({ queryKey: ["lineup", team_id, match_id] });
    },
  });
}
