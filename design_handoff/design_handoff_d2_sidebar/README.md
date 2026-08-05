# Handoff: BudgetBandz · D² Sidebar Direction

## Overview
This handoff documents the **D² · Fintech Sidebar** direction of the BudgetBandz redesign — a light, low-contrast budget app with shared-expense settlement ("oppgjør") as a first-class concept. The package contains the dashboard with the settlement strip, plus five sub-pages reachable from the sidebar nav: Kvitteringer (receipts), Oppgjør (settlement), Kategorier (categories), Rapporter (reports), and a "+ Ny kvittering" scan flow.

## About the Design Files
The files in this bundle are **design references created in HTML/React** — high-fidelity prototypes showing intended look and behavior, not production code to ship directly. The task is to **recreate these designs in the target codebase's existing environment** (whatever framework + styling system the app already uses) using its established patterns. If the codebase is brand-new, React + a utility CSS solution like Tailwind or CSS Modules is a reasonable default; the design uses straightforward flex/grid and is framework-agnostic.

All copy is in Norwegian (Bokmål) and should be kept that way unless the app supports i18n.

## Fidelity
**High-fidelity.** Colors, typography, spacing, border-radius, layout grids, and interactions are all specified. Reproduce pixel-for-pixel within the constraints of the host design system.

---

## Design Tokens

All colors use `oklch()` for consistent perceptual brightness. Substitute equivalent hex if your CSS pipeline doesn't support oklch.

### Surface colors
| Token | Value | Use |
|---|---|---|
| `--bg-page`        | `oklch(98% 0.005 240)`   | Main page background |
| `--bg-surface`     | `oklch(99.5% 0.003 240)` | Cards, panels, sidebar, inputs |
| `--bg-subtle`      | `oklch(96% 0.008 240)`   | Tab tracks, search bg, thumbnails |
| `--bg-active`      | `oklch(95% 0.02 240)`    | Active nav item, hover states |
| `--border`         | `oklch(93% 0.008 240)`   | Default border |
| `--border-strong`  | `oklch(92% 0.008 240)`   | Inputs, slightly more visible |

### Text colors
| Token | Value | Use |
|---|---|---|
| `--text-primary`   | `oklch(20% 0.015 240)` | Body, headings |
| `--text-secondary` | `oklch(40% 0.02 240)`  | Labels, meta |
| `--text-tertiary`  | `oklch(50% 0.015 240)` | Captions, placeholders |
| `--text-muted`     | `oklch(55% 0.015 240)` | Icons in idle state |

### Brand & accent
| Token | Value | Use |
|---|---|---|
| `--brand`          | `oklch(50% 0.08 240)`  | Brand mark, link accents, primary highlights |
| `--accent-soft`    | `oklch(94% 0.025 240)` | Hover/active tints, tag backgrounds |
| `--cta-bg`         | `oklch(22% 0.03 240)`  | Primary button background (near-black w/ blue cast) |
| `--cta-text`       | `white`                | Primary button text |

### Semantic
| Token | Value | Use |
|---|---|---|
| `--positive`       | `oklch(45% 0.1 145)`  | Owed-to-you, savings, "+" deltas |
| `--positive-bg`    | `oklch(92% 0.06 145)` → `oklch(96% 0.025 145)` (linear-gradient 135deg) | Status hero |
| `--negative`       | `oklch(55% 0.12 30)`  | Owed-by-you, overspend, "−" deltas |
| `--warning`        | `oklch(50% 0.1 30)`   | Trend up (spending increasing) |

### Member avatar colors
The 3 members in the Husholdning settlement use distinct hues so they're recognizable at a glance:
| Member | Color |
|---|---|
| Erlend H. (you) | `oklch(60% 0.08 160)` (sage) |
| Mia L.          | `oklch(65% 0.07 30)`  (terracotta) |
| Tobias K.       | `oklch(62% 0.08 250)` (blue) |

### Category palette (sage→teal→blue range, low chroma)
All categories use ~72-76% lightness, 0.05-0.07 chroma — they read as a calm spectrum, not competing accents.
| Category | Color |
|---|---|
| Mat & drikke   | `oklch(72% 0.06 160)` |
| Transport      | `oklch(74% 0.05 200)` |
| Husholdning    | `oklch(74% 0.06 240)` |
| Klær           | `oklch(76% 0.05 270)` |
| Helse          | `oklch(74% 0.07 180)` |
| Underholdning  | `oklch(76% 0.05 220)` |

