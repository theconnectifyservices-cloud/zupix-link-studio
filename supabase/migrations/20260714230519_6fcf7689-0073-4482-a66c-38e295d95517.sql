
-- Allow public (unauthenticated) read access to non-private, non-deleted, non-archived bio pages
GRANT SELECT ON public.bio_pages TO anon;

CREATE POLICY "Public can view public bio pages"
ON public.bio_pages
FOR SELECT
TO anon
USING (
  deleted_at IS NULL
  AND visibility <> 'private'
  AND status <> 'archived'
);
