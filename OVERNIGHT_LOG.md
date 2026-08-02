# Overnight work log — 2026-08-02 → 08-03

Branch: `overnight-fixes` (off `main` @ `ea273ff`)
Stopped at: lint cleanup, before any edits. **Working tree clean, nothing stashed.**

---

## Status at a glance

| | Item | Commit |
|---|---|---|
| ✅ | Restore 3 commits dropped by the #11 squash | `984d702` |
| ✅ | Duplicate join RPC overwriting invite success | `6ef6022` |
| ✅ | Query failures no longer look like empty data | `f5f64f1` |
| ✅ | Mobile navigation drawer (+ mobile header layout) | `b6cac65` |
| ✅ | Each sidebar route gets its own page | `11988fb` |
| ✅ | Six real TypeScript errors resolved | `4ab771a` |
| 🔄 | Lint cleanup — **not started**, inspection only | — |
| 🔴 | Receipts savable into unreadable state | needs you |
| 🔴 | `/oppgjor` beyond display | needs you |
| 🔴 | shadcn peer deps | needs you |

**Health:** TypeScript errors 24 → 16 (all 16 are the shadcn peer-dep question).
Production build passes. All five routes verified rendering distinct content.

---

## ✅ Completed tonight

### Restore three commits dropped by the #11 squash merge · `984d702`

The squash for PR #11 kept only the branch's first commit and silently dropped
the two after it — the same failure that left the embed fix out of #9 and broke
`main` for a day. **Worth watching when you merge future PRs.**

| Restored | Why it mattered |
|---|---|
| `src/integrations/supabase/types.ts` | Had no `system_confidence` despite the column existing in the DB, leaving a live type error in the receipt-save path |
| `supabase/migrations/20260802300000_backfill_settlement_household.sql` | Applied to the database but absent from the repo — a fresh clone would have diverged |
| `docs/frontend-plan.md` | — |

### Duplicate join RPC overwriting invite success · `6ef6022`

**I corrected my own audit here.** I called this a TDZ crash; it isn't. Effects
run after render, so the binding is initialised by the time it's called.

The real defect it masked: nothing guarded against the join running twice.
StrictMode double-invokes effects in dev, and the effect also re-fires whenever
the `user` object changes identity (a token refresh suffices). The second call
returns `already_member` and overwrites the success state — so a successful join
reported *"du er allerede medlem"* and never showed the confirmation toast.

`useCallback` + effect moved below the declaration + a ref keyed on the invite
token. Lint on the file 3 → 1; the remaining `set-state-in-effect` is
intentional (status derives from an async RPC result).

`src/pages/JoinHousehold.tsx`

### Query failures no longer look like empty data · `f5f64f1`

Every list rendered its empty state on error — exactly why two real outages went
unnoticed for a day (a PostgREST embed returning HTTP 300, and an RLS-hidden
settlements table). A broken receipt list is pixel-identical to an empty month.

New `QueryErrorState`; `ReceiptList` / `ShoppingList` / `CategoryBreakdown` /
`SpendingTrend` branch on `isError` ahead of their empty checks; `QueryClient`
gets a `QueryCache.onError` logging the failing query key.

⚠️ **Verification gap, flagged honestly:** the branches are typecheck-clean and
are plain booleans ahead of each empty check, but I could **not** exercise them
at runtime. supabase-js binds `fetch` at client construction, so patching
`window.fetch` from the console never reaches it, and forcing a genuine failure
would have meant editing the client. **Worth a manual look.**

### Mobile navigation drawer · `b6cac65`

No navigation existed below `lg` — on a phone only the dashboard was reachable.
Menu button opens `AppSidebar` in a left `Sheet`. `AppSidebar` gains `variant`
and `onNavigate`; desktop unchanged (both default).

**Deviated from the audit's suggestion** of `ui/sidebar.tsx` — that's a full
provider system with cookie persistence and keyboard shortcuts `AppSidebar`
doesn't use, and its mobile mode is internally a `Sheet` anyway.

Folds in the **mobile header layout** item: the action group no longer wraps
above the brand, and the wordmark hides below `sm` (375px can't fit menu +
wordmark + month picker + avatar). Verified at 375px.

`src/components/AppSidebar.tsx`, `src/pages/Index.tsx`

### Each sidebar route gets its own page · `11988fb`

All five routes mapped to `<Index />`, so the nav changed the URL and the active
highlight while content stayed identical.

Extracted shared chrome into `AppLayout` (sidebar, drawer, header, upload sheet,
consent modal). The upload sheet lives there so it isn't duplicated per route;
pages open it via a small context.

| Route | Page | Content |
|---|---|---|
| `/` | `Index` | dashboard, content unchanged |
| `/kvitteringer` | `Receipts` | `ReceiptList` full-width + add-receipt CTA |
| `/oppgjor` | `Oppgjor` | `SettlementOversikt` only — see 🔴 #2 |
| `/kategorier` | `Categories` | `CategorySection`, previously reachable only inside the Budsjett dialog |
| `/rapporter` | `Reports` | overview, trend expanded, breakdown |

Verified all five in the browser: distinct headings, distinct content.

### Six real TypeScript errors resolved · `4ab771a`

- `HouseholdContext` — `invite_enabled` and the embedded profile are nullable in
  the DB; local interfaces declared them non-null.
- `useStorePrices` — `filter(Boolean)` doesn't narrow null; explicit type
  predicate in both call sites.
- `useSettlements` — the create path returned an uncast insert row while both
  read paths already cast to `Settlement`. Now consistent.
