import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Dumbbell, Trophy, Swords, Star, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Training } from "@/hooks/useTrainings";
import type { Match } from "@/hooks/useMatches";

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const MATCH_TYPE_STYLES: Record<string, { color: string; label: string }> = {
  championship: { color: "var(--color-primary)", label: "Championnat" },
  friendly:     { color: "var(--color-info)",    label: "Amical"      },
  cup:          { color: "#FFB800",              label: "Coupe"       },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours()}h${String(d.getMinutes()).padStart(2, "0")}`;
}

// Parse a date string to { year, month (0-indexed), day } without timezone shift
function parseDateParts(dateStr: string): { y: number; mo: number; d: number } {
  const base = dateStr.split("T")[0];
  const [y, mo, d] = base.split("-").map(Number);
  return { y, mo: mo - 1, d };
}

interface TrainingCalendarViewProps {
  trainings: Training[];
  matches?: Match[];
}

export default function TrainingCalendarView({ trainings, matches = [] }: TrainingCalendarViewProps) {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const trainingsByDay = useMemo(() => {
    const map: Record<number, Training[]> = {};
    trainings.forEach((t) => {
      const { y, mo, d } = parseDateParts(t.scheduled_at);
      if (y === year && mo === month) {
        if (!map[d]) map[d] = [];
        map[d].push(t);
      }
    });
    return map;
  }, [trainings, year, month]);

  const matchesByDay = useMemo(() => {
    const map: Record<number, Match[]> = {};
    matches.forEach((m) => {
      const { y, mo, d } = parseDateParts(m.match_date);
      if (y === year && mo === month) {
        if (!map[d]) map[d] = [];
        map[d].push(m);
      }
    });
    return map;
  }, [matches, year, month]);

  const prevMonth = () => { setCurrentMonth(new Date(year, month - 1, 1)); setSelectedDay(null); };
  const nextMonth = () => { setCurrentMonth(new Date(year, month + 1, 1)); setSelectedDay(null); };

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const handleDayClick = (day: number) => {
    const dayTrainings = trainingsByDay[day] ?? [];
    const dayMatches = matchesByDay[day] ?? [];
    if (dayTrainings.length === 0 && dayMatches.length === 0) return;
    // Single training, no matches: navigate directly
    if (dayTrainings.length === 1 && dayMatches.length === 0) {
      navigate(`/seance/${dayTrainings[0].id}`);
      return;
    }
    setSelectedDay(selectedDay === day ? null : day);
  };

  const selectedTrainings = selectedDay ? (trainingsByDay[selectedDay] ?? []) : [];
  const selectedMatches = selectedDay ? (matchesByDay[selectedDay] ?? []) : [];

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="w-9 h-9 rounded-lg bg-bg-surface-1 border border-b-subtle flex items-center justify-center hover:bg-bg-surface-2 transition-all cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4 text-t-secondary" />
        </button>
        <h2 className="font-display text-[16px] text-t-primary uppercase">
          {MONTHS_FR[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="w-9 h-9 rounded-lg bg-bg-surface-1 border border-b-subtle flex items-center justify-center hover:bg-bg-surface-2 transition-all cursor-pointer"
        >
          <ChevronRight className="h-4 w-4 text-t-secondary" />
        </button>
      </div>

      {/* Days header */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS_FR.map((d) => (
          <div key={d} className="text-center font-ui text-[11px] text-t-muted uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          const dayTrainings = trainingsByDay[day] ?? [];
          const dayMatches = matchesByDay[day] ?? [];
          const hasEvents = dayTrainings.length > 0 || dayMatches.length > 0;
          const isSelected = selectedDay === day;

          // Build icon list: 1 training icon + match icons by type (deduplicated)
          type EventIcon = { Icon: React.ElementType; color: string; key: string };
          const icons: EventIcon[] = [];
          if (dayTrainings.length > 0) {
            icons.push({ Icon: Dumbbell, color: "var(--color-info)", key: "training" });
          }
          const seenTypes = new Set<string>();
          const MATCH_ICONS: Record<string, React.ElementType> = {
            championship: Trophy,
            friendly:     Swords,
            cup:          Star,
          };
          for (const m of dayMatches) {
            const type = m.type ?? "friendly";
            if (!seenTypes.has(type)) {
              seenTypes.add(type);
              const style = MATCH_TYPE_STYLES[type] ?? MATCH_TYPE_STYLES.friendly;
              icons.push({ Icon: MATCH_ICONS[type] ?? Swords, color: style.color, key: `match-${type}` });
            }
          }

          return (
            <div
              key={day}
              onClick={() => handleDayClick(day)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all ${
                hasEvents ? "cursor-pointer hover:bg-bg-surface-2" : ""
              } ${
                isSelected
                  ? "bg-bg-surface-2 border border-primary/40"
                  : isToday(day)
                  ? "bg-bg-surface-2 border border-b-default"
                  : "bg-bg-surface-1 border border-transparent"
              }`}
            >
              <span
                className={`font-ui text-[13px] ${
                  isToday(day) ? "text-primary font-semibold" : "text-t-secondary"
                }`}
              >
                {day}
              </span>
              {icons.length > 0 && (
                <div className="flex gap-0.5 flex-wrap justify-center">
                  {icons.slice(0, 3).map(({ Icon, color, key }) => (
                    <Icon key={key} className="h-4 w-4" style={{ color }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day detail panel */}
      {selectedDay !== null && (selectedTrainings.length > 0 || selectedMatches.length > 0) && (
        <div className="bg-bg-surface-1 border border-b-subtle rounded-xl overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-2.5 bg-bg-surface-2 border-b border-b-subtle">
            <span className="font-display text-[13px] text-t-primary uppercase tracking-wider">
              {selectedDay} {MONTHS_FR[month]}
            </span>
            <button
              onClick={() => setSelectedDay(null)}
              className="p-1 text-t-muted hover:text-t-primary transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="divide-y divide-b-subtle">
            {selectedTrainings.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <Dumbbell className="h-4 w-4 shrink-0" style={{ color: "var(--color-info)" }} />
                <div className="flex-1 min-w-0">
                  <p className="font-ui text-[13px] text-t-primary">
                    Entraînement
                    <span className="text-t-muted ml-1.5">— {formatTime(t.scheduled_at)}</span>
                  </p>
                  {t.location && (
                    <p className="font-ui text-[11px] text-t-muted truncate">{t.location}</p>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/seance/${t.id}`)}
                  className="font-ui text-[11px] text-primary hover:opacity-80 cursor-pointer shrink-0 transition-opacity"
                >
                  Voir →
                </button>
              </div>
            ))}
            {selectedMatches.map((m) => {
              const typeStyle = MATCH_TYPE_STYLES[m.type] ?? MATCH_TYPE_STYLES.friendly;
              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-[16px] shrink-0">{m.is_home ? "🏠" : "✈️"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-ui text-[13px] text-t-primary truncate">
                      {m.is_home ? `vs ${m.opponent}` : `@ ${m.opponent}`}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-ui text-[11px] text-t-muted">{formatTime(m.match_date)}</span>
                      <span
                        className="font-ui text-[10px] uppercase tracking-wider"
                        style={{ color: typeStyle.color }}
                      >
                        {typeStyle.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 flex-wrap">
        {[
          { Icon: Dumbbell, color: "var(--color-info)",    label: "Entraînement" },
          { Icon: Trophy,   color: "var(--color-primary)", label: "Championnat"  },
          { Icon: Swords,   color: "var(--color-info)",    label: "Amical"       },
          { Icon: Star,     color: "#FFB800",              label: "Coupe"        },
        ].map(({ Icon, color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5" style={{ color }} />
            <span className="font-ui text-[11px] text-t-muted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
