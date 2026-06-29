import { getCurrentBar } from "@/lib/dashboard/queries";
import { getOuCriarTurno } from "@/lib/dashboard/turno-actions";
import { getComandasPendentes, getCaixaInsights } from "@/lib/caixa/queries";
import { CaixaTela } from "@/components/caixa/caixa-tela";
import { TurnoControles } from "@/components/dashboard/turno-controles";

export const dynamic = "force-dynamic";

export default async function CaixaPage() {
  const current = await getCurrentBar();
  if (!current) return null;

  const taxaServicoPct = current.bar.configuracoes?.taxa_servico_pct ?? 10;
  const turno = await getOuCriarTurno(current.bar.id, current.userId);

  if (!turno) {
    return (
      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--danger)", margin: "0 0 16px" }}>
            Erro ao inicializar turno. Tente recarregar a página.
          </p>
          <TurnoControles turnoAtual={null} />
        </div>
      </div>
    );
  }

  const [comandas, insights] = await Promise.all([
    getComandasPendentes(current.bar.id, turno.id),
    getCaixaInsights(current.bar.id, turno.id),
  ]);

  return (
    <CaixaTela
      comandas={comandas}
      insights={insights}
      barNome={current.bar.nome}
      barId={current.bar.id}
      turnoId={turno.id}
      taxaServicoPct={taxaServicoPct}
      embedded
    />
  );
}
