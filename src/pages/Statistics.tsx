import { usePlayers, useTeams } from "@/hooks/usePlayers";
import { TeamStatsOverview } from "@/components/stats/TeamStatsOverview";
import { PlayerStatsTable } from "@/components/stats/PlayerStatsTable";

export default function Statistics() {
  const { data: teams } = useTeams();
  const selectedTeamId = teams?.[0]?.id;
  const { data: players, isLoading } = usePlayers(selectedTeamId);

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Team overview */}
      <TeamStatsOverview />

      {/* Player stats */}
      <PlayerStatsTable players={players || []} isLoading={isLoading} />
    </div>
  );
}
