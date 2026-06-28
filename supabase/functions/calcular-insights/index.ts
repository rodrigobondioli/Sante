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

  // Insight: produtos sem custo
  const insightSemCusto = await calcularProdutosSemCusto(supabase, barId, porProduto, yearWeek);
  if (insightSemCusto) insightsParaInserir.push(insightSemCusto);

  // Insight: ticket em queda
  const insightTicket = await calcularTicketTendencia(supabase, barId, yearWeek);
  if (insightTicket) insightsParaInserir.push(insightTicket);

  // Insight: produto esquecido (boa margem, baixo giro)
  const insightEsquecido = await calcularProdutoEsquecido(supabase, barId, porProduto, yearWeek);
  if (insightEsquecido) insightsParaInserir.push(insightEsquecido);

  // Insight: cortesias acima do limite
  const insightCortesia = await calcularCortesiaElevada(supabase, barId, yearWeek);
  if (insightCortesia) insightsParaInserir.push(insightCortesia);

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

// ─── Insight: produto_sem_custo ───────────────────────────────────────────────

async function calcularProdutosSemCusto(
  supabase: ReturnType<typeof createClient>,
  barId: string,
  porProduto: Map<string, VendaProduto>,
  yearWeek: string,
): Promise<InsightPayload | null> {
  if (porProduto.size === 0) return null;

  const produtoIds = Array.from(porProduto.keys());
  const { data: comReceita } = await supabase
    .from("receitas")
    .select("produto_id")
    .eq("bar_id", barId)
    .in("produto_id", produtoIds)
    .returns<{ produto_id: string }[]>();

  const idsComReceita = new Set((comReceita ?? []).map(r => r.produto_id));
  const semReceita = Array.from(porProduto.values()).filter(
    p => !idsComReceita.has(p.produto_id)
  );

  if (semReceita.length === 0) return null;

  const receitaTotalSemCusto = semReceita.reduce((s, p) => s + p.receita, 0);
  const receitaTotal         = Array.from(porProduto.values()).reduce((s, p) => s + p.receita, 0);
  const pctSemCusto          = receitaTotal > 0
    ? Math.round((receitaTotalSemCusto / receitaTotal) * 100)
    : 0;

  // Só gera se representar ao menos 10% da receita (evita ruído)
  if (pctSemCusto < 10) return null;

  const nomes = semReceita.slice(0, 3).map(p => p.produto_nome).join(", ");
  const resto = semReceita.length > 3 ? ` e mais ${semReceita.length - 3}` : "";

  return {
    bar_id: barId,
    tipo:   "produto_sem_custo",
    titulo: `${semReceita.length} produto${semReceita.length > 1 ? "s" : ""} sem custo cadastrado`,
    descricao: [
      `${pctSemCusto}% da receita da semana (R$ ${receitaTotalSemCusto.toFixed(0)}) vem de produtos sem receita técnica.`,
      `Sem custo, a margem real é desconhecida.`,
      `Produtos: ${nomes}${resto}.`,
    ].join(" "),
    impacto_valor: -Math.round(receitaTotalSemCusto * 100) / 100,
    dado_referencia: {
      n_sem_custo:           semReceita.length,
      receita_sem_custo:     Math.round(receitaTotalSemCusto * 100) / 100,
      pct_receita_sem_custo: pctSemCusto,
      produtos:              semReceita.map(p => ({ id: p.produto_id, nome: p.produto_nome, receita: Math.round(p.receita * 100) / 100 })),
      janela_dias:           JANELA_DIAS,
    },
    dedupe_key: `produto_sem_custo:${barId}:${yearWeek}`,
    lido: false,
  };
}

// ─── Insight: ticket_queda ────────────────────────────────────────────────────

