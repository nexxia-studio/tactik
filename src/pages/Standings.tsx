import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

/* ── Mock P2C Liège standings ── */
interface TeamStanding {
  rank: number;
  name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: ("W" | "D" | "L")[];
}

const STANDINGS: TeamStanding[] = [
  { rank: 1, name: "FC Eupen B", played: 17, wins: 13, draws: 2, losses: 2, goalsFor: 42, goalsAgainst: 14, points: 41, form: ["W", "W", "D", "W", "W"] },
  { rank: 2, name: "Xhoffraix", played: 17, wins: 11, draws: 3, losses: 3, goalsFor: 38, goalsAgainst: 16, points: 36, form: ["W", "W", "D", "W", "L"] },
  { rank: 3, name: "AS Stavelot", played: 17, wins: 10, draws: 4, losses: 3, goalsFor: 35, goalsAgainst: 18, points: 34, form: ["W", "L", "W", "W", "D"] },
  { rank: 4, name: "Entente Malmedy", played: 17, wins: 10, draws: 2, losses: 5, goalsFor: 31, goalsAgainst: 20, points: 32, form: ["L", "W", "W", "D", "W"] },
  { rank: 5, name: "RCS Verviers", played: 17, wins: 9, draws: 3, losses: 5, goalsFor: 28, goalsAgainst: 21, points: 30, form: ["D", "W", "L", "W", "W"] },
  { rank: 6, name: "FC Heusy", played: 17, wins: 8, draws: 4, losses: 5, goalsFor: 26, goalsAgainst: 20, points: 28, form: ["W", "D", "L", "W", "D"] },
  { rank: 7, name: "Dison B", played: 17, wins: 7, draws: 5, losses: 5, goalsFor: 24, goalsAgainst: 22, points: 26, form: ["D", "D", "W", "L", "W"] },
  { rank: 8, name: "Franchimont", played: 17, wins: 7, draws: 3, losses: 7, goalsFor: 25, goalsAgainst: 25, points: 24, form: ["L", "W", "L", "W", "D"] },
  { rank: 9, name: "FC Spa", played: 17, wins: 6, draws: 3, losses: 8, goalsFor: 22, goalsAgainst: 28, points: 21, form: ["L", "L", "W", "D", "L"] },
  { rank: 10, name: "RC Waimes", played: 17, wins: 5, draws: 4, losses: 8, goalsFor: 20, goalsAgainst: 27, points: 19, form: ["D", "L", "L", "W", "L"] },
  { rank: 11, name: "Jalhay FC", played: 17, wins: 4, draws: 5, losses: 8, goalsFor: 19, goalsAgainst: 28, points: 17, form: ["L", "D", "D", "L", "W"] },
  { rank: 12, name: "US Theux", played: 17, wins: 4, draws: 3, losses: 10, goalsFor: 16, goalsAgainst: 32, points: 15, form: ["L", "L", "D", "L", "L"] },
  { rank: 13, name: "Baelen FC", played: 17, wins: 3, draws: 4, losses: 10, goalsFor: 15, goalsAgainst: 34, points: 13, form: ["D", "L", "L", "L", "D"] },
  { rank: 14, name: "FC Trois-Ponts", played: 17, wins: 2, draws: 3, losses: 12, goalsFor: 12, goalsAgainst: 40, points: 9, form: ["L", "L", "L", "D", "L"] },
  { rank: 15, name: "JS Solwaster", played: 17, wins: 1, draws: 2, losses: 14, goalsFor: 10, goalsAgainst: 48, points: 5, form: ["L", "L", "L", "L", "D"] },
];

const formColors: Record<string, string> = {
  W: "bg-[var(--color-success)]",
  D: "bg-[var(--color-warning)]",
  L: "bg-[var(--color-danger)]",
};

const OUR_TEAM = "Xhoffraix";

