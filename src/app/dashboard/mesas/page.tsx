import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { MesasClient } from "@/components/mesas/mesas-client";
import { createClient } from "@/lib/supabase/server";
import type { Mesa } from "@/types/database";

export default async function MesasPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const supabase = await createClient();
  const { data: mesas } = await supabase
    .from("mesas")
    .select("*")
    .eq("bar_id", current.bar.id)
    .eq("ativo", true)
    .order("numero", { ascending: true })
    .returns<Mesa[]>();

  return (
    <div style={{ padding: "32px 40px", maxWidth: 700 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "white", margin: 0 }}>Mesas</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: "6px 0 0" }}>
          Configure as mesas e posições do seu bar. O bartender vai ver exatamente essas opções.
        </p>
      </div>
      <MesasClient mesas={mesas ?? []} barId={current.bar.id} />
    </div>
  );
}
