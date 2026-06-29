import type { CSSProperties, ReactNode } from "react";

interface DashCardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function DashCard({ children, style, className }: DashCardProps) {
  const base: CSSProperties = {
    background: "#1C1C1E",
    border: "1px solid #2C2C2E",
    borderRadius: 16,
    padding: "20px 24px",
  };
  return (
    <div style={{ ...base, ...style }} className={className}>
      {children}
    </div>
  );
}
