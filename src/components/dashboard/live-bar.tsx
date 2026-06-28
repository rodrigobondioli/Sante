"use client";

import { useCallback, useEffect, useState } from "react";
import { TrendingUp, Activity, Receipt, Zap, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface LiveData {
  faturamento: number;
  pessoas: number;
  drinks: number;
}

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
}

type KpiItem = {
  label: string;
  value: string;
  footer: React.ReactNode;
  delta?: number | null;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  destaque?: boolean;
};

function DeltaBadge({ pct }: { pct: number | null | undefined }) {
  if (pct == null) return null;
  const isPositive = pct > 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700,
      color: "white",
      background: "rgba(255,255,255,0.12)",
      padding: "2px 6px", borderRadius: 3,
    }}>
      <svg width="6" height="6" viewBox="0 0 6 6" style={{ flexShrink: 0 }}>
        {isPositive
          ? <path d="M3 0.5L5.8 5.5H0.2L3 0.5Z" fill="currentColor" />
          : <path d="M3 5.5L0.2 0.5H5.8L3 5.5Z" fill="currentColor" />
        }
      </svg>
      {isPositive ? "+" : ""}{Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function sub(text: string) {
  return (
    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-mono)" }}>
      {text}
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
}: LiveBarProps) {
  const [data, setData] = useState<LiveData>({
    faturamento: faturamentoInicial,
    pessoas: pessoasInicial,
    drinks: drinksInicial,
  });

  const fetchLiveData = useCallback(async () => {
    const supabase = createClient();
    const { data: comandas } = await supabase
      .from("comandas")
      .select("id")
      .eq("turno_id", turnoId)
      .eq("status", "aberta")
      .returns<{ id: string }[]>();
    const pessoas = (comandas ?? []).length;
    const comandaIds = (comandas ?? []).map(c => c.id);
    if (comandaIds.length === 0) {
      setData(d => ({ ...d, pessoas: 0 }));
      return;
    }
    const { data: items } = await supabase
      .from("comanda_items")
      .select("quantidade, preco_total")
      .in("comanda_id", comandaIds)
      .eq("status", "ativo")
      .returns<{ quantidade: number; preco_total: number }[]>();
    const faturamento = (items ?? []).reduce((s, i) => s + Number(i.preco_total), 0);
    const drinks = (items ?? []).reduce((s, i) => s + Number(i.quantidade), 0);
    setData({ faturamento, pessoas, drinks });
  }, [turnoId, barId]);

  useEffect(() => {
    const supabase = createClient();
    const ch1 = supabase
      .channel(`live-comandas-${turnoId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comandas", filter: `turno_id=eq.${turnoId}` }, () => fetchLiveData())
      .subscribe();
    const ch2 = supabase
      .channel(`live-items-${turnoId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comanda_items" }, () => fetchLiveData())
      .subscribe();
    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [turnoId, fetchLiveData]);

  const ticketMedio = data.pessoas > 0 ? data.faturamento / data.pessoas : 0;

  const liveDot = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span
        className="animate-live-pulse"
        style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.80)", display: "block", flexShrink: 0 }}
      />
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", color: "rgba(255,255,255,0.70)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
        Ao Vivo
      </span>
    </span>
  );

  const kpis: KpiItem[] = [
    {
      label: "Faturamento",
      value: currency.format(data.faturamento),
      footer: liveDot,
      delta: comparacaoFaturamento,
      destaque: true,
    },
    {
      label: "Margem estimada",
      value: margemEstimada != null ? `${margemEstimada}%` : "—",
      footer: margemEstimada == null
        ? sub("custo incompleto")
        : cmvParcial ? sub("estimada parcial") : sub("do turno"),
      delta: null,
      icon: TrendingUp,
    },
    {
      label: "Ticket médio",
      value: currency.format(ticketMedio),
      footer: sub("por comanda"),
      delta: comparacaoTicket,
      icon: Receipt,
    },
    {
      label: "Ritmo do turno",
      value: comparacaoFaturamento != null
        ? `${comparacaoFaturamento > 0 ? "+" : ""}${comparacaoFaturamento.toFixed(1)}%`
        : "—",
      footer: comparacaoFaturamento != null
        ? sub("vs turno anterior")
        : sub("aguardando histórico"),
      delta: null,
      icon: Activity,
    },
    {
      label: "Drinks vendidos",
      value: String(data.drinks),
      footer: sub("neste turno"),
      delta: null,
      icon: Zap,
    },
    {
      label: "Comandas abertas",
      value: String(data.pessoas),
      footer: sub("mesas ativas"),
      delta: null,
      icon: Users,
    },
  ];

  return (
    <div style={{ background: "var(--bg-inset)", border: "none", borderRadius: 0, padding: "24px 28px" }}>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" style={{ gap: 20 }}>
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                {Icon && <Icon size={11} color="rgba(255,255,255,0.40)" />}
                <span style={{
                  fontSize: "0.58rem",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)",
                }}>
                  {kpi.label}
                </span>
              </div>
              <p style={{
                fontSize: kpi.destaque ? "2.8rem" : "2rem",
                fontWeight: kpi.destaque ? 600 : 700,
                color: "#FFFFFF",
                fontFamily: "var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
                margin: "0 0 8px",
                letterSpacing: kpi.destaque ? "-0.02em" : undefined,
              }}>
                {kpi.value}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {kpi.footer}
                {kpi.delta != null && <DeltaBadge pct={kpi.delta} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
