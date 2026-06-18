import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getMembrosEquipe } from "@/lib/equipe/queries";
import { alterarRole, desativarMembro, reativarMembro, convidarMembro } from "@/lib/equipe/actions";
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
  dono:      "rgba(200,255,0,0.1)",
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

  // Ranking por vendas (só bartenders ativos com dados)
  const ranking = [...ativos]
    .filter(m => m.totalComandas > 0)
    .sort((a, b) => b.totalVendas - a.totalVendas);

  const isDono = current.role === "dono";

  return (
    <div style={{ padding: "32px 36px", maxWidth: 900, fontFamily: "var(--font-geist, sans-serif)" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 6px" }}>
          {current.bar.nome}
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "white", margin: 0, letterSpacing: "-0.5px" }}>
          Equipe
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "6px 0 0" }}>
          {ativos.length} membro{ativos.length !== 1 ? "s" : ""} ativo{ativos.length !== 1 ? "s" : ""} · ranking dos últimos 30 dias
        </p>
      </div>

      {/* Convidar */}
      {isDono && (
        <form action={convidarMembro} style={{
          background: "rgba(255,255,255,0.04)",
          border: "none",
          borderRadius: 12, padding: "20px 22px",
          display: "flex", gap: 10, alignItems: "flex-end",
          marginBottom: 32, flexWrap: "wrap",
        }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              E-mail do funcionário
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="nome@email.com"
              style={{
                width: "100%", background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                padding: "11px 14px", color: "white", fontSize: 14,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Função
            </label>
            <select
              name="role"
              defaultValue="bartender"
              style={{
                width: "100%", background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                padding: "11px 14px", color: "white", fontSize: 14,
                outline: "none", boxSizing: "border-box", colorScheme: "dark",
              }}
            >
              <option value="gerente">Gerente</option>
              <option value="bartender">Bartender</option>
              <option value="caixa">Caixa</option>
            </select>
          </div>
          <button
            type="submit"
            style={{
              padding: "11px 22px", borderRadius: 10,
              background: "#c8ff00", border: "none",
              color: "#000", fontSize: 14, fontWeight: 800,
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            + Adicionar
          </button>
        </form>
      )}

      {/* Ranking */}
      {ranking.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 14px" }}>
            🏆 Ranking — últimos 30 dias
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ranking.map((m, i) => (
              <div key={m.id} style={{
                display: "flex", alignItems: "center", gap: 16,
                background: i === 0 ? "rgba(200,255,0,0.06)" : "rgba(255,255,255,0.04)",
                border: "none",
                borderRadius: 12, padding: "14px 18px",
              }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: i === 0 ? "#c8ff00" : "rgba(255,255,255,0.25)", minWidth: 28 }}>
                  {i + 1}º
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "white", margin: 0 }}>{m.nome}</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>{ROLE_LABELS[m.role]}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: i === 0 ? "#c8ff00" : "white", margin: 0 }}>{fmt(m.totalVendas)}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>{m.totalComandas} comandas · TM {fmt(m.ticketMedio)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de membros */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 14px" }}>
          Membros ativos
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ativos.map((m) => (
            <div key={m.id} style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "rgba(255,255,255,0.04)",
              border: "none",
              borderRadius: 12, padding: "14px 18px",
            }}>
              {/* Avatar */}
              <div style={{
                width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                background: "rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "white",
              }}>
                {m.nome[0]?.toUpperCase() ?? "?"}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "white", margin: 0 }}>{m.nome}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</p>
              </div>

              {/* Role badge + selector */}
              {isDono && m.role !== "dono" ? (
                <form action={async (fd: FormData) => {
                  "use server";
                  const role = fd.get("role") as BarRole;
                  await alterarRole(m.id, role);
                }}>
                  <select
                    name="role"
                    defaultValue={m.role}
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    style={{
                      background: ROLE_BG[m.role],
                      border: "none", borderRadius: 99,
                      padding: "4px 12px", fontSize: 11, fontWeight: 700,
                      color: ROLE_COLORS[m.role], cursor: "pointer",
                      outline: "none", colorScheme: "dark",
                    }}
                  >
                    <option value="gerente">Gerente</option>
                    <option value="bartender">Bartender</option>
                    <option value="caixa">Caixa</option>
                  </select>
                </form>
              ) : (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 99,
                  background: ROLE_BG[m.role], color: ROLE_COLORS[m.role],
                }}>
                  {ROLE_LABELS[m.role]}
                </span>
              )}

              {/* Stats */}
              {m.totalComandas > 0 && (
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", minWidth: 80, textAlign: "right" }}>
                  {fmt(m.totalVendas)}
                </span>
              )}

              {/* Desativar */}
              {isDono && m.role !== "dono" && m.userId !== current.userId && (
                <form action={desativarMembro.bind(null, m.id)}>
                  <button
                    type="submit"
                    title="Remover acesso"
                    style={{
                      background: "none", border: "none",
                      color: "rgba(255,255,255,0.2)", cursor: "pointer",
                      fontSize: 16, padding: "4px 6px", borderRadius: 6,
                      transition: "color 150ms",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
                  >
                    ✕
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>

        {/* Inativos */}
        {inativos.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 12px" }}>
              Sem acesso
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {inativos.map((m) => (
                <div key={m.id} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  background: "rgba(255,255,255,0.04)",
                  border: "none",
                  borderRadius: 12, padding: "12px 18px",
                  opacity: 0.45,
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>
                    {m.nome[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: 0 }}>{m.nome}</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: "2px 0 0" }}>{m.email}</p>
                  </div>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Inativo</span>
                  {isDono && (
                    <form action={reativarMembro.bind(null, m.id)}>
                      <button type="submit" style={{ background: "#c8ff00", border: "none", borderRadius: 8, color: "#000", fontSize: 12, fontWeight: 700, padding: "5px 14px", cursor: "pointer" }}>
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
