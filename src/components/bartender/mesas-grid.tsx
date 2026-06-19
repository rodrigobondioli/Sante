"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Comanda, Mesa } from "@/types/database";
import { abrirComanda } from "@/lib/bartender/actions";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function tempoAberta(abertaEm: string) {
  const diff = Math.floor((Date.now() - new Date(abertaEm).getTime()) / 60000);
  if (diff < 1) return "agora";
  if (diff < 60) return `${diff}min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

export interface MesaComStatus {
  mesa: Mesa;
  comanda: Comanda | null;
}

// ─── Card individual ──────────────────────────────────────────────────────────

const CARD_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: 160,
  borderRadius: 16,
  overflow: "hidden",
  position: "relative",
  transition: "transform 0.15s, box-shadow 0.15s",
};

function MesaCard({
  label,
  comanda,
  capacidade,
  href,
  onAbrir,
}: {
  label: string;
  comanda: Comanda | null;
  capacidade?: number | null;
  href?: string;
  onAbrir?: () => void;
}) {
  const querPagar = comanda?.status === "aguardando_pagamento";
  const ocupada = comanda !== null;

  // ── Livre ──
  if (!ocupada) {
    const inner = (
      <div style={{
        ...CARD_STYLE,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        padding: "18px 18px 16px",
        justifyContent: "space-between",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.60)", letterSpacing: "-0.2px" }}>
            {label}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 99,
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.28)",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            Livre
          </span>
        </div>

        <div>
          <p style={{
            fontSize: 13, fontWeight: 600,
            color: "rgba(255,255,255,0.25)",
            margin: "0 0 6px",
          }}>
            + Abrir comanda
          </p>
          {capacidade && (
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", margin: 0 }}>
              {capacidade} lugares
            </p>
          )}
        </div>
      </div>
    );

    if (onAbrir) {
      return (
        <form action={onAbrir} style={{ display: "contents" }}>
          <button type="submit" style={{ all: "unset", display: "block" }}>
            {inner}
          </button>
        </form>
      );
    }
    return inner;
  }

  // ── Ocupada ──
  const accentColor = querPagar ? "#f59e0b" : "#7c3aed";
  const bgColor     = querPagar ? "rgba(120,53,0,0.28)"  : "rgba(38,0,120,0.22)";
  const borderColor = querPagar ? "rgba(245,158,11,0.40)" : "rgba(109,40,217,0.35)";
  const totalColor  = querPagar ? "#fbbf24" : "white";

  return (
    <Link
      href={href!}
      style={{
        ...CARD_STYLE,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        textDecoration: "none",
        padding: "0",
        ...(querPagar ? { boxShadow: `0 0 0 1px rgba(245,158,11,0.12), 0 4px 24px rgba(245,158,11,0.08)` } : {}),
      }}
    >
      {/* Barra de cor no topo */}
      <div style={{
        height: 3,
        background: querPagar
          ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
          : "linear-gradient(90deg, #6d28d9, #8b5cf6)",
        flexShrink: 0,
      }} />

      <div style={{ flex: 1, padding: "14px 16px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {/* Topo: nome + badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "white", letterSpacing: "-0.3px", lineHeight: 1.1 }}>
            {label}
          </span>
          {querPagar ? (
            <span style={{
              fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 99,
              background: "rgba(245,158,11,0.20)", color: "#fbbf24",
              border: "1px solid rgba(245,158,11,0.35)",
              textTransform: "uppercase", letterSpacing: "0.06em",
              flexShrink: 0, whiteSpace: "nowrap",
            }}>
              🧾 Quer pagar
            </span>
          ) : (
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#4ade80",
              boxShadow: "0 0 6px rgba(74,222,128,0.6)",
              flexShrink: 0, marginTop: 4,
            }} />
          )}
        </div>

        {/* Total — destaque */}
        <div>
          <p style={{
            fontSize: 22, fontWeight: 900,
            color: totalColor,
            margin: 0,
            letterSpacing: "-0.5px",
            fontVariantNumeric: "tabular-nums",
          }}>
            {currency.format(comanda.total)}
          </p>
        </div>

        {/* Rodapé: tempo + capacidade */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: querPagar ? "rgba(251,191,36,0.65)" : "rgba(255,255,255,0.38)",
            background: querPagar ? "rgba(245,158,11,0.10)" : "rgba(255,255,255,0.06)",
            borderRadius: 6, padding: "2px 7px",
          }}>
            {tempoAberta(comanda.aberta_em)}
          </span>
          {capacidade && (
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>
              {capacidade} lug.
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Grid principal ───────────────────────────────────────────────────────────

interface MesasGridProps {
  barId: string;
  initialMesas: MesaComStatus[];
  initialBalcao: Comanda | null;
}

export function MesasGrid({ barId, initialMesas, initialBalcao }: MesasGridProps) {
  const [mesas, setMesas] = useState<MesaComStatus[]>(initialMesas);
  const [balcao, setBalcao] = useState<Comanda | null>(initialBalcao);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`bartender_comandas_${barId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "comandas",
        filter: `bar_id=eq.${barId}`,
      }, (payload) => {
        const atualizada = payload.new as Comanda;
        if (!atualizada.mesa_id) {
          if (atualizada.status === "aberta" || atualizada.status === "aguardando_pagamento") {
            setBalcao(atualizada);
          } else {
            setBalcao(prev => prev?.id === atualizada.id ? null : prev);
          }
          return;
        }
        setMesas(prev => prev.map(m => {
          if (m.comanda?.id !== atualizada.id) return m;
          if (atualizada.status === "aberta" || atualizada.status === "aguardando_pagamento") {
            return { ...m, comanda: atualizada };
          }
          return { ...m, comanda: null };
        }));
      })
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "comandas",
        filter: `bar_id=eq.${barId}`,
      }, (payload) => {
        const nova = payload.new as Comanda;
        if (!nova.mesa_id) { setBalcao(nova); return; }
        setMesas(prev => prev.map(m =>
          m.mesa.id === nova.mesa_id ? { ...m, comanda: nova } : m
        ));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [barId]);

  const totalOcupadas = mesas.filter(m => m.comanda !== null).length + (balcao ? 1 : 0);
  const querPagarCount =
    mesas.filter(m => m.comanda?.status === "aguardando_pagamento").length +
    (balcao?.status === "aguardando_pagamento" ? 1 : 0);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p style={{
            fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase", letterSpacing: "0.08em", margin: 0,
          }}>
            Mesas
          </p>
          <p style={{ fontSize: 20, fontWeight: 700, color: "white", margin: "4px 0 0", letterSpacing: "-0.3px" }}>
            {totalOcupadas === 0
              ? "Todas as mesas livres"
              : `${totalOcupadas} ocupada${totalOcupadas > 1 ? "s" : ""}`}
          </p>
        </div>
        {querPagarCount > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(245,158,11,0.12)",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: 10, padding: "6px 12px",
          }}>
            <span style={{ fontSize: 13 }}>🧾</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24" }}>
              {querPagarCount} quer{querPagarCount > 1 ? "em" : ""} pagar
            </span>
          </div>
        )}
      </div>

      {mesas.length === 0 && (
        <div style={{
          background: "rgba(255,255,255,0.04)", borderRadius: 12,
          padding: "28px 20px", textAlign: "center", marginBottom: 16,
        }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.40)", margin: 0 }}>Nenhuma mesa cadastrada.</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: "8px 0 0" }}>
            Configure as mesas em Dashboard → Mesas.
          </p>
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 14,
      }}>
        {mesas.map(({ mesa, comanda }) => {
          const label = mesa.nome ?? `Mesa ${mesa.numero}`;
          return (
            <MesaCard
              key={mesa.id}
              label={label}
              comanda={comanda}
              capacidade={mesa.capacidade}
              href={comanda ? `/bartender/${comanda.id}` : undefined}
              onAbrir={comanda ? undefined : abrirComanda.bind(null, mesa.id)}
            />
          );
        })}

        {/* Balcão */}
        <MesaCard
          label="Balcão"
          comanda={balcao}
          href={balcao ? `/bartender/${balcao.id}` : undefined}
          onAbrir={balcao ? undefined : abrirComanda.bind(null, null)}
        />
      </div>
    </div>
  );
}
