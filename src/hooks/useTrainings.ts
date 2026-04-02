import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Training {
  id: string;
  team_id: string;
  season_id: string | null;
  scheduled_at: string;
  location: string | null;
  status: string; // 'scheduled' | 'completed' | 'cancelled'
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useTrainings(teamId: string | undefined) {
  return useQuery({
    queryKey: ["trainings", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainings")
        .select("*")
        .eq("team_id", teamId!)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data as Training[];
    },
  });
}

export function useCreateTraining(teamId: string | undefined, seasonId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { scheduled_at: string; location: string; notes: string | null }) => {
      if (!teamId) throw new Error("No team selected");
      const { error } = await supabase.from("trainings").insert({
        team_id: teamId,
        season_id: seasonId ?? null,
        scheduled_at: input.scheduled_at,
        location: input.location || null,
        notes: input.notes || null,
        status: "scheduled",
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trainings", teamId] }),
  });
}
