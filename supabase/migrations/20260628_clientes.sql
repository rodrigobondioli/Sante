-- ─── Tabela clientes ──────────────────────────────────────────────────────────
-- Entidade cliente do bar. Identificado pelo token QR/NFC (identificador).
-- Criado automaticamente quando uma comanda é aberta com identificador,
-- ou manualmente pelo dono no dashboard.

CREATE TABLE IF NOT EXISTS public.clientes (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id            UUID        NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,

  -- Identificação
  identificador     TEXT,                        -- token QR/NFC do cartão
  nome              TEXT        NOT NULL,
  telefone          TEXT,
  email             TEXT,
  data_nascimento   DATE,
  time_coracao      TEXT,                        -- time de futebol / preferência
  notas             TEXT,                        -- campo livre para o dono anotar

  -- Agregados (atualizados a cada visita paga)
  total_visitas     INT         NOT NULL DEFAULT 0,
  ultima_visita     TIMESTAMPTZ,
  total_gasto       NUMERIC(10,2) NOT NULL DEFAULT 0,
  ticket_medio      NUMERIC(10,2),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unicidade: um identificador por bar (NULL permitido para cadastros manuais)
  CONSTRAINT clientes_bar_identificador_unique UNIQUE (bar_id, identificador)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clientes_bar_id        ON public.clientes(bar_id);
CREATE INDEX IF NOT EXISTS idx_clientes_identificador ON public.clientes(bar_id, identificador);
CREATE INDEX IF NOT EXISTS idx_clientes_nascimento    ON public.clientes(data_nascimento);

-- RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bar members can manage clientes"
  ON public.clientes FOR ALL
  USING (
    bar_id IN (
      SELECT bar_id FROM public.bar_members
      WHERE user_id = auth.uid() AND ativo = true
    )
  );

-- ─── FK em comandas ────────────────────────────────────────────────────────────
ALTER TABLE public.comandas
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_comandas_cliente_id ON public.comandas(cliente_id);

-- ─── Trigger updated_at ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clientes_updated_at ON public.clientes;
CREATE TRIGGER trg_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
