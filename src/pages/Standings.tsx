import { useActiveTeam } from "@/contexts/TeamContext";
import { useStandings } from "@/hooks/useStandings";
import type { StandingRow } from "@/hooks/useStandings";

const formColors: Record<string, string> = {
  W: "bg-[var(--color-success)]",
  D: "bg-[var(--color-warning)]",
  L: "bg-[var(--color-danger)]",
};

const formLabels: Record<string, string> = { W: "V", D: "N", L: "D" };

function TeamLogo({ logoUrl, name, size = 6 }: { logoUrl: string | null; name: string; size?: number }) {
  const sz = `h-${size} w-${size}`;
  if (logoUrl) {
    return <img src={logoUrl} alt={name} className={`${sz} object-contain`} />;
  }
  return (
    <div className={`${sz} rounded bg-bg-surface-2 flex items-center justify-center`}>
      <span className="font-display text-[9px] text-t-muted">{name.slice(0, 2).toUpperCase()}</span>
    </div>
  );
}

function RankColor({ rank, total }: { rank: number; total: number }) {
  if (rank === 1) return "text-[var(--color-success)]";
  if (rank <= 5) return "text-[var(--color-info)]";
  if (rank >= total - 1) return "text-[var(--color-danger)]";
  return "text-t-muted";
}

export default function Standings() {
  const { activeTeam } = useActiveTeam();
  const { data, isLoading } = useStandings(activeTeam?.organization_id);

  const ourRow = data?.rows.find((r) => r.isUs);
  const ourRank = ourRow ? data!.rows.indexOf(ourRow) + 1 : null;
  const diff = ourRow ? ourRow.goalsFor - ourRow.goalsAgainst : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-t-primary leading-none" style={{ fontSize: "var(--text-h1)" }}>
          CLASSEMENT
        </h1>
        <p className="text-t-secondary font-ui text-[var(--text-small)] mt-2">
          {isLoading ? "Chargement…" : data?.division ?? activeTeam?.name ?? "Mon équipe"}
        </p>
      </div>

      {/* Our position highlight */}
      {ourRow && ourRank && (
        <div className="bg-bg-surface-1 border border-primary-border rounded-xl p-5 glow-primary animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary-dim flex items-center justify-center shrink-0">
              {ourRow.logoUrl ? (
                <img src={ourRow.logoUrl} alt={ourRow.name} className="h-10 w-10 object-contain" />
              ) : (
                <span className="font-display text-[24px] text-primary">{ourRank}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display text-[20px] text-primary leading-none">{ourRank}</span>
                <span className="font-display text-[16px] text-t-primary truncate">{ourRow.name}</span>
              </div>
              <p className="font-ui text-[12px] text-t-secondary mt-1">
                {ourRow.points} pts — {ourRow.wins}V {ourRow.draws}N {ourRow.losses}D — Diff: {diff > 0 ? "+" : ""}{diff}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              {ourRow.form.map((r, i) => (
                <div key={i} className={`w-6 h-6 rounded flex items-center justify-center ${formColors[r]} text-[10px] font-ui font-bold text-bg-base`}>
                  {formLabels[r]}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full table */}
      <div className="bg-bg-surface-1 border border-b-subtle rounded-xl overflow-hidden animate-fade-in">
        {isLoading ? (
          <div className="space-y-px p-2">
            {[1,2,3,4,5,6,7,8].map((i) => (
              <div key={i} className="h-10 bg-bg-surface-2 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !data || data.rows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-ui text-[14px] text-t-secondary">Aucune donnée disponible</p>
            <p className="font-ui text-[12px] text-t-muted mt-1">Les matchs de championnat seront calculés automatiquement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-b-subtle">
                  <th className="px-3 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center w-10">#</th>
                  <th className="px-3 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-left">Équipe</th>
                  <th className="px-3 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center">MJ</th>
                  <th className="px-3 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center">V</th>
                  <th className="px-3 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center">N</th>
                  <th className="px-3 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center">D</th>
                  <th className="px-3 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center">BP</th>
                  <th className="px-3 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center">BC</th>
                  <th className="px-3 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center">+/-</th>
                  <th className="px-3 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center">PTS</th>
                  <th className="px-3 py-3 font-ui text-[10px] uppercase tracking-[0.15em] text-t-muted text-center hidden sm:table-cell">FORME</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((team: StandingRow, idx: number) => {
                  const rank = idx + 1;
                  const d = team.goalsFor - team.goalsAgainst;
                  const rankColorClass = RankColor({ rank, total: data.rows.length });
                  return (
                    <tr
                      key={team.name}
                      className={`border-b border-b-subtle last:border-0 transition-colors ${
                        team.isUs ? "bg-[var(--color-primary-dim)]" : "hover:bg-bg-surface-2/50"
                      }`}
                    >
                      <td className="px-3 py-2.5 text-center">
                        <span className={`font-display text-[13px] ${rankColorClass}`}>{rank}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <TeamLogo logoUrl={team.logoUrl} name={team.name} size={5} />
                          <span className={`font-ui text-[13px] truncate max-w-[120px] sm:max-w-none ${team.isUs ? "text-primary font-semibold" : "text-t-primary"}`}>
                            {team.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center font-ui text-[13px] text-t-secondary">{team.played}</td>
                      <td className="px-3 py-2.5 text-center font-ui text-[13px] text-t-primary">{team.wins}</td>
                      <td className="px-3 py-2.5 text-center font-ui text-[13px] text-t-secondary">{team.draws}</td>
                      <td className="px-3 py-2.5 text-center font-ui text-[13px] text-t-secondary">{team.losses}</td>
                      <td className="px-3 py-2.5 text-center font-ui text-[13px] text-t-primary">{team.goalsFor}</td>
                      <td className="px-3 py-2.5 text-center font-ui text-[13px] text-t-secondary">{team.goalsAgainst}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`font-display text-[13px] ${d > 0 ? "text-[var(--color-success)]" : d < 0 ? "text-[var(--color-danger)]" : "text-t-muted"}`}>
                          {d > 0 ? `+${d}` : d}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`font-display text-[15px] ${team.isUs ? "text-primary" : "text-t-primary"}`}>
                          {team.points}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                        <div className="flex justify-center gap-1">
                          {team.form.map((r, i) => (
                            <div key={i} className={`w-5 h-5 rounded flex items-center justify-center ${formColors[r]} text-[8px] font-ui font-bold text-bg-base`}>
                              {formLabels[r]}
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
        )}
      </div>

      {/* Legend */}
      {data && data.rows.length > 0 && (
        <div className="flex flex-wrap gap-4 font-ui text-[11px] text-t-muted">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" /> 1er — Promotion
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--color-info)]" /> 2–5 — Tour Final
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--color-danger)]" /> Relégation
          </span>
          <span>MJ = matchs joués • BP/BC = buts pour/contre</span>
        </div>
      )}
    </div>
  );
}
