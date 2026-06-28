import type { CSSProperties, ReactNode } from "react";

export function CardOverline({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const base: CSSProperties = {
    fontSize: "10px",
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.09em",
    color: "var(--fg-subtle)",
    display: "block",
    marginBottom: 10,
  };
  return <span style={{ ...base, ...style }}>{children}</span>;
}
