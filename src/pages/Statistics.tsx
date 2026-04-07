import { usePlayers } from "@/hooks/usePlayers";
import { useTeamStats } from "@/hooks/useTeamStats";
import { useActiveTeam } from "@/contexts/TeamContext";
import { TeamStatsOverview } from "@/components/stats/TeamStatsOverview";
import { PlayerStatsTable } from "@/components/stats/PlayerStatsTable";
import { AttendanceBarChart } from "@/components/stats/AttendanceBarChart";
import { useAttendanceChartData } from "@/hooks/useTrainings";
import { Dumbbell } from "lucide-react";

export default function Statistics() {
  const { activeTeamId: teamId, activeTeam } = useActiveTeam();
  const { data: players, isLoading: playersLoading } = usePlayers(teamId);
  const { data: teamStats, isLoading: statsLoading } = useTeamStats(teamId, activeTeam?.organization_id);

  const isLoading = playersLoading || statsLoading || !teamId;
  const { data: chartData = [], isLoading: chartLoading } = useAttendanceChartData(teamId);

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="font-display text-t-primary leading-none"
          style={{ fontSize: "var(--text-h1)" }}
        >
          STATISTIQUES
        </h1>
        <p className="text-t-secondary font-ui text-[var(--text-small)] mt-2">
          Vue d'ensemble de la saison 2025-2026.
        </p>
      </div>

      <TeamStatsOverview teamId={teamId} stats={teamStats} isLoading={isLoading} />

      {/* Attendance chart */}
      <div className="bg-bg-surface-1 border border-b-subtle rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Dumbbell className="h-4 w-4 text-primary" />
          <span className="text-label">PRÉSENCE AUX ENTRAÎNEMENTS</span>
          <span className="ml-auto font-ui text-[11px] text-t-muted">30 derniers jours</span>
        </div>
        <AttendanceBarChart data={chartData} loading={chartLoading} />
      </div>

      <PlayerStatsTable
        players={players ?? []}
        playerStats={teamStats?.playerStats ?? {}}
        isLoading={isLoading}
      />
    </div>
  );
}
