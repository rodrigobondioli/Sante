-- Rode no SQL Editor do Supabase para criar o bucket de imagens de produtos.
-- Supabase Dashboard → SQL Editor → Cole e execute.

-- 1. Criar bucket público
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- 2. Policy: qualquer autenticado pode fazer upload
create policy "Autenticados podem fazer upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

-- 3. Policy: leitura pública (imagens visíveis no bartender sem login)
create policy "Leitura pública"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');

-- 4. Policy: dono pode deletar seus próprios uploads
create policy "Autenticados podem deletar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');
