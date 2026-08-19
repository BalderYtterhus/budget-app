# BudgetBandz — Claude Code Context

## What this app is
Norwegian household grocery budget tracker. Multiple people share expenses, scan receipts with AI, track budgets by category, settle payments, compare prices across stores, and contribute anonymous price data to a shared inflation-tracking database.

## Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/Radix UI
- **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions)
- **AI/OCR**: Anthropic API (`claude-sonnet-4-6`) via Edge Function
- **State**: React Context + TanStack React Query
- **Charts**: recharts
- **PWA**: manifest.json, Apple meta tags

## UI language
All user-facing text is **Norwegian Bokmål**.

## Key architecture rules
- All DB queries go through hooks in `src/hooks/` — never write Supabase calls in components
- All data scoped by `household_id` with Supabase RLS
- RLS uses helper functions `get_user_household_ids(uid)` and `is_household_member(uid, hid)`
- A DB trigger (`on_auth_user_created`) auto-creates household + profile on signup
- `normalizedName` on receipt_items is the key to price comparison — lowercase, no quantities/weights/store codes
- `store_chain` on receipts is the normalized chain name — "Rema 1000 Majorstua" → "rema 1000"
- **A settlement is a payment-splitting grouping, not a spending period.** Monthly views (receipts, budget, totals, trend, export) are scoped by `household_id` + date and never by `settlement_id`. Only `useSettlementBalances` filters by settlement. Re-adding a settlement filter to a month query is what made NULL-settlement and closed-settlement receipts permanently invisible
- Currency: `formatNOK()` from `src/lib/format.ts`
- Class merging: `cn()` from `src/lib/utils.ts`
- Toast notifications: `useToast()` from shadcn

## Directory structure
```
src/
  components/         # Feature components + shadcn ui/ subfolder
  contexts/           # AuthContext, HouseholdContext, MonthContext, SettlementContext
  hooks/              # useBudgetData.ts, useSettlements.ts, useShoppingList.ts, useStorePrices.ts
  pages/              # Index.tsx, Auth.tsx, JoinHousehold.tsx, StoreComparison.tsx, PrisDatabase.tsx, Install.tsx
  types/              # budget.ts — all domain interfaces
  lib/                # format.ts, utils.ts
  integrations/supabase/  # client.ts, types.ts
supabase/
  functions/
    parse-receipt/      # OCR via Anthropic
    submit-price-data/  # Server-side consent check + anonymous price insert
  migrations/           # All schema migrations in order
public/
  manifest.json
```

## Database tables (current schema)
- `households` — id, name, invite_token, invite_enabled, invite_expires_at
- `profiles` — user_id, display_name, email, **price_sharing_enabled** (bool, null=unanswered), avatar_url
- `household_memberships` — user_id, household_id, role (owner/member)
- `categories` — id, name, color, is_default, household_id (null = default)
- `hidden_default_categories` — household_id, category_id
- `budgets` — household_id, month, year, total_budget
- `category_budgets` — budget_id, category_id, amount
- `receipts` — household_id, store_name, **store_chain**, total_amount, receipt_date, image_url, raw_ocr_text, created_by_user, paid_by_user, settlement_id, label
- `receipt_items` — receipt_id, raw_text, **normalized_name**, price, quantity, unit_price, category_id, needs_review, included_in_totals, **confidence** (AI self-reported 0–1), **ai_predicted_category_id** (write-once, never updated), **reviewed_at** (stamped on any human category edit), **system_confidence** (independent 0–1, 0.5 = no evidence)
- `item_category_mappings` — household_id, item_pattern, category_id, frequency
- `split_ratios` — household_id, user_id, ratio
- `shopping_list_items` — household_id, name, quantity, category_id, added_by_user, estimated_price
- `settlements` — household_id, name, type, status, created_by  ⚠️ household_id was added later; pre-existing rows were NULL and invisible under RLS until migration `20260802300000` backfilled them
- `settlement_members` — settlement_id, user_id, ratio
- `public_price_data` — store_chain, normalized_name, category_name, price, unit_price, quantity, receipt_date, confidence, country_code, submitted_at (**no user/household IDs**)

