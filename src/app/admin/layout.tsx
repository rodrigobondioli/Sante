import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.PLATFORM_ADMIN_EMAILS ?? "rodrigobondioli@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) redirect("/login");
  if (!ADMIN_EMAILS.includes(auth.user.email?.toLowerCase() ?? "")) {
    redirect("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--fg)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Topbar */}
      <header
        style={{
          height: 48,
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 24px",
          background: "var(--bg-elevated)",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--accent)",
          }}
        >
          SUPERBAR
        </span>
        <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>/</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--fg-muted)",
          }}
        >
          Admin
        </span>
        <div style={{ flex: 1 }} />
        <a
          href="/dashboard"
          style={{
            fontSize: 11,
            color: "var(--fg-subtle)",
            textDecoration: "none",
          }}
        >
          ← Meu bar
        </a>
      </header>

      <main style={{ padding: "36px 32px", maxWidth: 1400, margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}
