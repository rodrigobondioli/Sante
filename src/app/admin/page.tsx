import { getAdminBares } from "@/lib/admin/queries";
import { AdminBaresTable } from "@/components/admin/admin-bares-table";

// ─── Ícones SVG ───────────────────────────────────────────────────────────────

function IconTrendUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function IconAlertTriangle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
function IconMoon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const { bares, stats } = await getAdminBares();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "var(--fg)",
              margin: "0 0 4px",
              letterSpacing: "-0.03em",
            }}
          >
            Clientes
          </h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            {stats.total_bares} bar{stats.total_bares !== 1 ? "es" : ""} na plataforma
          </p>
        </div>
        <time
          style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}
        >
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "short",
          })}
        </time>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
        }}
      >
        {/* MRR */}
        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "20px 22px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* glow */}
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "rgba(107,79,232,0.12)",
              filter: "blur(30px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--fg-subtle)",
              }}
            >
              MRR
            </span>
            <span
              style={{
                color: "var(--accent-bright)",
                opacity: 0.7,
                display: "flex",
              }}
            >
              <IconTrendUp />
            </span>
          </div>
          <p
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: "var(--accent-bright)",
              fontFamily: "var(--font-mono)",
              margin: "0 0 4px",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {currency.format(stats.mrr)}
          </p>
          <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
            {stats.bares_ativos} ativo{stats.bares_ativos !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Trial */}
        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "20px 22px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--fg-subtle)",
              }}
            >
              Trial
            </span>
            <span style={{ color: "#3b82f6", opacity: 0.7, display: "flex" }}>
              <IconClock />
            </span>
          </div>
          <p
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: stats.bares_trial > 0 ? "#3b82f6" : "var(--fg-muted)",
              fontFamily: "var(--font-mono)",
              margin: "0 0 4px",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {stats.bares_trial}
          </p>
          <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
            em período de teste
          </p>
        </div>

        {/* Inadimplentes */}
        <div
          style={{
            background: "var(--bg-elevated)",
            border: stats.bares_inadimplentes > 0
              ? "1px solid rgba(239,68,68,0.25)"
              : "1px solid var(--border)",
            borderRadius: 10,
            padding: "20px 22px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--fg-subtle)",
              }}
            >
              Inadimplentes
            </span>
            <span
              style={{
                color: stats.bares_inadimplentes > 0 ? "#ef4444" : "var(--fg-subtle)",
                opacity: 0.7,
                display: "flex",
              }}
            >
              <IconAlertTriangle />
            </span>
          </div>
          <p
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: stats.bares_inadimplentes > 0 ? "#ef4444" : "var(--fg-muted)",
              fontFamily: "var(--font-mono)",
              margin: "0 0 4px",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {stats.bares_inadimplentes}
          </p>
          <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
            {stats.bares_inadimplentes === 0 ? "tudo certo" : "requer atenção"}
          </p>
        </div>

        {/* Sem uso 7d */}
        <div
          style={{
            background: "var(--bg-elevated)",
            border: stats.bares_sem_uso_7d > 0
              ? "1px solid rgba(245,158,11,0.25)"
              : "1px solid var(--border)",
            borderRadius: 10,
            padding: "20px 22px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--fg-subtle)",
              }}
            >
              Sem uso 7d
            </span>
            <span
              style={{
                color: stats.bares_sem_uso_7d > 0 ? "#f59e0b" : "var(--fg-subtle)",
                opacity: 0.7,
                display: "flex",
              }}
            >
              <IconMoon />
            </span>
          </div>
          <p
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: stats.bares_sem_uso_7d > 0 ? "#f59e0b" : "var(--fg-muted)",
              fontFamily: "var(--font-mono)",
              margin: "0 0 4px",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {stats.bares_sem_uso_7d}
          </p>
          <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
            inativos esta semana
          </p>
        </div>
      </div>

      {/* ── Tabela ─────────────────────────────────────────────────────── */}
      <AdminBaresTable bares={bares} />
    </div>
  );
}
