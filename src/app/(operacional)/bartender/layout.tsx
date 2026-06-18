import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { signOut } from "@/lib/auth/actions";

export default async function BartenderLayout({
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
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#0a0a10', padding: '0 16px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.80)' }}>Nenhum bar vinculado a esse usuário ainda.</p>
        <form action={signOut}>
          <button style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Sair
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a10' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,16,0.95)', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{current.bar.nome}</span>
          <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 99, background: 'rgba(38,0,120,0.30)', color: 'rgba(160,130,255,0.9)' }}>Bartender</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{current.userNome}</span>
          <form action={signOut}>
            <button
              type="submit"
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Sair
            </button>
          </form>
        </div>
      </header>
      <main style={{ flex: 1, overflow: 'hidden' }}>{children}</main>
    </div>
  );
}
