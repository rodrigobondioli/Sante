/**
 * Queries do painel admin da plataforma SUPERBAR.
 * Usa createAdminClient() (service role) — bypassa RLS.
 * Nunca expor ao cliente.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { AssinaturaStatus } from "@/types/database";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type RiskLevel  = "red" | "yellow" | "ok";
export type HealthScore = "green" | "yellow" | "red";
export type ImplantacaoScore = "completo" | "parcial" | "abandonado";

export interface RiskAlert {
  level: RiskLevel;
  label: string;
}

export interface BarResumo {
  id: string;
  nome: string;
  slug: string;
  cidade: string | null;
  estado: string | null;
  ativo: boolean;
  created_at: string;
  // Plano e cobrança
  plano_nome: string | null;
  plano_preco: number | null;
  assinatura_status: AssinaturaStatus | null;
  trial_fim: string | null;
  // Atividade
  ultimo_turno_em: string | null;
  dias_sem_uso: number | null;
  // Últimos 7 dias
  turnos_7d: number;
  comandas_7d: number;
  faturamento_7d: number;
  // Totais
  total_turnos: number;
  total_membros: number;
  total_produtos: number;
  cobertura_custo_pct: number; // 0-100
  // Scores
  healthScore: HealthScore;
  healthScoreNumerico: number; // 0-100
  implantacaoScore: ImplantacaoScore;
  alertas: RiskAlert[];
}

export interface AdminStats {
  total_bares: number;
  mrr: number;
  // Saúde
  bares_saudaveis: number;
  bares_atencao: number;
  bares_risco: number;
  // Implantação
  implantacao_completo: number;
  implantacao_parcial: number;
  implantacao_abandonado: number;
  // Outros
  bares_sem_uso_7d: number;
  bares_inadimplentes: number;
}

export interface BarDetalhe {
  id: string;
  nome: string;
  slug: string;
  cnpj: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  ativo: boolean;
  created_at: string;
  configuracoes: Record<string, unknown>;
  // Plano e cobrança
  plano_id: string | null;
  plano_nome: string | null;
  plano_preco: number | null;
  assinatura_id: string | null;
  assinatura_status: AssinaturaStatus | null;
  trial_fim: string | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  // Atividade
  ultimo_turno_em: string | null;
  dias_sem_uso: number | null;
  // 7d
  turnos_7d: number;
  comandas_7d: number;
  faturamento_7d: number;
  // Operação total
  total_turnos: number;
  total_comandas: number;
  total_pagamentos: number;
  total_produtos: number;
  total_produtos_com_custo: number;
  cobertura_custo_pct: number;
  // Scores
  healthScore: HealthScore;
  healthScoreNumerico: number; // 0-100
  implantacaoScore: ImplantacaoScore;
  alertas: RiskAlert[];
  // Equipe
  membros: {
    id: string;
    nome: string | null;
    role: string;
    ativo: boolean;
    created_at: string;
  }[];
}

// ─── Score numérico 0-100 ─────────────────────────────────────────────────────
// Uso (40pts) + Implantação (30pts) + Cobrança (30pts)

function computeScoreNumerico({
  assinatura_status,
  trial_fim,
  dias_sem_uso,
  total_turnos,
  cobertura_custo_pct,
  total_membros,
}: {
  assinatura_status: AssinaturaStatus | null;
  trial_fim: string | null;
  dias_sem_uso: number | null;
  total_turnos: number;
  cobertura_custo_pct: number;
  total_membros: number;
}): number {
  let score = 0;

  // Uso (40pts)
  if (total_turnos > 0 && dias_sem_uso !== null) {
    if (dias_sem_uso === 0)       score += 40;
    else if (dias_sem_uso < 3)   score += 28;
    else if (dias_sem_uso < 7)   score += 12;
    // ≥7d: 0pts
  }

  // Implantação (30pts): custo 0-20pts + membros 0-10pts
  score += Math.round(cobertura_custo_pct * 0.2); // 0-20
  if (total_membros >= 2)       score += 10;
  else if (total_membros === 1) score += 5;

  // Cobrança (30pts)
  if (assinatura_status === "ativa") {
    score += 30;
  } else if (assinatura_status === "trial" && trial_fim) {
    const d = Math.ceil((new Date(trial_fim).getTime() - Date.now()) / 86400000);
    if (d > 3)       score += 15;
    else if (d > 0)  score += 8;
    // expirado: 0
  }

  return Math.min(100, score);
}

// ─── Score de saúde ───────────────────────────────────────────────────────────
// 🔴 Risco:    inadimplente | cancelada | sem uso ≥ 7d | trial expirado
// 🟡 Atenção:  custo < 60% | sem uso 3–6d | trial ≤ 3d
// 🟢 Saudável: tudo certo

function computeHealth({
  assinatura_status,
  trial_fim,
  dias_sem_uso,
  total_turnos,
  cobertura_custo_pct,
  ativo,
}: {
  assinatura_status: AssinaturaStatus | null;
  trial_fim: string | null;
  dias_sem_uso: number | null;
  total_turnos: number;
  cobertura_custo_pct: number;
  ativo: boolean;
}): HealthScore {
  if (!ativo) return "red";
  if (assinatura_status === "inadimplente" || assinatura_status === "cancelada") return "red";

  if (assinatura_status === "trial" && trial_fim) {
    const diasRestantes = Math.ceil((new Date(trial_fim).getTime() - Date.now()) / 86400000);
    if (diasRestantes <= 0) return "red";
  }

  if (total_turnos > 0 && dias_sem_uso !== null && dias_sem_uso >= 7) return "red";

  // Yellow
  if (assinatura_status === "trial" && trial_fim) {
    const diasRestantes = Math.ceil((new Date(trial_fim).getTime() - Date.now()) / 86400000);
    if (diasRestantes <= 3) return "yellow";
  }

  if (total_turnos > 0 && dias_sem_uso !== null && dias_sem_uso >= 3) return "yellow";
  if (cobertura_custo_pct < 60 && total_turnos > 0) return "yellow";

  return "green";
}

// ─── Score de implantação ─────────────────────────────────────────────────────
// Completo:   ≥3 turnos + custo ≥60% + ≥2 membros
// Parcial:    algum uso mas incompleto
// Abandonado: 0 turnos

function computeImplantacao({
  total_turnos,
  cobertura_custo_pct,
  total_membros,
}: {
  total_turnos: number;
  cobertura_custo_pct: number;
  total_membros: number;
}): ImplantacaoScore {
  if (total_turnos === 0) return "abandonado";
  if (total_turnos >= 3 && cobertura_custo_pct >= 60 && total_membros >= 2) return "completo";
  return "parcial";
}

// ─── Alertas detalhados ───────────────────────────────────────────────────────

function computeAlertas({
  assinatura_status,
  trial_fim,
  dias_sem_uso,
  total_turnos,
  cobertura_custo_pct,
  ativo,
}: {
  assinatura_status: AssinaturaStatus | null;
  trial_fim: string | null;
  dias_sem_uso: number | null;
  total_turnos: number;
  cobertura_custo_pct: number;
  ativo: boolean;
}): RiskAlert[] {
  const alerts: RiskAlert[] = [];

  if (!ativo) { alerts.push({ level: "red", label: "Bar inativo" }); return alerts; }
  if (assinatura_status === "inadimplente") alerts.push({ level: "red", label: "Inadimplente" });
  if (assinatura_status === "cancelada") alerts.push({ level: "red", label: "Cancelada" });

  if (assinatura_status === "trial" && trial_fim) {
    const d = Math.ceil((new Date(trial_fim).getTime() - Date.now()) / 86400000);
    if (d <= 0) alerts.push({ level: "red", label: "Trial expirado" });
    else if (d <= 3) alerts.push({ level: "yellow", label: `Trial: ${d}d` });
  }

  if (total_turnos > 0 && dias_sem_uso !== null && dias_sem_uso >= 7)
    alerts.push({ level: "red", label: `${dias_sem_uso}d sem uso` });
  else if (total_turnos > 0 && dias_sem_uso !== null && dias_sem_uso >= 3)
    alerts.push({ level: "yellow", label: `${dias_sem_uso}d sem uso` });

  if (cobertura_custo_pct < 60 && total_turnos > 0)
    alerts.push({ level: "yellow", label: `Custo ${cobertura_custo_pct}%` });

  return alerts;
}

// ─── Lista de bares + stats globais ──────────────────────────────────────────

export async function getAdminBares(): Promise<{
  bares: BarResumo[];
  stats: AdminStats;
}> {
  const admin = createAdminClient();
  const ago7d = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: bares } = await admin
    .from("bars")
    .select("id, nome, slug, endereco, ativo, created_at")
    .order("created_at", { ascending: false });

  if (!bares?.length) {
    return {
      bares: [],
      stats: {
        total_bares: 0, mrr: 0,
        bares_saudaveis: 0, bares_atencao: 0, bares_risco: 0,
        implantacao_completo: 0, implantacao_parcial: 0, implantacao_abandonado: 0,
        bares_sem_uso_7d: 0, bares_inadimplentes: 0,
      },
    };
  }

  const barIds = bares.map((b) => b.id);

  const [
    { data: assinaturas },
    { data: turnos },
    { data: membros },
    { data: produtos },
    { data: pagamentos7d },
    { data: comandas7d },
  ] = await Promise.all([
    admin.from("assinaturas")
      .select("bar_id, status, trial_fim, planos(nome, preco_mensal)")
      .in("bar_id", barIds),
    admin.from("turnos")
      .select("id, bar_id, aberto_em")
      .in("bar_id", barIds)
      .order("aberto_em", { ascending: false }),
    admin.from("bar_members")
      .select("bar_id, id")
      .in("bar_id", barIds)
      .eq("ativo", true),
    admin.from("produtos")
      .select("bar_id, custo")
      .in("bar_id", barIds)
      .eq("ativo", true),
    admin.from("pagamentos")
      .select("bar_id, valor, taxa_servico_valor")
      .in("bar_id", barIds)
      .eq("status", "confirmado")
      .gte("processado_em", ago7d),
    admin.from("comandas")
      .select("bar_id, id")
      .in("bar_id", barIds)
      .gte("criado_em", ago7d),
  ]);

  // ── Indexar por bar ──────────────────────────────────────────────────────

  type AssRow = { bar_id: string; status: AssinaturaStatus; trial_fim: string | null; planos: { nome: string; preco_mensal: number } | null };
  const assPorBar = new Map(((assinaturas as AssRow[] | null) ?? []).map((a) => [a.bar_id, a]));

  const turnosMap = new Map<string, { ultimo: string | null; total: number; total7d: number }>();
  for (const t of turnos ?? []) {
    const cur = turnosMap.get(t.bar_id);
    const is7d = new Date(t.aberto_em) >= new Date(ago7d);
    if (!cur) turnosMap.set(t.bar_id, { ultimo: t.aberto_em, total: 1, total7d: is7d ? 1 : 0 });
    else turnosMap.set(t.bar_id, { ultimo: cur.ultimo, total: cur.total + 1, total7d: cur.total7d + (is7d ? 1 : 0) });
  }

  const membrosPorBar = new Map<string, number>();
  for (const m of membros ?? []) membrosPorBar.set(m.bar_id, (membrosPorBar.get(m.bar_id) ?? 0) + 1);

  const produtosMap = new Map<string, { total: number; comCusto: number }>();
  for (const p of produtos ?? []) {
    const cur = produtosMap.get(p.bar_id) ?? { total: 0, comCusto: 0 };
    produtosMap.set(p.bar_id, { total: cur.total + 1, comCusto: cur.comCusto + (p.custo !== null && Number(p.custo) > 0 ? 1 : 0) });
  }

  const fat7dMap = new Map<string, number>();
  for (const p of pagamentos7d ?? []) {
    fat7dMap.set(p.bar_id, (fat7dMap.get(p.bar_id) ?? 0) + Number(p.valor) + Number(p.taxa_servico_valor ?? 0));
  }

  const cmd7dMap = new Map<string, number>();
  for (const c of comandas7d ?? []) cmd7dMap.set(c.bar_id, (cmd7dMap.get(c.bar_id) ?? 0) + 1);

  // ── Montar lista ──────────────────────────────────────────────────────────

  const result: BarResumo[] = bares.map((b) => {
    const end     = b.endereco as { cidade?: string; estado?: string } | null;
    const ass     = assPorBar.get(b.id);
    const t       = turnosMap.get(b.id);
    const prod    = produtosMap.get(b.id) ?? { total: 0, comCusto: 0 };
    const membros = membrosPorBar.get(b.id) ?? 0;
    const plano   = ass?.planos as { nome: string; preco_mensal: number } | null | undefined;

    const ultimoTurno  = t?.ultimo ?? null;
    const diasSemUso   = ultimoTurno ? Math.floor((Date.now() - new Date(ultimoTurno).getTime()) / 86400000) : null;
    const coberturaPct = prod.total > 0 ? Math.round((prod.comCusto / prod.total) * 100) : 0;
    const totalTurnos  = t?.total ?? 0;

    const scoreArgs = { assinatura_status: ass?.status ?? null, trial_fim: ass?.trial_fim ?? null, dias_sem_uso: diasSemUso, total_turnos: totalTurnos, cobertura_custo_pct: coberturaPct, ativo: b.ativo };
    const healthScore         = computeHealth(scoreArgs);
    const healthScoreNumerico = computeScoreNumerico({ ...scoreArgs, total_membros: membros });
    const implantacaoScore    = computeImplantacao({ total_turnos: totalTurnos, cobertura_custo_pct: coberturaPct, total_membros: membros });
    const alertas             = computeAlertas(scoreArgs);

    return {
      id: b.id, nome: b.nome, slug: b.slug,
      cidade: end?.cidade ?? null, estado: end?.estado ?? null,
      ativo: b.ativo, created_at: b.created_at,
      plano_nome: plano?.nome ?? null, plano_preco: plano?.preco_mensal ?? null,
      assinatura_status: ass?.status ?? null, trial_fim: ass?.trial_fim ?? null,
      ultimo_turno_em: ultimoTurno, dias_sem_uso: diasSemUso,
      turnos_7d: t?.total7d ?? 0, comandas_7d: cmd7dMap.get(b.id) ?? 0, faturamento_7d: fat7dMap.get(b.id) ?? 0,
      total_turnos: totalTurnos, total_membros: membros,
      total_produtos: prod.total, cobertura_custo_pct: coberturaPct,
      healthScore, healthScoreNumerico, implantacaoScore, alertas,
    };
  });

  // ── Stats globais ─────────────────────────────────────────────────────────

  const mrr = result.reduce((acc, b) => acc + (b.assinatura_status === "ativa" && b.plano_preco ? b.plano_preco : 0), 0);

  return {
    bares: result,
    stats: {
      total_bares:             result.length,
      mrr,
      bares_saudaveis:         result.filter((b) => b.healthScore === "green").length,
      bares_atencao:           result.filter((b) => b.healthScore === "yellow").length,
      bares_risco:             result.filter((b) => b.healthScore === "red").length,
      implantacao_completo:    result.filter((b) => b.implantacaoScore === "completo").length,
      implantacao_parcial:     result.filter((b) => b.implantacaoScore === "parcial").length,
      implantacao_abandonado:  result.filter((b) => b.implantacaoScore === "abandonado").length,
      bares_sem_uso_7d:        result.filter((b) => b.ativo && (b.dias_sem_uso === null || b.dias_sem_uso >= 7)).length,
      bares_inadimplentes:     result.filter((b) => b.assinatura_status === "inadimplente").length,
    },
  };
}

// ─── Detalhe de um bar ────────────────────────────────────────────────────────

export async function getAdminBarDetalhe(barId: string): Promise<BarDetalhe | null> {
  const admin = createAdminClient();
  const ago7d = new Date(Date.now() - 7 * 86400000).toISOString();

  const [
    { data: bar },
    { data: ass },
    { data: membros },
    { data: turnos },
    { data: produtos },
    { data: comandas },
    { data: pagamentos },
    { data: turnos7d },
    { data: pagamentos7d },
    { data: comandas7d },
  ] = await Promise.all([
    admin.from("bars").select("*").eq("id", barId).single(),
    admin.from("assinaturas").select("id, status, trial_fim, periodo_inicio, periodo_fim, plano_id, planos(nome, preco_mensal)").eq("bar_id", barId).maybeSingle(),
    admin.from("bar_members").select("id, nome, role, ativo, created_at").eq("bar_id", barId).order("created_at"),
    admin.from("turnos").select("id, aberto_em").eq("bar_id", barId).order("aberto_em", { ascending: false }),
    admin.from("produtos").select("id, custo").eq("bar_id", barId).eq("ativo", true),
    admin.from("comandas").select("id").eq("bar_id", barId),
    admin.from("pagamentos").select("id").eq("bar_id", barId).eq("status", "confirmado"),
    admin.from("turnos").select("id").eq("bar_id", barId).gte("aberto_em", ago7d),
    admin.from("pagamentos").select("valor, taxa_servico_valor").eq("bar_id", barId).eq("status", "confirmado").gte("processado_em", ago7d),
    admin.from("comandas").select("id").eq("bar_id", barId).gte("criado_em", ago7d),
  ]);

  if (!bar) return null;

  const end          = bar.endereco as { cidade?: string; estado?: string } | null;
  const totalTurnos  = turnos?.length ?? 0;
  const ultimoTurno  = totalTurnos ? (turnos![0].aberto_em as string) : null;
  const diasSemUso   = ultimoTurno ? Math.floor((Date.now() - new Date(ultimoTurno).getTime()) / 86400000) : null;
  const totalProd    = produtos?.length ?? 0;
  const comCusto     = (produtos ?? []).filter((p) => p.custo !== null && Number(p.custo) > 0).length;
  const coberturaPct = totalProd > 0 ? Math.round((comCusto / totalProd) * 100) : 0;
  const fat7d        = (pagamentos7d ?? []).reduce((acc, p) => acc + Number(p.valor) + Number(p.taxa_servico_valor ?? 0), 0);
  const memAtivos    = (membros ?? []).filter((m) => m.ativo).length;

  type AssRow = { id: string; status: AssinaturaStatus; trial_fim: string | null; periodo_inicio: string | null; periodo_fim: string | null; plano_id: string; planos: { nome: string; preco_mensal: number } | null };
  const assTyped  = ass as AssRow | null;
  const planoData = assTyped?.planos as { nome: string; preco_mensal: number } | null | undefined;

  const detailScoreArgs = { assinatura_status: assTyped?.status ?? null, trial_fim: assTyped?.trial_fim ?? null, dias_sem_uso: diasSemUso, total_turnos: totalTurnos, cobertura_custo_pct: coberturaPct, ativo: bar.ativo };
  const healthScore         = computeHealth(detailScoreArgs);
  const healthScoreNumerico = computeScoreNumerico({ ...detailScoreArgs, total_membros: memAtivos });
  const implantacaoScore    = computeImplantacao({ total_turnos: totalTurnos, cobertura_custo_pct: coberturaPct, total_membros: memAtivos });
  const alertas             = computeAlertas(detailScoreArgs);

  return {
    id: bar.id, nome: bar.nome, slug: bar.slug,
    cnpj: bar.cnpj ?? null, telefone: bar.telefone ?? null,
    cidade: end?.cidade ?? null, estado: end?.estado ?? null,
    ativo: bar.ativo, created_at: bar.created_at,
    configuracoes: (bar.configuracoes ?? {}) as Record<string, unknown>,
    plano_id: assTyped?.plano_id ?? null,
    plano_nome: planoData?.nome ?? null, plano_preco: planoData?.preco_mensal ?? null,
    assinatura_id: assTyped?.id ?? null,
    assinatura_status: assTyped?.status ?? null, trial_fim: assTyped?.trial_fim ?? null,
    periodo_inicio: assTyped?.periodo_inicio ?? null, periodo_fim: assTyped?.periodo_fim ?? null,
    ultimo_turno_em: ultimoTurno, dias_sem_uso: diasSemUso,
    turnos_7d: turnos7d?.length ?? 0, comandas_7d: comandas7d?.length ?? 0, faturamento_7d: fat7d,
    total_turnos: totalTurnos, total_comandas: comandas?.length ?? 0, total_pagamentos: pagamentos?.length ?? 0,
    total_produtos: totalProd, total_produtos_com_custo: comCusto, cobertura_custo_pct: coberturaPct,
    healthScore, healthScoreNumerico, implantacaoScore, alertas,
    membros: (membros ?? []).map((m) => ({ id: m.id, nome: m.nome, role: m.role, ativo: m.ativo, created_at: m.created_at })),
  };
}
