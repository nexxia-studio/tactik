import { useMemo } from "react";
import { List, CalendarDays } from "lucide-react";
import { useState } from "react";
import { useActiveTeam } from "@/contexts/TeamContext";
import { useTrainings, useCreateTraining } from "@/hooks/useTrainings";
import { useToast } from "@/hooks/use-toast";
import TrainingCard from "@/components/trainings/TrainingCard";
import TrainingCalendarView from "@/components/trainings/TrainingCalendarView";
import NewSessionDialog from "@/components/trainings/NewSessionDialog";

type ViewMode = "list" | "calendar";

export default function TrainingsPage() {
  const { toast } = useToast();
  const { activeTeamId: teamId, activeTeam } = useActiveTeam();
  const { data: trainings = [], isLoading } = useTrainings(teamId);
  const createTraining = useCreateTraining(teamId, activeTeam?.season_id);

  const [view, setView] = useState<ViewMode>("list");

  const upcoming = useMemo(
    () => trainings
      .filter((t) => t.status === "scheduled")
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)),
    [trainings]
  );

  const past = useMemo(
    () => trainings
      .filter((t) => t.status === "completed" || t.status === "cancelled")
      .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at)),
    [trainings]
  );

  const handleAddSession = async (data: { date: string; time: string; location: string; notes: string }) => {
    try {
      await createTraining.mutateAsync({
        scheduled_at: `${data.date}T${data.time}:00`,
        location: data.location,
        notes: data.notes || null,
      });
      toast({ title: "Séance créée ✓" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      {/* Header */}
      <div className="min-w-0">
        <h1 className="font-display text-t-primary leading-none truncate" style={{ fontSize: "clamp(20px, 5vw, 40px)" }}>
          ENTRAÎNEMENTS
        </h1>
        <p className="text-t-secondary font-ui text-[var(--text-small)] mt-1">
          {trainings.length} séance{trainings.length !== 1 ? "s" : ""} cette saison
        </p>
      </div>

      {/* View toggle + action button on same row */}
      <div className="flex items-center gap-1.5">
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
        <div className="ml-auto">
          <NewSessionDialog onAdd={handleAddSession} compact />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-bg-surface-1 border border-b-subtle rounded-xl p-4 h-[88px] animate-pulse" />
          ))}
        </div>
      ) : view === "list" ? (
        <div className="space-y-8">
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

          {trainings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-ui text-[14px] text-t-secondary">Aucune séance planifiée</p>
              <p className="font-ui text-[12px] text-t-muted mt-1">Crée ta première séance d'entraînement.</p>
            </div>
          )}
        </div>
      ) : (
        <TrainingCalendarView trainings={trainings} />
      )}
    </div>
  );
}
