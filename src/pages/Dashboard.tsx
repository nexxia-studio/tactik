import { Calendar, Dumbbell, TrendingUp, Users, Wallet, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useInView } from "@/hooks/useInView";
import { useDashboard } from "@/hooks/useDashboard";
import { useActiveTeam } from "@/contexts/TeamContext";
import type { DashboardMatch } from "@/hooks/useDashboard";
import { AttendanceBarChart } from "@/components/stats/AttendanceBarChart";
import { useAttendanceChartData } from "@/hooks/useTrainings";
import { useSquadAvailability } from "@/hooks/useSquadAvailability";

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-BE", {
    day: "numeric",
    month: "short",
  }).toUpperCase();
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-BE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtBalance(value: number): string {
  return `€ ${value.toFixed(0)}`;
}

function getResult(match: DashboardMatch): "W" | "D" | "L" | null {
  if (match.score_home == null || match.score_away == null) return null;
  const ours = match.is_home ? match.score_home : match.score_away;
  const theirs = match.is_home ? match.score_away : match.score_home;
  if (ours > theirs) return "W";
  if (ours === theirs) return "D";
  return "L";
}

function getScore(match: DashboardMatch): string {
  if (match.score_home == null || match.score_away == null) return "— - —";
  return `${match.score_home} - ${match.score_away}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────

const resultColor: Record<string, string> = {
  W: "bg-success",
  D: "bg-warning",
  L: "bg-danger",
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
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
        <div className="h-8 w-24 bg-bg-surface-2 rounded animate-pulse" />
      ) : (
        <p className="font-display text-t-primary leading-none tracking-tight" style={{ fontSize: "clamp(18px, 3vw, 24px)" }}>
          {value}
        </p>
      )}
      {!loading && sub && (
        <p className="text-[12px] text-t-secondary font-ui mt-1.5">{sub}</p>
      )}
    </div>
  );
}

function SquadAvailabilityChart({ teamId }: { teamId: string | undefined }) {
  const { data, isLoading } = useSquadAvailability(teamId);
  const { ref: chartRef, inView } = useInView(0.3);

  const chartData = data
    ? [
        { name: "available",   value: Math.max(data.available, 0) },
        { name: "unavailable", value: Math.max(data.unavailable, 0) },
      ]
    : [];

  return (
    <div className="bg-bg-surface-1 border border-b-subtle rounded-xl p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-primary" />
        <span className="text-label">DISPONIBILITÉ EFFECTIF</span>
      </div>

      {isLoading || !data ? (
        <div className="h-[140px] bg-bg-surface-2 rounded-lg animate-pulse" />
      ) : data.total === 0 ? (
        <div className="h-[140px] flex items-center justify-center">
          <p className="font-ui text-[13px] text-t-muted">Aucun joueur dans l'effectif</p>
        </div>
      ) : (
        <>
          {/* Semi-circle chart — ref reserves space, chart mounts when in viewport */}
          <div ref={chartRef} className="relative" style={{ height: 140 }}>
            {inView && <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  outerRadius={110}
                  innerRadius={68}
                  dataKey="value"
                  isAnimationActive
                  animationBegin={0}
                  animationDuration={1200}
                  animationEasing="ease-out"
                  stroke="var(--bg-surface-1)"
                  strokeWidth={2}
                >
                  <Cell fill="var(--color-success)" fillOpacity={0.9} />
                  <Cell fill="var(--color-danger)"  fillOpacity={0.9} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>}
            {/* Center label — always visible once data is loaded */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
              <p className="font-display text-t-primary leading-none tracking-tight" style={{ fontSize: "clamp(20px, 3.5vw, 26px)" }}>
                {data.available}/{data.total}
              </p>
              <p className="font-ui text-[11px] text-t-muted mt-1">Disponibles</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)]" />
              <span className="font-ui text-[12px] text-t-secondary">{data.available} Disponibles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-danger)]" />
              <span className="font-ui text-[12px] text-t-secondary">{data.unavailable} Indisponibles</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { activeTeamId: teamId, activeTeam } = useActiveTeam();
  const { data, isLoading } = useDashboard(teamId, activeTeam?.organization_id);
  const { data: chartData = [], isLoading: chartLoading } = useAttendanceChartData(teamId);

  // Stat card values
  const nextMatchValue = data?.nextMatch ? fmtDate(data.nextMatch.match_date) : "—";
  const nextMatchSub = data?.nextMatch
    ? `vs ${data.nextMatch.opponent} — ${fmtTime(data.nextMatch.match_date)}`
    : "Aucun match planifié";

  const nextTrainingValue = data?.nextTraining ? fmtDate(data.nextTraining.scheduled_at) : "—";
  const nextTrainingSub = data?.nextTraining
    ? data.nextTraining.location ?? data.nextTraining.notes ?? "Entraînement prévu"
    : "Aucun entraînement planifié";

  const attendanceValue =
    data?.attendanceRate != null ? `${data.attendanceRate}%` : "—";
  const attendanceSub =
    data?.attendanceTotal != null && data.attendanceTotal > 0
      ? `${data.attendancePresent}/${data.attendanceTotal} présences (30j)`
      : "Pas encore de données";

  const balanceValue = data?.balance != null ? fmtBalance(data.balance) : "—";
  const balanceSub =
    data != null
      ? `${data.unpaidFinesCount} amende${data.unpaidFinesCount !== 1 ? "s" : ""} impayée${data.unpaidFinesCount !== 1 ? "s" : ""} ce mois`
      : undefined;

  // Form summary from last 5 matches
  const formSummary = (data?.lastMatches ?? []).reduce(
    (acc, m) => {
      const r = getResult(m);
      if (r) acc[r]++;
      return acc;
    },
    { W: 0, D: 0, L: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-t-primary leading-none" style={{ fontSize: "var(--text-h1)" }}>
          DASHBOARD
        </h1>
        <p className="text-t-secondary font-ui text-[var(--text-small)] mt-2">
          Bienvenue, coach. Voici un résumé de ta saison.
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard icon={Calendar}  label="PROCHAIN MATCH"  value={nextMatchValue}    sub={nextMatchSub}    loading={isLoading || !data} />
        <StatCard icon={Dumbbell}  label="ENTRAÎNEMENT"    value={nextTrainingValue} sub={nextTrainingSub} loading={isLoading || !data} />
        <StatCard icon={Users}     label="PRÉSENCES 30J"   value={attendanceValue}   sub={attendanceSub}   loading={isLoading || !data} />
        <StatCard icon={Wallet}    label="CAGNOTTE"         value={balanceValue}      sub={balanceSub}      loading={isLoading || !data} />
      </div>

      {/* Attendance chart — compact, last 5 sessions */}
      <div className="bg-bg-surface-1 border border-b-subtle rounded-xl p-5 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Dumbbell className="h-4 w-4 text-primary" />
          <span className="text-label">PRÉSENCE AUX ENTRAÎNEMENTS</span>
          <span className="ml-auto font-ui text-[11px] text-t-muted">5 dernières séances</span>
        </div>
        <AttendanceBarChart data={chartData} loading={chartLoading} compact limit={5} />
      </div>

      {/* Team Form */}
      <div className="bg-bg-surface-1 border border-b-subtle rounded-xl p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-label">FORME ÉQUIPE</span>
          </div>
          <span className="text-[12px] text-t-secondary font-ui">5 derniers matchs</span>
        </div>

        {isLoading || !data ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-bg-surface-2 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : data?.lastMatches.length === 0 ? (
          <p className="font-ui text-[13px] text-t-muted py-4 text-center">
            Aucun match joué pour l'instant.
          </p>
        ) : (
          <>
            {/* Result dots + summary */}
            <div className="flex items-center gap-2 mb-5">
              {data!.lastMatches.map((m) => {
                const r = getResult(m);
                return (
                  <div
                    key={m.id}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-ui font-bold tracking-wider ${r ? resultColor[r] : "bg-bg-surface-2"} text-primary-text`}
                  >
                    {r ?? "?"}
                  </div>
                );
              })}
              <span className="hidden sm:inline ml-2 font-display text-[20px] text-primary tracking-tight">
                {formSummary.W}V {formSummary.D}N {formSummary.L}D
              </span>
            </div>

            {/* Match list */}
            {/* TODO: enrich match rows with goals scored, goals conceded, goal diff,
                clean sheet indicator (0 goals conceded). Requires DashboardMatch to
                expose score_home/score_away and is_home — already available. */}
            <div className="space-y-1">
              {data!.lastMatches.map((m) => {
                const r = getResult(m);
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-bg-surface-2 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${r ? resultColor[r] : "bg-bg-surface-3"}`} />
                      <span className="text-[13px] font-ui text-t-primary truncate">{m.opponent}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-display text-[14px] text-t-primary tracking-wider w-16 text-center">
                        {getScore(m)}
                      </span>
                      <span className="text-[12px] text-t-muted font-ui w-14 text-right">{fmtDate(m.match_date)}</span>
                      <ChevronRight className="h-4 w-4 text-t-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Squad availability donut */}
      <SquadAvailabilityChart teamId={teamId} />
    </div>
  );
}
