-- ============================================================
-- Tabela de Insights — Estágio 2: Inteligência
--
-- Guarda interpretação, não transação.
-- Transação: "vendeu 12 Negronis"
-- Insight:    "Negroni perdeu margem esta semana"
--
-- Gerada por Edge Function com cron diário.
-- Lida pelo dono na tela "O que precisa da minha atenção hoje?".
--
-- dedupe_key evita criar o mesmo alerta múltiplas vezes
-- enquanto ainda não foi lido (unique partial index).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.insights (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id           UUID           NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,

  -- Tipo de insight — extensível via TEXT (não enum)
  -- Exemplos: cmv_alto_produto, estoque_critico, produto_sem_venda,
  --           staff_destaque, ticket_medio_caindo, horario_pico
  tipo             TEXT           NOT NULL,

  titulo           TEXT           NOT NULL,
  descricao        TEXT           NOT NULL,

  -- Impacto financeiro estimado. Negativo = perda. Positivo = oportunidade.
  impacto_valor    NUMERIC(10,2),

  -- Contexto bruto que gerou o insight — para drill-down e debugging.
  -- Exemplo: { produto_id, cmv_pct, custo_total, receita_total, janela_dias }
  dado_referencia  JSONB          NOT NULL DEFAULT '{}'::JSONB,

  -- Chave de deduplicação. Formato: '{tipo}:{entidade_id}:{periodo}'
  -- Exemplo: 'cmv_alto_produto:uuid-gin-tonica:2026-W26'
  -- Com o unique partial index abaixo, impede criar o mesmo alerta
  -- enquanto ele não foi lido.
  dedupe_key       TEXT           NOT NULL,

  lido             BOOLEAN        NOT NULL DEFAULT false,

  criado_em        TIMESTAMPTZ    NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.insights IS
  'Inteligência persistida do bar. Gerada por Edge Function (cron diário).
   Cada linha é uma interpretação acionável dos dados operacionais.
   Não duplica transações — guarda a conclusão, não o evento.';

COMMENT ON COLUMN public.insights.dedupe_key IS
  'Chave para evitar criar o mesmo insight múltiplas vezes.
   Formato: {tipo}:{entidade_id}:{periodo}
   Exemplo: cmv_alto_produto:550e8400-e29b:2026-W26
   O unique partial index garante unicidade apenas enquanto lido=false.
   Quando o dono marca como lido, um novo insight pode ser gerado na próxima semana.';

COMMENT ON COLUMN public.insights.impacto_valor IS
  'Impacto financeiro estimado em R$. Negativo = perda/custo. Positivo = oportunidade.
   Usado para ordenar insights por urgência financeira.';


-- ── Índices ───────────────────────────────────────────────────────────────────

-- Query principal: "me mostra os insights não lidos deste bar, mais recentes primeiro"
CREATE INDEX IF NOT EXISTS idx_insights_bar_criado
  ON public.insights(bar_id, criado_em DESC);

-- Query de badge: "quantos insights não lidos tem este bar?"
CREATE INDEX IF NOT EXISTS idx_insights_bar_lido
  ON public.insights(bar_id, lido, criado_em DESC);

-- Deduplicação: impede criar o mesmo insight enquanto não foi lido.
-- Unique PARCIAL — só aplica quando lido = false.
-- Quando o dono marca como lido, um novo pode entrar na semana seguinte.
CREATE UNIQUE INDEX IF NOT EXISTS idx_insights_dedupe_open
  ON public.insights(bar_id, dedupe_key)
  WHERE lido = false;


-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- Dono/gerente lê os insights do próprio bar
CREATE POLICY "insights_select_member"
  ON public.insights
  FOR SELECT
  USING (public.is_bar_member(bar_id));

-- Dono/gerente marca como lido
CREATE POLICY "insights_update_member"
  ON public.insights
  FOR UPDATE
  USING (public.is_bar_member(bar_id));

-- INSERT só via service role (Edge Function com SUPABASE_SERVICE_ROLE_KEY)
-- with check (true) = aceita qualquer insert que passe pelo service role
CREATE POLICY "insights_insert_service"
  ON public.insights
  FOR INSERT
  WITH CHECK (true);
