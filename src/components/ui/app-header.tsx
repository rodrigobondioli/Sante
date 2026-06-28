/**
 * Header padrão do SUPERBAR — usado em TODAS as superfícies operacionais.
 * Logo "S" + nome do bar + badge de papel, consistente com o design do dashboard.
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
      borderBottom: "none",
      background: "var(--bg-elevated)",
    }}>
      {/* Esquerda: logo + nome do bar + badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, overflow: "hidden" }}>
        {/* Logo SUPERBAR */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/favicon.svg"
          alt="SUPERBAR"
          style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: "block" }}
        />

        <span style={{
          fontSize: 14, fontWeight: 600, color: "var(--fg)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {barNome}
        </span>

        <span style={{
          fontSize: 10, fontWeight: 700,
          padding: "3px 9px", borderRadius: 4,
          background: "color-mix(in srgb, var(--accent) 30%, transparent)",
          color: "var(--accent-bright)",
          letterSpacing: "0.06em", textTransform: "uppercase",
          flexShrink: 0,
        }}>
          {roleLabel}
        </span>
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
