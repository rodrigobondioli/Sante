import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { signOut } from "@/lib/auth/actions";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const current = await getCurrentBar();

  if (!current) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center"
        style={{ background: "var(--bg)" }}
      >
        <p style={{ fontSize: "14px", color: "var(--fg-muted)" }}>
          Nenhum bar vinculado a esse usuário ainda.
        </p>
        <form action={signOut}>
          <button
            style={{
              fontSize: "13px",
              color: "var(--fg-subtle)",
              textDecoration: "underline",
              background: "none",
              border: "none",
              cursor: "pointer",
              transition: "color 150ms",
            }}
            className="hover:!text-[var(--fg)]"
          >
            Sair
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "var(--bg)" }}>
      <aside style={{ width: "220px", flexShrink: 0, height: "100dvh", overflow: "hidden", background: "var(--bg)", borderRight: "1px solid var(--border)" }}>
        <DashboardSidebar barNome={current.bar.nome} userNome={current.userNome} role={current.role} />
      </aside>
      <main style={{ flex: 1, height: "100dvh", overflowY: "auto", background: "var(--bg)" }}>
        {children}
      </main>
    </div>
  );
}
