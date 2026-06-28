"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";

export async function criarCliente(dados: {
  nome: string;
  telefone?: string;
  email?: string;
  data_nascimento?: string;
  time_coracao?: string;
  notas?: string;
  identificador?: string;
}): Promise<{ id: string } | { error: string }> {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      bar_id:           current.bar.id,
      nome:             dados.nome.trim(),
      telefone:         dados.telefone?.trim() || null,
      email:            dados.email?.trim() || null,
      data_nascimento:  dados.data_nascimento || null,
      time_coracao:     dados.time_coracao?.trim() || null,
      notas:            dados.notas?.trim() || null,
      identificador:    dados.identificador?.trim() || null,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/clientes");
  return { id: data!.id };
}

export async function atualizarCliente(
  clienteId: string,
  dados: Partial<{
    nome: string;
    telefone: string;
    email: string;
    data_nascimento: string;
    time_coracao: string;
    notas: string;
    identificador: string;
  }>,
): Promise<{ ok: true } | { error: string }> {
  const current = await getCurrentBar();
  if (!current) return { error: "Não autenticado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update({
      ...dados,
      nome:          dados.nome?.trim(),
      telefone:      dados.telefone?.trim() || null,
      email:         dados.email?.trim() || null,
      time_coracao:  dados.time_coracao?.trim() || null,
      notas:         dados.notas?.trim() || null,
      identificador: dados.identificador?.trim() || null,
    })
    .eq("id", clienteId)
    .eq("bar_id", current.bar.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/clientes");
  return { ok: true };
}