## AI accuracy instrumentation (Phases 1–3 of the AI roadmap)
Three columns on `receipt_items` exist to make OCR/categorisation accuracy measurable:
- `ai_predicted_category_id` — the model's own call, written once at save. `category_id` is mutable (mapping fallback fills it, corrections overwrite it), so without this the original prediction was unrecoverable. NULL here while `category_id` is set means the AI abstained and the fuzzy fallback supplied it.
- `reviewed_at` — set whenever a human edits a category, in all three write paths. `needs_review = false` conflates "a person confirmed" with "the AI was confident and nobody looked", so this is what gives accuracy an honest denominator.
- `system_confidence` — computed by `src/lib/systemConfidence.ts` from `item_category_mappings` frequency, i.e. evidence the model doesn't have. Compared against the model's own `confidence` to catch confidently-wrong categorisations, which a confidence threshold structurally cannot.

Queries live in `scripts/eval/ocr_accuracy.sql` (run in the Supabase SQL editor; normal RLS, no service-role key). Query 7 is the one that decides whether `system_confidence` earns its keep. **They need real receipts with real corrections before they mean anything.**

Roadmap state: Phases 1, 2, 4, 5 done · Phase 3 instrumented, awaiting data · Phase 6 (model benchmark) and 7 (pgvector + voyage-4-lite embeddings) not started. Phase 7 model choice is settled: **voyage-4-lite at 256 dims**, keyed by distinct `normalized_name`, free tier covers it. Needs a Voyage API key.

## Views
- `item_price_stats` (security_invoker=on) — median unit price per household × store_chain × normalized_name, with last_seen and sample_count

## Edge Functions
| Function | Purpose |
|---|---|
| `parse-receipt` | Anthropic vision OCR, returns store_chain + items + categories + confidence |
| `submit-price-data` | Checks price_sharing_enabled server-side (service role), sanitizes rows, inserts to public_price_data |

