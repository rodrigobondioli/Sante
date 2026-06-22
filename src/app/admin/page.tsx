import { getAdminBares } from "@/lib/admin/queries";
import type { RiskAlert } from "@/lib/admin/queries";
import type { AssinaturaStatus } from "@/types/database";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<AssinaturaStatus, string> = {
  trial:        "#3b82f6",
  ativa:        "var(--ok)",
  cancelada:    "var(--fg-subtle)",
  inadimplente: "#ef4444",
};

const STATUS_LABEL: Record<AssinaturaStatus, string> = {
  trial:        "Trial",
  ativa:        "Ativa",
  cancelada:    "Cancelada",
  inadimplente: "Inadimpl.",
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function relativeDate(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}m`;
}

function AlertBadges({ alertas }: { alertas: RiskAlert[] }) {
  if (!alertas.length) return <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>—</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {alertas.map((a, i) => (
        <span
          key={i}
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 2,
            background: a.level === "red" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
            color: a.level === "red" ? "#ef4444" : "#f59e0b",
            whiteSpace: "nowrap",
          }}
        >
          {a.level === "red" ? "🔴" : "🟡"} {a.label}
        </span>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const { bares, stats } = await getAdminBares();

  const overline: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--fg-subtle)",
    margin: "0 0 4px",
  };

  const statCard: React.CSSProperties = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "14px 18px",
  };

  const th: React.CSSProperties = {
    padding: "8px 12px",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "var(--fg-subtle)",
    textAlign: "left" as const,
    borderBottom: "1px solid var(--border)",
    whiteSpace: "nowrap" as const,
    background: "var(--bg)",
  };

  const td: React.CSSProperties = {
    padding: "11px 12px",
    borderBottom: "1px solid var(--border)",
    fontSize: 13,
    color: "var(--fg)",
    verticalAlign: "middle",
  };

  const tdMuted: React.CSSProperties = {
    ...td,
    color: "var(--fg-muted)",
  };

  const tdMono: React.CSSProperties = {
    ...tdMuted,
    fontFamily: "var(--font-mono)",
    textAlign: "right",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--fg)",
            margin: "0 0 4px",
            letterSpacing: "-0.02em",
          }}
        >
          Clientes
        </h1>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
          {stats.total_bares} bar{stats.total_bares !== 1 ? "es" : ""} cadastrado
          {stats.total_bares !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stats — cockpit top */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 10,
        }}
      >
        {/* MRR */}
        <div style={{ ...statCard, borderLeft: "3px solid var(--accent)" }}>
          <p style={overline}>MRR</p>
          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--accent)",
              fontFamily: "var(--font-mono)",
              margin: "0 0 2px",
              letterSpacing: "-0.02em",
            }}
          >
            {currency.format(stats.mrr)}
          </p>
          <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
            {stats.bares_ativos} ativo{stats.bares_ativos !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Trial */}
        <div style={statCard}>
          <p style={overline}>Trial</p>
          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#3b82f6",
              fontFamily: "var(--font-mono)",
              margin: 0,
            }}
          >
            {stats.bares_trial}
          </p>
        </div>

        {/* Inadimplentes */}
        <div
          style={{
            ...statCard,
            ...(stats.bares_inadimplentes > 0
              ? { borderLeft: "3px solid #ef4444" }
              : {}),
          }}
        >
          <p style={overline}>Inadimplentes</p>
          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: stats.bares_inadimplentes > 0 ? "#ef4444" : "var(--fg-muted)",
              fontFamily: "var(--font-mono)",
              margin: 0,
            }}
          >
            {stats.bares_inadimplentes}
          </p>
        </div>

        {/* Sem uso 7d */}
        <div
          style={{
            ...statCard,
            ...(stats.bares_sem_uso_7d > 0
              ? { borderLeft: "3px solid #f59e0b" }
              : {}),
          }}
        >
          <p style={overline}>Sem uso 7d</p>
          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: stats.bares_sem_uso_7d > 0 ? "#f59e0b" : "var(--fg-muted)",
              fontFamily: "var(--font-mono)",
              margin: 0,
            }}
          >
            {stats.bares_sem_uso_7d}
          </p>
        </div>
      </div>

      {/* Tabela */}
      {bares.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--fg-muted)" }}>
          Nenhum bar cadastrado ainda.
        </p>
      ) : (
        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            overflow: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr>
                <th style={th}>Bar</th>
                <th style={th}>Plano</th>
                <th style={th}>Último uso</th>
                <th style={{ ...th, textAlign: "right" }}>Turnos 7d</th>
                <th style={{ ...th, textAlign: "right" }}>Faturamento 7d</th>
                <th style={{ ...th, textAlign: "right" }}>Comandas 7d</th>
                <th style={{ ...th, textAlign: "right" }}>Custo</th>
                <th style={th}>Alertas</th>
                <th style={{ ...th, textAlign: "center" }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {bares.map((bar) => {
                const topAlert = bar.alertas[0];
                const rowStyle: React.CSSProperties =
                  topAlert?.level === "red"
                    ? { background: "rgba(239,68,68,0.03)" }
                    : {};

                return (
                  <tr key={bar.id} style={rowStyle}>
                    {/* Bar */}
                    <td style={td}>
                      <a
                        href={`/admin/${bar.id}`}
                        style={{
                          color: "var(--fg)",
                          textDecoration: "none",
                          fontWeight: 600,
                        }}
                      >
                        {bar.nome}
                      </a>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--fg-subtle)",
                          display: "block",
                        }}
                      >
                        {bar.cidade ?? bar.slug}
                      </span>
                    </td>

                    {/* Plano/status */}
                    <td style={td}>
                      {bar.assinatura_status ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: STATUS_COLOR[bar.assinatura_status],
                            letterSpacing: "0.06em",
                          }}
                        >
                          {STATUS_LABEL[bar.assinatura_status]}
                        </span>
                      ) : (
                        <span style={{ color: "var(--fg-subtle)", fontSize: 11 }}>—</span>
                      )}
                      {bar.plano_nome && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "var(--fg-subtle)",
                            display: "block",
                          }}
                        >
                          {bar.plano_nome}
                        </span>
                      )}
                    </td>

                    {/* Último uso */}
                    <td style={tdMuted}>
                      {relativeDate(bar.ultimo_turno_em)}
                    </td>

                    {/* Turnos 7d */}
                    <td style={tdMono}>{bar.turnos_7d || "—"}</td>

                    {/* Faturamento 7d */}
                    <td style={tdMono}>
                      {bar.faturamento_7d > 0
                        ? currency.format(bar.faturamento_7d)
                        : "—"}
                    </td>

                    {/* Comandas 7d */}
                    <td style={tdMono}>{bar.comandas_7d || "—"}</td>

                    {/* Cobertura custo */}
                    <td style={{ ...tdMono, color: bar.cobertura_custo_pct < 40 ? "#f59e0b" : "var(--fg-muted)" }}>
                      {bar.total_produtos > 0
                        ? `${bar.cobertura_custo_pct}%`
                        : "—"}
                    </td>

                    {/* Alertas */}
                    <td style={td}>
                      <AlertBadges alertas={bar.alertas} />
                    </td>

                    {/* Ações */}
                    <td style={{ ...td, textAlign: "center" }}>
                      <a
                        href={`/admin/${bar.id}`}
                        style={{
                          fontSize: 11,
                          color: "var(--accent)",
                          textDecoration: "none",
                          fontWeight: 600,
                          padding: "3px 8px",
                          border: "1px solid var(--accent)",
                          borderRadius: 3,
                        }}
                      >
                        Ver
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
