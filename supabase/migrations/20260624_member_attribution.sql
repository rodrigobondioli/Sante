-- ============================================================
-- Atribuição operacional por bar_members.id
--
-- Problema resolvido:
--   Os campos de atribuição anteriores (bartender_id, adicionado_por,
--   cancelado_por, processado_por, criado_por) apontavam para profiles(id),
--   que exige auth. Staff operacional (bartender, garçom, caixa) tem
--   user_id = NULL em bar_members — nunca seria atribuído.
--
-- Solução:
--   Colunas paralelas *_member_id apontando para bar_members(id).
--   Todo staff tem bar_members.id — com ou sem conta auth.
--   As colunas profiles.id antigas permanecem para compatibilidade.
--
-- PIN (Fase 2 — UX):
--   Coluna pin TEXT(4) em bar_members. A tela "Quem é você?" vai exibir
--   lista de membros e pedir PIN para confirmar. O device resolve o
--   bar_members.id localmente e passa para as server actions.
-- ============================================================


-- ── PIN em bar_members ────────────────────────────────────────────────────────

ALTER TABLE public.bar_members
  ADD COLUMN IF NOT EXISTS pin TEXT
    CHECK (pin IS NULL OR (length(pin) = 4 AND pin ~ '^\d+$'));

COMMENT ON COLUMN public.bar_members.pin IS
  'PIN numérico de 4 dígitos para identificação rápida na tela "Quem é você?".
   NULL = membro não precisa de PIN (dono/gerente com auth completo).
   Não é senha — não protege dados, apenas identifica o operador no device.';


-- ── comandas ──────────────────────────────────────────────────────────────────

ALTER TABLE public.comandas
  ADD COLUMN IF NOT EXISTS aberta_por_member_id UUID
    REFERENCES public.bar_members(id);

COMMENT ON COLUMN public.comandas.aberta_por_member_id IS
  'Membro operacional que abriu a comanda. Fonte de verdade para ranking de garçom/bartender.
   Complementa bartender_id (profiles.id) que só funciona para usuários com auth.';


-- ── comanda_items ─────────────────────────────────────────────────────────────

ALTER TABLE public.comanda_items
  ADD COLUMN IF NOT EXISTS adicionado_por_member_id UUID
    REFERENCES public.bar_members(id),
  ADD COLUMN IF NOT EXISTS cancelado_por_member_id UUID
    REFERENCES public.bar_members(id);

COMMENT ON COLUMN public.comanda_items.adicionado_por_member_id IS
  'Membro que adicionou o item. Fonte para "quem vendeu mais".';

COMMENT ON COLUMN public.comanda_items.cancelado_por_member_id IS
  'Membro que cancelou o item. Fonte para "quem mais cancela / causa desperdício".';


-- ── pedidos ───────────────────────────────────────────────────────────────────

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS criado_por_member_id   UUID REFERENCES public.bar_members(id),
  ADD COLUMN IF NOT EXISTS iniciado_por_member_id UUID REFERENCES public.bar_members(id),
  ADD COLUMN IF NOT EXISTS entregue_por_member_id UUID REFERENCES public.bar_members(id);

COMMENT ON COLUMN public.pedidos.criado_por_member_id IS
  'Garçom/bartender que criou o pedido (enviou para a fila).';

COMMENT ON COLUMN public.pedidos.iniciado_por_member_id IS
  'Bartender que iniciou o preparo.';

COMMENT ON COLUMN public.pedidos.entregue_por_member_id IS
  'Bartender que marcou como entregue. Fonte para tempo de preparo por bartender.';


-- ── pagamentos ────────────────────────────────────────────────────────────────

ALTER TABLE public.pagamentos
  ADD COLUMN IF NOT EXISTS processado_por_member_id UUID
    REFERENCES public.bar_members(id);

COMMENT ON COLUMN public.pagamentos.processado_por_member_id IS
  'Membro que registrou o pagamento (caixa). Fonte para auditoria de caixa por operador.';


-- ── ingrediente_movimentos ────────────────────────────────────────────────────

ALTER TABLE public.ingrediente_movimentos
  ADD COLUMN IF NOT EXISTS criado_por_member_id UUID
    REFERENCES public.bar_members(id);

COMMENT ON COLUMN public.ingrediente_movimentos.criado_por_member_id IS
  'Membro que gerou o movimento (venda via RPC, entrada manual, ajuste).
   Complementa criado_por (profiles.id) — garante rastreabilidade mesmo sem auth.';


-- ── Índices para queries de ranking ──────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_comandas_aberta_member
  ON public.comandas(aberta_por_member_id);

CREATE INDEX IF NOT EXISTS idx_comanda_items_adicionado_member
  ON public.comanda_items(adicionado_por_member_id);

CREATE INDEX IF NOT EXISTS idx_comanda_items_cancelado_member
  ON public.comanda_items(cancelado_por_member_id);

CREATE INDEX IF NOT EXISTS idx_pedidos_criado_member
  ON public.pedidos(criado_por_member_id);

