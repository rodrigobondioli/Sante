interface TrendTextProps {
  percent: number | null;
  comparativoLabel?: string;
  /** Kept for API compatibility — no longer affects color rendering. */
  colored?: boolean;
  /** Kept for API compatibility — no longer affects color rendering. */
  invert?: boolean;
}

export function TrendText({
  percent,
  comparativoLabel = "vs turno anterior",
}: TrendTextProps) {
  if (percent === null) {
    return (
      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "6px" }}>
        Sem comparação · {comparativoLabel}
      </span>
    );
  }

  const isPositive = percent >= 0;
  const arrow = isPositive ? "↑" : "↓";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontSize: "12px",
        color: "rgba(255,255,255,0.45)",
        fontWeight: 500,
        marginTop: "6px",
      }}
    >
      {arrow} {Math.abs(percent).toFixed(1)}% {comparativoLabel}
    </span>
  );
}
