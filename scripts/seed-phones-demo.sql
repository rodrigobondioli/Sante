-- ─── Seed: Telefones Demo ──────────────────────────────────────────────────────
-- Adiciona telefones fictícios aos clientes do bar Aurora.
-- Roda no SQL Editor do Supabase.
-- Não sobrescreve quem já tem telefone.

DO $$
DECLARE
  v_bar_id UUID;
BEGIN
  SELECT id INTO v_bar_id FROM public.bars ORDER BY created_at LIMIT 1;
  IF v_bar_id IS NULL THEN RAISE EXCEPTION 'Nenhum bar encontrado.'; END IF;

  WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY nome) AS rn
    FROM public.clientes
    WHERE bar_id = v_bar_id AND telefone IS NULL
  )
  UPDATE public.clientes cl
  SET telefone = CASE n.rn
    WHEN  1 THEN '(11) 99234-5678'
    WHEN  2 THEN '(11) 98765-4321'
    WHEN  3 THEN '(21) 97654-3210'
    WHEN  4 THEN '(11) 93200-1310'
    WHEN  5 THEN '(11) 94567-8901'
    WHEN  6 THEN '(21) 98123-4567'
    WHEN  7 THEN '(11) 99876-5432'
    WHEN  8 THEN '(11) 97890-1234'
    WHEN  9 THEN '(21) 96543-2109'
    WHEN 10 THEN '(11) 95678-9012'
    WHEN 11 THEN '(11) 98901-2345'
    WHEN 12 THEN '(21) 97012-3456'
    WHEN 13 THEN '(11) 96123-4567'
    WHEN 14 THEN '(11) 95234-5678'
    WHEN 15 THEN '(21) 94345-6789'
    WHEN 16 THEN '(11) 93456-7890'
    WHEN 17 THEN '(11) 92567-8901'
    WHEN 18 THEN '(21) 91678-9012'
    WHEN 19 THEN '(11) 99789-0123'
    WHEN 20 THEN '(11) 98890-1234'
    WHEN 21 THEN '(11) 97901-2345'
    WHEN 22 THEN '(21) 96012-3456'
    WHEN 23 THEN '(11) 95123-4567'
    WHEN 24 THEN '(11) 94234-5678'
    WHEN 25 THEN '(21) 93345-6789'
    WHEN 26 THEN '(11) 92456-7890'
    WHEN 27 THEN '(11) 91567-8901'
    WHEN 28 THEN '(21) 99678-9012'
    WHEN 29 THEN '(11) 98789-0123'
    WHEN 30 THEN '(11) 97890-1234'
    ELSE NULL
  END
  FROM numbered n
  WHERE cl.id = n.id AND cl.bar_id = v_bar_id;

  RAISE NOTICE '✅ Telefones adicionados.';
END;
$$;

-- Verificação
SELECT nome, telefone, drink_favorito
FROM public.clientes
WHERE bar_id = (SELECT id FROM public.bars ORDER BY created_at LIMIT 1)
ORDER BY nome
LIMIT 30;
