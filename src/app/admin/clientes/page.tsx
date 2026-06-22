import { getAdminBares } from "@/lib/admin/queries";
import { AdminBaresTable } from "@/components/admin/admin-bares-table";

export default async function AdminClientesPage() {
  const { bares, stats } = await getAdminBares();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--fg)", margin: "0 0 4px", letterSpacing: "-0.03em", fontFamily: "var(--font-mono)" }}>
            Clientes
          </h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            {stats.total_bares} bar{stats.total_bares !== 1 ? "es" : ""} na plataforma
          </p>
        </div>
        <time style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
        </time>
      </div>

      <AdminBaresTable bares={bares} />
    </div>
  );
}