- `PrisDatabase` — recharts hands the tooltip formatter a `ValueType`, not a
  `number`. Also removed the unused `StatRow`.
- `tsconfig.app.json` — added `vite/client` to `types` for `import.meta.env` and
  the CSS module declarations. **Not a new dependency** — vite is installed and
  ships them.

---

## 🔄 In progress when stopped

### Lint cleanup — inspection done, **zero edits made**

Nothing is half-applied. I ran the census and inspected the ambiguous cases, then
stopped rather than start edits I couldn't finish and commit.

Current state: **60 problems**, down from 64 (the four removed were incidental to
the type fixes).

| Count | Rule | Assessment |
|---|---|---|
| 22 | `no-unused-vars` | Safe mechanical removals — **start here** |
| 12 | `react-refresh/only-export-components` | Almost all shadcn `ui/` files exporting variant objects. Low value, leave. |
| 11 | `set-state-in-effect` | Needs judgement per case; several are legitimate (async-derived state) |
| 7 | `no-explicit-any` | Needs real types; moderate effort |
| 4 | `exhaustive-deps` | Each needs checking for stale-closure bugs |
| 2 | `preserve-manual-memoization` | In `ReceiptList` memos |
| 2 | `no-empty-object-type` | shadcn `ui/` |
| 1 | `react-hooks/purity` | — |

**Next concrete step:** the 19 non-ui `no-unused-vars`, which are plain dead
imports and locals:

```
AppSidebar.tsx:2        Settings, LogOut
BudgetProgress.tsx:1    Progress
BudgetSettings.tsx:61   _          (destructure placeholder — rename or ignore)
BudgetSettings.tsx:73   error      (unused catch binding)
CategoryReview.tsx:5,7  useHousehold, Badge
ReceiptItemEditor.tsx:31 isEditing
ReceiptUpload.tsx:6     Upload, Pencil
ReceiptUpload.tsx:484   getMemberName
Settlement.tsx:28       household
ShoppingList.tsx:109    itemsWithEstimates
SpendingOverview.tsx:1,4 CardTitle, Wallet, TrendingUp, TrendingDown
use-toast.ts:15         actionTypes (used as a type only)
useBudgetData.ts:300    household
```

**Two I checked and would NOT blind-delete:**

- `ReceiptItemEditor.tsx:31 isEditing` — the *setter* `setIsEditing` is used 7
  times. The state is written but never read, which usually means a render
  branch was dropped, not that the state is junk. Deleting it would also mean
  deleting 7 setter calls. Look at what it was meant to gate before touching it.
- `ShoppingList.tsx:109 itemsWithEstimates` — its sibling
  `itemsWithoutEstimates` *is* used 3 times. Same smell: a rendering branch that
  was meant to split estimated vs unestimated items and got half-removed.

The other 17 are genuinely dead and safe to delete in one commit.

---

## ⏭️ Not started from the original plan

Nothing else — every ✅ item except lint cleanup is committed. The plan's P2
`/oppgjor` item was intentionally delivered display-only (see 🔴 #2).

---

## 🔴 Still red — needs your decision

### 1. Receipts can still be saved into an unreadable state

`useSaveReceipt` writes `settlement_id: activeSettlement?.id || null`;
`useMonthlyReceipts` returns `[]` when no settlement is active and filters on an
exact match. A receipt saved with NULL is invisible in every month, permanently,
with no UI to reassign it.

The `20260802300000` migration re-attached existing orphans, so **nothing is
currently stranded** — but the code path is still open.

**The decision:** what happens when someone scans with no active settlement?

- **(a) Block the save**, prompt to create a settlement. Safest, no invisible
  data possible — but interrupts the scan at the worst moment, after the user
  has already photographed the receipt.
- **(b) Save as unassigned** and show it in the list with an "assign to
  settlement" affordance. Better UX; requires the list query to stop filtering on
  an exact settlement match, plus new assignment UI.
- **(c) Auto-create a default settlement** on first receipt. Invisible to the
  user, but silently creates settlements they didn't name.

I implemented none. **(b) is probably right** but it changes read semantics for
every receipt query — too broad to decide unattended.

### 2. `/oppgjor` beyond display

The route now exists and shows `SettlementOversikt`, which is strictly more than
before (it rendered the dashboard). `Settlement.tsx` (326 lines, still imported
nowhere) holds the split-ratio editor and close flow. A TODO in
`src/pages/Oppgjor.tsx` carries the open questions:

- Ratio editor on the page, or behind a dialog?
- Closing a settlement is irreversible from the UI — enough confirmation?
- `Settlement.tsx` predates the household-scoping migration; its queries need
  re-checking against current RLS before going live.

### 3. shadcn peer dependencies — all 16 remaining TS errors

`src/components/ui/` imports packages never installed: `cmdk`, `vaul`,
`react-day-picker`, `react-hook-form`, `embla-carousel-react`, `input-otp`,
`react-resizable-panels`. **No app code imports any of these files.**

**Install the 7 packages, or delete the 16 unused ui files?** Deleting is cleaner
and takes TS errors to zero; installing adds dependencies for components nothing
uses. Left alone per the no-new-dependencies constraint.

---

## Notes for tomorrow

- The **squash-merge drop** has now bitten twice (#9, #11). Consider a merge
  commit or rebase instead, or check `git log main..branch` is empty after merge.
- The `QueryErrorState` branches are **unverified at runtime** — the one thing
  from tonight I'd most want eyes on.
- Nothing was pushed. `git push -u origin overnight-fixes` when you're ready.
