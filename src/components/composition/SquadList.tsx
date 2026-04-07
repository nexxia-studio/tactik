import { useState, useRef, useEffect, useCallback } from "react";
import { type FUTPlayer, type PlayerStatus } from "./mockPlayers";
import { getPositionColor } from "@/lib/positionUtils";
import { ShieldAlert, Cross, Ban, UserPlus, UserMinus, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  allPlayers: FUTPlayer[];
  assignedIds: (string | null)[];
  substituteIds: string[];
  onAddPlayer: (playerId: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onToggleSubstitute: (playerId: string) => void;
  onChangeStatus: (playerId: string, status: PlayerStatus) => void;
  onOverrideStatus?: (playerId: string, status: PlayerStatus) => void;
  dbUnavailabilities?: { player_id: string; end_date: string }[];
  maxSubstitutes: number;
  positionLabels: string[];
  isFriendly?: boolean;
}

const STATUS_INFO = {
  injured:     { label: "Blessé",       icon: Cross,       colorClass: "text-[var(--color-danger)]"  },
  suspended:   { label: "Suspendu",     icon: ShieldAlert, colorClass: "text-[var(--color-warning)]" },
  unavailable: { label: "Indisponible", icon: Ban,         colorClass: "text-t-muted"                },
};

const STATUS_PANEL_OPTIONS: { value: PlayerStatus; label: string; emoji: string }[] = [
  { value: "available",   label: "Actif",        emoji: "✅" },
  { value: "injured",     label: "Blessé",       emoji: "🤕" },
  { value: "suspended",   label: "Suspendu",     emoji: "🟡" },
  { value: "unavailable", label: "Indisponible", emoji: "❌" },
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
  onOverrideStatus,
  dbEndDate,
  dragType,
}: {
  player: FUTPlayer;
  isAssigned: boolean;
  isSubstitute: boolean;
  slotLabel?: string;
  isUnavailable: boolean;
  onClick: () => void;
  onChangeStatus: (status: PlayerStatus) => void;
  onOverrideStatus?: (status: PlayerStatus) => void;
  dbEndDate?: string;
  dragType?: "bench-player" | "unselected-player";
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PlayerStatus | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const statusMeta = player.status !== "available" ? STATUS_INFO[player.status] : null;
  const isDraggable = !!dragType && !isUnavailable;

  // Close on outside mousedown
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [panelOpen]);

  const openPanel = useCallback(() => setPanelOpen(true), []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openPanel();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    longPressTimer.current = setTimeout(openPanel, 500);
  };

  const handleTouchEnd = () => {
    touchStartPos.current = null;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current || !longPressTimer.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
    if (dx > 10 || dy > 10) handleTouchEnd();
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!dragType) return;
    e.dataTransfer.setData("player-id", player.id);
    e.dataTransfer.setData("drag-type", dragType);
    if (dragType === "bench-player" || dragType === "unselected-player") {
      e.dataTransfer.setData("bench-player-id", player.id);
    }
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className="relative"
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
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
                ? "bg-info/10 border border-info/30 hover:bg-info/20 cursor-pointer"
                : "bg-bg-surface-2 border border-b-subtle hover:bg-bg-surface-3 cursor-pointer"
        } ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        <span className="font-ui text-[11px] text-t-muted w-7 text-center shrink-0 tabular-nums">
          #{player.jerseyNumber}
        </span>

        <div className="flex-1 min-w-0">
          <p className="font-ui text-[12px] text-t-primary truncate">
            {player.firstName} {player.lastName}
          </p>
          <div className="flex items-center gap-1.5">
            {(() => { const pc = getPositionColor(player.position); return (
              <span className={`font-ui text-[9px] px-1 py-0.5 rounded border ${pc.bg} ${pc.text} ${pc.border}`}>
                {player.position}
              </span>
            ); })()}
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
              <ArrowRightLeft className="h-3.5 w-3.5 text-info" />
            ) : (
              <UserPlus className="h-3.5 w-3.5 text-primary" />
            )}
          </span>
        )}
      </button>

      {/* Inline status panel — replaces ContextMenu */}
      {panelOpen && (
        <div
          ref={panelRef}
          className="absolute inset-x-0 top-0 z-30 flex gap-1 bg-bg-surface-1 border border-b-subtle rounded-lg p-1.5 shadow-xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {STATUS_PANEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                if (dbEndDate && onOverrideStatus) {
                  // DB-unavailable player — open confirmation dialog
                  setPendingStatus(opt.value);
                  setPanelOpen(false);
                } else {
                  onChangeStatus(opt.value);
                  setPanelOpen(false);
                }
              }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-md font-ui text-[10px] transition-all ${
                player.status === opt.value
                  ? "bg-primary text-primary-text"
                  : "bg-bg-surface-2 text-t-secondary hover:bg-bg-surface-3 hover:text-t-primary"
              }`}
            >
              <span className="text-[13px] leading-none">{opt.emoji}</span>
              <span className="leading-none">{opt.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Confirmation dialog for DB-unavailable override */}
      {dbEndDate && onOverrideStatus && (
        <AlertDialog open={pendingStatus !== null} onOpenChange={(open) => { if (!open) setPendingStatus(null); }}>
          <AlertDialogContent className="bg-bg-surface-1 border-b-subtle">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-t-primary flex items-center gap-2">
                <span className="text-[var(--color-warning)]">⚠️</span>
                Joueur indisponible
              </AlertDialogTitle>
              <AlertDialogDescription className="font-ui text-t-secondary text-[13px]">
                <strong className="text-t-primary">{player.firstName} {player.lastName}</strong> est déclaré blessé jusqu'au{" "}
                <strong className="text-t-primary">
                  {new Date(dbEndDate + "T00:00:00").toLocaleDateString("fr-BE", { day: "numeric", month: "long" })}
                </strong>.
                <br />
                Confirmer quand même le changement de statut ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="font-ui text-[13px] border-b-subtle bg-bg-surface-2 text-t-primary hover:bg-bg-surface-3"
                onClick={() => setPendingStatus(null)}
              >
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                className="font-ui text-[13px] bg-[var(--color-danger)] text-white hover:opacity-90"
                onClick={() => {
                  if (pendingStatus) {
                    onOverrideStatus(pendingStatus);
                    setPendingStatus(null);
                  }
                }}
              >
                Confirmer quand même
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
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
  onOverrideStatus,
  dbUnavailabilities = [],
  maxSubstitutes,
  positionLabels,
  isFriendly = false,
}: Props) {
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  // player_id → end_date for players with active DB unavailabilities (not yet overridden)
  const dbUnavailabilityMap = new Map(dbUnavailabilities.map((u) => [u.player_id, u.end_date]));
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

  const effectiveMaxSubs = isFriendly ? Infinity : maxSubstitutes;

  const handleSectionDragOver = (e: React.DragEvent, section: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSection(section);
  };

  const handleSectionDragLeave = (e: React.DragEvent) => {
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
        onToggleSubstitute(playerId);
      } else if (dragType === "pitch-player") {
        onRemovePlayer(playerId);
      }
    } else if (targetSection === "substitute") {
      if (dragType === "unselected-player" || dragType === "pitch-player") {
        if (substituteIds.length >= effectiveMaxSubs) {
          toast.error(`Banc complet — maximum ${maxSubstitutes} remplaçants`);
          return;
        }
        if (dragType === "pitch-player") {
          onRemovePlayer(playerId);
        }
        onToggleSubstitute(playerId);
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
          isDraggedOver ? "bg-primary-dim border border-primary-border p-2 -m-2" : ""
        }`}
      >
        <h4 className="font-display text-[11px] text-t-muted uppercase tracking-wider mb-1.5 px-1">
          {title}
          {mode === "substitute" && (
            <span className="ml-1 text-info">
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
                            const pitchFull = assignedIds.filter(Boolean).length >= positionLabels.length;
                            if (!pitchFull) {
                              onAddPlayer(player.id);
                            } else {
                              onToggleSubstitute(player.id);
                            }
                          }
                        : () => {}
                }
                onChangeStatus={(status) => onChangeStatus(player.id, status)}
                onOverrideStatus={onOverrideStatus ? (status) => onOverrideStatus(player.id, status) : undefined}
                dbEndDate={dbUnavailabilityMap.get(player.id)}
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
        Clique pour gérer · Clic droit / appui long pour changer le statut · Glisser-déposer pour réorganiser
      </p>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
        {renderSection("Titulaires", titulaires, "titulaire")}
        {renderSection("Remplaçants", substitutes, "substitute")}
        {renderSection("Non sélectionnés", nonSelected, "non-selected")}
        {renderSection("Blessés", unavailablePlayers, "unavailable")}
      </div>
    </div>
  );
}
