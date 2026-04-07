import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SquadAvailability {
  available: number;
  unavailable: number;
  total: number;
}

export function useSquadAvailability(teamId: string | undefined) {
  return useQuery({
    queryKey: ["squad_availability", teamId],
    enabled: !!teamId,
    queryFn: async (): Promise<SquadAvailability> => {
      const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

      const [{ data: members, error: mErr }, { data: unavailable, error: uErr }] =
        await Promise.all([
          supabase
            .from("team_members")
            .select("player_id")
            .eq("team_id", teamId!)
            .eq("role", "player")
            .not("player_id", "is", null),
          supabase
            .from("player_unavailabilities")
            .select("player_id")
            .eq("team_id", teamId!)
            .lte("start_date", today)
            .gte("end_date", today),
        ]);
      if (mErr) throw mErr;
      if (uErr) throw uErr;

      const total = (members ?? []).length;
      const unavailableCount = (unavailable ?? []).length;

      return {
        total,
        unavailable: unavailableCount,
        available: total - unavailableCount,
      };
    },
  });
}
