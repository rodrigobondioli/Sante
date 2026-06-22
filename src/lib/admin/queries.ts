/**
 * Queries do painel admin da plataforma SUPERBAR.
 * Usa createAdminClient() (service role) — bypassa RLS.
 * Nunca expor ao cliente.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { AssinaturaStatus } from "@/types/database";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type RiskLevel = "red" | "yellow" | "ok";

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
  // Cardápio
  total_produtos: number;
  cobertura_custo_pct: number; // 0-100
  // Risco
  alertas: RiskAlert[];
}

export interface AdminStats {
  total_bares: number;
  bares_ativos: number;
  bares_trial: number;
  bares_inadimplentes: number;
  bares_sem_uso_7d: number;
  mrr: number; // soma de preco_mensal dos planos das assinaturas ativas
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
  // Alertas
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

// ─── Risk scoring ─────────────────────────────────────────────────────────────

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

  if (!ativo) {
    alerts.push({ level: "red", label: "Bar inativo" });
    return alerts;
  }

  if (assinatura_status === "inadimplente") {
    alerts.push({ level: "red", label: "Inadimplente" });
  }

  if (assinatura_status === "cancelada") {
    alerts.push({ level: "red", label: "Assinatura cancelada" });
  }

  if (assinatura_status === "trial" && trial_fim) {
    const diasRestantes = Math.ceil(
      (new Date(trial_fim).getTime() - Date.now()) / 86400000
    );
    if (diasRestantes <= 0) {
      alerts.push({ level: "red", label: "Trial expirado" });
    } else if (diasRestantes <= 3) {
      alerts.push({ level: "yellow", label: `Trial em ${diasRestantes}d` });
    }
  }

  if (total_turnos > 0 && dias_sem_uso !== null && dias_sem_uso >= 7) {
    alerts.push({ level: "red", label: `Sem uso há ${dias_sem_uso}d` });
  }

  if (cobertura_custo_pct < 40 && cobertura_custo_pct >= 0) {
    alerts.push({ level: "yellow", label: `Custo: ${cobertura_custo_pct}% preenchido` });
  }

  return alerts;
}

// ─── Lista de bares + stats globais ──────────────────────────────────────────

export async function getAdminBares(): Promise<{
  bares: BarResumo[];
  stats: AdminStats;
}> {
  const admin = createAdminClient();
  const ago7d = new Date(Date.now() - 7 * 86400000).toISOString();

  // Bares
  const { data: bares } = await admin
    .from("bares")
    .select("id, nome, slug, endereco, ativo, created_at")
    .order("created_at", { ascending: false });

  if (!bares?.length) {
    return {
      bares: [],
      stats: {
        total_bares: 0,
        bares_ativos: 0,
        bares_trial: 0,
        bares_inadimplentes: 0,
        bares_sem_uso_7d: 0,
        mrr: 0,
      },
    };
  }

  const barIds = bares.map((b) => b.id);

  // Assinaturas + planos
  const { data: assinaturas } = await admin
    .from("assinaturas")
    .select("bar_id, status, trial_fim, periodo_inicio, periodo_fim, planos(nome, preco_mensal)")
    .in("bar_id", barIds);

  // Todos os turnos (para último uso e count 7d)
  const { data: turnos } = await admin
    .from("turnos")
    .select("id, bar_id, aberto_em")
    .in("bar_id", barIds)
    .order("aberto_em", { ascending: false });

  // Produtos (para cobertura)
  const { data: produtos } = await admin
    .from("produtos")
    .select("bar_id, custo")
    .in("bar_id", barIds)
    .eq("ativo", true);

  // Pagamentos últimos 7d (faturamento)
  const { data: pagamentos7d } = await admin
    .from("pagamentos")
    .select("bar_id, valor, taxa_servico_valor")
    .in("bar_id", barIds)
    .eq("status", "confirmado")
    .gte("processado_em", ago7d);

  // Comandas últimos 7d
  const { data: comandas7d } = await admin
    .from("comandas")
    .select("bar_id, id, criado_em")
    .in("bar_id", barIds)
    .gte("criado_em", ago7d);

  // ── Indexar por bar ─────────────────────────────────────────────────────

  // Assinaturas
  type AssRow = {
    bar_id: string;
    status: AssinaturaStatus;
    trial_fim: string | null;
    periodo_inicio: string | null;
    periodo_fim: string | null;
    planos: { nome: string; preco_mensal: number } | null;
  };
  const assPorBar = new Map(
    ((assinaturas as AssRow[] | null) ?? []).map((a) => [a.bar_id, a])
  );

  // Turnos: último por bar + count todos + count 7d
  const turnosMap = new Map<
    string,
    { ultimo: string | null; total: number; total7d: number }
  >();
  for (const t of turnos ?? []) {
    const cur = turnosMap.get(t.bar_id);
    const is7d = new Date(t.aberto_em) >= new Date(ago7d);
    if (!cur) {
      turnosMap.set(t.bar_id, {
        ultimo: t.aberto_em,
        total: 1,
        total7d: is7d ? 1 : 0,
      });
    } else {
      turnosMap.set(t.bar_id, {
        ultimo: cur.ultimo, // já ordenado desc
        total: cur.total + 1,
        total7d: cur.total7d + (is7d ? 1 : 0),
      });
    }
  }

  // Produtos: total + com custo por bar
  const produtosMap = new Map<
    string,
    { total: number; comCusto: number }
  >();
  for (const p of produtos ?? []) {
    const cur = produtosMap.get(p.bar_id) ?? { total: 0, comCusto: 0 };
    produtosMap.set(p.bar_id, {
      total: cur.total + 1,
      comCusto:
        cur.comCusto + (p.custo !== null && Number(p.custo) > 0 ? 1 : 0),
    });
  }

  // Faturamento 7d por bar
  const fat7dMap = new Map<string, number>();
  for (const p of pagamentos7d ?? []) {
    const v = Number(p.valor) + Number(p.taxa_servico_valor ?? 0);
    fat7dMap.set(p.bar_id, (fat7dMap.get(p.bar_id) ?? 0) + v);
  }

  // Comandas 7d por bar
  const cmd7dMap = new Map<string, number>();
  for (const c of comandas7d ?? []) {
    cmd7dMap.set(c.bar_id, (cmd7dMap.get(c.bar_id) ?? 0) + 1);
  }

  // ── Montar lista ────────────────────────────────────────────────────────
  const result: BarResumo[] = bares.map((b) => {
    const end = b.endereco as { cidade?: string; estado?: string } | null;
    const ass = assPorBar.get(b.id);
    const t = turnosMap.get(b.id);
    const prod = produtosMap.get(b.id) ?? { total: 0, comCusto: 0 };

    const ultimoTurno = t?.ultimo ?? null;
    const diasSemUso = ultimoTurno
      ? Math.floor((Date.now() - new Date(ultimoTurno).getTime()) / 86400000)
      : null;

    const coberturaPct =
      prod.total > 0
        ? Math.round((prod.comCusto / prod.total) * 100)
        : 0;

    const planoData = ass?.planos as { nome: string; preco_mensal: number } | null | undefined;

    const alertas = computeAlertas({
      assinatura_status: ass?.status ?? null,
      trial_fim: ass?.trial_fim ?? null,
      dias_sem_uso: diasSemUso,
      total_turnos: t?.total ?? 0,
      cobertura_custo_pct: coberturaPct,
      ativo: b.ativo,
    });

    return {
      id: b.id,
      nome: b.nome,
      slug: b.slug,
      cidade: end?.cidade ?? null,
      estado: end?.estado ?? null,
      ativo: b.ativo,
      created_at: b.created_at,
      plano_nome: planoData?.nome ?? null,
      plano_preco: planoData?.preco_mensal ?? null,
      assinatura_status: ass?.status ?? null,
      trial_fim: ass?.trial_fim ?? null,
      ultimo_turno_em: ultimoTurno,
      dias_sem_uso: diasSemUso,
      turnos_7d: t?.total7d ?? 0,
      comandas_7d: cmd7dMap.get(b.id) ?? 0,
      faturamento_7d: fat7dMap.get(b.id) ?? 0,
      total_produtos: prod.total,
      cobertura_custo_pct: coberturaPct,
      alertas,
    };
  });

  // ── Stats globais ───────────────────────────────────────────────────────
  const bares_ativos = result.filter(
    (b) => b.assinatura_status === "ativa"
  ).length;
  const bares_trial = result.filter(
    (b) => b.assinatura_status === "trial"
  ).length;
  const bares_inadimplentes = result.filter(
    (b) => b.assinatura_status === "inadimplente"
  ).length;
  const bares_sem_uso_7d = result.filter(
    (b) =>
      b.ativo &&
      (b.dias_sem_uso === null || b.dias_sem_uso >= 7)
  ).length;

  const mrr = result.reduce((acc, b) => {
    if (b.assinatura_status === "ativa" && b.plano_preco) {
      return acc + b.plano_preco;
    }
    return acc;
  }, 0);

  return {
    bares: result,
    stats: {
      total_bares: result.length,
      bares_ativos,
      bares_trial,
      bares_inadimplentes,
      bares_sem_uso_7d,
      mrr,
    },
  };
}

// ─── Detalhe de um bar ────────────────────────────────────────────────────────

export async function getAdminBarDetalhe(
  barId: string
): Promise<BarDetalhe | null> {
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
    admin.from("bares").select("*").eq("id", barId).single(),
    admin
      .from("assinaturas")
      .select("id, status, trial_fim, periodo_inicio, periodo_fim, plano_id, planos(nome, preco_mensal)")
      .eq("bar_id", barId)
      .maybeSingle(),
    admin
      .from("bar_members")
      .select("id, nome, role, ativo, created_at")
      .eq("bar_id", barId)
      .order("created_at"),
    admin
      .from("turnos")
      .select("id, aberto_em")
      .eq("bar_id", barId)
      .order("aberto_em", { ascending: false }),
    admin
      .from("produtos")
      .select("id, custo")
      .eq("bar_id", barId)
      .eq("ativo", true),
    admin
      .from("comandas")
      .select("id")
      .eq("bar_id", barId),
    admin
      .from("pagamentos")
      .select("id")
      .eq("bar_id", barId)
      .eq("status", "confirmado"),
    admin
      .from("turnos")
      .select("id")
      .eq("bar_id", barId)
      .gte("aberto_em", ago7d),
    admin
      .from("pagamentos")
      .select("valor, taxa_servico_valor")
      .eq("bar_id", barId)
      .eq("status", "confirmado")
      .gte("processado_em", ago7d),
    admin
      .from("comandas")
      .select("id")
      .eq("bar_id", barId)
      .gte("criado_em", ago7d),
  ]);

  if (!bar) return null;

  const end = bar.endereco as { cidade?: string; estado?: string } | null;
  const totalTurnos = turnos?.length ?? 0;
  const ultimoTurno =
    turnos?.length ? (turnos[0].aberto_em as string) : null;
  const diasSemUso = ultimoTurno
    ? Math.floor((Date.now() - new Date(ultimoTurno).getTime()) / 86400000)
    : null;

  const totalProdutos = produtos?.length ?? 0;
  const produtosComCusto = (produtos ?? []).filter(
    (p) => p.custo !== null && Number(p.custo) > 0
  ).length;
  const coberturaPct =
    totalProdutos > 0
      ? Math.round((produtosComCusto / totalProdutos) * 100)
      : 0;

  const fat7d = (pagamentos7d ?? []).reduce(
    (acc, p) => acc + Number(p.valor) + Number(p.taxa_servico_valor ?? 0),
    0
  );

  type AssRow = {
    id: string;
    status: AssinaturaStatus;
    trial_fim: string | null;
    periodo_inicio: string | null;
    periodo_fim: string | null;
    plano_id: string;
    planos: { nome: string; preco_mensal: number } | null;
  };
  const assTyped = ass as AssRow | null;
  const planoData = assTyped?.planos as
    | { nome: string; preco_mensal: number }
    | null
    | undefined;

  const alertas = computeAlertas({
    assinatura_status: assTyped?.status ?? null,
    trial_fim: assTyped?.trial_fim ?? null,
    dias_sem_uso: diasSemUso,
    total_turnos: totalTurnos,
    cobertura_custo_pct: coberturaPct,
    ativo: bar.ativo,
  });

  return {
    id: bar.id,
    nome: bar.nome,
    slug: bar.slug,
    cnpj: bar.cnpj ?? null,
    telefone: bar.telefone ?? null,
    cidade: end?.cidade ?? null,
    estado: end?.estado ?? null,
    ativo: bar.ativo,
    created_at: bar.created_at,
    configuracoes: (bar.configuracoes ?? {}) as Record<string, unknown>,
    plano_id: assTyped?.plano_id ?? null,
    plano_nome: planoData?.nome ?? null,
    plano_preco: planoData?.preco_mensal ?? null,
    assinatura_id: assTyped?.id ?? null,
    assinatura_status: assTyped?.status ?? null,
    trial_fim: assTyped?.trial_fim ?? null,
    periodo_inicio: assTyped?.periodo_inicio ?? null,
    periodo_fim: assTyped?.periodo_fim ?? null,
    ultimo_turno_em: ultimoTurno,
    dias_sem_uso: diasSemUso,
    turnos_7d: turnos7d?.length ?? 0,
    comandas_7d: comandas7d?.length ?? 0,
    faturamento_7d: fat7d,
    total_turnos: totalTurnos,
    total_comandas: comandas?.length ?? 0,
    total_pagamentos: pagamentos?.length ?? 0,
    total_produtos: totalProdutos,
    total_produtos_com_custo: produtosComCusto,
    cobertura_custo_pct: coberturaPct,
    alertas,
    membros: (membros ?? []).map((m) => ({
      id: m.id,
      nome: m.nome,
      role: m.role,
      ativo: m.ativo,
      created_at: m.created_at,
    })),
  };
}
