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
- `households` — id, name, invite_token, invite_enabled
- `profiles` — user_id, display_name, email, **price_sharing_enabled** (bool, null=unanswered)
- `household_memberships` — user_id, household_id, role (owner/member)
- `categories` — id, name, color, is_default, household_id (null = default)
- `hidden_default_categories` — household_id, category_id
- `budgets` — household_id, month, year, total_budget
- `category_budgets` — budget_id, category_id, amount
- `receipts` — household_id, store_name, **store_chain**, total_amount, receipt_date, image_url, raw_ocr_text, created_by_user, paid_by_user, settlement_id, label
- `receipt_items` — receipt_id, raw_text, **normalized_name**, price, quantity, unit_price, category_id, needs_review, included_in_totals, **confidence**
- `item_category_mappings` — household_id, item_pattern, category_id, frequency
- `split_ratios` — household_id, user_id, ratio
- `shopping_list_items` — household_id, name, quantity, category_id, added_by_user, estimated_price
- `settlements` — household_id, name, type, status, created_by
- `settlement_members` — settlement_id, user_id, ratio
- `public_price_data` — store_chain, normalized_name, category_name, price, unit_price, quantity, receipt_date, confidence, country_code, submitted_at (**no user/household IDs**)

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
- `useSettlements`, `useCreateSettlement`, `useCloseSettlement`
- `useShoppingList`, `useAddShoppingListItem`, `useUpdateShoppingListItem`, `useDeleteShoppingListItem`
- `useRemoveMatchedItems` — auto-removes shopping list items when a receipt is uploaded
- `useEstimatePrices` — median price from receipt history
- `useStoreComparison`, `useDetailedStoreComparison` — queries `item_price_stats` view (not raw rows)
- `useKnownStores` — distinct store chains from `item_price_stats`

## Key components
- `ReceiptUpload` — full OCR flow with review step; accepts `onSuccess` and `startManual` props (`startManual=true` skips image upload and jumps straight to entry)
- `ReceiptList` — lists receipts with item detail, payer assignment, inline edit (store name, date, total) via pencil icon in detail dialog
- `Settlement` — full settlement card with split ratio settings (not on main page)
- `SettlementOversikt` — compact member balance card; "Avslutt" button closes active settlement and prompts to create a new one
- `SettlementSwitcher` — dropdown to switch active settlement in header
- `ConsentModal` — price sharing consent dialog (first login)
- `CategoryReviewButton` — header button with badge, opens Sheet for bulk category fixes
- `SpendingTrend` — 6-month stacked bar chart by category
- `BudgetSettings` — monthly budget config
- `UserMenu` — profile, household settings, dark mode toggle, consent toggle, Prisdatabase link

## Pages
- `/` — main dashboard (Index.tsx)
- `/auth` — login/register
- `/install` — PWA install guide
- `/join` — household invite join flow
- `/store-comparison` — shopping list vs. price history comparison
- `/prisdatabase` — anonymous price database stats + product price trend chart

## Known gaps / not yet built
- Old receipt images have broken URLs (bucket went private after they were uploaded as public)
- `store_chain` not backfilled on old receipts (only new ones get it via Edge Function)
- No push notifications for over-budget alerts
- Invite token has no expiry date
- Cold start: no price estimates for households with no receipt history
- Password strength not enforced in UI (set in Supabase dashboard)

## Running locally
```bash
cp .env.example .env.local   # needs VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev                  # http://localhost:5173
supabase db push             # push migrations to remote
supabase functions deploy parse-receipt
supabase functions deploy submit-price-data
```
