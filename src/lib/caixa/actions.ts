"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import { getOuCriarTurno } from "@/lib/dashboard/turno-actions";
import type { PagamentoMetodo } from "@/types/database";

export async function registrarPagamento(
  comandaId: string,
  metodo: PagamentoMetodo,
  incluirServico: boolean,
  motivo?: string,
) {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const turno = await getOuCriarTurno(current.bar.id, current.userId);
  if (!turno) return { error: "Erro ao iniciar turno." };

  const supabase = await createClient();

  // Atualiza status de forma atômica — elimina race condition de pagamento duplo.
  // Se dois requests chegarem ao mesmo tempo, apenas o primeiro encontra
  // status = "aguardando_pagamento"; o segundo recebe ok: false.
  const { data: rpc } = await supabase
    .rpc("marcar_comanda_paga", {
      p_comanda_id: comandaId,
      p_bar_id:     current.bar.id,
    })
    .single() as { data: { ok: boolean; total?: number } | null };

  if (!rpc?.ok) return { error: "Comanda não encontrada ou já foi paga." };

  const totalComanda = rpc.total ?? 0;

  // Taxa de serviço — lê do bar, nunca hardcode
  const taxaPct        = current.bar.configuracoes?.taxa_servico_pct ?? 10;
  const aplicarServico = incluirServico && metodo !== "cortesia";
  const servicoValor   = aplicarServico
    ? Math.round(totalComanda * (taxaPct / 100) * 100) / 100
    : null;
  const totalPago = totalComanda + (servicoValor ?? 0);

  // Insere pagamento
  await supabase.from("pagamentos").insert({
    comanda_id: comandaId,
    bar_id: current.bar.id,
    turno_id: turno.id,
    valor: totalComanda,
    taxa_servico_pct:   aplicarServico ? taxaPct : null,
    taxa_servico_valor: servicoValor,
    metodo,
    status: "confirmado",
    processado_por:           current.userId,
    processado_por_member_id: current.memberId,
    processado_em: new Date().toISOString(),
    referencia: motivo ?? null,
  });

  // Atualiza totais do turno (inclui taxa de serviço no faturado)
  await supabase.rpc("incrementar_total_turno", {
    p_turno_id: turno.id,
    p_valor: totalPago,
  });

  // Atualiza agregados do cliente (se comanda tiver cliente vinculado)
  const { data: cmdCliente } = await supabase
    .from("comandas")
    .select("cliente_id")
    .eq("id", comandaId)
    .single<{ cliente_id: string | null }>();

  if (cmdCliente?.cliente_id) {
    const cid = cmdCliente.cliente_id;
    const { data: cli } = await supabase
      .from("clientes")
      .select("total_visitas, total_gasto")
      .eq("id", cid)
      .single<{ total_visitas: number; total_gasto: number }>();

    if (cli) {
      const novoTotal    = (cli.total_gasto ?? 0) + totalComanda;
      const novasVisitas = (cli.total_visitas ?? 0) + 1;
      await supabase.from("clientes").update({
        total_visitas: novasVisitas,
        total_gasto:   novoTotal,
        ticket_medio:  Math.round((novoTotal / novasVisitas) * 100) / 100,
        ultima_visita: new Date().toISOString(),
      }).eq("id", cid);
    }
  }

  revalidatePath("/caixa");
  revalidatePath("/dashboard/caixa");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clientes");
}
