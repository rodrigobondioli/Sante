-- Seed: popula o cardápio da Aurora Bar com produtos de demo
-- Rode isso no SQL Editor do Supabase (https://app.supabase.com → SQL Editor)

DO $$
DECLARE
  v_bar_id uuid;
  c_drinques uuid;
  c_cervejas uuid;
  c_vinhos   uuid;
  c_destil   uuid;
  c_petiscos uuid;
  c_semalk   uuid;
BEGIN
  -- pega o bar_id da Aurora Bar (ajuste o nome se necessário)
  SELECT id INTO v_bar_id FROM bars WHERE nome = 'Aurora Bar' LIMIT 1;
  IF v_bar_id IS NULL THEN
    RAISE EXCEPTION 'Bar "Aurora Bar" não encontrado. Verifique o nome na tabela bars.';
  END IF;

  -- ── Categorias (insert or get existing) ────────────────────────────────────
  INSERT INTO categorias (bar_id, nome, ordem, ativo)
    VALUES (v_bar_id, 'Drinques',   1, true),
           (v_bar_id, 'Cervejas',   2, true),
           (v_bar_id, 'Vinhos',     3, true),
           (v_bar_id, 'Destilados', 4, true),
           (v_bar_id, 'Petiscos',   5, true),
           (v_bar_id, 'Sem Álcool', 6, true)
  ON CONFLICT DO NOTHING;

  SELECT id INTO c_drinques FROM categorias WHERE bar_id = v_bar_id AND nome = 'Drinques' LIMIT 1;
  SELECT id INTO c_cervejas FROM categorias WHERE bar_id = v_bar_id AND nome = 'Cervejas' LIMIT 1;
  SELECT id INTO c_vinhos   FROM categorias WHERE bar_id = v_bar_id AND nome = 'Vinhos'   LIMIT 1;
  SELECT id INTO c_destil   FROM categorias WHERE bar_id = v_bar_id AND nome = 'Destilados' LIMIT 1;
  SELECT id INTO c_petiscos FROM categorias WHERE bar_id = v_bar_id AND nome = 'Petiscos' LIMIT 1;
  SELECT id INTO c_semalk   FROM categorias WHERE bar_id = v_bar_id AND nome = 'Sem Álcool' LIMIT 1;

  -- ── Produtos ────────────────────────────────────────────────────────────────
  INSERT INTO produtos (bar_id, categoria_id, nome, preco, ativo)
  VALUES
    -- Drinques
    (v_bar_id, c_drinques, 'Negroni',        38, true),
    (v_bar_id, c_drinques, 'Aperol Spritz',  35, true),
    (v_bar_id, c_drinques, 'Mojito',         30, true),
    (v_bar_id, c_drinques, 'Dry Martini',    42, true),
    (v_bar_id, c_drinques, 'Whisky Sour',    40, true),
    (v_bar_id, c_drinques, 'Cosmopolitan',   36, true),
    -- Cervejas
    (v_bar_id, c_cervejas, 'Chopp 500ml',    18, true),
    (v_bar_id, c_cervejas, 'Heineken LN',    14, true),
    (v_bar_id, c_cervejas, 'Corona Extra',   16, true),
    (v_bar_id, c_cervejas, 'Stella Artois',  15, true),
    (v_bar_id, c_cervejas, 'Budweiser',      13, true),
    (v_bar_id, c_cervejas, 'Amstel',         13, true),
    -- Vinhos
    (v_bar_id, c_vinhos,   'Tinto Taça',     28, true),
    (v_bar_id, c_vinhos,   'Branco Taça',    26, true),
    (v_bar_id, c_vinhos,   'Rosé Taça',      27, true),
    (v_bar_id, c_vinhos,   'Espumante Taça', 32, true),
    -- Destilados
    (v_bar_id, c_destil,   'Whisky Dose',    35, true),
    (v_bar_id, c_destil,   'Rum Dose',       28, true),
    (v_bar_id, c_destil,   'Vodka Dose',     25, true),
    (v_bar_id, c_destil,   'Tequila Dose',   30, true),
    (v_bar_id, c_destil,   'Cachaça Dose',   18, true),
    -- Petiscos
    (v_bar_id, c_petiscos, 'Batata Frita',   35, true),
    (v_bar_id, c_petiscos, 'Onion Rings',    32, true),
    (v_bar_id, c_petiscos, 'Tábua Frios',    68, true),
    (v_bar_id, c_petiscos, 'Croquete x4',    28, true),
    (v_bar_id, c_petiscos, 'Bruschetta',     30, true),
    -- Sem Álcool
    (v_bar_id, c_semalk,   'Limonada',       16, true),
    (v_bar_id, c_semalk,   'Água s/ gás',     8, true),
    (v_bar_id, c_semalk,   'Água c/ gás',     9, true),
    (v_bar_id, c_semalk,   'Refrigerante',   10, true),
    (v_bar_id, c_semalk,   'Suco Natural',   18, true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seed concluído para bar_id = %', v_bar_id;
END $$;
