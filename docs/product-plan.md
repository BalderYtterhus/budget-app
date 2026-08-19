# BudgetBandz — product plan

Written 2026-08-06. **Not started.** Agreed with Balder after a product review;
build begins next session.

This covers two things that have to move together: what the app *is*, and what
the code has to change to match. Read §1–3 for the idea, §4 for the work.

---

## 1. The idea, in one line

**Item-level grocery spend for a household that splits the bill.**

Your bank already knows you spent 812 kr at Rema. It does not know that 40% of
it was snacks. That item-level truth is the entire moat, and it is the only
thing here that justifies the friction of photographing a receipt.

Everything in this plan either sharpens that or gets out of its way.

---

## 2. The three concepts

The app has three, and the UI has been blurring two of them. Naming them apart
is most of the fix.

| Concept | Question it answers | Where it lives |
|---|---|---|
| **Kvitteringer** | What was bought? | `/kvitteringer` — raw facts, always visible |
| **Oppgjør** | Who owes whom? | `/oppgjor`, `/oppgjor/:id` — one page per settlement |
| **Budsjett** | What did this month cost **me**? | `/` — the main page |

The critical change is the third. **A budget measures your share, not the
household's turnover.**

---

## 3. The model change

### What is wrong today

`budgets` is keyed `household_id + month + year` — one budget for the whole
household, no per-person concept. `useSpendingSummary` sums the **full amount**
of every household receipt that month, unweighted.

So if Balder pays 3 000 kr for the Huta trip and his real share is 1 500 kr, his
dashboard says 3 000 kr. Alani opens the app and sees the same 3 000 kr. Neither
number is "what I spent", and the cabin trip inflates the grocery budget.

This is the confusion that triggered the review. It is a modelling problem, not
a layout problem — **a frontend rewrite would reproduce it in nicer CSS.**

### What replaces it

The main page shows **your share**:

| Receipt | Today | After |
|---|---|---|
| Huta trip, you paid 3 000, your ratio 50% | 3 000 kr | **1 500 kr** |
| Household shop, Alani paid 800, your ratio 50% | 800 kr | **400 kr** |
| In a settlement you are not a member of | full amount | **0 kr** |
| In no settlement, you paid | full amount | **full amount** |
| In no settlement, someone else paid | full amount | **0 kr** |

**Assumed rule, flag if wrong:** a receipt in no settlement is 100% the payer's.
It is not shared with anyone, so it is entirely theirs. Everything else falls
out of `settlement_members.ratio`.

Settlement pages show that settlement's **gross** spend plus balances. Same
receipts, two views, no double counting — they answer different questions.

### Budgets are optional

Setting a target is optional at both levels. With no target you still see spend
and balances; you just don't get a progress bar. A settlement page is useful
with zero budget configured — *"Huta har brukt 4 200 kr, du får 900 kr tilbake"*
is the whole point of it.

---

## 4. The work, in order

Each phase is a commit or small PR, so the numbers can be watched changing one
step at a time.

### Phase 0 — clear the decks first ✅ **DONE 2026-08-19**
Two things blocked or muddied everything after them. Both are cleared.

- ~~**`npm run build` is red, on every branch.**~~ Fixed by dropping `baseUrl`
  from `tsconfig.app.json` rather than silencing it with `ignoreDeprecations` —
  TypeScript is on 6.0.3 and `baseUrl` stops functioning entirely in 7.0, so the
  silencing option only buys time. `paths` resolves relative to the tsconfig's
  own directory without it, and Vite carries its own `@` alias.
  Removing `TS5101` exposed the 16 shadcn errors it had been hiding, so those
  were resolved in the same pass — the 8 unused `ui/` files are deleted. See §6.1.
  **`npm run build` now exits 0.**
- ~~**`overnight-fixes` has 12 unpushed commits and no PR.**~~ Landed as PR #16,
  `main` @ `2dfd776`. It was 13 commits, not 12. Content diff against `main`
  verified empty after the squash — nothing dropped.

### Phase 1 — schema
- Migration: `budgets` gets nullable `user_id` and `settlement_id`. Exactly one
  set — `user_id` → personal, `settlement_id` → settlement, neither → legacy
  household budget.
- `category_budgets` hangs off `budget_id` and needs no change, so category
  targets work at both levels for free.
