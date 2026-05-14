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
- `store_chain` on receipts is the normalized chain name — "Rema 1000 Majorstua" → "rema 1000"; `deriveStoreChain()` in `useBudgetData.ts` auto-fills it from `store_name` when OCR doesn't return one
- Currency: `formatNOK()` from `src/lib/format.ts`
- Class merging: `cn()` from `src/lib/utils.ts`
- Toast notifications: `useToast()` from shadcn
- After every migration: run `supabase gen types typescript --linked > src/integrations/supabase/types.ts`

## Directory structure
```
src/
  components/         # Feature components + shadcn ui/ subfolder
  contexts/           # AuthContext, HouseholdContext, MonthContext, SettlementContext
  hooks/              # useBudgetData.ts, useSettlements.ts, useShoppingList.ts, useStorePrices.ts
  pages/              # Index.tsx, Auth.tsx, JoinHousehold.tsx, StoreComparison.tsx, PrisDatabase.tsx, Install.tsx
  types/              # budget.ts — all domain interfaces
  lib/                # format.ts, utils.ts
  integrations/supabase/  # client.ts, types.ts (keep in sync with schema via supabase gen types)
supabase/
  functions/
    parse-receipt/      # OCR via Anthropic
    submit-price-data/  # Server-side consent check + anonymous price insert
  migrations/           # All schema migrations in order
public/
  manifest.json
```

## Database tables (current schema)
- `households` — id, name, invite_token, invite_enabled, **invite_expires_at** (timestamptz)
- `profiles` — user_id, display_name, email, **price_sharing_enabled** (bool, null=unanswered), **avatar_url** (text)
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
- `public_price_data` — store_chain, normalized_name, category_name, price, unit_price, quantity, receipt_date, confidence, country_code, submitted_at, **submitted_by_user_hash** (non-reversible SHA-256 for rate limiting, no user identity)

## Views
- `item_price_stats` (security_invoker=on) — median unit price per household × store_chain × normalized_name, with last_seen and sample_count

## Storage buckets
- `receipts` — **private**; upload path `{household_id}/{uuid}`; store result of `createSignedUrl(path, 31536000)` in `image_url`; never use `getPublicUrl`
- `avatars` — **public**; upload path `{user_id}/avatar.{ext}`; use `getPublicUrl`; 2 MB limit, images only; per-user RLS (only own folder)

## Edge Functions
| Function | Purpose |
|---|---|
| `parse-receipt` | Anthropic vision OCR, returns store_chain + items + categories + confidence |
| `submit-price-data` | Checks price_sharing_enabled server-side (service role), sanitizes rows, rate-limits via submitted_by_user_hash (500 rows/hr), inserts to public_price_data |

## Security model
- Storage bucket `receipts` is **private** — all access requires auth + RLS
- Storage bucket `avatars` is public — images are display-only, not sensitive
- `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are Edge Function secrets only
- `public_price_data` INSERT is service-role only (Edge Function); direct client inserts rejected
- Consent for price sharing checked server-side in Edge Function, not client-side
- Rate limiting via one-way SHA-256 hash of (user_id + SUPABASE_URL) — never links to identity

## Main page layout (Index.tsx)
1. Sticky header — logo, MonthSelector, SettlementSwitcher, CategoryReviewButton, ExportData, BudgetSettings, UserMenu
2. SpendingOverview — 3 cards (totalt brukt, budsjettstatus, gjenstående) + budget warning banner at ≥90%
3. CTA row — "Legg til kvittering" (camera, OCR) + "Manuelt" (pencil, skips to review step) — both open bottom Sheet
4. SettlementOversikt — member avatars, paid/share/balance, settlement transactions, "Avslutt" button
5. Spending trend toggle — collapsed by default, expands SpendingTrend chart
6. Two-column grid — ReceiptList (with search bar) | ShoppingList + CategoryBreakdown
7. ConsentModal — shown once on first login if price_sharing_enabled IS NULL

## Key hooks (src/hooks/)
- `useCategories`, `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory`
- `useCurrentBudget`, `useSaveBudget`, `useCopyBudgetFromPreviousMonth`
- `useMonthlyReceipts`, `useSpendingSummary`
- `useSaveReceipt` — saves receipt + items + auto-learns mappings + calls submit-price-data; `deriveStoreChain()` auto-fills store_chain from store_name if OCR returns null
- `useUpdateItemCategory` — updates category + mapping table
- `useUpdateReceipt` — updates store_name, store_chain, receipt_date, total_amount, label on a receipt
- `useUpdateReceiptItem`, `useDeleteReceipt`, `useUpdateReceiptPayer`
- `useItemMappings`, `useSplitRatios`, `useSaveSplitRatios`
- `useLeaveHousehold`, `useRemoveMember` — member removal auto-rebalances split ratios equally
- `useSettlements`, `useCreateSettlement`, `useCloseSettlement`, `useReopenSettlement`, `useClosedSettlements`
- `useShoppingList`, `useAddShoppingListItem`, `useUpdateShoppingListItem`, `useDeleteShoppingListItem`, `useClearShoppingList`
- `useRemoveMatchedItems` — auto-removes shopping list items when a receipt is uploaded
- `useEstimatePrices` — median price from receipt history
- `useStoreComparison`, `useDetailedStoreComparison` — queries `item_price_stats` view; falls back to `public_price_data` for cold-start households
- `useKnownStores` — distinct store chains from `item_price_stats`; falls back to public_price_data

## Key components
- `ReceiptUpload` — full OCR flow with review step; `startManual=true` skips image upload; accepts `label` field
- `ReceiptList` — search/filter, clickable fullscreen image, inline edit mode (store name, store_chain, date, total, label); "Sett kjede" warning when store_chain is null
- `ReceiptImage` — auto-regenerates signed URLs for old public-bucket receipt images at render time
- `SettlementOversikt` — compact member balance card with real avatars; "Avslutt" closes settlement and prompts to create new
- `SettlementSwitcher` — header dropdown; shows active settlements + closed ones (last 5) with reopen option
- `ConsentModal` — price sharing consent dialog (first login); keeps modal open on DB save failure
- `CategoryReviewButton` — header button with badge, opens Sheet for bulk category fixes
- `CategoryBreakdown` — categories with budget show progress bar; categories without budget show plain spent amount
- `SpendingTrend` — 6-month stacked bar chart by category
- `BudgetSettings` — monthly total + per-category budget config
- `HouseholdInvite` — invite link UI with 7d/14d/30d expiry quick-set and clear
- `ProfileDialog` — avatar upload, display name, email change (sends verification), password change with strength meter
- `UserMenu` — "Min profil" → ProfileDialog, "Husholdningsinnstillinger" → HouseholdSettingsDialog, dark mode toggle, member list with avatars

## Pages
- `/` — main dashboard (Index.tsx)
- `/auth` — login/register
- `/install` — PWA install guide
- `/join` — household invite join flow; dedicated expired-link state with owner contact instructions
- `/store-comparison` — shopping list vs. price history comparison
- `/prisdatabase` — anonymous price database stats + product price trend chart

## Known gaps / not yet built
- No push notifications for over-budget alerts (no service worker, no push subscription table)
- Password strength UI on signup — only HTML minLength=6, no visual meter
- Old receipt `image_url` values in DB are stale public URLs — fixed at display-time by `ReceiptImage` component but DB column still holds broken URLs

## Running locally
```bash
cp .env.example .env.local   # needs VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev                  # http://localhost:5173
supabase db push             # push migrations to remote
supabase gen types typescript --linked > src/integrations/supabase/types.ts  # after schema changes
supabase functions deploy parse-receipt
supabase functions deploy submit-price-data
```
