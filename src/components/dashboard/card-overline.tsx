import type { CSSProperties, ReactNode } from "react";

export function CardOverline({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const base: CSSProperties = {
    fontSize: "10px",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "var(--fg-subtle)",
    display: "block",
    marginBottom: 8,
  };
  return <span style={{ ...base, ...style }}>{children}</span>;
}
