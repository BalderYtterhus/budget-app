-- household_memberships has had RLS enabled with only SELECT and INSERT
-- policies since the initial schema (20260202074513). Postgres denies anything
-- not explicitly permitted, so every DELETE silently matched zero rows:
-- useLeaveHousehold and useRemoveMember returned no error and toasted success
-- while the membership stayed exactly where it was.
--
-- Permission rule (Balder, 2026-08-19):
--   * an owner may remove other members of their household
--   * anyone may remove themselves
--
-- This is what the UI already assumed. UserMenu gates the remove button on
-- `isOwner && member.user_id !== user.id` and the leave button on `!isOwner`.
-- Only the database was missing.

-- The owner check has to be SECURITY DEFINER. A policy ON household_memberships
-- that subqueries household_memberships re-enters that same policy and recurses
-- until Postgres aborts. This is the identical reason is_household_member()
-- exists rather than being inlined.
CREATE OR REPLACE FUNCTION public.is_household_owner(_user_id UUID, _household_id UUID)
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
      AND role = 'owner'
  )
$$;

DROP POLICY IF EXISTS "Owners remove members, anyone removes themselves"
  ON public.household_memberships;

CREATE POLICY "Owners remove members, anyone removes themselves"
ON public.household_memberships
FOR DELETE
USING (
  -- leave: your own row, always
  auth.uid() = user_id
  -- remove: any row in a household you own
  OR public.is_household_owner(auth.uid(), household_id)
);
