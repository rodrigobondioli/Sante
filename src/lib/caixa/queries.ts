import { createAdminClient } from "@/lib/supabase/admin";
import type { PagamentoMetodo } from "@/types/database";

export interface ComandaPendente {
  id: string;
  total: number;
  aberta_em: string;
  fechada_em: string | null;
  mesa: string; // "Mesa 3" | "Balcão"
  itens: { nome: string; quantidade: number; preco_total: number }[];
}

export interface CaixaInsights {
  totalTurno: number;
  comandasPagas: number;
  ticketMedio: number;
  porMetodo: { metodo: PagamentoMetodo; total: number; quantidade: number }[];
}

export async function getComandasPendentes(barId: string, _turnoId: string): Promise<ComandaPendente[]> {
  // Admin client: funciona em kiosk (iPad sem auth) e bypassa RLS corretamente.
  const supabase = createAdminClient();

  // Mostra todas as pendentes do bar — sem filtro de turno.
  // turno_id serve para analytics, não para filtrar o que o caixa vê.
  const { data: comandas } = await supabase.from("comandas")
    .select("id, aberta_em, fechada_em, mesa_id, mesas(numero, nome)")
    .eq("bar_id", barId)
    .eq("status", "aguardando_pagamento")
    .order("fechada_em", { ascending: true }) as {
      data: {
        id: string;
        aberta_em: string;
        fechada_em: string | null;
        mesa_id: string | null;
        mesas: { numero: number; nome: string | null } | null;
      }[] | null;
    };

  if (!comandas?.length) return [];

  // Busca itens de todas as comandas de uma vez
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
    const nomeBase = item.produtos.nome;
    const nome = item.variante_nome ? `${nomeBase} — ${item.variante_nome}` : nomeBase;
    const lista = itensPorComanda.get(item.comanda_id) ?? [];
    lista.push({ nome, quantidade: item.quantidade, preco_total: item.preco_total });
    itensPorComanda.set(item.comanda_id, lista);
  }

  return comandas.map(c => {
    const itens = itensPorComanda.get(c.id) ?? [];
    const total = itens.reduce((sum, i) => sum + i.preco_total, 0);
    return {
    id: c.id,
    total,
    aberta_em: c.aberta_em,
    fechada_em: c.fechada_em,
    mesa: c.mesas ? (c.mesas.nome ?? `Mesa ${c.mesas.numero}`) : "Balcão",
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

  const porMetodo = Array.from(mapaMetodo.entries()).map(([metodo, v]) => ({ metodo, ...v }));

  return { totalTurno, comandasPagas, ticketMedio, porMetodo };
}
