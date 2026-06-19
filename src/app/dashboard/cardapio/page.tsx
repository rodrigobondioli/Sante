import { redirect } from "next/navigation";
import { getCurrentBar } from "@/lib/dashboard/queries";
import { getCardapioAdmin } from "@/lib/cardapio/queries";
import { CardapioClient } from "@/components/cardapio/cardapio-client";
import { LABEL, H1, SUBTITLE } from "@/lib/ui";

export default async function CardapioPage() {
  const current = await getCurrentBar();
  if (!current) redirect("/login");

  const cardapio = await getCardapioAdmin(current.bar.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", padding: "32px 40px" }}>
      <CardapioClient cardapio={cardapio} />
    </div>
  );
}
