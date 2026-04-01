import { useMemo, useState, useCallback } from "react";
import type { Formation } from "./formations";
import type { FUTPlayer } from "./mockPlayers";
import { FUTPlayerCard } from "./FUTPlayerCard";
import { CHEMISTRY_COLORS, CHEMISTRY_OPACITY, CHEMISTRY_STROKE } from "@/utils/chemistry";

interface Props {
  formation: Formation;
  players: (FUTPlayer | null)[];
  onSwapSlots?: (fromSlot: number, toSlot: number) => void;
  onDropBenchPlayer?: (playerId: string, toSlot: number) => void;
  onRemovePlayer?: (playerId: string) => void;
  readonly?: boolean;
}

type ChemLevel = "optimal" | "good" | "weak" | "bad";

export function getChemistry(a: FUTPlayer, b: FUTPlayer, posA: string, posB: string): ChemLevel {
  const samePosition = a.position === posA && b.position === posB;
  const bothHighRated = a.rating >= 78 && b.rating >= 78;
  if (samePosition && bothHighRated) return "optimal";
  if (samePosition) return "good";
  if (bothHighRated) return "weak";
  return "bad";
}

export function computeChemScore(formation: Formation, players: (FUTPlayer | null)[]): number {
  let total = 0;
  let validLinks = 0;
  formation.links.forEach(([a, b]) => {
    if (!players[a] || !players[b]) return;
    validLinks++;
    const chem = getChemistry(players[a]!, players[b]!, formation.positions[a].label, formation.positions[b].label);
    total += chem === "optimal" ? 3 : chem === "good" ? 2 : chem === "weak" ? 1 : 0;
  });
  const max = validLinks * 3;
  return max > 0 ? Math.round((total / max) * 100) : 0;
}

export function PitchView({ formation, players, onSwapSlots, onDropBenchPlayer, onRemovePlayer, readonly = false }: Props) {
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  const chemScore = useMemo(() => computeChemScore(formation, players), [formation, players]);

  const handleDragOver = useCallback((e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSlot(slotIndex);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverSlot(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toSlot: number) => {
      e.preventDefault();
      setDragOverSlot(null);

      // Check if it's a bench player drop
      const benchPlayerId = e.dataTransfer.getData("bench-player-id");
      if (benchPlayerId) {
        onDropBenchPlayer?.(benchPlayerId, toSlot);
        return;
      }

      // Otherwise it's a pitch slot swap
      const fromSlotStr = e.dataTransfer.getData("pitch-slot");
      if (fromSlotStr) {
        const fromSlot = parseInt(fromSlotStr, 10);
        if (fromSlot !== toSlot) {
          onSwapSlots?.(fromSlot, toSlot);
        }
      }
    },
    [onSwapSlots, onDropBenchPlayer]
  );

  const handleDragStart = useCallback((e: React.DragEvent, slotIndex: number) => {
    e.dataTransfer.setData("pitch-slot", String(slotIndex));
    e.dataTransfer.setData("drag-type", "pitch-player");
    const playerId = players[slotIndex]?.id;
    if (playerId) e.dataTransfer.setData("player-id", playerId);
    e.dataTransfer.effectAllowed = "move";
  }, [players]);

  return (
    <div className="relative w-full" style={{ paddingBottom: "140%" }}>
      {/* Pitch background */}
      <div className="absolute inset-0 rounded-xl overflow-hidden bg-[#1a3a1a] border border-b-subtle">
        {/* Field markings */}
        <svg viewBox="0 0 100 140" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <rect x="5" y="5" width="90" height="130" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
          <line x1="5" y1="70" x2="95" y2="70" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" />
          <circle cx="50" cy="70" r="12" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.3" />
          <circle cx="50" cy="70" r="0.8" fill="rgba(255,255,255,0.15)" />
          <rect x="22" y="5" width="56" height="20" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.3" />
          <rect x="22" y="115" width="56" height="20" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.3" />
          <rect x="32" y="5" width="36" height="8" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.25" />
          <rect x="32" y="127" width="36" height="8" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.25" />
        </svg>

        {/* Chemistry links */}
        <svg viewBox="0 0 100 140" className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          {formation.links.map(([a, b], i) => {
            const posA = formation.positions[a];
            const posB = formation.positions[b];
            if (!players[a] || !players[b]) return null;

            const chem = getChemistry(players[a]!, players[b]!, posA.label, posB.label);
            const yA = posA.y * 1.4;
            const yB = posB.y * 1.4;

            return (
              <line
                key={i}
                x1={posA.x}
                y1={yA}
                x2={posB.x}
                y2={yB}
                stroke={CHEMISTRY_COLORS[chem]}
                strokeWidth={CHEMISTRY_STROKE[chem]}
                opacity={CHEMISTRY_OPACITY[chem]}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Player cards — draggable */}
        {formation.positions.map((pos, i) => {
          const player = players[i];
          const isOver = dragOverSlot === i;

          return (
            <div
              key={i}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 ${
                !readonly && player ? "cursor-grab active:cursor-grabbing" : ""
              } ${isOver ? "scale-110" : ""}`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                zIndex: isOver ? 10 : 2,
              }}
              draggable={!readonly && !!player}
              onDragStart={readonly ? undefined : (e) => handleDragStart(e, i)}
              onDragOver={readonly ? undefined : (e) => handleDragOver(e, i)}
              onDragLeave={readonly ? undefined : handleDragLeave}
              onDrop={readonly ? undefined : (e) => handleDrop(e, i)}
            >
              {player ? (
                <div
                  className={`${isOver ? "ring-2 ring-primary rounded-lg" : ""} ${readonly ? "" : "cursor-pointer"}`}
                  onClick={readonly ? undefined : () => onRemovePlayer?.(player.id)}
                >
                  <FUTPlayerCard player={player} positionLabel={pos.label} compact />
                </div>
              ) : (
                /* Empty slot — drop target */
                <div
                  className={`w-[52px] h-[68px] sm:w-[60px] sm:h-[78px] rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${
                    isOver
                      ? "border-primary bg-primary-dim/30"
                      : "border-white/20 bg-white/5"
                  }`}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, i)}
                >
                  <span className="font-ui text-[9px] text-white/40 uppercase">{pos.label}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
