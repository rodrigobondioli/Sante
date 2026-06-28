-- ─── Seed: Clientes Demo ──────────────────────────────────────────────────────
-- Cria clientes a partir dos identificadores das comandas do seed histórico
-- e linka os registros via cliente_id + nome_cliente.
-- Roda no SQL Editor do Supabase.

DO $$
DECLARE
  v_bar_id UUID;
BEGIN

  -- 1. Pega o bar_id (primeiro bar do sistema, que é o Aurora)
  SELECT id INTO v_bar_id FROM public.bars ORDER BY created_at LIMIT 1;
  IF v_bar_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum bar encontrado.';
  END IF;

  RAISE NOTICE 'Bar: %', v_bar_id;

  -- 2. Insere clientes únicos a partir dos identificadores das comandas
  --    (identificador era o nome do cliente no seed)
  INSERT INTO public.clientes (bar_id, identificador, nome)
  SELECT DISTINCT
    v_bar_id,
    identificador,
    identificador   -- no seed, identificador = nome
  FROM public.comandas
  WHERE bar_id = v_bar_id
    AND identificador IS NOT NULL
    AND identificador <> ''
  ON CONFLICT (bar_id, identificador) DO NOTHING;

  RAISE NOTICE 'Clientes inseridos (ou já existiam).';

  -- 3. Preenche nome_cliente nas comandas (campo foi adicionado depois do seed)
  UPDATE public.comandas
  SET nome_cliente = identificador
  WHERE bar_id = v_bar_id
    AND identificador IS NOT NULL
    AND nome_cliente IS NULL;

  -- 4. Linka cliente_id nas comandas
  UPDATE public.comandas c
  SET cliente_id = cl.id
  FROM public.clientes cl
  WHERE c.bar_id = v_bar_id
    AND cl.bar_id = v_bar_id
    AND c.identificador = cl.identificador
    AND c.cliente_id IS NULL;

  RAISE NOTICE 'Comandas linkadas.';

  -- 5. Recalcula agregados de cada cliente
  UPDATE public.clientes cl
  SET
    total_visitas = agg.visitas,
    total_gasto   = agg.gasto,
    ultima_visita = agg.ultima,
    ticket_medio  = CASE WHEN agg.visitas > 0 THEN ROUND(agg.gasto / agg.visitas, 2) ELSE 0 END,
    updated_at    = now()
  FROM (
    SELECT
      cliente_id,
      COUNT(*)                        AS visitas,
      COALESCE(SUM(total), 0)          AS gasto,
      MAX(fechada_em)                 AS ultima
    FROM public.comandas
    WHERE bar_id = v_bar_id
      AND cliente_id IS NOT NULL
      AND status = 'paga'
    GROUP BY cliente_id
  ) agg
  WHERE cl.id = agg.cliente_id
    AND cl.bar_id = v_bar_id;

  RAISE NOTICE 'Agregados calculados.';

  -- 6. Distribui datas de nascimento fictícias (para demo de aniversariantes)
  --    Datas variadas ao longo do ano, idade entre 25-45 anos
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY nome) AS rn
    FROM public.clientes
    WHERE bar_id = v_bar_id
  )
  UPDATE public.clientes cl
  SET data_nascimento = CASE r.rn
    WHEN  1 THEN DATE '1990-01-15'
    WHEN  2 THEN DATE '1988-02-22'
    WHEN  3 THEN DATE '1995-03-10'
    WHEN  4 THEN DATE '1992-04-05'
    WHEN  5 THEN DATE '1987-05-18'
    WHEN  6 THEN DATE '1993-06-27'  -- provável aniversariante do mês!
    WHEN  7 THEN DATE '1991-06-30'  -- provável aniversariante do mês!
    WHEN  8 THEN DATE '1989-07-14'
    WHEN  9 THEN DATE '1994-08-03'
    WHEN 10 THEN DATE '1990-09-21'
    WHEN 11 THEN DATE '1986-10-09'
    WHEN 12 THEN DATE '1997-11-16'
    WHEN 13 THEN DATE '1992-12-01'
    WHEN 14 THEN DATE '1988-01-28'
    WHEN 15 THEN DATE '1995-02-14'
    WHEN 16 THEN DATE '1991-03-30'
    WHEN 17 THEN DATE '1993-04-11'
    WHEN 18 THEN DATE '1987-05-25'
    WHEN 19 THEN DATE '1996-06-08'  -- outro aniversariante de junho!
    WHEN 20 THEN DATE '1990-07-19'
    WHEN 21 THEN DATE '1989-08-27'
    WHEN 22 THEN DATE '1994-09-13'
    WHEN 23 THEN DATE '1992-10-22'
    WHEN 24 THEN DATE '1988-11-07'
    WHEN 25 THEN DATE '1997-12-18'
    WHEN 26 THEN DATE '1991-01-04'
    WHEN 27 THEN DATE '1993-02-28'
    WHEN 28 THEN DATE '1990-03-16'
    WHEN 29 THEN DATE '1985-04-23'
    WHEN 30 THEN DATE '1996-05-31'
    ELSE NULL
  END
  FROM ranked r
  WHERE cl.id = r.id
    AND cl.bar_id = v_bar_id
    AND cl.data_nascimento IS NULL;

  RAISE NOTICE '✅ Done! Clientes prontos para demo.';
END;
$$;

-- Verificação
SELECT
  nome,
  total_visitas,
  total_gasto,
  ticket_medio,
  ultima_visita::date AS ultima_visita,
  data_nascimento
FROM public.clientes
ORDER BY total_gasto DESC;
