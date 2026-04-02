import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useActiveTeam } from "@/contexts/TeamContext";
import { usePlayers } from "@/hooks/usePlayers";
import {
  useTraining,
  useTrainingAttendance,
  useUpdateTraining,
  useUpsertAttendance,
} from "@/hooks/useTrainings";
import { useToast } from "@/hooks/use-toast";

type AttendanceStatus = "present" | "late" | "absent" | "excused";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; emoji: string; color: string }[] = [
  { value: "present", label: "Présent",  emoji: "✅", color: "var(--color-primary)" },
  { value: "late",    label: "Retard",   emoji: "⏰", color: "var(--color-warning)" },
  { value: "absent",  label: "Absent",   emoji: "🔴", color: "var(--color-danger)"  },
  { value: "excused", label: "Excusé",   emoji: "📋", color: "var(--color-info)"    },
];

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  scheduled:  { label: "À venir",  bg: "rgba(79,142,255,0.15)",  color: "var(--color-info)"    },
  completed:  { label: "Terminé",  bg: "rgba(22,255,110,0.15)",  color: "var(--color-primary)" },
  cancelled:  { label: "Annulé",   bg: "rgba(255,59,48,0.15)",   color: "var(--color-danger)"  },
};

function formatFullDate(iso: string) {
  return new Date(iso)
    .toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours()}h${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeTeamId: teamId } = useActiveTeam();

  const { data: training, isLoading } = useTraining(id);
  const { data: attendanceRecords = [] } = useTrainingAttendance(id);
  const { data: teamPlayers = [] } = usePlayers(teamId);

  const updateTraining = useUpdateTraining();
  const upsertAttendance = useUpsertAttendance();

  const [notes, setNotes] = useState<string | null>(null);
  // null = use server value, string = local edit in progress

  const currentNotes = notes !== null ? notes : (training?.notes ?? "");

  // Merge teamPlayers with existing attendance records
  const playerAttendance = useMemo(() => {
    const map = new Map(attendanceRecords.map((a) => [a.player_id, a.status as AttendanceStatus]));
    return teamPlayers.map((p) => ({
      player_id: p.id,
      full_name: p.full_name,
      shirt_number: p.shirt_number,
      status: map.get(p.id) ?? null,
    }));
  }, [teamPlayers, attendanceRecords]);

  const attStats = useMemo(() => {
    const withStatus = playerAttendance.filter((p) => p.status !== null);
    const present = withStatus.filter((p) => p.status === "present").length;
    const late    = withStatus.filter((p) => p.status === "late").length;
    const absent  = withStatus.filter((p) => p.status === "absent").length;
    const excused = withStatus.filter((p) => p.status === "excused").length;
    const total   = playerAttendance.length;
    const attended = present + late;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
    return { present, late, absent, excused, total, attended, rate };
  }, [playerAttendance]);

  const handleAttendanceChange = async (player_id: string, current: AttendanceStatus | null, next: AttendanceStatus) => {
    if (!id) return;
    // clicking same status again deselects — we just update to the new value
    if (current === next) return;
    try {
      await upsertAttendance.mutateAsync({ training_id: id, player_id, status: next });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    try {
      await updateTraining.mutateAsync({ id, notes: currentNotes });
      setNotes(null); // reset to server value
      toast({ title: "Notes sauvegardées ✓" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleMarkCompleted = async () => {
    if (!id) return;
    try {
      await updateTraining.mutateAsync({ id, status: "completed" });
      toast({ title: "Séance marquée terminée ✓" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/entrainements")}
          className="flex items-center gap-2 font-ui text-[13px] text-t-secondary hover:text-t-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-bg-surface-1 border border-b-subtle rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate("/entrainements")}
          className="flex items-center gap-2 font-ui text-[13px] text-t-secondary hover:text-t-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <p className="font-ui text-t-muted text-center py-12">Séance introuvable</p>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[training.status] ?? STATUS_STYLES.scheduled;
  const isScheduled = training.status === "scheduled";

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/entrainements")}
          className="flex items-center gap-2 font-ui text-[13px] text-t-secondary hover:text-t-primary transition-colors cursor-pointer mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-display text-t-primary leading-none uppercase" style={{ fontSize: "var(--text-h1)" }}>
              {formatFullDate(training.scheduled_at)}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="font-ui text-[13px] text-t-secondary flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(training.scheduled_at)}
              </span>
              {training.location && (
                <span className="font-ui text-[13px] text-t-secondary flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {training.location}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="px-2.5 py-1 rounded-md font-ui text-[10px] uppercase tracking-wider"
              style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
            >
              {statusStyle.label}
            </span>
            {isScheduled && (
              <Button
                size="sm"
                onClick={handleMarkCompleted}
                disabled={updateTraining.isPending}
                className="bg-primary text-primary-text font-ui text-[11px] hover:opacity-90 flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Terminer
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Présences */}
      {teamPlayers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-ui text-[11px] text-t-muted uppercase tracking-wider">
              Présences — {attStats.attended}/{attStats.total}
            </h2>
            <span className="font-ui text-[11px] text-t-muted">{attStats.rate}%</span>
          </div>

          {attStats.total > 0 && (
            <div className="h-2 w-full rounded-full bg-bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${attStats.rate}%`,
                  backgroundColor:
                    attStats.rate > 75 ? "var(--color-primary)" :
                    attStats.rate >= 50 ? "var(--color-warning)" :
                    "var(--color-danger)",
                }}
              />
            </div>
          )}

          <div className="space-y-1">
            {playerAttendance.map((att) => {
              const initials = att.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div
                  key={att.player_id}
                  className="bg-bg-surface-1 border border-b-subtle rounded-xl px-4 py-2.5 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-bg-surface-2 flex items-center justify-center shrink-0">
                    <span className="font-ui text-[11px] text-t-muted">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-ui text-[13px] text-t-primary truncate">{att.full_name}</p>
                    {att.shirt_number != null && (
                      <p className="font-ui text-[11px] text-t-muted">#{att.shirt_number}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleAttendanceChange(att.player_id, att.status as AttendanceStatus | null, opt.value)}
                        className={`w-7 h-7 rounded-md flex items-center justify-center text-[12px] transition-all cursor-pointer border ${
                          att.status === opt.value
                            ? "border-transparent"
                            : "border-transparent opacity-30 hover:opacity-70"
                        }`}
                        style={{
                          backgroundColor: att.status === opt.value ? `${opt.color}20` : "transparent",
                        }}
                        title={opt.label}
                      >
                        {opt.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Présents", value: attStats.present, color: "var(--color-primary)" },
              { label: "Retards",  value: attStats.late,    color: "var(--color-warning)" },
              { label: "Absents",  value: attStats.absent,  color: "var(--color-danger)"  },
              { label: "Excusés",  value: attStats.excused, color: "var(--color-info)"    },
            ].map((s) => (
              <div key={s.label} className="bg-bg-surface-1 border border-b-subtle rounded-xl p-3 text-center">
                <p className="font-display text-[18px]" style={{ color: s.color }}>{s.value}</p>
                <p className="font-ui text-[10px] text-t-muted uppercase mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Notes du coach */}
      <section className="space-y-3">
        <h2 className="font-ui text-[11px] text-t-muted uppercase tracking-wider px-1">
          Notes du coach
        </h2>
        <Textarea
          value={currentNotes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes de séance..."
          className="bg-bg-surface-2 border-b-subtle text-t-primary font-ui text-[14px] min-h-[120px]"
        />
        <Button
          onClick={handleSaveNotes}
          disabled={updateTraining.isPending || notes === null}
          className="bg-primary text-primary-text font-ui hover:opacity-90 flex items-center gap-2 disabled:opacity-40"
        >
          <Save className="h-4 w-4" />
          Sauvegarder les notes
        </Button>
      </section>
    </div>
  );
}
