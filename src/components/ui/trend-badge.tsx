import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TrendBadgeProps {
  percent: number | null;
  /** Quando true, alta vira error e queda vira success (ex: alertas de estoque). */
  invert?: boolean;
}

// Comparação ↑↓ entre períodos — única exceção a cores semânticas fora de
// surfaces operacionais permitida pelo DESIGN.md §9 (Dashboard Dono).
export function TrendBadge({ percent, invert = false }: TrendBadgeProps) {
  if (percent === null) {
    return <Badge variant="neutral">novo</Badge>;
  }

  const isPositive = percent >= 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  const isGood = invert ? !isPositive : isPositive;

  return (
    <Badge variant={isGood ? "success" : "error"}>
      <Icon className="h-3 w-3" strokeWidth={2} />
      {Math.abs(percent).toFixed(1)}%
    </Badge>
  );
}
