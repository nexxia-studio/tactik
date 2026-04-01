import { useState, useMemo } from "react";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import type { Player } from "@/hooks/usePlayers";
import type { PlayerStat } from "@/hooks/useTeamStats";

const EMPTY_STAT: PlayerStat = {
  matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, avgRating: null,
};

type SortKey = "name" | "matches" | "goals" | "assists" | "avgRating";

const positionConfig: Record<string, { bg: string; text: string }> = {
  Gardien:   { bg: "bg-[rgba(79,142,255,0.15)]",  text: "text-[var(--color-info)]"    },
  Défenseur: { bg: "bg-[rgba(255,59,48,0.15)]",   text: "text-[var(--color-danger)]"  },
  Milieu:    { bg: "bg-[rgba(255,214,10,0.15)]",  text: "text-[var(--color-warning)]" },
  Attaquant: { bg: "bg-[rgba(22,255,110,0.15)]",  text: "text-[var(--color-success)]" },
};

interface PlayerStatsTableProps {
  players: Player[];
  playerStats: Record<string, PlayerStat>;
  isLoading: boolean;
}

export function PlayerStatsTable({ players, playerStats, isLoading }: PlayerStatsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("avgRating");
  const [sortAsc, setSortAsc] = useState(false);

  const playersWithStats = useMemo(
    () => players.map((p) => ({ ...p, stats: playerStats[p.id] ?? EMPTY_STAT })),
    [players, playerStats]
  );

  const sorted = useMemo(() => {
    return [...playersWithStats].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":      cmp = a.full_name.localeCompare(b.full_name); break;
        case "matches":   cmp = a.stats.matches - b.stats.matches; break;
        case "goals":     cmp = a.stats.goals - b.stats.goals; break;
        case "assists":   cmp = a.stats.assists - b.stats.assists; break;
        case "avgRating": cmp = (a.stats.avgRating ?? 0) - (b.stats.avgRating ?? 0); break;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [playersWithStats, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 text-t-muted" />;
    return sortAsc ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />;
  };

  const ratingColor = (r: number) => {
    if (r >= 7.5) return "text-[var(--color-success)]";
    if (r >= 6.5) return "text-[var(--color-warning)]";
    if (r >= 5.5) return "text-t-primary";
    return "text-[var(--color-danger)]";
  };

  if (isLoading) {
    return <div className="bg-bg-surface-1 border border-b-subtle rounded-xl p-6 animate-pulse h-[300px]" />;
  }

  return (
    <div className="bg-bg-surface-1 border border-b-subtle rounded-xl overflow-hidden animate-fade-in">
      <div className="px-5 py-4 border-b border-b-subtle">
        <span className="text-label">STATS PAR JOUEUR</span>
        <p className="font-ui text-[11px] text-t-muted mt-0.5">Agrégées depuis les feuilles de match.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-b-subtle">
              {([
                { key: "name"      as SortKey, label: "JOUEUR", align: "text-left"   },
                { key: "matches"   as SortKey, label: "MJ",     align: "text-center" },
                { key: "goals"     as SortKey, label: "BUTS",   align: "text-center" },
                { key: "assists"   as SortKey, label: "PD",     align: "text-center" },
                { key: "avgRating" as SortKey, label: "NOTE",   align: "text-center" },
              ]).map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`px-4 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted cursor-pointer hover:text-t-secondary transition-colors ${col.align} ${col.key === "name" ? "min-w-[180px]" : "min-w-[60px]"}`}
                >
                  <div className={`flex items-center gap-1 ${col.align === "text-center" ? "justify-center" : ""}`}>
                    {col.label}
                    <SortIcon col={col.key} />
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center min-w-[60px]">CJ</th>
              <th className="px-4 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center min-w-[60px]">CR</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center font-ui text-[13px] text-t-muted">
                  Aucun joueur dans l'effectif.
                </td>
              </tr>
            ) : (
              sorted.map((player) => {
                const pos = positionConfig[player.position_preferred ?? ""] || { bg: "bg-bg-surface-2", text: "text-t-secondary" };
                return (
                  <tr key={player.id} className="border-b border-b-subtle last:border-0 hover:bg-bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-bg-surface-2 overflow-hidden flex items-center justify-center shrink-0">
                          {player.avatar_url ? (
                            <img src={player.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="font-display text-[11px] text-t-muted">
                              {player.shirt_number ?? "—"}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-ui text-[13px] text-t-primary truncate">{player.full_name}</p>
                          {player.position_preferred && (
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-ui font-semibold uppercase tracking-wider ${pos.bg} ${pos.text}`}>
                              {player.position_preferred}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-ui text-[13px] text-t-primary">{player.stats.matches}</td>
                    <td className="px-4 py-3 text-center font-display text-[14px] text-t-primary">{player.stats.goals}</td>
                    <td className="px-4 py-3 text-center font-ui text-[13px] text-t-primary">{player.stats.assists}</td>
                    <td className="px-4 py-3 text-center">
                      {player.stats.avgRating != null ? (
                        <span className={`font-display text-[14px] ${ratingColor(player.stats.avgRating)}`}>
                          {player.stats.avgRating}
                        </span>
                      ) : (
                        <span className="font-ui text-[13px] text-t-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {player.stats.yellowCards > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-6 rounded-sm bg-[var(--color-warning)] text-[9px] font-ui font-bold text-bg-base">
                          {player.stats.yellowCards}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {player.stats.redCards > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-6 rounded-sm bg-[var(--color-danger)] text-[9px] font-ui font-bold text-bg-base">
                          {player.stats.redCards}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
