-- Add invite_token to households table
ALTER TABLE public.households 
ADD COLUMN IF NOT EXISTS invite_token uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS invite_enabled boolean DEFAULT true;

-- Create index on invite_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_households_invite_token ON public.households(invite_token);

-- Create function to regenerate invite token
CREATE OR REPLACE FUNCTION public.regenerate_invite_token(_household_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token uuid;
BEGIN
  -- Verify user is a member of this household
  IF NOT is_household_member(auth.uid(), _household_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  new_token := gen_random_uuid();
  
  UPDATE public.households 
  SET invite_token = new_token, updated_at = now()
  WHERE id = _household_id;
  
  RETURN new_token;
END;
$$;

-- Create function to join household via invite token
CREATE OR REPLACE FUNCTION public.join_household_via_invite(_invite_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_household_id uuid;
  target_household_name text;
  existing_membership_id uuid;
BEGIN
  -- Find the household with this invite token
  SELECT id, name INTO target_household_id, target_household_name
  FROM public.households
  WHERE invite_token = _invite_token AND invite_enabled = true;
  
  IF target_household_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or disabled invite link');
  END IF;
  
  -- Check if user is already a member
  SELECT id INTO existing_membership_id
  FROM public.household_memberships
  WHERE user_id = auth.uid() AND household_id = target_household_id;
  
  IF existing_membership_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'already_member', true, 'household_id', target_household_id, 'household_name', target_household_name);
  END IF;
  
  -- Remove user from their current household(s) and add to new one
  DELETE FROM public.household_memberships WHERE user_id = auth.uid();
  
  INSERT INTO public.household_memberships (user_id, household_id, role)
  VALUES (auth.uid(), target_household_id, 'member');
  
  -- Initialize split ratio for the new member (default 50%)
  INSERT INTO public.split_ratios (user_id, household_id, ratio)
  VALUES (auth.uid(), target_household_id, 50)
  ON CONFLICT DO NOTHING;
  
  RETURN jsonb_build_object('success', true, 'already_member', false, 'household_id', target_household_id, 'household_name', target_household_name);
END;
$$;