"use client";

import { useState } from "react";
import { registrarMovimento, atualizarMinimo, type EstoqueResult } from "@/lib/estoque/actions";
import type { ItemEstoque } from "@/lib/estoque/queries";

const TIPO_LABEL: Record<string, string> = {
  compra:    "Entrada (compra)",
  devolucao: "Devolução",
  ajuste:    "Ajuste manual",
  perda:     "Perda / quebra",
};

function MovimentoForm({ item, onClose }: { item: ItemEstoque; onClose: () => void }) {
  const [tipo, setTipo]     = useState("compra");
  const [qtd, setQtd]       = useState("");
  const [motivo, setMotivo] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult]   = useState<EstoqueResult>(null);

  const inp: React.CSSProperties = {
    background: "var(--bg-inset)", border: "1px solid var(--border)",
    borderRadius: 4, padding: "9px 12px", fontSize: 13,
    color: "var(--fg)", outline: "none", width: "100%",
    boxSizing: "border-box", colorScheme: "dark" as React.CSSProperties["colorScheme"],
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData();
    fd.set("quantidade", qtd);
    fd.set("tipo", tipo);
    fd.set("motivo", motivo);
    const r = await registrarMovimento(item.id, fd);
    setResult(r);
    setPending(false);
    if (r && "ok" in r) setTimeout(onClose, 800);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <label style={{ fontSize: 11, color: "var(--fg-subtle)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Tipo
          </label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ ...inp }}>
            {Object.entries(TIPO_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: "var(--fg-subtle)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Quantidade ({item.unidade})
          </label>
          <input
            type="number" min="0" step="0.01"
            value={qtd} onChange={e => setQtd(e.target.value)}
            placeholder={tipo === "ajuste" ? "Novo total" : "Qtd"}
            required style={inp} autoFocus
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: 11, color: "var(--fg-subtle)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Motivo (opcional)
        </label>
        <input
          value={motivo} onChange={e => setMotivo(e.target.value)}
          placeholder="Ex: Entrega Ambev, quebra de garrafa..."
          style={inp}
        />
      </div>

      {result && (
        <p style={{
          fontSize: 12, padding: "8px 12px", borderRadius: 4,
          background: "ok" in result ? "color-mix(in srgb, var(--ok) 10%, transparent)" : "color-mix(in srgb, var(--danger) 10%, transparent)",
          color: "ok" in result ? "var(--ok)" : "var(--danger)",
          border: `1px solid ${"ok" in result ? "color-mix(in srgb, var(--ok) 20%, transparent)" : "color-mix(in srgb, var(--danger) 20%, transparent)"}`,
        }}>
          {"ok" in result ? "Registrado!" : ("error" in result ? result.error : "")}
        </p>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={{
          background: "none", border: "1px solid var(--border)", borderRadius: 4,
          padding: "8px 16px", fontSize: 13, color: "var(--fg-muted)", cursor: "pointer",
        }}>
          Cancelar
        </button>
        <button type="submit" disabled={pending || !qtd} style={{
          background: "var(--accent)", color: "var(--accent-fg)",
          border: "none", borderRadius: 4,
          padding: "8px 16px", fontSize: 13, fontWeight: 600,
          cursor: pending || !qtd ? "not-allowed" : "pointer",
          opacity: pending || !qtd ? 0.6 : 1,
        }}>
          {pending ? "Salvando…" : "Registrar"}
        </button>
      </div>
    </form>
  );
}

function MinimoForm({ item, onClose }: { item: ItemEstoque; onClose: () => void }) {
  const [qtd, setQtd]         = useState(String(item.quantidadeMinima));
  const [pending, setPending]   = useState(false);
  const [result, setResult]     = useState<EstoqueResult>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData();
    fd.set("quantidade_minima", qtd);
    const r = await atualizarMinimo(item.id, fd);
    setResult(r);
    setPending(false);
    if (r && "ok" in r) setTimeout(onClose, 600);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, paddingTop: 8, alignItems: "flex-end" }}>
      <input
        type="number" min="0" step="0.01"
        value={qtd} onChange={e => setQtd(e.target.value)}
        style={{
          background: "var(--bg-inset)", border: "1px solid var(--border)",
          borderRadius: 4, padding: "7px 10px", fontSize: 13,
          color: "var(--fg)", outline: "none", width: 90,
          colorScheme: "dark" as React.CSSProperties["colorScheme"],
        }}
        autoFocus
      />
      <button type="submit" disabled={pending} style={{
        background: "var(--accent)", color: "var(--accent-fg)",
        border: "none", borderRadius: 4, padding: "7px 14px",
        fontSize: 13, fontWeight: 600, cursor: "pointer",
      }}>
        {result && "ok" in result ? "✓" : pending ? "…" : "Ok"}
      </button>
      <button type="button" onClick={onClose} style={{
        background: "none", border: "1px solid var(--border)", borderRadius: 4,
        padding: "7px 12px", fontSize: 13, color: "var(--fg-muted)", cursor: "pointer",
      }}>
        ✕
      </button>
    </form>
  );
}

