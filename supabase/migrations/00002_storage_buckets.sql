-- Storage buckets for avatars, project covers, and banners
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
),
(
  'project-covers',
  'project-covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
),
(
  'project-banners',
  'project-banners',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS for avatars: users can upload to their own folder
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- RLS for project covers and banners: project founders can upload
CREATE POLICY "Project founders can upload covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-covers'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND p.founder_id = auth.uid()
    )
  );

CREATE POLICY "Project founders can update covers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'project-covers'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND p.founder_id = auth.uid()
    )
  );

CREATE POLICY "Project founders can delete covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-covers'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND p.founder_id = auth.uid()
    )
  );

CREATE POLICY "Project covers are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-covers');

CREATE POLICY "Project founders can upload banners"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-banners'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND p.founder_id = auth.uid()
    )
  );

CREATE POLICY "Project founders can update banners"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'project-banners'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND p.founder_id = auth.uid()
    )
  );

CREATE POLICY "Project founders can delete banners"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-banners'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND p.founder_id = auth.uid()
    )
  );

CREATE POLICY "Project banners are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-banners');
