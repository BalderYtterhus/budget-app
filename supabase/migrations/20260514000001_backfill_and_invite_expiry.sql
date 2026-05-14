-- 1. Backfill store_chain on old receipts using the same chain-list logic as the Edge Function
--    Ordered longest-first so "coop extra" matches before "coop"
UPDATE receipts
SET store_chain = CASE
  WHEN lower(store_name) = 'rema 1000' OR lower(store_name) LIKE 'rema 1000 %' THEN 'rema 1000'
  WHEN lower(store_name) = 'coop extra' OR lower(store_name) LIKE 'coop extra %' THEN 'coop extra'
  WHEN lower(store_name) = 'coop prix'  OR lower(store_name) LIKE 'coop prix %'  THEN 'coop prix'
  WHEN lower(store_name) = 'coop mega'  OR lower(store_name) LIKE 'coop mega %'  THEN 'coop mega'
  WHEN lower(store_name) = 'coop marked' OR lower(store_name) LIKE 'coop marked %' THEN 'coop marked'
  WHEN lower(store_name) = 'obs bygg'   OR lower(store_name) LIKE 'obs bygg %'   THEN 'obs bygg'
  WHEN lower(store_name) = 'eurospar'   OR lower(store_name) LIKE 'eurospar %'   THEN 'eurospar'
  WHEN lower(store_name) = 'bunnpris'   OR lower(store_name) LIKE 'bunnpris %'   THEN 'bunnpris'
  WHEN lower(store_name) = 'nærbutikken' OR lower(store_name) LIKE 'nærbutikken %' THEN 'nærbutikken'
  WHEN lower(store_name) = 'mathallen'  OR lower(store_name) LIKE 'mathallen %'  THEN 'mathallen'
  WHEN lower(store_name) = 'kiwi'       OR lower(store_name) LIKE 'kiwi %'       THEN 'kiwi'
  WHEN lower(store_name) = 'meny'       OR lower(store_name) LIKE 'meny %'       THEN 'meny'
  WHEN lower(store_name) = 'spar'       OR lower(store_name) LIKE 'spar %'       THEN 'spar'
  WHEN lower(store_name) = 'joker'      OR lower(store_name) LIKE 'joker %'      THEN 'joker'
  WHEN lower(store_name) = 'extra'      OR lower(store_name) LIKE 'extra %'      THEN 'extra'
  WHEN lower(store_name) = 'obs'        OR lower(store_name) LIKE 'obs %'        THEN 'obs'
  WHEN lower(store_name) = 'oda'        OR lower(store_name) LIKE 'oda %'        THEN 'oda'
  WHEN lower(store_name) = 'prix'       OR lower(store_name) LIKE 'prix %'       THEN 'prix'
  WHEN store_name IS NOT NULL AND trim(store_name) <> ''
    THEN lower(split_part(trim(store_name), ' ', 1))
  ELSE NULL
END
WHERE store_chain IS NULL
  AND store_name IS NOT NULL
  AND trim(store_name) <> '';

-- 2. Add invite_expires_at to households (null = no expiry, backwards compatible)
ALTER TABLE public.households
  ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ;

-- 3. Replace join_household_via_invite to check expiry
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

  INSERT INTO public.split_ratios (user_id, household_id, ratio)
  VALUES (auth.uid(), target_household_id, 50)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true, 'already_member', false,
                            'household_id', target_household_id,
                            'household_name', target_household_name);
END;
$$;

-- 4. Helper: set invite expiry (owner only, 30 days from now by default)
CREATE OR REPLACE FUNCTION public.set_invite_expiry(_household_id uuid, _days int DEFAULT 30)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expires timestamptz;
BEGIN
  IF NOT is_household_member(auth.uid(), _household_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  expires := now() + (_days || ' days')::interval;

  UPDATE public.households
     SET invite_expires_at = expires
   WHERE id = _household_id;

  RETURN expires;
END;
$$;

-- 5. Helper: clear invite expiry (owner only, makes link permanent)
CREATE OR REPLACE FUNCTION public.clear_invite_expiry(_household_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_household_member(auth.uid(), _household_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.households
     SET invite_expires_at = NULL
   WHERE id = _household_id;
END;
$$;
