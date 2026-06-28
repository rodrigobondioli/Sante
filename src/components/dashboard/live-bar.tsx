"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface LiveBarProps {
  turnoId: string;
  barId: string;
  faturamentoInicial: number;
  pessoasInicial: number;
  drinksInicial: number;
  comparacaoFaturamento?: number | null;
  comparacaoTicket?: number | null;
  margemEstimada?: number | null;
  cmvParcial?: boolean;
  barNome?: string;
  dataFormatada?: string;
  metaProgresso?: number;
  metaFalta?: number;
  metaAtingida?: boolean;
  meta?: number;
}

function Delta({ pct }: { pct: number | null | undefined }) {
  if (pct == null) return <span style={{ fontSize: 11, color: "var(--fg-subtle)", fontWeight: 400 }}>—</span>;
  const pos = pct >= 0;
  const color = pos ? "var(--ok)" : "var(--danger)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11 }}>
      <svg width="6" height="6" viewBox="0 0 6 6" style={{ flexShrink: 0 }}>
        {pos
          ? <path d="M3 0.5L5.8 5.5H0.2L3 0.5Z" fill={color} />
          : <path d="M3 5.5L0.2 0.5H5.8L3 5.5Z" fill={color} />}
      </svg>
      <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color }}>{Math.abs(pct).toFixed(1)}%</span>
      <span style={{ fontWeight: 400, color: "var(--fg-subtle)" }}>vs ontem</span>
    </span>
  );
}

