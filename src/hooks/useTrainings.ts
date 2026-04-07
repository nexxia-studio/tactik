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

/** Fetch present/absent counts for a list of training IDs in a single query */
export function useTrainingsAttendanceCounts(trainingIds: string[]) {
  const key = trainingIds.slice().sort().join(",");
  return useQuery({
    queryKey: ["trainings_attendance_counts", key],
    enabled: trainingIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_attendance")
        .select("training_id, status")
        .in("training_id", trainingIds);
      if (error) throw error;
      const counts: Record<string, { present: number; absent: number }> = {};
      for (const att of data ?? []) {
        if (!counts[att.training_id]) counts[att.training_id] = { present: 0, absent: 0 };
        if (att.status === "present" || att.status === "late") {
          counts[att.training_id].present++;
        } else {
          counts[att.training_id].absent++;
        }
      }
      return counts;
    },
  });
}

/** Team-level attendance rate over the last `days` days */
export function useTeamAttendanceRate(teamId: string | undefined, days = 30) {
  return useQuery({
    queryKey: ["team_attendance_rate", teamId, days],
    enabled: !!teamId,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      // 1. Trainings in window
      const { data: trainings, error: tErr } = await supabase
        .from("trainings")
        .select("id")
        .eq("team_id", teamId!)
        .gte("scheduled_at", since.toISOString())
        .lte("scheduled_at", new Date().toISOString());
      if (tErr) throw tErr;
      if (!trainings?.length) return { rate: null, presences: 0, sessions: 0 };

      const trainingIds = trainings.map((t) => t.id);

      // 2. Attendance + player count in parallel
      // players has no team_id column — membership is via team_members
      const [{ data: attendance, error: aErr }, { data: members, error: pErr }] =
        await Promise.all([
          supabase
            .from("training_attendance")
            .select("status")
            .in("training_id", trainingIds),
          supabase
            .from("team_members")
            .select("player_id")
            .eq("team_id", teamId!)
            .eq("role", "player")
            .not("player_id", "is", null),
        ]);
      if (aErr) throw aErr;
      if (pErr) throw pErr;

      const presences = (attendance ?? []).filter(
        (a) => a.status === "present" || a.status === "late",
      ).length;
      const sessions = trainingIds.length;
      const playerCount = (members ?? []).length;
      const total = playerCount * sessions;
      const rate = total > 0
        ? Math.round((presences / total) * 1000) / 10  // 1 decimal
        : null;

      return { rate, presences, sessions };
    },
  });
}

export interface AttendanceChartPoint {
  date: string;         // ISO — for sorting
  label: string;        // "DD/MM" — X axis
  presentCount: number;
  totalPlayers: number;
  percentage: number;
}

/** Per-session attendance chart data for the last `days` days */
export function useAttendanceChartData(teamId: string | undefined, days = 30) {
  return useQuery({
    queryKey: ["attendance_chart", teamId, days],
    enabled: !!teamId,
    queryFn: async (): Promise<AttendanceChartPoint[]> => {
      const now = new Date();
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // 1. Trainings in window + team members count in parallel
      const [{ data: trainings, error: tErr }, { data: members, error: mErr }] =
        await Promise.all([
          supabase
            .from("trainings")
            .select("id, scheduled_at")
            .eq("team_id", teamId!)
            .neq("status", "cancelled")
            .gte("scheduled_at", since.toISOString())
            .lte("scheduled_at", now.toISOString())
            .order("scheduled_at"),
          supabase
            .from("team_members")
            .select("player_id")
            .eq("team_id", teamId!)
            .eq("role", "player")
            .not("player_id", "is", null),
        ]);
      if (tErr) throw tErr;
      if (mErr) throw mErr;
      if (!trainings?.length) return [];

      const totalPlayers = (members ?? []).length;
      const trainingIds = trainings.map((t) => t.id);

      // 2. Attendance for all those trainings
      const { data: attendance, error: aErr } = await supabase
        .from("training_attendance")
        .select("training_id, status")
        .in("training_id", trainingIds);
      if (aErr) throw aErr;

      const presentByTraining: Record<string, number> = {};
      for (const att of attendance ?? []) {
        if (att.status === "present" || att.status === "late") {
          presentByTraining[att.training_id] = (presentByTraining[att.training_id] ?? 0) + 1;
        }
      }

      return trainings.map((t) => {
        const presentCount = presentByTraining[t.id] ?? 0;
        const label = new Date(t.scheduled_at).toLocaleDateString("fr-BE", {
          day: "2-digit", month: "2-digit",
        });
        const percentage =
          totalPlayers > 0 ? Math.round((presentCount / totalPlayers) * 100) : 0;
        return { date: t.scheduled_at, label, presentCount, totalPlayers, percentage };
      });
    },
  });
}

/** Fetch presence counts per player across a set of trainings (for stats table) */
export function usePlayerAttendanceStats(trainingIds: string[]) {
  const key = trainingIds.slice().sort().join(",");
  return useQuery({
    queryKey: ["player_attendance_stats", key],
    enabled: trainingIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_attendance")
        .select("player_id, status")
        .in("training_id", trainingIds);
      if (error) throw error;
      const presences: Record<string, number> = {};
      for (const att of data ?? []) {
        if (att.status === "present" || att.status === "late") {
          presences[att.player_id] = (presences[att.player_id] ?? 0) + 1;
        }
      }
      return presences; // player_id → present count
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
    onSuccess: (_, { training_id }) => {
      qc.invalidateQueries({ queryKey: ["training_attendance", training_id] });
      qc.invalidateQueries({ queryKey: ["trainings_attendance_counts"] });
      qc.invalidateQueries({ queryKey: ["player_attendance_stats"] });
    },
  });
}

export function useDeleteAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ training_id, player_id }: { training_id: string; player_id: string }) => {
      const { error } = await supabase
        .from("training_attendance")
        .delete()
        .eq("training_id", training_id)
        .eq("player_id", player_id);
      if (error) throw error;
    },
    onSuccess: (_, { training_id }) => {
      qc.invalidateQueries({ queryKey: ["training_attendance", training_id] });
      qc.invalidateQueries({ queryKey: ["trainings_attendance_counts"] });
      qc.invalidateQueries({ queryKey: ["player_attendance_stats"] });
    },
  });
}
