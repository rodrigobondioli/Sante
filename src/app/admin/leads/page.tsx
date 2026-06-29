import { getLeads } from "@/lib/admin/queries";
import { LeadsTable } from "@/components/admin/leads-table";
import { LeadsAddForm } from "@/components/admin/leads-add-form";

export default async function AdminLeadsPage() {
  const leads = await getLeads();
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", fontFamily: "var(--font-mono)", margin: "0 0 4px" }}>
            Leads
          </h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>
            {leads.length} {leads.length === 1 ? "lead" : "leads"} recebidos
          </p>
        </div>
        <LeadsAddForm />
      </div>
      <LeadsTable leads={leads} />
    </div>
  );
}
