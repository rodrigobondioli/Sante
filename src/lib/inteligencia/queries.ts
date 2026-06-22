import { createClient } from "@/lib/supabase/server";

export interface InsightPendente {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  impacto_valor: number | null;
  dado_referencia: Record<string, unknown>;
  dedupe_key: string;
  criado_em: string;
}

export async function getInsightsPendentes(barId: string): Promise<InsightPendente[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("insights")
    .select("id, tipo, titulo, descricao, impacto_valor, dado_referencia, dedupe_key, criado_em")
    .eq("bar_id", barId)
    .eq("lido", false)
    .order("criado_em", { ascending: false })
    .returns<InsightPendente[]>();

  return data ?? [];
}

export async function countInsightsPendentes(barId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("insights")
    .select("id", { count: "exact", head: true })
    .eq("bar_id", barId)
    .eq("lido", false);

  return count ?? 0;
}
