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

export interface TrainingAttendance {
  id: string;
  training_id: string;
  player_id: string;
  status: string; // 'present' | 'absent' | 'excused' | 'late'
  note: string | null;
  created_at: string;
  players: { full_name: string; shirt_number: number | null } | null;
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

export function useTraining(id: string | undefined) {
  return useQuery({
    queryKey: ["training", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainings")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Training;
    },
  });
}

export function useTrainingAttendance(trainingId: string | undefined) {
  return useQuery({
    queryKey: ["training_attendance", trainingId],
    enabled: !!trainingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_attendance")
        .select("*, players(full_name, shirt_number)")
        .eq("training_id", trainingId!);
      if (error) throw error;
      return data as TrainingAttendance[];
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

export function useUpdateTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes, status }: { id: string; notes?: string | null; status?: string }) => {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (notes !== undefined) patch.notes = notes;
      if (status !== undefined) patch.status = status;
      const { error } = await supabase.from("trainings").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["training", id] });
      qc.invalidateQueries({ queryKey: ["trainings"] });
    },
  });
}

export function useUpsertAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      training_id,
      player_id,
      status,
    }: {
      training_id: string;
      player_id: string;
      status: string;
    }) => {
      const { error } = await supabase
        .from("training_attendance")
        .upsert({ training_id, player_id, status }, { onConflict: "training_id,player_id" });
      if (error) throw error;
    },
    onSuccess: (_, { training_id }) =>
      qc.invalidateQueries({ queryKey: ["training_attendance", training_id] }),
  });
}
