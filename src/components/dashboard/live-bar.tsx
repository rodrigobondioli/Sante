"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface LiveData {
  faturamento: number;
  pessoas: number;
  mesas: number;
  drinks: number;
}

interface LiveBarProps {
  turnoId: string;
  barId: string;
  faturamentoInicial: number;
  pessoasInicial: number;
  mesasInicial: number;
  drinksInicial: number;
}

const overline: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--fg-subtle)",
  marginBottom: 2,
  display: "block",
};

const value: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontVariantNumeric: "tabular-nums",
  fontWeight: 600,
  color: "var(--fg)",
  whiteSpace: "nowrap",
};

export function LiveBar({
  turnoId,
  barId,
  faturamentoInicial,
  pessoasInicial,
  mesasInicial,
  drinksInicial,
}: LiveBarProps) {
  const [data, setData] = useState<LiveData>({
    faturamento: faturamentoInicial,
    pessoas: pessoasInicial,
    mesas: mesasInicial,
    drinks: drinksInicial,
  });

  const fetchLiveData = useCallback(async () => {
    const supabase = createClient();

    // Comandas abertas do turno → pessoas + mesas
    const { data: comandas } = await supabase
      .from("comandas")
      .select("id, mesa_id")
      .eq("turno_id", turnoId)
      .eq("status", "aberta")
      .returns<{ id: string; mesa_id: string | null }[]>();

    const pessoas = (comandas ?? []).length;
    const mesas = new Set(
      (comandas ?? []).map(c => c.mesa_id).filter(Boolean)
    ).size;

    const comandaIds = (comandas ?? []).map(c => c.id);

    if (comandaIds.length === 0) {
      setData({ faturamento: 0, pessoas: 0, mesas: 0, drinks: 0 });
      return;
    }

    // Itens das comandas abertas do turno
    const { data: items } = await supabase
      .from("comanda_items")
      .select("quantidade, preco_total")
      .in("comanda_id", comandaIds)
      .eq("status", "ativo")
      .returns<{ quantidade: number; preco_total: number }[]>();

    const faturamento = (items ?? []).reduce((s, i) => s + Number(i.preco_total), 0);
    const drinks = (items ?? []).reduce((s, i) => s + Number(i.quantidade), 0);

    setData({ faturamento, pessoas, mesas, drinks });
  }, [turnoId, barId]);

  useEffect(() => {
    const supabase = createClient();

    const comandasChannel = supabase
      .channel(`live-comandas-${turnoId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comandas", filter: `turno_id=eq.${turnoId}` },
        () => { fetchLiveData(); }
      )
      .subscribe();

    const itemsChannel = supabase
      .channel(`live-items-${turnoId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comanda_items" },
        () => { fetchLiveData(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(comandasChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [turnoId, fetchLiveData]);

  const metrics = [
    { label: "Faturamento", val: currency.format(data.faturamento) },
    { label: "Comandas",    val: String(data.pessoas) },
    { label: "Mesas",       val: String(data.mesas) },
    { label: "Drinks",      val: String(data.drinks) },
  ];

  const liveBadge = (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
      <span
        className="animate-live-pulse"
        style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--ok)", display: "block", flexShrink: 0,
        }}
      />
      <span style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.12em",
        color: "var(--ok)", textTransform: "uppercase",
      }}>
        Ao vivo
      </span>
    </div>
  );

  return (
    <div style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>

      {/* ── Mobile: badge + 2×2 grid ── */}
      <div className="lg:hidden px-5 py-3">
        <div style={{ marginBottom: 10 }}>{liveBadge}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
          {metrics.map(m => (
            <div key={m.label}>
              <span style={overline}>{m.label}</span>
              <span style={{ ...value, fontSize: 15 }}>{m.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Desktop: tudo em linha ── */}
      <div
        className="hidden lg:flex"
        style={{ alignItems: "center", padding: "0 40px" }}
      >
        <div style={{ padding: "10px 0" }}>{liveBadge}</div>

        <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 20px", flexShrink: 0 }} />

        {metrics.map((m, i) => (
          <div
            key={m.label}
            style={{
              display: "flex", flexDirection: "column",
              padding: "10px 20px",
              borderLeft: i > 0 ? "1px solid var(--border)" : "none",
            }}
          >
            <span style={overline}>{m.label}</span>
            <span style={{ ...value, fontSize: 14 }}>{m.val}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
