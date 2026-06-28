"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  type TooltipContentProps,
} from "recharts";

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  fill?: boolean;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0];

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-strong)",
      borderRadius: "var(--radius-md)",
      padding: "8px 12px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    }}>
      <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
        {(point.payload as { label: string }).label}
      </p>
      <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--fg)", margin: "3px 0 0", fontVariantNumeric: "tabular-nums" }}>
        {currency.format(Number(point.value))}
      </p>
    </div>
  );
}

export function BarChart({ data, height = 140, fill = false }: BarChartProps) {
  return (
    <div className="w-full" style={{ height: fill ? "100%" : height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barCategoryGap="22%">
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--fg-subtle)", fontSize: 11 }}
          />
          <YAxis hide domain={[0, (max: number) => max * 1.15]} />
          <Tooltip content={ChartTooltip} cursor={{ fill: "rgba(245,158,11,0.06)" }} />
          <defs>
            <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(245,158,11,0.90)" />
              <stop offset="100%" stopColor="rgba(245,158,11,0.25)" />
            </linearGradient>
          </defs>
          <Bar
            dataKey="value"
            fill="url(#barFill)"
            radius={[4, 4, 0, 0]}
            isAnimationActive
            animationDuration={600}
            animationEasing="ease-out"
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
