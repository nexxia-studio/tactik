import { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown, Shield } from "lucide-react";
import { useActiveTeam } from "@/contexts/TeamContext";

const SHOW_ON_ROUTES = ["/dashboard", "/", "/plus"];

interface TeamSelectorProps {
  variant?: "sidebar" | "mobile";
}

export function TeamSelector({ variant = "sidebar" }: TeamSelectorProps) {
  const { teams, activeTeam, setActiveTeamId, teamsLoading } = useActiveTeam();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  if (!SHOW_ON_ROUTES.includes(pathname)) return null;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (teamsLoading) {
    return (
      <div className={`${variant === "sidebar" ? "mx-3 mb-3" : ""} h-8 bg-bg-surface-2 rounded-lg animate-pulse`} />
    );
  }

  if (!teams.length) return null;

  // Single team — just a label, no dropdown needed
  if (teams.length === 1) {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg px-3 py-2 bg-bg-surface-2 border border-b-subtle
          ${variant === "sidebar" ? "mx-3 mb-3" : ""}`}
      >
        <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="font-ui text-[13px] text-t-primary truncate">
          {activeTeam?.name ?? "—"}
        </span>
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative ${variant === "sidebar" ? "mx-3 mb-3" : ""}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 bg-bg-surface-2 border border-b-subtle
                   hover:border-primary-border transition-colors cursor-pointer group"
      >
        <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="flex-1 font-ui text-[13px] text-t-primary truncate text-left">
          {activeTeam?.name ?? "Sélectionner une équipe"}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-t-muted transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-bg-surface-2 border border-b-subtle rounded-lg shadow-lg overflow-hidden">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => { setActiveTeamId(team.id); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors cursor-pointer
                ${team.id === activeTeam?.id
                  ? "bg-primary-dim text-primary"
                  : "text-t-secondary hover:bg-bg-surface-3 hover:text-t-primary"
                }`}
            >
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-ui text-[13px] truncate">{team.name}</p>
                {team.category && (
                  <p className="font-ui text-[11px] text-t-muted truncate">{team.category}</p>
                )}
              </div>
              {team.id === activeTeam?.id && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
