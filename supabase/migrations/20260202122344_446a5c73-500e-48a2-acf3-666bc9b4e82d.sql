-- Create a table to track which default categories are hidden per household
CREATE TABLE public.hidden_default_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(household_id, category_id)
);

-- Enable RLS
ALTER TABLE public.hidden_default_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Household members can view hidden categories"
ON public.hidden_default_categories
FOR SELECT
USING (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "Household members can hide categories"
ON public.hidden_default_categories
FOR INSERT
WITH CHECK (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "Household members can unhide categories"
ON public.hidden_default_categories
FOR DELETE
USING (household_id IN (SELECT get_user_household_ids(auth.uid())));