export default function Standings() {
  const ourTeam = STANDINGS.find((t) => t.name === OUR_TEAM);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-t-primary leading-none" style={{ fontSize: "var(--text-h1)" }}>
          CLASSEMENT
        </h1>
        <p className="text-t-secondary font-ui text-[var(--text-small)] mt-2">
          P2C Liège — Saison 2025-2026
        </p>
      </div>

      {/* Our position highlight */}
      {ourTeam && (
        <div className="bg-bg-surface-1 border border-primary-border rounded-xl p-5 glow-primary animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary-dim flex items-center justify-center">
              <span className="font-display text-[24px] text-primary">{ourTeam.rank}</span>
            </div>
            <div className="flex-1">
              <p className="font-display text-[18px] text-primary">{OUR_TEAM}</p>
              <p className="font-ui text-[12px] text-t-secondary mt-0.5">
                {ourTeam.points} pts — {ourTeam.wins}V {ourTeam.draws}N {ourTeam.losses}D — Diff: {ourTeam.goalsFor - ourTeam.goalsAgainst > 0 ? "+" : ""}{ourTeam.goalsFor - ourTeam.goalsAgainst}
              </p>
            </div>
            <div className="flex gap-1">
              {ourTeam.form.map((r, i) => (
                <div key={i} className={`w-6 h-6 rounded flex items-center justify-center ${formColors[r]} text-[10px] font-ui font-bold text-bg-base`}>
                  {r === "W" ? "V" : r === "D" ? "N" : "D"}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full table */}
      <div className="bg-bg-surface-1 border border-b-subtle rounded-xl overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-b-subtle">
                <th className="px-4 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center w-12">#</th>
                <th className="px-4 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-left">Équipe</th>
                <th className="px-4 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center">MJ</th>
                <th className="px-4 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center">V</th>
                <th className="px-4 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center">N</th>
                <th className="px-4 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center">D</th>
                <th className="px-4 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center">BP</th>
                <th className="px-4 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center">BC</th>
                <th className="px-4 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center">DIFF</th>
                <th className="px-4 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center">PTS</th>
                <th className="px-4 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center hidden sm:table-cell">FORME</th>
              </tr>
            </thead>
            <tbody>
              {STANDINGS.map((team) => {
                const isUs = team.name === OUR_TEAM;
                const diff = team.goalsFor - team.goalsAgainst;
                return (
                  <tr
                    key={team.rank}
                    className={`border-b border-b-subtle last:border-0 transition-colors ${
                      isUs
                        ? "bg-[var(--color-primary-dim)]"
                        : "hover:bg-bg-surface-2/50"
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      <span className={`font-display text-[13px] ${team.rank === 1 ? "text-[var(--color-success)]" : team.rank >= 2 && team.rank <= 5 ? "text-[var(--color-info)]" : team.rank >= 14 ? "text-[var(--color-danger)]" : "text-t-muted"}`}>
                        {team.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-ui text-[13px] ${isUs ? "text-primary font-semibold" : "text-t-primary"}`}>
                        {team.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-ui text-[13px] text-t-secondary">{team.played}</td>
                    <td className="px-4 py-3 text-center font-ui text-[13px] text-t-primary">{team.wins}</td>
                    <td className="px-4 py-3 text-center font-ui text-[13px] text-t-secondary">{team.draws}</td>
                    <td className="px-4 py-3 text-center font-ui text-[13px] text-t-secondary">{team.losses}</td>
                    <td className="px-4 py-3 text-center font-ui text-[13px] text-t-primary">{team.goalsFor}</td>
                    <td className="px-4 py-3 text-center font-ui text-[13px] text-t-secondary">{team.goalsAgainst}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-display text-[13px] ${diff > 0 ? "text-[var(--color-success)]" : diff < 0 ? "text-[var(--color-danger)]" : "text-t-muted"}`}>
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-display text-[15px] ${isUs ? "text-primary" : "text-t-primary"}`}>
                        {team.points}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <div className="flex justify-center gap-1">
                        {team.form.map((r, i) => (
                          <div key={i} className={`w-5 h-5 rounded flex items-center justify-center ${formColors[r]} text-[8px] font-ui font-bold text-bg-base`}>
                            {r === "W" ? "V" : r === "D" ? "N" : "D"}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 font-ui text-[11px] text-t-muted">
        <span className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" /> Promotion
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[var(--color-info)]" /> Tour Final
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[var(--color-danger)]" /> Relégation
        </span>
        <span>MJ = Matchs joués • BP = Buts pour • BC = Buts contre</span>
      </div>
    </div>
  );
}
