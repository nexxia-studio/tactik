import {
  Trophy,
  Target,
  Shield,
  TrendingUp,
  Users,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/* ── Mock data (will be replaced with real match data) ── */
const teamStats = {
  matchesPlayed: 18,
  wins: 10,
  draws: 4,
  losses: 4,
  goalsFor: 32,
  goalsAgainst: 18,
  cleanSheets: 6,
  avgRating: 7.1,
};

const formData = [
  { match: "J14", goals: 3, conceded: 1 },
  { match: "J15", goals: 1, conceded: 1 },
  { match: "J16", goals: 2, conceded: 0 },
  { match: "J17", goals: 0, conceded: 2 },
  { match: "J18", goals: 4, conceded: 1 },
];

const resultDistribution = [
  { name: "Victoires", value: teamStats.wins },
  { name: "Nuls", value: teamStats.draws },
  { name: "Défaites", value: teamStats.losses },
];

const PIE_COLORS = ["var(--color-success)", "var(--color-warning)", "var(--color-danger)"];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-bg-surface-1 border border-b-subtle rounded-xl p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-primary-dim">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-label">{label}</span>
      </div>
      <p className={`font-display text-[28px] leading-none tracking-tight ${accent || "text-t-primary"}`}>
        {value}
      </p>
      {sub && <p className="text-[12px] text-t-secondary font-ui mt-1.5">{sub}</p>}
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

export function TeamStatsOverview() {
  const winRate = Math.round((teamStats.wins / teamStats.matchesPlayed) * 100);

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Trophy} label="BILAN" value={`${teamStats.wins}V ${teamStats.draws}N ${teamStats.losses}D`} sub={`${winRate}% de victoires`} />
        <StatCard icon={Target} label="BUTS MARQUÉS" value={teamStats.goalsFor.toString()} sub={`${(teamStats.goalsFor / teamStats.matchesPlayed).toFixed(1)} par match`} />
        <StatCard icon={Shield} label="BUTS ENCAISSÉS" value={teamStats.goalsAgainst.toString()} sub={`${teamStats.cleanSheets} clean sheets`} />
        <StatCard icon={TrendingUp} label="NOTE MOYENNE" value={teamStats.avgRating.toFixed(1)} sub="Sur l'ensemble de la saison" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart — goals per match */}
        <div className="lg:col-span-2 bg-bg-surface-1 border border-b-subtle rounded-xl p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-label">BUTS PAR JOURNÉE</span>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formData} barGap={4}>
                <XAxis dataKey="match" tick={{ fontSize: 11, fill: "var(--text-secondary)", fontFamily: "var(--font-ui)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "var(--font-ui)" }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-primary-dim)" }} />
                <Bar dataKey="goals" name="Marqués" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conceded" name="Encaissés" fill="var(--color-danger)" radius={[4, 4, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart — results */}
        <div className="bg-bg-surface-1 border border-b-subtle rounded-xl p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-label">RÉSULTATS</span>
          </div>
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
        </div>
      </div>
    </div>
  );
}
