#!/usr/bin/env node
/**
 * SEED LIVE: Aurora Bar — turno aberto agora (demo realtime)
 * Roda com: node scripts/seed-aurora-live.js
 *
 * Cria um turno aberto com:
 *  - 6 comandas já pagas (vendas da noite até agora)
 *  - 4 comandas abertas (clientes ativos)
 *  - Mix de mesas e produtos realistas
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function minsAgo(n) { return new Date(Date.now() - n * 60000).toISOString(); }

const NOMES_LIVE = [
  "Lucas Martins", "Ana Clara", "Pedro Henrique", "Julia Costa",
  "Rafael Souza", "Fernanda Lima", "Gustavo Oliveira", "Carla Pereira",
  "Bruno Alves", "Mariana Santos",
];

const POPULARIDADE = [
  8, 7, 5, 4, 6, 5,
  9, 7, 6, 5,
  6, 5, 5,
  8, 7, 5, 4,
  4, 3, 4, 5,
  5, 4, 4, 3,
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

function pickMetodo() {
  const r = Math.random();
  if (r < 0.65) return "pix";
  if (r < 0.85) return "dinheiro";
  if (r < 0.95) return "credito";
  return "debito";
}

async function main() {
  console.log("🔴 SEED LIVE — Aurora Bar ao vivo\n");

  // 1. Busca bar
  const { data: bars } = await supabase
    .from("bars").select("id, nome").ilike("nome", "%aurora%").limit(1);
  if (!bars?.length) { console.error("❌ Bar não encontrado."); process.exit(1); }
  const BAR_ID = bars[0].id;
  console.log(`🏠 ${bars[0].nome}`);

  // 2. Verifica se já tem turno aberto e fecha
  const { data: turnoExistente } = await supabase
    .from("turnos").select("id").eq("bar_id", BAR_ID).eq("status", "aberto").maybeSingle();
  if (turnoExistente) {
    console.log("   ⚠️  Fechando turno aberto anterior...");
    await supabase.from("turnos")
      .update({ status: "fechado", fechado_em: new Date().toISOString() })
      .eq("id", turnoExistente.id);
  }

  // 3. Busca user/member IDs
  const { data: donos } = await supabase
    .from("bar_members").select("id, user_id, nome")
    .eq("bar_id", BAR_ID).eq("role", "dono").not("user_id", "is", null).limit(1);
  if (!donos?.length) { console.error("❌ Dono não encontrado."); process.exit(1); }
  const DONO_USER_ID   = donos[0].user_id;
  const DONO_MEMBER_ID = donos[0].id;

  const { data: membros } = await supabase
    .from("bar_members").select("id, nome, role").eq("bar_id", BAR_ID).eq("ativo", true);
  const bartenders = membros?.filter(m => ["bartender","dono","gerente"].includes(m.role)) ?? [{ id: DONO_MEMBER_ID }];
  const caixas     = membros?.filter(m => ["caixa","dono","gerente"].includes(m.role))     ?? [{ id: DONO_MEMBER_ID }];

  // 4. Busca produtos e mesas
  const { data: produtos } = await supabase
    .from("produtos").select("id, nome, preco").eq("bar_id", BAR_ID).eq("ativo", true);
  const { data: mesas } = await supabase
    .from("mesas").select("id, numero").eq("bar_id", BAR_ID).eq("ativo", true);

  if (!produtos?.length || !mesas?.length) {
    console.error("❌ Rode seed-aurora-30dias.js primeiro para criar produtos e mesas.");
    process.exit(1);
  }

  // 5. Abre turno agora (bar abriu ~4h atrás)
  const aberturaEm = minsAgo(240);
  const { data: turno } = await supabase.from("turnos").insert({
    bar_id:       BAR_ID,
    status:       "aberto",
    abertura_por: DONO_USER_ID,
    aberto_em:    aberturaEm,
  }).select("id").single();

  console.log(`🟢 Turno aberto (${new Date(aberturaEm).toLocaleTimeString("pt-BR")})\n`);

  let totalVendas = 0;
  let totalComandas = 0;

  // 6. Comandas JÁ PAGAS (atividade das últimas 4h)
  const pagas = [
    { nome: "Lucas Martins",   minutosAtras: 210, numItens: 3 },
    { nome: "Ana Clara",       minutosAtras: 175, numItens: 2 },
    { nome: "Pedro Henrique",  minutosAtras: 140, numItens: 4 },
    { nome: "Julia Costa",     minutosAtras: 105, numItens: 2 },
    { nome: "Rafael Souza",    minutosAtras: 70,  numItens: 3 },
    { nome: "Fernanda Lima",   minutosAtras: 35,  numItens: 2 },
  ];

  for (const p of pagas) {
    const abertaEm = minsAgo(p.minutosAtras);
    const bartender = pick(bartenders);
    const mesa = pick(mesas);

    const { data: comanda } = await supabase.from("comandas").insert({
      bar_id: BAR_ID, turno_id: turno.id, mesa_id: mesa.id,
      bartender_id: DONO_USER_ID, aberta_por_member_id: bartender.id,
      identificador: p.nome, status: "paga",
      aberta_em: abertaEm,
      fechada_em: minsAgo(p.minutosAtras - rnd(20, 40)),
    }).select("id").single();

    let total = 0;
    for (let i = 0; i < p.numItens; i++) {
      const prod = pickProduto(produtos);
      const qtd  = rnd(1, 2);
      const sub  = prod.preco * qtd;
      total += sub;
      await supabase.from("comanda_items").insert({
        comanda_id: comanda.id, bar_id: BAR_ID, produto_id: prod.id,
        quantidade: qtd, preco_unitario: prod.preco, preco_total: sub,
        status: "ativo", adicionado_por: DONO_USER_ID,
        adicionado_por_member_id: bartender.id, adicionado_em: abertaEm,
      });
    }

    const caixa = pick(caixas);
    await supabase.from("pagamentos").insert({
      comanda_id: comanda.id, bar_id: BAR_ID, turno_id: turno.id,
      valor: total, metodo: pickMetodo(), status: "confirmado",
      processado_por: DONO_USER_ID, processado_por_member_id: caixa.id,
      processado_em: minsAgo(p.minutosAtras - rnd(25, 45)),
    });
    await supabase.from("comandas").update({ total }).eq("id", comanda.id);

    totalVendas += total;
    totalComandas++;
    console.log(`   ✅ ${p.nome.padEnd(20)} Mesa ${mesa.numero} — R$ ${total.toFixed(2)} (paga)`);
  }

  // 7. Comandas ABERTAS (clientes ativos agora)
  const abertas = [
    { nome: "Gustavo Oliveira", minutosAtras: 45, numItens: 2 },
    { nome: "Carla Pereira",    minutosAtras: 28, numItens: 3 },
    { nome: "Bruno Alves",      minutosAtras: 15, numItens: 1 },
    { nome: "Mariana Santos",   minutosAtras: 8,  numItens: 2 },
  ];

  console.log();
  for (const a of abertas) {
    const abertaEm = minsAgo(a.minutosAtras);
    const bartender = pick(bartenders);
    const mesa = pick(mesas);

    const { data: comanda } = await supabase.from("comandas").insert({
      bar_id: BAR_ID, turno_id: turno.id, mesa_id: mesa.id,
      bartender_id: DONO_USER_ID, aberta_por_member_id: bartender.id,
      identificador: a.nome, status: "aberta",
      aberta_em: abertaEm,
    }).select("id").single();

    let total = 0;
    for (let i = 0; i < a.numItens; i++) {
      const prod = pickProduto(produtos);
      const qtd  = rnd(1, 2);
      const sub  = prod.preco * qtd;
      total += sub;
      await supabase.from("comanda_items").insert({
        comanda_id: comanda.id, bar_id: BAR_ID, produto_id: prod.id,
        quantidade: qtd, preco_unitario: prod.preco, preco_total: sub,
        status: "ativo", adicionado_por: DONO_USER_ID,
        adicionado_por_member_id: bartender.id, adicionado_em: abertaEm,
      });
    }
    await supabase.from("comandas").update({ total }).eq("id", comanda.id);

    console.log(`   🟡 ${a.nome.padEnd(20)} Mesa ${mesa.numero} — R$ ${total.toFixed(2)} (aberta)`);
  }

  // 8. Atualiza totais do turno
  await supabase.from("turnos")
    .update({ total_vendas: totalVendas, total_comandas: totalComandas })
    .eq("id", turno.id);

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Turno ao vivo criado!
   6 comandas pagas — R$ ${totalVendas.toFixed(2)}
   4 comandas abertas (clientes na mesa)

   Abre o dashboard agora → seção "Ao Vivo"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch(err => { console.error("❌", err.message); process.exit(1); });
