-- ============================================================
-- MIGRATION: Pedidos do Cliente (menu público)
-- Rodar no SQL Editor do Supabase
-- ============================================================

-- 1. Políticas públicas de leitura para o app do cliente (usuários anônimos via NFC)
--    As políticas existentes (is_bar_member) continuam funcionando para membros autenticados.
--    No Supabase, múltiplas políticas SELECT são unidas com OR.

create policy "bars_select_public" on public.bars
  for select using (ativo = true);

create policy "mesas_select_public" on public.mesas
  for select using (ativo = true);

create policy "categorias_select_public" on public.categorias
  for select using (ativo = true);

create policy "produtos_select_public" on public.produtos
  for select using (ativo = true);


-- 2. Tabela de pedidos do cliente
--    Fila que alimenta a tela do bartender.
--    Separada de comandas/comanda_items (que exigem bartender autenticado).

create table public.pedidos_cliente (
  id           uuid          primary key default uuid_generate_v4(),
  bar_id       uuid          not null references public.bars(id),
  mesa_id      uuid          references public.mesas(id),
  nome_cliente text,
  itens        jsonb         not null,
  -- ex: [{"produto_id": "...", "nome": "Negroni", "preco": 48, "quantidade": 2}]
  total        numeric(10,2) not null default 0,
  status       text          not null default 'pendente',
  -- pendente | em_preparo | pronto | entregue | cancelado
  created_at   timestamptz   not null default now()
);

alter table public.pedidos_cliente enable row level security;

-- Qualquer pessoa (inclusive anônimo) pode fazer um pedido
create policy "pedidos_cliente_insert_public" on public.pedidos_cliente
  for insert with check (true);

-- Apenas membros do bar podem ler e atualizar
create policy "pedidos_cliente_select_member" on public.pedidos_cliente
  for select using (public.is_bar_member(bar_id));

create policy "pedidos_cliente_update_member" on public.pedidos_cliente
  for update using (public.is_bar_member(bar_id));


-- 3. Index para a fila do bartender (busca por bar + status)
create index idx_pedidos_cliente_bar_status
  on public.pedidos_cliente(bar_id, status, created_at desc);


-- 4. Realtime para a tela do bartender
-- Habilitar no Dashboard: Database → Replication → supabase_realtime → Tables
-- Ou via SQL (requer superuser):
-- alter publication supabase_realtime add table public.pedidos_cliente;
