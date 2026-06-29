/**
 * Header padrão do SUPERBAR — usado em TODAS as superfícies operacionais.
 * Estrutura: logo | "SUPERBAR" / barNome + badge | [right slot]
 * Espelha o padrão do DashboardSidebar para consistência.
 */
export function AppHeader({
  barNome,
  roleLabel,
  right,
}: {
  barNome: string;
  roleLabel: string;
  right?: React.ReactNode;
}) {
  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 20px",
      paddingTop: "env(safe-area-inset-top)",
      height: "calc(52px + env(safe-area-inset-top))",
      flexShrink: 0,
      background: "var(--bg)",
      borderBottom: "1px solid var(--border)",
    }}>
      {/* Esquerda: logo + produto + bar + badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/favicon.svg"
          alt="SUPERBAR"
          style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: "block" }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0, overflow: "hidden" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            SUPERBAR
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{
              fontSize: 11, color: "var(--fg-subtle)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              lineHeight: 1.2,
            }}>
              {barNome}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600,
              padding: "1px 7px", borderRadius: 20, flexShrink: 0,
              background: "color-mix(in srgb, var(--accent) 14%, transparent)",
              color: "var(--accent)",
            }}>
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Direita */}
      {right && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {right}
        </div>
      )}
    </header>
  );
}
