create table leads (
  id uuid primary key default gen_random_uuid(),
  nome_bar text not null,
  cidade text not null,
  tipo_bar text not null,
  whatsapp text not null,
  status text not null default 'novo',
  notas text,
  created_at timestamptz default now()
);

alter table leads enable row level security;

-- inserts públicos (landing page via server action com service key)
-- leitura apenas pelo service role
create policy "public insert" on leads for insert with check (true);
