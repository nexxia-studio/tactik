import { useNavigate } from "react-router-dom";
import { MapPin, ChevronRight } from "lucide-react";
import type { Training } from "@/hooks/useTrainings";

function formatTrainingDate(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("fr-BE", { weekday: "short" }).toUpperCase().replace(".", "");
  const num = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleDateString("fr-BE", { month: "short" }).toUpperCase().replace(".", "");
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${num} ${month} — ${h}H${m}`;
}

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  scheduled:  { label: "À venir",  bg: "rgba(79,142,255,0.15)",  color: "var(--color-info)"    },
  completed:  { label: "Terminé",  bg: "rgba(22,255,110,0.15)",  color: "var(--color-primary)" },
  cancelled:  { label: "Annulé",   bg: "rgba(255,59,48,0.15)",   color: "var(--color-danger)"  },
};

export default function TrainingCard({ training }: { training: Training }) {
  const navigate = useNavigate();
  const style = STATUS_STYLES[training.status] ?? STATUS_STYLES.scheduled;

  return (
    <div
      onClick={() => navigate(`/seance/${training.id}`)}
      className="bg-bg-surface-1 border border-b-subtle rounded-xl p-4 hover:border-b-default transition-all cursor-pointer animate-fade-in group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <span
            className="inline-block px-2 py-0.5 rounded-md font-ui text-[10px] uppercase tracking-wider"
            style={{ backgroundColor: style.bg, color: style.color }}
          >
            {style.label}
          </span>

          <p className="font-display text-[14px] text-t-primary leading-tight">
            {formatTrainingDate(training.scheduled_at)}
          </p>

          {training.location && (
            <p className="font-ui text-[12px] text-t-secondary italic flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {training.location}
            </p>
          )}

          {training.status === "completed" && training.notes && (
            <p className="font-ui text-[11px] text-t-muted line-clamp-2 mt-1">
              {training.notes}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 mt-auto shrink-0">
          <span className="font-ui text-[11px] text-t-muted group-hover:text-primary transition-colors">
            {training.status === "scheduled" ? "Planifier" : "Voir"}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-t-muted group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  );
}
