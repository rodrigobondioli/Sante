interface TrendTextProps {
  percent: number | null;
  comparativoLabel?: string;
  colored?: boolean;
  invert?: boolean;
}

function TrendArrow({ up, color }: { up: boolean; color: string }) {
  return (
    <svg
      width="7" height="7" viewBox="0 0 7 7"
      style={{ display: "inline-block", flexShrink: 0, verticalAlign: "middle" }}
    >
      {up
        ? <path d="M3.5 0.5L6.8 6.5H0.2L3.5 0.5Z" fill={color} />
        : <path d="M3.5 6.5L0.2 0.5H6.8L3.5 6.5Z" fill={color} />
      }
    </svg>
  );
}

export function TrendText({ percent, comparativoLabel = "vs turno anterior", invert }: TrendTextProps) {
  if (percent === null) {
    return (
      <span style={{ fontSize: "11px", color: "var(--fg-subtle)", display: "inline-flex", alignItems: "center" }}>
        Sem dados
      </span>
    );
  }

  const isPositive = percent >= 0;
  const isGood     = invert ? !isPositive : isPositive;
  const color      = isGood ? "var(--ok)" : "var(--danger)";

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "11px", fontWeight: 500, color: "var(--fg-muted)" }}>
      <TrendArrow up={isPositive} color={color} />
      <span style={{ color, fontWeight: 700, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>
        {Math.abs(percent).toFixed(1)}%
      </span>
      <span>{comparativoLabel}</span>
    </span>
  );
}
