-- Fix join_household_via_invite: rebalance all household members to equal ratios
-- Previous version hardcoded 50% for the new member, causing ratios to exceed 100%
CREATE OR REPLACE FUNCTION public.join_household_via_invite(_invite_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_household_id   uuid;
  target_household_name text;
  target_expires_at     timestamptz;
  existing_membership   uuid;
  new_member_count      int;
  equal_ratio           numeric;
BEGIN
  SELECT id, name, invite_expires_at
    INTO target_household_id, target_household_name, target_expires_at
    FROM public.households
   WHERE invite_token = _invite_token AND invite_enabled = true;

  IF target_household_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ugyldig eller deaktivert invitasjonslenke');
  END IF;

  IF target_expires_at IS NOT NULL AND target_expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitasjonslenken har utløpt');
  END IF;

  SELECT id INTO existing_membership
    FROM public.household_memberships
   WHERE user_id = auth.uid() AND household_id = target_household_id;

  IF existing_membership IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'already_member', true,
                              'household_id', target_household_id,
                              'household_name', target_household_name);
  END IF;

  DELETE FROM public.household_memberships WHERE user_id = auth.uid();

  INSERT INTO public.household_memberships (user_id, household_id, role)
  VALUES (auth.uid(), target_household_id, 'member');

  -- Count members now including the new one, then set equal ratio for all
  SELECT COUNT(*) INTO new_member_count
    FROM public.household_memberships
   WHERE household_id = target_household_id;

  equal_ratio := 100.0 / new_member_count;

  -- Upsert equal ratios for every member of this household
  INSERT INTO public.split_ratios (user_id, household_id, ratio)
  SELECT hm.user_id, target_household_id, equal_ratio
    FROM public.household_memberships hm
   WHERE hm.household_id = target_household_id
  ON CONFLICT (user_id, household_id) DO UPDATE SET ratio = EXCLUDED.ratio;

  RETURN jsonb_build_object('success', true, 'already_member', false,
                            'household_id', target_household_id,
                            'household_name', target_household_name);
END;
$$;
