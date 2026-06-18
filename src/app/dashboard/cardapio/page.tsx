import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getCardapioAdmin } from "@/lib/cardapio/queries";
import { CardapioClient } from "@/components/cardapio/cardapio-client";

export default async function CardapioPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const cardapio = await getCardapioAdmin(current.bar.id);

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "white", margin: 0 }}>Cardápio</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: "6px 0 0" }}>
          Gerencie categorias e produtos do seu bar.
        </p>
      </div>
      <CardapioClient cardapio={cardapio} />
    </div>
  );
}
