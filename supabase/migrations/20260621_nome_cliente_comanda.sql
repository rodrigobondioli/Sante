-- Adiciona nome_cliente à comanda para identificar a pessoa no cartão/mesa
ALTER TABLE comandas
  ADD COLUMN IF NOT EXISTS nome_cliente TEXT;
