import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Check, X, Minus } from "lucide-react";
import { useActiveTeam } from "@/contexts/TeamContext";
import { usePlayers } from "@/hooks/usePlayers";
import { useTrainings, useTrainingAttendance, useUpsertAttendance, useDeleteAttendance } from "@/hooks/useTrainings";
import { useActiveUnavailabilities } from "@/hooks/usePlayerUnavailabilities";
import type { Player } from "@/hooks/usePlayers";
import { playerDisplayName } from "@/hooks/usePlayers";
import { useToast } from "@/hooks/use-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getWeekDays(weekOffset: number): Date[] {
  const now = new Date();
  // Monday of current week
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function fmtDayLetter(d: Date) {
  return d.toLocaleDateString("fr-BE", { weekday: "short" }).charAt(0).toUpperCase();
}

function fmtDayNum(d: Date) {
  return d.getDate();
}

function fmtWeekLabel(days: Date[]) {
  const from = days[0].toLocaleDateString("fr-BE", { day: "numeric", month: "short" });
  const to   = days[6].toLocaleDateString("fr-BE", { day: "numeric", month: "short" });
  return `${from} — ${to}`;
}

function fmtTrainingTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
}

// ── Status type ───────────────────────────────────────────────────────────────

type AttendanceStatus = "present" | "absent" | null;

const STATUS_CYCLE: (AttendanceStatus)[] = [null, "present", "absent"];

