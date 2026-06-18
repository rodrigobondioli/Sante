// Seed minimo de dev para o Dashboard Dono (S05/S06/S20).
// Roda com: node --env-file=.env.local scripts/seed.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DONO_EMAIL = "dono@aurorabar.dev";
const DONO_PASSWORD = "SenhaForte123!";
const BAR_SLUG = "aurora-bar";

function must(label, { data, error }) {
  if (error) {
    console.error(`Falhou: ${label}`, error);
    process.exit(1);
  }
  return data;
}

// Cria comandas + itens de um turno e paga as marcadas, disparando os
// triggers de total da comanda / total do turno / baixa de estoque.
async function criarComandasEPagamentos({
  bar,
  turno,
  donoUser,
  mesa,
  produto,
  comandasDef,
  itensPorComanda,
  dataReferencia,
}) {
  const comandas = must(
    `criar comandas do turno ${turno.id}`,
    await supabase
      .from("comandas")
      .insert(
        comandasDef.map((c) => ({
          bar_id: bar.id,
          turno_id: turno.id,
          mesa_id: mesa(c.mesa).id,
          bartender_id: donoUser.id,
          identificador: c.identificador,
          ...(dataReferencia ? { aberta_em: dataReferencia } : {}),
        }))
      )
      .select()
  );

  for (const c of comandas) {
    const itens = itensPorComanda[c.identificador];
    const rows = itens.map(([nomeProduto, quantidade]) => {
      const p = produto(nomeProduto);
      return {
        comanda_id: c.id,
        bar_id: bar.id,
        produto_id: p.id,
        quantidade,
        preco_unitario: p.preco,
        preco_total: p.preco * quantidade,
        adicionado_por: donoUser.id,
        adicionado_em: c.aberta_em,
      };
    });
    must(`itens de ${c.identificador}`, await supabase.from("comanda_items").insert(rows));
  }

  for (const c of comandas) {
    const def = comandasDef.find((d) => d.identificador === c.identificador);
    if (!def.pagar) continue;

    const { data: comandaAtualizada } = await supabase
      .from("comandas")
      .update({ status: "paga", fechada_em: c.aberta_em })
      .eq("id", c.id)
      .select()
      .single();

    must(
      `pagamento de ${c.identificador}`,
      await supabase.from("pagamentos").insert({
        comanda_id: c.id,
        bar_id: bar.id,
        turno_id: turno.id,
        valor: comandaAtualizada.total,
        metodo: "pix",
        processado_por: donoUser.id,
        processado_em: c.aberta_em,
      })
    );
  }
}

