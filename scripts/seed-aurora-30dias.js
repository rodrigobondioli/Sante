#!/usr/bin/env node
/**
 * SEED: Aurora Bar — 30 dias de operação realista
 * Roda com: node scripts/seed-aurora-30dias.js
 *
 * O que cria:
 *  - Categorias + produtos com custo (cardápio completo)
 *  - Mesas (1-10)
 *  - Estoque com quantidade mínima
 *  - 25 noites de operação (turnos fechados)
 *  - ~280 comandas com itens variados
 *  - Pagamentos (Pix 65%, Dinheiro 20%, Crédito 10%, Débito 5%)
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function dt(base, offsetHours, offsetMinutes = 0) {
  const d = new Date(base);
  d.setHours(d.getHours() + offsetHours, d.getMinutes() + offsetMinutes);
  return d.toISOString();
}

// ─── Cardápio ─────────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { nome: "Clássicos",      ordem: 1 },
  { nome: "Autorais",       ordem: 2 },
  { nome: "Gin & Tônica",   ordem: 3 },
  { nome: "Cervejas",       ordem: 4 },
  { nome: "Não Alcoólicos", ordem: 5 },
  { nome: "Petiscos",       ordem: 6 },
];

// [nome, preco, custo, categoria_index]
const PRODUTOS_DEF = [
  // Clássicos
  ["Caipirinha",       24, 5.50, 0],
  ["Mojito",           26, 6.00, 0],
  ["Negroni",          34, 8.50, 0],
  ["Old Fashioned",    36, 9.00, 0],
  ["Margarita",        28, 7.00, 0],
  ["Aperol Spritz",    30, 8.00, 0],
  // Autorais
  ["Aurora Fizz",      38, 10.00, 1],
  ["Passion Smoke",    36,  9.50, 1],
  ["Violet Sour",      34,  9.00, 1],
  ["Gold Rush",        40, 11.00, 1],
  // Gin & Tônica
  ["Hendrick's & Tônica", 38, 10.00, 2],
  ["Tanqueray Ten",       36,  9.50, 2],
  ["Bombay Sapphire",     32,  8.50, 2],
  // Cervejas
  ["Chopp Artesanal 400ml", 16,  4.50, 3],
  ["Heineken Long Neck",    16,  5.50, 3],
  ["Colorado Appia",        18,  6.50, 3],
  ["Stella Artois 600ml",   22,  7.50, 3],
  // Não Alcoólicos
  ["Água Mineral 500ml",     8,  1.50, 4],
  ["Refrigerante Lata",     10,  2.50, 4],
  ["Suco Natural",          16,  4.00, 4],
  ["Limonada Suíça",        18,  4.50, 4],
  // Petiscos
  ["Bruschetta (4 un)",     28,  7.50, 5],
  ["Tábua de Frios",        58, 18.00, 5],
  ["Porção Batata Frita",   32,  9.00, 5],
  ["Mix de Castanhas",      24,  8.00, 5],
];

// Pesos de popularidade por produto (maior = mais pedido)
const POPULARIDADE = [
  8, 7, 5, 4, 6, 5,   // Clássicos
  9, 7, 6, 5,          // Autorais
  6, 5, 5,             // Gin
  8, 7, 5, 4,          // Cervejas
  4, 3, 4, 5,          // Não alc
  5, 4, 4, 3,          // Petiscos
];

function pickProduto(produtos) {
  const total = POPULARIDADE.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < produtos.length; i++) {
    rand -= POPULARIDADE[i] || 3;
    if (rand <= 0) return produtos[i];
  }
  return produtos[0];
}

// ─── Métodos de pagamento ponderados ─────────────────────────────────────────

function pickMetodo() {
  const r = Math.random();
  if (r < 0.65) return "pix";
  if (r < 0.85) return "dinheiro";
  if (r < 0.95) return "credito";
  return "debito";
}

// ─── Nomes fictícios de clientes ─────────────────────────────────────────────

const NOMES = [
  "Lucas Martins", "Ana Clara", "Pedro Henrique", "Julia Costa",
  "Rafael Souza", "Fernanda Lima", "Gustavo Oliveira", "Carla Pereira",
  "Bruno Alves", "Mariana Santos", "Felipe Torres", "Camila Rocha",
  "Diego Ferreira", "Beatriz Nunes", "Thiago Cardoso", "Leticia Gomes",
  "Rodrigo Melo", "Amanda Silva", "Carlos Eduardo", "Patricia Moura",
  "Leonardo Vieira", "Natalia Campos", "Vinicius Araujo", "Isabela Dias",
  "Mateus Costa", "Larissa Freitas", "Gabriel Monteiro", "Renata Pinto",
  "Henrique Lopes", "Vanessa Barbosa",
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🍹 SEED — Aurora Bar 30 dias\n");

  // 1. Busca o bar Aurora
  const { data: bars } = await supabase
    .from("bars")
    .select("id, nome")
    .ilike("nome", "%aurora%")
    .limit(1);

  if (!bars?.length) {
    // Tenta pegar o primeiro bar do usuário
    const { data: allBars } = await supabase.from("bars").select("id, nome").limit(1);
    if (!allBars?.length) {
      console.error("❌ Nenhum bar encontrado. Crie um bar primeiro.");
      process.exit(1);
    }
    bars.push(allBars[0]);
  }

  const BAR_ID = bars[0].id;
  console.log(`🏠 Bar: ${bars[0].nome} (${BAR_ID})`);

  // 2. Busca o dono (Rodrigo) via bar_members + profiles
  const { data: donos } = await supabase
    .from("bar_members")
    .select("id, user_id, nome, role")
    .eq("bar_id", BAR_ID)
    .eq("role", "dono")
    .not("user_id", "is", null)
    .limit(1);

  if (!donos?.length) {
    console.error("❌ Nenhum dono com user_id encontrado.");
    process.exit(1);
  }

  const DONO_USER_ID   = donos[0].user_id;
  const DONO_MEMBER_ID = donos[0].id;
  console.log(`👤 Dono: ${donos[0].nome} (user=${DONO_USER_ID}, member=${DONO_MEMBER_ID})`);

  // 3. Busca todos os membros (para atribuição variada)
  const { data: membros } = await supabase
    .from("bar_members")
    .select("id, nome, role")
    .eq("bar_id", BAR_ID)
    .eq("ativo", true);

  const bartenders = membros?.filter(m => ["bartender", "dono", "gerente"].includes(m.role)) ?? [];
  const caixas     = membros?.filter(m => ["caixa", "dono", "gerente"].includes(m.role)) ?? [];

  if (bartenders.length === 0) bartenders.push({ id: DONO_MEMBER_ID, nome: "Rodrigo", role: "dono" });
  if (caixas.length === 0)     caixas.push({ id: DONO_MEMBER_ID, nome: "Rodrigo", role: "dono" });

  console.log(`👥 Bartenders: ${bartenders.map(m => m.nome).join(", ")}`);
  console.log(`💰 Caixas: ${caixas.map(m => m.nome).join(", ")}\n`);

  // 4. Cria/obtém mesas
  console.log("🪑 Criando mesas...");
  const mesaNomes = ["Mesa 1","Mesa 2","Mesa 3","Mesa 4","Mesa 5","Mesa 6","Mesa 7","Mesa 8","Balcão","Área VIP"];
  for (let i = 0; i < 10; i++) {
    await supabase.from("mesas").upsert(
      { bar_id: BAR_ID, numero: i + 1, nome: mesaNomes[i], capacidade: i < 8 ? 4 : (i === 8 ? 8 : 6), ativo: true },
      { onConflict: "bar_id,numero" }
    );
  }
  const { data: mesas } = await supabase.from("mesas").select("id,numero").eq("bar_id", BAR_ID).eq("ativo", true);
  console.log(`   ✓ ${mesas.length} mesas`);

  // 5. Cria categorias
  console.log("📂 Criando categorias...");
  const catIds = [];
  for (const cat of CATEGORIAS) {
    const { data: existing } = await supabase
      .from("categorias").select("id").eq("bar_id", BAR_ID).eq("nome", cat.nome).maybeSingle();
    if (existing) {
      catIds.push(existing.id);
    } else {
      const { data: novo } = await supabase
        .from("categorias").insert({ bar_id: BAR_ID, ...cat }).select("id").single();
      catIds.push(novo.id);
    }
  }
  console.log(`   ✓ ${catIds.length} categorias`);

  // 6. Cria produtos
  console.log("🍸 Criando produtos...");
  const produtos = [];
  for (let i = 0; i < PRODUTOS_DEF.length; i++) {
    const [nome, preco, custo, catIdx] = PRODUTOS_DEF[i];
    const { data: existing } = await supabase
      .from("produtos").select("id,preco").eq("bar_id", BAR_ID).eq("nome", nome).maybeSingle();
    if (existing) {
      produtos.push({ id: existing.id, nome, preco: existing.preco, custo });
    } else {
      const { data: novo } = await supabase.from("produtos").insert({
        bar_id: BAR_ID,
        categoria_id: catIds[catIdx],
        nome, preco, custo,
        ativo: true,
        controla_estoque: true,
      }).select("id,preco").single();
      produtos.push({ id: novo.id, nome, preco: novo.preco, custo });
    }
  }
  console.log(`   ✓ ${produtos.length} produtos`);

  // 7. Estoque inicial
  console.log("📦 Configurando estoque...");
  const estoqueInicial = [
    50, 40, 30, 25, 35, 30,   // Clássicos
    40, 35, 30, 25,            // Autorais
    25, 20, 20,                // Gin
    80, 80, 60, 60,            // Cervejas
    60, 60, 40, 40,            // Não alc
    30, 20, 30, 25,            // Petiscos
  ];
  for (let i = 0; i < produtos.length; i++) {
    await supabase.from("estoque").upsert(
      {
        bar_id: BAR_ID,
        produto_id: produtos[i].id,
        quantidade_atual: estoqueInicial[i] || 30,
        quantidade_minima: Math.floor((estoqueInicial[i] || 30) * 0.2),
        unidade: "un",
      },
      { onConflict: "bar_id,produto_id" }
    );
  }
  console.log(`   ✓ estoque configurado`);

  // 8. Gera 25 noites de operação
  console.log("\n🌙 Gerando 25 noites de operação...\n");

  // 30 dias atrás = ~29 mai 2026
  const hoje = new Date("2026-06-28");
  const noites = [];

  for (let dia = 29; dia >= 0; dia--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - dia);
    const diaSemana = d.getDay(); // 0=Dom, 1=Seg...6=Sab

    // Fecha Domingos; fecha algumas Segundas (bar premium fecha dom e alguns seg)
    if (diaSemana === 0) continue; // fecha domingo
    if (diaSemana === 1 && Math.random() < 0.5) continue; // fecha 50% das segundas

    // Número de comandas por tipo de noite
    let numComandas;
    if (diaSemana === 5 || diaSemana === 6) numComandas = rnd(16, 28); // Sex/Sab = cheio
    else if (diaSemana === 4) numComandas = rnd(10, 18);                // Qui = bom
    else numComandas = rnd(5, 12);                                       // Ter/Qua/Seg = tranquilo

    noites.push({ data: new Date(d), numComandas, diaSemana });
    if (noites.length >= 25) break;
  }

  // Garante exatamente 25 noites (pode ter menos se muitos domingos)
  // (ok se < 25 por conta de domingos)

  let totalComandas = 0;
  let totalReceita  = 0;

  for (const noite of noites) {
    const abertura = new Date(noite.data);
    abertura.setHours(17, rnd(30, 59), 0, 0);

    const horasFuncionando = rnd(6, 9);
    const fechamento = new Date(abertura);
    fechamento.setHours(fechamento.getHours() + horasFuncionando);

    // Cria turno
    const { data: turno, error: errTurno } = await supabase.from("turnos").insert({
      bar_id:       BAR_ID,
      status:       "fechado",
      abertura_por: DONO_USER_ID,
      fechamento_por: DONO_USER_ID,
      aberto_em:    abertura.toISOString(),
      fechado_em:   fechamento.toISOString(),
    }).select("id").single();

    if (errTurno) { console.error("Erro turno:", errTurno.message); continue; }

    let receitaTurno = 0;
    let comandasTurno = 0;

    // Gera comandas para este turno
    for (let c = 0; c < noite.numComandas; c++) {
      const minutosDesdeAbertura = rnd(10, horasFuncionando * 60 - 30);
      const aberturaCom = new Date(abertura);
      aberturaCom.setMinutes(aberturaCom.getMinutes() + minutosDesdeAbertura);

      const nomeCliente = pick(NOMES);
      const mesa = pick(mesas);
      const bartender = pick(bartenders);

      // Cria comanda
      const { data: comanda, error: errCom } = await supabase.from("comandas").insert({
        bar_id:              BAR_ID,
        turno_id:            turno.id,
        mesa_id:             mesa.id,
        bartender_id:        DONO_USER_ID,
        aberta_por_member_id: bartender.id,
        identificador:       nomeCliente,
        status:              "paga",
        aberta_em:           aberturaCom.toISOString(),
        fechada_em:          new Date(aberturaCom.getTime() + rnd(30, 180) * 60000).toISOString(),
      }).select("id").single();

      if (errCom) { console.error("Erro comanda:", errCom.message); continue; }

      // Itens da comanda (1-4 itens)
      const numItens = rnd(1, 4);
      let totalComanda = 0;

      for (let it = 0; it < numItens; it++) {
        const produto = pickProduto(produtos);
        const qtd     = rnd(1, 3);
        const total   = produto.preco * qtd;
        totalComanda += total;

        const { error: errItem } = await supabase.from("comanda_items").insert({
          comanda_id:              comanda.id,
          bar_id:                  BAR_ID,
          produto_id:              produto.id,
          quantidade:              qtd,
          preco_unitario:          produto.preco,
          preco_total:             total,
          status:                  "ativo",
          adicionado_por:          DONO_USER_ID,
          adicionado_por_member_id: bartender.id,
          adicionado_em:           aberturaCom.toISOString(),
        });
        if (errItem) console.error("Erro item:", errItem.message);
      }

      // Pagamento
      const caixa = pick(caixas);
      const metodo = pickMetodo();
      const pagamentoEm = new Date(aberturaCom.getTime() + rnd(40, 210) * 60000);

      const { error: errPag } = await supabase.from("pagamentos").insert({
        comanda_id:               comanda.id,
        bar_id:                   BAR_ID,
        turno_id:                 turno.id,
        valor:                    totalComanda,
        metodo,
        status:                   "confirmado",
        processado_por:           DONO_USER_ID,
        processado_por_member_id: caixa.id,
        processado_em:            pagamentoEm.toISOString(),
      });
      if (errPag) console.error("Erro pagamento:", errPag.message);

      // Atualiza total da comanda via update direto
      await supabase.from("comandas")
        .update({ total: totalComanda })
        .eq("id", comanda.id);

      receitaTurno  += totalComanda;
      totalComandas += 1;
    }

    // Atualiza totais do turno
    await supabase.from("turnos")
      .update({ total_vendas: receitaTurno, total_comandas: comandasTurno + noite.numComandas })
      .eq("id", turno.id);

    totalReceita += receitaTurno;
    const dataFmt = noite.data.toLocaleDateString("pt-BR");
    const diaLabels = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
    console.log(`   ${diaLabels[noite.diaSemana]} ${dataFmt} — ${noite.numComandas} comandas — R$ ${receitaTurno.toFixed(2)}`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Seed completo!`);
  console.log(`   Noites: ${noites.length}`);
  console.log(`   Comandas: ~${totalComandas}`);
  console.log(`   Receita total: R$ ${totalReceita.toFixed(2)}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch(err => {
  console.error("❌ Erro fatal:", err.message);
  process.exit(1);
});
