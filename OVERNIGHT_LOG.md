# Overnight work log — 2026-08-02 → 08-03

Branch: `overnight-fixes` (off `main` @ `ea273ff`)
**All ✅ items complete.** Three 🔴 decisions remain — see bottom.

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
| ✅ | Lint cleanup — dead code, `any`, stale closure | `7406163` `37efa08` `cb9c476` |
| 🔴 | Receipts savable into unreadable state | needs you |
| 🔴 | `/oppgjor` beyond display | needs you |
| 🔴 | shadcn peer deps | needs you |

**Health:** TypeScript errors 24 → 16 (all 16 are the shadcn peer-dep question).
Lint 64 → 35. Production build passes. All five routes verified in a clean
browser tab with no console errors.

---

## ✅ Completed

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

### Lint cleanup · `7406163`, `37efa08`, `cb9c476`

64 → 35 problems, in three commits.

**Dead code** (`7406163`) — unused imports across AppSidebar, BudgetProgress,
CategoryReview, SpendingOverview, ReceiptUpload; the unused `getMemberName`
helper; `household` in Settlement and useMonthlyReceipts; two unused catch
bindings. `use-toast`'s `actionTypes` was a runtime const read only via
`typeof`, so it's now a plain type.

**Explicit any** (`37efa08`) — 7 → 0. SpendingTrend held five; added `TrendItem`
matching the embedded select's real shape, `ChartRow` for the recharts rows, and
`TooltipEntry` for the custom tooltip (whose `value` is optional in recharts'
payload, so the total now coalesces instead of assuming a number). BudgetSettings
narrowed `catch (error: any)` to `unknown` with an instanceof check.

**A real bug found through `exhaustive-deps`** (`cb9c476`) — `handleDrop` was
`useCallback(…, [])` while `processImage` is a plain function recreated each
render. The callback captured the first render's copy permanently, and that copy
closed over `mappings`/`categories` while React Query still had them undefined.
So **any receipt added by dropping a file was categorised against an empty
mapping set** — learned categorisation and the system-confidence signal were both
silently inert and every item fell through to "needs review". File-picker uploads
were unaffected. Removed the memoisation; the dropzone isn't memoised so the
stable identity bought nothing.

#### Stopped here deliberately — the remaining 35 are not worth churn

| Count | Rule | Why left |
|---|---|---|
| 14 | (various) | Vendored shadcn `ui/` files |
| 5 | `only-export-components` | Standard context pattern — exporting `useAuth` beside `AuthProvider`. Fixing means splitting every context into two files for HMR granularity, with no functional gain. The rule is mismatched to this codebase. |
| 11 | `set-state-in-effect` | Almost all legitimate syncing from an external source: a media-query listener, the PWA install prompt, prop→state resets, async data landing in context. Rewriting to `useSyncExternalStore` or derived state would be invasive and riskier than the warnings. |
| 2 | `exhaustive-deps` | **Would change behaviour — see 🔴 #4.** |
| 2 | `preserve-manual-memoization` | React-compiler informational, in ReceiptList memos. |
| 2 | `no-unused-vars` | The two flagged below; both look like dropped render branches. |

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

### 4. Two `exhaustive-deps` that would change behaviour if "fixed"

Both are effects whose deps are intentionally narrow. Adding the missing values
is not a no-op, so I left them:

- **`ReceiptUpload.tsx:95`** — `useEffect(…, [startManual])` also reads `state`.
  Adding `state` means that after the user hits *Avbryt* (which resets state to
  `idle`) while `startManual` is still true, the effect re-fires and bounces
  them straight back into the review form. Is the current fire-once-on-prop-flip
  the intended behaviour, or should cancel be able to return to the idle screen?

- **`HouseholdContext.tsx:120`** — `useEffect(…, [user])` calls `fetchHousehold`,
  which is recreated every render. Adding it as a dep loops unless the function
  is wrapped in `useCallback` first. That is the standard fix, but it is on the
  household/auth data path, so I would rather you sign off than have me refactor
  it unattended.

### 5. Two unused locals that look like dropped render branches

Left in place from the dead-code pass because in both cases the sibling binding
is still actively used, which reads like a rendering branch that was half
removed rather than genuinely dead code:

- `ReceiptItemEditor.tsx:31` — `isEditing` is never read, but `setIsEditing` is
  called **7 times**. Something was meant to be gated on it.
- `ShoppingList.tsx:109` — `itemsWithEstimates` is unused while its sibling
  `itemsWithoutEstimates` is used 3 times. Looks like a split between estimated
  and unestimated items that never landed.

Deleting either would also mean deleting the writes, which would discard
whatever the intent was.

---

## Notes for tomorrow

- The **squash-merge drop** has now bitten twice (#9, #11). Consider a merge
  commit or rebase instead, or check `git log main..branch` is empty after merge.
- The `QueryErrorState` branches are **unverified at runtime** — the one thing
  from tonight I'd most want eyes on.
- Branch pushed as `overnight-fixes`; no PR opened yet.
