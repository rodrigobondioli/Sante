/**
 * Edge Function: calcular-insights
 *
 * Roda diariamente via cron (configurar no Supabase → Database → Cron Jobs).
 * Cron sugerido: "0 7 * * *" (todo dia às 7h).
 *
 * O que faz:
 *   1. Busca todos os bares ativos
 *   2. Para cada bar, lê vendas dos últimos 7 dias
 *   3. Calcula CMV por produto (custo_ingredientes / receita_venda)
 *   4. Se CMV > LIMITE_CMV_PCT, gera insight "cmv_alto_produto"
 *   5. Respeita dedupe_key — não cria duplicata enquanto o insight não foi lido
 *
 * Expansão futura: adicionar mais tipos de insight neste mesmo arquivo.
 * Cada tipo deve ter sua própria função `calcular_{tipo}`.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Configuração ─────────────────────────────────────────────────────────────

const LIMITE_CMV_PCT  = 35;   // % — CMV acima disso gera alerta
const JANELA_DIAS     = 7;    // Olha os últimos N dias de vendas

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface VendaProduto {
  produto_id:   string;
  produto_nome: string;
  quantidade:   number;
  receita:      number;
}

interface InsightPayload {
  bar_id:          string;
  tipo:            string;
  titulo:          string;
  descricao:       string;
  impacto_valor:   number;
  dado_referencia: Record<string, unknown>;
  dedupe_key:      string;
  lido:            boolean;
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const yearWeek = getYearWeek(new Date());

  // Busca todos os bares ativos
  const { data: bars, error: barsError } = await supabase
    .from("bars")
    .select("id")
    .eq("ativo", true);

  if (barsError) {
    return Response.json({ ok: false, error: barsError.message }, { status: 500 });
  }

  const resultados: Record<string, number> = {};

  for (const bar of bars ?? []) {
    const n = await processarBar(supabase, bar.id, yearWeek);
    resultados[bar.id] = n;
  }

  return Response.json({ ok: true, insights_gerados: resultados });
});

// ─── Processamento por bar ────────────────────────────────────────────────────

async function processarBar(
  supabase: ReturnType<typeof createClient>,
  barId: string,
  yearWeek: string,
): Promise<number> {
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - JANELA_DIAS);

  // 1. Busca vendas dos últimos JANELA_DIAS dias
  const { data: itens } = await supabase
    .from("comanda_items")
    .select("produto_id, quantidade, preco_total, produtos(nome)")
    .eq("bar_id", barId)
    .eq("status", "ativo")
    .gte("adicionado_em", dataInicio.toISOString())
    .returns<{
      produto_id: string;
      quantidade: number;
      preco_total: number;
      produtos: { nome: string } | null;
    }[]>();

  if (!itens?.length) return 0;

  // 2. Agrega por produto
  const porProduto = new Map<string, VendaProduto>();
  for (const item of itens) {
    const atual = porProduto.get(item.produto_id) ?? {
      produto_id:   item.produto_id,
      produto_nome: item.produtos?.nome ?? "Produto",
      quantidade:   0,
      receita:      0,
    };
    atual.quantidade += Number(item.quantidade);
    atual.receita    += Number(item.preco_total);
    porProduto.set(item.produto_id, atual);
  }

  // 3. Calcula CMV de cada produto e gera insights
  const insightsParaInserir: InsightPayload[] = [];

  for (const prod of porProduto.values()) {
    const insight = await calcularCmvProduto(supabase, barId, prod, yearWeek);
    if (insight) insightsParaInserir.push(insight);
  }

  if (!insightsParaInserir.length) return 0;

  // 4. Insere apenas os que ainda não existem (dedupe via check manual)
  let inseridos = 0;
  for (const insight of insightsParaInserir) {
    const inserido = await inserirInsightSeDedupe(supabase, insight);
    if (inserido) inseridos++;
  }

  return inseridos;
}

// ─── Insight: cmv_alto_produto ────────────────────────────────────────────────

async function calcularCmvProduto(
  supabase: ReturnType<typeof createClient>,
  barId: string,
  prod: VendaProduto,
  yearWeek: string,
): Promise<InsightPayload | null> {
  if (prod.receita <= 0) return null;

  // Busca receita do produto
  const { data: receitas } = await supabase
    .from("receitas")
    .select("ingrediente_id, quantidade")
    .eq("produto_id", prod.produto_id)
    .eq("bar_id", barId)
    .returns<{ ingrediente_id: string; quantidade: number }[]>();

  if (!receitas?.length) return null; // sem receita = não dá pra calcular CMV

  // Calcula custo por unidade somando ingredientes
  let custoPorUnidade = 0;
  for (const receita of receitas) {
    const { data: ingrediente } = await supabase
      .from("ingredientes")
      .select("custo_atual")
      .eq("id", receita.ingrediente_id)
      .single<{ custo_atual: number }>();

    if (ingrediente?.custo_atual) {
      custoPorUnidade += Number(receita.quantidade) * Number(ingrediente.custo_atual);
    }
  }

  if (custoPorUnidade <= 0) return null;

  const custoTotal = custoPorUnidade * prod.quantidade;
  const cmvPct     = (custoTotal / prod.receita) * 100;

  if (cmvPct <= LIMITE_CMV_PCT) return null;

  // CMV acima do limite — gera insight
  const margemPerdida = custoTotal - (LIMITE_CMV_PCT / 100) * prod.receita;

  return {
    bar_id: barId,
    tipo:   "cmv_alto_produto",
    titulo: `CMV alto: ${prod.produto_nome}`,
    descricao: [
      `${prod.produto_nome} está com CMV de ${cmvPct.toFixed(0)}%.`,
      `Acima do limite recomendado de ${LIMITE_CMV_PCT}%.`,
      `Margem estimada perdida: R$ ${margemPerdida.toFixed(0)} nesta semana.`,
    ].join(" "),
    impacto_valor: -Math.round(margemPerdida * 100) / 100,
    dado_referencia: {
      produto_id:       prod.produto_id,
      produto_nome:     prod.produto_nome,
      cmv_pct:          Math.round(cmvPct * 10) / 10,
      cmv_limite:       LIMITE_CMV_PCT,
      custo_total:      Math.round(custoTotal * 100) / 100,
      receita_total:    Math.round(prod.receita * 100) / 100,
      custo_por_unidade: Math.round(custoPorUnidade * 100) / 100,
      quantidade_vendida: prod.quantidade,
      janela_dias:      JANELA_DIAS,
    },
    dedupe_key: `cmv_alto_produto:${prod.produto_id}:${yearWeek}`,
    lido:       false,
  };
}

// ─── Inserção com deduplicação ────────────────────────────────────────────────

async function inserirInsightSeDedupe(
  supabase: ReturnType<typeof createClient>,
  insight: InsightPayload,
): Promise<boolean> {
  // Verifica se já existe insight aberto com a mesma chave
  const { count } = await supabase
    .from("insights")
    .select("id", { count: "exact", head: true })
    .eq("bar_id", insight.bar_id)
    .eq("dedupe_key", insight.dedupe_key)
    .eq("lido", false);

  if (count && count > 0) return false; // já existe, não duplica

  const { error } = await supabase.from("insights").insert(insight);
  return !error;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Retorna a semana ISO do ano no formato "YYYY-WWnn".
 * Exemplo: "2026-W26"
 * Usado no dedupe_key para limitar um insight por produto por semana.
 */
function getYearWeek(date: Date): string {
  const d    = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day  = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${week.toString().padStart(2, "0")}`;
}
