import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardMatch {
  id: string;
  opponent: string;
  match_date: string;
  is_home: boolean;
  location: string | null;
  score_home: number | null;
  score_away: number | null;
}

export interface DashboardTraining {
  id: string;
  scheduled_at: string;
  location: string | null;
  notes: string | null;
}

export interface DashboardData {
  nextMatch: DashboardMatch | null;
  nextTraining: DashboardTraining | null;
  lastMatches: DashboardMatch[];
  balance: number | null;
  unpaidFinesCount: number;
  attendanceRate: number | null;
  attendancePresent: number;
  attendanceTotal: number;
}

export function useDashboard(
  teamId: string | undefined,
  organizationId: string | undefined,
) {
  return useQuery({
    queryKey: ["dashboard", teamId, organizationId],
    enabled: !!teamId,
    queryFn: async (): Promise<DashboardData> => {
      const now = new Date().toISOString();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString();

      // Resolve VIB team IDs for match queries.
      // VIB teams share the same organization_id as the user's onboarding team
      // and have external_api_id in "slug:compId" format.
      let matchTeamIds: string[] = [teamId!];
      if (organizationId) {
        const { data: vibTeams } = await supabase
          .from("teams")
          .select("id")
          .eq("organization_id", organizationId)
          .like("external_api_id", "%:%");
        if (vibTeams?.length) {
          matchTeamIds = vibTeams.map((t) => t.id);
        }
      }

      // Run independent queries in parallel
      const [
        nextMatchRes,
        nextTrainingRes,
        lastMatchesRes,
        treasuryRes,
        unpaidFinesRes,
        recentTrainingsRes,
      ] = await Promise.all([
        supabase
          .from("matches")
          .select("id, opponent, match_date, is_home, location, score_home, score_away")
          .in("team_id", matchTeamIds)
          .eq("status", "scheduled")
          .gte("match_date", now)
          .order("match_date")
          .limit(1)
          .maybeSingle(),

        supabase
          .from("trainings")
          .select("id, scheduled_at, location, notes")
          .eq("team_id", teamId!)
          .eq("status", "scheduled")
          .gte("scheduled_at", now)
          .order("scheduled_at")
          .limit(1)
          .maybeSingle(),

        supabase
          .from("matches")
          .select("id, opponent, match_date, is_home, location, score_home, score_away")
          .in("team_id", matchTeamIds)
          .eq("status", "completed")
          .order("match_date", { ascending: false })
          .limit(5),

        supabase
          .from("team_treasury")
          .select("total_collected, total_spent")
          .eq("team_id", teamId!)
          .maybeSingle(),

        supabase
          .from("fines")
          .select("id", { count: "exact", head: true })
          .eq("team_id", teamId!)
          .eq("is_paid", false)
          .gte("created_at", startOfMonth),

        // Get past trainings in last 30 days (IDs only) — exclude cancelled only,
        // "scheduled" is the default status and is never auto-updated to "completed"
        supabase
          .from("trainings")
          .select("id")
          .eq("team_id", teamId!)
          .neq("status", "cancelled")
          .gte("scheduled_at", thirtyDaysAgo)
          .lte("scheduled_at", now),
      ]);

      for (const res of [nextMatchRes, nextTrainingRes, lastMatchesRes, treasuryRes, unpaidFinesRes, recentTrainingsRes]) {
        if (res.error) throw res.error;
      }

      // Fetch attendance for those trainings (sequential, depends on previous result)
      const trainingIds = (recentTrainingsRes.data ?? []).map((t: { id: string }) => t.id);
      let attendanceRows: { status: string }[] = [];
      if (trainingIds.length > 0) {
        const { data, error } = await supabase
          .from("training_attendance")
          .select("status")
          .in("training_id", trainingIds);
        if (error) throw error;
        attendanceRows = data ?? [];
      }

      const attendanceTotal = attendanceRows.length;
      const attendancePresent = attendanceRows.filter(
        (a) => a.status === "present" || a.status === "late"
      ).length;
      const attendanceRate =
        attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : null;

      const treasury = treasuryRes.data;
      const balance =
        treasury != null
          ? treasury.total_collected - treasury.total_spent
          : null;

      return {
        nextMatch: nextMatchRes.data ?? null,
        nextTraining: nextTrainingRes.data ?? null,
        lastMatches: lastMatchesRes.data ?? [],
        balance,
        unpaidFinesCount: unpaidFinesRes.count ?? 0,
        attendanceRate,
        attendancePresent,
        attendanceTotal,
      };
    },
  });
}
