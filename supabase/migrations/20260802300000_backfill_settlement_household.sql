-- Recover settlements orphaned by the settlement-scoping migration.
--
-- 20260513000000 added settlements.household_id and rewrote the RLS policy to
-- `household_id IN (SELECT get_user_household_ids(auth.uid()))`, but never
-- backfilled the column for rows that already existed. Every pre-existing
-- settlement therefore has household_id = NULL, fails the policy, and is
-- invisible to every user — including its own members.
--
-- The visible symptom is worse than a missing settlement list: useMonthlyReceipts
-- returns [] whenever no settlement is active, so the receipt list, budget
-- totals, and spending summary all silently render as empty. The data was
-- always there; nothing could read it.
--
-- Runs as the migration role, so RLS does not hide the broken rows from these
-- statements the way it hides them from the app.

-- 1. Primary recovery: infer the household from receipts already attached to
--    the settlement. This is the most reliable link — receipts carry
--    household_id directly and were written under the old, working policy.
UPDATE public.settlements s
SET household_id = src.household_id
FROM (
  SELECT
    r.settlement_id,
    MODE() WITHIN GROUP (ORDER BY r.household_id) AS household_id
  FROM public.receipts r
  WHERE r.settlement_id IS NOT NULL
    AND r.household_id IS NOT NULL
  GROUP BY r.settlement_id
) src
WHERE s.id = src.settlement_id
  AND s.household_id IS NULL;

-- 2. Fallback for settlements that never had a receipt: infer from the
--    households its members belong to. MODE() picks the most common, which
--    matters only in the unusual case of members spanning households.
UPDATE public.settlements s
SET household_id = src.household_id
FROM (
  SELECT
    sm.settlement_id,
    MODE() WITHIN GROUP (ORDER BY hm.household_id) AS household_id
  FROM public.settlement_members sm
  JOIN public.household_memberships hm ON hm.user_id = sm.user_id
  GROUP BY sm.settlement_id
) src
WHERE s.id = src.settlement_id
  AND s.household_id IS NULL;

-- Anything still NULL has no receipts and no resolvable members, so there is
-- no evidence of which household it belonged to. Left in place rather than
-- deleted: it stays invisible either way, and guessing would be worse than
-- leaving a recoverable row alone.

-- 3. Re-attach receipts that were saved while no settlement was active.
--    useSaveReceipt writes `settlement_id: activeSettlement?.id || null`, and
--    useMonthlyReceipts filters on an exact settlement match — so a receipt
--    saved with NULL can never appear in the UI. Only assigned where the
--    household has exactly one active settlement, so this never has to guess
--    between candidates.
UPDATE public.receipts r
SET settlement_id = src.settlement_id
FROM (
  SELECT
    s.household_id,
    MIN(s.id::text)::uuid AS settlement_id
  FROM public.settlements s
  WHERE s.status = 'active'
    AND s.household_id IS NOT NULL
  GROUP BY s.household_id
  HAVING COUNT(*) = 1
) src
WHERE r.household_id = src.household_id
  AND r.settlement_id IS NULL;
