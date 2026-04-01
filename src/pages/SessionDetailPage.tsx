import { useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Pencil, ChevronDown, ChevronUp, Trash2,
  Youtube, Clock, Plus, Save, GripVertical,
} from "lucide-react";
import { MOCK_TRAININGS, PHASE_META, type Training, type TrainingPhase, type AttendanceStatus, type PhaseType, type Drill } from "@/data/mockTrainings";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import AddDrillDialog from "@/components/trainings/AddDrillDialog";

const PHASE_ORDER: PhaseType[] = ["warmup", "tactical", "technical", "scrimmage"];

function formatFullDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).toUpperCase();
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours()}h${String(d.getMinutes()).padStart(2, "0")}`;
}

function getSourceIcon(source: string) {
  switch (source) {
    case "youtube": return <Youtube className="h-3 w-3 text-[#FF0000]" />;
    case "tiktok": return <span className="text-[10px]">🎵</span>;
    default: return <span className="text-[10px]">📋</span>;
  }
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; emoji: string; color: string }[] = [
  { value: "present", label: "Présent",  emoji: "✅", color: "var(--color-primary)" },
  { value: "late",    label: "Retard",   emoji: "⏰", color: "var(--color-warning)" },
  { value: "absent",  label: "Absent",   emoji: "🔴", color: "var(--color-danger)" },
  { value: "excused", label: "Excusé",   emoji: "📋", color: "var(--color-info)" },
];

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const initialTraining = MOCK_TRAININGS.find((t) => t.id === id);
  const [training, setTraining] = useState<Training | undefined>(initialTraining);
  const [expandedPhases, setExpandedPhases] = useState<Record<PhaseType, boolean>>({
    warmup: true, tactical: true, technical: true, scrimmage: true,
  });
  const [notes, setNotes] = useState(initialTraining?.notes || "");
  const dragItem = useRef<{ phaseType: PhaseType; index: number } | null>(null);
  const dragOverItem = useRef<{ phaseType: PhaseType; index: number } | null>(null);

  const handleDragStart = (phaseType: PhaseType, index: number) => {
    dragItem.current = { phaseType, index };
  };

  const handleDragEnter = (phaseType: PhaseType, index: number) => {
    dragOverItem.current = { phaseType, index };
  };

  const handleDragEnd = () => {
    if (!dragItem.current || !dragOverItem.current) return;
    if (dragItem.current.phaseType !== dragOverItem.current.phaseType) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }
    const pt = dragItem.current.phaseType;
    const fromIdx = dragItem.current.index;
    const toIdx = dragOverItem.current.index;
    if (fromIdx === toIdx) { dragItem.current = null; dragOverItem.current = null; return; }

    setTraining((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        phases: prev.phases.map((phase) => {
          if (phase.type !== pt) return phase;
          const newDrills = [...phase.drills];
          const [moved] = newDrills.splice(fromIdx, 1);
          newDrills.splice(toIdx, 0, moved);
          return { ...phase, drills: newDrills };
        }),
      };
    });
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Attendance stats
  const addDrillToPhase = (phaseType: PhaseType, drill: Drill) => {
    setTraining((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        phases: prev.phases.map((phase) => {
          if (phase.type !== phaseType) return phase;
          return { ...phase, drills: [...phase.drills, drill] };
        }),
      };
    });
  };

  const attStats = useMemo(() => {
    if (!training) return { present: 0, late: 0, absent: 0, excused: 0, total: 0, attended: 0, rate: 0 };
    const present = training.attendance.filter((a) => a.status === "present").length;
    const late = training.attendance.filter((a) => a.status === "late").length;
    const absent = training.attendance.filter((a) => a.status === "absent").length;
    const excused = training.attendance.filter((a) => a.status === "excused").length;
    const total = training.attendance.length;
    const attended = present + late;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
    return { present, late, absent, excused, total, attended, rate };
  }, [training]);

  if (!training) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate("/entrainements")} className="flex items-center gap-2 font-ui text-[13px] text-t-secondary hover:text-t-primary transition-colors cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <p className="font-ui text-t-muted text-center py-12">Séance introuvable</p>
      </div>
    );
  }

  const isUpcoming = training.status === "planned";
  const isCompleted = training.status === "completed";

  const togglePhase = (type: PhaseType) => {
    setExpandedPhases((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const totalDuration = training.phases.reduce((sum, p) => sum + p.duration, 0);
  const totalHours = Math.floor(totalDuration / 60);
  const totalMins = totalDuration % 60;

  const updateAttendance = (playerId: string, status: AttendanceStatus) => {
    setTraining((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        attendance: prev.attendance.map((a) =>
          a.player_id === playerId ? { ...a, status } : a
        ),
      };
    });
  };

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
            <p className="font-ui text-t-secondary text-[var(--text-body)]">
              {formatTime(training.scheduled_at)} — {training.location}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="px-2.5 py-1 rounded-md font-ui text-[10px] uppercase tracking-wider"
              style={{
                backgroundColor: isUpcoming ? "rgba(79,142,255,0.15)" : isCompleted ? "rgba(22,255,110,0.15)" : "rgba(255,214,10,0.15)",
                color: isUpcoming ? "var(--color-info)" : isCompleted ? "var(--color-primary)" : "var(--color-warning)",
              }}
            >
              {isUpcoming ? "Planifiée" : isCompleted ? "Terminée" : "En cours"}
            </span>
            {isUpcoming && (
              <button className="w-8 h-8 rounded-lg bg-bg-surface-1 border border-b-subtle flex items-center justify-center hover:bg-bg-surface-2 transition-all cursor-pointer">
                <Pencil className="h-3.5 w-3.5 text-t-muted" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section 1 — Plan de séance */}
      <section className="space-y-3">
        <h2 className="font-ui text-[11px] text-t-muted uppercase tracking-wider px-1">
          Plan de séance
        </h2>

        {PHASE_ORDER.map((phaseType, phaseIndex) => {
          const phase = training.phases.find((p) => p.type === phaseType);
          if (!phase) return null;
          const meta = PHASE_META[phaseType];
          const expanded = expandedPhases[phaseType];

          return (
            <div
              key={phaseType}
              className="bg-bg-surface-1 border border-b-subtle rounded-xl overflow-hidden"
            >
              {/* Phase header */}
              <button
                onClick={() => togglePhase(phaseType)}
                className="w-full px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-bg-surface-2 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px]"
                    style={{ backgroundColor: `${meta.color}20` }}
                  >
                    {meta.icon}
                  </div>
                  <div className="text-left">
                    <p className="font-ui text-[12px] text-t-secondary uppercase tracking-wider">
                      Phase {phaseIndex + 1}
                    </p>
                    <p className="font-ui text-[14px] text-t-primary">{meta.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-ui text-[12px] text-t-muted flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {phase.duration} min
                  </span>
                  {expanded ? (
                    <ChevronUp className="h-4 w-4 text-t-muted" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-t-muted" />
                  )}
                </div>
              </button>

              {/* Phase content */}
              {expanded && (
                <div className="px-4 pb-4 space-y-2">
                  {phase.drills.length === 0 ? (
                    <p className="font-ui text-[12px] text-t-muted italic py-2">
                      Aucun exercice planifié
                    </p>
                  ) : (
                    phase.drills.map((drill, di) => (
                      <div
                        key={drill.id}
                        draggable={isUpcoming}
                        onDragStart={() => handleDragStart(phaseType, di)}
                        onDragEnter={() => handleDragEnter(phaseType, di)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className="flex items-center gap-3 bg-bg-surface-2 rounded-lg px-3 py-2 transition-opacity"
                        style={{ cursor: isUpcoming ? "grab" : "default" }}
                      >
                        {isUpcoming && (
                          <GripVertical className="h-3.5 w-3.5 text-t-muted shrink-0" />
                        )}
                        <span className="font-ui text-[11px] text-t-muted w-5 text-center shrink-0">
                          {di + 1}
                        </span>
                        <span className="font-ui text-[13px] text-t-primary flex-1">
                          {drill.name}
                        </span>
                        <span className="font-ui text-[11px] text-t-muted flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {drill.duration}'
                        </span>
                        {getSourceIcon(drill.source)}
                        {isUpcoming && (
                          <button className="text-t-muted hover:text-[var(--color-danger)] transition-colors cursor-pointer">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))
                  )}

                  {isUpcoming && (
                    <AddDrillDialog
                      phaseType={phaseType}
                      existingDrillIds={phase.drills.map((d) => d.id)}
                      onAdd={(drill) => addDrillToPhase(phaseType, drill)}
                    />
                  )}

                  {/* Scrimmage: match instructions */}
                  {phaseType === "scrimmage" && isUpcoming && (
                    <div className="mt-2">
                      <Textarea
                        placeholder="Consignes pour le match..."
                        className="bg-bg-surface-2 border-b-subtle text-t-primary font-ui text-[13px] min-h-[60px]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Total duration */}
        <div className="bg-bg-surface-1 border border-b-subtle rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="font-ui text-[13px] text-t-secondary">Durée totale estimée</span>
          <span className="font-display text-[16px] text-t-primary">
            {totalHours > 0 ? `${totalHours}H` : ""}{String(totalMins).padStart(2, "0")}
          </span>
        </div>
      </section>

      {/* Section 2 — Présences */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-ui text-[11px] text-t-muted uppercase tracking-wider">
            Présences — {attStats.attended}/{attStats.total}
          </h2>
          <span className="font-ui text-[11px] text-t-muted">{attStats.rate}%</span>
        </div>

        {/* Progress bar */}
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

        {/* Player list */}
        <div className="space-y-1">
          {training.attendance.map((att) => (
            <div
              key={att.player_id}
              className="bg-bg-surface-1 border border-b-subtle rounded-xl px-4 py-2.5 flex items-center gap-3"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-bg-surface-2 flex items-center justify-center shrink-0">
                <span className="font-ui text-[11px] text-t-muted">
                  {att.first_name[0]}{att.last_name[0]}
                </span>
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-ui text-[13px] text-t-primary truncate">
                  {att.first_name} {att.last_name}
                </p>
                {att.jersey_number && (
                  <p className="font-ui text-[11px] text-t-muted">#{att.jersey_number}</p>
                )}
              </div>

              {/* Status toggles */}
              <div className="flex gap-1 shrink-0">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateAttendance(att.player_id, att.status === opt.value ? null : opt.value)}
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-[12px] transition-all cursor-pointer border ${
                      att.status === opt.value
                        ? "border-transparent"
                        : "border-transparent opacity-40 hover:opacity-70"
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
          ))}
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: "Présents", value: attStats.present, color: "var(--color-primary)" },
            { label: "Retards", value: attStats.late, color: "var(--color-warning)" },
            { label: "Absents", value: attStats.absent, color: "var(--color-danger)" },
            { label: "Excusés", value: attStats.excused, color: "var(--color-info)" },
            { label: "Taux", value: `${attStats.rate}%`, color: "var(--text-primary)" },
          ].map((s) => (
            <div key={s.label} className="bg-bg-surface-1 border border-b-subtle rounded-xl p-3 text-center">
              <p className="font-display text-[18px]" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="font-ui text-[10px] text-t-muted uppercase mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — Notes du coach */}
      <section className="space-y-3">
        <h2 className="font-ui text-[11px] text-t-muted uppercase tracking-wider px-1">
          Notes du coach
        </h2>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes de séance..."
          className="bg-bg-surface-2 border-b-subtle text-t-primary font-ui text-[14px] min-h-[120px]"
        />
        <Button
          onClick={() => setTraining((prev) => prev ? { ...prev, notes } : prev)}
          className="bg-primary text-primary-text font-ui hover:opacity-90 flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Sauvegarder les notes
        </Button>
      </section>
    </div>
  );
}
