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