## Security model
- Storage bucket `receipts` is **private** — all access requires auth + RLS
- Upload path: `{household_id}/{uuid}` — unguessable, scoped to household
- New images stored as 1-year signed URLs in `image_url`
- `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are Edge Function secrets only
- `public_price_data` INSERT is service-role only (Edge Function); direct client inserts rejected
- Consent for price sharing checked server-side in Edge Function, not client-side

## Main page layout (Index.tsx)
1. Sticky header — logo, MonthSelector, CategoryReviewButton, ExportData, BudgetSettings, UserMenu
2. SpendingOverview — 3 cards (totalt brukt, budsjettstatus, gjenstående)
3. CTA row — "Legg til kvittering" (camera, OCR) + "Manuelt" (pencil, skips to review step) — both open bottom Sheet
4. SettlementOversikt — member avatars, paid/share/balance, settlement transactions, "Avslutt" button
5. Spending trend toggle — collapsed by default, expands SpendingTrend chart
6. Two-column grid — ReceiptList | ShoppingList + CategoryBreakdown
7. ConsentModal — shown once on first login if price_sharing_enabled IS NULL

## Key hooks (src/hooks/)
- `useCategories`, `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory`
- `useCurrentBudget`, `useSaveBudget`, `useCopyBudgetFromPreviousMonth`
- `useMonthlyReceipts`, `useSpendingSummary`
- `useSaveReceipt` — saves receipt + items + auto-learns mappings + calls submit-price-data Edge Function
- `useUpdateItemCategory` — updates category + mapping table
- `useUpdateReceipt` — updates store_name, receipt_date, total_amount on a receipt
- `useUpdateReceiptItem`, `useDeleteReceipt`, `useUpdateReceiptPayer`
- `useItemMappings`, `useSplitRatios`, `useSaveSplitRatios`
- `useSettlements`, `useCreateSettlement`, `useCloseSettlement`, `useSettlementNames` (id→name incl. closed)
- `useSettlementBalances` — **the only place settlement scoping lives.** Filters `useMonthlyReceipts` to one settlement and does the settle-up math off `settlement_members`. Never re-derive balances in a component; three copies of that math is how the household-vs-settlement member bug survived
- `useShoppingList`, `useAddShoppingListItem`, `useUpdateShoppingListItem`, `useDeleteShoppingListItem`
- `useRemoveMatchedItems` — auto-removes shopping list items when a receipt is uploaded
- `useEstimatePrices` — median price from receipt history
- `useStoreComparison`, `useDetailedStoreComparison` — queries `item_price_stats` view (not raw rows)
- `useKnownStores` — distinct store chains from `item_price_stats`

## Key components
- `AppLayout` — shared chrome for every authenticated route; exports `useReceiptUpload()` to open the upload sheet from any page
- `AppSidebar` — nav; `variant="drawer"` + `onNavigate` when rendered inside the mobile Sheet
- `QueryErrorState` — **use this whenever adding a list.** Every list previously rendered its empty state on error, which is why a PostgREST 300 and an RLS-hidden table both went unnoticed for a day
- `ReceiptUpload` — full OCR flow with review step; accepts `onSuccess` and `startManual` props (`startManual=true` skips image upload and jumps straight to entry)
- `ReceiptList` — lists receipts with item detail, payer assignment, inline edit (store name, date, total) via pencil icon in detail dialog
- `Settlement` — full settlement card with split ratio settings (not on main page)
- `SettlementOversikt` — compact member balance card; "Avslutt" button closes active settlement and prompts to create a new one
- `SettlementSwitcher` — dropdown to switch active settlement. **Written but not mounted anywhere**
- `ConsentModal` — price sharing consent dialog (first login)
- `CategoryReviewButton` — header button with badge, opens Sheet for bulk category fixes
- `SpendingTrend` — 6-month stacked bar chart by category
- `BudgetSettings` — monthly budget config
- `UserMenu` — profile, household settings, dark mode toggle, consent toggle, Prisdatabase link

## Pages
All authenticated pages render inside `AppLayout` (sidebar + mobile drawer + header + upload sheet). Pages open the upload sheet via `useReceiptUpload()` rather than owning the state.
- `/` — dashboard (Index.tsx)
- `/kvitteringer` — ReceiptList full-width + add-receipt CTA (Receipts.tsx)
- `/oppgjor` — SettlementOversikt only; **display-only by design**, see the TODO in Oppgjor.tsx before wiring `Settlement.tsx`
- `/kategorier` — CategorySection CRUD (Categories.tsx)
- `/rapporter` — overview + trend + breakdown (Reports.tsx)
- `/auth` — login/register
- `/install` — PWA install guide
- `/join` — household invite join flow
- `/store-comparison` — shopping list vs. price history comparison
- `/prisdatabase` — anonymous price database stats + product price trend chart

## Known gaps / not yet built
- A receipt with no settlement is visible and counted, but there is **no UI to assign it to one**. The badge in `ReceiptList` is display-only.
- `SettlementSwitcher` is written but **mounted nowhere** — the active settlement can only change via `localStorage.activeSettlementId` or by falling back to the newest active settlement
- `/oppgjor` is display-only; `Settlement.tsx` (split-ratio editor, close flow) is written but mounted nowhere
- ~~16 TypeScript errors from unused `src/components/ui/` files~~ **Resolved 2026-08-19: deleted.** `npm run build` now exits 0. Eight files went (`calendar`, `carousel`, `chart`, `command`, `drawer`, `form`, `input-otp`, `resizable`); nothing imported them, in app code or elsewhere in `ui/`. Re-add any with `npx shadcn@latest add <name>` — `components.json` is configured, and the CLI installs the peer dep too. Note `chart.tsx` was *not* a missing-peer-dep case: it was recharts type drift, so installing packages would never have fixed it. Charts are unaffected — `SpendingTrend` and `PrisDatabase` import `recharts` directly.
- Old receipt images have broken URLs (bucket went private after they were uploaded as public)
- `store_chain` not backfilled on old receipts (only new ones get it via Edge Function)
- No push notifications for over-budget alerts
- Cold start: no price estimates for households with no receipt history
- Password strength not enforced in UI (set in Supabase dashboard)

## Gotchas learned the hard way
- **Squash merges have twice dropped later commits from a PR** (#9 lost the embed fix and broke main; #11 lost a types regen and a migration). After merging, check `git log main..branch` is empty.
- **After any migration**, run `supabase gen types typescript --linked > src/integrations/supabase/types.ts`. A missing column types as `never` and fails at the *insert* call site with a confusing message.
- **Adding a second FK to the same table breaks PostgREST embeds.** `ai_predicted_category_id` made `category:categories(*)` ambiguous (HTTP 300, PGRST201) and broke three queries. Hint the FK: `categories!receipt_items_category_id_fkey(*)`.
- **Debugging "data doesn't show":** query REST with the browser session's JWT (localStorage `sb-<ref>-auth-token`) as `Authorization: Bearer` plus the anon key as `apikey`. The anon key alone returns `[]` for everything under RLS, indistinguishable from no data.
- **supabase-js binds `fetch` at client construction**, so patching `window.fetch` from the console cannot intercept its requests.
- Vite HMR emits spurious Rules-of-Hooks warnings when a hook's call count changes. Check in a **fresh tab** before believing them.

## Running locally
```bash
cp .env.example .env.local   # needs VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev                  # http://localhost:5175 (see .claude/launch.json)
supabase db push             # push migrations to remote
supabase functions deploy parse-receipt
supabase functions deploy submit-price-data
```
