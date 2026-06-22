import { getAdminBares } from "@/lib/admin/queries";
import { AdminImplantacao } from "@/components/admin/admin-implantacao";

export default async function AdminImplantacaoPage() {
  const { bares, stats } = await getAdminBares();

  // Contagem rápida para contexto
  const completos  = stats.implantacao_completo;
  const parciais   = stats.implantacao_parcial;
  const abandonados = stats.implantacao_abandonado;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--fg)", margin: "0 0 4px", letterSpacing: "-0.03em", fontFamily: "var(--font-mono)" }}>
            Implantação
          </h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            {completos} completo{completos !== 1 ? "s" : ""}
            {parciais > 0 && ` · ${parciais} em andamento`}
            {abandonados > 0 && ` · ${abandonados} parado${abandonados !== 1 ? "s" : ""}`}
          </p>
        </div>
        <time style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
        </time>
      </div>

      <AdminImplantacao bares={bares} />
    </div>
  );
}
