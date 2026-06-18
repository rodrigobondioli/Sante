import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import type { CategoriaMenu } from "@/lib/dashboard/menu-engineering";

const config: Record<
  CategoriaMenu,
  { label: string; variant: "indigo" | "success" | "neutral" | "error"; descricao: string }
> = {
  star: { label: "Star", variant: "indigo", descricao: "Alto volume + alta margem" },
  cash_cow: { label: "Cash Cow", variant: "success", descricao: "Alto volume + margem média" },
  slow: { label: "Slow", variant: "neutral", descricao: "Baixo volume" },
  problema: { label: "Problema", variant: "error", descricao: "Margem muito baixa" },
  sem_dados: { label: "Sem dados", variant: "neutral", descricao: "Sem custo cadastrado" },
};

export function CategoriaBadge({ categoria }: { categoria: CategoriaMenu }) {
  const { label, variant, descricao } = config[categoria];
  return (
    <Tooltip content={descricao}>
      <Badge variant={variant}>{label}</Badge>
    </Tooltip>
  );
}
