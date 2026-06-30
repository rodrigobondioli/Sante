"use client";

const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

interface ProximaMelhorAcaoProps {
  produtoNome: string;
  margemPercentual: number | null;
  faturamento: number;
  quantidadeVendida: number;
  categoria: string;
  ranking?: RankingItem[];
}

interface RankingItem {
  produtoId: string;
  produtoNome: string;
  margemPercentual: number | null;
  faturamento: number;
}

export function ProximaMelhorAcao({
  produtoNome,
  margemPercentual,
  categoria,
  ranking = [],
}: ProximaMelhorAcaoProps) {
  const isSubofertado = categoria !== "star" && categoria !== "cash_cow";

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "28px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 32,
      }}
    >
      {/* Lado esquerdo — headline + razão */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Badge overline */}
        <p style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--accent)",
          margin: "0 0 14px",
        }}>
          Superbar AI · Recomendação Tática
        </p>

        {/* Headline principal */}
        <p style={{
          fontSize: "clamp(20px, 2.2vw, 28px)",
          fontWeight: 700,
          color: "var(--fg)",
          margin: "0 0 10px",
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
        }}>
          Oriente a equipe a oferecer {produtoNome} agora.
        </p>

        {/* Razão */}
        <p style={{
          fontSize: 13,
          color: "var(--fg-subtle)",
          lineHeight: 1.65,
          margin: 0,
          maxWidth: 560,
        }}>
          {isSubofertado
            ? `Margem de ${percent.format(margemPercentual ?? 0)}% e apareceu pouco hoje. Sugestão ativa nas próximas 2h pode mais que dobrar as vendas com zero esforço.`
            : `Já vende bem e tem margem de ${percent.format(margemPercentual ?? 0)}%. Manter no topo das sugestões é o caminho de menor esforço para crescer a receita.`}
        </p>
      </div>

      {/* Lado direito — CTA + ranking compacto */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 20, flexShrink: 0 }}>
        <a
          href="/dashboard/cardapio"
          style={{
            background: "var(--accent)",
            color: "var(--accent-fg)",
            fontSize: 13,
            fontWeight: 700,
            padding: "11px 26px",
            borderRadius: 9999,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            lineHeight: 1,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
        >
          Orientar Equipe →
        </a>

        {/* Outros de alta margem */}
        {ranking.filter(p => p.margemPercentual !== null).length > 0 && (
          <div style={{ textAlign: "right" }}>
            <p style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--fg-subtle)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              margin: "0 0 8px",
            }}>
              Outros de alta margem
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {ranking.filter(p => p.margemPercentual !== null).slice(0, 3).map(p => (
                <div key={p.produtoId} style={{ display: "flex", gap: 12, justifyContent: "flex-end", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{p.produtoNome}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--fg-muted)", fontVariantNumeric: "tabular-nums", minWidth: 32, textAlign: "right" }}>
                    {percent.format(p.margemPercentual ?? 0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
