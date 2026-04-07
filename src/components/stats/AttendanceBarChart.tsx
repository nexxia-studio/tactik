import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { AttendanceChartPoint } from "@/hooks/useTrainings";

function barColor(pct: number): string {
  if (pct >= 75) return "var(--color-success)";
  if (pct >= 50) return "var(--color-warning)";
  return "var(--color-danger)";
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d: AttendanceChartPoint = payload[0].payload;
  return (
    <div className="bg-bg-surface-2 border border-b-subtle rounded-lg px-3 py-2 shadow-lg">
      <p className="font-ui text-[12px] text-t-primary font-semibold mb-0.5">{d.label}</p>
      <p className="font-ui text-[11px] text-t-secondary">
        {d.presentCount} joueur{d.presentCount !== 1 ? "s" : ""} présent{d.presentCount !== 1 ? "s" : ""} sur {d.totalPlayers}
      </p>
      <p className="font-ui text-[11px] font-semibold mt-0.5" style={{ color: barColor(d.percentage) }}>
        {d.percentage}%
      </p>
    </div>
  );
}

interface Props {
  data: AttendanceChartPoint[];
  loading?: boolean;
  compact?: boolean;
  /** Only show the last N sessions */
  limit?: number;
}

export function AttendanceBarChart({ data, loading, compact, limit }: Props) {
  const chartHeight = compact ? 120 : 200;
  const displayed = limit ? data.slice(-limit) : data;

  if (loading) {
    return (
      <div
        className="w-full bg-bg-surface-2 rounded-lg animate-pulse"
        style={{ height: chartHeight }}
      />
    );
  }

  if (displayed.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center bg-bg-surface-2 rounded-lg"
        style={{ height: chartHeight }}
      >
        <p className="font-ui text-[13px] text-t-muted">
          Aucune séance dans les 30 derniers jours
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={displayed} barGap={4} barCategoryGap={compact ? "30%" : "25%"}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--text-secondary)", fontFamily: "var(--font-ui)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "var(--font-ui)" }}
            axisLine={false}
            tickLine={false}
            width={36}
            ticks={compact ? [0, 50, 100] : [0, 25, 50, 75, 100]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-primary-dim)" }} />
          <Bar dataKey="percentage" radius={[4, 4, 0, 0]} isAnimationActive>
            {displayed.map((entry, i) => (
              <Cell key={i} fill={barColor(entry.percentage)} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
