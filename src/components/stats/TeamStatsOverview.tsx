import { Trophy, Target, Shield, UserCheck, Users, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import type { TeamStatsData } from "@/hooks/useTeamStats";
import { useTeamAttendanceRate } from "@/hooks/useTrainings";

const PIE_COLORS = ["var(--color-success)", "var(--color-warning)", "var(--color-danger)"];

function StatCard({
  icon: Icon, label, value, sub, accent, loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-bg-surface-1 border border-b-subtle rounded-xl p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-primary-dim">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-label">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-20 bg-bg-surface-2 rounded animate-pulse" />
      ) : (
        <p className={`font-display text-[28px] leading-none tracking-tight ${accent || "text-t-primary"}`}>
          {value}
        </p>
      )}
      {!loading && sub && <p className="text-[12px] text-t-secondary font-ui mt-1.5">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-surface-2 border border-b-subtle rounded-lg px-3 py-2 shadow-lg">
      <p className="font-ui text-[12px] text-t-primary font-semibold mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="font-ui text-[11px]" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

interface TeamStatsOverviewProps {
  teamId: string | undefined;
  stats: TeamStatsData | undefined;
  isLoading: boolean;
}

export function TeamStatsOverview({ teamId, stats, isLoading }: TeamStatsOverviewProps) {
  const loading = isLoading || !stats;
  const s = stats;

  const { data: attendance } = useTeamAttendanceRate(teamId, 30);

  const winRate = s && s.matchesPlayed > 0
    ? Math.round((s.wins / s.matchesPlayed) * 100)
    : null;

  const goalsPerMatch = s && s.matchesPlayed > 0
    ? (s.goalsFor / s.matchesPlayed).toFixed(1)
    : null;

  const resultDistribution = s
    ? [
        { name: "Victoires", value: s.wins },
        { name: "Nuls", value: s.draws },
        { name: "Défaites", value: s.losses },
      ]
    : [];

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Trophy}
          label="BILAN"
          value={s ? `${s.wins}V ${s.draws}N ${s.losses}D` : "—"}
          sub={winRate != null ? `${winRate}% de victoires` : undefined}
          loading={loading}
        />
        <StatCard
          icon={Target}
          label="BUTS MARQUÉS"
          value={s ? s.goalsFor.toString() : "—"}
          sub={goalsPerMatch != null ? `${goalsPerMatch} par match` : undefined}
          loading={loading}
        />
        <StatCard
          icon={Shield}
          label="BUTS ENCAISSÉS"
          value={s ? s.goalsAgainst.toString() : "—"}
          sub={s ? `${s.cleanSheets} clean sheet${s.cleanSheets !== 1 ? "s" : ""}` : undefined}
          loading={loading}
        />
        <StatCard
          icon={UserCheck}
          label="PRÉSENCE 30J"
          value={attendance?.rate != null ? `${attendance.rate}%` : "—"}
          sub={
            attendance?.sessions
              ? `${attendance.presences} présences sur ${attendance.sessions} séance${attendance.sessions > 1 ? "s" : ""}`
              : "Aucune séance ce mois"
          }
          accent={
            attendance?.rate == null ? undefined :
            attendance.rate >= 75 ? "text-[var(--color-success)]" :
            attendance.rate >= 50 ? "text-[var(--color-warning)]" :
            "text-[var(--color-danger)]"
          }
          loading={false}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-bg-surface-1 border border-b-subtle rounded-xl p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-label">BUTS PAR JOURNÉE</span>
          </div>
          {loading ? (
            <div className="h-[200px] bg-bg-surface-2 rounded-lg animate-pulse" />
          ) : !s || s.formData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center">
              <p className="font-ui text-[13px] text-t-muted">Pas encore de matchs joués.</p>
            </div>
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.formData} barGap={4}>
                  <XAxis dataKey="match" tick={{ fontSize: 11, fill: "var(--text-secondary)", fontFamily: "var(--font-ui)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "var(--font-ui)" }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-primary-dim)" }} />
                  <Bar dataKey="goals" name="Marqués" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conceded" name="Encaissés" fill="var(--color-danger)" radius={[4, 4, 0, 0]} opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="bg-bg-surface-1 border border-b-subtle rounded-xl p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-label">RÉSULTATS</span>
          </div>
          {loading ? (
            <div className="h-[160px] bg-bg-surface-2 rounded-lg animate-pulse" />
          ) : !s || s.matchesPlayed === 0 ? (
            <div className="h-[160px] flex items-center justify-center">
              <p className="font-ui text-[13px] text-t-muted">Aucun résultat.</p>
            </div>
          ) : (
            <>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resultDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {resultDistribution.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {resultDistribution.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="font-ui text-[11px] text-t-secondary">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
