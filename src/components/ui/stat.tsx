import { cn } from "@/lib/utils";

interface StatProps {
  value: string;
  label: string;
  /** xl = KPI principal (padrão), lg = KPI secundário — DESIGN.md §3.2 */
  size?: "lg" | "xl";
}

const sizeClasses: Record<"lg" | "xl", string> = {
  lg: "text-data-lg",
  xl: "text-data-xl",
};

export function Stat({ value, label, size = "xl" }: StatProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className={cn(sizeClasses[size], "font-mono font-bold tabular-nums text-white")}>
        {value}
      </span>
      <span className="text-caption uppercase tracking-[0.1em] text-white-50">{label}</span>
    </div>
  );
}
