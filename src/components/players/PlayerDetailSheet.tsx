import { Calendar, Pencil, User, Star } from "lucide-react";
import type { Player } from "@/hooks/usePlayers";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const positionConfig: Record<string, { bg: string; text: string }> = {
  Gardien:   { bg: "bg-[rgba(79,142,255,0.15)]",  text: "text-[var(--color-info)]"    },
  Défenseur: { bg: "bg-[rgba(255,59,48,0.15)]",   text: "text-[var(--color-danger)]"  },
  Milieu:    { bg: "bg-[rgba(255,214,10,0.15)]",  text: "text-[var(--color-warning)]" },
  Attaquant: { bg: "bg-[rgba(22,255,110,0.15)]",  text: "text-[var(--color-success)]" },
};

interface PlayerDetailSheetProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (player: Player) => void;
}

export function PlayerDetailSheet({ player, open, onOpenChange, onEdit }: PlayerDetailSheetProps) {
  if (!player) return null;
  const pos = positionConfig[player.position_preferred ?? ""] || { bg: "bg-bg-surface-2", text: "text-t-secondary" };
  const joinDate = new Date(player.created_at).toLocaleDateString("fr-BE", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-bg-surface-1 border-b-subtle w-full sm:max-w-md p-0 overflow-y-auto">
        {/* Header with avatar */}
        <div className="relative px-6 pt-8 pb-6">
          <div className="flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-bg-surface-2 overflow-hidden flex items-center justify-center mb-4 border-2 border-b-subtle">
              {player.avatar_url ? (
                <img src={player.avatar_url} alt={player.full_name} className="h-full w-full object-cover" />
              ) : player.shirt_number ? (
                <span className="font-display text-[32px] text-t-primary">{player.shirt_number}</span>
              ) : (
                <User className="h-10 w-10 text-t-muted" />
              )}
            </div>
            <h2 className="font-display text-t-primary leading-none" style={{ fontSize: "var(--text-h2)" }}>
              {player.full_name.toUpperCase()}
            </h2>
            {player.nickname && (
              <p className="font-ui text-[13px] text-t-muted mt-1">« {player.nickname} »</p>
            )}
            <div className="flex items-center gap-2 mt-3">
              {player.position_preferred && (
                <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-ui font-semibold uppercase tracking-wider ${pos.bg} ${pos.text}`}>
                  {player.position_preferred}
                </span>
              )}
              {player.shirt_number && (
                <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-display bg-bg-surface-2 text-t-secondary">
                  #{player.shirt_number}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info sections */}
        <div className="px-6 pb-8 space-y-4">
          {/* Infos */}
          <div className="bg-bg-surface-2 rounded-xl p-4 space-y-3">
            <p className="text-label">INFOS</p>
            <div className="space-y-2">
              {player.birth_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-t-muted shrink-0" />
                  <span className="font-ui text-[13px] text-t-primary">
                    {new Date(player.birth_date).toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Star className="h-4 w-4 text-t-muted shrink-0" />
                <span className="font-ui text-[13px] text-t-secondary">
                  Niveau {player.level} — {player.xp_points} XP
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-t-muted shrink-0" />
                <span className="font-ui text-[13px] text-t-secondary">
                  Ajouté le {joinDate}
                </span>
              </div>
            </div>
          </div>

          {/* Stats placeholder */}
          <div className="bg-bg-surface-2 rounded-xl p-4 space-y-3">
            <p className="text-label">STATISTIQUES</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Matchs", value: "—" },
                { label: "Titulaire", value: "—" },
                { label: "Note moy.", value: "—" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-[20px] text-t-primary">{stat.value}</p>
                  <p className="font-ui text-[10px] text-t-muted uppercase tracking-wider mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={() => { onOpenChange(false); onEdit(player); }}
            className="w-full flex items-center justify-center gap-2 font-ui text-[11px] font-semibold tracking-wider uppercase
                       px-4 py-3 rounded-lg bg-primary text-primary-text
                       hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier le joueur
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
