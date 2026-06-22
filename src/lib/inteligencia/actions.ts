"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";

export async function marcarInsightLido(
  insightId: string,
): Promise<{ ok: true } | { error: string }> {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("insights")
    .update({ lido: true })
    .eq("id", insightId)
    .eq("bar_id", current.bar.id); // garante que só marca insight do próprio bar

  if (error) return { error: error.message };

  revalidatePath("/dashboard/inteligencia");
  revalidatePath("/dashboard"); // revalida layout para atualizar badge
  return { ok: true };
}
