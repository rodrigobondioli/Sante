import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import type { Cliente } from "@/types/database";

// ─── Lista completa ────────────────────────────────────────────────────────────
export async function listarClientes(): Promise<Cliente[]> {
  const current = await getCurrentBar();
  if (!current) return [];

  const { data } = await supabase_clientes_query(current.bar.id);
  return data ?? [];
}

async function supabase_clientes_query(barId: string) {
  const supabase = await createClient();
  return supabase
    .from("clientes")
    .select("*")
    .eq("bar_id", barId)
    .order("total_gasto", { ascending: false });
}

// ─── Aniversariantes do mês ────────────────────────────────────────────────────
export async function getAniversariantesDoMes(): Promise<Cliente[]> {
  const current = await getCurrentBar();
  if (!current) return [];

  const mes = new Date().getMonth() + 1; // 1-12
  const supabase = await createClient();

  // EXTRACT(MONTH FROM data_nascimento) = mes atual
  const { data } = await supabase
    .from("clientes")
    .select("*")
    .eq("bar_id", current.bar.id)
    .not("data_nascimento", "is", null)
    .order("data_nascimento");

  // Filtra client-side pelo mês (Supabase não tem EXTRACT direto no client SDK)
  return (data ?? []).filter(c => {
    if (!c.data_nascimento) return false;
    const m = new Date(c.data_nascimento + "T12:00:00").getMonth() + 1;
    return m === mes;
  });
}

// ─── Clientes inativos ────────────────────────────────────────────────────────
export async function getClientesInativos(dias = 30): Promise<Cliente[]> {
  const current = await getCurrentBar();
  if (!current) return [];

  const corte = new Date();
  corte.setDate(corte.getDate() - dias);

  const supabase = await createClient();
  const { data } = await supabase
    .from("clientes")
    .select("*")
    .eq("bar_id", current.bar.id)
    .not("ultima_visita", "is", null)
    .lt("ultima_visita", corte.toISOString())
    .order("total_gasto", { ascending: false });

  return data ?? [];
}

// ─── Top clientes por gasto ────────────────────────────────────────────────────
export async function getClientesVip(top = 10): Promise<Cliente[]> {
  const current = await getCurrentBar();
  if (!current) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("clientes")
    .select("*")
    .eq("bar_id", current.bar.id)
    .gt("total_gasto", 0)
    .order("total_gasto", { ascending: false })
    .limit(top);

  return data ?? [];
}

// ─── Stats rápidos para cards ─────────────────────────────────────────────────
export async function getClientesStats() {
  const current = await getCurrentBar();
  if (!current) return null;

  const supabase = await createClient();
  const { data: todos } = await supabase
    .from("clientes")
    .select("total_gasto, ticket_medio, ultima_visita, data_nascimento")
    .eq("bar_id", current.bar.id);

  if (!todos?.length) return { total: 0, aniversariantes: 0, inativos: 0, ticketMedio: 0 };

  const mes = new Date().getMonth() + 1;
  const corte = new Date();
  corte.setDate(corte.getDate() - 30);

  const aniversariantes = todos.filter(c => {
    if (!c.data_nascimento) return false;
    return new Date(c.data_nascimento + "T12:00:00").getMonth() + 1 === mes;
  }).length;

  const inativos = todos.filter(c =>
    c.ultima_visita && new Date(c.ultima_visita) < corte
  ).length;

  const comGasto = todos.filter(c => c.ticket_medio);
  const ticketMedio = comGasto.length
    ? comGasto.reduce((s, c) => s + (c.ticket_medio ?? 0), 0) / comGasto.length
    : 0;

  return {
    total: todos.length,
    aniversariantes,
    inativos,
    ticketMedio: Math.round(ticketMedio * 100) / 100,
  };
}
