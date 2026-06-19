import { createClient } from "@/lib/supabase/server";
import type { EstoqueUnidade, MovimentoTipo } from "@/types/database";

export interface ItemEstoque {
  id: string;
  produtoId: string;
  produtoNome: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  unidade: EstoqueUnidade;
  abaixoDoMinimo: boolean;
}

export interface MovimentoEstoque {
  id: string;
  tipo: MovimentoTipo;
  quantidade: number;
  quantidadeAnterior: number;
  quantidadePosterior: number;
  motivo: string | null;
  criadoEm: string;
}

export async function getEstoque(barId: string): Promise<ItemEstoque[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("estoque")
    .select("id, produto_id, quantidade_atual, quantidade_minima, unidade, produtos(nome)")
    .eq("bar_id", barId)
    .order("quantidade_atual", { ascending: true })
    .returns<Array<{
      id: string;
      produto_id: string;
      quantidade_atual: number;
      quantidade_minima: number;
      unidade: EstoqueUnidade;
      produtos: { nome: string } | null;
    }>>();

  return (data ?? []).map((row) => ({
    id: row.id,
    produtoId: row.produto_id,
    produtoNome: row.produtos?.nome ?? "Produto",
    quantidadeAtual: Number(row.quantidade_atual),
    quantidadeMinima: Number(row.quantidade_minima),
    unidade: row.unidade,
    abaixoDoMinimo: Number(row.quantidade_atual) < Number(row.quantidade_minima),
  }));
}

export async function getMovimentosEstoque(estoqueId: string): Promise<MovimentoEstoque[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("estoque_movimentos")
    .select("id, tipo, quantidade, quantidade_anterior, quantidade_posterior, motivo, criado_em")
    .eq("referencia_id", estoqueId)
    .order("criado_em", { ascending: false })
    .limit(20)
    .returns<Array<{
      id: string;
      tipo: MovimentoTipo;
      quantidade: number;
      quantidade_anterior: number;
      quantidade_posterior: number;
      motivo: string | null;
      criado_em: string;
    }>>();

  return (data ?? []).map((row) => ({
    id: row.id,
    tipo: row.tipo,
    quantidade: Number(row.quantidade),
    quantidadeAnterior: Number(row.quantidade_anterior),
    quantidadePosterior: Number(row.quantidade_posterior),
    motivo: row.motivo,
    criadoEm: row.criado_em,
  }));
}
