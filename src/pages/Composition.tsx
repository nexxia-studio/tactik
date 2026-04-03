import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FORMATIONS, FORMATION_KEYS } from "@/components/composition/formations";
import { type FUTPlayer, type PlayerStatus, getPositionCategory } from "@/components/composition/mockPlayers";
import { PitchView, computeChemScore } from "@/components/composition/PitchView";
import { SquadList } from "@/components/composition/SquadList";
import { ChemistryScoreRing } from "@/components/composition/ChemistryScoreRing";
import { MatchSelector, type CompositionMatch } from "@/components/composition/MatchSelector";
import { Send, Save } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useActiveTeam } from "@/contexts/TeamContext";
import { usePlayers } from "@/hooks/usePlayers";
import { useMatches } from "@/hooks/useMatches";
import type { Player } from "@/hooks/usePlayers";

const MAX_SUBSTITUTES = 4;

function mapPositionToFUT(pos: string | null): string {
  switch (pos) {
    case "Gardien":   return "GK";
    case "Défenseur": return "CB";
    case "Milieu":    return "CM";
    case "Attaquant": return "ST";
    default:          return "CM";
  }
}

function mapPlayerToFUT(player: Player): FUTPlayer {
  const parts = player.full_name.split(" ");
  return {
    id: player.id,
    firstName: parts[0] ?? player.full_name,
    lastName: parts.slice(1).join(" ") || "",
    position: mapPositionToFUT(player.position_preferred ?? null),
    jerseyNumber: player.shirt_number ?? 0,
    rating: 70,
    pace: 60, shooting: 60, passing: 60, dribbling: 60, defending: 60, physical: 60,
    avatarUrl: player.avatar_url ?? undefined,
    status: "available",
  };
}

function getSlotFillingOrder(formation: typeof FORMATIONS[string]): number[] {
  const slots = formation.positions.map((pos, idx) => ({
    idx,
    cat: getPositionCategory(pos.label),
    x: pos.x,
  }));
  const catOrder = ["GK", "DEF", "MID", "ATT"];
  slots.sort((a, b) => {
    const catDiff = catOrder.indexOf(a.cat) - catOrder.indexOf(b.cat);
    if (catDiff !== 0) return catDiff;
    return b.x - a.x;
  });
  return slots.map((s) => s.idx);
}

