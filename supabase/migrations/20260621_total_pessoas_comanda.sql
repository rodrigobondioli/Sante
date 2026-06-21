-- Adiciona total_pessoas à comanda: quantas pessoas estão na mesa naquele turno.
-- Diferente de mesa.capacidade (máximo fixo), este campo é preenchido pelo bartender
-- ao abrir a comanda e pode ser menor ou igual à capacidade.
-- Null = não informado (comandas existentes antes desta migration).
ALTER TABLE comandas
  ADD COLUMN total_pessoas integer;
