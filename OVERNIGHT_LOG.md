# Overnight work log

Newest session first. Older sessions are kept verbatim below.

---

# 2026-08-06 · Dead ends and broken controls

Branch: `overnight-fixes` (reset onto `main` at `6b8e17f` — its two old commits
were already in `main` via the #14 squash). Fixes the 15 issues catalogued in
[`docs/user-flows.md`](docs/user-flows.md), which mapped the app's real wiring
before any of this was touched.

**One commit per issue**, each citing its number. `docs/user-flows.md` has been
regenerated so the diagrams match the code.

## Status at a glance

| | Issue | Commit |
|---|---|---|
| ✅ | #4 `/oppgjor` blank for a household of one | `cc43aaf` |
| ✅ | #6 null household → create-or-join recovery | `57a71c1` |
| ✅ | #7 404 outside the shell, in English | `0c5e0d9` |
| ✅ | #3 fake header search + dead ⌘K hint | `f924c16` |
| ✅ | #1 "+ Inviter medlem" with no handler | `498f8a1` |
| ✅ | #2 "Innstillinger" that signed you out | `498f8a1` |
| ✅ | #5 no way to assign a settlement-less receipt | `1d0b542` |
| ✅ | #9 `/store-comparison` link missing from the empty branch | `ebc83b4` |
| ✅ | #12 four product names in user-facing copy | `8b417c8` |
| ✅ | #10 `/install` reachable only via a self-suppressing prompt | `91daebb` |
| ✅ | #11 routes with no entry point | `91daebb` |
| ✅ | #13 `/prisdatabase` missing its providers | `91daebb` |
| 📋 | #8 `Settlement.tsx` — kept, see below | — |
| 📋 | #14, #15 — deliberate, see below | — |
| 🔴 | **New:** leaving/removing a member silently no-ops | needs you |

**Health:** `tsc` clean apart from the 16 known shadcn peer-dep errors in
`src/components/ui/`. Lint on every touched file is back to its pre-existing
baseline — no new errors. Production build passes.

## What changed

### P0 — dead ends

**#4 `/oppgjor` blank for a household of one.** `SettlementOversikt` returns
`null` under `members.length < 2`, which is right on the dashboard and wrong on
`/oppgjor`, where that card *is* the page. Added an opt-in `showEmptyState` used
only by the route: explains that a settlement needs two people, opens the invite
dialog, and links onward to kvitteringer.

`HouseholdInvite` gained controlled `open`/`onOpenChange` + `hideTrigger`, and
`InviteMemberDialog` wraps it with the household read from context — so any
caller that wants the invite flow only has to own a boolean. That is what made
#1 a two-line fix rather than a second invite implementation.

**#6 null household.** `HouseholdProvider` sets `household` to null whenever the
membership lookup comes back empty. Nothing handled it: the shell rendered
against the literal string "Husholdning" and the first thing to actually
dereference it was `ReceiptUpload`'s `household!.id`, which threw *after* the
user had picked a photo. `AppLayout` now gates on it and renders `NoHousehold`,
offering the two things the backend already supports:

- **create** — direct inserts into `households` + `household_memberships`. Both
  are already permitted by RLS (`households` INSERT allows any authenticated
  user; memberships INSERT allows `auth.uid() = user_id`), so **no migration**.
  The id is generated client-side, because the SELECT policy on `households` is
  membership-based and the membership does not exist yet — reading the row back
  from the insert returns nothing.
- **join** — pulls the uuid out of a pasted invite link and hands off to `/join`.

`useLeaveHousehold` now returns to `/` instead of `/auth`; the user is still
signed in, so `/auth` only bounced straight back.

**#7 404.** Rendered outside every provider, in English, with a full-reload
`<a href="/">` as its only exit. Now renders inside `AppLayout` when signed in
(sidebar, month picker and upload sheet all stay put) and standalone when not.

### P1 — broken controls

**#1** "+ Inviter medlem" had no `onClick` at all. Now opens the existing invite
dialog. No new invite mechanism was built — `HouseholdInvite` already generates,
expires and regenerates tokens; it was just buried in UserMenu →
Husholdningsinnstillinger.

**#2** The sidebar profile row is labelled "Innstillinger" and called
`supabase.auth.signOut()` with no confirmation — the least reversible control in
the sidebar behind the label promising the least. It now opens household
settings, matching the label. Signing out stays in `UserMenu`, where it is
labelled "Logg ut".

**#3** The header search box had no `value`, no `onChange`, and a ⌘K hint with
nothing listening. Wired rather than removed: it submits to
`/kvitteringer?q=…`, and ⌘K/Ctrl+K focuses it. The term travels through the URL
instead of new state, because `ReceiptList` already owns a working filter and
its own input — a second copy would have given one query two sources of truth.
`ReceiptList` reads `?q=` by adjusting state during render rather than in an
effect (an effect there sets state synchronously on every change and cascades a
render pass), and now keeps its own input visible whenever a term is active — it
was gated on `receipts.length > 3`, so a term from the header could otherwise
filter a short list with no visible box and no way to clear it.

### P2 — structural gaps

**#5** Added `useUpdateReceiptSettlement` and a picker in the receipt detail
dialog, so a receipt with `settlement_id = null` can be moved into a settlement
(or back out). It invalidates `settlements` as well as `receipts`, since
`useSettlementBalances` derives every balance from the receipt rows. Two cases
the picker covers: "Ikke i oppgjør" needs a real sentinel because Radix Select
reads `""` as no-value, and a receipt sitting in a since-closed settlement gets
that settlement as an explicit option, or the trigger renders blank.

**#9** `StoreComparison`'s "no price history" branch rendered its own header
without the "Detaljer" link — the only entry point to `/store-comparison`
anywhere — so the route went unreachable exactly when you would want to open it.
Both branches now share one header component.

### P3 — cleanup

**#12** The app called itself four things: "Food Buddy" (InstallPrompt), "Budget
App" (all of Install.tsx), "Matbudsjett" (login), "BudgetBandz" (manifest,
sidebar, page title). The install flow was the worst of it — the prompt and the
page it links to disagreed about which app was being installed. Standardised on
**BudgetBandz**, which is what `manifest.json` and `index.html` already said.
Descriptive copy ("Spor matforbruket ditt sammen") untouched.

