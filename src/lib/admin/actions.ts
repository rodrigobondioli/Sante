"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAILS = (process.env.PLATFORM_ADMIN_EMAILS ?? "rodrigobondioli@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

/** Guard: verifica que o usuário atual é admin da plataforma */
async function assertAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  if (!ADMIN_EMAILS.includes(auth.user.email?.toLowerCase() ?? "")) {
    throw new Error("Acesso negado");
  }
  return auth.user;
}

// ─── Suspender bar ────────────────────────────────────────────────────────────

export async function suspenderBar(barId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  await admin.from("bars").update({ ativo: false }).eq("id", barId);
  revalidatePath("/admin");
  revalidatePath(`/admin/${barId}`);
}

// ─── Reativar bar ─────────────────────────────────────────────────────────────

export async function reativarBar(barId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  await admin.from("bars").update({ ativo: true }).eq("id", barId);
  revalidatePath("/admin");
  revalidatePath(`/admin/${barId}`);
}

// ─── Alterar status da assinatura ─────────────────────────────────────────────

export async function alterarStatusAssinatura(
  assinaturaId: string,
  status: "ativa" | "cancelada" | "trial" | "inadimplente",
  barId: string
) {
  await assertAdmin();
  const admin = createAdminClient();
  await admin
    .from("assinaturas")
    .update({ status })
    .eq("id", assinaturaId);
  revalidatePath("/admin");
  revalidatePath(`/admin/${barId}`);
}

// ─── Atualizar status de lead ─────────────────────────────────────────────────

export async function updateLeadStatus(
  id: string,
  status: string,
  notas?: string,
): Promise<{ ok: true } | { error: string }> {
  await assertAdmin();
  const admin = createAdminClient();
  const update: Record<string, string> = { status };
  if (notas !== undefined) update.notas = notas;
  const { error } = await admin.from("leads").update(update).eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
