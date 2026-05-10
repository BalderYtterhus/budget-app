-- Create households table
CREATE TABLE public.households (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'My Household',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create household memberships table
CREATE TABLE public.household_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, household_id)
);

-- Add household_id to receipts
ALTER TABLE public.receipts 
ADD COLUMN household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;

-- Add household_id to budgets
ALTER TABLE public.budgets 
ADD COLUMN household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;

-- Add household_id to item_category_mappings
ALTER TABLE public.item_category_mappings 
ADD COLUMN household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_memberships ENABLE ROW LEVEL SECURITY;

-- Security definer function to check household membership
CREATE OR REPLACE FUNCTION public.is_household_member(_user_id UUID, _household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_memberships
    WHERE user_id = _user_id
      AND household_id = _household_id
  )
$$;

-- Function to get user's household IDs
CREATE OR REPLACE FUNCTION public.get_user_household_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id
  FROM public.household_memberships
  WHERE user_id = _user_id
$$;

-- RLS Policies for households
CREATE POLICY "Users can view households they belong to"
ON public.households FOR SELECT
USING (id IN (SELECT public.get_user_household_ids(auth.uid())));

CREATE POLICY "Users can create households"
ON public.households FOR INSERT
WITH CHECK (true);

CREATE POLICY "Members can update their households"
ON public.households FOR UPDATE
USING (id IN (SELECT public.get_user_household_ids(auth.uid())));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for household_memberships
CREATE POLICY "Users can view memberships of their households"
ON public.household_memberships FOR SELECT
USING (household_id IN (SELECT public.get_user_household_ids(auth.uid())));

CREATE POLICY "Users can insert their own memberships"
ON public.household_memberships FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Drop old policies on receipts
DROP POLICY IF EXISTS "Receipts are viewable by everyone" ON public.receipts;
DROP POLICY IF EXISTS "Anyone can insert receipts" ON public.receipts;
DROP POLICY IF EXISTS "Anyone can update receipts" ON public.receipts;
DROP POLICY IF EXISTS "Anyone can delete receipts" ON public.receipts;

-- New RLS Policies for receipts (household-based)
CREATE POLICY "Household members can view receipts"
ON public.receipts FOR SELECT
USING (household_id IN (SELECT public.get_user_household_ids(auth.uid())));

CREATE POLICY "Household members can insert receipts"
ON public.receipts FOR INSERT
WITH CHECK (household_id IN (SELECT public.get_user_household_ids(auth.uid())));

CREATE POLICY "Household members can update receipts"
ON public.receipts FOR UPDATE
USING (household_id IN (SELECT public.get_user_household_ids(auth.uid())));

CREATE POLICY "Household members can delete receipts"
ON public.receipts FOR DELETE
USING (household_id IN (SELECT public.get_user_household_ids(auth.uid())));

-- Drop old policies on receipt_items
DROP POLICY IF EXISTS "Receipt items are viewable by everyone" ON public.receipt_items;
DROP POLICY IF EXISTS "Anyone can insert receipt items" ON public.receipt_items;
DROP POLICY IF EXISTS "Anyone can update receipt items" ON public.receipt_items;
DROP POLICY IF EXISTS "Anyone can delete receipt items" ON public.receipt_items;

-- New RLS Policies for receipt_items (via receipts)
CREATE POLICY "Household members can view receipt items"
ON public.receipt_items FOR SELECT
USING (receipt_id IN (
  SELECT id FROM public.receipts 
  WHERE household_id IN (SELECT public.get_user_household_ids(auth.uid()))
));

CREATE POLICY "Household members can insert receipt items"
ON public.receipt_items FOR INSERT
WITH CHECK (receipt_id IN (
  SELECT id FROM public.receipts 
  WHERE household_id IN (SELECT public.get_user_household_ids(auth.uid()))
));

CREATE POLICY "Household members can update receipt items"
ON public.receipt_items FOR UPDATE
USING (receipt_id IN (
  SELECT id FROM public.receipts 
  WHERE household_id IN (SELECT public.get_user_household_ids(auth.uid()))
));

CREATE POLICY "Household members can delete receipt items"
ON public.receipt_items FOR DELETE
USING (receipt_id IN (
  SELECT id FROM public.receipts 
  WHERE household_id IN (SELECT public.get_user_household_ids(auth.uid()))
));

-- Drop old policies on budgets
DROP POLICY IF EXISTS "Budgets are viewable by everyone" ON public.budgets;
DROP POLICY IF EXISTS "Anyone can insert budgets" ON public.budgets;
DROP POLICY IF EXISTS "Anyone can update budgets" ON public.budgets;

-- New RLS Policies for budgets (household-based)
CREATE POLICY "Household members can view budgets"
ON public.budgets FOR SELECT
USING (household_id IN (SELECT public.get_user_household_ids(auth.uid())));

CREATE POLICY "Household members can insert budgets"
ON public.budgets FOR INSERT
WITH CHECK (household_id IN (SELECT public.get_user_household_ids(auth.uid())));

CREATE POLICY "Household members can update budgets"
ON public.budgets FOR UPDATE
USING (household_id IN (SELECT public.get_user_household_ids(auth.uid())));

-- Drop old policies on category_budgets
DROP POLICY IF EXISTS "Category budgets are viewable by everyone" ON public.category_budgets;
DROP POLICY IF EXISTS "Anyone can insert category budgets" ON public.category_budgets;
DROP POLICY IF EXISTS "Anyone can update category budgets" ON public.category_budgets;

-- New RLS Policies for category_budgets (via budgets)
CREATE POLICY "Household members can view category budgets"
ON public.category_budgets FOR SELECT
USING (budget_id IN (
  SELECT id FROM public.budgets 
  WHERE household_id IN (SELECT public.get_user_household_ids(auth.uid()))
));

CREATE POLICY "Household members can insert category budgets"
ON public.category_budgets FOR INSERT
WITH CHECK (budget_id IN (
  SELECT id FROM public.budgets 
  WHERE household_id IN (SELECT public.get_user_household_ids(auth.uid()))
));

CREATE POLICY "Household members can update category budgets"
ON public.category_budgets FOR UPDATE
USING (budget_id IN (
  SELECT id FROM public.budgets 
  WHERE household_id IN (SELECT public.get_user_household_ids(auth.uid()))
));

-- Drop old policies on item_category_mappings
DROP POLICY IF EXISTS "Item mappings are viewable by everyone" ON public.item_category_mappings;
DROP POLICY IF EXISTS "Anyone can insert item mappings" ON public.item_category_mappings;
DROP POLICY IF EXISTS "Anyone can update item mappings" ON public.item_category_mappings;

-- New RLS Policies for item_category_mappings (household-based)
CREATE POLICY "Household members can view item mappings"
ON public.item_category_mappings FOR SELECT
USING (household_id IN (SELECT public.get_user_household_ids(auth.uid())));

CREATE POLICY "Household members can insert item mappings"
ON public.item_category_mappings FOR INSERT
WITH CHECK (household_id IN (SELECT public.get_user_household_ids(auth.uid())));

CREATE POLICY "Household members can update item mappings"
ON public.item_category_mappings FOR UPDATE
USING (household_id IN (SELECT public.get_user_household_ids(auth.uid())));

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  -- Create a default household for the user
  INSERT INTO public.households (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)) || '''s Household')
  RETURNING id INTO new_household_id;
  
  -- Add user to the household
  INSERT INTO public.household_memberships (user_id, household_id, role)
  VALUES (NEW.id, new_household_id, 'owner');
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add updated_at triggers
CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();