export function LiveBar({
  turnoId,
  barId,
  faturamentoInicial,
  pessoasInicial,
  drinksInicial,
  comparacaoFaturamento,
  comparacaoTicket,
  margemEstimada,
  cmvParcial,
  barNome,
  dataFormatada,
  metaProgresso = 0,
  metaFalta = 0,
  metaAtingida = false,
  meta = 0,
}: LiveBarProps) {
  const [data, setData] = useState({ faturamento: faturamentoInicial, pessoas: pessoasInicial, drinks: drinksInicial });

  const fetchLiveData = useCallback(async () => {
    const supabase = createClient();
    const { data: comandas } = await supabase.from("comandas").select("id").eq("turno_id", turnoId).eq("status", "aberta").returns<{ id: string }[]>();
    const pessoas = (comandas ?? []).length;
    const ids = (comandas ?? []).map(c => c.id);
    if (!ids.length) { setData(d => ({ ...d, pessoas: 0 })); return; }
    const { data: items } = await supabase.from("comanda_items").select("quantidade, preco_total").in("comanda_id", ids).eq("status", "ativo").returns<{ quantidade: number; preco_total: number }[]>();
    const faturamento = (items ?? []).reduce((s, i) => s + Number(i.preco_total), 0);
    const drinks = (items ?? []).reduce((s, i) => s + Number(i.quantidade), 0);
    setData({ faturamento, pessoas, drinks });
  }, [turnoId, barId]);

  useEffect(() => {
    const supabase = createClient();
    const ch1 = supabase.channel(`live-cmd-${turnoId}`).on("postgres_changes", { event: "*", schema: "public", table: "comandas", filter: `turno_id=eq.${turnoId}` }, () => fetchLiveData()).subscribe();
    const ch2 = supabase.channel(`live-itm-${turnoId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "comanda_items" }, () => fetchLiveData()).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [turnoId, fetchLiveData]);

  const ticketMedio = data.pessoas > 0 ? data.faturamento / data.pessoas : 0;
  const margemValor = margemEstimada != null ? `${(100 - margemEstimada).toFixed(0)}%` : "—";
  const margemSub = margemEstimada == null ? "configurar custos"
    : cmvParcial ? "estimativa parcial"
    : margemEstimada < 30 ? "excelente"
    : margemEstimada < 36 ? "saudável"
    : margemEstimada < 42 ? "atenção"
    : "crítico";
  const margemColor = margemEstimada == null ? "var(--fg)"
    : margemEstimada < 36 ? "var(--ok)"
    : margemEstimada > 42 ? "var(--danger)"
    : "var(--fg)";

  return (
    <div style={{ padding: "24px 32px 0" }}>
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "22px 28px 24px",
        display: "flex",
        alignItems: "stretch",
      }}>

        {/* ── Esquerda: status + 3 KPIs ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Status row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span
                className="animate-live-pulse"
                style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ok)", display: "block", flexShrink: 0 }}
              />
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ok)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Ao Vivo</span>
            </span>
            <span style={{ color: "var(--fg-subtle)", fontSize: 10 }}>·</span>
            <span style={{ fontSize: 11, color: "var(--fg-subtle)", fontWeight: 400 }}>Turno aberto</span>
            {dataFormatada && (
              <>
                <span style={{ color: "var(--fg-subtle)", fontSize: 10 }}>·</span>
                <span style={{ fontSize: 11, color: "var(--fg-subtle)", fontWeight: 400 }}>{dataFormatada}</span>
              </>
            )}
          </div>

          {/* 3 KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
            {[
              { label: "Faturamento", value: currency.format(data.faturamento), sub: <Delta pct={comparacaoFaturamento} />, color: "var(--fg)" },
              { label: "Ticket Médio", value: data.pessoas > 0 ? currency.format(ticketMedio) : "—", sub: <Delta pct={comparacaoTicket} />, color: "var(--fg)" },
              { label: "Margem", value: margemValor, sub: <span style={{ fontSize: 11, color: "var(--fg-subtle)", fontWeight: 400 }}>{margemSub}</span>, color: margemColor },
            ].map((kpi, i) => (
              <div key={i} style={{
                paddingLeft: i > 0 ? 28 : 0,
                paddingRight: i < 2 ? 28 : 0,
                borderLeft: i > 0 ? "1px solid var(--border)" : "none",
              }}>
                {/* Label */}
                <p style={{
                  fontSize: 10, fontWeight: 500, textTransform: "uppercase",
                  letterSpacing: "0.1em", color: "var(--fg-subtle)",
                  margin: "0 0 8px",
                }}>
                  {kpi.label}
                </p>
                {/* Value */}
                <p style={{
                  fontSize: 28, fontWeight: 800, color: kpi.color,
                  fontVariantNumeric: "tabular-nums", lineHeight: 1,
                  margin: "0 0 9px", letterSpacing: "-0.025em",
                }}>
                  {kpi.value}
                </p>
                {/* Sub */}
                {kpi.sub}
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ width: 1, background: "var(--border)", margin: "0 28px", flexShrink: 0 }} />

        {/* ── Direita: meta + comandas ── */}
        <div style={{ width: 172, flexShrink: 0, display: "flex", flexDirection: "column" }}>

          {/* Meta label */}
          <p style={{
            fontSize: 10, fontWeight: 500, textTransform: "uppercase",
            letterSpacing: "0.1em", color: "var(--fg-subtle)", margin: "0 0 6px",
          }}>
            Meta do Mês
          </p>
          {/* Meta value */}
          <p style={{
            fontSize: 40, fontWeight: 800, color: "var(--fg)",
            fontVariantNumeric: "tabular-nums", lineHeight: 1,
            margin: "0 0 auto", letterSpacing: "-0.04em",
          }}>
            {meta > 0 ? `${metaProgresso}%` : "—"}
          </p>

          {meta > 0 ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ height: 3, background: "var(--border-strong)", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ height: 3, background: "var(--accent)", borderRadius: 2, width: `${metaProgresso}%`, transition: "width 0.6s" }} />
              </div>
              <p style={{ fontSize: 11, color: "var(--fg-subtle)", fontWeight: 400, margin: 0 }}>
                {metaAtingida ? "meta atingida ✓" : `falta ${currency.format(metaFalta)}`}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: 11, color: "var(--fg-subtle)", fontWeight: 400, marginTop: 10 }}>sem meta definida</p>
          )}

          {/* Comandas */}
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <p style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-subtle)", margin: "0 0 5px" }}>
              Comandas
            </p>
            <p style={{ fontSize: 24, fontWeight: 800, color: "var(--fg)", fontVariantNumeric: "tabular-nums", lineHeight: 1, letterSpacing: "-0.02em" }}>
              {data.pessoas}
            </p>
            <p style={{ fontSize: 11, color: "var(--fg-subtle)", fontWeight: 400, margin: "4px 0 0" }}>abertas agora</p>
          </div>
        </div>

      </div>
    </div>
  );
}