**#10 `/install` — confirmed working, suppression is intentional.** The 7-day
`localStorage` suppression in `InstallPrompt` is deliberate and unchanged.
Nothing about the page is broken. The problem was that it was the *only* route
in, so `UserMenu` now carries a permanent "Installer appen" link.

**#13** `/prisdatabase` was the one authenticated route wrapped in `RequireAuth`
alone. Harmless today, but it meant one route where any component calling
`useHousehold()` throws instead of renders. All seven authenticated routes now
go through the same map in `App.tsx`.

## 📋 Deliberate, no change

**#8 `Settlement.tsx` — kept, not deleted.** It is *not* superseded.
`SettlementSwitcher` and `SettlementOversikt` between them cover switch, create,
close and reopen; what they do not cover is the **split-ratio editor**, which
exists only here. Settlements currently get equal ratios at creation and there
is no UI to change them.

It is also not safe to mount as-is, and already says so in-file
([Settlement.tsx:58](src/components/Settlement.tsx#L58)): it reads balances from
`useSettlementBalances` but *writes* household-level `split_ratios`, which are
only the fallback once a settlement has `settlement_members` rows. Mounted
unchanged, saving would appear to do nothing. Deleting it would throw away the
only ratio-editor UI in the repo; mounting it would reintroduce a bug #13 already
fixed. So it stays, annotated, pending 🔴 #2 from the previous session.

**#14 `/store-comparison` and `/prisdatabase` render without `AppLayout`.**
Intentional — they are focused sub-pages with their own back arrow, not
destinations that need a month picker and an upload sheet.

**#15 The upload CTA appears only on `/` and `/kvitteringer`.** Also
intentional. `useReceiptUpload()` is available everywhere, but `/rapporter`,
`/kategorier` and `/oppgjor` are views onto data, not places to add it.

## 🔴 New — needs your decision

### Leaving a household, and removing a member, silently do nothing

Found while building the #6 recovery screen, **not** one of the 15.

`household_memberships` has RLS enabled with **only SELECT and INSERT policies**
— there is no DELETE policy. Postgres therefore deletes zero rows and returns no
error, so both of these report success and change nothing:

- `useLeaveHousehold` — toasts "Du har forlatt husholdningen", redirects, and
  the user is still a member.
- `useRemoveMember` — same, from the owner's side.

`useLeaveHousehold` has a second problem independent of RLS: its delete filters
on `household_id` only, with no `user_id` predicate. If a DELETE policy is added
without a `USING` clause narrow enough to constrain it, that statement removes
**every** member of the household, not just the caller.

I have not written the policy. Who may remove whom is a permissions decision
(owner-only? owner cannot remove themselves? last member?), and it needs a
migration plus a matching `.eq("user_id", …)` on the leave path. Tell me the
rule and I will write both.

## Verification

Typecheck, lint and production build were run after every commit. In the browser
I could verify the **signed-out** surface directly: the 404 renders in Norwegian
with both exits, `/install` shows the new name, `/prisdatabase` correctly
redirects to `/auth`, and the login screen reads "BudgetBandz". Fresh-tab console
is clean.

**Not verified at runtime:** everything behind auth — `NoHousehold`, the
`/oppgjor` empty state, the settlement picker, the header search round-trip and
the two sidebar buttons. I have no credentials for this Supabase project, and a
dev server on 5175 belonging to another session meant I ran mine on 5176 (added
as `budget-app-verify` in `.claude/launch.json`). These are the states worth your
eyes first.

---

# Overnight work log — 2026-08-02 → 08-03

Branch: `overnight-fixes`. **All ✅ items complete and merged.** 🔴 #1 settled
2026-08-03; four 🔴 decisions remain — see bottom.

---

## Status at a glance

Tracked by **PR, not commit SHA** — every SHA this log originally cited is now
unreachable from `main`. Both #12 and #13 were squash-merged, which replaced all
of them. PR numbers survive that; hashes do not.

| | Item | Merged via |
|---|---|---|
| ✅ | Restore 3 commits dropped by the #11 squash | #12 |
| ✅ | Duplicate join RPC overwriting invite success | #12 |
| ✅ | Query failures no longer look like empty data | #12 |
| ✅ | Mobile navigation drawer (+ mobile header layout) | #12 |
| ✅ | Each sidebar route gets its own page | #12 |
| ✅ | Six real TypeScript errors resolved | #12 |
| ✅ | Lint cleanup — dead code, `any`, stale closure | #12 |
| ✅ | Receipts savable into unreadable state — settled, see 🔴 #1 | #13 |
| ✅ | `settlement_members` ignored by all three balance copies | #13 |
| ✅ | CLAUDE.md content dropped by the #12 squash, recovered | #13 |
| 🔴 | `/oppgjor` beyond display | needs you |
| 🔴 | shadcn peer deps | needs you |
| 🔴 | two `exhaustive-deps` that change behaviour | needs you |
| 🔴 | two unused locals — dropped render branches? | needs you |

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

### 1. ~~Receipts can still be saved into an unreadable state~~ — SETTLED 2026-08-03

Settled as a corrected version of (b), after the investigation showed the write
path was the wrong place to look.

**The framing above was too narrow.** The problem was never that
`useSaveReceipt` writes NULL — it was that `useMonthlyReceipts` was the only
receipt query scoped by settlement at all. That scoping was wrong on four
independent counts:

- `SpendingTrend` already queried by `household_id` alone, so the 6-month chart
  and the month view disagreed about the same receipts.
- `budgets` is keyed household + month + year, so a settlement-scoped spend was
  being compared against a whole-month budget.
- `useSettlements` is `status = 'active'` only, so closing a settlement made
  every receipt on it vanish from every month view — the same loss as the NULL
  case, and one that none of (a)/(b)/(c) addressed.
- `ExportData` rides the same hook, so CSV exports were silently partial.

**What was done** (all client-side; no migration, no schema change):

1. `useMonthlyReceipts` filters `household_id` + date range. No settlement
   filter, no `if (!activeSettlement) return []`.
2. Budget totals count every receipt in the household for the month, matching
   `SpendingTrend`'s existing behaviour.
3. New `useSettlementBalances` hook owns all settlement scoping: it filters
   receipts to one settlement in memory and does the settle-up math.
4. `ReceiptList` badges any receipt not in the active settlement, including
   `"Ikke i oppgjør"` for NULL. Not-in-a-settlement is now a visible state.
5. `useSaveReceipt` is **unchanged** — it still writes NULL when no settlement
   is active. That is now a legitimate state rather than data loss.

**A second bug surfaced while doing it, and is fixed in the same change.**
`AppSidebar`, `SettlementOversikt` and `Settlement` each held their own copy of
the balance math, and all three split across **household** members at household
`split_ratios` — never reading `settlement_members`, despite
`useCreateSettlement` writing per-settlement members and ratios on create and
`useSettlements` already fetching them. A member who was not on a custom
settlement was still charged a share of it. All three now call
`useSettlementBalances`, which takes membership and ratios from
`settlement_members` and falls back to the household split only for settlements
with no members rows. Ratios are also normalised now — both source tables can be
partially filled, so they were not guaranteed to sum to 100.

**Verified** against live data: with the empty "Huta 25" settlement active, May
2026 went from `0,00 kr` / "Ingen kvitteringer" to `2 060,30 kr` and all three
receipts listed, each badged "Alani og balder". No console errors.

**Not done, deliberately:** no assign-to-settlement action on the badge yet —
receipts are visible and countable, just not reassignable from the UI. The NULL
badge path is untested against real rows because the `20260802300000` backfill
left none.

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

- The **squash-merge drop** has bitten three times (#9, #11, #12). #12 lost the
  whole of `docs: bring CLAUDE.md current`; #13 restored it. #13 itself squashed
  cleanly but merged while a later commit was still being pushed, stranding the
  avatar migration on the branch. Two habits fix both failure modes: merge-commit
  or rebase instead of squash, and check `git log main..branch` is empty after.
- The `QueryErrorState` branches are **unverified at runtime** — still the one
  thing from the overnight run I'd most want eyes on.
- **`SettlementSwitcher` is mounted nowhere** (found while verifying 🔴 #1;
  CLAUDE.md wrongly claimed it was in the header, now corrected). There are two
  active settlements and no UI to switch between them — only
  `localStorage.activeSettlementId` or the newest-active fallback. Cheapest
  remaining fix, and it is what makes settlements usable at all.
- **No assign-to-settlement action** yet. Receipts outside the active settlement
  are visible and badged after #13, but cannot be moved from the UI.
- `.claude/worktrees/`, `budget app.zip` and `design_handoff/` are untracked and
  look like gitignore candidates rather than things to commit.
