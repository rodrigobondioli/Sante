-- Coluna foto_url nos membros
ALTER TABLE public.bar_members
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Bucket público para fotos de staff
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'staff-photos',
  'staff-photos',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Política: qualquer autenticado pode fazer upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'staff_photos_insert'
  ) THEN
    CREATE POLICY "staff_photos_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'staff-photos');
  END IF;
END$$;

-- Política: leitura pública
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'staff_photos_select'
  ) THEN
    CREATE POLICY "staff_photos_select" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'staff-photos');
  END IF;
END$$;

-- Política: dono pode deletar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'staff_photos_delete'
  ) THEN
    CREATE POLICY "staff_photos_delete" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'staff-photos');
  END IF;
END$$;
