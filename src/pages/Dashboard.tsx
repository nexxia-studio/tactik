import {
  Calendar,
  Dumbbell,
  TrendingUp,
  Users,
  Wallet,
  ChevronRight,
} from "lucide-react";

/* ── Mock Data ── */
const lastMatches = [
  { opponent: "FC Genappe", score: "3 - 1", result: "W", date: "23/03" },
  { opponent: "JS Tamines", score: "1 - 1", result: "D", date: "16/03" },
  { opponent: "RC Jodoigne", score: "2 - 0", result: "W", date: "09/03" },
  { opponent: "US Ciney", score: "0 - 2", result: "L", date: "02/03" },
  { opponent: "RCS Brainois", score: "4 - 1", result: "W", date: "23/02" },
];

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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-bg-surface-1 border border-b-subtle rounded-xl p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-primary-dim">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-label">{label}</span>
      </div>
      <p className="font-display text-[28px] text-t-primary leading-none tracking-tight">
        {value}
      </p>
      {sub && <p className="text-[12px] text-t-secondary font-ui mt-1.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="font-display text-t-primary leading-none"
          style={{ fontSize: "var(--text-h1)" }}
        >
          DASHBOARD
        </h1>
        <p className="text-t-secondary font-ui text-[var(--text-small)] mt-2">
          Bienvenue, coach. Voici un résumé de ta saison.
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard icon={Calendar} label="PROCHAIN MATCH" value="29 MAR" sub="vs FC Genappe — 20h00" />
        <StatCard icon={Dumbbell} label="ENTRAÎNEMENT" value="31 MAR" sub="Tactique — 19h30" />
        <StatCard icon={Users} label="PRÉSENCES 30J" value="78%" sub="18/23 joueurs en moyenne" />
        <StatCard icon={Wallet} label="CAGNOTTE" value="€ 245" sub="12 amendes ce mois" />
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

        <div className="flex items-center gap-2 mb-5">
          {lastMatches.map((m, i) => (
            <div
              key={i}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-ui font-bold tracking-wider ${resultColor[m.result]} text-primary-text`}
            >
              {m.result}
            </div>
          ))}
          <span className="ml-2 font-display text-[20px] text-primary tracking-tight">
            3V 1N 1D
          </span>
        </div>

        {/* Match List */}
        <div className="space-y-1">
          {lastMatches.map((m, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-bg-surface-2 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${resultColor[m.result]}`}
                />
                <span className="text-[13px] font-ui text-t-primary">
                  {m.opponent}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-[14px] text-t-primary tracking-wider">
                  {m.score}
                </span>
                <span className="text-[12px] text-t-muted font-ui">
                  {m.date}
                </span>
                <ChevronRight className="h-4 w-4 text-t-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
