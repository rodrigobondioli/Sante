import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getMembrosEquipe } from "@/lib/equipe/queries";
import { alterarRole, desativarMembro, reativarMembro, convidarMembro } from "@/lib/equipe/actions";
import { LABEL, H1, SUBTITLE, CARD, BTN_PRIMARY, BTN_SECONDARY, BTN_ICON, INPUT } from "@/lib/ui";
import type { BarRole } from "@/types/database";

const ROLE_LABELS: Record<BarRole, string> = {
  dono:      "Dono",
  gerente:   "Gerente",
  bartender: "Bartender",
  caixa:     "Caixa",
};

const ROLE_COLORS: Record<BarRole, string> = {
  dono:      "rgba(255,255,255,0.90)",
  gerente:   "rgba(160,130,255,0.9)",
  bartender: "rgba(96,165,250,0.9)",
  caixa:     "rgba(251,191,36,0.9)",
};

const ROLE_BG: Record<BarRole, string> = {
  dono:      "rgba(38,0,120,0.20)",
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
    <div style={{ padding: "32px 40px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <p style={LABEL}>{current.bar.nome}</p>
        <h1 style={{ ...H1, marginTop: 6 }}>Equipe</h1>
        <p style={SUBTITLE}>
          {ativos.length} membro{ativos.length !== 1 ? "s" : ""} ativo{ativos.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── 2-column layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

        {/* ── Coluna esquerda: invite + membros ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Convidar */}
          {isDono && (
            <div style={{ ...CARD, padding: "20px 22px" }}>
              <p style={{ ...LABEL, marginBottom: 16 }}>Adicionar membro</p>
              <form action={convidarMembro} style={{ display: "grid", gridTemplateColumns: "1fr 160px auto", gap: 10, alignItems: "flex-end" }}>
                <div>
                  <label style={{ ...LABEL, display: "block", marginBottom: 6 }}>E-mail</label>
                  <input name="email" type="email" required placeholder="nome@email.com" style={INPUT} />
                </div>
                <div>
                  <label style={{ ...LABEL, display: "block", marginBottom: 6 }}>Função</label>
                  <select name="role" defaultValue="bartender" style={{ ...INPUT, colorScheme: "dark" }}>
                    <option value="gerente">Gerente</option>
                    <option value="bartender">Bartender</option>
                    <option value="caixa">Caixa</option>
                  </select>
                </div>
                <button type="submit" style={{ ...BTN_PRIMARY, marginBottom: 1 }}>+ Adicionar</button>
              </form>
            </div>
          )}

          {/* Membros ativos */}
          <div>
            <p style={{ ...LABEL, marginBottom: 12 }}>Membros ativos</p>
            <div style={{ ...CARD, overflow: "hidden" }}>
              {/* Col header */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 130px 80px 32px",
                gap: 12, padding: "10px 18px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{ ...LABEL, margin: 0 }}>Nome</span>
                <span style={{ ...LABEL, margin: 0 }}>Função</span>
                <span style={{ ...LABEL, margin: 0, textAlign: "right" }}>Vendas</span>
                <span />
              </div>

              {ativos.map((m, i) => (
                <div key={m.id} style={{
                  display: "grid", gridTemplateColumns: "1fr 130px 80px 32px",
                  gap: 12, alignItems: "center",
                  padding: "13px 18px",
                  borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                }}>
                  {/* Info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(255,255,255,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "white",
                    }}>
                      {m.nome[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "white", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.nome}
                      </p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.email}
                      </p>
                    </div>
                  </div>

                  {/* Role */}
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
                      display: "inline-block",
                    }}>
                      {ROLE_LABELS[m.role]}
                    </span>
                  )}

                  {/* Vendas */}
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {m.totalComandas > 0 ? fmt(m.totalVendas) : "—"}
                  </span>

                  {/* Desativar */}
                  {isDono && m.role !== "dono" && m.userId !== current.userId ? (
                    <form action={desativarMembro.bind(null, m.id)}>
                      <button type="submit" title="Remover acesso" style={BTN_ICON}>✕</button>
                    </form>
                  ) : <span />}
                </div>
              ))}

              {ativos.length === 0 && (
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", padding: "24px 18px", margin: 0 }}>
                  Nenhum membro ativo.
                </p>
              )}
            </div>
          </div>

          {/* Sem acesso */}
          {inativos.length > 0 && (
            <div>
              <p style={{ ...LABEL, marginBottom: 12, color: "rgba(255,255,255,0.25)" }}>Sem acesso</p>
              <div style={{ ...CARD, overflow: "hidden" }}>
                {inativos.map((m, i) => (
                  <div key={m.id} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "12px 18px", opacity: 0.5,
                    borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: "rgba(255,255,255,0.05)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", flexShrink: 0,
                    }}>
                      {m.nome[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.5)", margin: 0 }}>{m.nome}</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</p>
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

        {/* ── Coluna direita: ranking ── */}
        <div style={{ position: "sticky", top: 0 }}>
          {ranking.length > 0 ? (
            <div style={{ ...CARD, padding: "20px 20px" }}>
              <p style={{ ...LABEL, marginBottom: 16 }}>🏆 Ranking · 30 dias</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {ranking.map((m, i) => (
                  <div key={m.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: i === 0 ? "rgba(38,0,120,0.20)" : "rgba(255,255,255,0.02)",
                  }}>
                    <span style={{
                      fontSize: 14, fontWeight: 700,
                      color: i === 0 ? "#260078" : "rgba(255,255,255,0.20)",
                      minWidth: 24, flexShrink: 0,
                    }}>
                      {i + 1}º
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "white", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.nome}
                      </p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", margin: "2px 0 0" }}>
                        {m.totalComandas} cmd · TM {fmt(m.ticketMedio)}
                      </p>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? "#260078" : "white", margin: 0, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                      {fmt(m.totalVendas)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px dashed rgba(255,255,255,0.07)",
              borderRadius: 12, padding: 24,
            }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.35)", margin: "0 0 6px" }}>
                Ranking indisponível
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", margin: 0, lineHeight: 1.5 }}>
                Os dados de performance aparecem aqui após o primeiro turno ser fechado.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
