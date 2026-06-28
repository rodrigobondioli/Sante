import { createAdminClient } from "@/lib/supabase/admin";
import type { Bar } from "@/types/database";

/** Busca o bar pelo kiosk_token usando service role (sem RLS).
 *  Retorna null se o token não existir ou for inválido. */
export async function getBarByKioskToken(token: string): Promise<Bar | null> {
  if (!token || token.length < 10) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("bars")
    .select("*")
    .eq("kiosk_token", token)
    .maybeSingle<Bar>();

  return data ?? null;
}

/** Regenera o kiosk_token de um bar. Invalida todos os dispositivos ativos.
 *  Retorna o novo token. */
export async function regenerarKioskToken(barId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("bars")
    .update({ kiosk_token: crypto.randomUUID() })
    .eq("id", barId)
    .select("kiosk_token")
    .maybeSingle<{ kiosk_token: string }>();

  return data?.kiosk_token ?? null;
}

/** Busca o kiosk_token atual de um bar (para gerar o link de setup). */
export async function getKioskToken(barId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("bars")
    .select("kiosk_token")
    .eq("id", barId)
    .maybeSingle<{ kiosk_token: string }>();

  return data?.kiosk_token ?? null;
}

/** Verifica o PIN de um membro. Retorna true se válido (ou se não tem PIN). */
export async function verificarPin(memberId: string, pin: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("bar_members")
    .select("pin")
    .eq("id", memberId)
    .maybeSingle<{ pin: string | null }>();

  if (!data) return false;
  // Sem PIN cadastrado → entrada livre
  if (!data.pin) return true;
  return data.pin === pin;
}