### Typography
- **Font family**: `Inter` (variable weights 400/500/600/700) for everything. Fallback: `system-ui, sans-serif`.
- **Mono**: `JetBrains Mono` — used only in the scan-flow receipt paper preview.
- **Numbers**: always `font-variant-numeric: tabular-nums` for amounts.
- **Letter-spacing**: `-0.018em` to `-0.02em` for large headings; default elsewhere.

| Role | Size | Weight |
|---|---|---|
| Page title (H1)        | 26px | 600 |
| Card/panel title       | 14px | 600 |
| KPI value              | 22px | 600 |
| Hero amount (status)   | 38px | 500 |
| Body                   | 13px | 400-500 |
| Meta / sub             | 11.5-12px | 400-500 |
| Kicker (uppercase)     | 11px, letter-spacing 0.16em | 600 |
| Sidebar label (uppercase) | 10.5px, letter-spacing 0.15em | 600 |

### Spacing & radius
- **Radius scale**: 7px (small chips), 8px (badges, icons), 9-10px (inputs, buttons), 12px (panels, KPI cards), 16px (status hero, settlement strip).
- **Page padding**: 20px 28px 32px on main content area.
- **Panel padding**: 18px.
- **Card gap**: 12-14px between panels.
- **No drop shadows** anywhere except the receipt-paper preview in the scan flow (`0 4px 24px rgba(0,0,0,0.08)`).

---

## Layout: App Shell

CSS Grid, `grid-template-columns: 232px 1fr`.

### Sidebar (232px wide, full-height)
- 20px 14px padding, flex column, gap 16px.
- **Brand block**: 28×28 brand mark (radius 8, brand color, white "B"), bold name "BudgetBandz".
- **Account selector**: Label "OPPGJØR" → button card with status dot, label "Husholdning", caret. Background `--bg-subtle`, border, radius 9.
- **Member list** (nested under account selector): 22×22 avatar circles, name, balance pill. Members visible at all times so balances are glanceable from anywhere.
- **Invite link**: `+ Inviter medlem` — text link, brand color, small.
- **Nav** (flex column, gap 2px): icon + label + optional badge. Active item has `--bg-active`, primary text. Oppgjør badge uses brand-accent variant (filled, white text) to draw attention; receipt badge uses muted variant.
- **Footer (mt: auto)**: User profile button with avatar, name, "Innstillinger" subtitle.

### Main content area
- 20px 28px 32px padding.
- **Top bar**: page kicker + title (left), search input + page actions (right). Always shows search (`Søk…` with ⌘K kbd).
- Below: page-specific content.

---

## Screens / Views

### 1. Oversikt (Dashboard) — `VariantSidebarSettle` in `variants-settle-rest.jsx`

**Purpose**: At-a-glance overview of household spending + current settlement status.

**Layout** (top to bottom):
1. **Settlement strip** (full width, gradient background `linear-gradient(135deg, oklch(96% 0.025 240), oklch(98% 0.012 240))`, radius 14, padding 16/20):
   - Title row: "OPPGJØR · MAI 2026" kicker + "Du får tilbake **787,00 kr** fra Tobias" + "Gjør opp →" CTA.
   - **Striped bar** showing who paid what — one segment per member, width proportional to amount paid, member color background, white text inside (Name + amount).
   - Marker line at the "fair share" position (33.3% for 3 members) labeled "Hver: 2 613 kr".
2. **KPI strip** (4-column grid, gap 12): Felles brukt, Budsjett, Overføringer, Din andel.
3. **Content grid** (3 columns, gap 12):
   - **Siste delte utgifter** (spans 2 cols): Receipt rows — payer avatar, store + meta, date, amount + "X kr hver".
   - **Per kategori** (1 col): Category rows — color dot, name, amount, percentage.

**Interactions**:
- Settlement strip "Gjør opp" → navigate to Oppgjør page.
- Clicking a receipt row → receipt detail (not designed yet).
- Clicking a category → Kategorier page filtered to that category.

### 2. Kvitteringer — `PageReceipts` in `d2-pages.jsx`

