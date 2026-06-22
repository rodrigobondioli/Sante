import { getAdminBares } from "@/lib/admin/queries";
import { AdminBaresTable }  from "@/components/admin/admin-bares-table";
import { AdminAtencao }     from "@/components/admin/admin-atencao";
import { AdminImplantacao } from "@/components/admin/admin-implantacao";
import { AdminFinanceiro }  from "@/components/admin/admin-financeiro";

// ─── Ícones ───────────────────────────────────────────────────────────────────

function IconTrendUp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function IconLayers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  );
}
function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL", maximumFractionDigits: 0,
});

type Tab = "atencao" | "clientes" | "implantacao" | "financeiro";

const TABS: { id: Tab; label: string }[] = [
  { id: "atencao",     label: "Atenção"     },
  { id: "clientes",    label: "Clientes"    },
  { id: "implantacao", label: "Implantação" },
  { id: "financeiro",  label: "Financeiro"  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp  = await searchParams;
  const tab = (sp.tab ?? "atencao") as Tab;
  const { bares, stats } = await getAdminBares();

  const comAlertas = bares.filter((b) => b.alertas.length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--fg)", margin: "0 0 4px", letterSpacing: "-0.03em" }}>
            Admin
          </h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            {stats.total_bares} bar{stats.total_bares !== 1 ? "es" : ""} na plataforma
          </p>
        </div>
        <time style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
        </time>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>

        {/* MRR */}
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 90, height: 90, borderRadius: "50%", background: "rgba(107,79,232,0.12)", filter: "blur(28px)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)" }}>MRR</span>
            <span style={{ color: "var(--accent-bright)", opacity: 0.7, display: "flex" }}><IconTrendUp /></span>
          </div>
          <p style={{ fontSize: 26, fontWeight: 800, color: "var(--accent-bright)", fontFamily: "var(--font-mono)", margin: "0 0 3px", letterSpacing: "-0.03em", lineHeight: 1 }}>
            {currency.format(stats.mrr)}
          </p>
          <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
            {stats.bares_saudaveis + stats.bares_atencao} ativo{(stats.bares_saudaveis + stats.bares_atencao) !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Saúde */}
        <div style={{ background: "var(--bg-elevated)", border: stats.bares_risco > 0 ? "1px solid rgba(239,68,68,0.2)" : "1px solid var(--border)", borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)" }}>Saúde</span>
            <span style={{ color: stats.bares_risco > 0 ? "#ef4444" : "#22c55e", opacity: 0.7, display: "flex" }}><IconShield /></span>
          </div>
          <p style={{ fontSize: 26, fontWeight: 800, color: stats.bares_risco > 0 ? "#ef4444" : "#22c55e", fontFamily: "var(--font-mono)", margin: "0 0 6px", letterSpacing: "-0.03em", lineHeight: 1 }}>
            {stats.bares_saudaveis}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <p style={{ fontSize: 10, color: "#22c55e", margin: 0 }}>● {stats.bares_saudaveis} saudável{stats.bares_saudaveis !== 1 ? "is" : ""}</p>
            {stats.bares_atencao > 0 && <p style={{ fontSize: 10, color: "#f59e0b", margin: 0 }}>● {stats.bares_atencao} atenção</p>}
            {stats.bares_risco > 0   && <p style={{ fontSize: 10, color: "#ef4444", margin: 0 }}>● {stats.bares_risco} risco</p>}
          </div>
        </div>

        {/* Implantação */}
        <div style={{ background: "var(--bg-elevated)", border: stats.implantacao_abandonado > 0 ? "1px solid rgba(245,158,11,0.2)" : "1px solid var(--border)", borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)" }}>Implantação</span>
            <span style={{ color: stats.implantacao_abandonado > 0 ? "#f59e0b" : "var(--fg-subtle)", opacity: 0.7, display: "flex" }}><IconLayers /></span>
          </div>
          <p style={{ fontSize: 26, fontWeight: 800, color: "var(--fg)", fontFamily: "var(--font-mono)", margin: "0 0 6px", letterSpacing: "-0.03em", lineHeight: 1 }}>
            {stats.implantacao_completo}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <p style={{ fontSize: 10, color: "#22c55e", margin: 0 }}>✓ {stats.implantacao_completo} completo{stats.implantacao_completo !== 1 ? "s" : ""}</p>
            {stats.implantacao_parcial > 0    && <p style={{ fontSize: 10, color: "var(--fg-muted)", margin: 0 }}>◐ {stats.implantacao_parcial} parcial{stats.implantacao_parcial !== 1 ? "is" : ""}</p>}
            {stats.implantacao_abandonado > 0 && <p style={{ fontSize: 10, color: "#f59e0b", margin: 0 }}>○ {stats.implantacao_abandonado} abandonado{stats.implantacao_abandonado !== 1 ? "s" : ""}</p>}
          </div>
        </div>

        {/* Sem uso 7d */}
        <div style={{ background: "var(--bg-elevated)", border: stats.bares_sem_uso_7d > 0 ? "1px solid rgba(245,158,11,0.25)" : "1px solid var(--border)", borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)" }}>Sem uso 7d</span>
            <span style={{ color: stats.bares_sem_uso_7d > 0 ? "#f59e0b" : "var(--fg-subtle)", opacity: 0.7, display: "flex" }}><IconMoon /></span>
          </div>
          <p style={{ fontSize: 32, fontWeight: 800, color: stats.bares_sem_uso_7d > 0 ? "#f59e0b" : "var(--fg-muted)", fontFamily: "var(--font-mono)", margin: "0 0 3px", letterSpacing: "-0.03em", lineHeight: 1 }}>
            {stats.bares_sem_uso_7d}
          </p>
          <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: 0 }}>
            {stats.bares_sem_uso_7d === 0 ? "todos ativos" : "inativos esta semana"}
          </p>
        </div>

      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div>
        {/* Tab nav */}
        <div style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--border)",
          marginBottom: 24,
        }}>
          {TABS.map(({ id, label }) => {
            const isActive = tab === id;
            const badge = id === "atencao" && comAlertas.length > 0 ? comAlertas.length : null;
            return (
              <a
                key={id}
                href={`/admin?tab=${id}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--fg)" : "var(--fg-muted)",
                  textDecoration: "none",
                  borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                  marginBottom: -1,
                  transition: "color 100ms",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
                {badge !== null && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    background: "#ef4444",
                    color: "#fff",
                    borderRadius: 99,
                    padding: "1px 6px",
                    lineHeight: 1.4,
                  }}>
                    {badge}
                  </span>
                )}
              </a>
            );
          })}
        </div>

        {/* Tab content */}
        {tab === "atencao"     && <AdminAtencao bares={bares} />}
        {tab === "clientes"    && <AdminBaresTable bares={bares} />}
        {tab === "implantacao" && <AdminImplantacao bares={bares} />}
        {tab === "financeiro"  && <AdminFinanceiro bares={bares} stats={stats} />}
      </div>
    </div>
  );
}
