"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  type TooltipContentProps,
} from "recharts";

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  /** Hex color for line + area gradient. Defaults to #260078. */
  accentColor?: string;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0];

  return (
    <div style={{
      background: "rgba(10,10,16,0.95)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: "8px",
      padding: "8px 12px",
    }}>
      <p style={{ fontSize: "12px", fontWeight: 500, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.6px", margin: 0 }}>
        {(point.payload as { label: string }).label}
      </p>
      <p style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff", margin: "2px 0 0" }}>
        {currency.format(Number(point.value))}
      </p>
    </div>
  );
}

export function LineChart({ data, height = 160, accentColor = "#260078" }: LineChartProps) {
  const gradId = `grad_${accentColor.replace("#", "")}`;
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 12 }}
          />
          <YAxis hide domain={[0, (max: number) => max * 1.1]} />
          <Tooltip content={ChartTooltip} cursor={{ stroke: `${accentColor}40`, strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={accentColor}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            isAnimationActive
            animationDuration={600}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
