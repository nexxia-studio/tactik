import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
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
    <div className="bg-bg-surface-1 border border-b-subtle rounded-xl px-4 py-3 shadow-xl">
      <p className="font-ui text-[11px] text-t-muted uppercase tracking-wider mb-1">{d.label}</p>
      <p className="font-display text-[28px] leading-none font-bold text-t-primary">
        {d.percentage}%
      </p>
      <p className="font-ui text-[12px] text-t-secondary mt-1">
        {d.presentCount}/{d.totalPlayers} joueurs
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
  const chartHeight = compact ? 140 : 220;
  const displayed = limit ? data.slice(-limit) : data;

  const [visibleCount, setVisibleCount] = useState(0);
  const displayedKey = displayed.map((d) => d.date).join(",");

  useEffect(() => {
    setVisibleCount(0);
    if (!displayed.length) return;
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setVisibleCount(count);
      if (count >= displayed.length) clearInterval(interval);
    }, 150);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedKey]);

  // Keep all bars in the dataset so X-axis labels stay stable;
  // force hidden bars to 0 so Recharts animates them up on reveal.
  const animatedData = displayed.map((entry, i) =>
    i < visibleCount ? entry : { ...entry, percentage: 0 }
  );

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
        <BarChart
          data={animatedData}
          barGap={4}
          barCategoryGap={compact ? "30%" : "25%"}
          margin={{ top: 20, right: 4, left: 0, bottom: 0 }}
        >
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
          <Bar dataKey="percentage" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} animationEasing="ease-out">
            {animatedData.map((_, i) => (
              <Cell key={i} fill={barColor(displayed[i].percentage)} fillOpacity={0.85} />
            ))}
            <LabelList
              dataKey="percentage"
              position="top"
              fontSize={11}
              fontFamily="var(--font-ui)"
              formatter={(v: number) => (v > 0 ? `${v}%` : "")}
              fill="var(--text-secondary)"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
