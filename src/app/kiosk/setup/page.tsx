import { redirect } from "next/navigation";
import { activateKiosk } from "@/lib/kiosk/actions";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function KioskSetupPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div style={{
        height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg)", padding: 32,
      }}>
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 12, padding: 36, maxWidth: 400, textAlign: "center",
        }}>
          <p style={{ fontSize: 32, margin: "0 0 12px" }}>⚠️</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)", margin: "0 0 8px" }}>
            Link inválido
          </p>
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>
            Peça ao dono do bar para gerar um novo link de ativação nas configurações.
          </p>
        </div>
      </div>
    );
  }

  const result = await activateKiosk(token);

  if (!result.ok) {
    return (
      <div style={{
        height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg)", padding: 32,
      }}>
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 12, padding: 36, maxWidth: 400, textAlign: "center",
        }}>
          <p style={{ fontSize: 32, margin: "0 0 12px" }}>❌</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)", margin: "0 0 8px" }}>
            Token inválido
          </p>
          <p style={{ fontSize: 13, color: "var(--fg-subtle)", margin: 0 }}>
            {result.error ?? "O token não é válido ou foi revogado."}
          </p>
        </div>
      </div>
    );
  }

  // Ativação OK → vai direto pra tela do garçom
  redirect("/garcom");
}
