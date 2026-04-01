import { useNavigate } from "react-router-dom";
import { MapPin, Users, ChevronRight } from "lucide-react";
import type { Training, PhaseType } from "@/data/mockTrainings";
import { PHASE_META } from "@/data/mockTrainings";

const PHASE_ORDER: PhaseType[] = ["warmup", "tactical", "technical", "scrimmage"];

function formatTrainingDate(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("fr-BE", { weekday: "short" }).toUpperCase().replace(".", "");
  const num = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleDateString("fr-BE", { month: "short" }).toUpperCase().replace(".", "");
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${num} ${month} — ${h}H${m}`;
}

function getAttendanceStats(training: Training) {
  const present = training.attendance.filter((a) => a.status === "present").length;
  const late = training.attendance.filter((a) => a.status === "late").length;
  const total = training.attendance.length;
  const attended = present + late;
  const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
  return { present, late, attended, total, rate };
}

export default function TrainingCard({ training }: { training: Training }) {
  const navigate = useNavigate();
  const isUpcoming = training.status === "planned";
  const stats = getAttendanceStats(training);
  const convoked = training.attendance.length;

  return (
    <div
      onClick={() => navigate(`/seance/${training.id}`)}
      className="bg-bg-surface-1 border border-b-subtle rounded-xl p-4 hover:border-b-default transition-all cursor-pointer animate-fade-in group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          {/* Badge */}
          <span
            className="inline-block px-2 py-0.5 rounded-md font-ui text-[10px] uppercase tracking-wider"
            style={{
              backgroundColor: isUpcoming ? "rgba(79,142,255,0.15)" : "rgba(22,255,110,0.15)",
              color: isUpcoming ? "var(--color-info)" : "var(--color-primary)",
            }}
          >
            {isUpcoming ? "À venir" : "Terminé"}
          </span>

          {/* Date */}
          <p className="font-display text-[14px] text-t-primary leading-tight">
            {formatTrainingDate(training.scheduled_at)}
          </p>

          {/* Location */}
          <p className="font-ui text-[12px] text-t-secondary italic flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {training.location}
          </p>

          {/* Attendance or players count */}
          {isUpcoming ? (
            <p className="font-ui text-[12px] text-t-muted flex items-center gap-1">
              <Users className="h-3 w-3" />
              {convoked} joueurs
            </p>
          ) : (
            <div className="space-y-1">
              <p className="font-ui text-[12px] text-t-secondary">
                {stats.attended}/{stats.total} présents
              </p>
              <div className="h-1.5 w-full max-w-[140px] rounded-full bg-bg-surface-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${stats.rate}%`,
                    backgroundColor:
                      stats.rate > 75 ? "var(--color-primary)" :
                      stats.rate >= 50 ? "var(--color-warning)" :
                      "var(--color-danger)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Coach notes (past only) */}
          {!isUpcoming && training.notes && (
            <p className="font-ui text-[11px] text-t-muted line-clamp-2 mt-1">
              {training.notes}
            </p>
          )}
        </div>

        {/* Right side: phases + arrow */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Phase icons */}
          <div className="flex gap-1.5">
            {PHASE_ORDER.map((phaseType) => {
              const phase = training.phases.find((p) => p.type === phaseType);
              const active = phase && phase.drills.length > 0;
              const meta = PHASE_META[phaseType];
              return (
                <div
                  key={phaseType}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[12px]"
                  style={{
                    backgroundColor: active ? `${meta.color}20` : "var(--bg-surface-2)",
                    opacity: active ? 1 : 0.4,
                  }}
                  title={meta.label}
                >
                  {meta.icon}
                </div>
              );
            })}
          </div>

          {/* Action */}
          <div className="flex items-center gap-1 mt-auto">
            <span className="font-ui text-[11px] text-t-muted group-hover:text-primary transition-colors">
              {isUpcoming ? "Planifier" : "Voir"}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-t-muted group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}
