import { usePlayers } from "@/hooks/usePlayers";
import { useTeamStats } from "@/hooks/useTeamStats";
import { useActiveTeam } from "@/contexts/TeamContext";
import { TeamStatsOverview } from "@/components/stats/TeamStatsOverview";
import { PlayerStatsTable } from "@/components/stats/PlayerStatsTable";

export default function Statistics() {
  const { activeTeamId: teamId } = useActiveTeam();
  const { data: players, isLoading: playersLoading } = usePlayers(teamId);
  const { data: teamStats, isLoading: statsLoading } = useTeamStats(teamId);

  const isLoading = playersLoading || statsLoading || !teamId;

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

      <TeamStatsOverview stats={teamStats} isLoading={isLoading} />

      <PlayerStatsTable
        players={players ?? []}
        playerStats={teamStats?.playerStats ?? {}}
        isLoading={isLoading}
      />
    </div>
  );
}