export function EstoqueClient({ itens }: { itens: ItemEstoque[] }) {
  const [expandido, setExpandido] = useState<string | null>(null);
  const [editandoMinimo, setEditandoMinimo] = useState<string | null>(null);

  const alertas = itens.filter(i => i.abaixoDoMinimo);
  const ok      = itens.filter(i => !i.abaixoDoMinimo);

  function renderRow(item: ItemEstoque) {
    const emAlerta  = item.abaixoDoMinimo;
    const aberto    = expandido === item.id;
    const editMin   = editandoMinimo === item.id;
    const porcentagem = item.quantidadeMinima > 0
      ? Math.min(Math.round((item.quantidadeAtual / item.quantidadeMinima) * 100), 200)
      : 100;

    return (
      <div key={item.id} style={{
        background: "var(--bg-elevated)",
        border: `1px solid ${emAlerta ? "color-mix(in srgb, var(--warn) 30%, var(--border))" : "var(--border)"}`,
        borderRadius: 4,
        overflow: "hidden",
      }}>
        {/* Linha principal */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", alignItems: "center", gap: 16, padding: "14px 20px" }}>
          {/* Nome + barra */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              {emAlerta && (
                <span style={{
                  fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 2,
                  background: "color-mix(in srgb, var(--warn) 15%, transparent)",
                  color: "var(--warn)", textTransform: "uppercase", letterSpacing: "0.06em",
                }}>
                  Alerta
                </span>
              )}
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)" }}>
                {item.produtoNome}
              </span>
            </div>
            <div style={{ height: 3, background: "var(--border-strong)", borderRadius: 2, overflow: "hidden", maxWidth: 200 }}>
              <div style={{
                height: 3, borderRadius: 2,
                width: `${Math.min(porcentagem, 100)}%`,
                background: emAlerta ? "var(--warn)" : "var(--ok)",
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>

          {/* Quantidade atual */}
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 20, fontWeight: 600, fontFamily: "var(--font-mono)", color: emAlerta ? "var(--warn)" : "var(--fg)" }}>
              {item.quantidadeAtual % 1 === 0 ? item.quantidadeAtual : item.quantidadeAtual.toFixed(1)}
            </span>
            <span style={{ fontSize: 12, color: "var(--fg-subtle)", marginLeft: 4 }}>{item.unidade}</span>
          </div>

          {/* Mínimo */}
          <div style={{ textAlign: "right", minWidth: 80 }}>
            {editMin ? (
              <MinimoForm item={item} onClose={() => setEditandoMinimo(null)} />
            ) : (
              <button
                onClick={() => setEditandoMinimo(editMin ? null : item.id)}
                title="Editar mínimo"
                style={{ background: "none", border: "none", cursor: "pointer", textAlign: "right", padding: 0 }}
              >
                <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
                  mín. {item.quantidadeMinima} {item.unidade}
                </span>
              </button>
            )}
          </div>

          {/* Botão de entrada */}
          <button
            onClick={() => setExpandido(aberto ? null : item.id)}
            style={{
              background: aberto ? "var(--bg-inset)" : "color-mix(in srgb, var(--accent) 12%, transparent)",
              color: "var(--accent)",
              border: `1px solid ${aberto ? "var(--border)" : "color-mix(in srgb, var(--accent) 30%, transparent)"}`,
              borderRadius: 4, padding: "6px 14px",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {aberto ? "Cancelar" : "+ Registrar"}
          </button>
        </div>

        {/* Formulário expandido */}
        {aberto && (
          <div style={{ padding: "0 20px 16px", borderTop: "1px solid var(--border)" }}>
            <MovimentoForm item={item} onClose={() => setExpandido(null)} />
          </div>
        )}
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div style={{
        background: "var(--bg-elevated)", border: "1px solid var(--border)",
        borderRadius: 4, padding: "48px 24px", textAlign: "center",
      }}>
        <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: 0 }}>
          Nenhum produto com controle de estoque ativo.
        </p>
        <p style={{ fontSize: 12, color: "var(--fg-subtle)", marginTop: 8 }}>
          Ative o controle de estoque nos produtos do Cardápio.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {alertas.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, color: "var(--warn)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            {alertas.length} alerta{alertas.length > 1 ? "s" : ""} de estoque baixo
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {alertas.map(renderRow)}
          </div>
        </div>
      )}

      {ok.length > 0 && (
        <div>
          {alertas.length > 0 && (
            <p style={{ fontSize: 11, fontWeight: 500, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Em dia
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ok.map(renderRow)}
          </div>
        </div>
      )}
    </div>
  );
}