function nextStatus(s: AttendanceStatus): AttendanceStatus {
  const idx = STATUS_CYCLE.indexOf(s);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

// ── Player card ───────────────────────────────────────────────────────────────

function PlayerPresenceCard({
  player,
  status,
  onToggle,
}: {
  player: Player;
  status: AttendanceStatus;
  onToggle: () => void;
}) {
  const initials = playerDisplayName(player)
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const statusConfig: Record<NonNullable<AttendanceStatus> | "null", { bg: string; icon: React.ReactNode; ring: string }> = {
    present: {
      bg: "bg-[rgba(22,255,110,0.12)] border-[rgba(22,255,110,0.3)]",
      icon: <Check className="h-5 w-5 text-[var(--color-success)]" strokeWidth={2.5} />,
      ring: "ring-[rgba(22,255,110,0.3)]",
    },
    absent: {
      bg: "bg-[rgba(255,59,48,0.10)] border-[rgba(255,59,48,0.3)]",
      icon: <X className="h-5 w-5 text-[var(--color-danger)]" strokeWidth={2.5} />,
      ring: "ring-[rgba(255,59,48,0.3)]",
    },
    null: {
      bg: "bg-bg-surface-1 border-b-subtle",
      icon: <Minus className="h-4 w-4 text-t-muted" />,
      ring: "",
    },
  };

  const key = status ?? "null";
  const { bg, icon } = statusConfig[key];

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all active:scale-[0.98] cursor-pointer ${bg}`}
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-bg-surface-2 flex items-center justify-center shrink-0 overflow-hidden">
        {player.avatar_url ? (
          <img src={player.avatar_url} alt={playerDisplayName(player)} className="w-full h-full object-cover" />
        ) : (
          <span className="font-display text-[13px] text-t-secondary">{initials}</span>
        )}
      </div>

      {/* Name + position */}
      <div className="flex-1 min-w-0 text-left">
        <p className="font-ui text-[14px] text-t-primary truncate">{playerDisplayName(player)}</p>
        {(player.position_preferred || player.shirt_number != null) && (
          <p className="font-ui text-[11px] text-t-muted mt-0.5">
            {player.shirt_number != null && `#${player.shirt_number}`}
            {player.shirt_number != null && player.position_preferred && " · "}
            {player.position_preferred}
          </p>
        )}
      </div>

      {/* Status icon */}
      <div className="shrink-0">{icon}</div>
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PresencePage() {
  const { toast } = useToast();
  const { activeTeamId: teamId, activeTeam } = useActiveTeam();

  const { data: players = [] } = usePlayers(teamId);
  const { data: trainings = [] } = useTrainings(teamId);
  const upsertAttendance = useUpsertAttendance();
  const deleteAttendance = useDeleteAttendance();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);

  // Find training for selected date
  const selectedTraining = useMemo(
    () => trainings.find((t) => isSameDay(new Date(t.scheduled_at), selectedDate)) ?? null,
    [trainings, selectedDate]
  );

  // ISO date for the selected day (used for unavailability check)
  const selectedDateISO = useMemo(
    () => selectedDate.toISOString().slice(0, 10),
    [selectedDate]
  );

  // Load attendance records for this training
  const { data: attendanceRecords = [] } = useTrainingAttendance(selectedTraining?.id);

  // Active unavailabilities on the selected date
  const { data: activeUnavailabilities = [] } = useActiveUnavailabilities(teamId, selectedDateISO);
  const unavailablePlayerIds = useMemo(
    () => new Set(activeUnavailabilities.map((u) => u.player_id)),
    [activeUnavailabilities]
  );

  // Sync DB records → local status state when training or date changes.
  // Players with an active unavailability are pre-marked "absent" unless
  // there's already a DB attendance record (coach override takes precedence).
  useEffect(() => {
    const map: Record<string, AttendanceStatus> = {};
    // 1. Pre-fill from attendance records (DB is authoritative)
    attendanceRecords.forEach((a) => {
      if (a.status === "present" || a.status === "late") map[a.player_id] = "present";
      else map[a.player_id] = "absent";
    });
    // 2. For players NOT yet in the map, auto-mark unavailable ones as absent
    unavailablePlayerIds.forEach((pid) => {
      if (!(pid in map)) map[pid] = "absent";
    });
    setStatuses(map);
  }, [attendanceRecords, unavailablePlayerIds, selectedTraining?.id]);

  const togglePlayer = async (playerId: string) => {
    const current = statuses[playerId] ?? null;
    const next = nextStatus(current);

    // Optimistic update
    setStatuses((prev) => ({ ...prev, [playerId]: next }));

    if (!selectedTraining) return;
    try {
      if (next === null) {
        await deleteAttendance.mutateAsync({ training_id: selectedTraining.id, player_id: playerId });
      } else {
        await upsertAttendance.mutateAsync({ training_id: selectedTraining.id, player_id: playerId, status: next });
      }
    } catch (err: any) {
      // Revert on error
      setStatuses((prev) => ({ ...prev, [playerId]: current }));
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  // Stats for current selection
  const presentCount = Object.values(statuses).filter((s) => s === "present").length;
  const absentCount  = Object.values(statuses).filter((s) => s === "absent").length;
  const totalPlayers = players.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-t-primary leading-none" style={{ fontSize: "var(--text-h1)" }}>
          PRÉSENCE
        </h1>
        <p className="text-t-secondary font-ui text-[var(--text-small)] mt-1">
          {activeTeam?.name ?? "Mon équipe"}
        </p>
      </div>

      {/* Week selector */}
      <div className="bg-bg-surface-1 border border-b-subtle rounded-xl p-4 space-y-3">
        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-surface-2 hover:bg-bg-surface-3 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 text-t-secondary" />
          </button>
          <span className="font-ui text-[12px] text-t-secondary">{fmtWeekLabel(weekDays)}</span>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-surface-2 hover:bg-bg-surface-3 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4 text-t-secondary" />
          </button>
        </div>

        {/* Day pills */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, i) => {
            const hasTraining = trainings.some((t) => isSameDay(new Date(t.scheduled_at), day));
            const isSelected  = isSameDay(day, selectedDate);
            const isToday     = isSameDay(day, new Date());
            const isPast      = day < new Date() && !isToday;

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center py-2 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-text"
                    : hasTraining
                    ? "bg-bg-surface-2 hover:bg-bg-surface-3"
                    : "opacity-40"
                }`}
              >
                <span className="font-ui text-[10px] uppercase tracking-wide">
                  {fmtDayLetter(day)}
                </span>
                <span className={`font-display text-[18px] leading-tight mt-0.5 ${isToday && !isSelected ? "text-primary" : ""}`}>
                  {fmtDayNum(day)}
                </span>
                {hasTraining && !isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                )}
                {isSelected && hasTraining && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-text mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Training info + stats */}
      {selectedTraining ? (
        <div className="bg-bg-surface-1 border border-b-subtle rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-ui text-[12px] text-t-secondary uppercase tracking-wide">
              Séance — {fmtTrainingTime(selectedTraining.scheduled_at)}
              {selectedTraining.location && ` · ${selectedTraining.location}`}
            </p>
          </div>
          <div className="flex items-center gap-3 text-[12px] font-ui">
            <span className="text-[var(--color-success)]">{presentCount} ✓</span>
            <span className="text-[var(--color-danger)]">{absentCount} ✗</span>
            <span className="text-t-muted">{totalPlayers - presentCount - absentCount} —</span>
          </div>
        </div>
      ) : (
        <div className="bg-bg-surface-1 border border-b-subtle rounded-xl px-4 py-4 text-center">
          <p className="font-ui text-[13px] text-t-muted">Aucune séance planifiée ce jour</p>
        </div>
      )}

      {/* Player list */}
      {selectedTraining && (
        players.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-ui text-[14px] text-t-secondary">Aucun joueur dans l'effectif</p>
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player) => (
              <PlayerPresenceCard
                key={player.id}
                player={player}
                status={statuses[player.id] ?? null}
                onToggle={() => togglePlayer(player.id)}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
