import { User, MoreVertical, Pencil, Trash2, Eye } from "lucide-react";
import type { Player } from "@/hooks/usePlayers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const positionConfig: Record<string, { bg: string; text: string; short: string }> = {
  Gardien: { bg: "bg-[rgba(79,142,255,0.15)]", text: "text-[var(--color-info)]", short: "GK" },
  Défenseur: { bg: "bg-[rgba(255,59,48,0.15)]", text: "text-[var(--color-danger)]", short: "DEF" },
  Milieu: { bg: "bg-[rgba(255,214,10,0.15)]", text: "text-[var(--color-warning)]", short: "MIL" },
  Attaquant: { bg: "bg-[rgba(22,255,110,0.15)]", text: "text-[var(--color-success)]", short: "ATT" },
};

interface PlayerCardProps {
  player: Player;
  onEdit: (player: Player) => void;
  onDelete: (player: Player) => void;
  onView: (player: Player) => void;
}

export function PlayerCard({ player, onEdit, onDelete, onView }: PlayerCardProps) {
  const pos = positionConfig[player.position] || { bg: "bg-bg-surface-2", text: "text-t-secondary", short: "?" };

  return (
    <div
      onClick={() => onView(player)}
      className="bg-bg-surface-1 border border-b-subtle rounded-xl p-4 flex items-center gap-4
                 hover:border-primary-border hover:shadow-[0_0_20px_var(--color-primary-dim)]
                 transition-all cursor-pointer group animate-fade-in"
    >
      {/* Avatar */}
      <div className="relative h-11 w-11 rounded-full shrink-0 overflow-hidden bg-bg-surface-2 flex items-center justify-center">
        {player.avatar_url ? (
          <img src={player.avatar_url} alt={player.first_name} className="h-full w-full object-cover" />
        ) : player.jersey_number ? (
          <span className="font-display text-[14px] text-t-primary">{player.jersey_number}</span>
        ) : (
          <User className="h-4 w-4 text-t-muted" />
        )}
        {/* Position badge */}
        <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${pos.bg} flex items-center justify-center border-2 border-bg-surface-1`}>
          <span className={`text-[7px] font-ui font-bold ${pos.text}`}>{pos.short}</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-ui text-[14px] text-t-primary truncate">
          {player.first_name}{" "}
          <span className="font-semibold">{player.last_name.toUpperCase()}</span>
          {player.jersey_number && (
            <span className="ml-2 text-[12px] text-t-muted font-display">#{player.jersey_number}</span>
          )}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-ui font-semibold uppercase tracking-wider ${pos.bg} ${pos.text}`}>
            {player.position}
          </span>
          {player.email && (
            <span className="text-[11px] font-ui text-t-muted truncate hidden sm:inline">{player.email}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-lg text-t-muted hover:bg-bg-surface-2 hover:text-t-primary transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-bg-surface-2 border-b-subtle">
            <DropdownMenuItem onClick={() => onView(player)} className="text-[13px] font-ui cursor-pointer">
              <Eye className="h-3.5 w-3.5 mr-2" />
              Voir la fiche
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(player)} className="text-[13px] font-ui cursor-pointer">
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(player)} className="text-[13px] font-ui text-danger cursor-pointer">
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
