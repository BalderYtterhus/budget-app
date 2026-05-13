-- 1. Make the receipts storage bucket private.
--    Public buckets expose every file to anyone who knows/guesses the URL.
--    After this, files are only accessible via authenticated SDK calls + RLS below.
UPDATE storage.buckets SET public = false WHERE id = 'receipts';

-- 2. Storage RLS — images are scoped to the owning household.
--    Upload path convention: {household_id}/{uuid}
--    (storage.foldername(name))[1] extracts the first path segment = household_id.

-- Members can view their household's receipt images
CREATE POLICY "Household members can view receipt images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'receipts' AND
  is_household_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Members can upload to their own household folder
CREATE POLICY "Household members can upload receipt images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  is_household_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Members can delete their own household's receipt images
CREATE POLICY "Household members can delete receipt images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'receipts' AND
  is_household_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- 3. Tighten public_price_data INSERT.
--    The previous policy allowed any authenticated user to insert directly,
--    bypassing the consent check. Now only the service role (Edge Function) can insert.
DROP POLICY IF EXISTS "Authenticated users can submit price data" ON public_price_data;

-- Service role bypasses RLS by default, so no explicit policy needed for it.
-- SELECT remains open to authenticated users (data is anonymous).
