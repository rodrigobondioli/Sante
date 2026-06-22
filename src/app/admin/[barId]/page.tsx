import { notFound } from "next/navigation";
import { getAdminBarDetalhe } from "@/lib/admin/queries";
import type { RiskAlert } from "@/lib/admin/queries";
import type { AssinaturaStatus } from "@/types/database";
import { suspenderBar, reativarBar, alterarStatusAssinatura } from "@/lib/admin/actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<AssinaturaStatus, string> = {
  trial:        "Trial",
  ativa:        "Ativa",
  cancelada:    "Cancelada",
  inadimplente: "Inadimplente",
};

const STATUS_COLOR: Record<AssinaturaStatus, string> = {
  trial:        "#3b82f6",
  ativa:        "var(--ok)",
  cancelada:    "var(--fg-subtle)",
  inadimplente: "#ef4444",
};

const ROLE_LABEL: Record<string, string> = {
  dono:        "Dono",
  gerente:     "Gerente",
  bartender:   "Bartender",
  caixa:       "Caixa",
  bar_manager: "Gerente",
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Estilos compartilhados ───────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "20px 24px",
};

const overline: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--fg-subtle)",
  margin: "0 0 4px",
};

const sectionLabel: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--fg-subtle)",
  marginBottom: 12,
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatMini({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div style={card}>
      <p style={overline}>{label}</p>
      <p
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: valueColor ?? "var(--fg)",
          fontFamily: "var(--font-mono)",
          margin: "0 0 2px",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function AlertRow({ alertas }: { alertas: RiskAlert[] }) {
  if (!alertas.length)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 0",
        }}
      >
        <span style={{ color: "var(--ok)", fontSize: 13 }}>✓</span>
        <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
          Sem alertas de risco
        </span>
      </div>
    );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {alertas.map((a, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            borderRadius: 3,
            background:
              a.level === "red"
                ? "rgba(239,68,68,0.08)"
                : "rgba(245,158,11,0.08)",
            border: `1px solid ${
              a.level === "red"
                ? "rgba(239,68,68,0.2)"
                : "rgba(245,158,11,0.2)"
            }`,
          }}
        >
          <span style={{ fontSize: 13 }}>
            {a.level === "red" ? "🔴" : "🟡"}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: a.level === "red" ? "#ef4444" : "#f59e0b",
            }}
          >
            {a.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminBarPage({
  params,
}: {
  params: Promise<{ barId: string }>;
}) {
  const { barId } = await params;
  const bar = await getAdminBarDetalhe(barId);
  if (!bar) notFound();

  const coberturaBgColor =
    bar.cobertura_custo_pct >= 80
      ? "var(--ok)"
      : bar.cobertura_custo_pct >= 40
      ? "#f59e0b"
      : "#ef4444";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Breadcrumb */}
      <a
        href="/admin"
        style={{ fontSize: 13, color: "var(--fg-muted)", textDecoration: "none" }}
      >
        ← Clientes
      </a>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 20,
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
            }}
          >
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--fg)",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              {bar.nome}
            </h1>
            {!bar.ativo && (
              <span
                style={{
                  fontSize: 9,
                  background: "rgba(239,68,68,0.15)",
                  color: "#ef4444",
                  borderRadius: 2,
                  padding: "2px 7px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                }}
              >
                SUSPENSO
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: "0 0 3px" }}>
            /{bar.slug}
            {(bar.cidade || bar.estado) && (
              <> · {[bar.cidade, bar.estado].filter(Boolean).join(", ")}</>
            )}
            {bar.telefone && <> · {bar.telefone}</>}
          </p>
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0 }}>
            Cadastrado em {shortDate(bar.created_at)}
            {bar.cnpj && ` · CNPJ ${bar.cnpj}`}
          </p>
        </div>
      </div>

      {/* ── Saúde do cliente ─────────────────────────────────────────────── */}
      <section>
        <p style={sectionLabel}>Saúde do cliente</p>

        {/* Alertas */}
        <div style={{ ...card, marginBottom: 14 }}>
          <AlertRow alertas={bar.alertas} />
        </div>

        {/* Stats de saúde */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 10,
          }}
        >
          <StatMini
            label="Último turno"
            value={
              bar.ultimo_turno_em
                ? new Date(bar.ultimo_turno_em).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })
                : "—"
            }
          />
          <StatMini
            label="Dias sem uso"
            value={bar.dias_sem_uso !== null ? bar.dias_sem_uso : "—"}
            valueColor={
              bar.dias_sem_uso !== null && bar.dias_sem_uso >= 7
                ? "#ef4444"
                : "var(--fg)"
            }
          />
          <StatMini
            label="Turnos 7d"
            value={bar.turnos_7d}
            valueColor={bar.turnos_7d === 0 ? "var(--fg-subtle)" : "var(--fg)"}
          />
          <StatMini
            label="Faturamento 7d"
            value={
              bar.faturamento_7d > 0
                ? currency.format(bar.faturamento_7d)
                : "—"
            }
          />
        </div>

        {/* Cobertura de ficha técnica */}
        {bar.total_produtos > 0 && (
          <div style={{ ...card, marginTop: 10 }}>
            <p style={overline}>Cobertura de ficha técnica (custo por produto)</p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 8,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: "var(--border)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${bar.cobertura_custo_pct}%`,
                    height: "100%",
                    background: coberturaBgColor,
                    borderRadius: 3,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: coberturaBgColor,
                  fontFamily: "var(--font-mono)",
                  flexShrink: 0,
                }}
              >
                {bar.cobertura_custo_pct}% ({bar.total_produtos_com_custo}/
                {bar.total_produtos})
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ── Operação ─────────────────────────────────────────────────────── */}
      <section>
        <p style={sectionLabel}>Operação (total acumulado)</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 10,
          }}
        >
          <StatMini label="Turnos" value={bar.total_turnos} />
          <StatMini label="Comandas" value={bar.total_comandas} />
          <StatMini label="Pagamentos" value={bar.total_pagamentos} />
          <StatMini label="Produtos" value={bar.total_produtos} />
          <StatMini
            label="Membros ativos"
            value={bar.membros.filter((m) => m.ativo).length}
          />
        </div>

        {/* Equipe */}
        {bar.membros.length > 0 && (
          <div
            style={{
              ...card,
              marginTop: 14,
              padding: 0,
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {(
                    [
                      ["Nome", "left"],
                      ["Cargo", "left"],
                      ["Status", "left"],
                      ["Desde", "right"],
                    ] as const
                  ).map(([label, align]) => (
                    <th
                      key={label}
                      style={{
                        padding: "8px 16px",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--fg-subtle)",
                        textAlign: align,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bar.membros.map((m) => (
                  <tr key={m.id}>
                    <td
                      style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid var(--border)",
                        fontSize: 13,
                        color: "var(--fg)",
                        fontWeight: 500,
                      }}
                    >
                      {m.nome ?? "—"}
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid var(--border)",
                        fontSize: 12,
                        color: "var(--fg-muted)",
                      }}
                    >
                      {ROLE_LABEL[m.role] ?? m.role}
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid var(--border)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: m.ativo ? "var(--ok)" : "var(--fg-subtle)",
                      }}
                    >
                      {m.ativo ? "Ativo" : "Inativo"}
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid var(--border)",
                        fontSize: 12,
                        color: "var(--fg-muted)",
                        textAlign: "right",
                      }}
                    >
                      {shortDate(m.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Cobrança ─────────────────────────────────────────────────────── */}
      <section>
        <p style={sectionLabel}>Cobrança</p>
        <div style={card}>
          {bar.assinatura_status ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 20,
              }}
            >
              <div>
                <p style={overline}>Status</p>
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: STATUS_COLOR[bar.assinatura_status],
                    margin: 0,
                    letterSpacing: "0.04em",
                  }}
                >
                  {STATUS_LABEL[bar.assinatura_status]}
                </p>
              </div>
              <div>
                <p style={overline}>Plano</p>
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--fg)",
                    margin: 0,
                  }}
                >
                  {bar.plano_nome ?? "—"}
                </p>
                {bar.plano_preco !== null && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--fg-muted)",
                      margin: "2px 0 0",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {currency.format(bar.plano_preco)}/mês
                  </p>
                )}
              </div>
              {bar.assinatura_status === "trial" && bar.trial_fim && (
                <div>
                  <p style={overline}>Trial até</p>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color:
                        new Date(bar.trial_fim) < new Date()
                          ? "#ef4444"
                          : "var(--fg)",
                      margin: 0,
                    }}
                  >
                    {shortDate(bar.trial_fim)}
                  </p>
                </div>
              )}
              {bar.periodo_inicio && (
                <div>
                  <p style={overline}>Período</p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--fg-muted)",
                      margin: 0,
                    }}
                  >
                    {shortDate(bar.periodo_inicio)}
                    {bar.periodo_fim && (
                      <> → {shortDate(bar.periodo_fim)}</>
                    )}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
              Sem assinatura cadastrada.
            </p>
          )}
        </div>
      </section>

      {/* ── Ações ────────────────────────────────────────────────────────── */}
      <section>
        <p style={sectionLabel}>Ações</p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
          }}
        >
          {/* Abrir dashboard do bar (link) */}
          <a
            href={`/dashboard?_admin_bar=${bar.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: "var(--accent)",
              color: "var(--accent-fg)",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            ↗ Abrir dashboard
          </a>

          {/* Suspender / Reativar */}
          {bar.ativo ? (
            <form
              action={async () => {
                "use server";
                await suspenderBar(bar.id);
              }}
            >
              <button
                type="submit"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  background: "transparent",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.4)",
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Suspender bar
              </button>
            </form>
          ) : (
            <form
              action={async () => {
                "use server";
                await reativarBar(bar.id);
              }}
            >
              <button
                type="submit"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  background: "transparent",
                  color: "var(--ok)",
                  border: "1px solid rgba(101,163,13,0.4)",
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Reativar bar
              </button>
            </form>
          )}

          {/* Marcar como inadimplente */}
          {bar.assinatura_id &&
            bar.assinatura_status !== "inadimplente" && (
              <form
                action={async () => {
                  "use server";
                  await alterarStatusAssinatura(
                    bar.assinatura_id!,
                    "inadimplente",
                    bar.id
                  );
                }}
              >
                <button
                  type="submit"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    background: "transparent",
                    color: "var(--fg-muted)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Marcar inadimplente
                </button>
              </form>
            )}

          {/* Reativar assinatura */}
          {bar.assinatura_id &&
            (bar.assinatura_status === "inadimplente" ||
              bar.assinatura_status === "cancelada") && (
              <form
                action={async () => {
                  "use server";
                  await alterarStatusAssinatura(
                    bar.assinatura_id!,
                    "ativa",
                    bar.id
                  );
                }}
              >
                <button
                  type="submit"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    background: "transparent",
                    color: "var(--ok)",
                    border: "1px solid rgba(101,163,13,0.4)",
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Reativar assinatura
                </button>
              </form>
            )}
        </div>

        {/* Nota: impersonation */}
        <p
          style={{
            fontSize: 11,
            color: "var(--fg-subtle)",
            margin: "12px 0 0",
            fontStyle: "italic",
          }}
        >
          "Entrar como suporte" com log de auditoria — a implementar.
        </p>
      </section>

      {/* Config técnica */}
      <details style={{ ...card, padding: "16px 24px" }}>
        <summary
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--fg-muted)",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          Configurações técnicas do bar
        </summary>
        <pre
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "var(--fg-muted)",
            fontFamily: "var(--font-mono)",
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
          }}
        >
          {JSON.stringify(bar.configuracoes, null, 2)}
        </pre>
      </details>
    </div>
  );
}