**Purpose**: Browse, filter, and act on all receipts.

**Layout**:
1. **Filter chips row** (border-bottom separator):
   - Left: status chips — Alle (active, dark filled), Delt, Solo, Trenger gjennomgang. Each shows count.
   - Right: text-link dropdowns — month, member, category.
2. **List grouped by date**:
   - **Date header**: Big day number (32px, weight 500, tight letter-spacing) + month name + count, with daily total on the right.
   - **Receipt rows**: Card-style group with internal borders. Grid columns: thumbnail (38px) | store + items + cat | payer avatar + name | split tag pill | amount + per-person | chevron.
   - Split tag colors: "Delt · N pers" uses `--accent-soft` blue; "Solo" uses neutral.

**Page actions** (top right): Filter, Eksporter, + Ny kvittering.

### 3. Oppgjør — `PageOppgjor` in `d2-pages.jsx`

**Purpose**: See full settlement state, take action.

**Layout**: 2-column grid.

**Left column**:
- **Status hero** (green gradient bg, 22/24 padding, radius 16):
  - "DIN STATUS" kicker.
  - 2-column row: large amount on left ("Du får" + "+787,00 kr" at 38px), breakdown table on right (Du har betalt 3 400 / Din andel 2 613 / **Du får tilbake +787**, with a top border on the last row).
  - Actions: "Send påminnelse til Tobias" (primary), "Marker som mottatt" (ghost).
- **Pengeflyt** panel: SVG diagram. Members in a triangle (or polygon for N members). Arrows from each debtor to their creditor(s), with amount labels in rounded pills at the midpoint. Members rendered as 34px circles with name + balance below.

**Right column**:
- **Per medlem**: For each member, avatar + name + total balance, plus two horizontal bars: "Betalt" (member color) vs. "Andel" (neutral gray). Bar widths scale to a common max so comparisons work.
- **Tidligere oppgjør**: History list — green check, month, "Gjort opp Xx · N overføringer", total amount.

### 4. Kategorier — `PageKategorier` in `d2-pages.jsx`

**Purpose**: Drill into spending by category, see budget usage.

**Layout**:
1. **Fordeling panel** at top: Single stacked bar (40px tall, radius 8) showing all categories proportionally. Each segment shows category name + percentage in white.
2. **Card grid** (3 columns, gap 12): Each category gets a card containing:
   - Swatch + name + count, trend % on right (green if down, warning red if up).
   - Big amount (22px) + "av X kr" budget reference.
   - Budget progress bar (6px). If `pct > 100`, fill turns negative red; else stays category color.
   - Footer row: "X % brukt" / "Y kr igjen".
   - Sub-items list (top-bordered): "Dagligvarer · 2 980", etc.
3. Empty category (Underholdning, 0 kr) renders with no sub-items but still shows the budget bar at 0%.

**Page actions**: Sorter ▾, + Ny kategori.

### 5. Rapporter — `PageRapporter` in `d2-pages.jsx`

**Purpose**: Trends and analysis.

**Layout**:
1. **Date range** in top actions: Two text buttons connected by an arrow ("Des 2025 → Mai 2026"), wrapped in a bordered pill.
2. **KPI strip** (4 cols): Snitt per måned, Høyeste måned, Mest brukt, Spart vs. budsjett.
3. **Månedlig forbruk** panel: Stacked bar chart, 6 months on x-axis, 5 category stacks. Tab row to switch between Stablet / Linje / Andel views.
4. **2-column row**:
   - **Kategori over tid**: Small multiples — line chart showing all 5 top categories' trends.
   - **Medlems-bidrag**: For each member, a row with avatar + name + 6-month total, plus an inline mini bar chart (one bar per month).

**Page actions**: Eksporter PDF.

### 6. + Ny kvittering — `PageNyKvittering` in `d2-pages.jsx`

**Purpose**: Add a receipt by scanning or uploading; review OCR'd data; split.

**Layout**: 2-column grid (`380px 1fr`).

**Left column — receipt paper preview**:
- Faux-paper card (off-white `oklch(98% 0.005 90)`, radius 4, soft drop shadow).
- Contents in JetBrains Mono: store name (bold, centered), address, date/time, dashed divider, line items (name | price right-aligned), dashed divider, TOTAL (bold), dashed divider, payment footer.
- Below: 2 secondary action buttons — Skann på nytt, Last opp annet bilde.

