# BudgetBandz

Norsk husholdningsbudsjett-app. Skann dagligvarekvitteringer med AI, spor forbruk per kategori, sammenlign priser mellom butikker og gjør opp utgifter mellom husholdningsmedlemmer.

## Stack

| Lag | Teknologi |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/Radix UI |
| Backend | Supabase (Postgres + RLS + Auth + Storage + Edge Functions) |
| AI/OCR | Anthropic API (`claude-sonnet-4-6`) |
| State | React Context + TanStack React Query |
| Charts | recharts |
| PWA | manifest.json + Apple meta-tags |

## Funksjoner

- **Kvitteringsskanning** — last opp bilde → AI ekstraherer butikk, dato, varer og priser automatisk
- **Manuell registrering** — skriv inn kvittering uten bilde direkte fra forsiden
- **Rediger kvittering** — endre butikknavn, dato og beløp etter lagring
- **Automatisk kategorisering** — AI kategoriserer varer og lærer av korrigeringer over tid
- **Budsjett** — sett månedlig totalbudsjett og per-kategori budsjett
- **Oppgjør** — to-pointer minimum-transaksjoner-algoritme beregner hvem som skylder hvem; avslutt og start nytt oppgjør fra forsiden
- **Handlelistematching** — handleliste-varer fjernes automatisk når kvitteringen lagres (fuzzy match ≥60%)
- **Prissammenligning** — sammenlign estimert totalpris for handlelisten på tvers av butikkjeder
- **Prisdatabase** — anonym prisdeling på tvers av brukere for pristrend-analyse
- **Mørkt modus** — system/lyst/mørkt via next-themes

## Kjør lokalt

```bash
cp .env.example .env.local   # legg inn VITE_SUPABASE_URL og VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev                  # http://localhost:5173
supabase db push             # push migrasjoner til remote
```

## Miljøvariabler

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Edge Functions henter `ANTHROPIC_API_KEY` og `SUPABASE_SERVICE_ROLE_KEY` fra Supabase-prosjektets hemmeligheter — disse settes aldri i frontend.

## Databaseskjema (nøkkeltabeller)

```
households              — husholdning med invitasjonstoken
profiles                — visningsnavn, e-post, price_sharing_enabled
household_memberships   — bruker ↔ husholdning, rolle (owner/member)
categories              — standard + husholdningsspesifikke kategorier
receipts                — butikk, kjede, beløp, dato, bilde-URL, settlement
receipt_items           — varetekst, normalized_name, pris, enhetspris, kategori, confidence
item_category_mappings  — lærte varemønstre → kategori (frekvensvektet)
budgets + category_budgets — månedlig budsjett
settlements             — oppgjørsperiode med status
settlement_members      — hvem er med i oppgjøret, med splittforhold
shopping_list_items     — handleliste med estimert pris
public_price_data       — anonym prisdatabase (ingen bruker/husholdnings-ID)
```

### Nyttige views

- `item_price_stats` — median enhetspris per husholdning × butikkjede × normalisert produktnavn

## Edge Functions

| Funksjon | Beskrivelse |
|---|---|
| `parse-receipt` | OCR via Anthropic, ekstraherer butikkjede + varer + priser + kategorier |
| `submit-price-data` | Sjekker samtykke server-side og skriver til anonym prisdatabase |

## Sikkerhetsmodell

- All data er RLS-scopet til `household_id` via `get_user_household_ids()` og `is_household_member()`
- Storage-bucket (`receipts`) er privat — bilder krever autentisering + husholdningsmedlemskap
- Nye kvitteringsbilder lagres som `{household_id}/{uuid}` med 1-års signert URL
- `ANTHROPIC_API_KEY` og `SUPABASE_SERVICE_ROLE_KEY` er kun tilgjengelig i Edge Functions
- Anonym prisdeling: samtykke sjekkes server-side av Edge Function, ikke klient

## Kjente mangler

- Gamle kvitteringsbilder (før privat bucket) har ødelagte URL-er
- `store_chain` er ikke backfilt på gamle kvitteringer
- Ingen push-varsler for overbudsjett
- Invitasjonstoken har ingen utløpsdato
- Kald start: ingen prisestimater for nye husholdninger uten kvitteringshistorikk
- Passordstyrke håndheves ikke i UI (settes i Supabase-dashbord)
