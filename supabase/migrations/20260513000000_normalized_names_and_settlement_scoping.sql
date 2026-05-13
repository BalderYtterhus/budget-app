-- Add normalized_name to receipt_items for reliable price comparison across stores
ALTER TABLE public.receipt_items
ADD COLUMN IF NOT EXISTS normalized_name TEXT;

-- Add household_id to settlements so they are properly scoped
ALTER TABLE public.settlements
ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;

-- Fix settlements RLS (was wide-open: everyone could see all settlements)
DROP POLICY IF EXISTS "Settlements are viewable by everyone" ON public.settlements;
DROP POLICY IF EXISTS "Anyone can insert settlements" ON public.settlements;
DROP POLICY IF EXISTS "Anyone can update settlements" ON public.settlements;
DROP POLICY IF EXISTS "Anyone can delete settlements" ON public.settlements;

CREATE POLICY "Household members can view settlements"
ON public.settlements FOR SELECT
USING (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "Household members can insert settlements"
ON public.settlements FOR INSERT
WITH CHECK (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "Household members can update settlements"
ON public.settlements FOR UPDATE
USING (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "Household members can delete settlements"
ON public.settlements FOR DELETE
USING (household_id IN (SELECT get_user_household_ids(auth.uid())));

-- Fix settlement_members RLS (was wide-open too)
DROP POLICY IF EXISTS "Settlement members are viewable by everyone" ON public.settlement_members;
DROP POLICY IF EXISTS "Anyone can insert settlement members" ON public.settlement_members;
DROP POLICY IF EXISTS "Anyone can update settlement members" ON public.settlement_members;
DROP POLICY IF EXISTS "Anyone can delete settlement members" ON public.settlement_members;

CREATE POLICY "Household members can view settlement members"
ON public.settlement_members FOR SELECT
USING (settlement_id IN (
  SELECT id FROM public.settlements
  WHERE household_id IN (SELECT get_user_household_ids(auth.uid()))
));

CREATE POLICY "Household members can insert settlement members"
ON public.settlement_members FOR INSERT
WITH CHECK (settlement_id IN (
  SELECT id FROM public.settlements
  WHERE household_id IN (SELECT get_user_household_ids(auth.uid()))
));

CREATE POLICY "Household members can update settlement members"
ON public.settlement_members FOR UPDATE
USING (settlement_id IN (
  SELECT id FROM public.settlements
  WHERE household_id IN (SELECT get_user_household_ids(auth.uid()))
));

CREATE POLICY "Household members can delete settlement members"
ON public.settlement_members FOR DELETE
USING (settlement_id IN (
  SELECT id FROM public.settlements
  WHERE household_id IN (SELECT get_user_household_ids(auth.uid()))
));
