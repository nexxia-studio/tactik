import { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
import { useMatchesByOrg } from "@/hooks/useMatches";
import { useActiveUnavailabilities } from "@/hooks/usePlayerUnavailabilities";
import { useLineup, useUpsertLineup } from "@/hooks/useLineup";
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
  const firstName = player.first_name ?? player.full_name.split(" ")[0] ?? "";
  const lastName  = player.last_name  ?? player.full_name.split(" ").slice(1).join(" ") ?? "";
  return {
    id: player.id,
    firstName,
    lastName,
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
  const { activeTeamId: teamId, activeTeam } = useActiveTeam();

  const { data: rawPlayers = [] } = usePlayers(teamId);
  const { data: rawMatches = [] } = useMatchesByOrg(activeTeam?.organization_id);

  const futPlayers = useMemo(() => rawPlayers.map(mapPlayerToFUT), [rawPlayers]);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

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

  const [selectedFormation, setSelectedFormation] = useState("4-3-3 défensif");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const formation = FORMATIONS[selectedFormation];

  const selectedMatch = selectedMatchId
    ? compositionMatches.find((m) => m.id === selectedMatchId) ?? null
    : null;
  const isReadonly = selectedMatch?.played ?? false;
  const isFriendly = selectedMatch?.type === "friendly";

  // Use match date when selected, otherwise fall back to today so "Blessés" always reflects current unavailabilities
  const selectedMatchDateISO = selectedMatch?.date ?? today;
  const { data: activeUnavailabilities = [] } = useActiveUnavailabilities(teamId, selectedMatchDateISO);
  const dbUnavailableIds = useMemo(
    () => new Set(activeUnavailabilities.map((u) => u.player_id)),
    [activeUnavailabilities]
  );
  // Stable key to detect actual changes in the unavailable set
  const dbUnavailableKey = useMemo(
    () => activeUnavailabilities.map((u) => u.player_id).sort().join(","),
    [activeUnavailabilities]
  );

  const [assignedIds, setAssignedIds] = useState<(string | null)[]>([]);
  const [substituteIds, setSubstituteIds] = useState<string[]>([]);
  const [playerStatuses, setPlayerStatuses] = useState<Record<string, PlayerStatus>>({});
  const [overriddenDbIds, setOverriddenDbIds] = useState<Set<string>>(new Set());
  // readyMatchId: the match whose lineup is currently loaded in state (gates auto-save)
  const [readyMatchId, setReadyMatchId] = useState<string | null>(null);
  const [statusInitialized, setStatusInitialized] = useState(false);
  const autoSelectedRef = useRef(false);
  // Tracks which matchId has already been loaded — prevents re-loading from DB
  // after the first upsert changes lineupData.id (undefined → uuid), which would
  // overwrite in-progress user state.
  const initialLoadDoneRef = useRef<string | null>(null);
  const upsertLineup = useUpsertLineup();

  // Auto-select the next upcoming match on first load
  useEffect(() => {
    if (autoSelectedRef.current || compositionMatches.length === 0) return;
    const nextMatch = compositionMatches
      .filter((m) => !m.played && m.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (nextMatch) {
      setSelectedMatchId(nextMatch.id);
      autoSelectedRef.current = true;
    }
  }, [compositionMatches, today]);

  // When DB-unavailable set changes, kick those players off pitch and bench
  useEffect(() => {
    if (!dbUnavailableKey) return;
    setAssignedIds((prev) => prev.map((id) => (id && dbUnavailableIds.has(id) ? null : id)));
    setSubstituteIds((prev) => prev.filter((id) => !dbUnavailableIds.has(id)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbUnavailableKey]);

  // Initialize player statuses once (does NOT touch assignedIds — that comes from lineup)
  useEffect(() => {
    if (statusInitialized || futPlayers.length === 0) return;
    const statuses: Record<string, PlayerStatus> = {};
    futPlayers.forEach((p) => { statuses[p.id] = p.status; });
    setPlayerStatuses(statuses);
    setStatusInitialized(true);
  }, [futPlayers, statusInitialized]);

  // Reset when match changes — clear pitch/bench and disable auto-save gate
  useEffect(() => {
    initialLoadDoneRef.current = null;
    setReadyMatchId(null);
    setOverriddenDbIds(new Set());
    setAssignedIds([]);
    setSubstituteIds([]);
  }, [selectedMatchId]);

  // Fetch persisted lineup for the selected match
  const { data: lineupData, isSuccess: lineupLoaded } = useLineup(teamId, selectedMatchId);

  // Load lineup into state once per match selection, then open the save gate.
  // We guard with initialLoadDoneRef so that subsequent re-fetches triggered by
  // invalidateQueries after an upsert do NOT overwrite in-progress user changes.
  useEffect(() => {
    if (!selectedMatchId || !lineupLoaded) return;
    if (initialLoadDoneRef.current === selectedMatchId) return;
    initialLoadDoneRef.current = selectedMatchId;
    if (lineupData) {
      setSelectedFormation(lineupData.formation);
      setAssignedIds(lineupData.players);
      setSubstituteIds(lineupData.substitute_ids);
    }
    // Open save gate after state is committed — React 18 batches the above
    setReadyMatchId(selectedMatchId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineupLoaded, lineupData?.id, selectedMatchId]);

  // Auto-save (1s debounce) — only fires when readyMatchId === selectedMatchId
  useEffect(() => {
    if (!teamId || !selectedMatchId || readyMatchId !== selectedMatchId || isReadonly) return;
    const timer = setTimeout(() => {
      upsertLineup.mutate({
        team_id: teamId,
        match_id: selectedMatchId,
        formation: selectedFormation,
        players: assignedIds,
        substitute_ids: substituteIds,
      });
    }, 1000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedIds, substituteIds, selectedFormation, readyMatchId]);

  const playersWithStatus = useMemo(
    () => futPlayers.map((p) => {
      const manualStatus = playerStatuses[p.id] ?? p.status;
      const forceInjured = dbUnavailableIds.has(p.id) && !overriddenDbIds.has(p.id);
      return { ...p, status: (forceInjured ? "injured" : manualStatus) as PlayerStatus };
    }),
    [futPlayers, playerStatuses, dbUnavailableIds, overriddenDbIds]
  );

  // DB unavailabilities that have NOT been overridden — passed to SquadList for confirmation dialog
  const activeDbUnavailabilities = useMemo(
    () => activeUnavailabilities.filter((u) => !overriddenDbIds.has(u.player_id)),
    [activeUnavailabilities, overriddenDbIds]
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

  // Override a DB-enforced unavailability for this composition session only
  const confirmDbOverride = useCallback((playerId: string, status: PlayerStatus) => {
    if (isReadonly) return;
    setOverriddenDbIds((prev) => new Set([...prev, playerId]));
    setPlayerStatuses((prev) => ({ ...prev, [playerId]: status }));
    if (status !== "available") {
      setAssignedIds((prev) => prev.map((id) => (id === playerId ? null : id)));
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
    <div className="flex flex-col gap-4 pb-20 lg:pb-0 lg:gap-3 lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="font-display text-t-primary leading-none" style={{ fontSize: "var(--text-h1)" }}>
          COMPOSITION
        </h1>
        <p className="text-t-secondary font-ui text-[var(--text-small)] mt-1">
          Sélectionne un match et compose ton XI
        </p>
      </div>

      {/* Main grid — fills remaining height on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:flex-1 lg:min-h-0 lg:grid-rows-1">

        {/* Left col — pitch + controls */}
        <div className="lg:col-span-2 flex flex-col gap-3 min-w-0 lg:min-h-0">

          {/* Pitch — flex-1 on desktop so it fills available height */}
          <div className="lg:flex-1 lg:min-h-0">
            <PitchView
              formation={formation}
              players={assignedPlayers}
              onSwapSlots={swapSlots}
              onDropBenchPlayer={placeBenchPlayer}
              onRemovePlayer={removePlayer}
              readonly={isReadonly}
              className="lg:h-full lg:w-auto"
            />
          </div>

          {/* Formation selector */}
          <div className="shrink-0 flex items-center justify-between gap-3 flex-wrap">
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

          {/* Match selector + save */}
          <div className="shrink-0 space-y-3">
            <MatchSelector selectedMatchId={selectedMatchId} onSelect={setSelectedMatchId} matches={compositionMatches} />
            {rawMatches.length > 0 && compositionMatches.filter((m) => !m.played && m.date >= today).length === 0 && (
              <p className="font-ui text-[var(--text-small)] text-t-muted">
                Aucun match à venir — seuls les matchs passés sont disponibles.
              </p>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <button
                      disabled={!selectedMatchId || isReadonly}
                      onClick={() => {
                        if (!teamId || !selectedMatchId) return;
                        upsertLineup.mutate(
                          { team_id: teamId, match_id: selectedMatchId, formation: selectedFormation, players: assignedIds, substitute_ids: substituteIds },
                          { onSuccess: () => toast.success("Composition sauvegardée ✓") }
                        );
                      }}
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
        </div>

        {/* Right col — chem score + effectif */}
        <div className="flex flex-col gap-4 lg:min-h-0">
          <div className="shrink-0 bg-bg-surface-1 border border-b-subtle rounded-xl p-4 flex flex-col items-center gap-3">
            <span className="font-ui text-[var(--text-label)] text-t-muted uppercase tracking-wider">Score chimie</span>
            <ChemistryScoreRing score={chemScore} />
          </div>

          <button
            disabled={!selectedMatchId}
            onClick={() => {
              const match = compositionMatches.find((m) => m.id === selectedMatchId);
              if (match) navigate(`/communication?opponent=${encodeURIComponent(match.opponent)}`);
            }}
            className="shrink-0 w-full py-3 rounded-xl font-ui text-[var(--text-body)] uppercase tracking-wider bg-primary text-primary-text hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Envoyer vers Communication
          </button>

          <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
            <SquadList
              allPlayers={playersWithStatus}
              assignedIds={assignedIds}
              substituteIds={substituteIds}
              onAddPlayer={addPlayer}
              onRemovePlayer={removePlayer}
              onToggleSubstitute={toggleSubstitute}
              onChangeStatus={changePlayerStatus}
              onOverrideStatus={confirmDbOverride}
              dbUnavailabilities={activeDbUnavailabilities}
              maxSubstitutes={MAX_SUBSTITUTES}
              positionLabels={formation.positions.map((p) => p.label)}
              isFriendly={isFriendly}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
