import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, MapPin, Clock, Lock, Zap } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useActiveTeam } from "@/contexts/TeamContext";
import { usePlayers, playerDisplayName } from "@/hooks/usePlayers";
import {
  useTraining,
  useTrainingAttendance,
  useUpdateTraining,
  useUpsertAttendance,
  useDeleteAttendance,
} from "@/hooks/useTrainings";
import { useActiveUnavailabilities } from "@/hooks/usePlayerUnavailabilities";
import { TrainingSectionsEditor } from "@/components/trainings/TrainingSectionsEditor";
import { useToast } from "@/hooks/use-toast";

type SimpleStatus = "present" | "absent";

const TRAINING_STATUS_CYCLE = [
  { value: "scheduled",   label: "Planifié",  bg: "rgba(79,142,255,0.15)",  color: "var(--color-info)"    },
  { value: "in_progress", label: "En cours",  bg: "rgba(255,200,0,0.15)",   color: "var(--color-warning)" },
  { value: "completed",   label: "Terminé",   bg: "rgba(22,255,110,0.15)",  color: "var(--color-primary)" },
];

const ATT_BUTTONS: { value: SimpleStatus; emoji: string; label: string; color: string }[] = [
  { value: "present", emoji: "✅", label: "Présent", color: "var(--color-primary)" },
  { value: "absent",  emoji: "❌", label: "Absent",  color: "var(--color-danger)"  },
];

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
  const deleteAttendance = useDeleteAttendance();

  const [notes, setNotes] = useState<string | null>(null);

  const currentNotes = notes !== null ? notes : (training?.notes ?? "");

  const sessionDateISO = training?.scheduled_at
    ? new Date(training.scheduled_at).toISOString().split("T")[0]
    : "";
  const { data: activeUnavailabilities = [] } = useActiveUnavailabilities(teamId, sessionDateISO);
  const unavailablePlayerIds = useMemo(
    () => new Set(activeUnavailabilities.map((u) => u.player_id)),
    [activeUnavailabilities]
  );

  // Auto-completed: scheduled_at + 2h < now, but status still "scheduled"
  const isAutoCompleted = useMemo(() => {
    if (!training || training.status !== "scheduled") return false;
    return Date.now() > new Date(training.scheduled_at).getTime() + 2 * 60 * 60 * 1000;
  }, [training]);

  const playerAttendance = useMemo(() => {
    const map = new Map(attendanceRecords.map((a) => [a.player_id, a.status]));
    return teamPlayers.map((p) => ({
      player_id: p.id,
      full_name: playerDisplayName(p),
      shirt_number: p.shirt_number,
      status: map.get(p.id) ?? null,
      isUnavailable: unavailablePlayerIds.has(p.id),
    }));
  }, [teamPlayers, attendanceRecords, unavailablePlayerIds]);

  const availableAttendance = useMemo(
    () => playerAttendance.filter((p) => !p.isUnavailable),
    [playerAttendance]
  );
  const unavailableAttendance = useMemo(
    () => playerAttendance.filter((p) => p.isUnavailable),
    [playerAttendance]
  );

  const attStats = useMemo(() => {
    const present = playerAttendance.filter((p) => p.status === "present").length;
    const absent = playerAttendance.filter((p) => p.status === "absent").length;
    const total = playerAttendance.length;
    const attended = present;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
    return { present, absent, total, attended, rate };
  }, [playerAttendance]);

  const handleSetStatus = async (newStatus: string) => {
    if (!id || newStatus === training?.status) return;
    try {
      await updateTraining.mutateAsync({ id, status: newStatus });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleAttendanceClick = async (
    player_id: string,
    current: string | null,
    clicked: SimpleStatus,
    isUnavailable?: boolean
  ) => {
    if (!id) return;
    if (isUnavailable && clicked === "present") {
      if (!window.confirm("Ce joueur est déclaré indisponible. Forcer quand même sa présence ?")) return;
    }
    if (current === clicked) {
      // Toggle off → clear (delete record)
      try {
        await deleteAttendance.mutateAsync({ training_id: id, player_id });
      } catch (err: any) {
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
      }
    } else {
      try {
        await upsertAttendance.mutateAsync({ training_id: id, player_id, status: clicked });
      } catch (err: any) {
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
      }
    }
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    try {
      await updateTraining.mutateAsync({ id, notes: currentNotes });
      setNotes(null);
      toast({ title: "Notes sauvegardées ✓" });
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

  const currentStatusStyle = TRAINING_STATUS_CYCLE.find((s) => s.value === training.status)
    ?? TRAINING_STATUS_CYCLE[0];

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

          {/* Status chips */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            {TRAINING_STATUS_CYCLE.map((s) => (
              <button
                key={s.value}
                onClick={() => handleSetStatus(s.value)}
                disabled={updateTraining.isPending}
                className={`px-2.5 py-1 rounded-md font-ui text-[10px] uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed ${
                  training.status === s.value
                    ? "opacity-100 ring-1 ring-current/30"
                    : "opacity-30 hover:opacity-60"
                }`}
                style={{ backgroundColor: s.bg, color: s.color }}
              >
                {s.label}
              </button>
            ))}
            {isAutoCompleted && (
              <span
                className="flex items-center gap-1 px-2 py-1 rounded-md font-ui text-[10px] uppercase tracking-wider"
                style={{ backgroundColor: "rgba(255,200,0,0.1)", color: "var(--color-warning)" }}
              >
                <Zap className="h-3 w-3" />
                Auto-terminé
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Programme de séance */}
      <TrainingSectionsEditor trainingId={training.id} />

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

          {/* Available players */}
          <div className="space-y-1">
            {availableAttendance.map((att) => {
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
                    {ATT_BUTTONS.map((btn) => (
                      <button
                        key={btn.value}
                        onClick={() => handleAttendanceClick(att.player_id, att.status, btn.value)}
                        title={btn.label}
                        className={`w-7 h-7 rounded-md flex items-center justify-center text-[12px] transition-all cursor-pointer ${
                          att.status === btn.value
                            ? "opacity-100"
                            : "opacity-25 hover:opacity-60"
                        }`}
                        style={{
                          backgroundColor: att.status === btn.value ? `${btn.color}20` : "transparent",
                        }}
                      >
                        {btn.emoji}
                      </button>
                    ))}
                    {/* À définir (clear) */}
                    <button
                      onClick={() => att.status && deleteAttendance.mutate({ training_id: id!, player_id: att.player_id })}
                      title="À définir"
                      className={`w-7 h-7 rounded-md flex items-center justify-center text-[12px] transition-all cursor-pointer ${
                        att.status === null ? "opacity-100" : "opacity-25 hover:opacity-60"
                      }`}
                    >
                      ⚪
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unavailable players */}
          {unavailableAttendance.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 px-1">
                <Lock className="h-3 w-3 text-[var(--color-danger)]" />
                <h3 className="font-ui text-[11px] text-[var(--color-danger)] uppercase tracking-wider">
                  Absents / Indisponibles ({unavailableAttendance.length})
                </h3>
              </div>
              <div className="space-y-1">
                {unavailableAttendance.map((att) => {
                  const initials = att.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                  // Visually pre-fill as absent when no record exists
                  const effectiveStatus = att.status ?? "absent";
                  return (
                    <div
                      key={att.player_id}
                      className="bg-[rgba(255,59,48,0.05)] border border-[rgba(255,59,48,0.2)] rounded-xl px-4 py-2.5 flex items-center gap-3 opacity-80"
                    >
                      <div className="w-8 h-8 rounded-full bg-bg-surface-2 flex items-center justify-center shrink-0">
                        <span className="font-ui text-[11px] text-t-muted">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-ui text-[13px] text-t-primary truncate">{att.full_name}</p>
                        <div className="flex items-center gap-1.5">
                          {att.shirt_number != null && (
                            <span className="font-ui text-[11px] text-t-muted">#{att.shirt_number}</span>
                          )}
                          <span className="font-ui text-[10px] text-[var(--color-danger)] uppercase tracking-wider">
                            Indisponible
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {ATT_BUTTONS.map((btn) => (
                          <button
                            key={btn.value}
                            onClick={() => handleAttendanceClick(att.player_id, att.status, btn.value, true)}
                            title={btn.label}
                            className={`w-7 h-7 rounded-md flex items-center justify-center text-[12px] transition-all cursor-pointer ${
                              effectiveStatus === btn.value
                                ? "opacity-100"
                                : "opacity-25 hover:opacity-60"
                            }`}
                            style={{
                              backgroundColor: effectiveStatus === btn.value ? `${btn.color}20` : "transparent",
                            }}
                          >
                            {btn.emoji}
                          </button>
                        ))}
                        <button
                          onClick={() => att.status && deleteAttendance.mutate({ training_id: id!, player_id: att.player_id })}
                          title="À définir"
                          className={`w-7 h-7 rounded-md flex items-center justify-center text-[12px] transition-all cursor-pointer ${
                            att.status === null ? "opacity-100" : "opacity-25 hover:opacity-60"
                          }`}
                        >
                          ⚪
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Présents", value: attStats.present, color: "var(--color-primary)" },
              { label: "Absents",  value: attStats.absent,  color: "var(--color-danger)"  },
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
