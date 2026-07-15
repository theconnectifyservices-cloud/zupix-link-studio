
-- storage.objects RLS for media bucket. Path convention: <workspace_id>/<uuid>/<filename>
CREATE POLICY "media: workspace members view" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'media'
    AND public.is_workspace_member(auth.uid(), (split_part(name, '/', 1))::uuid)
  );

CREATE POLICY "media: workspace members upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND public.is_workspace_member(auth.uid(), (split_part(name, '/', 1))::uuid)
    AND owner = auth.uid()
  );

CREATE POLICY "media: owner or admin update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media'
    AND (
      owner = auth.uid()
      OR public.workspace_role_of(auth.uid(), (split_part(name, '/', 1))::uuid) = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role])
    )
  );

CREATE POLICY "media: owner or admin delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media'
    AND (
      owner = auth.uid()
      OR public.workspace_role_of(auth.uid(), (split_part(name, '/', 1))::uuid) = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role])
    )
  );
