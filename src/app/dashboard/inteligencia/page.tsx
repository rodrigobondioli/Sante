import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getInsightsPendentes } from "@/lib/inteligencia/queries";
import { InsightCards } from "@/components/inteligencia/insight-cards";
import { H1, SUBTITLE } from "@/lib/ui";

export default async function InteligenciaPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const insights = await getInsightsPendentes(current.bar.id);

  return (
    <div className="py-6 lg:px-10 lg:py-8">

      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={H1}>Inteligência</h1>
        <p style={SUBTITLE}>O que precisa da sua atenção</p>
      </div>

      {/* ── Cards ── */}
      <div className="max-w-2xl">
        <InsightCards insights={insights} />
      </div>

    </div>
  );
}
