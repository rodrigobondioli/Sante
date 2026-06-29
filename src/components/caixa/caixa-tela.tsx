"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { registrarPagamento } from "@/lib/caixa/actions";
import { imprimirConta } from "@/lib/caixa/print-conta";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/ui/app-header";
import type { ComandaPendente, CaixaInsights } from "@/lib/caixa/queries";
import type { PagamentoMetodo } from "@/types/database";
import { METODO_LABEL } from "@/lib/caixa/constants";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// ─── Tempo de espera ─────────────────────────────────────────────────────────

function calcTempo(comanda: ComandaPendente) {
  const base = comanda.fechada_em ?? comanda.aberta_em;
  const min  = Math.floor((Date.now() - new Date(base).getTime()) / 60000);
  const texto = min < 1  ? "agora"
              : min < 60 ? `${min}min`
              : `${Math.floor(min / 60)}h${min % 60 > 0 ? ` ${min % 60}min` : ""}`;
  return { texto, urgente: min >= 10, atencao: min >= 5 && min < 10 };
}

// ─── InsightsBar ─────────────────────────────────────────────────────────────

function InsightsBar({ insights, pendentes }: { insights: CaixaInsights; pendentes: number }) {
  const stats = [
    { label: "Faturado", value: currency.format(insights.totalTurno),  big: true  },
    { label: "Pagas",    value: String(insights.comandasPagas),         big: false },
    { label: "Ticket",   value: currency.format(insights.ticketMedio),  big: false },
    ...(pendentes > 0 ? [{ label: "Fila", value: String(pendentes), big: false, warn: true }] : []),
  ] as { label: string; value: string; big: boolean; warn?: boolean }[];

  return (
    <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: 0, flexShrink: 0 }}>
      {stats.map((s, i) => (
        <div key={s.label} style={{
          flex: i === 0 ? 2 : 1,
          paddingLeft: i > 0 ? 16 : 0,
          marginLeft: i > 0 ? 16 : 0,
          borderLeft: i > 0 ? "1px solid var(--border)" : "none",
        }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 3px" }}>
            {s.label}
          </p>
          <p style={{
            fontSize: i === 0 ? 22 : 18, fontWeight: 800, margin: 0,
            color: s.warn ? "var(--warn)" : i === 0 ? "var(--fg)" : "var(--fg-muted)",
            letterSpacing: i === 0 ? "-0.5px" : "-0.2px",
            fontVariantNumeric: "tabular-nums", lineHeight: 1, fontFamily: "var(--font-sans)",
          }}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── CortesiaModal ───────────────────────────────────────────────────────────

const MOTIVOS_RAPIDOS = [
  "VIP / cliente especial", "Erro do preparo",
  "Aniversariante", "Parceiro / influencer", "Brinde da casa",
];

function CortesiaModal({
  comanda, onConfirm, onClose,
}: {
  comanda: ComandaPendente;
  onConfirm: (m: string) => void;
  onClose: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  const valid = motivo.trim().length > 0;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 70 }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "var(--bg-elevated)", borderTop: "1px solid var(--border)",
        borderRadius: "8px 8px 0 0", padding: "24px 24px 40px", zIndex: 71,
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 4, background: "var(--border-strong)", margin: "0 auto 20px" }} />
        <p style={{ fontSize: 10, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.10em", margin: "0 0 5px" }}>
          Cortesia — {comanda.mesa}
        </p>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)", margin: "0 0 20px" }}>Qual o motivo?</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {MOTIVOS_RAPIDOS.map(m => (
            <button key={m} onClick={() => setMotivo(m)} style={{
              padding: "7px 14px", borderRadius: 4, border: "none",
              background: motivo === m
                ? "color-mix(in srgb, var(--accent-bright) 20%, transparent)"
                : "color-mix(in srgb, var(--fg) 6%, transparent)",
              color: motivo === m ? "var(--accent-bright)" : "var(--fg-muted)",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}>{m}</button>
          ))}
        </div>
        <input
          value={motivo} onChange={e => setMotivo(e.target.value)}
          placeholder="Ou escreva o motivo..."
          style={{
            width: "100%", boxSizing: "border-box",
            background: "var(--bg-hover)", border: "1px solid var(--border)",
            borderRadius: 4, padding: "13px 16px", fontSize: 14,
            color: "var(--fg)", outline: "none", marginBottom: 16,
            colorScheme: "dark" as React.CSSProperties["colorScheme"],
          }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "14px", background: "color-mix(in srgb, var(--fg) 6%, transparent)",
            border: "none", borderRadius: 8, color: "var(--fg-muted)", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>Cancelar</button>
          <button onClick={() => valid && onConfirm(motivo.trim())} disabled={!valid} style={{
            flex: 2, padding: "14px", border: "none", borderRadius: 8,
            background: valid
              ? "color-mix(in srgb, var(--accent-bright) 25%, transparent)"
              : "color-mix(in srgb, var(--fg) 4%, transparent)",
            color: valid ? "var(--accent-bright)" : "var(--fg-subtle)",
            fontSize: 14, fontWeight: 700, cursor: valid ? "pointer" : "default",
          }}>Confirmar cortesia</button>
        </div>
      </div>
    </>
  );
}

// ─── QueueRow ─────────────────────────────────────────────────────────────────
// Uma linha por comanda. Pix e Dinheiro disparam pagamento direto (1 toque).
// ··· abre o painel de detalhe.

function QueueRow({
  comanda, selected, onSelect, onQuickPay, pago, taxaServicoPct,
}: {
  comanda: ComandaPendente;
  selected: boolean;
  onSelect: () => void;
  onQuickPay: (metodo: PagamentoMetodo) => Promise<void>;
  pago: boolean;
  taxaServicoPct: number;
}) {
  const [isPending, startTransition] = useTransition();
  const { texto, urgente, atencao } = calcTempo(comanda);

  const doQuickPay = (metodo: PagamentoMetodo) => {
    startTransition(() => onQuickPay(metodo));
  };

  if (pago) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px", borderBottom: "1px solid var(--border)", opacity: 0.4,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, color: "var(--ok)" }}>✓</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-subtle)" }}>{comanda.mesa}</span>
        </div>
        <span style={{ fontSize: 13, color: "var(--fg-subtle)", fontFamily: "var(--font-sans)" }}>
          {currency.format(comanda.total)}
        </span>
      </div>
    );
  }

  const timeBg = urgente
    ? "color-mix(in srgb, var(--danger) 14%, transparent)"
    : atencao
    ? "color-mix(in srgb, #f59e0b 14%, transparent)"
    : "color-mix(in srgb, var(--fg) 6%, transparent)";
  const timeFg = urgente ? "var(--danger)" : atencao ? "#f59e0b" : "var(--fg-subtle)";

  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "10px 14px 10px 20px",
      borderBottom: "1px solid var(--border)",
      background: selected ? "color-mix(in srgb, var(--fg) 5%, transparent)" : "transparent",
      gap: 10, transition: "background 100ms",
      opacity: isPending ? 0.55 : 1,
    }}>
      {/* Info — clicável para abrir painel */}
      <button onClick={onSelect} style={{
        flex: 1, textAlign: "left", background: "none", border: "none",
        cursor: "pointer", padding: 0, minWidth: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)" }}>{comanda.mesa}</span>
          <span style={{
            fontSize: 9, fontWeight: 700,
            padding: "1px 6px", borderRadius: 3,
            background: timeBg, color: timeFg,
            letterSpacing: "0.04em",
          }}>
            {texto}
          </span>
        </div>
        <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>
          {comanda.itens.length} {comanda.itens.length === 1 ? "item" : "itens"}
        </span>
      </button>

      {/* Total */}
      <span style={{
        fontSize: 15, fontWeight: 800, fontFamily: "var(--font-sans)",
        color: "var(--fg)", whiteSpace: "nowrap", flexShrink: 0, letterSpacing: "-0.3px",
      }}>
        {currency.format(comanda.total)}
      </span>

      {/* Pagamento rápido */}
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        <button onClick={() => doQuickPay("pix")} disabled={isPending} title="Pix" style={{
          height: 34, padding: "0 10px",
          display: "flex", alignItems: "center", gap: 4,
          background: "color-mix(in srgb, var(--accent-bright) 12%, transparent)",
          border: "1px solid color-mix(in srgb, var(--accent-bright) 25%, transparent)",
          borderRadius: 6, cursor: isPending ? "not-allowed" : "pointer",
          WebkitTapHighlightColor: "transparent",
        }}>
          <span style={{ fontSize: 12 }}>⚡</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-bright)" }}>Pix</span>
        </button>
        <button onClick={() => doQuickPay("dinheiro")} disabled={isPending} title="Dinheiro" style={{
          height: 34, padding: "0 10px",
          display: "flex", alignItems: "center", gap: 4,
          background: "color-mix(in srgb, var(--accent-bright) 12%, transparent)",
          border: "1px solid color-mix(in srgb, var(--accent-bright) 25%, transparent)",
          borderRadius: 6, cursor: isPending ? "not-allowed" : "pointer",
          WebkitTapHighlightColor: "transparent",
        }}>
          <span style={{ fontSize: 12 }}>💵</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-bright)" }}>Din.</span>
        </button>
        {/* Abre painel completo */}
        <button onClick={onSelect} title="Detalhes / Cartão / Cortesia" style={{
          height: 34, width: 34,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: selected
            ? "color-mix(in srgb, var(--fg) 10%, transparent)"
            : "color-mix(in srgb, var(--fg) 5%, transparent)",
          border: "1px solid var(--border)",
          borderRadius: 6, cursor: "pointer",
          color: "var(--fg-subtle)", fontSize: 16, letterSpacing: "2px",
          WebkitTapHighlightColor: "transparent",
        }}>···</button>
      </div>
    </div>
  );
}

