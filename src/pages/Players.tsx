import { useState, useMemo } from "react";
import { Plus, Users, LayoutGrid, List } from "lucide-react";
import { usePlayers, useTeams, useAddPlayer, useUpdatePlayer, useDeletePlayer } from "@/hooks/usePlayers";
import type { Player } from "@/hooks/usePlayers";
import { PlayerFilters } from "@/components/players/PlayerFilters";
import { PlayerCard } from "@/components/players/PlayerCard";
import { PlayerFormDialog } from "@/components/players/PlayerFormDialog";
import { PlayerDetailSheet } from "@/components/players/PlayerDetailSheet";
import { useToast } from "@/hooks/use-toast";

export default function Players() {
  const { toast } = useToast();
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const selectedTeamId = teams?.[0]?.id;
  const { data: players, isLoading: playersLoading } = usePlayers(selectedTeamId);

  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("Tous");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [viewingPlayer, setViewingPlayer] = useState<Player | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const addPlayer = useAddPlayer();
  const updatePlayer = useUpdatePlayer();
  const deletePlayer = useDeletePlayer();

  const filtered = useMemo(() => {
    if (!players) return [];
    return players.filter((p) => {
      const matchesSearch = !search || `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase());
      const matchesPosition = positionFilter === "Tous" || p.position === positionFilter;
      return matchesSearch && matchesPosition;
    });
  }, [players, search, positionFilter]);

  const positionStats = useMemo(() => {
    if (!players) return { Gardien: 0, Défenseur: 0, Milieu: 0, Attaquant: 0 };
    const counts: Record<string, number> = { Gardien: 0, Défenseur: 0, Milieu: 0, Attaquant: 0 };
    players.forEach((p) => { counts[p.position] = (counts[p.position] || 0) + 1; });
    return counts;
  }, [players]);

  const handleSubmit = async (data: {
    first_name: string; last_name: string; position: string;
    jersey_number: number | null; email: string | null; phone: string | null; avatar_url: string | null;
  }) => {
    try {
      if (editingPlayer) {
        await updatePlayer.mutateAsync({ id: editingPlayer.id, ...data });
        toast({ title: "Joueur modifié ✓" });
      } else {
        await addPlayer.mutateAsync({ ...data, team_id: selectedTeamId! });
        toast({ title: "Joueur ajouté ✓" });
      }
      setDialogOpen(false);
      setEditingPlayer(null);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (player: Player) => {
    try {
      await deletePlayer.mutateAsync(player.id);
      toast({ title: `${player.first_name} ${player.last_name} supprimé` });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setDialogOpen(true);
  };

  const handleView = (player: Player) => {
    setViewingPlayer(player);
    setSheetOpen(true);
  };

  const isLoading = teamsLoading || playersLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-t-primary leading-none" style={{ fontSize: "var(--text-h1)" }}>
            JOUEURS
          </h1>
          <p className="text-t-secondary font-ui text-[var(--text-small)] mt-2">
            {players?.length ?? 0} joueurs dans l'effectif
          </p>
        </div>
        <button
          onClick={() => { setEditingPlayer(null); setDialogOpen(true); }}
          disabled={!selectedTeamId}
          className="flex items-center gap-2 font-ui text-[11px] font-semibold tracking-wider uppercase
                     px-4 py-2.5 rounded-lg bg-primary text-primary-text
                     hover:opacity-90 active:scale-[0.98] transition-all
                     disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Ajouter un joueur</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {/* Position summary */}
      {players && players.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {(["Gardien", "Défenseur", "Milieu", "Attaquant"] as const).map((pos) => {
            const config: Record<string, { bg: string; text: string; border: string }> = {
              Gardien: { bg: "bg-[rgba(79,142,255,0.08)]", text: "text-[var(--color-info)]", border: "border-[rgba(79,142,255,0.15)]" },
              Défenseur: { bg: "bg-[rgba(255,59,48,0.08)]", text: "text-[var(--color-danger)]", border: "border-[rgba(255,59,48,0.15)]" },
              Milieu: { bg: "bg-[rgba(255,214,10,0.08)]", text: "text-[var(--color-warning)]", border: "border-[rgba(255,214,10,0.15)]" },
              Attaquant: { bg: "bg-[rgba(22,255,110,0.08)]", text: "text-[var(--color-success)]", border: "border-[rgba(22,255,110,0.15)]" },
            };
            const c = config[pos];
            return (
              <button
                key={pos}
                onClick={() => setPositionFilter(positionFilter === pos ? "Tous" : pos)}
                className={`${c.bg} border ${positionFilter === pos ? c.border : "border-transparent"} rounded-xl p-3 text-center transition-all cursor-pointer hover:${c.border}`}
              >
                <p className={`font-display text-[20px] ${c.text}`}>{positionStats[pos]}</p>
                <p className="font-ui text-[10px] text-t-muted uppercase tracking-wider mt-0.5">{pos}s</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <PlayerFilters
        search={search}
        onSearchChange={setSearch}
        position={positionFilter}
        onPositionChange={setPositionFilter}
      />

      {/* Player List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-bg-surface-1 border border-b-subtle rounded-xl p-4 h-[72px] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-2xl bg-bg-surface-1 mb-4">
            <Users className="h-8 w-8 text-t-muted" />
          </div>
          <p className="font-ui text-[14px] text-t-secondary">
            {players?.length === 0 ? "Aucun joueur dans l'effectif" : "Aucun résultat"}
          </p>
          <p className="font-ui text-[12px] text-t-muted mt-1">
            {players?.length === 0 ? "Ajoute ton premier joueur pour commencer." : "Essaie avec d'autres filtres."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((player) => (
            <PlayerCard key={player.id} player={player} onEdit={handleEdit} onDelete={handleDelete} onView={handleView} />
          ))}
        </div>
      )}

      {/* Dialog & Sheet */}
      <PlayerFormDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingPlayer(null); }}
        player={editingPlayer}
        onSubmit={handleSubmit}
        submitting={addPlayer.isPending || updatePlayer.isPending}
      />
      <PlayerDetailSheet
        player={viewingPlayer}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onEdit={handleEdit}
      />
    </div>
  );
}