async function calcularTicketTendencia(
  supabase: ReturnType<typeof createClient>,
  barId: string,
  yearWeek: string,
): Promise<InsightPayload | null> {
  const agora = new Date();
  const d7    = new Date(agora); d7.setDate(agora.getDate() - 7);
  const d14   = new Date(agora); d14.setDate(agora.getDate() - 14);

  const { data: pagamentos } = await supabase
    .from("pagamentos")
    .select("valor_total, criado_em")
    .eq("bar_id", barId)
    .gte("criado_em", d14.toISOString())
    .returns<{ valor_total: number; criado_em: string }[]>();

  if (!pagamentos?.length) return null;

  const semanaAtual = pagamentos.filter(p => new Date(p.criado_em) >= d7);
  const semanaAntes = pagamentos.filter(p => new Date(p.criado_em) < d7);

  if (semanaAtual.length < 5 || semanaAntes.length < 5) return null;

  const ticketAtual = semanaAtual.reduce((s, p) => s + Number(p.valor_total), 0) / semanaAtual.length;
  const ticketAntes = semanaAntes.reduce((s, p) => s + Number(p.valor_total), 0) / semanaAntes.length;

  if (ticketAntes <= 0) return null;

  const deltaPct = ((ticketAtual - ticketAntes) / ticketAntes) * 100;

  if (deltaPct > -8) return null; // queda não significativa

  const impacto = (ticketAntes - ticketAtual) * semanaAtual.length;

  return {
    bar_id: barId,
    tipo:   "ticket_queda",
    titulo: `Ticket médio caiu ${Math.abs(deltaPct).toFixed(0)}% esta semana`,
    descricao: [
      `Semana passada: R$ ${ticketAntes.toFixed(0)} por comanda.`,
      `Esta semana: R$ ${ticketAtual.toFixed(0)}.`,
      `Projetando ${semanaAtual.length} comandas, isso representa R$ ${impacto.toFixed(0)} a menos no período.`,
    ].join(" "),
    impacto_valor: -Math.round(impacto * 100) / 100,
    dado_referencia: {
      ticket_atual:        Math.round(ticketAtual * 100) / 100,
      ticket_anterior:     Math.round(ticketAntes * 100) / 100,
      delta_pct:           Math.round(deltaPct * 10) / 10,
      n_comandas_atual:    semanaAtual.length,
      n_comandas_anterior: semanaAntes.length,
    },
    dedupe_key: `ticket_queda:${barId}:${yearWeek}`,
    lido: false,
  };
}

// ─── Insight: produto_esquecido ───────────────────────────────────────────────