CREATE INDEX IF NOT EXISTS idx_pedidos_entregue_member
  ON public.pedidos(entregue_por_member_id);

CREATE INDEX IF NOT EXISTS idx_pagamentos_processado_member
  ON public.pagamentos(processado_por_member_id);


-- ── fn_entregar_pedido (atualizado com p_member_id) ───────────────────────────
--
-- Mudanças em relação à versão anterior:
--   • Aceita p_member_id UUID DEFAULT NULL (opcional — backward compat)
--   • Preenche pedidos.entregue_por_member_id
--   • Preenche ingrediente_movimentos.criado_por_member_id
--   • Mantém criado_por (profiles.id) para quem ainda tem auth

CREATE OR REPLACE FUNCTION public.fn_entregar_pedido(
  p_pedido_id UUID,
  p_user_id   UUID,
  p_member_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pedido  RECORD;
  v_item    RECORD;
  v_receita RECORD;
  v_ing     RECORD;
  v_deducao NUMERIC(12,3);
  v_alertas JSONB := '[]'::JSONB;
BEGIN
  -- 1. Valida pedido: deve estar em 'preparando' e pertencer ao bar do usuário
  SELECT p.*
  INTO   v_pedido
  FROM   public.pedidos p
  WHERE  p.id     = p_pedido_id
    AND  p.status = 'preparando'
    AND  public.is_bar_member(p.bar_id);   -- auth.uid() via JWT mesmo em security definer

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok',    false,
      'error', 'Pedido não encontrado, status inválido ou acesso negado.'
    );
  END IF;

  -- 2. Marca como entregue + registra quem entregou (por member_id)
  UPDATE public.pedidos
  SET    status                 = 'entregue',
         entregue_em            = now(),
         entregue_por_member_id = p_member_id
  WHERE  id = p_pedido_id;

  -- 3. Percorre itens ativos do pedido
  FOR v_item IN
    SELECT id, produto_id, quantidade, bar_id
    FROM   public.comanda_items
    WHERE  pedido_id = p_pedido_id
      AND  status    = 'ativo'
  LOOP

    -- 3a. Percorre receita do produto (sem receita = sem baixa, sem erro)
    FOR v_receita IN
      SELECT ingrediente_id,
             quantidade AS qtd_por_unidade
      FROM   public.receitas
      WHERE  produto_id = v_item.produto_id
        AND  bar_id     = v_item.bar_id
    LOOP
      v_deducao := v_receita.qtd_por_unidade * v_item.quantidade;

      -- 3b. Snapshot do custo atual antes de decrementar
      SELECT custo_atual
      INTO   v_ing
      FROM   public.ingredientes
      WHERE  id = v_receita.ingrediente_id;

      -- 3c. Cria movimento de saída (quantidade negativa = consumo)
      INSERT INTO public.ingrediente_movimentos (
        bar_id, ingrediente_id,
        pedido_id, comanda_item_id,
        tipo, quantidade, custo_unitario,
        criado_por, criado_por_member_id
      ) VALUES (
        v_item.bar_id,
        v_receita.ingrediente_id,
        p_pedido_id,
        v_item.id,
        'venda',
        -v_deducao,          -- negativo: saída de estoque
        v_ing.custo_atual,   -- snapshot imutável do custo no momento da venda
        p_user_id,           -- profiles.id — para usuários com auth
        p_member_id          -- bar_members.id — para todos (com ou sem auth)
      );

      -- 3d. Decrementa estoque_atual
      UPDATE public.ingredientes
      SET    estoque_atual = estoque_atual - v_deducao,
             atualizado_em = now()
      WHERE  id = v_receita.ingrediente_id;

      -- 3e. Verifica alerta de estoque baixo (lê após update)
      SELECT id, nome, estoque_atual, estoque_minimo
      INTO   v_ing
      FROM   public.ingredientes
      WHERE  id = v_receita.ingrediente_id;

      IF v_ing.estoque_minimo > 0
        AND v_ing.estoque_atual < v_ing.estoque_minimo
      THEN
        v_alertas := v_alertas || jsonb_build_array(
          jsonb_build_object(
            'ingrediente_id', v_ing.id,
            'nome',           v_ing.nome,
            'estoque_atual',  v_ing.estoque_atual,
            'estoque_minimo', v_ing.estoque_minimo
          )
        );
      END IF;

    END LOOP; -- receita
  END LOOP;   -- item

  RETURN jsonb_build_object('ok', true, 'alertas', v_alertas);
END;
$$;

COMMENT ON FUNCTION public.fn_entregar_pedido IS
  'Motor de entrega transacional: atualiza pedido + baixa ingredientes + coleta alertas.
   Chamado explicitamente pelo app — NUNCA dispara automaticamente.
   p_member_id (opcional): bar_members.id do bartender — garante rastreabilidade
   mesmo para staff sem conta auth. Backward compat: funciona sem p_member_id.
   Retorna: { ok: true, alertas: [{ingrediente_id, nome, estoque_atual, estoque_minimo}] }
         ou { ok: false, error: "..." }';
