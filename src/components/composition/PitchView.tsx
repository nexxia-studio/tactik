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
  // Click-to-select state: which pitch slot is currently selected
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const chemScore = useMemo(() => computeChemScore(formation, players), [formation, players]);

  // ── Click-to-select / click-to-place ───────────────────────────────────────
  const handleSlotClick = useCallback((e: React.MouseEvent, slotIndex: number) => {
    e.stopPropagation(); // prevent pitch-background deselect from firing
    if (readonly) return;

    if (selectedSlot === null) {
      // Nothing selected: select if the slot has a player
      if (players[slotIndex]) {
        setSelectedSlot(slotIndex);
      }
    } else if (selectedSlot === slotIndex) {
      // Same slot → deselect
      setSelectedSlot(null);
    } else {
      // Different slot → swap (works for both occupied and empty destination)
      onSwapSlots?.(selectedSlot, slotIndex);
      setSelectedSlot(null);
    }
  }, [readonly, selectedSlot, players, onSwapSlots]);

  // Clicking the pitch background (outside any slot) deselects
  const handlePitchBackgroundClick = useCallback(() => {
    if (selectedSlot !== null) setSelectedSlot(null);
  }, [selectedSlot]);

  // ── Bench-player drag & drop (non-selected → pitch remains drag-based) ─────
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
      e.stopPropagation();
      setDragOverSlot(null);
      const benchPlayerId = e.dataTransfer.getData("bench-player-id");
      if (benchPlayerId) {
        onDropBenchPlayer?.(benchPlayerId, toSlot);
        setSelectedSlot(null); // clear selection when bench drop lands
      }
    },
    [onDropBenchPlayer]
  );

  return (
    <div className="relative w-full" style={{ aspectRatio: "5 / 7", minHeight: "320px" }}>
      {/* Pitch background — click to deselect */}
      <div
        className="absolute inset-0 rounded-xl overflow-hidden bg-[#1a3a1a] border border-b-subtle"
        onClick={readonly ? undefined : handlePitchBackgroundClick}
      >
        {/* Field markings */}
        <svg
          viewBox="0 0 100 140"
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
        >
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
        <svg
          viewBox="0 0 100 140"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
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

        {/* Slot cards */}
        {formation.positions.map((pos, i) => {
          const player = players[i];
          const isSelected = selectedSlot === i;
          const isOver = dragOverSlot === i;
          // An empty slot is a valid target when a player is selected
          const isValidTarget = !readonly && selectedSlot !== null && selectedSlot !== i && !player;

          return (
            <div
              key={i}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 ${
                isSelected ? "scale-110 z-20" : isOver ? "scale-105" : ""
              }`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                zIndex: isSelected ? 20 : isOver ? 10 : 2,
              }}
              onDragOver={readonly ? undefined : (e) => handleDragOver(e, i)}
              onDragLeave={readonly ? undefined : handleDragLeave}
              onDrop={readonly ? undefined : (e) => handleDrop(e, i)}
            >
              {player ? (
                <div
                  onClick={readonly ? undefined : (e) => handleSlotClick(e, i)}
                  className={[
                    "rounded-lg transition-all duration-150",
                    readonly ? "cursor-default" : "cursor-pointer",
                    isSelected
                      ? "ring-2 ring-[var(--color-warning)] ring-offset-2 ring-offset-transparent"
                      : selectedSlot !== null
                        ? "opacity-60 hover:opacity-80"
                        : "hover:scale-105",
                  ].join(" ")}
                >
                  <FUTPlayerCard player={player} positionLabel={pos.label} compact />
                </div>
              ) : (
                /* Empty slot */
                <div
                  onClick={readonly ? undefined : (e) => handleSlotClick(e, i)}
                  className={[
                    "w-[52px] h-[68px] sm:w-[60px] sm:h-[78px] rounded-lg border-2 border-dashed flex items-center justify-center transition-all duration-150",
                    isValidTarget
                      ? "border-[var(--color-warning)] bg-[rgba(255,214,10,0.12)] cursor-pointer scale-105"
                      : isOver
                        ? "border-primary bg-primary-dim/30 cursor-pointer"
                        : "border-white/20 bg-white/5",
                  ].join(" ")}
                >
                  <span className={`font-ui text-[9px] uppercase ${isValidTarget ? "text-[var(--color-warning)]" : "text-white/40"}`}>
                    {pos.label}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selection hint */}
      {!readonly && selectedSlot !== null && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <span className="font-ui text-[10px] uppercase tracking-wider bg-[var(--color-warning)] text-black px-2 py-0.5 rounded-full">
            Clique sur un poste pour placer
          </span>
        </div>
      )}
    </div>
  );
}
