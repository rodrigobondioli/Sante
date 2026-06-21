import { getCurrentBar, getTurnoAtual, getAlertasEstoque } from "@/lib/dashboard/queries";
import { getComandasPendentes, getCaixaInsights } from "@/lib/caixa/queries";
import { getMesasComStatus } from "@/lib/bartender/queries";
import { CaixaShell } from "@/components/caixa/caixa-shell";

export default async function CaixaPage() {
  const current = await getCurrentBar();
  if (!current) return null;

  const { bar } = current;
  const turno = await getTurnoAtual(bar.id);

  // Busca paralela — mesas e alertas só se houver turno
  const [comandas, insights, mesas, alertas] = await Promise.all([
    turno ? getComandasPendentes(bar.id, turno.id) : Promise.resolve([]),
    turno ? getCaixaInsights(bar.id, turno.id)    : Promise.resolve({ totalTurno: 0, comandasPagas: 0, ticketMedio: 0, porMetodo: [] }),
    turno ? getMesasComStatus(bar.id, turno.id)   : Promise.resolve([]),
    getAlertasEstoque(bar.id),
  ]);

  return (
    <CaixaShell
      comandas={comandas}
      insights={insights}
      mesas={mesas}
      turno={turno}
      alertas={alertas}
      barNome={bar.nome}
      barId={bar.id}
      turnoId={turno?.id ?? null}
    />
  );
}
