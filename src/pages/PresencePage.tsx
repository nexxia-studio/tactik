import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Check, X, Minus } from "lucide-react";
import { useActiveTeam } from "@/contexts/TeamContext";
import { usePlayers } from "@/hooks/usePlayers";
import { useTrainings, useTrainingAttendance, useUpsertAttendance, useDeleteAttendance, usePlayerAttendanceStats } from "@/hooks/useTrainings";
import { useActiveUnavailabilities } from "@/hooks/usePlayerUnavailabilities";
import type { Training } from "@/hooks/useTrainings";
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
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getCalendarDays(month: Date): (Date | null)[] {
  const y = month.getFullYear(), m = month.getMonth();
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7; // 0 = Mon
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (Date | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
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

function fmtMonthLabel(d: Date) {
  return d
    .toLocaleDateString("fr-BE", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());
}

// ── Status type ───────────────────────────────────────────────────────────────

type AttendanceStatus = "present" | "absent" | null;

const STATUS_CYCLE: (AttendanceStatus)[] = [null, "present", "absent"];

function nextStatus(s: AttendanceStatus): AttendanceStatus {
  const idx = STATUS_CYCLE.indexOf(s);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

// ── Player presence card ──────────────────────────────────────────────────────

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

  const statusConfig: Record<NonNullable<AttendanceStatus> | "null", { bg: string; icon: React.ReactNode }> = {
    present: {
      bg: "bg-[rgba(22,255,110,0.12)] border-[rgba(22,255,110,0.3)]",
      icon: <Check className="h-5 w-5 text-[var(--color-success)]" strokeWidth={2.5} />,
    },
    absent: {
      bg: "bg-[rgba(255,59,48,0.10)] border-[rgba(255,59,48,0.3)]",
      icon: <X className="h-5 w-5 text-[var(--color-danger)]" strokeWidth={2.5} />,
    },
    null: {
      bg: "bg-bg-surface-1 border-b-subtle",
      icon: <Minus className="h-4 w-4 text-t-muted" />,
    },
  };

  const key = status ?? "null";
  const { bg, icon } = statusConfig[key];

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all active:scale-[0.98] cursor-pointer ${bg}`}
    >
      <div className="w-9 h-9 rounded-full bg-bg-surface-2 flex items-center justify-center shrink-0 overflow-hidden">
        {player.avatar_url ? (
          <img src={player.avatar_url} alt={playerDisplayName(player)} className="w-full h-full object-cover" />
        ) : (
          <span className="font-display text-[13px] text-t-secondary">{initials}</span>
        )}
      </div>
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
      <div className="shrink-0">{icon}</div>
    </button>
  );
}

// ── Monthly calendar (desktop only) ──────────────────────────────────────────

const CAL_DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function MonthlyCalendar({
  month,
  onPrev,
  onNext,
  trainings,
  selectedDate,
  onSelectDate,
}: {
  month: Date;
  onPrev: () => void;
  onNext: () => void;
  trainings: Training[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}) {
  const days = getCalendarDays(month);
  const today = new Date();

  return (
    <div className="bg-bg-surface-1 border border-b-subtle rounded-xl p-4 space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-surface-2 hover:bg-bg-surface-3 transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4 text-t-secondary" />
        </button>
        <span className="font-ui text-[13px] text-t-primary font-semibold">{fmtMonthLabel(month)}</span>
        <button
          onClick={onNext}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-surface-2 hover:bg-bg-surface-3 transition-colors cursor-pointer"
        >
          <ChevronRight className="h-4 w-4 text-t-secondary" />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 gap-1">
        {CAL_DAY_LABELS.map((l, i) => (
          <div key={i} className="text-center font-ui text-[10px] text-t-muted uppercase tracking-wide py-1">
            {l}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const hasTraining = trainings.some((t) => isSameDay(new Date(t.scheduled_at), day));
          const isSelected  = isSameDay(day, selectedDate);
          const isToday     = isSameDay(day, today);

          return (
            <button
              key={i}
              onClick={() => hasTraining && onSelectDate(day)}
              disabled={!hasTraining}
              className={`flex flex-col items-center py-2 rounded-xl transition-all ${
                isSelected
                  ? "bg-primary text-primary-text"
                  : hasTraining
                  ? "bg-bg-surface-2 hover:bg-bg-surface-3 cursor-pointer"
                  : "opacity-30 cursor-default"
              }`}
            >
              <span
                className={`font-display text-[16px] leading-tight ${
                  isToday && !isSelected ? "text-primary" : ""
                }`}
              >
                {day.getDate()}
              </span>
              {hasTraining && !isSelected && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />
              )}
              {isSelected && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary-text mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Player stats table (desktop only) ────────────────────────────────────────

function PlayerStatsTable({
  players,
  totalTrainings,
  presences,
}: {
  players: Player[];
  totalTrainings: number;
  presences: Record<string, number>;
}) {
  const rows = useMemo(
    () =>
      players
        .map((p) => ({
          player: p,
          present: presences[p.id] ?? 0,
          pct: totalTrainings > 0
            ? Math.round(((presences[p.id] ?? 0) / totalTrainings) * 100)
            : 0,
        }))
        .sort((a, b) => b.pct - a.pct),
    [players, totalTrainings, presences],
  );

  if (rows.length === 0) return null;

  return (
    <div className="bg-bg-surface-1 border border-b-subtle rounded-xl overflow-hidden">
      {/* Column headers */}
      <div className="grid items-center gap-3 px-4 py-2 border-b border-b-subtle"
           style={{ gridTemplateColumns: "36px 1fr 80px 52px 1fr" }}>
        <div />
        <p className="font-ui text-[10px] text-t-muted uppercase tracking-wider">Joueur</p>
        <p className="font-ui text-[10px] text-t-muted uppercase tracking-wider text-right">Séances</p>
        <p className="font-ui text-[10px] text-t-muted uppercase tracking-wider text-right">%</p>
        <p className="font-ui text-[10px] text-t-muted uppercase tracking-wider">Présence</p>
      </div>

      {rows.map(({ player, present, pct }) => {
        const color =
          pct >= 75
            ? "var(--color-success)"
            : pct >= 50
            ? "var(--color-warning)"
            : "var(--color-danger)";

        const initials = playerDisplayName(player)
          .split(" ")
          .map((s) => s[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <div
            key={player.id}
            className="grid items-center gap-3 px-4 py-3 border-b border-b-subtle last:border-0 hover:bg-bg-surface-2 transition-colors"
            style={{ gridTemplateColumns: "36px 1fr 80px 52px 1fr" }}
          >
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-bg-surface-2 flex items-center justify-center shrink-0 overflow-hidden">
              {player.avatar_url ? (
                <img src={player.avatar_url} alt={playerDisplayName(player)} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-[12px] text-t-secondary">{initials}</span>
              )}
            </div>

            {/* Name */}
            <p className="font-ui text-[13px] text-t-primary truncate">{playerDisplayName(player)}</p>

            {/* Count */}
            <p className="font-ui text-[13px] text-t-secondary text-right">
              {present}/{totalTrainings}
            </p>

            {/* Percentage */}
            <p className="font-ui text-[13px] font-semibold text-right" style={{ color }}>
              {pct}%
            </p>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
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

  // ── View state ──────────────────────────────────────────────────────────────
  const [desktopView, setDesktopView] = useState<"list" | "calendar">("list");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);

  // Find training for selected date
  const selectedTraining = useMemo(
    () => trainings.find((t) => isSameDay(new Date(t.scheduled_at), selectedDate)) ?? null,
    [trainings, selectedDate],
  );

  const selectedDateISO = useMemo(
    () => selectedDate.toISOString().slice(0, 10),
    [selectedDate],
  );

  const { data: attendanceRecords = [] } = useTrainingAttendance(selectedTraining?.id);

  const { data: activeUnavailabilities = [] } = useActiveUnavailabilities(teamId, selectedDateISO);
  const unavailablePlayerIds = useMemo(
    () => new Set(activeUnavailabilities.map((u) => u.player_id)),
    [activeUnavailabilities],
  );

  // Sync DB records → local status
  useEffect(() => {
    const map: Record<string, AttendanceStatus> = {};
    attendanceRecords.forEach((a) => {
      map[a.player_id] = a.status === "present" || a.status === "late" ? "present" : "absent";
    });
    unavailablePlayerIds.forEach((pid) => {
      if (!(pid in map)) map[pid] = "absent";
    });
    setStatuses(map);
  }, [attendanceRecords, unavailablePlayerIds, selectedTraining?.id]);

  const togglePlayer = async (playerId: string) => {
    const current = statuses[playerId] ?? null;
    const next = nextStatus(current);
    setStatuses((prev) => ({ ...prev, [playerId]: next }));
    if (!selectedTraining) return;
    try {
      if (next === null) {
        await deleteAttendance.mutateAsync({ training_id: selectedTraining.id, player_id: playerId });
      } else {
        await upsertAttendance.mutateAsync({ training_id: selectedTraining.id, player_id: playerId, status: next });
      }
    } catch (err: any) {
      setStatuses((prev) => ({ ...prev, [playerId]: current }));
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  // ── Stats ───────────────────────────────────────────────────────────────────
  const pastTrainings = useMemo(
    () => trainings.filter((t) => new Date(t.scheduled_at) <= new Date()),
    [trainings],
  );
  const pastTrainingIds = useMemo(
    () => pastTrainings.map((t) => t.id),
    [pastTrainings],
  );
  const { data: presenceStats = {} } = usePlayerAttendanceStats(pastTrainingIds);

  // ── Presence counters for selected date ────────────────────────────────────
  const presentCount = Object.values(statuses).filter((s) => s === "present").length;
  const absentCount  = Object.values(statuses).filter((s) => s === "absent").length;
  const totalPlayers = players.length;

  // ── Calendar month navigation ───────────────────────────────────────────────
  const prevMonth = () =>
    setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () =>
    setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  // When switching to calendar mode, jump to the month of the selected date
  const handleDesktopView = (view: "list" | "calendar") => {
    if (view === "calendar") {
      const d = new Date(selectedDate);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      setCalendarMonth(d);
    }
    setDesktopView(view);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-t-primary leading-none" style={{ fontSize: "var(--text-h1)" }}>
            PRÉSENCE
          </h1>
          <p className="text-t-secondary font-ui text-[var(--text-small)] mt-1">
            {activeTeam?.name ?? "Mon équipe"}
          </p>
        </div>

        {/* Desktop view toggle */}
        <div className="hidden lg:flex items-center gap-1 bg-bg-surface-2 border border-b-subtle rounded-lg p-1 shrink-0">
          {(["list", "calendar"] as const).map((v) => (
            <button
              key={v}
              onClick={() => handleDesktopView(v)}
              className={`px-3 py-1.5 rounded-md font-ui text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                desktopView === v
                  ? "bg-primary text-primary-text font-semibold"
                  : "text-t-secondary hover:text-t-primary"
              }`}
            >
              {v === "list" ? "Liste" : "Calendrier"}
            </button>
          ))}
        </div>
      </div>

      {/* Week selector — hidden on desktop when calendar mode is active */}
      <div className={desktopView === "calendar" ? "lg:hidden" : ""}>
        <div className="bg-bg-surface-1 border border-b-subtle rounded-xl p-4 space-y-3">
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

          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, i) => {
              const hasTraining = trainings.some((t) => isSameDay(new Date(t.scheduled_at), day));
              const isSelected  = isSameDay(day, selectedDate);
              const isToday     = isSameDay(day, new Date());

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
                  <span
                    className={`font-display text-[18px] leading-tight mt-0.5 ${
                      isToday && !isSelected ? "text-primary" : ""
                    }`}
                  >
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
      </div>

      {/* Monthly calendar — desktop calendar mode only */}
      {desktopView === "calendar" && (
        <div className="hidden lg:block">
          <MonthlyCalendar
            month={calendarMonth}
            onPrev={prevMonth}
            onNext={nextMonth}
            trainings={trainings}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
      )}

      {/* Training info + stats bar */}
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

      {/* Attendance stats — desktop only */}
      {players.length > 0 && pastTrainings.length > 0 && (
        <div className="hidden lg:block space-y-3">
          <h2 className="font-ui text-[11px] text-t-muted uppercase tracking-wider">
            Statistiques de présence
          </h2>
          <PlayerStatsTable
            players={players}
            totalTrainings={pastTrainings.length}
            presences={presenceStats}
          />
        </div>
      )}
    </div>
  );
}
