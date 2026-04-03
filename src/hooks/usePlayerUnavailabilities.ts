import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlayerUnavailability {
  id: string;
  player_id: string;
  team_id: string;
  start_date: string; // ISO date "YYYY-MM-DD"
  end_date: string;
  reason: "injury" | "vacation" | "personal" | "other";
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

/** All unavailabilities for a player */
export function usePlayerUnavailabilities(playerId: string | undefined) {
  return useQuery({
    queryKey: ["player-unavailabilities", playerId],
    enabled: !!playerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_unavailabilities")
        .select("*")
        .eq("player_id", playerId!)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as PlayerUnavailability[];
    },
  });
}

/** Active unavailabilities for an entire team on a given date (used in PresencePage) */
export function useActiveUnavailabilities(teamId: string | undefined, date: string) {
  return useQuery({
    queryKey: ["player-unavailabilities", "active", teamId, date],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_unavailabilities")
        .select("*")
        .eq("team_id", teamId!)
        .lte("start_date", date)
        .gte("end_date", date);
      if (error) throw error;
      return data as PlayerUnavailability[];
    },
  });
}

export function useCreateUnavailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      player_id: string;
      team_id: string;
      start_date: string;
      end_date: string;
      reason: PlayerUnavailability["reason"];
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("player_unavailabilities").insert({
        ...input,
        notes: input.notes || null,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_, { player_id, team_id }) => {
      qc.invalidateQueries({ queryKey: ["player-unavailabilities", player_id] });
      qc.invalidateQueries({ queryKey: ["player-unavailabilities", "active", team_id] });
    },
  });
}

export function useDeleteUnavailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; player_id: string; team_id: string }) => {
      const { error } = await supabase
        .from("player_unavailabilities")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { player_id, team_id }) => {
      qc.invalidateQueries({ queryKey: ["player-unavailabilities", player_id] });
      qc.invalidateQueries({ queryKey: ["player-unavailabilities", "active", team_id] });
    },
  });
}