async function calcularProdutoEsquecido(
  supabase: ReturnType<typeof createClient>,
  barId: string,
  porProduto: Map<string, VendaProduto>,
  yearWeek: string,
): Promise<InsightPayload | null> {
  if (porProduto.size < 4) return null; // bares pequenos: sem sinal suficiente

  const LIMITE_VENDAS  = 4;   // vendido <= N vezes na semana
  const LIMITE_CMV_BOM = 30;  // CMV abaixo disso = margem boa

  const candidatos: (VendaProduto & { cmv: number; custoPorUnidade: number })[] = [];

  for (const prod of porProduto.values()) {
    if (prod.quantidade > LIMITE_VENDAS) continue; // vendendo bem, não é esquecido
    if (prod.receita <= 0) continue;

    const { data: receitas } = await supabase
      .from("receitas")
      .select("ingrediente_id, quantidade")
      .eq("produto_id", prod.produto_id)
      .eq("bar_id", barId)
      .returns<{ ingrediente_id: string; quantidade: number }[]>();

    if (!receitas?.length) continue;

    let custoPorUnidade = 0;
    for (const r of receitas) {
      const { data: ing } = await supabase
        .from("ingredientes")
        .select("custo_atual")
        .eq("id", r.ingrediente_id)
        .single<{ custo_atual: number }>();
      if (ing?.custo_atual) {
        custoPorUnidade += Number(r.quantidade) * Number(ing.custo_atual);
      }
    }

    if (custoPorUnidade <= 0) continue;

    const precoPorUnidade = prod.receita / prod.quantidade;
    const cmv = (custoPorUnidade / precoPorUnidade) * 100;

    if (cmv > LIMITE_CMV_BOM) continue; // margem ruim, não é oportunidade

    candidatos.push({ ...prod, cmv, custoPorUnidade });
  }

  if (candidatos.length === 0) return null;

  const melhor = candidatos.sort((a, b) => a.cmv - b.cmv)[0];
  const margemPct = Math.round(100 - melhor.cmv);
  const potencial = (melhor.receita / melhor.quantidade) * (LIMITE_VENDAS * 2 - melhor.quantidade);

  return {
    bar_id: barId,
    tipo:   "produto_esquecido",
    titulo: `${melhor.produto_nome} tem margem de ${margemPct}% e quase não sai`,
    descricao: [
      `Vendido apenas ${melhor.quantidade}× nesta semana, mas com margem de ${margemPct}%.`,
      `Sugerir para clientes pode gerar R$ ${potencial.toFixed(0)} adicionais.`,
    ].join(" "),
    impacto_valor: Math.round(potencial * 100) / 100,
    dado_referencia: {
      produto_id:        melhor.produto_id,
      produto_nome:      melhor.produto_nome,
      cmv_pct:           Math.round(melhor.cmv * 10) / 10,
      margem:            margemPct,
      quantidade:        melhor.quantidade,
      potencial:         Math.round(potencial * 100) / 100,
      todos_candidatos:  candidatos.length,
      janela_dias:       JANELA_DIAS,
    },
    dedupe_key: `produto_esquecido:${melhor.produto_id}:${yearWeek}`,
    lido: false,
  };
}

// ─── Insight: cortesia_elevada ────────────────────────────────────────────────

async function calcularCortesiaElevada(
  supabase: ReturnType<typeof createClient>,
  barId: string,
  yearWeek: string,
): Promise<InsightPayload | null> {
  const LIMITE_CORTESIA_PCT = 12; // % — acima disso é alerta

  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - JANELA_DIAS);

  const { data: pagamentos } = await supabase
    .from("pagamentos")
    .select("metodo, valor")
    .eq("bar_id", barId)
    .gte("criado_em", dataInicio.toISOString())
    .returns<{ metodo: string; valor: number }[]>();

  if (!pagamentos?.length) return null;

  const total         = pagamentos.reduce((s, p) => s + Number(p.valor), 0);
  const cortesias     = pagamentos.filter(p => p.metodo === "cortesia");
  const totalCortesia = cortesias.reduce((s, p) => s + Number(p.valor), 0);

  if (total <= 0 || cortesias.length === 0) return null;

  const pct = (totalCortesia / total) * 100;

  if (pct <= LIMITE_CORTESIA_PCT) return null;

  return {
    bar_id: barId,
    tipo:   "cortesia_elevada",
    titulo: `Cortesias representam ${pct.toFixed(0)}% da receita da semana`,
    descricao: [
      `R$ ${totalCortesia.toFixed(0)} dados como cortesia em ${cortesias.length} pagamento${cortesias.length > 1 ? "s" : ""}.`,
      `O limite saudável é até ${LIMITE_CORTESIA_PCT}% da receita.`,
      `Revise se todas as cortesias foram autorizadas.`,
    ].join(" "),
    impacto_valor: -Math.round(totalCortesia * 100) / 100,
    dado_referencia: {
      total_cortesia: Math.round(totalCortesia * 100) / 100,
      n_cortesias:    cortesias.length,
      pct_receita:    Math.round(pct * 10) / 10,
      limite_pct:     LIMITE_CORTESIA_PCT,
      receita_total:  Math.round(total * 100) / 100,
      janela_dias:    JANELA_DIAS,
    },
    dedupe_key: `cortesia_elevada:${barId}:${yearWeek}`,
    lido: false,
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