**Right column — form**:
1. **Confidence banner** (green tint, check icon): "Lest med 98 % sikkerhet · 13 varer i 2 kategorier".
2. **Field rows** (2-col grids): Butikk + Dato, then Beløp + Hovedkategori.
3. **Hvem betalte?**: 3 segmented options, each showing member avatar + name. Selected one has brand-tinted background and a 1px brand-color inner border.
4. **Del kostnaden**: Section title with split toggle (Likt / Etter andel / Manuelt). List of members below, each with check toggle and computed share.
5. **Varer & underkategorier**: Inline tags showing how items were auto-categorized.

**Page actions**: Avbryt, Lagre kvittering (primary).

---

## Interactions & Behavior

- **Nav clicks**: Each sidebar item navigates to its page. Active state via background + text color, no animation.
- **Settlement strip**: "Gjør opp" links to the Oppgjør page.
- **Date headers in Kvitteringer**: Optionally clickable to collapse/expand that day's receipts.
- **Filter chips**: Single-select for status chips; the dropdowns are multi-select.
- **Split toggle in scan flow**: Switching mode rerenders the member list with updated per-person amounts. "Likt" divides equally; "Etter andel" reads each member's saved share %; "Manuelt" gives each member an editable input.
- **Member toggle in scan flow**: Checking/unchecking a member redistributes the cost among remaining members.
- **Hover states**: All buttons darken by ~5% lightness. Nav items show `--bg-active`. No transitions specified — instant hover is fine.

## State Management

Minimal state shapes for the demo:

```ts
type Member = { id: string; name: string; short: string; color: string; paid: number };
type Balance = { id: string; delta: number };
type Transfer = { from: string; to: string; amt: number };
type Receipt = {
  id: number; store: string; cat: string; amt: number; date: string;  // ISO
  payer: string; split: number; items: number; status: 'split' | 'solo';
};
type Category = {
  name: string; amt: number; budget: number; count: number; trend: number;
  color: string; sub: string[];
};

type AppState = {
  activeAccount: string;            // 'husholdning'
  activeMonth: string;              // '2026-05'
  members: Member[];
  receipts: Receipt[];
  categories: Category[];
  computed: {
    total: number;
    balances: Balance[];
    transfers: Transfer[];          // simplified settlement
  };
};
```

**Simplification algorithm** (used to reduce 6 potential transfers to 2): Standard debt-simplification — sort balances, repeatedly settle the most-creditor with the most-debtor until all balances zero.

## Assets
- No images, no logos beyond the "B" lettermark.
- All icons are inline SVGs (12-16px, 1.7 stroke width, round caps + joins). Reuse the `<SbiIco>` set or lift from Lucide / Heroicons.

## Files in this bundle
- `BudgetBandz Redesigns.html` — entry HTML (uses the design canvas for side-by-side comparison; in your app, render the components directly without the canvas wrapper).
- `variants.jsx` — Contains `VariantSidebar` (the original D dashboard without settlement). Use as reference for the "before" state.
- `variants-settle.jsx` — Contains the `SETTLE` sample data shape and the sage-direction settlement view (B³) — useful for understanding the money-flow algorithm.
- `variants-settle-rest.jsx` — Contains `VariantSidebarSettle` (D² dashboard with settlement strip). **This is the primary dashboard to recreate.**
- `d2-pages.jsx` — Contains the 5 sub-pages plus the shared `D2Shell` sidebar component. **Recreate `D2Shell` as your app shell layout component, then port each page.**

## Implementation notes
1. **Port `D2Shell` first** — it's the sidebar + topbar layout used by every page. Take the sidebar, account selector, member list, nav, and footer as a single shell component.
2. **Settlement logic is real, not faked.** The sample data uses real numbers: 3 members each owe `7840 / 3 = 2613.33`; balances are `paid − share`; transfers solve the balance graph minimally.
3. **No drop shadows.** The whole vibe is light/airy via low-chroma colors and 1px borders. Don't add shadows.
4. **Tabular numbers for money** — apply `font-variant-numeric: tabular-nums` to every amount so they align in columns.
5. **Keep oklch** if your build supports it — substituting hex will introduce subtle color shifts because oklch is perceptually linear.