- **Then** `supabase gen types typescript --linked > src/integrations/supabase/types.ts`.
  A missing column types as `never` and fails confusingly at the insert site.

### Phase 2 — one share function
Extract the share maths that already exists inside `useSettlementBalances` so
the personal page and the settlement pages share one definition. This is an
extraction, not new logic.

Rule set is the table in §3. Must handle: settlements you are not a member of,
closed settlements, and receipts with `settlement_id = null`.

### Phase 3 — personal dashboard (`/`)
- `useSpendingSummary` weights each receipt by the caller's share.
- Budget target read from the personal `budgets` row; absent → show spend only.
- Under the total, a per-settlement breakdown line — *"hvorav 1 500 kr Huta"* —
  which is what gives Balder the separation he asked for without a second page.
- The household-gross total disappears. This supersedes the 2026-08-05 decision
  that custom settlements count fully toward the month.

### Phase 4 — settlement pages
- `/oppgjor` becomes a list of settlements.
- `/oppgjor/:id` is one settlement: gross spend, member balances, settle-up
  transactions, optional budget.
- **`Settlement.tsx` finally gets a home.** It is 267 lines, mounted nowhere,
  and holds the only split-ratio editor in the app. Before mounting, fix the bug
  already flagged in-file: it reads balances from `useSettlementBalances` but
  *writes* household-level `split_ratios`, which are only the fallback once a
  settlement has `settlement_members` rows. It must write
  `settlement_members.ratio`. This closes open decision 🔴 #2.

### Phase 5 — cut the third product
From the product review: the price-data subsystem is a separate business wearing
this app as a coat. It needs thousands of households before it is worth anything
to anyone, and it currently costs a public table, an Edge Function, a consent
modal, a consent setting, two routes and a privacy surface.

Cut, in one PR: `/prisdatabase`, `/store-comparison`, `useStorePrices`,
`submit-price-data`, `public_price_data`, `ConsentModal` and the consent toggle.
Roughly 750 lines of app code plus the backend surface.

**Decide Phase 5 before Phase 6 — see below, they are linked.**

Also here: shrink `/install` (308 lines, longer than the dashboard, receipts,
settlement, categories and reports pages combined) down to the existing
`InstallPrompt`.

### Phase 6 — cheap product matching, when there is data
`pg_trgm` trigram similarity for `normalized_name`. Built into Postgres, no API
key, no new dependency, no re-embedding pipeline. Handles most of the
`TINE LETTMELK 1,5% 1L` vs `Lettmelk Tine 1L` variance on its own.

**Trigger:** enough receipts that exact matching demonstrably collides. Today
the database holds **4 receipts across 3 chains** — roughly one per chain — so
there is nothing to match yet and no way to measure whether matching is failing.

---

## 5. Deferred, explicitly kept — embeddings

**Not cancelled. Moved later in the queue.** Balder asked specifically that this
stay in the plan, and the reasoning below is why it sits after Phase 6 rather
than being dropped.

The design decision is already made and still stands:

> **voyage-4-lite at 256 dimensions**, keyed by distinct `normalized_name` (not
> per `receipt_items` row). Free tier covers this scale permanently. Needs a
> Voyage API key.

Embeddings are the correct tool for product identity — clustering the same
product written differently by different chains. String matching genuinely fails
at that, and vectors genuinely fix it. Nothing about that judgement has changed.

**Why later, not now:**

1. **No corpus.** 4 receipts, ~50 items, ~1 receipt per chain. Cross-store price
   comparison needs the same product seen in ≥2 chains repeatedly before any
   matching algorithm has work to do. The algorithm is irrelevant when there is
   nothing to match.
2. **No measurement.** The honest trigger is *"exact/trigram matching misses X%
   of real cross-store pairs."* That number does not exist yet. Adding vectors
   now optimises a join nobody has watched fail.
3. **Cheaper rung first.** `pg_trgm` (Phase 6) costs nothing and may carry a long
   way on Norwegian grocery names, which are short and share strong tokens
   (brand + product + size). If it proves insufficient — measured — embed then,
   with eval data available to prove the upgrade paid for itself.

