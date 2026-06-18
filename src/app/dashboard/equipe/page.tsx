import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getMembrosEquipe } from "@/lib/equipe/queries";
import { alterarRole, desativarMembro, reativarMembro, convidarMembro } from "@/lib/equipe/actions";
import { LABEL, H1, SUBTITLE, CARD, BTN_PRIMARY, BTN_SECONDARY, BTN_ICON, INPUT, PAGE_PAD } from "@/lib/ui";
import type { BarRole } from "@/types/database";

const ROLE_LABELS: Record<BarRole, string> = {
  dono:      "Dono",
  gerente:   "Gerente",
  bartender: "Bartender",
  caixa:     "Caixa",
};

const ROLE_COLORS: Record<BarRole, string> = {
  dono:      "rgba(200,255,0,0.9)",
  gerente:   "rgba(160,130,255,0.9)",
  bartender: "rgba(96,165,250,0.9)",
  caixa:     "rgba(251,191,36,0.9)",
};

const ROLE_BG: Record<BarRole, string> = {
  dono:      "rgba(200,255,0,0.10)",
  gerente:   "rgba(38,0,120,0.30)",
  bartender: "rgba(29,78,216,0.20)",
  caixa:     "rgba(120,80,0,0.25)",
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function EquipePage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const membros = await getMembrosEquipe(current.bar.id);
  const ativos   = membros.filter(m => m.ativo);
  const inativos = membros.filter(m => !m.ativo);

  const ranking = [...ativos]
    .filter(m => m.totalComandas > 0)
    .sort((a, b) => b.totalVendas - a.totalVendas);

  const isDono = current.role === "dono";

  return (
    <div style={{ ...PAGE_PAD, maxWidth: 900 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <p style={LABEL}>{current.bar.nome}</p>
        <h1 style={{ ...H1, marginTop: 6 }}>Equipe</h1>
        <p style={SUBTITLE}>
          {ativos.length} membro{ativos.length !== 1 ? "s" : ""} ativo{ativos.length !== 1 ? "s" : ""} · ranking dos últimos 30 dias
        </p>
      </div>

      {/* ── Convidar ── */}
      {isDono && (
        <form action={convidarMembro} style={{
          ...CARD,
          padding: "20px 22px",
          display: "flex", gap: 10, alignItems: "flex-end",
          marginBottom: 32, flexWrap: "wrap",
        }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label style={{ ...LABEL, display: "block", marginBottom: 6 }}>
              E-mail do funcionário
            </label>
            <input name="email" type="email" required placeholder="nome@email.com" style={INPUT} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ ...LABEL, display: "block", marginBottom: 6 }}>Função</label>
            <select
              name="role"
              defaultValue="bartender"
              style={{ ...INPUT, colorScheme: "dark" }}
            >
              <option value="gerente">Gerente</option>
              <option value="bartender">Bartender</option>
              <option value="caixa">Caixa</option>
            </select>
          </div>
          <button type="submit" style={BTN_PRIMARY}>+ Adicionar</button>
        </form>
      )}

      {/* ── Ranking ── */}
      {ranking.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <p style={{ ...LABEL, marginBottom: 14 }}>🏆 Ranking — últimos 30 dias</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ranking.map((m, i) => (
              <div key={m.id} style={{
                ...CARD,
                background: i === 0 ? "rgba(200,255,0,0.06)" : "rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", gap: 16,
                padding: "14px 18px",
              }}>
                <span style={{
                  fontSize: 16, fontWeight: 700,
                  color: i === 0 ? "#c8ff00" : "rgba(255,255,255,0.25)",
                  minWidth: 28,
                }}>
                  {i + 1}º
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "white", margin: 0 }}>{m.nome}</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>{ROLE_LABELS[m.role]}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: i === 0 ? "#c8ff00" : "white", margin: 0 }}>
                    {fmt(m.totalVendas)}
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>
                    {m.totalComandas} comandas · TM {fmt(m.ticketMedio)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Membros ativos ── */}
      <div>
        <p style={{ ...LABEL, marginBottom: 14 }}>Membros ativos</p>
        <div style={{ ...CARD, overflow: "hidden" }}>
          {ativos.map((m, i) => (
            <div key={m.id} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 18px",
              borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
            }}>
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: "rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 600, color: "white",
              }}>
                {m.nome[0]?.toUpperCase() ?? "?"}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: "white", margin: 0 }}>{m.nome}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.email}
                </p>
              </div>

              {/* Role badge / selector */}
              {isDono && m.role !== "dono" ? (
                <form action={async (fd: FormData) => {
                  "use server";
                  const role = fd.get("role") as BarRole;
                  await alterarRole(m.id, role);
                }}>
                  <select
                    name="role"
                    defaultValue={m.role}
                    onChange={e => e.currentTarget.form?.requestSubmit()}
                    style={{
                      background: ROLE_BG[m.role], border: "none",
                      borderRadius: 99, padding: "4px 12px",
                      fontSize: 11, fontWeight: 600,
                      color: ROLE_COLORS[m.role],
                      cursor: "pointer", outline: "none", colorScheme: "dark",
                    }}
                  >
                    <option value="gerente">Gerente</option>
                    <option value="bartender">Bartender</option>
                    <option value="caixa">Caixa</option>
                  </select>
                </form>
              ) : (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 99,
                  background: ROLE_BG[m.role], color: ROLE_COLORS[m.role],
                }}>
                  {ROLE_LABELS[m.role]}
                </span>
              )}

              {/* Stats */}
              {m.totalComandas > 0 && (
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", minWidth: 80, textAlign: "right" }}>
                  {fmt(m.totalVendas)}
                </span>
              )}

              {/* Desativar */}
              {isDono && m.role !== "dono" && m.userId !== current.userId && (
                <form action={desativarMembro.bind(null, m.id)}>
                  <button
                    type="submit"
                    title="Remover acesso"
                    style={{ ...BTN_ICON, color: "rgba(255,255,255,0.20)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.20)")}
                  >
                    ✕
                  </button>
                </form>
              )}
            </div>
          ))}

          {ativos.length === 0 && (
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", padding: "24px 18px", margin: 0 }}>
              Nenhum membro ativo.
            </p>
          )}
        </div>

        {/* ── Sem acesso ── */}
        {inativos.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ ...LABEL, marginBottom: 12, color: "rgba(255,255,255,0.25)" }}>Sem acesso</p>
            <div style={{ ...CARD, overflow: "hidden" }}>
              {inativos.map((m, i) => (
                <div key={m.id} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "12px 18px", opacity: 0.45,
                  borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.4)", flexShrink: 0,
                  }}>
                    {m.nome[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.5)", margin: 0 }}>{m.nome}</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: "2px 0 0" }}>{m.email}</p>
                  </div>
                  <span style={{ ...LABEL, textTransform: "none", letterSpacing: 0 }}>Inativo</span>
                  {isDono && (
                    <form action={reativarMembro.bind(null, m.id)}>
                      <button type="submit" style={{ ...BTN_SECONDARY, padding: "4px 14px", fontSize: 12 }}>
                        Reativar
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
