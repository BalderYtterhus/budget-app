-- Add created_by_user and paid_by_user columns to receipts
ALTER TABLE public.receipts 
ADD COLUMN created_by_user uuid REFERENCES public.profiles(user_id),
ADD COLUMN paid_by_user uuid REFERENCES public.profiles(user_id);

-- Create split_ratios table for household payment splits
CREATE TABLE public.split_ratios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  ratio numeric NOT NULL DEFAULT 50 CHECK (ratio >= 0 AND ratio <= 100),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(household_id, user_id)
);

-- Enable RLS on split_ratios
ALTER TABLE public.split_ratios ENABLE ROW LEVEL SECURITY;

-- RLS policies for split_ratios
CREATE POLICY "Household members can view split ratios"
  ON public.split_ratios FOR SELECT
  USING (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "Household members can insert split ratios"
  ON public.split_ratios FOR INSERT
  WITH CHECK (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "Household members can update split ratios"
  ON public.split_ratios FOR UPDATE
  USING (household_id IN (SELECT get_user_household_ids(auth.uid())));

CREATE POLICY "Household members can delete split ratios"
  ON public.split_ratios FOR DELETE
  USING (household_id IN (SELECT get_user_household_ids(auth.uid())));

-- Add trigger for updated_at on split_ratios
CREATE TRIGGER update_split_ratios_updated_at
  BEFORE UPDATE ON public.split_ratios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS policy for profiles to allow household members to see each other
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view household member profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = user_id 
    OR user_id IN (
      SELECT hm.user_id 
      FROM public.household_memberships hm 
      WHERE hm.household_id IN (SELECT get_user_household_ids(auth.uid()))
    )
  );