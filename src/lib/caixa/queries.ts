import { createAdminClient } from "@/lib/supabase/admin";
import type { PagamentoMetodo } from "@/types/database";

export interface ComandaPendente {
  id: string;
  total: number;
  aberta_em: string;
  fechada_em: string | null;
  mesa: string;
  mesa_id: string | null;
  nome_cliente: string | null;
  total_pessoas: number | null;
  garcom_nome: string | null;
  garcom_foto: string | null;
  itens: { nome: string; quantidade: number; preco_total: number }[];
}

export interface CaixaInsights {
  totalTurno: number;
  comandasPagas: number;
  ticketMedio: number;
  porMetodo: { metodo: PagamentoMetodo; total: number; quantidade: number }[];
}

export async function getComandasPendentes(barId: string, _turnoId: string): Promise<ComandaPendente[]> {
  const supabase = createAdminClient();

  const { data: comandas } = await supabase.from("comandas")
    .select(`
      id, aberta_em, fechada_em, mesa_id, nome_cliente, total_pessoas,
      mesas(numero, nome),
      aberta_por_member:bar_members!aberta_por_member_id(nome, foto_url)
    `)
    .eq("bar_id", barId)
    .eq("status", "aguardando_pagamento")
    .order("fechada_em", { ascending: true }) as {
      data: {
        id: string;
        aberta_em: string;
        fechada_em: string | null;
        mesa_id: string | null;
        nome_cliente: string | null;
        total_pessoas: number | null;
        mesas: { numero: number; nome: string | null } | null;
        aberta_por_member: { nome: string | null; foto_url: string | null } | null;
      }[] | null;
    };

  if (!comandas?.length) return [];

  const ids = comandas.map(c => c.id);
  const { data: itensRaw } = await supabase.from("comanda_items")
    .select("comanda_id, quantidade, preco_total, variante_nome, produtos(nome)")
    .in("comanda_id", ids)
    .eq("status", "ativo") as {
      data: {
        comanda_id: string;
        quantidade: number;
        preco_total: number;
        variante_nome: string | null;
        produtos: { nome: string } | null;
      }[] | null;
    };

  const itensPorComanda = new Map<string, ComandaPendente["itens"]>();
  for (const item of itensRaw ?? []) {
    if (!item.produtos) continue;
    const nome = item.variante_nome ? `${item.produtos.nome} — ${item.variante_nome}` : item.produtos.nome;
    const lista = itensPorComanda.get(item.comanda_id) ?? [];
    lista.push({ nome, quantidade: item.quantidade, preco_total: item.preco_total });
    itensPorComanda.set(item.comanda_id, lista);
  }

  return comandas.map(c => {
    const itens = itensPorComanda.get(c.id) ?? [];
    const total = itens.reduce((sum, i) => sum + i.preco_total, 0);
    return {
      id: c.id, total, aberta_em: c.aberta_em, fechada_em: c.fechada_em ?? null,
      mesa_id: c.mesa_id,
      mesa: c.mesas ? (c.mesas.nome ?? `Mesa ${c.mesas.numero}`) : "Balcão",
      nome_cliente: c.nome_cliente ?? null,
      total_pessoas: c.total_pessoas ?? null,
      garcom_nome: c.aberta_por_member?.nome ?? null,
      garcom_foto: c.aberta_por_member?.foto_url ?? null,
      itens,
    };
  });
}

export async function getCaixaInsights(barId: string, turnoId: string): Promise<CaixaInsights> {
  const supabase = createAdminClient();

  const { data: pagamentos } = await supabase.from("pagamentos")
    .select("valor, metodo")
    .eq("bar_id", barId)
    .eq("turno_id", turnoId)
    .eq("status", "confirmado") as {
      data: { valor: number; metodo: PagamentoMetodo }[] | null;
    };

  const lista = pagamentos ?? [];
  const totalTurno = lista.reduce((s, p) => s + p.valor, 0);
  const comandasPagas = lista.length;
  const ticketMedio = comandasPagas > 0 ? totalTurno / comandasPagas : 0;

  const mapaMetodo = new Map<PagamentoMetodo, { total: number; quantidade: number }>();
  for (const p of lista) {
    const atual = mapaMetodo.get(p.metodo) ?? { total: 0, quantidade: 0 };
    mapaMetodo.set(p.metodo, { total: atual.total + p.valor, quantidade: atual.quantidade + 1 });
  }

  return {
    totalTurno, comandasPagas, ticketMedio,
    porMetodo: Array.from(mapaMetodo.entries()).map(([metodo, v]) => ({ metodo, ...v })),
  };
}
