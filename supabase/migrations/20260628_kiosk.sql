-- ── Kiosk token em bars ───────────────────────────────────────────────────────
-- Cada bar tem um token único gerado automaticamente.
-- O dono copia o link /kiosk/setup?token=KIOSK_TOKEN para o iPad.
-- O dispositivo salva o token num cookie de longa duração e
-- não precisa mais de login do dono para acessar as telas operacionais.
--
-- Para revogar acesso de um dispositivo: regenerar o token nas configurações
-- do bar (todos os iPads ativos perdem acesso e precisam reativar).

ALTER TABLE public.bars
  ADD COLUMN IF NOT EXISTS kiosk_token UUID
    NOT NULL
    DEFAULT gen_random_uuid();

-- Índice para lookup rápido por token
CREATE UNIQUE INDEX IF NOT EXISTS bars_kiosk_token_idx
  ON public.bars (kiosk_token);

COMMENT ON COLUMN public.bars.kiosk_token IS
  'Token de dispositivo para acesso kiosk (garçom/caixa/produção) sem login do dono.
   Gerado automaticamente. Regenerar para revogar acesso de todos os iPads.';
