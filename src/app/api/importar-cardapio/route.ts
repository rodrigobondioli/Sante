import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import type { ProdutoPreview, ImportarResponse } from "@/lib/cardapio/import-types";

type CampoSuperbar =
  | "nome"
  | "categoria"
  | "preco_venda"
  | "custo"
  | "descricao"
  | "not_recognized";

function parseNumero(val: unknown): number | null {
  if (typeof val === "number") return isNaN(val) ? null : val;
  if (typeof val === "string") {
    const limpo = val.replace(/[^\d,.-]/g, "").replace(",", ".");
    const n = parseFloat(limpo);
    return isNaN(n) ? null : n;
  }
  return null;
}

function fallbackMapping(headers: string[]): Record<string, CampoSuperbar> {
  const mapping: Record<string, CampoSuperbar> = {};
  const usados = new Set<CampoSuperbar>();

  for (const h of headers) {
    const lower = h
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");

    let campo: CampoSuperbar = "not_recognized";
    if (!usados.has("nome") && /nome|produto|item|bebida|drink|titulo/.test(lower))
      campo = "nome";
    else if (!usados.has("preco_venda") && /preco|valor|venda|pv|r\$|price/.test(lower))
      campo = "preco_venda";
    else if (!usados.has("custo") && /custo|cmv|ficha|cogs|pc|cost/.test(lower))
      campo = "custo";
    else if (!usados.has("categoria") && /categor|grupo|tipo|familia|secao|section/.test(lower))
      campo = "categoria";
    else if (!usados.has("descricao") && /descri|obs|observ|nota|ingredi|detail/.test(lower))
      campo = "descricao";

    if (campo !== "not_recognized") usados.add(campo);
    mapping[h] = campo;
  }

  return mapping;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 });
  }

  const file = formData.get("arquivo") as File | null;
  if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
    return NextResponse.json(
      { error: "Formato não suportado. Use .xlsx, .xls ou .csv" },
      { status: 400 }
    );
  }

  // Parse
  let rows: Record<string, unknown>[];
  try {
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(bytes), { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
  } catch {
    return NextResponse.json(
      { error: "Erro ao ler o arquivo. Verifique se não está corrompido." },
      { status: 400 }
    );
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "Planilha vazia ou sem dados" }, { status: 400 });
  }

  const headers = Object.keys(rows[0]);
  const amostra = rows.slice(0, 5);

  // Mapear colunas com Claude
  let mapping: Record<string, CampoSuperbar>;
  try {
    const anthropic = new Anthropic();
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Você está analisando uma planilha de cardápio de bar brasileiro.

Colunas encontradas: ${JSON.stringify(headers)}
Primeiras linhas de exemplo: ${JSON.stringify(amostra)}

Mapeie cada coluna para UM dos campos do SUPERBAR:
- "nome": nome do produto/bebida
- "categoria": grupo/categoria (ex: Drinks, Cervejas, Porções)
- "preco_venda": preço de venda ao cliente (numérico)
- "custo": custo de produção/CMV/ficha técnica (numérico)
- "descricao": descrição, observação ou ingredientes
- "not_recognized": coluna que não se encaixa

Regras:
- Cada coluna aparece exatamente uma vez
- Cada campo (exceto not_recognized) é mapeado por no máximo uma coluna
- Use nomes de colunas exatos como fornecidos (case-sensitive)
- Sinônimos comuns: "Item"/"Produto"/"Bebida" → "nome"; "Valor"/"R$"/"P.V." → "preco_venda"; "CMV"/"Custo de Produção" → "custo"; "Grupo"/"Tipo" → "categoria"

Retorne APENAS o JSON, sem explicação:
{"mapping":{"NomeColuna1":"nome","NomeColuna2":"preco_venda"}}`,
        },
      ],
    });

    const text =
      msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    const parsed = JSON.parse(text) as { mapping: Record<string, CampoSuperbar> };
    mapping = parsed.mapping;

    // Validar que todas as colunas estão presentes
    for (const h of headers) {
      if (!(h in mapping)) mapping[h] = "not_recognized";
    }
  } catch {
    mapping = fallbackMapping(headers);
  }

  // Aplicar mapeamento em todas as linhas
  const produtos: ProdutoPreview[] = rows
    .map((row) => {
      const p: ProdutoPreview = {
        nome: "",
        categoria: null,
        preco_venda: null,
        custo: null,
        descricao: null,
      };
      for (const [col, campo] of Object.entries(mapping)) {
        if (campo === "not_recognized") continue;
        const val = row[col];
        if (campo === "nome") p.nome = String(val ?? "").trim();
        else if (campo === "categoria")
          p.categoria = String(val ?? "").trim() || null;
        else if (campo === "preco_venda") p.preco_venda = parseNumero(val);
        else if (campo === "custo") p.custo = parseNumero(val);
        else if (campo === "descricao")
          p.descricao = String(val ?? "").trim() || null;
      }
      return p;
    })
    .filter((p) => p.nome.length > 0);

  const colunasNaoReconhecidas = Object.entries(mapping)
    .filter(([, campo]) => campo === "not_recognized")
    .map(([col]) => col);

  return NextResponse.json({
    produtos,
    colunasNaoReconhecidas,
  } satisfies ImportarResponse);
}
