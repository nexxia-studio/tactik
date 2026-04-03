import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrainingExercise {
  id: string;
  section_id: string;
  training_id: string;
  name: string;
  duration_minutes: number | null;
  material: string | null;
  notes: string | null;
  position: number;
  created_at: string;
}

export interface TrainingSection {
  id: string;
  training_id: string;
  name: string;
  position: number;
  created_at: string;
  training_exercises: TrainingExercise[];
}

/** Fetch all sections (with nested exercises) for a training, ordered by position */
export function useTrainingSections(trainingId: string | undefined) {
  return useQuery({
    queryKey: ["training-sections", trainingId],
    enabled: !!trainingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_sections")
        .select("*, training_exercises(*)")
        .eq("training_id", trainingId!)
        .order("position", { ascending: true });
      if (error) throw error;
      // Sort exercises by position within each section
      return (data as TrainingSection[]).map((s) => ({
        ...s,
        training_exercises: [...(s.training_exercises ?? [])].sort(
          (a, b) => a.position - b.position
        ),
      }));
    },
  });
}

const DEFAULT_SECTIONS = ["Échauffement", "Partie Technique", "Partie Tactique", "Match"];

/** Insert the 4 default sections for a training */
export function useInitDefaultSections(trainingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const rows = DEFAULT_SECTIONS.map((name, position) => ({
        training_id: trainingId,
        name,
        position,
      }));
      const { error } = await supabase.from("training_sections").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training-sections", trainingId] }),
  });
}

export function useCreateSection(trainingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, position }: { name: string; position: number }) => {
      const { error } = await supabase
        .from("training_sections")
        .insert({ training_id: trainingId, name, position });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training-sections", trainingId] }),
  });
}

export function useUpdateSection(trainingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("training_sections")
        .update({ name })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training-sections", trainingId] }),
  });
}

export function useDeleteSection(trainingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("training_sections")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training-sections", trainingId] }),
  });
}

export function useCreateExercise(trainingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      section_id: string;
      name: string;
      duration_minutes: number | null;
      material: string | null;
      notes: string | null;
      position: number;
    }) => {
      const { error } = await supabase
        .from("training_exercises")
        .insert({ ...input, training_id: trainingId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training-sections", trainingId] }),
  });
}

export function useUpdateExercise(trainingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      duration_minutes: number | null;
      material: string | null;
      notes: string | null;
    }) => {
      const { error } = await supabase
        .from("training_exercises")
        .update({
          name: input.name,
          duration_minutes: input.duration_minutes,
          material: input.material,
          notes: input.notes,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training-sections", trainingId] }),
  });
}

export function useDeleteExercise(trainingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("training_exercises")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training-sections", trainingId] }),
  });
}
