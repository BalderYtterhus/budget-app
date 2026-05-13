# BudgetBandz — Claude Code Context

## What this app is
A Norwegian household budget tracker. Multiple people in a household share expenses, scan grocery receipts with AI (Anthropic), track budgets by category, settle up payments, and compare prices across stores.

## Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/Radix UI
- **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions)
- **AI/OCR**: Anthropic API (`claude-haiku-4-5-20251001`) via Supabase Edge Function
- **State**: React Context + TanStack React Query
- **Charts**: recharts (installed manually, not in shadcn)
- **PWA**: manifest.json, Apple meta tags

## UI language
All user-facing text is **Norwegian Bokmål**.

## Key architecture rules
- `ReceiptParserService` in the Edge Function is the single OCR abstraction point — swap parser by changing one line
- `rawText` from receipts is always stored (training data)
- `normalizedName` on `receipt_items` is the key to price comparison — lowercase, no quantities/weights/store codes. E.g. "Tine Helmelk 1L" → "helmelk"
- All data is scoped by `household_id` with Supabase RLS
- RLS uses helper functions `get_user_household_ids(uid)` and `is_household_member(uid, hid)`
- A DB trigger (`on_auth_user_created`) auto-creates a household + profile for every new user on signup

## Directory structure
```
src/
  components/       # Feature components + shadcn ui/ subfolder
  contexts/         # AuthContext, HouseholdContext, MonthContext, SettlementContext
  hooks/            # useBudgetData.ts, useSettlements.ts, useShoppingList.ts, useStorePrices.ts
  pages/            # Index.tsx (main dashboard), Auth.tsx, JoinHousehold.tsx, StoreComparison.tsx
  types/            # budget.ts — all domain interfaces
  lib/              # format.ts (NOK currency), utils.ts (cn)
  integrations/supabase/  # client.ts, types.ts
supabase/
  functions/parse-receipt/index.ts  # Edge function — Anthropic OCR
  migrations/       # All schema migrations in order
public/
  manifest.json     # PWA manifest
```

## Database tables (current schema)
- `households` — id, name, invite_token, invite_enabled
- `profiles` — user_id, display_name, email
- `household_memberships` — user_id, household_id, role (owner/member)
- `categories` — id, name, color, is_default, household_id (null = default)
- `hidden_default_categories` — household_id, category_id (soft-hide defaults)
- `budgets` — household_id, month, year, total_budget. UNIQUE(month, year, household_id)
- `category_budgets` — budget_id, category_id, amount
- `receipts` — household_id, store_name, total_amount, receipt_date, image_url, raw_ocr_text, created_by_user, paid_by_user, settlement_id, label
- `receipt_items` — receipt_id, raw_text, **normalized_name**, price, quantity, unit_price, category_id, needs_review, included_in_totals, **confidence**
- `item_category_mappings` — household_id, item_pattern, category_id, frequency. UNIQUE(item_pattern, household_id)
- `split_ratios` — household_id, user_id, ratio
- `shopping_list_items` — household_id, name, quantity, category_id, added_by_user, estimated_price
- `settlements` — household_id, name, type, status, created_by
- `settlement_members` — settlement_id, user_id, ratio

## Key hooks (src/hooks/)
- `useCategories`, `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory`
- `useCurrentBudget`, `useSaveBudget`, `useCopyBudgetFromPreviousMonth`
- `useMonthlyReceipts`, `useSpendingSummary`
- `useSaveReceipt` — saves receipt + items + auto-learns mappings
- `useUpdateItemCategory` — updates category + updates mapping table
- `useUpdateReceiptItem`, `useDeleteReceipt`, `useUpdateReceiptPayer`
- `useItemMappings`, `useSplitRatios`, `useSaveSplitRatios`
- `useSettlements`, `useCreateSettlement`, `useCloseSettlement`
- `useShoppingList`, `useAddShoppingListItem`, `useUpdateShoppingListItem`, `useDeleteShoppingListItem`
- `useRemoveMatchedItems` — auto-removes shopping list items when a receipt is uploaded
- `useEstimatePrices` — median price from last 6 months of receipt history
- `useStoreComparison`, `useDetailedStoreComparison` — price comparison across stores

## What has been built (as of May 2026)
- Full receipt OCR flow: upload image → Edge Function → Anthropic → parse → review → save
- AI auto-categorization with learned mappings (frequency-weighted)
- Confidence badges (green ≥85%, yellow ≥60%, red <60%) on receipt review
- Settlement algorithm: two-pointer minimum-transactions, split ratios configurable per member
- Shopping list with fuzzy matching (word overlap ≥60%), price estimation, quantity tracking
- Store price comparison page (by shopping list vs. 90-day receipt history)
- Category review sheet: header badge showing count of `needs_review` items, fix + learn in bulk
- Monthly spending trend chart (stacked bar, last 6 months, recharts)
- Dark mode toggle in UserMenu (next-themes, system default)
- Household management: invite links, regenerate token, member name editing
- PWA: manifest.json, Apple meta tags
- Auth: email/password via Supabase Auth

## Known gaps (not yet built)
- `store_chain` column missing on receipts — "Rema 1000 Majorstua" and "Rema 1000 Grünerløkka" are stored separately; store comparison is fragmented
- `normalized_name` is NULL for all receipts uploaded before May 2026 (no backfill done)
- Price estimation runs entirely client-side (all items fetched to browser, fuzzy-matched in JS) — needs a server-side aggregation view for scale
- No fallback/seed prices for new households (cold start returns no estimates)
- Unit price validation missing — if OCR gets quantity wrong, unit_price is off
- No push notifications for over-budget alerts

## Conventions
- Currency formatted with `formatNOK()` from `src/lib/format.ts`
- Class merging with `cn()` from `src/lib/utils.ts`
- Toast notifications via `useToast()` hook (shadcn)
- Query keys: `["receipts", month, year, settlementId]`, `["budget", month, year, householdId]`, etc.
- Supabase client: `src/integrations/supabase/client.ts`

## Running locally
```bash
cp .env.local # needs VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev   # http://localhost:5173
supabase db push  # push migrations to remote
```
