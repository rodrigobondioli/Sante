-- Adiciona custo de produção (nullable) em produtos e variantes
-- Custo é cidadão de primeira classe no schema (Princípio 10 do SUPERBAR)

ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS custo DECIMAL(10,2);

ALTER TABLE produto_variantes
  ADD COLUMN IF NOT EXISTS custo DECIMAL(10,2);
