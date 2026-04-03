import { useMemo, useState } from "react";
import { List, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { useActiveTeam } from "@/contexts/TeamContext";
import { useTrainings, useCreateTraining, useTrainingsAttendanceCounts } from "@/hooks/useTrainings";
import { useMatchesByOrg } from "@/hooks/useMatches";
import { useToast } from "@/hooks/use-toast";
import TrainingCard from "@/components/trainings/TrainingCard";
import TrainingCalendarView from "@/components/trainings/TrainingCalendarView";
import NewSessionDialog from "@/components/trainings/NewSessionDialog";

type ViewMode = "list" | "calendar";

/** Parse an ISO timestamp to UTC ms — appends Z if no timezone suffix present */
function toMs(iso: string): number {
  if (!/Z$|[+-]\d{2}:\d{2}$/.test(iso)) return new Date(iso + "Z").getTime();
  return new Date(iso).getTime();
}

export default function TrainingsPage() {
  const { toast } = useToast();
  const { activeTeamId: teamId, activeTeam } = useActiveTeam();
  const { data: trainings = [], isLoading } = useTrainings(teamId);
  const createTraining = useCreateTraining(teamId, activeTeam?.season_id);
  const trainingIds = useMemo(() => trainings.map((t) => t.id), [trainings]);
  const { data: attendanceCounts = {} } = useTrainingsAttendanceCounts(trainingIds);
  const { data: matches = [] } = useMatchesByOrg(activeTeam?.organization_id);

  const [view, setView] = useState<ViewMode>("list");
  const [showPast, setShowPast] = useState(false);

  const inProgress = useMemo(() => {
    const now = Date.now();
    return trainings
      .filter((t) => {
        if (t.status === "cancelled" || t.status === "completed") return false;
        const at = toMs(t.scheduled_at);
        return at - 30 * 60 * 1000 <= now && now <= at + 2 * 60 * 60 * 1000;
      })
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  }, [trainings]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return trainings
      .filter((t) => {
        if (t.status === "cancelled" || t.status === "completed") return false;
        const at = toMs(t.scheduled_at);
        return at > now + 2 * 60 * 60 * 1000;
      })
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  }, [trainings]);

  const past = useMemo(() => {
    const now = Date.now();
    return trainings
      .filter((t) => {
        if (t.status === "cancelled" || t.status === "completed") return true;
        const at = toMs(t.scheduled_at);
        return at + 2 * 60 * 60 * 1000 < now;
      })
      .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
  }, [trainings]);

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
          {/* En cours */}
          {inProgress.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-warning)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--color-warning)]" />
                </span>
                <h2 className="font-ui text-[11px] text-[var(--color-warning)] uppercase tracking-wider">
                  En cours
                </h2>
              </div>
              <div className="space-y-2">
                {inProgress.map((t) => (
                  <TrainingCard
                    key={t.id}
                    training={t}
                    presentCount={attendanceCounts[t.id]?.present}
                    absentCount={attendanceCounts[t.id]?.absent}
                  />
                ))}
              </div>
            </section>
          )}

          {/* À venir */}
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-ui text-[11px] text-t-muted uppercase tracking-wider px-1">
                À venir ({upcoming.length})
              </h2>
              <div className="space-y-2">
                {upcoming.map((t) => (
                  <TrainingCard
                    key={t.id}
                    training={t}
                    presentCount={attendanceCounts[t.id]?.present}
                    absentCount={attendanceCounts[t.id]?.absent}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Terminés — accordion */}
          {past.length > 0 && (
            <section className="space-y-3">
              <button
                onClick={() => setShowPast((p) => !p)}
                className="flex items-center gap-2 w-full px-1 cursor-pointer group"
              >
                <h2 className="font-ui text-[11px] text-t-muted uppercase tracking-wider group-hover:text-t-secondary transition-colors">
                  Terminés ({past.length})
                </h2>
                {showPast
                  ? <ChevronUp className="h-3.5 w-3.5 text-t-muted ml-auto" />
                  : <ChevronDown className="h-3.5 w-3.5 text-t-muted ml-auto" />
                }
              </button>
              {showPast && (
                <div className="space-y-2">
                  {past.map((t) => (
                    <TrainingCard
                      key={t.id}
                      training={t}
                      presentCount={attendanceCounts[t.id]?.present}
                      absentCount={attendanceCounts[t.id]?.absent}
                    />
                  ))}
                </div>
              )}
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
        <TrainingCalendarView trainings={trainings} matches={matches} />
      )}
    </div>
  );
}
