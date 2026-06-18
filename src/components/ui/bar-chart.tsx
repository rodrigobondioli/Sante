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
  /** Fill color for bars. Defaults to #260078. */
  barColor?: string;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0];

  return (
    <div className="rounded-md border border-border bg-surface-card px-3 py-2 shadow-indigo-sm">
      <p className="text-caption uppercase tracking-[0.1em] text-white-50">
        {(point.payload as { label: string }).label}
      </p>
      <p className="text-body-sm mt-0.5 font-mono font-semibold text-white">
        {currency.format(Number(point.value))}
      </p>
    </div>
  );
}

// Barras em índigo — variante mais compacta do LineChart, usada onde o
// período é curto e fixo (ex: últimos 7 dias na Visão Geral).
export function BarChart({ data, height = 140, barColor = "#260078" }: BarChartProps) {
  const tickColor = barColor === "#260078" ? "#ffffff80" : "rgba(255,255,255,0.6)";
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barCategoryGap="16%">
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: tickColor, fontSize: 12 }}
          />
          <YAxis hide domain={[0, (max: number) => max * 1.15]} />
          <Tooltip content={ChartTooltip} cursor={{ fill: "rgba(255,255,255,0.1)" }} />
          <Bar
            dataKey="value"
            fill={barColor}
            radius={[6, 6, 0, 0]}
            isAnimationActive
            animationDuration={500}
            animationEasing="ease-out"
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
