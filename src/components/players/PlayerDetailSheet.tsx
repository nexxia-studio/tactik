import { useState } from "react";
import { Calendar, Pencil, User, Star, AlertTriangle, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Player } from "@/hooks/usePlayers";
import { useActiveTeam } from "@/contexts/TeamContext";
import {
  usePlayerUnavailabilities,
  useCreateUnavailability,
  useDeleteUnavailability,
  type PlayerUnavailability,
} from "@/hooks/usePlayerUnavailabilities";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { UnavailabilityDialog } from "./UnavailabilityDialog";
import { useToast } from "@/hooks/use-toast";

const positionConfig: Record<string, { bg: string; text: string }> = {
  Gardien:   { bg: "bg-[rgba(79,142,255,0.15)]",  text: "text-[var(--color-info)]"    },
  Défenseur: { bg: "bg-[rgba(255,59,48,0.15)]",   text: "text-[var(--color-danger)]"  },
  Milieu:    { bg: "bg-[rgba(255,214,10,0.15)]",  text: "text-[var(--color-warning)]" },
  Attaquant: { bg: "bg-[rgba(22,255,110,0.15)]",  text: "text-[var(--color-success)]" },
};

const REASON_LABELS: Record<PlayerUnavailability["reason"], string> = {
  injury:   "Blessure",
  vacation: "Vacances",
  personal: "Personnel",
  other:    "Autre",
};

function fmtDate(iso: string) {
  return format(new Date(iso), "d MMM yyyy", { locale: fr });
}

function isActive(u: PlayerUnavailability) {
  const today = new Date().toISOString().slice(0, 10);
  return u.start_date <= today && u.end_date >= today;
}

interface PlayerDetailSheetProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (player: Player) => void;
}

export function PlayerDetailSheet({ player, open, onOpenChange, onEdit }: PlayerDetailSheetProps) {
  const { toast } = useToast();
  const { activeTeamId: teamId } = useActiveTeam();
  const [unavailDialogOpen, setUnavailDialogOpen] = useState(false);

  const { data: unavailabilities = [] } = usePlayerUnavailabilities(player?.id);
  const createUnavailability = useCreateUnavailability();
  const deleteUnavailability = useDeleteUnavailability();

  if (!player) return null;

  const pos = positionConfig[player.position_preferred ?? ""] || { bg: "bg-bg-surface-2", text: "text-t-secondary" };
  const joinDate = new Date(player.created_at).toLocaleDateString("fr-BE", {
    day: "numeric", month: "long", year: "numeric",
  });

  const activeUnavail = unavailabilities.filter(isActive);

  const handleCreateUnavailability = async (data: {
    start_date: string;
    end_date: string;
    reason: PlayerUnavailability["reason"];
    notes: string;
  }) => {
    if (!teamId) return;
    try {
      await createUnavailability.mutateAsync({
        player_id: player.id,
        team_id: teamId,
        ...data,
      });
      toast({ title: "Indisponibilité enregistrée ✓" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
      throw err;
    }
  };

  const handleDelete = async (u: PlayerUnavailability) => {
    if (!teamId) return;
    try {
      await deleteUnavailability.mutateAsync({ id: u.id, player_id: player.id, team_id: teamId });
      toast({ title: "Indisponibilité supprimée" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  return (
    <>
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

              {/* Active unavailability badge */}
              {activeUnavail.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(255,59,48,0.12)] border border-[rgba(255,59,48,0.25)] mb-3">
                  <AlertTriangle className="h-3.5 w-3.5 text-[var(--color-danger)]" />
                  <span className="font-ui text-[11px] text-[var(--color-danger)] uppercase tracking-wide">
                    {REASON_LABELS[activeUnavail[0].reason]} — jusqu'au {fmtDate(activeUnavail[0].end_date)}
                  </span>
                </div>
              )}

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

            {/* ── Indisponibilités ─────────────────────────── */}
            <div className="bg-bg-surface-2 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-label">INDISPONIBILITÉS</p>
                <button
                  onClick={() => setUnavailDialogOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-ui text-[11px] bg-bg-surface-3 border border-b-subtle text-t-secondary hover:text-t-primary hover:bg-bg-surface-3 transition-colors cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  Déclarer
                </button>
              </div>

              {unavailabilities.length === 0 ? (
                <p className="font-ui text-[12px] text-t-muted italic">Aucune indisponibilité enregistrée</p>
              ) : (
                <div className="space-y-2">
                  {unavailabilities.map((u) => {
                    const active = isActive(u);
                    return (
                      <div
                        key={u.id}
                        className={`flex items-start gap-3 p-3 rounded-lg ${
                          active
                            ? "bg-[rgba(255,59,48,0.08)] border border-[rgba(255,59,48,0.2)]"
                            : "bg-bg-surface-1 border border-b-subtle opacity-60"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-ui text-[12px] font-semibold ${active ? "text-[var(--color-danger)]" : "text-t-secondary"}`}>
                              {REASON_LABELS[u.reason]}
                            </span>
                            {active && (
                              <span className="font-ui text-[10px] uppercase tracking-wide text-[var(--color-danger)] bg-[rgba(255,59,48,0.12)] px-1.5 py-0.5 rounded">
                                En cours
                              </span>
                            )}
                          </div>
                          <p className="font-ui text-[11px] text-t-muted mt-0.5">
                            {fmtDate(u.start_date)} → {fmtDate(u.end_date)}
                          </p>
                          {u.notes && (
                            <p className="font-ui text-[11px] text-t-secondary mt-1 truncate">{u.notes}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(u)}
                          className="shrink-0 p-1 rounded text-t-muted hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
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

      <UnavailabilityDialog
        open={unavailDialogOpen}
        onOpenChange={setUnavailDialogOpen}
        playerName={player.full_name}
        onSubmit={handleCreateUnavailability}
        submitting={createUnavailability.isPending}
      />
    </>
  );
}
