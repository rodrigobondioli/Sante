-- Adiciona coluna de ordenação manual às mesas.
-- Backfill usa o número da mesa como ordem inicial.

ALTER TABLE public.mesas
  ADD COLUMN IF NOT EXISTS ordem INTEGER;

UPDATE public.mesas
  SET ordem = numero
  WHERE ordem IS NULL;
