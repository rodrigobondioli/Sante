import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentBar, getTurnoAtual } from "@/lib/dashboard/queries";
import { getMesasComStatus, getComandaBalcao } from "@/lib/bartender/queries";
import { abrirComanda } from "@/lib/bartender/actions";
import { FilaPedidos } from "@/components/bartender/fila-pedidos";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function tempoAberta(abertaEm: string) {
  const diff = Math.floor((Date.now() - new Date(abertaEm).getTime()) / 60000);
  if (diff < 1) return "agora";
  if (diff < 60) return `${diff}min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

export default async function BartenderPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const turno = await getTurnoAtual(current.bar.id);
  if (!turno) {
    return (
      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 32, maxWidth: 400, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            Nenhum turno aberto. Peça para o gerente abrir o turno.
          </p>
        </div>
      </div>
    );
  }

  const [mesas, comandaBalcao] = await Promise.all([
    getMesasComStatus(current.bar.id, turno.id),
    getComandaBalcao(current.bar.id, turno.id),
  ]);

  const totalOcupadas = mesas.filter(m => m.comanda !== null).length + (comandaBalcao ? 1 : 0);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* ── Coluna esquerda: Fila de pedidos ── */}
      <div style={{
        width: 360, flexShrink: 0,
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        <div style={{ padding: "20px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>
            Fila de pedidos
          </p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "white", margin: "4px 0 0" }}>
            Tempo real
          </p>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 24px" }}>
          <FilaPedidos barId={current.bar.id} />
        </div>
      </div>

      {/* ── Coluna direita: Mesas ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
          Selecione uma mesa
        </p>
        <p style={{ fontSize: 20, fontWeight: 600, color: "white", margin: "4px 0 0" }}>
          {totalOcupadas === 0
            ? "Todas as mesas livres"
            : `${totalOcupadas} mesa${totalOcupadas > 1 ? "s" : ""} ocupada${totalOcupadas > 1 ? "s" : ""}`}
        </p>
      </div>

      {mesas.length === 0 && (
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "28px 20px", textAlign: "center", marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.40)", margin: 0 }}>
            Nenhuma mesa cadastrada.
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: "8px 0 0" }}>
            Configure as mesas em Dashboard → Mesas.
          </p>
        </div>
      )}

      {/* Mesa grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 12,
        marginBottom: 12,
      }}>
        {mesas.map(({ mesa, comanda }) => {
          const label = mesa.nome ?? `Mesa ${mesa.numero}`;
          const ocupada = comanda !== null;

          if (ocupada) {
            return (
              <Link
                key={mesa.id}
                href={`/bartender/${comanda!.id}`}
                style={{
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  background: "rgba(38,0,120,0.25)",
                  border: "1px solid rgba(124,58,237,0.30)",
                  borderRadius: 14, padding: "16px 16px 14px",
                  textDecoration: "none", minHeight: 110,
                  transition: "background 0.15s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{label}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99,
                    background: "rgba(74,222,128,0.15)", color: "rgba(74,222,128,0.9)",
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>Aberta</span>
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "white", margin: 0, fontVariantNumeric: "tabular-nums" }}>
                    {currency.format(comanda!.total)}
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", margin: "3px 0 0" }}>
                    {tempoAberta(comanda!.aberta_em)}
                  </p>
                </div>
              </Link>
            );
          }

          return (
            <form key={mesa.id} action={abrirComanda.bind(null, mesa.id)}>
              <button
                type="submit"
                style={{
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  width: "100%", minHeight: 110,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14, padding: "16px 16px 14px",
                  textAlign: "left", cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{label}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.30)" }}>
                  {mesa.capacidade ? `${mesa.capacidade} lugares` : "Livre"}
                </span>
              </button>
            </form>
          );
        })}

        {/* Balcão — always present */}
        {(() => {
          if (comandaBalcao) {
            return (
              <Link
                href={`/bartender/${comandaBalcao.id}`}
                style={{
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  background: "rgba(38,0,120,0.25)",
                  border: "1px solid rgba(124,58,237,0.30)",
                  borderRadius: 14, padding: "16px 16px 14px",
                  textDecoration: "none", minHeight: 110,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "white" }}>Balcão</span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99,
                    background: "rgba(74,222,128,0.15)", color: "rgba(74,222,128,0.9)",
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>Aberta</span>
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "white", margin: 0, fontVariantNumeric: "tabular-nums" }}>
                    {currency.format(comandaBalcao.total)}
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", margin: "3px 0 0" }}>
                    {tempoAberta(comandaBalcao.aberta_em)}
                  </p>
                </div>
              </Link>
            );
          }

          return (
            <form action={abrirComanda.bind(null, null)}>
              <button
                type="submit"
                style={{
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  width: "100%", minHeight: 110,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14, padding: "16px 16px 14px",
                  textAlign: "left", cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>Balcão</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.30)" }}>Livre</span>
              </button>
            </form>
          );
        })()}
      </div>

      </div> {/* fim coluna direita */}
    </div>
  );
}
