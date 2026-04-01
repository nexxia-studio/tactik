import { useState, useRef, useCallback } from "react";
import { type FUTPlayer, type PlayerStatus, type PositionCategory, getPositionCategory } from "./mockPlayers";
import { ShieldAlert, Cross, Ban, UserPlus, UserMinus, ArrowRightLeft } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuLabel,
} from "@/components/ui/context-menu";
import { toast } from "sonner";

interface Props {
  allPlayers: FUTPlayer[];
  assignedIds: (string | null)[];
  substituteIds: string[];
  onAddPlayer: (playerId: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onToggleSubstitute: (playerId: string) => void;
  onChangeStatus: (playerId: string, status: PlayerStatus) => void;
  maxSubstitutes: number;
  positionLabels: string[];
  isFriendly?: boolean;
}

const CATEGORY_ORDER: PositionCategory[] = ["GK", "DEF", "MID", "ATT"];
const CATEGORY_LABELS: Record<PositionCategory, string> = {
  GK: "Gardien",
  DEF: "Défenseurs",
  MID: "Milieux",
  ATT: "Attaquants",
};

const STATUS_INFO = {
  injured: { label: "Blessé", icon: Cross, colorClass: "text-[var(--color-danger)]" },
  suspended: { label: "Suspendu", icon: ShieldAlert, colorClass: "text-[var(--color-warning)]" },
  unavailable: { label: "Indisponible", icon: Ban, colorClass: "text-t-muted" },
};

const STATUS_OPTIONS: { value: PlayerStatus; label: string }[] = [
  { value: "available", label: "Actif" },
  { value: "suspended", label: "Suspendu" },
  { value: "injured", label: "Blessé" },
  { value: "unavailable", label: "Indisponible" },
];

const POSITION_ORDER = ["GK", "RB", "RWB", "CB", "LB", "LWB", "CDM", "CM", "RM", "LM", "CAM", "RAM", "LAM", "RW", "LW", "CF", "SS", "ST"];

function PlayerRow({
  player,
  isAssigned,
  isSubstitute,
  slotLabel,
  isUnavailable,
  onClick,
  onChangeStatus,
  dragType,
}: {
  player: FUTPlayer;
  isAssigned: boolean;
  isSubstitute: boolean;
  slotLabel?: string;
  isUnavailable: boolean;
  onClick: () => void;
  onChangeStatus: (status: PlayerStatus) => void;
  dragType?: "bench-player" | "unselected-player";
}) {
  const statusMeta = player.status !== "available" ? STATUS_INFO[player.status] : null;
  const isDraggable = !!dragType && !isUnavailable;

  const handleDragStart = (e: React.DragEvent) => {
    if (!dragType) return;
    e.dataTransfer.setData("player-id", player.id);
    e.dataTransfer.setData("drag-type", dragType);
    // Also set bench-player-id for PitchView compatibility
    if (dragType === "bench-player" || dragType === "unselected-player") {
      e.dataTransfer.setData("bench-player-id", player.id);
    }
    e.dataTransfer.effectAllowed = "move";
  };

  const rowContent = (
    <button
      onClick={onClick}
      disabled={isUnavailable}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left select-none ${
        isUnavailable
          ? "bg-bg-surface-2/50 opacity-50 cursor-not-allowed"
          : isAssigned
            ? "bg-primary-dim border border-primary-border hover:bg-primary-dim/70 cursor-pointer"
            : isSubstitute
              ? "bg-accent/10 border border-accent/30 hover:bg-accent/20 cursor-pointer"
              : "bg-bg-surface-2 border border-b-subtle hover:bg-bg-surface-3 cursor-pointer"
      } ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <span className="font-display text-[13px] text-t-muted w-6 text-center shrink-0">
        #{player.jerseyNumber}
      </span>

      <div className="flex-1 min-w-0">
        <p className="font-ui text-[12px] text-t-primary truncate">
          {player.firstName} {player.lastName}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="font-ui text-[10px] text-t-muted">{player.position}</span>
          {slotLabel && (
            <span className="font-ui text-[9px] text-primary uppercase">→ {slotLabel}</span>
          )}
          {statusMeta && (
            <span className={`font-ui text-[9px] flex items-center gap-0.5 ${statusMeta.colorClass}`}>
              <statusMeta.icon className="h-2.5 w-2.5" />
              {statusMeta.label}
            </span>
          )}
        </div>
      </div>

      <span
        className={`font-display text-[13px] shrink-0 ${
          player.rating >= 80
            ? "text-[var(--color-success)]"
            : player.rating >= 70
              ? "text-[var(--color-warning)]"
              : "text-t-primary"
        }`}
      >
        {player.rating}
      </span>

      {!isUnavailable && (
        <span className="shrink-0">
          {isAssigned ? (
            <UserMinus className="h-3.5 w-3.5 text-[var(--color-danger)]" />
          ) : isSubstitute ? (
            <ArrowRightLeft className="h-3.5 w-3.5 text-accent" />
          ) : (
            <UserPlus className="h-3.5 w-3.5 text-primary" />
          )}
        </span>
      )}
    </button>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{rowContent}</ContextMenuTrigger>
      <ContextMenuContent className="bg-bg-surface-1 border-b-subtle min-w-[160px]">
        <ContextMenuLabel className="font-display text-[11px] text-t-muted">
          Statut de {player.firstName}
        </ContextMenuLabel>
        <ContextMenuSeparator className="bg-b-subtle" />
        {STATUS_OPTIONS.map((opt) => (
          <ContextMenuItem
            key={opt.value}
            onClick={() => onChangeStatus(opt.value)}
            className={`font-ui text-[12px] cursor-pointer ${
              player.status === opt.value ? "text-primary font-semibold" : "text-t-primary"
            }`}
          >
            {player.status === opt.value && <span className="mr-1.5">✓</span>}
            {opt.label}
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function SquadList({
  allPlayers,
  assignedIds,
  substituteIds,
  onAddPlayer,
  onRemovePlayer,
  onToggleSubstitute,
  onChangeStatus,
  maxSubstitutes,
  positionLabels,
  isFriendly = false,
}: Props) {
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const assignedSet = new Set(assignedIds.filter(Boolean));
  const substituteSet = new Set(substituteIds);

  const getSlotLabel = (playerId: string): string | undefined => {
    const slotIdx = assignedIds.indexOf(playerId);
    if (slotIdx === -1) return undefined;
    return positionLabels[slotIdx];
  };

  const unavailablePlayers = allPlayers.filter(
    (p) => p.status === "injured" || p.status === "suspended" || p.status === "unavailable"
  );
  const availablePlayers = allPlayers.filter((p) => p.status === "available");

  const titulaires = availablePlayers.filter((p) => assignedSet.has(p.id));
  const substitutes = availablePlayers.filter((p) => substituteSet.has(p.id) && !assignedSet.has(p.id));

  const getPositionRank = (pos: string) => {
    const idx = POSITION_ORDER.indexOf(pos);
    return idx === -1 ? 999 : idx;
  };

  const nonSelected = availablePlayers
    .filter((p) => !assignedSet.has(p.id) && !substituteSet.has(p.id))
    .sort((a, b) => getPositionRank(a.position) - getPositionRank(b.position));

  const titulairesByCategory = new Map<PositionCategory, FUTPlayer[]>();
  for (const cat of CATEGORY_ORDER) {
    titulairesByCategory.set(
      cat,
      titulaires.filter((p) => getPositionCategory(p.position) === cat)
    );
  }

  const effectiveMaxSubs = isFriendly ? Infinity : maxSubstitutes;

  const handleSectionDragOver = (e: React.DragEvent, section: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSection(section);
  };

  const handleSectionDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the section entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverSection(null);
    }
  };

  const handleSectionDrop = (e: React.DragEvent, targetSection: "substitute" | "non-selected") => {
    e.preventDefault();
    setDragOverSection(null);

    const playerId = e.dataTransfer.getData("player-id");
    const dragType = e.dataTransfer.getData("drag-type");
    if (!playerId || !dragType) return;

    if (targetSection === "non-selected") {
      if (dragType === "bench-player") {
        onToggleSubstitute(playerId); // removes from bench
      } else if (dragType === "pitch-player") {
        onRemovePlayer(playerId); // removes from pitch → non-selected
      }
    } else if (targetSection === "substitute") {
      if (dragType === "unselected-player" || dragType === "pitch-player") {
        if (substituteIds.length >= effectiveMaxSubs) {
          toast.error(`Banc complet — maximum ${maxSubstitutes} remplaçants`);
          return;
        }
        if (dragType === "pitch-player") {
          onRemovePlayer(playerId); // remove from pitch first
        }
        onToggleSubstitute(playerId); // add to bench
      }
    }
  };

  const renderSection = (
    title: string,
    players: FUTPlayer[],
    mode: "titulaire" | "substitute" | "non-selected" | "unavailable"
  ) => {
    if (players.length === 0 && mode !== "substitute" && mode !== "non-selected") return null;

    const isDropZone = mode === "substitute" || mode === "non-selected";
    const isDraggedOver = dragOverSection === mode;

    return (
      <div
        onDragOver={isDropZone ? (e) => handleSectionDragOver(e, mode) : undefined}
        onDragLeave={isDropZone ? handleSectionDragLeave : undefined}
        onDrop={isDropZone ? (e) => handleSectionDrop(e, mode as "substitute" | "non-selected") : undefined}
        className={`rounded-lg transition-all duration-150 ${
          isDraggedOver
            ? "bg-primary-dim border border-primary-border p-2 -m-2"
            : ""
        }`}
      >
        <h4 className="font-display text-[11px] text-t-muted uppercase tracking-wider mb-1.5 px-1">
          {title}
          {mode === "substitute" && (
            <span className="ml-1 text-accent">
              ({players.length}/{isFriendly ? "∞" : maxSubstitutes})
            </span>
          )}
        </h4>
        {players.length === 0 ? (
          <p className="font-ui text-[10px] text-t-muted italic px-1 py-2">
            {mode === "substitute"
              ? "Glisse un joueur ici pour l'ajouter au banc"
              : mode === "non-selected"
                ? "Aucun joueur non sélectionné"
                : ""}
          </p>
        ) : (
          <div className="space-y-1">
            {players.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                isAssigned={mode === "titulaire"}
                isSubstitute={mode === "substitute"}
                slotLabel={mode === "titulaire" ? getSlotLabel(player.id) : undefined}
                isUnavailable={mode === "unavailable"}
                dragType={
                  mode === "substitute"
                    ? "bench-player"
                    : mode === "non-selected"
                      ? "unselected-player"
                      : undefined
                }
                onClick={
                  mode === "titulaire"
                    ? () => onRemovePlayer(player.id)
                    : mode === "substitute"
                      ? () => onToggleSubstitute(player.id)
                      : mode === "non-selected"
                        ? () => {
                            const pitchFull = assignedIds.every((id) => id !== null);
                            if (!pitchFull) {
                              onAddPlayer(player.id);
                            } else {
                              onToggleSubstitute(player.id);
                            }
                          }
                        : () => {}
                }
                onChangeStatus={(status) => onChangeStatus(player.id, status)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-bg-surface-1 border border-b-subtle rounded-xl p-4">
      <h3 className="font-display text-[14px] text-t-primary mb-1">EFFECTIF</h3>
      <p className="font-ui text-[10px] text-t-muted mb-3">
        Clique pour gérer · Clic droit pour changer le statut · Glisser-déposer pour réorganiser
      </p>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
        {CATEGORY_ORDER.map((cat) =>
          renderSection(
            CATEGORY_LABELS[cat],
            titulairesByCategory.get(cat) || [],
            "titulaire"
          )
        )}

        {renderSection("Remplaçants", substitutes, "substitute")}
        {renderSection("Non sélectionnés", nonSelected, "non-selected")}
        {renderSection("Blessés / Suspendus / Indisponibles", unavailablePlayers, "unavailable")}
      </div>
    </div>
  );
}
