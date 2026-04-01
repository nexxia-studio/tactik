import { useState, useMemo } from "react";
import { List, CalendarDays } from "lucide-react";
import { MOCK_TRAININGS, type Training } from "@/data/mockTrainings";
import TrainingCard from "@/components/trainings/TrainingCard";
import TrainingCalendarView from "@/components/trainings/TrainingCalendarView";
import NewSessionDialog from "@/components/trainings/NewSessionDialog";

type ViewMode = "list" | "calendar";

export default function TrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>(MOCK_TRAININGS);
  const [view, setView] = useState<ViewMode>("list");

  const upcoming = useMemo(
    () => trainings
      .filter((t) => t.status === "planned")
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)),
    [trainings]
  );

  const past = useMemo(
    () => trainings
      .filter((t) => t.status === "completed")
      .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at)),
    [trainings]
  );

  const handleAddSession = (data: { date: string; time: string; location: string; notes: string }) => {
    const newTraining: Training = {
      id: `s-${Date.now()}`,
      scheduled_at: `${data.date}T${data.time}:00`,
      location: data.location,
      status: "planned",
      notes: data.notes || null,
      phases: [
        { type: "warmup", duration: 15, drills: [] },
        { type: "tactical", duration: 25, drills: [] },
        { type: "technical", duration: 20, drills: [] },
        { type: "scrimmage", duration: 30, drills: [] },
      ],
      attendance: [],
    };
    setTrainings((prev) => [...prev, newTraining]);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-t-primary leading-none uppercase" style={{ fontSize: "var(--text-h1)" }}>
            ENTRAÎNEMENTS
          </h1>
          <p className="text-t-secondary font-ui text-[var(--text-small)] mt-2">
            Saison 2025-2026
          </p>
        </div>
        <NewSessionDialog onAdd={handleAddSession} />
      </div>

      {/* View toggle */}
      <div className="flex gap-1.5">
        {([
          { key: "list" as ViewMode, label: "Liste", icon: List },
          { key: "calendar" as ViewMode, label: "Calendrier", icon: CalendarDays },
        ]).map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`px-3 py-1.5 rounded-lg font-ui text-[12px] transition-all cursor-pointer flex items-center gap-1.5 ${
              view === v.key
                ? "bg-primary text-primary-text"
                : "bg-bg-surface-1 text-t-secondary border border-b-subtle hover:bg-bg-surface-2"
            }`}
          >
            <v.icon className="h-3.5 w-3.5" />
            {v.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {view === "list" ? (
        <div className="space-y-8">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-ui text-[11px] text-t-muted uppercase tracking-wider px-1">
                À venir ({upcoming.length})
              </h2>
              <div className="space-y-2">
                {upcoming.map((t) => (
                  <TrainingCard key={t.id} training={t} />
                ))}
              </div>
            </section>
          )}

          {/* Past */}
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-ui text-[11px] text-t-muted uppercase tracking-wider px-1">
                Passées ({past.length})
              </h2>
              <div className="space-y-2">
                {past.map((t) => (
                  <TrainingCard key={t.id} training={t} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <TrainingCalendarView trainings={trainings} />
      )}
    </div>
  );
}
