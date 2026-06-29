import type { CSSProperties, ReactNode } from "react";

export function CardOverline({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const base: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "#F59E0B",
    display: "block",
    marginBottom: 10,
    letterSpacing: "0.01em",
  };
  return <span style={{ ...base, ...style }}>{children}</span>;
}