export default function Composition() {
  const navigate = useNavigate();
  const { activeTeamId: teamId } = useActiveTeam();

  const { data: rawPlayers = [] } = usePlayers(teamId);
  const { data: rawMatches = [] } = useMatches(teamId);

  const futPlayers = useMemo(() => rawPlayers.map(mapPlayerToFUT), [rawPlayers]);

  const compositionMatches = useMemo<CompositionMatch[]>(() =>
    rawMatches.map((m) => ({
      id: m.id,
      opponent: m.opponent,
      date: m.match_date,
      is_home: m.is_home,
      played: m.score_home !== null,
      type: m.type as "championship" | "friendly" | "cup",
    })),
    [rawMatches]
  );

  const [selectedFormation, setSelectedFormation] = useState("4-3-3");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const formation = FORMATIONS[selectedFormation];

  const selectedMatch = selectedMatchId
    ? compositionMatches.find((m) => m.id === selectedMatchId) ?? null
    : null;
  const isReadonly = selectedMatch?.played ?? false;
  const isFriendly = selectedMatch?.type === "friendly";

  const [assignedIds, setAssignedIds] = useState<(string | null)[]>([]);
  const [substituteIds, setSubstituteIds] = useState<string[]>([]);
  const [playerStatuses, setPlayerStatuses] = useState<Record<string, PlayerStatus>>({});
  const [initialized, setInitialized] = useState(false);

  // Initialize state from real players on first load
  useEffect(() => {
    if (initialized || futPlayers.length === 0) return;
    const available = futPlayers.filter((p) => p.status === "available");
    const slots = formation.positions.length;
    const ids = available.slice(0, slots).map((p) => p.id);
    while (ids.length < slots) ids.push(null as any);
    setAssignedIds(ids);
    setSubstituteIds(available.slice(slots, slots + MAX_SUBSTITUTES).map((p) => p.id));
    const statuses: Record<string, PlayerStatus> = {};
    futPlayers.forEach((p) => { statuses[p.id] = p.status; });
    setPlayerStatuses(statuses);
    setInitialized(true);
  }, [futPlayers, initialized, formation.positions.length]);

  const playersWithStatus = useMemo(
    () => futPlayers.map((p) => ({ ...p, status: playerStatuses[p.id] ?? p.status })),
    [futPlayers, playerStatuses]
  );

  const playerMap = useMemo(() => new Map(playersWithStatus.map((p) => [p.id, p])), [playersWithStatus]);

  const assignedPlayers: (FUTPlayer | null)[] = formation.positions.map(
    (_, i) => (assignedIds[i] ? playerMap.get(assignedIds[i]!) ?? null : null)
  );

  const chemScore = useMemo(() => computeChemScore(formation, assignedPlayers), [formation, assignedPlayers]);
  const fillingOrder = useMemo(() => getSlotFillingOrder(formation), [formation]);

  const addPlayer = useCallback(
    (playerId: string) => {
      if (isReadonly) return;
      const player = playerMap.get(playerId);
      if (!player) return;
      setAssignedIds((prev) => {
        if (prev.includes(playerId)) return prev;
        const next = [...prev];
        while (next.length < formation.positions.length) next.push(null);
        const playerCat = getPositionCategory(player.position);
        for (const slotIdx of fillingOrder) {
          if (next[slotIdx] !== null) continue;
          const slotCat = getPositionCategory(formation.positions[slotIdx].label);
          if (slotCat === playerCat) { next[slotIdx] = playerId; return next; }
        }
        for (const slotIdx of fillingOrder) {
          if (next[slotIdx] === null) { next[slotIdx] = playerId; return next; }
        }
        return prev;
      });
      setSubstituteIds((prev) => prev.filter((id) => id !== playerId));
    },
    [playerMap, formation, fillingOrder, isReadonly]
  );

  const toggleSubstitute = useCallback((playerId: string) => {
    if (isReadonly) return;
    setSubstituteIds((prev) => {
      if (prev.includes(playerId)) return prev.filter((id) => id !== playerId);
      if (prev.length >= MAX_SUBSTITUTES) return prev;
      return [...prev, playerId];
    });
  }, [isReadonly]);

  const changePlayerStatus = useCallback((playerId: string, status: PlayerStatus) => {
    if (isReadonly) return;
    setPlayerStatuses((prev) => ({ ...prev, [playerId]: status }));
    if (status !== "available") {
      setAssignedIds((prev) => {
        const idx = prev.indexOf(playerId);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = null;
        return next;
      });
      setSubstituteIds((prev) => prev.filter((id) => id !== playerId));
    }
  }, [isReadonly]);

  const removePlayer = useCallback((playerId: string) => {
    if (isReadonly) return;
    setAssignedIds((prev) => {
      const idx = prev.indexOf(playerId);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = null;
      return next;
    });
  }, [isReadonly]);

  const swapSlots = useCallback((fromSlot: number, toSlot: number) => {
    if (isReadonly) return;
    setAssignedIds((prev) => {
      const next = [...prev];
      while (next.length <= Math.max(fromSlot, toSlot)) next.push(null);
      [next[fromSlot], next[toSlot]] = [next[toSlot], next[fromSlot]];
      return next;
    });
  }, [isReadonly]);

  const placeBenchPlayer = useCallback((playerId: string, toSlot: number) => {
    if (isReadonly) return;
    setAssignedIds((prev) => {
      const next = [...prev];
      while (next.length <= toSlot) next.push(null);
      const oldSlot = next.indexOf(playerId);
      if (oldSlot !== -1) next[oldSlot] = null;
      next[toSlot] = playerId;
      return next;
    });
    setSubstituteIds((prev) => prev.filter((id) => id !== playerId));
  }, [isReadonly]);

  const handleFormationChange = (key: string) => {
    if (isReadonly) return;
    setSelectedFormation(key);
    const newSize = FORMATIONS[key].positions.length;
    setAssignedIds((prev) => {
      const next = [...prev];
      while (next.length < newSize) next.push(null);
      return next.slice(0, newSize);
    });
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 min-w-0">
          <div className="min-w-0">
            <h1 className="font-display text-t-primary leading-none" style={{ fontSize: "var(--text-h1)" }}>
              COMPOSITION
            </h1>
            <p className="text-t-secondary font-ui text-[var(--text-small)] mt-2 truncate">
              Clique sur un joueur pour le placer
            </p>
          </div>

          <MatchSelector selectedMatchId={selectedMatchId} onSelect={setSelectedMatchId} matches={compositionMatches} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            {isReadonly && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-ui text-[var(--text-small)] uppercase tracking-wider bg-[var(--color-danger)]/15 text-[var(--color-danger)] border border-[var(--color-danger)]/20">
                Match joué
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {FORMATION_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => handleFormationChange(key)}
                disabled={isReadonly}
                className={`px-3 py-1.5 rounded-lg font-ui text-[12px] transition-all ${
                  selectedFormation === key
                    ? "bg-primary text-primary-text font-semibold"
                    : "bg-bg-surface-2 text-t-secondary hover:bg-bg-surface-3 hover:text-t-primary border border-b-subtle"
                } ${isReadonly ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        {/* Pitch + save button */}
        <div className="lg:col-span-2 space-y-4">
          <PitchView
            formation={formation}
            players={assignedPlayers}
            onSwapSlots={swapSlots}
            onDropBenchPlayer={placeBenchPlayer}
            onRemovePlayer={removePlayer}
            readonly={isReadonly}
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <button
                    disabled={!selectedMatchId || isReadonly}
                    onClick={() => toast.success("Composition sauvegardée ✓")}
                    className="w-full py-3 rounded-xl font-ui text-[var(--text-body)] uppercase tracking-wider bg-bg-surface-2 text-t-primary border border-b-subtle hover:bg-bg-surface-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Sauvegarder
                  </button>
                </div>
              </TooltipTrigger>
              {isReadonly && (
                <TooltipContent className="bg-bg-surface-2 border-b-subtle font-ui text-[var(--text-small)]">
                  Match déjà joué
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-bg-surface-1 border border-b-subtle rounded-xl p-6 flex flex-col items-center gap-4">
            <span className="font-ui text-[var(--text-label)] text-t-muted uppercase tracking-wider">Score chimie</span>
            <ChemistryScoreRing score={chemScore} />
          </div>

          <button
            disabled={!selectedMatchId}
            onClick={() => {
              const match = compositionMatches.find((m) => m.id === selectedMatchId);
              if (match) navigate(`/communication?opponent=${encodeURIComponent(match.opponent)}`);
            }}
            className="w-full py-3 rounded-xl font-ui text-[var(--text-body)] uppercase tracking-wider bg-primary text-primary-text hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Envoyer vers Communication
          </button>

          <SquadList
            allPlayers={playersWithStatus}
            assignedIds={assignedIds}
            substituteIds={substituteIds}
            onAddPlayer={addPlayer}
            onRemovePlayer={removePlayer}
            onToggleSubstitute={toggleSubstitute}
            onChangeStatus={changePlayerStatus}
            maxSubstitutes={MAX_SUBSTITUTES}
            positionLabels={formation.positions.map((p) => p.label)}
            isFriendly={isFriendly}
          />
        </div>
      </div>
    </div>
  );
}