async function main() {
  // 1. Usuário dono (a trigger on_auth_user_created cria o profile)
  let { data: existing } = await supabase.auth.admin.listUsers();
  let donoUser = existing?.users.find((u) => u.email === DONO_EMAIL);

  if (!donoUser) {
    const created = must(
      "criar usuário dono",
      await supabase.auth.admin.createUser({
        email: DONO_EMAIL,
        password: DONO_PASSWORD,
        email_confirm: true,
        user_metadata: { nome: "Rodrigo Bondioli" },
      })
    );
    donoUser = created.user;
  }
  console.log("Dono:", donoUser.id, DONO_EMAIL);

  // 2. Bar (idempotente via slug)
  let { data: bar } = await supabase.from("bars").select("*").eq("slug", BAR_SLUG).maybeSingle();
  if (!bar) {
    bar = must(
      "criar bar",
      await supabase
        .from("bars")
        .insert({
          nome: "Aurora Bar",
          slug: BAR_SLUG,
          configuracoes: { fuso_horario: "America/Sao_Paulo", moeda: "BRL" },
        })
        .select()
        .single()
    );
  }
  console.log("Bar:", bar.id, bar.nome);

  // 3. Vínculo dono <-> bar
  const { data: member } = await supabase
    .from("bar_members")
    .select("*")
    .eq("bar_id", bar.id)
    .eq("user_id", donoUser.id)
    .maybeSingle();
  if (!member) {
    must(
      "vincular dono ao bar",
      await supabase
        .from("bar_members")
        .insert({ bar_id: bar.id, user_id: donoUser.id, role: "dono" })
    );
  }

  // 4. Assinatura no plano Premium
  const plano = must(
    "buscar plano premium",
    await supabase.from("planos").select("id").eq("slug", "premium").single()
  );
  const { data: assinatura } = await supabase
    .from("assinaturas")
    .select("*")
    .eq("bar_id", bar.id)
    .maybeSingle();
  if (!assinatura) {
    must(
      "criar assinatura",
      await supabase
        .from("assinaturas")
        .insert({ bar_id: bar.id, plano_id: plano.id, status: "ativa" })
    );
  }

  // 5. Mesas
  const mesasDef = [
    { numero: 1, nome: "Mesa 1" },
    { numero: 2, nome: "Mesa 2" },
    { numero: 3, nome: "Varanda" },
    { numero: 4, nome: "Balcão" },
  ];
  const { data: mesasExistentes } = await supabase.from("mesas").select("*").eq("bar_id", bar.id);
  let mesas = mesasExistentes ?? [];
  if (mesas.length === 0) {
    mesas = must(
      "criar mesas",
      await supabase
        .from("mesas")
        .insert(mesasDef.map((m) => ({ ...m, bar_id: bar.id })))
        .select()
    );
  }
  const mesa = (nome) => mesas.find((m) => m.nome === nome);

  // 6. Categorias
  const categoriasDef = [
    { nome: "Drinques", ordem: 0 },
    { nome: "Cervejas", ordem: 1 },
    { nome: "Petiscos", ordem: 2 },
  ];
  const { data: categoriasExistentes } = await supabase
    .from("categorias")
    .select("*")
    .eq("bar_id", bar.id);
  let categorias = categoriasExistentes ?? [];
  if (categorias.length === 0) {
    categorias = must(
      "criar categorias",
      await supabase
        .from("categorias")
        .insert(categoriasDef.map((c) => ({ ...c, bar_id: bar.id })))
        .select()
    );
  }
  const categoria = (nome) => categorias.find((c) => c.nome === nome).id;

  // 7. Produtos
  const produtosDef = [
    { nome: "Gin Tônica", preco: 32, custo: 10, categoria_id: categoria("Drinques") },
    { nome: "Caipirinha", preco: 28, custo: 8, categoria_id: categoria("Drinques") },
    { nome: "Chopp 500ml", preco: 18, custo: 6, categoria_id: categoria("Cervejas") },
    { nome: "Heineken Long Neck", preco: 14, custo: 5, categoria_id: categoria("Cervejas") },
    { nome: "Batata Frita", preco: 35, custo: 12, categoria_id: categoria("Petiscos") },
  ];
  const { data: produtosExistentes } = await supabase
    .from("produtos")
    .select("*")
    .eq("bar_id", bar.id);
  let produtos = produtosExistentes ?? [];
  if (produtos.length === 0) {
    produtos = must(
      "criar produtos",
      await supabase
        .from("produtos")
        .insert(produtosDef.map((p) => ({ ...p, bar_id: bar.id })))
        .select()
    );
  }
  const produto = (nome) => produtos.find((p) => p.nome === nome);

  // 8. Estoque — Heineken fica abaixo do mínimo de propósito (alerta)
  const estoqueDef = [
    { nome: "Gin Tônica", quantidade_atual: 50, quantidade_minima: 10 },
    { nome: "Caipirinha", quantidade_atual: 40, quantidade_minima: 10 },
    { nome: "Chopp 500ml", quantidade_atual: 80, quantidade_minima: 20 },
    { nome: "Heineken Long Neck", quantidade_atual: 4, quantidade_minima: 24 },
    { nome: "Batata Frita", quantidade_atual: 15, quantidade_minima: 5 },
  ];
  const { data: estoqueExistente } = await supabase.from("estoque").select("*").eq("bar_id", bar.id);
  if (!estoqueExistente || estoqueExistente.length === 0) {
    must(
      "criar estoque",
      await supabase.from("estoque").insert(
        estoqueDef.map((e) => ({
          bar_id: bar.id,
          produto_id: produto(e.nome).id,
          quantidade_atual: e.quantidade_atual,
          quantidade_minima: e.quantidade_minima,
          unidade: "un",
        }))
      )
    );
  }

  // 9. Turno aberto (idempotente)
  let { data: turno } = await supabase
    .from("turnos")
    .select("*")
    .eq("bar_id", bar.id)
    .eq("status", "aberto")
    .maybeSingle();
  if (!turno) {
    turno = must(
      "abrir turno",
      await supabase
        .from("turnos")
        .insert({ bar_id: bar.id, abertura_por: donoUser.id })
        .select()
        .single()
    );
  }
  console.log("Turno aberto:", turno.id);

  // 10. Comandas + itens (só roda se ainda não houver comandas neste turno)
  const { data: comandasExistentes } = await supabase
    .from("comandas")
    .select("*")
    .eq("turno_id", turno.id);

  if (!comandasExistentes || comandasExistentes.length === 0) {
    const comandasDef = [
      { identificador: "Mesa 1 - João", mesa: "Mesa 1", pagar: false },
      { identificador: "Balcão - Maria", mesa: "Balcão", pagar: false },
      { identificador: "Mesa 2 - Pedro", mesa: "Mesa 2", pagar: true },
      { identificador: "Varanda - Ana", mesa: "Varanda", pagar: true },
      { identificador: "Mesa 1 - Carlos", mesa: "Mesa 1", pagar: true },
    ];
    const itensPorComanda = {
      "Mesa 1 - João": [["Gin Tônica", 1]],
      "Balcão - Maria": [
        ["Caipirinha", 1],
        ["Batata Frita", 1],
      ],
      "Mesa 2 - Pedro": [
        ["Gin Tônica", 2],
        ["Batata Frita", 1],
      ],
      "Varanda - Ana": [
        ["Chopp 500ml", 3],
        ["Heineken Long Neck", 2],
      ],
      "Mesa 1 - Carlos": [
        ["Caipirinha", 2],
        ["Chopp 500ml", 2],
      ],
    };

    await criarComandasEPagamentos({ bar, turno, donoUser, mesa, produto, comandasDef, itensPorComanda });
    console.log("Comandas e itens criados.");
  } else {
    console.log("Comandas já existem para este turno, pulando.");
  }

  // 11. Turnos históricos fechados (para S06/S20) — não tocam em Heineken,
  // que fica de propósito abaixo do mínimo desde o passo 8.
  const { data: historicoExistente } = await supabase
    .from("turnos")
    .select("id")
    .eq("bar_id", bar.id)
    .like("observacoes", "seed-historico%");

  if (!historicoExistente || historicoExistente.length === 0) {
    const hoje = new Date();
    const diasAtras = (n) => new Date(hoje.getTime() - n * 24 * 60 * 60 * 1000);

    const turnosHistoricoDef = [
      {
        marcador: "seed-historico-2",
        abertura: diasAtras(2),
        comandasDef: [
          { identificador: "Mesa 2 - Beatriz", mesa: "Mesa 2", pagar: true },
          { identificador: "Balcão - Felipe", mesa: "Balcão", pagar: true },
          { identificador: "Varanda - Marina", mesa: "Varanda", pagar: true },
          { identificador: "Mesa 1 - Lucas", mesa: "Mesa 1", pagar: true },
        ],
        itensPorComanda: {
          "Mesa 2 - Beatriz": [
            ["Gin Tônica", 2],
            ["Batata Frita", 1],
          ],
          "Balcão - Felipe": [["Chopp 500ml", 4]],
          "Varanda - Marina": [
            ["Caipirinha", 3],
            ["Chopp 500ml", 2],
          ],
          "Mesa 1 - Lucas": [
            ["Gin Tônica", 1],
            ["Chopp 500ml", 2],
          ],
        },
      },
      {
        marcador: "seed-historico-1",
        abertura: diasAtras(1),
        comandasDef: [
          { identificador: "Mesa 1 - Camila", mesa: "Mesa 1", pagar: true },
          { identificador: "Mesa 2 - Diego", mesa: "Mesa 2", pagar: true },
          { identificador: "Balcão - Sofia", mesa: "Balcão", pagar: true },
        ],
        itensPorComanda: {
          "Mesa 1 - Camila": [
            ["Caipirinha", 2],
            ["Batata Frita", 2],
          ],
          "Mesa 2 - Diego": [["Chopp 500ml", 3]],
          "Balcão - Sofia": [["Gin Tônica", 3]],
        },
      },
    ];

    for (const def of turnosHistoricoDef) {
      const abertoEm = def.abertura.toISOString();
      const fechadoEm = new Date(def.abertura.getTime() + 6 * 60 * 60 * 1000).toISOString();

      const turnoHistorico = must(
        `abrir turno histórico ${def.marcador}`,
        await supabase
          .from("turnos")
          .insert({
            bar_id: bar.id,
            abertura_por: donoUser.id,
            aberto_em: abertoEm,
            observacoes: def.marcador,
          })
          .select()
          .single()
      );

      // dataReferencia vira aberta_em da comanda e, por tabela, o
      // adicionado_em dos itens e o processado_em do pagamento — assim os
      // dados ficam distribuídos ao longo dos dias no gráfico do S06.
      await criarComandasEPagamentos({
        bar,
        turno: turnoHistorico,
        donoUser,
        mesa,
        produto,
        comandasDef: def.comandasDef,
        itensPorComanda: def.itensPorComanda,
        dataReferencia: abertoEm,
      });

      must(
        `fechar turno ${def.marcador}`,
        await supabase
          .from("turnos")
          .update({ status: "fechado", fechamento_por: donoUser.id, fechado_em: fechadoEm })
          .eq("id", turnoHistorico.id)
      );
    }

    console.log("Turnos históricos criados.");
  } else {
    console.log("Turnos históricos já existem, pulando.");
  }

  // 12. 30 dias de histórico variado (S06/S20) — dias 3 a 30 atrás.
  // Os dias 1 e 2 atrás já vêm do bloco "seed-historico-1/2" acima; não
  // duplicamos esses dois dias aqui.
  const { data: mesHistoricoExistente } = await supabase
    .from("turnos")
    .select("id")
    .eq("bar_id", bar.id)
    .like("observacoes", "seed-mes-%");

  if (!mesHistoricoExistente || mesHistoricoExistente.length === 0) {
    const hojeMes = new Date();
    const diasAtrasMes = (n) => new Date(hojeMes.getTime() - n * 24 * 60 * 60 * 1000);

    // Buffer generoso pra absorver 28 dias de vendas aleatórias sem ficar
    // negativo. Heineken fica de fora de propósito — alerta de estoque do S05.
    const produtosVendaveis = ["Gin Tônica", "Caipirinha", "Chopp 500ml", "Batata Frita"];
    const buffers = {
      "Gin Tônica": 1200,
      Caipirinha: 1200,
      "Chopp 500ml": 1600,
      "Batata Frita": 900,
    };

    for (const nome of produtosVendaveis) {
      const p = produto(nome);
      const { data: linhaEstoque } = await supabase
        .from("estoque")
        .select("id, quantidade_atual")
        .eq("bar_id", bar.id)
        .eq("produto_id", p.id)
        .single();
      must(
        `aumentar estoque de ${nome}`,
        await supabase
          .from("estoque")
          .update({ quantidade_atual: linhaEstoque.quantidade_atual + buffers[nome] })
          .eq("id", linhaEstoque.id)
      );
    }

    const nomesClientes = [
      "João", "Maria", "Pedro", "Ana", "Carlos", "Beatriz", "Felipe", "Marina",
      "Lucas", "Camila", "Diego", "Sofia", "Rafael", "Juliana", "Bruno", "Fernanda",
      "Gustavo", "Larissa", "Thiago", "Patrícia",
    ];
    const mesasNomes = ["Mesa 1", "Mesa 2", "Varanda", "Balcão"];

    const aleatorio = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const escolherAleatorio = (lista) => lista[aleatorio(0, lista.length - 1)];

    for (let d = 30; d >= 3; d--) {
      const marcador = `seed-mes-${d}`;
      const abertura = diasAtrasMes(d);
      const diaDaSemana = abertura.getDay(); // 0=dom ... 6=sáb
      const isWeekend = diaDaSemana === 5 || diaDaSemana === 6; // sex/sáb

      const numComandas = aleatorio(3, 8) + (isWeekend ? aleatorio(1, 2) : 0);

      const comandasDef = [];
      const itensPorComanda = {};
      const usados = new Set();

      for (let i = 0; i < numComandas; i++) {
        let identificador;
        do {
          identificador = `${escolherAleatorio(mesasNomes)} - ${escolherAleatorio(nomesClientes)}`;
        } while (usados.has(identificador));
        usados.add(identificador);

        comandasDef.push({ identificador, mesa: identificador.split(" - ")[0], pagar: true });

        const numItens = aleatorio(1, 4);
        const itens = [];
        for (let j = 0; j < numItens; j++) {
          itens.push([escolherAleatorio(produtosVendaveis), aleatorio(1, 3)]);
        }
        itensPorComanda[identificador] = itens;
      }

      const abertoEm = abertura.toISOString();
      const fechadoEm = new Date(abertura.getTime() + 6 * 60 * 60 * 1000).toISOString();

      const turnoMes = must(
        `abrir turno ${marcador}`,
        await supabase
          .from("turnos")
          .insert({
            bar_id: bar.id,
            abertura_por: donoUser.id,
            aberto_em: abertoEm,
            observacoes: marcador,
          })
          .select()
          .single()
      );

      await criarComandasEPagamentos({
        bar,
        turno: turnoMes,
        donoUser,
        mesa,
        produto,
        comandasDef,
        itensPorComanda,
        dataReferencia: abertoEm,
      });

      must(
        `fechar turno ${marcador}`,
        await supabase
          .from("turnos")
          .update({ status: "fechado", fechamento_por: donoUser.id, fechado_em: fechadoEm })
          .eq("id", turnoMes.id)
      );
    }

    console.log("30 dias de histórico criados (dias 3-30; dias 1-2 já existiam).");
  } else {
    console.log("Histórico de 30 dias já existe, pulando.");
  }

  console.log("\nSeed concluído.");
  console.log(`Login: ${DONO_EMAIL} / ${DONO_PASSWORD}`);
}

main();
