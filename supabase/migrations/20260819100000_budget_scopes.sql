-- Phase 1 of docs/product-plan.md — budgets gain a scope.
--
-- A budget row becomes one of three things, decided by which scope column is
-- set:
--
--   user_id set, settlement_id null  → personal   ("what did this month cost me")
--   settlement_id set, user_id null  → settlement ("what has Huta spent")
--   both null                        → legacy household budget
--
-- category_budgets hangs off budget_id and needs no change, so category targets
-- work at every scope for free.

-- ---------------------------------------------------------------------------
-- 1. Drop the global UNIQUE(month, year)
-- ---------------------------------------------------------------------------
-- This came from the original CREATE TABLE, before households existed, and was
-- never dropped when household_id was added in 20260202074513. It is already a
-- latent multi-tenancy bug: it permits exactly ONE budget row per month/year
-- across the entire database, so the second household to set a budget for a
-- given month gets a constraint violation. Invisible so far only because there
-- is one household.
--
-- It is also a hard blocker here, since scoped budgets mean several rows per
-- (month, year) by design.
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_month_year_key;

-- ---------------------------------------------------------------------------
-- 2. The scope columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES public.settlements(id) ON DELETE CASCADE;

-- A row is personal or settlement-scoped, never both.
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_single_scope;
ALTER TABLE public.budgets
  ADD CONSTRAINT budgets_single_scope
  CHECK (user_id IS NULL OR settlement_id IS NULL);

-- ---------------------------------------------------------------------------
-- 3. Uniqueness, per scope
-- ---------------------------------------------------------------------------
-- The old constraint allowed one budget per household per month, which is
-- exactly what has to stop being true.
--
-- NULLS NOT DISTINCT (Postgres 15+) is what makes this work as a single
-- constraint: the two legacy-budget NULLs must collide with each other, while
-- distinct user_ids stay distinct. Partial unique indexes would express the
-- same rule, but PostgREST cannot target a partial index from `on_conflict`,
-- which would break the upsert in useSaveBudget.
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_month_year_household_unique;
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_scope_unique;
ALTER TABLE public.budgets
  ADD CONSTRAINT budgets_scope_unique
  UNIQUE NULLS NOT DISTINCT (household_id, month, year, user_id, settlement_id);

-- Lookups are always "this household, this month, this scope".
CREATE INDEX IF NOT EXISTS budgets_household_month_year_idx
  ON public.budgets (household_id, year, month);

-- ---------------------------------------------------------------------------
-- 4. RLS — a personal budget is only writable by its owner
-- ---------------------------------------------------------------------------
-- SELECT stays household-wide: settlement views and the members list already
-- read across the household, and a hidden target would make balances harder to
-- explain rather than more private.
--
-- Writes are different. Without the user_id predicate below, any member could
-- overwrite another member's personal target through the same endpoint, which
-- the household-only policy would happily allow.
DROP POLICY IF EXISTS "Household members can insert budgets" ON public.budgets;
CREATE POLICY "Household members can insert budgets"
ON public.budgets FOR INSERT
WITH CHECK (
  household_id IN (SELECT public.get_user_household_ids(auth.uid()))
  AND (user_id IS NULL OR user_id = auth.uid())
);

DROP POLICY IF EXISTS "Household members can update budgets" ON public.budgets;
CREATE POLICY "Household members can update budgets"
ON public.budgets FOR UPDATE
USING (
  household_id IN (SELECT public.get_user_household_ids(auth.uid()))
  AND (user_id IS NULL OR user_id = auth.uid())
)
WITH CHECK (
  household_id IN (SELECT public.get_user_household_ids(auth.uid()))
  AND (user_id IS NULL OR user_id = auth.uid())
);