**Dependency to resolve first:** embeddings mainly serve price comparison and the
cross-household price database. They do little for categorisation, which already
has the model's own call plus `item_category_mappings` frequency plus a fuzzy
fallback. **So if Phase 5 cuts price comparison, this phase loses its consumer.**

Balder should decide Phase 5 knowingly: keeping price comparison keeps
embeddings meaningful; cutting it means embeddings would need a new
justification. That is a product call, not a technical one.

Also still parked, and fine there: **Phase 6 of the old AI roadmap** (model
benchmarking). Phase 3 instrumentation stays — it is already in the schema, it
is cheap, and it is what would make any future embedding upgrade measurable.

---

## 6. Still needs a decision

Carried from `OVERNIGHT_LOG.md`, unchanged:

1. ~~**shadcn peer deps**~~ **DECIDED 2026-08-19: deleted.** Balder chose delete.
   Note the original framing here was wrong in two ways: it was 8 files, not 16
   (16 was the *error* count), and installing the 7 packages would not have given
   a green build — `chart.tsx` accounted for 8 of the 16 errors and was recharts
   type drift, not a missing peer dep. Re-add any component with
   `npx shadcn@latest add <name>`.
2. **`household_memberships` has no DELETE policy.** RLS is on with only SELECT
   and INSERT, so `useLeaveHousehold` and `useRemoveMember` delete zero rows,
   return no error, and toast success. `useLeaveHousehold` also filters on
   `household_id` alone with no `user_id` predicate — adding a DELETE policy
   without a narrow `USING` clause would let it remove *every* member. Needs a
   permissions rule from Balder, then a migration plus the missing `.eq()`.
3. **`ReceiptUpload.tsx:95`** — should *Avbryt* return to the idle screen, or is
   fire-once-on-prop-flip intended?
4. **`ReceiptItemEditor.tsx:31` / `ShoppingList.tsx:109`** — two unused locals
   that look like half-removed render branches. What were they meant to gate?
   A memory question, not a code one.

---

## 7. Where the code stands today

So this can be picked up cold.

- `main` @ `2dfd776` — PRs #12–#16 merged.
- ~~**`overnight-fixes` is 12 commits ahead and unpushed**~~ Landed as PR #16.
  The 2026-08-06 dead-ends session (issues #1–#13 from `docs/user-flows.md`) is
  on `main`.
- **`npm run build` exits 0.** Fixed 2026-08-19 — see Phase 0.
- **Assign-to-settlement exists** — `useUpdateReceiptSettlement` plus a picker in
  the receipt detail dialog. A receipt can move in or out of a settlement.
  (Now on `main`.)
- **`SettlementSwitcher` is mounted** in the sidebar; switch, create, close and
  reopen all work, with a confirmation on close.
- **`Settlement.tsx` is still mounted nowhere** — Phase 4 is its home.
- The month view is **household-scoped, not settlement-scoped** — every receipt
  is visible and counted regardless of settlement. Phase 3 changes what that
  total *means*, not which receipts are visible.
- ~~**The 16 shadcn peer-dep errors**~~ Gone — the 8 files are deleted. Once
  `TS5101` stopped masking them they *were* a red build, not just tidiness, so
  they had to be resolved in the same pass rather than deferred.
- **`QueryErrorState` is still unverified at runtime.** An attempt on 2026-08-06
  was inconclusive: with a real injected fault the query never reached
  `status: "error"` — it sat at `fetchStatus: "paused"` and then
  `pending/idle`, so the lists rendered their *empty* state. Could not be cleanly
  separated from the browser pane's own networking (the app's Supabase calls
  failed with `TypeError: Failed to fetch` while a manual fetch to the same host
  from the same page succeeded). Needs a dev server on a free port to retry.
  One hypothesis was killed: `PostgrestError extends Error`, so
  `QueryErrorState`'s `instanceof Error` detail line is fine.

---

## 8. Two honest risks

**The month total will have changed meaning three times in a week** —
settlement-scoped → household-gross → personal share. This one is right, because
it is the first that answers a question a person actually asks. But expect
"the numbers moved" again, and expect past months to look different.

**This is a couple of days, not an afternoon** — migration, type regen, share
function, three page rebuilds, re-verification. Still far cheaper than the
frontend rewrite that was considered and rejected: the pages and nav barely
change. The numbers just start meaning something.
