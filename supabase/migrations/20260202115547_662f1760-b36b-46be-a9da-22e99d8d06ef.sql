-- Create shopping list items table
CREATE TABLE public.shopping_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  added_by_user UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for shopping list
CREATE POLICY "Household members can view shopping list items"
ON public.shopping_list_items
FOR SELECT
USING (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "Household members can insert shopping list items"
ON public.shopping_list_items
FOR INSERT
WITH CHECK (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "Household members can update shopping list items"
ON public.shopping_list_items
FOR UPDATE
USING (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "Household members can delete shopping list items"
ON public.shopping_list_items
FOR DELETE
USING (household_id IN (SELECT get_user_household_ids(auth.uid())));

-- Add index for faster lookups
CREATE INDEX idx_shopping_list_items_household ON public.shopping_list_items(household_id);

-- Add trigger for updated_at
CREATE TRIGGER update_shopping_list_items_updated_at
BEFORE UPDATE ON public.shopping_list_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();