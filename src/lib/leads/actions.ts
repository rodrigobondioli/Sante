"use server";

import { createAdminClient } from "@/lib/supabase/admin";

interface LeadPayload {
  nome_bar: string;
  cidade: string;
  tipo_bar: string;
  whatsapp: string;
  instagram?: string;
}

export async function submitLead(
  payload: LeadPayload,
): Promise<{ ok: true } | { error: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("leads").insert({
    nome_bar: payload.nome_bar.trim(),
    cidade: payload.cidade,
    tipo_bar: payload.tipo_bar,
    whatsapp: payload.whatsapp.trim(),
    instagram: payload.instagram?.trim() || null,
  });

  if (error) return { error: "Erro ao enviar pedido. Tente novamente." };
  return { ok: true };
}
