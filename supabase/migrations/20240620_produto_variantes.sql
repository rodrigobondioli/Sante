-- Variantes de produto (ex: Caipirinha → Tradicional, Morango, Maracujá)
CREATE TABLE IF NOT EXISTS produto_variantes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id    UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  preco         NUMERIC(10,2) NOT NULL,
  imagem_url    TEXT,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  ordem         INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_produto_variantes_produto_id ON produto_variantes(produto_id);

-- Colunas em comanda_items para rastrear qual variante foi pedida
ALTER TABLE comanda_items
  ADD COLUMN IF NOT EXISTS variante_id   UUID REFERENCES produto_variantes(id),
  ADD COLUMN IF NOT EXISTS variante_nome TEXT;
