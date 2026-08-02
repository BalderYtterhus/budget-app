# Overnight work log — 2026-08-02 → 08-03

Branch: `overnight-fixes` (off `main` @ `ea273ff`)

Working the ✅ items from the audit in P0 → P3 order. ⚠️ items are untouched,
with the blocking decision recorded at the bottom.

---

## Done

### P0 — Restore three commits dropped by the #11 squash merge · `984d702`

The squash for PR #11 kept only the branch's first commit and silently dropped
the two after it — the same failure that left the embed fix out of #9 and broke
`main` for a day.

| Restored | Why it mattered |
|---|---|
| `src/integrations/supabase/types.ts` | Had no `system_confidence` despite the column existing in the DB, leaving a live type error in the receipt-save path (`useBudgetData.ts:535`) |
| `supabase/migrations/20260802300000_backfill_settlement_household.sql` | Applied to the database but absent from the repo — a fresh clone would have diverged |
| `docs/frontend-plan.md` | — |

No new work; re-adds already-reviewed commits. Real (non-shadcn) TS errors 9 → 8.

### P0 — Duplicate join RPC overwriting invite success · `6ef6022`

**Corrected my own audit here.** I called this a TDZ crash; it isn't. Effects
run after render, so the binding is initialised by the time it's called.

The real defect it was masking: nothing guarded against the join running twice.
StrictMode double-invokes effects in dev, and the effect also re-fires whenever
the `user` object changes identity (a token refresh suffices). The second call
finds the membership already created, returns `already_member`, and overwrites
the success state — so a successful join reports *"du er allerede medlem"* and
never shows the confirmation toast.

`joinHousehold` wrapped in `useCallback`, effect moved below it, and a ref keyed
on the invite token so the RPC runs once per token. Lint on the file 3 → 1; the
remaining `set-state-in-effect` is intentional (status derives from an async RPC
result and can't be computed during render).

Files: `src/pages/JoinHousehold.tsx`

### P1 — Query failures no longer look like empty data · `f5f64f1`

Every list rendered its empty state on error. That's exactly why two real
outages went unnoticed for a day: a PostgREST embed returning HTTP 300, and an
RLS-hidden settlements table. A broken receipt list is pixel-identical to a
month with no receipts.

- New `QueryErrorState` — says plainly it's an error not absent data, shows the
  underlying message, offers retry.
- `ReceiptList`, `ShoppingList`, `CategoryBreakdown`, `SpendingTrend` branch on
  `isError` ahead of their empty checks.
- `QueryClient` gets a `QueryCache.onError` logging the failing query key.

**Verification gap, flagged honestly:** the branches are typecheck-clean and are
plain booleans ahead of each empty check, but I could not exercise them at
runtime. supabase-js binds `fetch` at client construction, so patching
`window.fetch` from the console never reaches it, and forcing a genuine failure
would have meant editing the client. Worth a manual look.

Confirmed incidentally: settlement recovery worked — two active settlements
visible, all four receipts attached, no orphans.

### P1 — Mobile navigation drawer · `b6cac65`

No navigation existed below `lg`. `AppSidebar` is `hidden lg:block` with nothing
replacing it, so on a phone only the dashboard was reachable.

Menu button in the mobile header opens `AppSidebar` in a left `Sheet`.
`AppSidebar` gains `variant` (drops sticky/h-screen/border inside a drawer) and
`onNavigate` (closes on link tap). Desktop unchanged — both props default.

**Deviated from the audit's suggestion** of `ui/sidebar.tsx`: that's a full
provider system with cookie persistence and keyboard shortcuts `AppSidebar`
doesn't use, and its mobile mode is internally a `Sheet` anyway. Using `Sheet`
directly reuses the real nav with far less surface area and no new dependency.

Also folds in the **mobile header layout** item — the header had to change to fit
the button. The action group no longer wraps above the brand, and the wordmark
hides below `sm` (375px can't fit menu + wordmark + month picker + avatar).

Verified at 375px: single-row header, drawer opens, all five links present,
closes on navigation.

Files: `src/components/AppSidebar.tsx`, `src/pages/Index.tsx`

---

## ⚠️ Left for you — decisions I won't guess

### 1. Receipts can still be saved into an unreadable state

`useSaveReceipt` writes `settlement_id: activeSettlement?.id || null`, while
`useMonthlyReceipts` returns `[]` when no settlement is active and filters on an
exact match. A receipt saved with NULL is invisible in every month, permanently,
and there is no UI to reassign it.

The `20260802300000` migration re-attached existing orphans, so nothing is
currently stranded — but the code path is still open.

**The decision:** what should happen when someone scans with no active settlement?

- **(a) Block the save** and prompt to create a settlement first. Safest, no
  invisible data possible, but it interrupts the scan flow at the worst moment —
  the user has already photographed the receipt.
- **(b) Save it as unassigned** and show those receipts in the list with an
  "assign to settlement" affordance. Better UX, needs the list query to stop
  filtering on an exact settlement match, plus new assignment UI.
- **(c) Auto-create a default settlement** on first receipt. Invisible to the
  user, but silently creates settlement rows with names they didn't choose.

I did not implement any of these. (b) is probably right but it changes read
semantics for every receipt query, which is too broad to decide unattended.

### 2. `/oppgjor` — display only, no settlement logic

Building the route itself is fine, but `Settlement.tsx` (326 lines, currently
orphaned) contains split-ratio editing and settlement closing. Wiring those up
means touching money-splitting behaviour, which is explicitly off-limits
unattended. If I build `/oppgjor` I will mount the read-only overview and leave
a TODO where the ratio editor would go.

### 3. shadcn peer dependencies — 16 of 24 TS errors

`src/components/ui/` contains files importing packages that were never
installed: `cmdk`, `vaul`, `react-day-picker`, `react-hook-form`,
`embla-carousel-react`, `input-otp`, `react-resizable-panels`. None are used by
any app code.

**The decision:** install the 7 packages, or delete the 16 unused ui files?
Deleting is cleaner and cuts the TS error count by two thirds, but it's
irreversible if a future component wants them. Installing adds dependencies for
components nothing imports. Left alone per the no-new-dependencies constraint.
