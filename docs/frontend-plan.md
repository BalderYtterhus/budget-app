# Frontend repair plan

Written 2026-08-02, after uploading a receipt that saved correctly but was
invisible in the UI. Three distinct problems surfaced; this is what each one
is and what fixing it involves.

---

## A. Receipts can become permanently invisible (highest priority)

**Symptom.** A saved receipt never appears. Budget and spending totals stay at
zero. Nothing errors.

**Cause.** Two independent gates, both silent:

1. `useSaveReceipt` writes `settlement_id: activeSettlement?.id || null`. With
   no active settlement, the receipt saves with NULL.
2. `useMonthlyReceipts` starts with `if (!activeSettlement) return []` and
   filters `.eq("settlement_id", activeSettlement.id)`. A NULL-settlement
   receipt can therefore never match, in any month, forever.

Migration `20260802300000` re-attaches existing orphans, but the code path that
creates them is still open.

**Fix.**

- Block the creation path: refuse to save a receipt when no settlement is
  active, and prompt to create one. Saving into a state that cannot be read
  back is never the right outcome.
- Alternatively, treat "no settlement" as *unassigned* rather than *hidden* —
  show those receipts in the list with an "assign to settlement" affordance.
  Better UX, more work.
- Add an escape hatch either way: a way to move a receipt between settlements.
  There is currently no UI for this, so a misfiled receipt is unrecoverable
  without SQL.

**Also worth doing:** `ReceiptList` renders the same empty state whether the
query returned zero rows or failed outright. That is why the PGRST201 embed
break earlier in the day was invisible — a broken list looked like an empty
month. Surface `isError` distinctly from `data.length === 0`. This one change
would have caught two separate bugs today.

---

## B. Sidebar navigation goes nowhere

**Symptom.** Clicking Kvitteringer / Oppgjør / Kategorier / Rapporter changes
the URL and moves the active highlight, but the page content is identical.

**Cause.** Not a bug — unbuilt. `App.tsx` maps all five paths to the same
element:

```tsx
{["/", "/kvitteringer", "/oppgjor", "/kategorier", "/rapporter"].map(path => (
  <Route path={path} element={<RequireAuth>…<Index /></RequireAuth>} />
))}
```

The routes were registered by the D² sidebar PR so the nav would highlight
correctly, but the destination views were never written.

**Fix.** Build one page per route. The components largely exist already and are
currently stacked onto `Index` — this is mostly extraction and layout, not new
feature work:

| Route | Renders | Status |
|---|---|---|
| `/` | `SpendingOverview`, CTA row, trend toggle | Already the dashboard |
| `/kvitteringer` | `ReceiptList`, full width, with the month filter | Extract from `Index` |
| `/oppgjor` | `SettlementOversikt` + `Settlement` (split ratios) | `Settlement` exists but isn't on any page |
| `/kategorier` | Category CRUD + `CategoryReview` sheet inline | Needs a container; parts exist |
| `/rapporter` | `SpendingTrend`, `CategoryBreakdown`, export | Extract from `Index` |

Suggested order: `/kvitteringer` first (smallest, highest daily value), then
`/oppgjor` (surfaces `Settlement`, which is currently unreachable and is what
would have let you notice the missing settlement in the first place), then
`/rapporter`, then `/kategorier`.

Do this as one route per PR rather than all five at once — each is
independently reviewable and shippable.

---

## C. Debugging approach for the next one of these

What made today's problems hard to see was that every failure mode rendered as
a plausible empty state. Three cheap changes make the next one obvious:

1. **Distinguish error from empty** in `ReceiptList`, `ShoppingList`,
   `CategoryBreakdown`, and `SpendingTrend`. React Query already exposes
   `isError` and `error`; none of these read it.
2. **Log query failures.** Add an `onError` on the QueryClient default options
   that `console.error`s the failing query key. A PGRST201 or an RLS block
   would then be visible in the console instead of silently resolving to an
   empty array.
3. **Assert the read path in dev.** When `activeSettlement` is null, log a
   warning explaining that receipts will be hidden. Silent global filters are
   the root cause here, not the individual queries.

**A repeatable check when data "doesn't show":** query the REST endpoint with
the browser session's JWT rather than the anon key, since the anon key returns
`[]` for everything under RLS and looks identical to no data. The session token
is in `localStorage` under `sb-<project-ref>-auth-token`. Passing that as
`Authorization: Bearer` with the anon key as `apikey` reproduces exactly what
the app sees, which separates "not saved" from "saved but filtered out" in one
request.

---

## Ordering

1. Apply migration `20260802300000` (unblocks the existing data)
2. **A** — close the invisible-receipt path and split error from empty state
3. **B** — `/kvitteringer`, then `/oppgjor`, then the rest
4. **C** — the logging changes, cheap enough to fold into whichever PR is
   convenient

Item A is the only one that is actively losing data; B is cosmetic-but-annoying
and C is prevention.
