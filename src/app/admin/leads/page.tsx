import { getLeads } from "@/lib/admin/queries";
import { LeadsTable } from "@/components/admin/leads-table";

export default async function AdminLeadsPage() {
  const leads = await getLeads();
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", fontFamily: "var(--font-mono)", margin: "0 0 4px" }}>
          Leads
        </h1>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
          {leads.length} {leads.length === 1 ? "lead" : "leads"} recebidos
        </p>
      </div>
      <LeadsTable leads={leads} />
    </div>
  );
}
