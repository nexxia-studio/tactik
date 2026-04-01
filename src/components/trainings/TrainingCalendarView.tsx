import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Training } from "@/data/mockTrainings";

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

interface TrainingCalendarViewProps {
  trainings: Training[];
}

export default function TrainingCalendarView({ trainings }: TrainingCalendarViewProps) {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1)); // April 2026

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const trainingsByDay = useMemo(() => {
    const map: Record<number, Training[]> = {};
    trainings.forEach((t) => {
      const d = new Date(t.scheduled_at);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(t);
      }
    });
    return map;
  }, [trainings, year, month]);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

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

          const dayTrainings = trainingsByDay[day] || [];
          const hasTraining = dayTrainings.length > 0;

          return (
            <div
              key={day}
              onClick={() => {
                if (hasTraining) navigate(`/seance/${dayTrainings[0].id}`);
              }}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all ${
                hasTraining
                  ? "cursor-pointer hover:bg-bg-surface-2 border border-b-subtle"
                  : ""
              } ${isToday(day) ? "bg-bg-surface-2 border border-b-default" : "bg-bg-surface-1"}`}
            >
              <span
                className={`font-ui text-[13px] ${
                  isToday(day) ? "text-primary font-semibold" : "text-t-secondary"
                }`}
              >
                {day}
              </span>
              {hasTraining && (
                <div className="flex gap-0.5">
                  {dayTrainings.map((t) => (
                    <div
                      key={t.id}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: "var(--color-info)" }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-info)" }} />
          <span className="font-ui text-[11px] text-t-muted">Entraînement</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
          <span className="font-ui text-[11px] text-t-muted">Match</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-warning)" }} />
          <span className="font-ui text-[11px] text-t-muted">Événement</span>
        </div>
      </div>
    </div>
  );
}
