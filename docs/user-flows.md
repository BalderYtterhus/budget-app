# BudgetBandz — actual user-facing wiring

Traced from the codebase on 2026-08-06 (branch `main`, HEAD `6b8e17f`). This documents
**what the code does**, not what the design intends. Where the two disagree, the code wins
and the gap is noted in [Issues found](#issues-found).

## Legend

| Colour | Meaning |
|---|---|
| 🟩 **green** | Works — reachable, has a handler, does what its label says |
| 🟨 **amber** | Works, but only under a condition that is easy to miss (conditional render, empty-state gate, hidden entry point) |
| 🟥 **red** | Broken, misleading, or a dead end — button with no handler, label that lies, page that renders nothing |
| ⬜ **grey** | Built but not reachable from any flow — orphaned component or unlinked route |

Edge labels are the actual trigger: a click handler, a `<Link to>`, a `<Navigate>`, a form
submit, or a redirect.

---

## 1. Navigation structure — routes and nav wiring

Every route in `src/App.tsx`, what actually renders, and how you get there.

```mermaid
flowchart TD
    classDef ok fill:#2f6f4e,stroke:#1d4732,color:#fff
    classDef cond fill:#8a6d1f,stroke:#5c4813,color:#fff
    classDef bad fill:#8c2f2f,stroke:#5c1f1f,color:#fff
    classDef orphan fill:#4a4a4a,stroke:#2e2e2e,color:#ddd

    BROWSER(["Browser URL"]) --> ROUTER{"BrowserRouter<br/>App.tsx"}

    ROUTER -->|"/auth"| AUTH["/auth → Auth.tsx<br/><i>no layout</i>"]
    ROUTER -->|"/install"| INSTALL["/install → Install.tsx<br/><i>no layout</i>"]
    ROUTER -->|"/join?token="| JOIN["/join → JoinHousehold.tsx<br/><i>no layout</i>"]
    ROUTER -->|"/"| GUARD
    ROUTER -->|"/kvitteringer"| GUARD
    ROUTER -->|"/oppgjor"| GUARD
    ROUTER -->|"/kategorier"| GUARD
    ROUTER -->|"/rapporter"| GUARD
    ROUTER -->|"/store-comparison"| GUARD
    ROUTER -->|"/prisdatabase"| GUARD2["RequireAuth<br/><i>no HouseholdProvider</i>"]
    ROUTER -->|"* fallback"| NF["NotFound.tsx<br/>404, English copy"]

    GUARD["RequireAuth →<br/>HouseholdProvider →<br/>SettlementProvider"]
    GUARD -->|"user == null"| AUTH
    GUARD --> IDX["/ → Index.tsx<br/>AppLayout 'Oversikt'"]
    GUARD --> RCP["/kvitteringer → Receipts.tsx<br/>AppLayout 'Kvitteringer'"]
    GUARD --> OPP["/oppgjor → Oppgjor.tsx<br/>AppLayout 'Oppgjør'"]
    GUARD --> KAT["/kategorier → Categories.tsx<br/>AppLayout 'Kategorier'"]
    GUARD --> RAP["/rapporter → Reports.tsx<br/>AppLayout 'Rapporter'"]
    GUARD --> SCMP["/store-comparison<br/>StoreComparison.tsx<br/><i>own chrome, no AppLayout</i>"]
    GUARD2 --> PRIS["/prisdatabase → PrisDatabase.tsx<br/><i>own chrome, no AppLayout</i>"]

    NF -->|"'Return to Home' &lt;a href&gt;"| IDX

    class AUTH,INSTALL,JOIN,IDX,RCP,KAT,RAP,GUARD,GUARD2,SCMP,PRIS,ROUTER,BROWSER ok
    class OPP cond
    class NF bad
```

### Sidebar and header — where each control actually goes

`AppSidebar` renders identically on desktop (fixed) and mobile (inside a `Sheet` drawer).

```mermaid
flowchart LR
    classDef ok fill:#2f6f4e,stroke:#1d4732,color:#fff
    classDef cond fill:#8a6d1f,stroke:#5c4813,color:#fff
    classDef bad fill:#8c2f2f,stroke:#5c1f1f,color:#fff
    classDef orphan fill:#4a4a4a,stroke:#2e2e2e,color:#ddd

    subgraph SB["AppSidebar"]
        SW["SettlementSwitcher<br/>variant='sidebar'"]
        INV["'+ Inviter medlem'<br/><b>no onClick</b>"]
        N1["Oversikt"]
        N2["Kvitteringer"]
        N3["Oppgjør"]
        N4["Kategorier"]
        N5["Rapporter"]
        FOOT["Profile footer<br/>label: 'Innstillinger'<br/><b>calls supabase.auth.signOut()</b>"]
    end

    subgraph HD["AppLayout header"]
        SEARCH["'Søk i kvitteringer…' + ⌘K<br/><b>no value / no onChange</b>"]
        MS["MonthSelector"]
        CRB["CategoryReviewButton"]
        EXP["ExportData"]
        BS["BudgetSettings"]
        UM["UserMenu"]
    end

    N1 -->|"Link to='/'"| P1["/"]
    N2 -->|"Link to='/kvitteringer'"| P2["/kvitteringer"]
    N3 -->|"Link to='/oppgjor'"| P3["/oppgjor"]
    N4 -->|"Link to='/kategorier'"| P4["/kategorier"]
    N5 -->|"Link to='/rapporter'"| P5["/rapporter"]
    SW -->|"dropdown: switch / create / close / reopen"| SWD["settlement state<br/>+ localStorage"]
    INV -.->|"nothing happens"| DEAD["∅"]
    FOOT -->|"immediate sign-out, no confirm"| AUTHP["/auth"]

    MS -->|"Popover: pick month/year"| MCTX["MonthContext"]
    CRB -->|"Sheet: bulk category fixes"| CRS["CategoryReview sheet"]
    EXP -->|"Dropdown → exportToCSV()"| CSV["CSV download"]
    BS -->|"Dialog: budget + CategorySection"| BSD["Budget dialog"]
    UM -->|"Husholdningsinnstillinger"| HSD["Household settings dialog<br/>rename, invite, members,<br/>consent, leave"]
    UM -->|"Link to='/prisdatabase'"| PRISP["/prisdatabase"]
    UM -->|"theme toggle"| TH["light / dark"]
    UM -->|"Logg ut"| AUTHP
    SEARCH -.->|"nothing happens"| DEAD

    class SW,N1,N2,N3,N4,N5,P1,P2,P3,P4,P5,SWD,MS,CRB,EXP,BS,UM,MCTX,CRS,CSV,BSD,HSD,PRISP,TH,AUTHP ok
    class INV,SEARCH,FOOT,DEAD bad
```

### Routes with no nav entry

```mermaid
flowchart LR
    classDef ok fill:#2f6f4e,stroke:#1d4732,color:#fff
    classDef cond fill:#8a6d1f,stroke:#5c4813,color:#fff
    classDef orphan fill:#4a4a4a,stroke:#2e2e2e,color:#ddd

    SL["ShoppingList<br/>(dashboard only)"] -->|"items.length > 0"| SC["StoreComparison card"]
    SC -->|"'Detaljer' Link<br/><i>only rendered when<br/>price history exists</i>"| SCP["/store-comparison"]
    SCP -->|"'Tilbake til handlelisten'"| HOME["/"]

    UM2["UserMenu"] -->|"Prisdatabase"| PD["/prisdatabase"]
    PD -->|"ArrowLeft"| HOME

    IP["InstallPrompt<br/><i>App-level, fires only on<br/>beforeinstallprompt or<br/>iOS+Safari, and not<br/>dismissed in last 7 days</i>"] -->|"'Se hvordan'"| INST["/install"]
    INST -->|"'Tilbake'"| HOME

    SETT["Settlement.tsx<br/>split-ratio editor + close flow<br/><b>imported by nothing</b>"]

    class SL,SC,HOME,UM2,PD,INST ok
    class SCP,IP cond
    class SETT orphan
```

---

## 2. Onboarding — auth, household, invite join

```mermaid
flowchart TD
    classDef ok fill:#2f6f4e,stroke:#1d4732,color:#fff
    classDef cond fill:#8a6d1f,stroke:#5c4813,color:#fff
    classDef bad fill:#8c2f2f,stroke:#5c1f1f,color:#fff

    START(["Visit any protected route"]) --> RA{"RequireAuth<br/>user?"}
    RA -->|"loading"| SPIN["spinner"]
    RA -->|"no"| AUTH["/auth<br/>Tabs: Logg inn | Registrer"]
    RA -->|"yes"| APP["AppLayout + page"]

    AUTH -->|"submit login<br/>signIn()"| SESS["Supabase session"]
    AUTH -->|"submit signup<br/>signUp()"| MAIL["toast: 'Sjekk e-posten din'<br/>email confirmation"]
    MAIL -.->|"user clicks link in email"| SESS
    SESS --> PEND{"sessionStorage<br/>pending_invite_token?"}
    PEND -->|"yes"| JOINT["/join?token=…"]
    PEND -->|"no"| HOME["Navigate to '/'"]

    HOME --> TRIG["DB trigger on_auth_user_created<br/>created household + profile<br/><i>no in-app create-household UI</i>"]
    TRIG --> APP
    APP --> CONSENT{"ConsentModal<br/>price_sharing_enabled IS NULL?"}
    CONSENT -->|"yes — not dismissible"| CHOICE["'Godta' / 'Nei takk'<br/>→ profiles.price_sharing_enabled"]
    CONSENT -->|"no"| DASH["Dashboard usable"]
    CHOICE --> DASH

    INVITE["Invite link<br/>{origin}/join?token=…<br/>from HouseholdInvite in<br/>UserMenu → Husholdningsinnstillinger"] --> JOINP["/join"]
    JOINP --> AUTHED{"authenticated?"}
    AUTHED -->|"no"| NEEDAUTH["status: need_auth<br/>'Logg inn / Registrer deg'"]
    NEEDAUTH -->|"stores token in sessionStorage<br/>navigate('/auth')"| AUTH
    AUTHED -->|"yes"| RPC["rpc join_household_via_invite"]
    RPC -->|"success"| OK["'Velkommen!' →<br/>window.location.href = '/'"]
    RPC -->|"already_member"| OK
    RPC -->|"expired"| EXP["'Lenken har utløpt'<br/>→ navigate('/')"]
    RPC -->|"error / no token"| ERR["'Noe gikk galt'<br/>→ navigate('/')"]
    OK --> APP
    EXP --> APP
    ERR --> APP

    JOINT --> RPC

    NOHH["User with no<br/>household_memberships row<br/>(trigger failed / left household)"] --> BROKEN["household = null.<br/>App still renders 'Husholdning'.<br/>No recovery UI; receipt upload<br/>hits household!.id and throws."]

    class START,RA,AUTH,SESS,MAIL,PEND,JOINT,HOME,TRIG,APP,CONSENT,CHOICE,DASH,INVITE,JOINP,AUTHED,NEEDAUTH,RPC,OK,EXP,ERR,SPIN ok
    class NOHH cond
    class BROKEN bad
```

---

## 3. Receipt: scan → OCR → categorise → save

The upload `Sheet` lives in `AppLayout` and is opened through the `useReceiptUpload()`
context, so only the two pages that render a CTA can start the flow.

```mermaid
flowchart TD
    classDef ok fill:#2f6f4e,stroke:#1d4732,color:#fff
    classDef cond fill:#8a6d1f,stroke:#5c4813,color:#fff
    classDef bad fill:#8c2f2f,stroke:#5c1f1f,color:#fff

    subgraph ENTRY["Entry points (only these two pages)"]
        E1["/ — 'Legg til kvittering' / 'Manuelt'"]
        E2["/kvitteringer — same two buttons"]
    end
    E1 -->|"openUpload(false)"| SHEET
    E1 -->|"openUpload(true)"| SHEETM
    E2 -->|"openUpload(false)"| SHEET
    E2 -->|"openUpload(true)"| SHEETM

    SHEET["Bottom Sheet → ReceiptUpload<br/>state = 'idle'"]
    SHEETM["Bottom Sheet → ReceiptUpload<br/>startManual → state = 'review'"]

    SHEET -->|"'Ta bilde' (capture=environment)"| PROC
    SHEET -->|"'Velg bilde' (gallery)"| PROC
    SHEET -->|"drag & drop image"| PROC
    SHEET -->|"'Eller skriv inn manuelt uten bilde'"| REVIEW

    PROC["processImage()<br/>compress to ≤1600px, q0.85"]
    PROC --> UP["state='uploading'<br/>Storage upload<br/>receipts/{household_id}/{uuid}"]
    UP --> SIGN["createSignedUrl — 1 year"]
    SIGN --> PARSE["state='parsing'<br/>invoke Edge fn 'parse-receipt'<br/>(Anthropic vision)"]

    PARSE -->|"ocrData.parseError"| WARN1["destructive toast:<br/>'Fyll inn manuelt'"]
    PARSE -->|"ocrData.totalMismatch"| WARN2["toast: 'Sjekk totalbeløpet'"]
    PARSE -->|"throw"| FAIL["toast + state='idle'"]
    WARN1 --> CAT
    WARN2 --> CAT
    PARSE -->|"ok"| CAT

    CAT{"per item: AI returned<br/>a categoryId?"}
    CAT -->|"yes"| SYS["computeSystemConfidence()<br/>+ reconcileConfidence()<br/>→ verdict, needsReview"]
    CAT -->|"no — AI abstained"| FUZZ["findCategoryForItem()<br/>fuzzy match on item_category_mappings<br/>threshold 0.6<br/>ai_predicted_category_id = null"]
    SYS --> REVIEW
    FUZZ --> REVIEW

    REVIEW["state='review'<br/>store · date · total* · betalt av* · etikett<br/>editable item rows: name, qty, price, category<br/>confidence % chip · 'ai_overconfident' warning<br/>+ Legg til vare / 🗑 remove"]

    REVIEW -->|"change a category"| MARK["userReviewed = true<br/>needsReview = false"]
    MARK --> REVIEW
    REVIEW -->|"'Avbryt' or X"| RESET["reset() → state='idle'"]
    REVIEW -->|"'Lagre kvittering'<br/><i>disabled unless total>0 and payer set</i>"| SAVE

    SAVE["state='saving'<br/>useSaveReceipt.mutateAsync<br/>settlement_id = activeSettlement?.id ?? null"]
    SAVE --> DB["receipts + receipt_items<br/>auto-learn item_category_mappings<br/>invoke 'submit-price-data' (consent checked server-side)"]
    DB --> RM["useRemoveMatchedItems<br/>strikes matching shopping-list items<br/><i>failure logged, does not block</i>"]
    RM --> DONE["state='success' + toast<br/>onSuccess() closes Sheet after 1.5s<br/>internal reset after 2s"]
    SAVE -->|"throw"| BACK["toast + back to state='review'"]

    DONE --> LISTS["React Query invalidation →<br/>ReceiptList · SpendingOverview ·<br/>CategoryBreakdown · SpendingTrend ·<br/>SettlementOversikt all refresh"]

    class E1,E2,SHEET,SHEETM,PROC,UP,SIGN,PARSE,CAT,SYS,REVIEW,MARK,SAVE,DB,RM,DONE,LISTS,RESET,BACK ok
    class WARN1,WARN2,FAIL,FUZZ cond
```

### After save — review, budget, corrections

```mermaid
flowchart LR
    classDef ok fill:#2f6f4e,stroke:#1d4732,color:#fff
    classDef cond fill:#8a6d1f,stroke:#5c4813,color:#fff
    classDef bad fill:#8c2f2f,stroke:#5c1f1f,color:#fff

    RL["ReceiptList<br/>(dashboard + /kvitteringer)"] -->|"click row"| DLG["Detail Dialog<br/>items, payer, image"]
    DLG -->|"pencil"| EDIT["inline edit:<br/>store, date, total, label"]
    DLG -->|"image click"| FULL["fullscreen image"]
    DLG -->|"trash → AlertDialog"| DEL["useDeleteReceipt"]
    DLG -->|"payer select"| PAY["useUpdateReceiptPayer"]
    RL -->|"search box"| FILT["client-side filter<br/>store / label"]

    RL --> BADGE["Settlement badge:<br/>'Ikke i oppgjør' / other settlement name"]
    BADGE -.->|"display only — no way to assign"| NOASSIGN["∅"]

    CRB["CategoryReviewButton<br/>header, badge = needs_review count"] -->|"Sheet"| CRS["bulk re-categorise<br/>→ useUpdateItemCategory<br/>stamps reviewed_at"]

    BS["BudgetSettings dialog"] -->|"per-category amounts + total"| SAVEB["useSaveBudget"]
    BS -->|"'Kopier fra forrige måned'"| COPY["useCopyBudgetFromPreviousMonth"]
    BS --> CS["CategorySection (CRUD)<br/><i>also at /kategorier</i>"]
    SAVEB --> OV["SpendingOverview:<br/>brukt · budsjettstatus · gjenstående"]

    class RL,DLG,EDIT,FULL,DEL,PAY,FILT,CRB,CRS,BS,SAVEB,COPY,CS,OV ok
    class BADGE cond
    class NOASSIGN bad
```

---

## 4. Settlement (oppgjør)

```mermaid
flowchart TD
    classDef ok fill:#2f6f4e,stroke:#1d4732,color:#fff
    classDef cond fill:#8a6d1f,stroke:#5c4813,color:#fff
    classDef bad fill:#8c2f2f,stroke:#5c1f1f,color:#fff
    classDef orphan fill:#4a4a4a,stroke:#2e2e2e,color:#ddd

    CTX["SettlementProvider<br/>active = localStorage.activeSettlementId<br/>?? settlements[0]; cleared when list empty"]

    CTX --> SWITCH["SettlementSwitcher (sidebar)<br/><b>now mounted in AppSidebar</b>"]
    SWITCH -->|"click a settlement"| SETACT["setActiveSettlement + localStorage"]
    SWITCH -->|"X on a row → AlertDialog"| CLOSE1["useCloseSettlement"]
    SWITCH -->|"closed settlement row ↺"| REOPEN["useReopenSettlement"]
    SWITCH -->|"'Legg til oppgjør' → Dialog"| CREATE1["useCreateSettlement<br/>all household members, equal ratios"]
    CREATE1 --> SETACT

    CTX --> OVER["SettlementOversikt<br/>on / and /oppgjor"]
    OVER -->|"members.length < 2"| NULLR["returns null →<br/>/oppgjor renders an empty page"]
    OVER -->|"members ≥ 2"| CARD["useSettlementBalances:<br/>paid · ratio · balance · transactions<br/>warns on unassigned payers<br/>and on no active settlement"]
    CARD -->|"'Avslutt' → AlertDialog"| CLOSE2["useCloseSettlement"]
    CLOSE2 --> NEWD["Dialog 'Start nytt oppgjør'<br/>(name prefilled) or 'Hopp over'"]
    NEWD --> CREATE2["useCreateSettlement"]
    CREATE2 --> CTX

    SETTC["Settlement.tsx<br/>split-ratio editor, useSaveSplitRatios,<br/>its own close flow<br/><b>rendered nowhere</b>"]

    RECEIPT["New receipt"] -->|"settlement_id = activeSettlement?.id ?? null"| CARD
    ORPH["Receipt saved with no active settlement"] -->|"visible + counted in month totals"| CARD
    ORPH -.->|"cannot be assigned to a settlement later"| NOFIX["∅"]

    class CTX,SWITCH,SETACT,CLOSE1,REOPEN,CREATE1,OVER,CARD,CLOSE2,NEWD,CREATE2,RECEIPT ok
    class ORPH cond
    class NULLR,NOFIX bad
    class SETTC orphan
```

---

## Issues found

Nothing below has been changed — this is a list, not a patch.

### Broken / misleading controls

1. **`AppSidebar` "+ Inviter medlem" has no `onClick`** — [AppSidebar.tsx:114](../src/components/AppSidebar.tsx#L114). Renders as a brand-coloured button under the member list and does nothing. The working invite UI is buried in UserMenu → Husholdningsinnstillinger → HouseholdInvite.
2. **Sidebar profile footer is labelled "Innstillinger" but signs you out** — [AppSidebar.tsx:152-167](../src/components/AppSidebar.tsx#L152). `onClick={() => supabase.auth.signOut()}`, no confirmation, no settings dialog. The most destructive control in the sidebar is the one whose label promises the least.
3. **Header search input is decorative** — [AppLayout.tsx:119-123](../src/components/AppLayout.tsx#L119). No `value`, no `onChange`, and the ⌘K hint has no key handler anywhere. A real search does exist, but it's the separate box inside `ReceiptList`.

### Dead ends

4. **`/oppgjor` renders an empty page for households with fewer than 2 members** — `SettlementOversikt` returns `null` at [SettlementOversikt.tsx:72](../src/components/SettlementOversikt.tsx#L72) and the page has no other content ([Oppgjor.tsx](../src/pages/Oppgjor.tsx)). You get a header and nothing else, with no explanation.
5. **A receipt with no settlement can never be assigned to one.** `ReceiptList` badges it "Ikke i oppgjør" ([ReceiptList.tsx:57-60](../src/components/ReceiptList.tsx#L57)) and the detail dialog offers store/date/total/label/payer edits but no settlement picker.
6. **No recovery if `household` is null.** `HouseholdProvider` sets it to null on a missing membership ([HouseholdContext.tsx:57-62](../src/contexts/HouseholdContext.tsx#L57)), the layout falls back to the string "Husholdning", and there is no create-or-join UI anywhere — household creation only happens via the `on_auth_user_created` DB trigger. `ReceiptUpload` then does `household!.id` at [ReceiptUpload.tsx:169](../src/components/ReceiptUpload.tsx#L169) and throws. Also reachable via "Forlat husholdning" in household settings.
7. **`NotFound` is outside the app shell and in English** — [NotFound.tsx](../src/pages/NotFound.tsx). "Oops! Page not found" / "Return to Home" in an otherwise Bokmål-only UI, no sidebar, and a plain `<a href="/">` that does a full page reload.

### Orphans and hard-to-reach entry points

8. **`Settlement.tsx` is imported by nothing** (confirmed by grep). 326 lines holding the split-ratio editor and its own close flow. The `TODO` in [Oppgjor.tsx](../src/pages/Oppgjor.tsx) explains why it's parked — it needs a decision, not a fix.
9. **`/store-comparison` has one conditional entry point.** The "Detaljer" link lives in the `StoreComparison` card ([StoreComparison.tsx:65](../src/components/StoreComparison.tsx#L65)), which only renders on the dashboard, only when the shopping list is non-empty, and only when `comparison.stores.length > 0` — the no-price-history branch returns early without the link. No sidebar entry.
10. **`/install` is reachable only through `InstallPrompt`**, which requires `beforeinstallprompt` (or iOS+Safari) and no dismissal in the last 7 days. Once dismissed, the route is only reachable by typing the URL.
11. **`/prisdatabase` and `/store-comparison` are not in `navItems`** — the sidebar lists five routes; these two are reachable only from UserMenu and the shopping list respectively.
12. **`InstallPrompt` says "Installer Food Buddy"** — [InstallPrompt.tsx:86](../src/components/InstallPrompt.tsx#L86). The app is BudgetBandz everywhere else; `Install.tsx` calls it "Budget App"; `Auth.tsx` calls it "Matbudsjett". Four names.

### Structural notes (not bugs, but they shape the map)

13. **`/prisdatabase` is the only authenticated route with no `HouseholdProvider`/`SettlementProvider`** ([App.tsx:91-98](../src/App.tsx#L91)). Fine today — the page queries `public_price_data` only — but any component added there that calls `useHousehold()` will throw.
14. **`/store-comparison` and `/prisdatabase` don't use `AppLayout`**, so they have no sidebar, no month selector, and no upload sheet — only a back arrow to `/`.
15. **The receipt-upload flow has exactly two entry points**, `/` and `/kvitteringer`. `/kategorier`, `/rapporter` and `/oppgjor` render no CTA even though `useReceiptUpload()` is available to them.

### CLAUDE.md is out of date on three points

- The known `/kvitteringer → <Index />` issue is **fixed** — `App.tsx` now maps each of the five sidebar routes to its own page component.
- `SettlementSwitcher` is described as "written but mounted nowhere"; it **is** mounted, in `AppSidebar` at [AppSidebar.tsx:81](../src/components/AppSidebar.tsx#L81), and it also handles create/close/reopen.
- `Settlement.tsx` mounted nowhere and the "no UI to assign a receipt to a settlement" gap are both still accurate.
