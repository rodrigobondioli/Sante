"use client";

import { useState, useTransition } from "react";
import { marcarInsightLido } from "@/lib/inteligencia/actions";
import type { InsightPendente } from "@/lib/inteligencia/queries";
import { CARD, LABEL } from "@/lib/ui";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function InsightCard({
  insight,
  onEntendido,
  loading,
}: {
  insight: InsightPendente;
  onEntendido: (id: string) => void;
  loading: boolean;
}) {
  const impacto = insight.impacto_valor;
  const isNegativo = impacto !== null && impacto < 0;

  return (
    <div
      style={{
        ...CARD,
        padding: "20px 24px",
        borderLeft: "3px solid #ef4444",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        opacity: loading ? 0.5 : 1,
        transition: "opacity 200ms",
      }}
    >
      {/* Tipo + data */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ ...LABEL, color: "#ef4444" }}>
          {insight.tipo.replace(/_/g, " ")}
        </p>
        <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
          {formatData(insight.criado_em)}
        </p>
      </div>

      {/* Título */}
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0, lineHeight: 1.3 }}>
        {insight.titulo}
      </p>

      {/* Descrição */}
      <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0, lineHeight: 1.6 }}>
        {insight.descricao}
      </p>

      {/* Rodapé: impacto + botão */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        {impacto !== null ? (
          <p style={{
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: isNegativo ? "#ef4444" : "#22c55e",
            margin: 0,
          }}>
            {isNegativo ? "−" : "+"}{fmt(Math.abs(impacto))}
          </p>
        ) : (
          <span />
        )}

        <button
          disabled={loading}
          onClick={() => onEntendido(insight.id)}
          style={{
            background: "none",
            border: "1px solid var(--border-strong)",
            borderRadius: 4,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--fg-muted)",
            cursor: loading ? "default" : "pointer",
            transition: "border-color 150ms, color 150ms",
          }}
          className="hover:!text-[var(--fg)] hover:!border-[var(--fg-subtle)]"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

export function InsightCards({ insights }: { insights: InsightPendente[] }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const visible = insights.filter((i) => !hidden.has(i.id));

  function handleEntendido(id: string) {
    setPending((prev) => new Set([...prev, id])); // spinner visual
    startTransition(async () => {
      await marcarInsightLido(id);
      setHidden((prev) => new Set([...prev, id])); // remove após confirmação
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    });
  }

  if (visible.length === 0) {
    return (
      <div
        style={{
          ...CARD,
          padding: "48px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 28, margin: 0 }}>✓</p>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: 0 }}>
          Tudo certo por enquanto
        </p>
        <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>
          Nenhum alerta pendente. Os insights aparecem aqui quando o sistema identificar algo que precisa da sua atenção.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {visible.map((insight) => (
        <InsightCard
          key={insight.id}
          insight={insight}
          onEntendido={handleEntendido}
          loading={pending.has(insight.id)}
        />
      ))}
    </div>
  );
}
