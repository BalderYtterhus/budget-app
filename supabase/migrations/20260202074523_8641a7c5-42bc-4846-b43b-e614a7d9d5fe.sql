-- Fix the overly permissive INSERT policy on households
-- The trigger handles household creation, so we should restrict direct inserts to authenticated users
DROP POLICY IF EXISTS "Users can create households" ON public.households;

-- New policy: authenticated users can create households (they'll be added as owner after)
CREATE POLICY "Authenticated users can create households"
ON public.households FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);