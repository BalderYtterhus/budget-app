-- Add household_id to categories to support custom categories per household
-- Keep is_default for starter categories (shared across all households)

ALTER TABLE public.categories
ADD COLUMN household_id uuid REFERENCES public.households(id) ON DELETE CASCADE;

-- Create index for efficient queries
CREATE INDEX idx_categories_household_id ON public.categories(household_id);

-- Update RLS policies to allow viewing both default and household-specific categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;

CREATE POLICY "Users can view default and their household categories"
ON public.categories
FOR SELECT
USING (
  is_default = true 
  OR household_id IN (SELECT get_user_household_ids(auth.uid()))
);

-- Allow household members to create custom categories
CREATE POLICY "Household members can create custom categories"
ON public.categories
FOR INSERT
WITH CHECK (
  household_id IN (SELECT get_user_household_ids(auth.uid()))
  AND is_default = false
);

-- Allow household members to update their custom categories
CREATE POLICY "Household members can update custom categories"
ON public.categories
FOR UPDATE
USING (
  household_id IN (SELECT get_user_household_ids(auth.uid()))
  AND is_default = false
);

-- Allow household members to delete their custom categories
CREATE POLICY "Household members can delete custom categories"
ON public.categories
FOR DELETE
USING (
  household_id IN (SELECT get_user_household_ids(auth.uid()))
  AND is_default = false
);