import Link from "next/link";
import { notFound } from "next/navigation";
import { getTurnoDetalhe, getComandasDoTurno } from "@/lib/dashboard/turnos";
import type { ComandaStatus } from "@/types/database";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const sectionLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "rgba(255,255,255,0.38)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  margin: 0,
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  borderRadius: "12px",
  padding: "24px",
};

const statusConfig: Record<ComandaStatus, { bg: string; color: string; label: string }> = {
  aberta:                { bg: "rgba(74,222,128,0.12)",  color: "rgba(74,222,128,0.9)",    label: "Aberta" },
  aguardando_pagamento:  { bg: "rgba(251,191,36,0.12)",  color: "rgba(251,191,36,0.9)",    label: "Aguardando pagamento" },
  paga:                  { bg: "rgba(255,255,255,0.07)",  color: "rgba(255,255,255,0.45)",  label: "Paga" },
  cancelada:             { bg: "rgba(239,68,68,0.12)",   color: "rgba(239,68,68,0.85)",    label: "Cancelada" },
};

export default async function TurnoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const turno = await getTurnoDetalhe(id);
  if (!turno) notFound();

  const comandas = await getComandasDoTurno(turno.id);

  const isAberto = turno.status === "aberto";

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "32px", gap: "24px" }}>

      {/* Header */}
      <div>
        <Link href="/dashboard/turnos" style={{
          fontSize: "13px",
          color: "rgba(255,255,255,0.38)",
          textDecoration: "none",
          display: "inline-block",
          marginBottom: "12px",
        }}>
          ← Turnos
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#ffffff", margin: 0 }}>
            Turno de {dataHora.format(new Date(turno.abertoEm))}
          </h1>
          <span style={{
            fontSize: "11px",
            fontWeight: 500,
            padding: "3px 10px",
            borderRadius: "99px",
            background: isAberto ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.07)",
            color: isAberto ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.45)",
          }}>
            {isAberto ? "Aberto" : "Fechado"}
          </span>
        </div>

        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.40)", margin: "6px 0 0" }}>
          Aberto por {turno.abertoPorNome}
          {turno.fechadoPorNome && <> · Fechado por {turno.fechadoPorNome}</>}
          {turno.fechadoEm && <> · {dataHora.format(new Date(turno.fechadoEm))}</>}
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={card}>
          <p style={sectionLabel}>Faturamento do turno</p>
          <p style={{ fontSize: "30px", fontWeight: 600, color: "#ffffff", margin: "10px 0 0", fontFamily: "monospace" }}>
            {currency.format(turno.totalVendas)}
          </p>
        </div>
        <div style={card}>
          <p style={sectionLabel}>Comandas pagas</p>
          <p style={{ fontSize: "30px", fontWeight: 600, color: "#ffffff", margin: "10px 0 0" }}>
            {turno.totalComandas}
          </p>
        </div>
      </div>

      {/* Comandas card */}
      <div style={card}>
        <h2 style={{ fontSize: "14px", fontWeight: 500, color: "rgba(255,255,255,0.85)", margin: "0 0 16px" }}>
          Comandas
        </h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" }}>
          {comandas.map((comanda, i) => {
            const cfg = statusConfig[comanda.status];
            return (
              <li key={comanda.id} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 8px",
                background: i % 2 === 1 ? "rgba(255,255,255,0.02)" : undefined,
              }}>
                <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)" }}>
                  {comanda.identificador ?? "Sem identificação"}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.50)", fontFamily: "monospace" }}>
                    {currency.format(comanda.total)}
                  </span>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "3px 10px",
                    borderRadius: "99px",
                    background: cfg.bg,
                    color: cfg.color,
                    whiteSpace: "nowrap",
                  }}>
                    {cfg.label}
                  </span>
                </div>
              </li>
            );
          })}
          {comandas.length === 0 && (
            <li style={{ fontSize: "14px", color: "rgba(255,255,255,0.35)", padding: "12px 8px" }}>
              Nenhuma comanda neste turno.
            </li>
          )}
        </ul>
      </div>

    </div>
  );
}
