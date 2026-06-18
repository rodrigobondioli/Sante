import type { TopDrink } from "@/lib/dashboard/queries";

interface GerarInsightParams {
  produtosVendidos: TopDrink[];
  faturamentoTurno: number;
  cmvTrend: number | null;
  alertasCount: number;
}

// Insight calculado a partir dos dados reais do turno — não é gerado por um
// modelo de linguagem, é regra de negócio determinística. Prioridade:
// alerta operacional > variação de custo > destaque de venda > fallback.
export function gerarInsight({
  produtosVendidos,
  faturamentoTurno,
  cmvTrend,
  alertasCount,
}: GerarInsightParams): string {
  if (alertasCount > 0) {
    return `${alertasCount} ${alertasCount === 1 ? "produto está" : "produtos estão"} abaixo do estoque mínimo. Repor agora evita perda de venda ainda neste turno.`;
  }

  if (cmvTrend !== null && cmvTrend >= 5) {
    return `O CMV subiu ${cmvTrend.toFixed(1)}% em relação ao turno anterior. Vale revisar o custo dos produtos mais vendidos.`;
  }

  const maisVendido = [...produtosVendidos].sort((a, b) => b.faturamento - a.faturamento)[0];
  if (maisVendido && faturamentoTurno > 0) {
    const participacao = (maisVendido.faturamento / faturamentoTurno) * 100;
    return `${maisVendido.produtoNome} lidera as vendas do turno: ${maisVendido.quantidadeVendida} unidades, ${participacao.toFixed(0)}% do faturamento.`;
  }

  if (cmvTrend !== null && cmvTrend <= -5) {
    return `O CMV caiu ${Math.abs(cmvTrend).toFixed(1)}% em relação ao turno anterior — boa margem mantida.`;
  }

  return "Ainda não há dados suficientes neste turno para gerar um insight.";
}
