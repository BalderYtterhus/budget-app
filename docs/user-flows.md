# BudgetBandz — actual user-facing wiring

Traced from the codebase, then **updated 2026-08-06 after the fixes on
`overnight-fixes`** (see [OVERNIGHT_LOG.md](../OVERNIGHT_LOG.md)). This documents **what the
code does**, not what the design intends. Where the two disagree, the code wins and the gap
is noted in [Issues](#issues--status).

## Legend

| Colour | Meaning |
|---|---|
| 🟩 **green** | Works — reachable, has a handler, does what its label says |
| 🟨 **amber** | Works, but only under a condition that is easy to miss (conditional render, empty-state gate, hidden entry point) |
| 🟥 **red** | Broken, misleading, or a dead end — button with no handler, label that lies, page that renders nothing |
| ⬜ **grey** | Built but not reachable from any flow — orphaned component or unlinked route |

Edge labels are the actual trigger: a click handler, a `<Link to>`, a `<Navigate>`, a form
submit, or a redirect.

**No red nodes remain.** The one grey node (`Settlement.tsx`) is a deliberate hold — see
[#8](#-deliberate-no-change).

---

## 1. Navigation structure — routes and nav wiring

Every route in `src/App.tsx`, what actually renders, and how you get there. All seven
authenticated routes now go through the same provider stack.

```mermaid
flowchart TD
    classDef ok fill:#2f6f4e,stroke:#1d4732,color:#fff
    classDef cond fill:#8a6d1f,stroke:#5c4813,color:#fff

    BROWSER(["Browser URL"]) --> ROUTER{"BrowserRouter<br/>App.tsx"}

    ROUTER -->|"/auth"| AUTH["/auth → Auth.tsx<br/><i>no layout</i>"]
    ROUTER -->|"/install"| INSTALL["/install → Install.tsx<br/><i>no layout</i>"]
    ROUTER -->|"/join?token="| JOIN["/join → JoinHousehold.tsx<br/><i>no layout</i>"]
    ROUTER -->|"7 authed routes"| GUARD
    ROUTER -->|"* fallback"| NF["NotFound.tsx<br/>404 — see diagram 5"]

    GUARD["RequireAuth →<br/>HouseholdProvider →<br/>SettlementProvider"]
    GUARD -->|"user == null"| AUTH
    GUARD --> HHGATE{"AppLayout:<br/>household?"}
    HHGATE -->|"null"| NOHH["NoHousehold<br/>create or join"]
    HHGATE -->|"ok"| IDX["/ → Index.tsx"]
    HHGATE -->|"ok"| RCP["/kvitteringer → Receipts.tsx"]
    HHGATE -->|"ok"| OPP["/oppgjor → Oppgjor.tsx"]
    HHGATE -->|"ok"| KAT["/kategorier → Categories.tsx"]
    HHGATE -->|"ok"| RAP["/rapporter → Reports.tsx"]
    GUARD --> SCMP["/store-comparison<br/><i>own chrome + back arrow</i>"]
    GUARD --> PRIS["/prisdatabase<br/><i>own chrome + back arrow</i>"]

    NOHH -->|"Opprett → insert household<br/>+ membership, refetch"| IDX
    NOHH -->|"Bli med → parse token"| JOIN
    NOHH -->|"Logg ut"| AUTH

    class AUTH,INSTALL,JOIN,IDX,RCP,OPP,KAT,RAP,GUARD,SCMP,PRIS,ROUTER,BROWSER,NF,NOHH,HHGATE ok
```

### Sidebar and header — where each control actually goes

```mermaid
flowchart LR
    classDef ok fill:#2f6f4e,stroke:#1d4732,color:#fff

    subgraph SB["AppSidebar"]
        SW["SettlementSwitcher<br/>variant='sidebar'"]
        INV["'+ Inviter medlem'"]
        NAV["Oversikt · Kvitteringer · Oppgjør<br/>Kategorier · Rapporter"]
        FOOT["Profile footer<br/>'Innstillinger'"]
    end

    subgraph HD["AppLayout header"]
        SEARCH["'Søk i kvitteringer…' + ⌘K"]
        MS["MonthSelector"]
        CRB["CategoryReviewButton"]
        EXP["ExportData"]
        BS["BudgetSettings"]
        UM["UserMenu"]
    end

    NAV -->|"Link to= each route"| PAGES["the five shell routes"]
    SW -->|"switch / create / close / reopen"| SWD["settlement state<br/>+ localStorage"]
    INV -->|"opens InviteMemberDialog"| INVD["HouseholdInvite<br/>token, expiry, regenerate"]
    FOOT -->|"opens HouseholdSettingsDialog"| HSD

    SEARCH -->|"Enter → navigate<br/>/kvitteringer?q=…"| RLQ["ReceiptList reads ?q=<br/>seeds its filter"]
    SEARCH -->|"⌘K / Ctrl+K focuses"| SEARCH
    MS -->|"Popover: pick month/year"| MCTX["MonthContext"]
    CRB -->|"Sheet: bulk category fixes"| CRS["CategoryReview sheet"]
    EXP -->|"exportToCSV()"| CSV["CSV download"]
    BS -->|"Dialog: budget + CategorySection"| BSD["Budget dialog"]
    UM -->|"Husholdningsinnstillinger"| HSD["rename · invite · members<br/>consent · leave"]
    UM -->|"Prisdatabase"| PRISP["/prisdatabase"]
    UM -->|"Installer appen"| INSTP["/install"]
    UM -->|"theme toggle"| TH["light / dark"]
    UM -->|"Logg ut"| AUTHP["/auth"]

    class SW,INV,NAV,FOOT,SEARCH,MS,CRB,EXP,BS,UM,PAGES,SWD,INVD,HSD,RLQ,MCTX,CRS,CSV,BSD,PRISP,INSTP,TH,AUTHP ok
```

### Routes outside the sidebar — all now have an entry point

```mermaid
flowchart LR
    classDef ok fill:#2f6f4e,stroke:#1d4732,color:#fff
    classDef cond fill:#8a6d1f,stroke:#5c4813,color:#fff
    classDef orphan fill:#4a4a4a,stroke:#2e2e2e,color:#ddd

    SL["ShoppingList<br/>(dashboard)"] -->|"items.length > 0"| SC["StoreComparison card"]
    SC -->|"'Detaljer' — now on BOTH<br/>the populated and the<br/>no-price-history branch"| SCP["/store-comparison"]
    SCP -->|"'Tilbake til handlelisten'"| HOME["/"]

    UM2["UserMenu"] -->|"Prisdatabase"| PD["/prisdatabase"]
    UM2 -->|"Installer appen<br/><b>permanent entry</b>"| INST["/install"]
    PD -->|"ArrowLeft"| HOME
    INST -->|"'Tilbake'"| HOME

    IP["InstallPrompt<br/><i>opportunistic: beforeinstallprompt<br/>or iOS+Safari, suppressed 7 days<br/>after dismissal — intentional</i>"] -->|"'Se hvordan'"| INST

    SETT["Settlement.tsx<br/>split-ratio editor<br/><b>held, not deleted</b><br/>writes household split_ratios,<br/>must target settlement_members<br/>before mounting — 🔴 #2"]

    class SL,SC,SCP,HOME,UM2,PD,INST ok
    class IP cond
    class SETT orphan
```

---

## 2. Onboarding — auth, household, invite join

```mermaid
flowchart TD
    classDef ok fill:#2f6f4e,stroke:#1d4732,color:#fff

    START(["Visit any protected route"]) --> RA{"RequireAuth<br/>user?"}
    RA -->|"loading"| SPIN["spinner"]
    RA -->|"no"| AUTH["/auth<br/>Tabs: Logg inn | Registrer"]
    RA -->|"yes"| HH{"AppLayout<br/>household?"}

    AUTH -->|"submit login"| SESS["Supabase session"]
    AUTH -->|"submit signup"| MAIL["toast: 'Sjekk e-posten din'"]
    MAIL -.->|"confirmation link"| SESS
    SESS --> PEND{"pending_invite_token<br/>in sessionStorage?"}
    PEND -->|"yes"| JOINP["/join?token=…"]
    PEND -->|"no"| HH

    HH -->|"present<br/>(trigger on_auth_user_created)"| APP["AppLayout + page"]
    HH -->|"null — trigger failed,<br/>or left a household"| NOHH["NoHousehold"]

    NOHH -->|"Opprett husholdning<br/>insert households +<br/>household_memberships"| APP
    NOHH -->|"Bli med: paste link<br/>→ uuid extracted"| JOINP
    NOHH -->|"Logg ut"| AUTH

    APP --> CONSENT{"price_sharing_enabled<br/>IS NULL?"}
    CONSENT -->|"yes"| CHOICE["ConsentModal<br/>'Godta' / 'Nei takk'"]
    CONSENT -->|"no"| DASH["Dashboard usable"]
    CHOICE --> DASH

    INVITE["Invite link {origin}/join?token=…<br/>from HouseholdInvite — reachable via<br/>UserMenu, the sidebar '+ Inviter medlem',<br/>and the /oppgjor empty state"] --> JOINP
    JOINP --> AUTHED{"authenticated?"}
    AUTHED -->|"no"| NEEDAUTH["'Logg inn / Registrer deg'<br/>stores token, → /auth"]
    NEEDAUTH --> AUTH
    AUTHED -->|"yes"| RPC["rpc join_household_via_invite"]
    RPC -->|"success / already_member"| OK["'Velkommen!' → /"]
    RPC -->|"expired"| EXPD["'Lenken har utløpt' → /"]
    RPC -->|"error"| ERR["'Noe gikk galt' → /"]
    OK --> HH
    EXPD --> HH
    ERR --> HH

    class START,RA,AUTH,SESS,MAIL,PEND,JOINP,HH,APP,NOHH,CONSENT,CHOICE,DASH,INVITE,AUTHED,NEEDAUTH,RPC,OK,EXPD,ERR,SPIN ok
```

---

## 3. Receipt: scan → OCR → categorise → save

Unchanged by this round of fixes — it had no dead ends. Reproduced so the map stays whole.

```mermaid
flowchart TD
    classDef ok fill:#2f6f4e,stroke:#1d4732,color:#fff
    classDef cond fill:#8a6d1f,stroke:#5c4813,color:#fff

    subgraph ENTRY["Entry points — / and /kvitteringer"]
        E1["'Legg til kvittering' → openUpload(false)"]
        E2["'Manuelt' → openUpload(true)"]
    end
    E1 --> SHEET["Bottom Sheet → ReceiptUpload<br/>state = 'idle'"]
    E2 --> REVIEW

    SHEET -->|"'Ta bilde' / 'Velg bilde' / drag & drop"| PROC["processImage()<br/>compress to ≤1600px, q0.85"]
    SHEET -->|"'Eller skriv inn manuelt uten bilde'"| REVIEW

    PROC --> UP["Storage upload<br/>receipts/{household_id}/{uuid}"]
    UP --> SIGN["createSignedUrl — 1 year"]
    SIGN --> PARSE["invoke Edge fn 'parse-receipt'<br/>(Anthropic vision)"]

    PARSE -->|"parseError"| WARN1["toast: 'Fyll inn manuelt'"]
    PARSE -->|"totalMismatch"| WARN2["toast: 'Sjekk totalbeløpet'"]
    PARSE -->|"throw"| FAIL["toast + back to 'idle'"]
    WARN1 --> CAT
    WARN2 --> CAT
    PARSE -->|"ok"| CAT

    CAT{"AI returned a categoryId<br/>for this item?"}
    CAT -->|"yes"| SYS["computeSystemConfidence()<br/>+ reconcileConfidence()"]
    CAT -->|"no — abstained"| FUZZ["fuzzy match on mappings, 0.6<br/>ai_predicted_category_id = null"]
    SYS --> REVIEW
    FUZZ --> REVIEW

    REVIEW["state='review'<br/>store · date · total* · betalt av* · etikett<br/>editable rows: name, qty, price, category"]
    REVIEW -->|"'Avbryt' / X"| RESET["reset → 'idle'"]
    REVIEW -->|"'Lagre kvittering'"| SAVE["useSaveReceipt<br/>settlement_id = activeSettlement?.id ?? null"]
    SAVE --> DB["receipts + receipt_items<br/>learn mappings<br/>submit-price-data"]
    DB --> RM["useRemoveMatchedItems"]
    RM --> DONE["'Kvittering lagret!'<br/>Sheet closes"]
    SAVE -->|"throw"| BACK["toast + back to 'review'"]
    DONE --> LISTS["query invalidation →<br/>every list refreshes"]

    class E1,E2,SHEET,PROC,UP,SIGN,PARSE,CAT,SYS,REVIEW,SAVE,DB,RM,DONE,LISTS,RESET,BACK ok
    class WARN1,WARN2,FAIL,FUZZ cond
```

### After save — review, budget, corrections

```mermaid
flowchart LR
    classDef ok fill:#2f6f4e,stroke:#1d4732,color:#fff

    RL["ReceiptList<br/>(dashboard + /kvitteringer)"] -->|"click row"| DLG["Detail Dialog"]
    DLG -->|"pencil"| EDIT["inline edit:<br/>store, date, total, label"]
    DLG -->|"payer select"| PAY["useUpdateReceiptPayer"]
    DLG -->|"<b>oppgjør select</b>"| SET["useUpdateReceiptSettlement<br/>move in / out / 'Ikke i oppgjør'"]
    DLG -->|"image click"| FULL["fullscreen image"]
    DLG -->|"trash → AlertDialog"| DEL["useDeleteReceipt"]
    RL -->|"own search box<br/>(also shown when ?q= is set)"| FILT["filter: store / label"]
    RL -->|"badge 'Ikke i oppgjør'"| DLG

    CRB["CategoryReviewButton"] -->|"Sheet"| CRS["bulk re-categorise<br/>stamps reviewed_at"]
    BS["BudgetSettings dialog"] --> SAVEB["useSaveBudget"]
    BS -->|"'Kopier fra forrige måned'"| COPY["useCopyBudgetFromPreviousMonth"]
    BS --> CS["CategorySection — also at /kategorier"]
    SAVEB --> OV["SpendingOverview"]

    class RL,DLG,EDIT,PAY,SET,FULL,DEL,FILT,CRB,CRS,BS,SAVEB,COPY,CS,OV ok
```

---

## 4. Settlement (oppgjør)

```mermaid
flowchart TD
    classDef ok fill:#2f6f4e,stroke:#1d4732,color:#fff
    classDef orphan fill:#4a4a4a,stroke:#2e2e2e,color:#ddd

    CTX["SettlementProvider<br/>active = localStorage.activeSettlementId<br/>?? settlements[0]; cleared when list empty"]

    CTX --> SWITCH["SettlementSwitcher — mounted in AppSidebar"]
    SWITCH -->|"click a settlement"| SETACT["setActiveSettlement + localStorage"]
    SWITCH -->|"X → AlertDialog"| CLOSE1["useCloseSettlement"]
    SWITCH -->|"closed row ↺"| REOPEN["useReopenSettlement"]
    SWITCH -->|"'Legg til oppgjør'"| CREATE1["useCreateSettlement<br/>all members, equal ratios"]
    CREATE1 --> SETACT

    CTX --> OVER{"SettlementOversikt<br/>members ≥ 2?"}
    OVER -->|"no, on / "| HIDE["card hides itself —<br/>nothing to settle"]
    OVER -->|"no, on /oppgjor<br/>showEmptyState"| EMPTY["'Du er alene i husholdningen'<br/>→ Inviter medlem<br/>→ Gå til kvitteringer"]
    OVER -->|"yes"| CARD["useSettlementBalances:<br/>paid · ratio · balance · transactions"]
    EMPTY -->|"opens InviteMemberDialog"| INVD["invite link"]

    CARD -->|"'Avslutt' → AlertDialog"| CLOSE2["useCloseSettlement"]
    CLOSE2 --> NEWD["'Start nytt oppgjør' / 'Hopp over'"]
    NEWD --> CREATE2["useCreateSettlement"]
    CREATE2 --> CTX

    RECEIPT["New receipt"] -->|"settlement_id = activeSettlement?.id ?? null"| CARD
    ORPH["Receipt with settlement_id = null"] -->|"visible + counted"| CARD
    ORPH -->|"<b>detail dialog → oppgjør picker</b>"| MOVED["useUpdateReceiptSettlement<br/>now splittable"]
    MOVED --> CARD

    SETTC["Settlement.tsx — held<br/>only split-ratio editor in the repo,<br/>but writes the wrong table<br/>see 🔴 #2"]

    class CTX,SWITCH,SETACT,CLOSE1,REOPEN,CREATE1,OVER,CARD,CLOSE2,NEWD,CREATE2,RECEIPT,ORPH,MOVED,EMPTY,HIDE,INVD ok
    class SETTC orphan
```

---

## 5. 404 and recovery states

```mermaid
flowchart TD
    classDef ok fill:#2f6f4e,stroke:#1d4732,color:#fff

    URL(["Unknown URL"]) --> NF{"NotFound<br/>authenticated?"}
    NF -->|"loading"| SP["spinner"]
    NF -->|"no"| BARE["Standalone card, Norwegian<br/>'Siden finnes ikke' + pathname"]
    NF -->|"yes"| SHELL["Inside AppLayout —<br/>sidebar, month picker,<br/>upload sheet all still there"]

    BARE -->|"'Til oversikten'"| HOME["/"]
    BARE -->|"'Logg inn'"| AUTH["/auth"]
    SHELL -->|"'Til oversikten'"| HOME
    SHELL -->|"'Til kvitteringer'"| RCP["/kvitteringer"]
    SHELL -->|"sidebar nav"| ANY["any route"]

    class URL,NF,BARE,SHELL,HOME,AUTH,RCP,ANY,SP ok
```

---

## Issues — status

All 15 from the original mapping, plus one found during the work.

### ✅ Fixed

| # | Issue | Commit |
|---|---|---|
| 1 | `AppSidebar` "+ Inviter medlem" had no `onClick` | `498f8a1` |
| 2 | Sidebar footer labelled "Innstillinger" called `signOut()` | `498f8a1` |
| 3 | Header search input and ⌘K hint were decorative | `f924c16` |
| 4 | `/oppgjor` rendered blank for a household of one | `cc43aaf` |
| 5 | A settlement-less receipt could never be assigned | `1d0b542` |
| 6 | No recovery from a null `household` | `57a71c1` |
| 7 | `NotFound` outside the shell, in English | `0c5e0d9` |
| 9 | `/store-comparison` link missing from the empty branch | `ebc83b4` |
| 10 | `/install` had no permanent entry point | `91daebb` |
| 11 | Routes with no entry point in the UI | `91daebb` |
| 12 | Four product names in user-facing copy | `8b417c8` |
| 13 | `/prisdatabase` missing `HouseholdProvider` | `91daebb` |

### 📋 Deliberate, no change

**#8 `Settlement.tsx` — held, not deleted.** Not superseded: `SettlementSwitcher` and
`SettlementOversikt` cover switch/create/close/reopen, but the **split-ratio editor** exists
only here, and settlements currently get equal ratios with no UI to change them. It is also
not safe to mount as-is and says so in-file at
[Settlement.tsx:58](../src/components/Settlement.tsx#L58) — it reads balances from
`useSettlementBalances` but writes household-level `split_ratios`, which are only the
fallback once `settlement_members` rows exist. Deleting loses the only ratio editor;
mounting reintroduces a fixed bug. Pending 🔴 #2.

**#14 `/store-comparison` and `/prisdatabase` render without `AppLayout`.** They are focused
sub-pages with their own back arrow, not destinations needing a month picker.

**#15 The upload CTA appears only on `/` and `/kvitteringer`.** `useReceiptUpload()` is
available everywhere; the other three routes are views onto data, not places to add it.

### 🔴 New — needs a decision

**Leaving a household, and removing a member, silently do nothing.** Found while building
the #6 recovery screen. `household_memberships` has RLS enabled with only SELECT and INSERT
policies — no DELETE policy — so both operations affect zero rows, return no error, and toast
success. `useLeaveHousehold` also filters its delete on `household_id` alone with no
`user_id` predicate, so a DELETE policy added without a narrow enough `USING` clause would
let that statement remove every member of the household. Needs a permissions decision, a
migration, and a matching `.eq("user_id", …)`. See
[OVERNIGHT_LOG.md](../OVERNIGHT_LOG.md).
