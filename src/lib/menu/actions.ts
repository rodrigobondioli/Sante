"use server";

import { createClient } from "@/lib/supabase/server";
import type { ItemPedidoCliente } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function semTipo<T>(q: T): any { return q; }

interface SubmeterPedidoInput {
  barId: string;
  mesaId: string;
  nomeCliente: string | null;
  itens: ItemPedidoCliente[];
}

export async function submeterPedido({
  barId,
  mesaId,
  nomeCliente,
  itens,
}: SubmeterPedidoInput): Promise<string> {
  const supabase = await createClient();

  const total = itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0);

  const { data, error } = await semTipo(supabase.from("pedidos_cliente"))
    .insert({
      bar_id: barId,
      mesa_id: mesaId,
      nome_cliente: nomeCliente,
      itens,
      total,
      status: "pendente",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

export async function atualizarStatusPedido(
  pedidoId: string,
  status: "em_preparo" | "pronto" | "entregue" | "cancelado"
): Promise<void> {
  const supabase = await createClient();
  const { error } = await semTipo(supabase.from("pedidos_cliente"))
    .update({ status })
    .eq("id", pedidoId);
  if (error) throw new Error(error.message);
}
