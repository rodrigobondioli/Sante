"use client";

const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

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
  faturamento,
  categoria,
  ranking = [],
}: ProximaMelhorAcaoProps) {
  const isSubofertado = categoria !== "star" && categoria !== "cash_cow";
  const rankingFiltrado = ranking.filter(p => p.margemPercentual !== null).slice(0, 4);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16 }}>

      {/* ── Card esquerdo — destaque principal ── */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "28px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        {/* Overline */}
        <span style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#F59E0B",
          border: "1px solid #F59E0B",
          background: "transparent",
          padding: "3px 10px",
          borderRadius: 9999,
        }}>
          Superbar AI · Bebida mais lucrativa do momento
        </span>

        {/* Nome do produto */}
        <p style={{
          fontSize: "clamp(22px, 2.4vw, 32px)",
          fontWeight: 700,
          color: "#FFFFFF",
          margin: 0,
          lineHeight: 1.15,
          letterSpacing: "-0.03em",
        }}>
          {produtoNome}
        </p>

        {/* Margem + faturamento */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#22C55E",
            border: "1px solid var(--border)",
            borderRadius: 9999,
            padding: "2px 10px",
            fontVariantNumeric: "tabular-nums",
          }}>
            {percent.format(margemPercentual ?? 0)}% margem
          </span>
          {faturamento > 0 && (
            <span style={{ fontSize: 12, color: "#A1A1AA", fontVariantNumeric: "tabular-nums" }}>
              {currency.format(faturamento)} gerado hoje
            </span>
          )}
        </div>

        {/* Razão */}
        <p style={{ fontSize: 13, color: "#A1A1AA", lineHeight: 1.6, margin: 0, maxWidth: 520 }}>
          {isSubofertado
            ? `Apareceu pouco hoje — sugerir ativamente nas próximas 2h pode mais que dobrar as vendas com zero esforço.`
            : `Já lidera em vendas. Manter no topo das sugestões é o caminho de menor esforço para crescer a receita.`}
        </p>
      </div>

      {/* ── Card direito — outros de alta margem ── */}
      {rankingFiltrado.length > 0 && (
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          minWidth: 240,
        }}>
          <p style={{
            fontSize: 9,
            fontWeight: 700,
            color: "#A1A1AA",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            margin: "0 0 16px",
          }}>
            Outros de alta margem
          </p>

          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
            {rankingFiltrado.map((p, i) => (
              <div key={p.produtoId} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 24,
                padding: "10px 0",
                borderBottom: i < rankingFiltrado.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <span style={{ fontSize: 13, color: "#FFFFFF" }}>{p.produtoNome}</span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#22C55E",
                  fontVariantNumeric: "tabular-nums",
                  flexShrink: 0,
                }}>
                  {percent.format(p.margemPercentual ?? 0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