// ─── DetailPanel ─────────────────────────────────────────────────────────────
// Painel completo: itens, toggle de serviço, total, todos os métodos de pagamento.

function DetailPanel({
  comanda, barNome, taxaServicoPct, onPago, onClose,
}: {
  comanda: ComandaPendente;
  barNome: string;
  taxaServicoPct: number;
  onPago: (metodo: PagamentoMetodo) => void;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [pago, setPago]               = useState(false);
  const [metodoPago, setMetodoPago]   = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [showCortesia, setShowCortesia] = useState(false);
  const [cartaoAberto, setCartaoAberto] = useState(false);
  const [incluirServico, setIncluirServico] = useState(taxaServicoPct > 0);

  const servicoValor = Math.round(comanda.total * (taxaServicoPct / 100) * 100) / 100;
  const totalFinal   = incluirServico ? comanda.total + servicoValor : comanda.total;
  const { texto: tempo, urgente } = calcTempo(comanda);

  const pagar = (metodo: PagamentoMetodo, motivo?: string) => {
    setError(null);
    const servico = metodo === "cortesia" ? false : incluirServico;
    startTransition(async () => {
      const result = await registrarPagamento(comanda.id, metodo, servico, motivo);
      if (result && "error" in result) {
        setError(result.error as string);
      } else {
        setMetodoPago(
          metodo === "cortesia"
            ? `Cortesia${motivo ? ` — ${motivo}` : ""}`
            : METODO_LABEL[metodo],
        );
        setPago(true);
        onPago(metodo);
      }
    });
  };

  const handleImprimir = () => {
    imprimirConta({
      barNome,
      mesa: comanda.mesa,
      abertaEm: comanda.aberta_em,
      itens: comanda.itens.map(it => ({
        nome: it.nome, quantidade: it.quantidade, preco_total: it.preco_total,
      })),
      subtotal: comanda.total,
      incluirServico,
      servicoPct: taxaServicoPct,
      servicoValor,
      totalFinal,
    });
  };

  if (pago) {
    return (
      <div style={{
        height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 8, padding: 32,
      }}>
        <span style={{ fontSize: 40, lineHeight: 1, color: "var(--ok)" }}>✓</span>
        <p style={{ fontSize: 20, fontWeight: 700, color: "var(--ok)", margin: "4px 0 0" }}>{comanda.mesa}</p>
        <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>Pago via {metodoPago}</p>
        <p style={{ fontSize: 32, fontWeight: 900, color: "var(--fg)", margin: "8px 0 0", fontFamily: "var(--font-sans)", letterSpacing: "-0.5px" }}>
          {currency.format(totalFinal)}
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{
              fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px",
              color: urgente ? "var(--danger)" : "var(--fg-subtle)",
            }}>
              {urgente ? "⚠ " : ""}{tempo} aguardando
            </p>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--fg)", margin: 0, letterSpacing: "-0.3px" }}>
              {comanda.mesa}
            </h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleImprimir} title="Imprimir" style={{
              width: 36, height: 36, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
              cursor: "pointer", color: "var(--fg-subtle)", fontSize: 14,
            }}>🖨</button>
            <button onClick={onClose} style={{
              width: 36, height: 36, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
              cursor: "pointer", color: "var(--fg-subtle)", fontSize: 16, lineHeight: "1",
            }}>✕</button>
          </div>
        </div>
      </div>

      {/* Itens (scrollável) */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px" }}>
        {comanda.itens.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", padding: "24px 0", textAlign: "center" }}>
            Nenhum item
          </p>
        ) : comanda.itens.map((item, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 0", borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
              <span style={{ color: "var(--fg-subtle)", marginRight: 8 }}>{item.quantidade}×</span>
              {item.nome}
            </span>
            <span style={{ fontSize: 13, color: "var(--fg-subtle)", fontFamily: "var(--font-sans)", whiteSpace: "nowrap", marginLeft: 16 }}>
              {currency.format(item.preco_total)}
            </span>
          </div>
        ))}
      </div>

      {/* Totais + pagamento */}
      <div style={{ padding: "14px 24px 28px", flexShrink: 0, borderTop: "1px solid var(--border)" }}>

        {/* Subtotal */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>Subtotal</span>
          <span style={{ fontSize: 12, color: "var(--fg-subtle)", fontFamily: "var(--font-sans)" }}>
            {currency.format(comanda.total)}
          </span>
        </div>

        {/* Serviço toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setIncluirServico(v => !v)} style={{
              width: 34, height: 18, borderRadius: 9, border: "none",
              background: incluirServico
                ? "color-mix(in srgb, var(--accent-bright) 70%, transparent)"
                : "rgba(255,255,255,0.10)",
              position: "relative", cursor: "pointer", transition: "background 180ms", padding: 0, flexShrink: 0,
            }}>
              <span style={{
                position: "absolute", top: 2, left: incluirServico ? 17 : 2,
                width: 14, height: 14, borderRadius: "50%",
                background: "#fff", transition: "left 180ms",
              }} />
            </button>
            <span style={{ fontSize: 12, color: incluirServico ? "var(--fg-muted)" : "var(--fg-subtle)" }}>
              Serviço {taxaServicoPct}%
            </span>
          </div>
          <span style={{
            fontSize: 12, fontFamily: "var(--font-sans)", transition: "color 180ms",
            color: incluirServico ? "var(--fg-subtle)" : "rgba(255,255,255,0.15)",
          }}>
            {currency.format(servicoValor)}
          </span>
        </div>

        {/* Total */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          borderTop: "1px solid var(--border)", paddingTop: 12, marginBottom: 16,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)" }}>Total</span>
          <span style={{ fontSize: 28, fontWeight: 900, color: "var(--fg)", fontFamily: "var(--font-sans)", letterSpacing: "-0.5px" }}>
            {currency.format(totalFinal)}
          </span>
        </div>

        {error && <p style={{ fontSize: 12, color: "var(--danger)", margin: "0 0 10px" }}>{error}</p>}

        {/* Botões de pagamento */}
        {cartaoAberto ? (
          <div style={{ display: "flex", gap: 6 }}>
            {(["debito", "credito"] as PagamentoMetodo[]).map(key => (
              <button key={key}
                onClick={() => { pagar(key); setCartaoAberto(false); }}
                disabled={isPending}
                style={{
                  flex: 1, height: 48,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: "color-mix(in srgb, var(--fg) 6%, transparent)",
                  border: "1px solid var(--border)", borderRadius: 10,
                  cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.5 : 1,
                }}>
                <span style={{ fontSize: 15 }}>💳</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)" }}>
                  {key === "debito" ? "Débito" : "Crédito"}
                </span>
              </button>
            ))}
            <button onClick={() => setCartaoAberto(false)} style={{
              width: 48, height: 48, borderRadius: 10,
              border: "1px solid var(--border)",
              background: "color-mix(in srgb, var(--fg) 6%, transparent)",
              color: "var(--fg-subtle)", fontSize: 16, cursor: "pointer", flexShrink: 0,
            }}>✕</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {([
              { key: "pix",      label: "Pix",      icon: "⚡", primary: true,  action: () => pagar("pix") },
              { key: "dinheiro", label: "Dinheiro", icon: "💵", primary: true,  action: () => pagar("dinheiro") },
              { key: "cartao",   label: "Cartão",   icon: "💳", primary: false, action: () => setCartaoAberto(true) },
              { key: "cortesia", label: "Cortesia", icon: "🎁", primary: false, action: () => setShowCortesia(true) },
            ]).map(b => (
              <button key={b.key} onClick={b.action} disabled={isPending} style={{
                height: 48,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: b.primary
                  ? "var(--accent-bright)"
                  : "color-mix(in srgb, var(--fg) 6%, transparent)",
                border: b.primary ? "none" : "1px solid var(--border)",
                borderRadius: 10,
                cursor: isPending ? "not-allowed" : "pointer",
                opacity: isPending ? 0.5 : 1,
                WebkitTapHighlightColor: "transparent",
              }}>
                <span style={{ fontSize: 18 }}>{b.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: b.primary ? "#000" : "var(--fg)" }}>
                  {b.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showCortesia && (
        <CortesiaModal
          comanda={comanda}
          onConfirm={motivo => { setShowCortesia(false); pagar("cortesia", motivo); }}
          onClose={() => setShowCortesia(false)}
        />
      )}
    </div>
  );
}

// ─── Notificação ─────────────────────────────────────────────────────────────

function notificarNovaMesa() {
  try {
    const ctx  = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880,  ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
  } catch { /* contexto de áudio não disponível */ }
  try { navigator.vibrate?.([150, 60, 150]); } catch { /* ignore */ }
}

// ─── CaixaTela ───────────────────────────────────────────────────────────────
// Layout:
//   Desktop — fila (360px fixos) | painel de detalhe (flex)
//   Mobile  — fila (full) | bottom sheet ao selecionar

export function CaixaTela({
  comandas, insights, barNome, barId, turnoId, embedded = false, taxaServicoPct = 10,
}: {
  comandas: ComandaPendente[];
  insights: CaixaInsights;
  barNome: string;
  barId: string;
  turnoId: string;
  embedded?: boolean;
  taxaServicoPct?: number;
}) {
  const [listaAtual,    setListaAtual]    = useState(comandas);
  const [insightsAtual, setInsightsAtual] = useState(insights);
  const [pagos,         setPagos]         = useState(new Set<string>());
  const [selecionada,   setSelecionada]   = useState<ComandaPendente | null>(null);

  // ── Refetch via Supabase client (chamado pelo Realtime) ───────────────────
  const fetchComandas = useCallback(async () => {
    const supabase = createClient();

    const { data: raw } = await supabase
      .from("comandas")
      .select("id, total, aberta_em, fechada_em, mesa_id, mesas(numero, nome)")
      .eq("bar_id", barId)
      .eq("turno_id", turnoId)
      .eq("status", "aguardando_pagamento")
      .order("fechada_em", { ascending: true })
      .returns<{
        id: string; total: number; aberta_em: string; fechada_em: string | null;
        mesa_id: string | null; mesas: { numero: number; nome: string | null } | null;
      }[]>();

    if (!raw?.length) { setListaAtual([]); return; }

    const ids = raw.map(c => c.id);
    const { data: itensRaw } = await supabase
      .from("comanda_items")
      .select("comanda_id, quantidade, preco_total, variante_nome, produtos(nome)")
      .in("comanda_id", ids)
      .eq("status", "ativo")
      .returns<{
        comanda_id: string; quantidade: number; preco_total: number;
        variante_nome: string | null; produtos: { nome: string } | null;
      }[]>();

    const itensPorComanda = new Map<string, ComandaPendente["itens"]>();
    for (const item of itensRaw ?? []) {
      if (!item.produtos) continue;
      const nome = item.variante_nome
        ? `${item.produtos.nome} — ${item.variante_nome}`
        : item.produtos.nome;
      const lista = itensPorComanda.get(item.comanda_id) ?? [];
      lista.push({ nome, quantidade: item.quantidade, preco_total: item.preco_total });
      itensPorComanda.set(item.comanda_id, lista);
    }

    const novaLista = raw.map(c => ({
      id: c.id, total: c.total, aberta_em: c.aberta_em, fechada_em: c.fechada_em ?? null,
      mesa: c.mesas ? (c.mesas.nome ?? `Mesa ${c.mesas.numero}`) : "Balcão",
      itens: itensPorComanda.get(c.id) ?? [],
    }));

    setListaAtual(prev => {
      const idsAntigos = new Set(prev.map(c => c.id));
      if (novaLista.some(c => !idsAntigos.has(c.id))) notificarNovaMesa();
      return novaLista;
    });
  }, [barId, turnoId]);

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel("caixa-live")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "comandas",
        filter: `bar_id=eq.${barId}`,
      }, () => fetchComandas())
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [barId, fetchComandas]);

  // ── Callback após pagamento ───────────────────────────────────────────────
  const handlePago = useCallback((comanda: ComandaPendente, metodo: PagamentoMetodo) => {
    // Atualiza insights otimisticamente
    setInsightsAtual(prev => {
      const novoTotal = prev.totalTurno + comanda.total;
      const novaQtd   = prev.comandasPagas + 1;
      const metodosAtuais = [...prev.porMetodo];
      const idx = metodosAtuais.findIndex(m => m.metodo === metodo);
      if (idx >= 0) {
        metodosAtuais[idx] = {
          ...metodosAtuais[idx],
          total: metodosAtuais[idx].total + comanda.total,
          quantidade: metodosAtuais[idx].quantidade + 1,
        };
      } else {
        metodosAtuais.push({ metodo, total: comanda.total, quantidade: 1 });
      }
      return { totalTurno: novoTotal, comandasPagas: novaQtd, ticketMedio: novoTotal / novaQtd, porMetodo: metodosAtuais };
    });
    // Marca como pago e remove após animação
    setPagos(prev => new Set([...prev, comanda.id]));
    setTimeout(() => {
      setListaAtual(prev => prev.filter(c => c.id !== comanda.id));
      setPagos(prev => { const s = new Set(prev); s.delete(comanda.id); return s; });
      setSelecionada(prev => (prev?.id === comanda.id ? null : prev));
    }, 1200);
  }, []);

  // ── Quick-pay (botões direto na fila) ─────────────────────────────────────
  const quickPay = useCallback(async (comanda: ComandaPendente, metodo: PagamentoMetodo) => {
    const result = await registrarPagamento(
      comanda.id, metodo, taxaServicoPct > 0 && metodo !== "cortesia",
    );
    if (!result || !("error" in result)) {
      handlePago(comanda, metodo);
    }
  }, [taxaServicoPct, handlePago]);

  const vazio = listaAtual.length === 0;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      ...(embedded ? { height: "100%", overflow: "hidden" } : { minHeight: "100dvh" }),
    }}>

      {!embedded && (
        <AppHeader
          barNome={barNome}
          roleLabel="Caixa"
          right={vazio
            ? <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ok)" }}>✓ Limpo</span>
            : undefined
          }
        />
      )}

      <InsightsBar insights={insightsAtual} pendentes={listaAtual.length} />

      {/* ── Área principal ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Fila (queue) */}
        <div
          style={{
            width: selecionada ? 360 : "100%",
            flexShrink: 0,
            overflowY: "auto",
            borderRight: selecionada ? "1px solid var(--border)" : "none",
          }}
          className={selecionada ? "hidden md:block" : ""}
        >
          {vazio ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "100%", gap: 8, padding: 48,
            }}>
              <p style={{ fontSize: 32, margin: 0, color: "var(--ok)" }}>✓</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Nada pendente</p>
              <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>
                Todas as comandas foram pagas.
              </p>
            </div>
          ) : (
            listaAtual.map(c => (
              <QueueRow
                key={c.id}
                comanda={c}
                selected={selecionada?.id === c.id}
                pago={pagos.has(c.id)}
                onSelect={() => setSelecionada(prev => prev?.id === c.id ? null : c)}
                onQuickPay={metodo => quickPay(c, metodo)}
                taxaServicoPct={taxaServicoPct}
              />
            ))
          )}
        </div>

        {/* Painel de detalhe — desktop */}
        {selecionada ? (
          <div className="hidden md:flex" style={{ flex: 1, overflow: "hidden" }}>
            <DetailPanel
              key={selecionada.id}
              comanda={selecionada}
              barNome={barNome}
              taxaServicoPct={taxaServicoPct}
              onPago={metodo => handlePago(selecionada, metodo)}
              onClose={() => setSelecionada(null)}
            />
          </div>
        ) : !vazio ? (
          /* Dica quando nada está selecionado (desktop) */
          <div className="hidden md:flex" style={{ flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
            <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0, opacity: 0.5 }}>
              Use ⚡ Pix ou 💵 Din. para pagamento direto
            </p>
            <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0, opacity: 0.5 }}>
              ou ··· para ver detalhes
            </p>
          </div>
        ) : null}
      </div>

      {/* Bottom sheet — mobile */}
      {selecionada && (
        <div className="md:hidden">
          <div
            onClick={() => setSelecionada(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 60 }}
          />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 61,
            background: "var(--bg-elevated)", borderTop: "1px solid var(--border)",
            borderRadius: "12px 12px 0 0", maxHeight: "90dvh", display: "flex", flexDirection: "column",
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 4, background: "var(--border-strong)", margin: "12px auto 0", flexShrink: 0 }} />
            <DetailPanel
              key={selecionada.id}
              comanda={selecionada}
              barNome={barNome}
              taxaServicoPct={taxaServicoPct}
              onPago={metodo => handlePago(selecionada, metodo)}
              onClose={() => setSelecionada(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
