// Four redesigns of the BudgetBandz dashboard.
// All variants share the same content shape; only visual treatment differs.

// --- shared sample data (populated state to show how each variant breathes) ---
const SAMPLE = {
  month: 'Mai 2026',
  spent: 7840,
  budget: 12000,
  remaining: 4160,
  pct: 0.653,
  receipts: [
    { id: 1, store: 'Rema 1000', cat: 'Mat & drikke', amt: 487.50, date: '14. mai', color: '#7a9b7a' },
    { id: 2, store: 'Vinmonopolet', cat: 'Mat & drikke', amt: 329.00, date: '12. mai', color: '#7a9b7a' },
    { id: 3, store: 'Apotek 1',     cat: 'Helse',       amt: 218.40, date: '11. mai', color: '#b8967a' },
    { id: 4, store: 'Circle K',     cat: 'Transport',   amt: 642.00, date: '09. mai', color: '#9b937a' },
    { id: 5, store: 'Kiwi',         cat: 'Mat & drikke', amt: 412.80, date: '07. mai', color: '#7a9b7a' },
    { id: 6, store: 'H&M',          cat: 'Klær',        amt: 599.00, date: '04. mai', color: '#a87a9b' },
  ],
  shopping: [
    { id: 1, name: 'Melk', cat: 'Mat & drikke', done: false },
    { id: 2, name: 'Brød',    cat: 'Mat & drikke', done: true },
    { id: 3, name: 'Tannkrem', cat: 'Helse',     done: false },
    { id: 4, name: 'Kaffe',   cat: 'Mat & drikke', done: false },
  ],
  categories: [
    { name: 'Mat & drikke',  amt: 3420, pct: 44, color: '#7a9b7a' },
    { name: 'Transport',     amt: 1680, pct: 21, color: '#9b937a' },
    { name: 'Husholdning',   amt: 1240, pct: 16, color: '#7a8d9b' },
    { name: 'Klær',          amt:  860, pct: 11, color: '#a87a9b' },
    { name: 'Helse',         amt:  640, pct:  8, color: '#b8967a' },
  ],
  trend: [5200, 6100, 7300, 6800, 8200, 7840],
};

const fmt = (n) => n.toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kr';
const fmtShort = (n) => n.toLocaleString('nb-NO') + ' kr';

// ============================================================================
// VARIANT A — Warm Linen
// Soft cream bg, warm clay accent, friendly + calming
// ============================================================================
function VariantWarm() {
  const s = warmStyles;
  return (
    <div style={s.root}>
      {/* Topbar */}
      <div style={s.topbar}>
        <div style={s.brand}>
          <div style={s.brandMark}>B</div>
          <div>
            <div style={s.brandName}>BudgetBandz</div>
            <div style={s.brandSub}>Husholdning · Mai 2026</div>
          </div>
        </div>
        <div style={s.topActions}>
          <div style={s.monthPicker}>
            <button style={s.monthArrow}>‹</button>
            <span style={s.monthLabel}>Mai 2026</span>
            <button style={s.monthArrow}>›</button>
          </div>
          <button style={s.btnGhost}>Eksporter</button>
          <button style={s.btnPrimary}>+ Budsjett</button>
          <div style={s.avatar}>EH</div>
        </div>
      </div>

      {/* Hero row */}
      <div style={s.heroRow}>
        <div style={{...s.card, ...s.heroCard}}>
          <div style={s.cardLabel}>Brukt denne måneden</div>
          <div style={s.heroNum}>{fmtShort(SAMPLE.spent)}</div>
          <div style={s.heroMeta}>
            <span style={s.pill}>↓ 4,3 % vs. forrige</span>
            <span style={s.metaText}>av {fmtShort(SAMPLE.budget)} budsjett</span>
          </div>
          <div style={s.progressTrack}>
            <div style={{...s.progressFill, width: `${SAMPLE.pct * 100}%`}} />
          </div>
          <div style={s.progressFoot}>
            <span>65 % brukt</span>
            <span>{fmtShort(SAMPLE.remaining)} igjen · 17 dager</span>
          </div>
        </div>

        <div style={s.miniCol}>
          <div style={s.card}>
            <div style={s.cardLabel}>Daglig snitt</div>
            <div style={s.miniNum}>561 kr</div>
            <div style={s.miniMeta}>Mål: 400 kr/dag</div>
          </div>
          <div style={s.card}>
            <div style={s.cardLabel}>Kvitteringer</div>
            <div style={s.miniNum}>23</div>
            <div style={s.miniMeta}>6 nye denne uken</div>
          </div>
        </div>
      </div>

      {/* Add receipt CTA */}
      <div style={s.ctaRow}>
        <div style={s.ctaPrimary}>
          <div style={s.ctaIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="6" width="18" height="14" rx="2" />
              <circle cx="12" cy="13" r="3.5" />
              <path d="M9 6l1.5-2h3L15 6" />
            </svg>
          </div>
          <div>
            <div style={s.ctaTitle}>Legg til kvittering</div>
            <div style={s.ctaSub}>Skann eller last opp bilde — vi fyller ut resten</div>
          </div>
          <div style={{flex: 1}} />
          <button style={s.btnPrimary}>Skann</button>
        </div>
        <button style={s.ctaSecondary}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 20l4-1 10-10-3-3L5 16zM14 6l3 3"/></svg>
          Manuelt
        </button>
      </div>

      {/* Main grid */}
      <div style={s.mainGrid}>
        {/* Receipts */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <div>
              <div style={s.cardTitle}>Siste kvitteringer</div>
              <div style={s.cardSub}>6 av 23 i mai</div>
            </div>
            <button style={s.linkBtn}>Se alle →</button>
          </div>
          <div style={s.receiptList}>
            {SAMPLE.receipts.map(r => (
              <div key={r.id} style={s.receiptRow}>
                <div style={{...s.dot, background: r.color}} />
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={s.rStore}>{r.store}</div>
                  <div style={s.rCat}>{r.cat} · {r.date}</div>
                </div>
                <div style={s.rAmt}>{fmt(r.amt)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Shopping list */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <div>
              <div style={s.cardTitle}>Handleliste</div>
              <div style={s.cardSub}>{SAMPLE.shopping.filter(x => !x.done).length} igjen</div>
            </div>
          </div>
          <div style={s.shopAdd}>
            <input style={s.shopInput} placeholder="Legg til vare…" />
            <select style={s.shopSelect}><option>Kategori</option></select>
            <button style={s.shopAddBtn}>+</button>
          </div>
          <div style={s.shopList}>
            {SAMPLE.shopping.map(item => (
              <div key={item.id} style={s.shopRow}>
                <div style={{...s.checkbox, ...(item.done ? s.checkboxOn : {})}}>
                  {item.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><path d="M5 12l5 5 9-11"/></svg>}
                </div>
                <span style={{...s.shopName, ...(item.done ? s.shopNameDone : {})}}>{item.name}</span>
                <span style={s.shopCat}>{item.cat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div style={{...s.card, gridColumn: '1 / -1'}}>
          <div style={s.cardHead}>
            <div>
              <div style={s.cardTitle}>Forbruk per kategori</div>
              <div style={s.cardSub}>Mai 2026</div>
            </div>
            <div style={s.tabRow}>
              <button style={{...s.tab, ...s.tabOn}}>Denne mnd</button>
              <button style={s.tab}>3 mnd</button>
              <button style={s.tab}>År</button>
            </div>
          </div>
          <div style={s.catGrid}>
            {SAMPLE.categories.map(c => (
              <div key={c.name} style={s.catItem}>
                <div style={s.catTop}>
                  <span style={s.catName}>{c.name}</span>
                  <span style={s.catAmt}>{fmtShort(c.amt)}</span>
                </div>
                <div style={s.catTrack}>
                  <div style={{...s.catFill, width: `${c.pct}%`, background: c.color}} />
                </div>
                <div style={s.catPct}>{c.pct} %</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const warmStyles = {
  root: {
    fontFamily: 'Inter, system-ui, sans-serif',
    background: 'oklch(97.5% 0.012 75)',
    color: 'oklch(22% 0.015 60)',
    padding: '28px 32px 40px',
    minHeight: '100%',
    fontSize: 14,
  },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  brand: { display: 'flex', alignItems: 'center', gap: 14 },
  brandMark: {
    width: 44, height: 44, borderRadius: 12,
    background: 'oklch(58% 0.09 50)',
    color: 'oklch(98% 0.01 80)',
    display: 'grid', placeItems: 'center',
    fontWeight: 600, fontSize: 20, letterSpacing: '-0.02em',
  },
  brandName: { fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em' },
  brandSub: { fontSize: 12.5, color: 'oklch(50% 0.01 60)', marginTop: 1 },
  topActions: { display: 'flex', alignItems: 'center', gap: 10 },
  monthPicker: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'oklch(99% 0.006 80)', border: '1px solid oklch(90% 0.008 70)',
    borderRadius: 10, padding: '6px 10px', fontSize: 13.5, fontWeight: 500,
  },
  monthArrow: { background: 'none', border: 'none', cursor: 'pointer', color: 'oklch(45% 0.01 60)', fontSize: 16, padding: '0 4px' },
  monthLabel: { minWidth: 76, textAlign: 'center' },
  btnGhost: {
    background: 'oklch(99% 0.006 80)', border: '1px solid oklch(90% 0.008 70)',
    borderRadius: 10, padding: '8px 14px', fontSize: 13.5, fontWeight: 500,
    color: 'oklch(28% 0.015 60)', cursor: 'pointer',
  },
  btnPrimary: {
    background: 'oklch(28% 0.018 60)', color: 'oklch(98% 0.008 80)',
    border: 'none', borderRadius: 10, padding: '8px 14px',
    fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
  },
  avatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'oklch(85% 0.025 50)', color: 'oklch(35% 0.04 50)',
    display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600,
    marginLeft: 4,
  },
  heroRow: { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 },
  card: {
    background: 'oklch(99.5% 0.005 80)',
    border: '1px solid oklch(92% 0.008 70)',
    borderRadius: 16, padding: 22,
  },
  heroCard: { padding: 26 },
  cardLabel: { fontSize: 12.5, color: 'oklch(50% 0.01 60)', fontWeight: 500, letterSpacing: '0.01em' },
  heroNum: {
    fontSize: 44, fontWeight: 500, letterSpacing: '-0.025em',
    marginTop: 10, fontFamily: '"Instrument Serif", Georgia, serif',
  },
  heroMeta: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, marginBottom: 20 },
  pill: {
    background: 'oklch(94% 0.04 145)', color: 'oklch(38% 0.07 145)',
    fontSize: 12, fontWeight: 500, padding: '3px 9px', borderRadius: 999,
  },
  metaText: { fontSize: 12.5, color: 'oklch(50% 0.01 60)' },
  progressTrack: {
    height: 10, background: 'oklch(94% 0.008 70)',
    borderRadius: 999, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', background: 'linear-gradient(90deg, oklch(62% 0.09 50), oklch(58% 0.09 50))',
    borderRadius: 999,
  },
  progressFoot: { display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'oklch(50% 0.01 60)', marginTop: 8 },
  miniCol: { display: 'grid', gridTemplateRows: '1fr 1fr', gap: 16 },
  miniNum: { fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 8, fontFamily: '"Instrument Serif", Georgia, serif' },
  miniMeta: { fontSize: 12, color: 'oklch(50% 0.01 60)', marginTop: 4 },
  ctaRow: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 24 },
  ctaPrimary: {
    background: 'oklch(95% 0.018 60)', border: '1px dashed oklch(75% 0.03 50)',
    borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
  },
  ctaIcon: {
    width: 44, height: 44, borderRadius: 12, background: 'oklch(99% 0.005 80)',
    color: 'oklch(45% 0.04 50)', display: 'grid', placeItems: 'center',
    border: '1px solid oklch(88% 0.012 60)',
  },
  ctaTitle: { fontWeight: 600, fontSize: 14.5 },
  ctaSub: { fontSize: 12.5, color: 'oklch(50% 0.01 60)', marginTop: 2 },
  ctaSecondary: {
    background: 'oklch(99.5% 0.005 80)', border: '1px solid oklch(92% 0.008 70)',
    borderRadius: 16, padding: '0 22px', fontSize: 13.5, fontWeight: 500,
    color: 'oklch(28% 0.015 60)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  cardHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  cardTitle: { fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' },
  cardSub: { fontSize: 12, color: 'oklch(55% 0.01 60)', marginTop: 2 },
  linkBtn: { background: 'none', border: 'none', color: 'oklch(45% 0.07 50)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' },
  receiptList: { display: 'flex', flexDirection: 'column' },
  receiptRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 0', borderTop: '1px solid oklch(94% 0.008 70)',
  },
  dot: { width: 8, height: 8, borderRadius: '50%', flex: '0 0 auto' },
  rStore: { fontWeight: 500, fontSize: 13.5 },
  rCat: { fontSize: 12, color: 'oklch(55% 0.01 60)', marginTop: 2 },
  rAmt: { fontVariantNumeric: 'tabular-nums', fontSize: 13.5, fontWeight: 500 },
  shopAdd: { display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, marginBottom: 14 },
  shopInput: {
    background: 'oklch(98% 0.006 80)', border: '1px solid oklch(92% 0.008 70)',
    borderRadius: 10, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit',
    outline: 'none', color: 'oklch(22% 0.015 60)',
  },
  shopSelect: {
    background: 'oklch(98% 0.006 80)', border: '1px solid oklch(92% 0.008 70)',
    borderRadius: 10, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit',
    color: 'oklch(50% 0.01 60)',
  },
  shopAddBtn: {
    background: 'oklch(28% 0.018 60)', color: 'oklch(98% 0.008 80)',
    border: 'none', borderRadius: 10, width: 38, fontSize: 18, cursor: 'pointer',
  },
  shopList: { display: 'flex', flexDirection: 'column' },
  shopRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '9px 0', borderTop: '1px solid oklch(94% 0.008 70)',
  },
  checkbox: {
    width: 18, height: 18, borderRadius: 6,
    border: '1.5px solid oklch(80% 0.015 60)',
    display: 'grid', placeItems: 'center',
  },
  checkboxOn: { background: 'oklch(58% 0.09 50)', borderColor: 'oklch(58% 0.09 50)' },
  shopName: { flex: 1, fontSize: 13.5 },
  shopNameDone: { textDecoration: 'line-through', color: 'oklch(60% 0.01 60)' },
  shopCat: { fontSize: 11.5, color: 'oklch(55% 0.01 60)' },
  tabRow: { display: 'flex', gap: 4, background: 'oklch(95% 0.008 70)', padding: 3, borderRadius: 9 },
  tab: { background: 'none', border: 'none', fontSize: 12, fontWeight: 500, padding: '5px 10px', borderRadius: 6, cursor: 'pointer', color: 'oklch(45% 0.01 60)' },
  tabOn: { background: 'oklch(99.5% 0.005 80)', color: 'oklch(22% 0.015 60)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' },
  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 },
  catItem: { display: 'flex', flexDirection: 'column', gap: 6 },
  catTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  catName: { fontSize: 12.5, color: 'oklch(45% 0.01 60)' },
  catAmt: { fontSize: 13, fontWeight: 500, fontVariantNumeric: 'tabular-nums' },
  catTrack: { height: 6, background: 'oklch(94% 0.008 70)', borderRadius: 999, overflow: 'hidden' },
  catFill: { height: '100%', borderRadius: 999 },
  catPct: { fontSize: 11.5, color: 'oklch(55% 0.01 60)' },
};

// ============================================================================
// VARIANT B — Sage Calm
// Soft mint-tinted bg, single sage accent, big chart-forward layout
// ============================================================================
function VariantSage() {
  const s = sageStyles;
  // build trend chart points
  const trend = SAMPLE.trend;
  const max = Math.max(...trend);
  const W = 720, H = 90, pad = 4;
  const pts = trend.map((v, i) => [
    pad + (i * (W - pad * 2)) / (trend.length - 1),
    H - pad - (v / max) * (H - pad * 2),
  ]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = path + ` L${pts[pts.length-1][0].toFixed(1)} ${H} L${pts[0][0].toFixed(1)} ${H} Z`;
  const months = ['Des','Jan','Feb','Mar','Apr','Mai'];

  return (
    <div style={s.root}>
      <div style={s.topbar}>
        <div style={s.brand}>
          <div style={s.brandMark}>◐</div>
          <span style={s.brandName}>BudgetBandz</span>
          <span style={s.brandSep}>/</span>
          <button style={s.brandPicker}>Husholdning ▾</button>
        </div>
        <div style={s.nav}>
          <button style={{...s.navBtn, ...s.navOn}}>Oversikt</button>
          <button style={s.navBtn}>Kvitteringer</button>
          <button style={s.navBtn}>Kategorier</button>
          <button style={s.navBtn}>Rapporter</button>
        </div>
        <div style={s.topActions}>
          <button style={s.iconBtn}>⌕</button>
          <button style={s.iconBtn}>⚙</button>
          <div style={s.avatar}>EH</div>
        </div>
      </div>

      <div style={s.heroPanel}>
        <div style={s.heroLeft}>
          <div style={s.heroLabel}>Brukt i {SAMPLE.month}</div>
          <div style={s.heroNum}>{fmtShort(SAMPLE.spent)}</div>
          <div style={s.heroProgress}>
            <div style={s.barTrack}>
              <div style={{...s.barFill, width: `${SAMPLE.pct * 100}%`}} />
              <div style={{...s.barMarker, left: '70%'}} title="Mål: 8 400 kr" />
            </div>
            <div style={s.barLegend}>
              <span><b style={{color: 'oklch(22% 0.02 160)'}}>{fmtShort(SAMPLE.spent)}</b> av {fmtShort(SAMPLE.budget)}</span>
              <span style={{color: 'oklch(45% 0.06 160)'}}>{fmtShort(SAMPLE.remaining)} igjen</span>
            </div>
          </div>
        </div>
        <div style={s.heroRight}>
          <div style={s.heroStat}>
            <span style={s.heroStatLabel}>Daglig snitt</span>
            <span style={s.heroStatVal}>561 kr</span>
          </div>
          <div style={s.heroDivider} />
          <div style={s.heroStat}>
            <span style={s.heroStatLabel}>Kvitteringer</span>
            <span style={s.heroStatVal}>23</span>
          </div>
          <div style={s.heroDivider} />
          <div style={s.heroStat}>
            <span style={s.heroStatLabel}>Dager igjen</span>
            <span style={s.heroStatVal}>17</span>
          </div>
        </div>
      </div>

      {/* Trend chart card */}
      <div style={s.trendCard}>
        <div style={s.cardHead}>
          <div>
            <div style={s.cardTitle}>Forbrukstrend</div>
            <div style={s.cardSub}>Siste 6 måneder</div>
          </div>
          <div style={s.tabRow}>
            <button style={s.tab}>3M</button>
            <button style={{...s.tab, ...s.tabOn}}>6M</button>
            <button style={s.tab}>1Å</button>
          </div>
        </div>
        <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} preserveAspectRatio="none" style={{display: 'block'}}>
          <defs>
            <linearGradient id="sageGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(70% 0.08 160)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="oklch(70% 0.08 160)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#sageGrad)" />
          <path d={path} fill="none" stroke="oklch(50% 0.08 160)" strokeWidth="1.8" strokeLinejoin="round" />
          {pts.map((p, i) => (
            <g key={i}>
              <circle cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4 : 2.5} fill="oklch(50% 0.08 160)" />
              {i === pts.length - 1 && <circle cx={p[0]} cy={p[1]} r="7" fill="none" stroke="oklch(50% 0.08 160)" strokeOpacity="0.3" />}
              <text x={p[0]} y={H + 16} textAnchor="middle" fontSize="9.5" fill="oklch(55% 0.01 160)" fontFamily="Inter">{months[i]}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Bottom grid */}
      <div style={s.bottomGrid}>
        <div style={s.card}>
          <div style={s.cardHead}>
            <div>
              <div style={s.cardTitle}>Siste kvitteringer</div>
              <div style={s.cardSub}>Mai 2026</div>
            </div>
            <button style={s.linkBtn}>Alle 23 →</button>
          </div>
          <div style={s.receiptList}>
            {SAMPLE.receipts.slice(0, 5).map(r => (
              <div key={r.id} style={s.receiptRow}>
                <div style={{...s.receiptIcon, background: r.color + '22', color: r.color}}>
                  {r.store.charAt(0)}
                </div>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={s.rStore}>{r.store}</div>
                  <div style={s.rCat}>{r.cat}</div>
                </div>
                <div style={{textAlign: 'right'}}>
                  <div style={s.rAmt}>{fmt(r.amt)}</div>
                  <div style={s.rDate}>{r.date}</div>
                </div>
              </div>
            ))}
          </div>
          <button style={s.addReceiptBtn}>
            <span style={s.plusIcon}>+</span>
            <span>Skann kvittering</span>
          </button>
        </div>

        <div style={s.card}>
          <div style={s.cardHead}>
            <div>
              <div style={s.cardTitle}>Per kategori</div>
              <div style={s.cardSub}>Mai 2026</div>
            </div>
          </div>
          <div style={s.donutWrap}>
            <svg viewBox="0 0 100 100" style={{width: 140, height: 140, flex: '0 0 auto'}}>
              {(() => {
                let acc = 0;
                return SAMPLE.categories.map((c, i) => {
                  const start = acc;
                  acc += c.pct;
                  const a0 = (start / 100) * Math.PI * 2 - Math.PI / 2;
                  const a1 = (acc / 100) * Math.PI * 2 - Math.PI / 2;
                  const r = 38, ir = 24;
                  const x0o = 50 + r * Math.cos(a0), y0o = 50 + r * Math.sin(a0);
                  const x1o = 50 + r * Math.cos(a1), y1o = 50 + r * Math.sin(a1);
                  const x0i = 50 + ir * Math.cos(a1), y0i = 50 + ir * Math.sin(a1);
                  const x1i = 50 + ir * Math.cos(a0), y1i = 50 + ir * Math.sin(a0);
                  const large = c.pct > 50 ? 1 : 0;
                  const d = `M${x0o} ${y0o} A${r} ${r} 0 ${large} 1 ${x1o} ${y1o} L${x0i} ${y0i} A${ir} ${ir} 0 ${large} 0 ${x1i} ${y1i} Z`;
                  return <path key={i} d={d} fill={c.color} stroke="oklch(98% 0.012 160)" strokeWidth="0.6" />;
                });
              })()}
              <text x="50" y="49" textAnchor="middle" fontSize="9" fill="oklch(55% 0.01 160)" fontFamily="Inter">Totalt</text>
              <text x="50" y="58" textAnchor="middle" fontSize="9" fontWeight="600" fill="oklch(22% 0.02 160)" fontFamily="Inter">7 840 kr</text>
            </svg>
            <div style={s.legend}>
              {SAMPLE.categories.map(c => (
                <div key={c.name} style={s.legendRow}>
                  <div style={{...s.legendDot, background: c.color}} />
                  <span style={s.legendName}>{c.name}</span>
                  <span style={s.legendPct}>{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const sageStyles = {
  root: {
    fontFamily: 'Inter, system-ui, sans-serif',
    background: 'oklch(97.5% 0.015 160)',
    color: 'oklch(22% 0.02 160)',
    padding: '24px 32px 40px',
    minHeight: '100%',
    fontSize: 14,
  },
  topbar: { display: 'flex', alignItems: 'center', gap: 24, marginBottom: 22 },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  brandMark: {
    width: 30, height: 30, borderRadius: 8,
    background: 'oklch(50% 0.08 160)', color: 'oklch(98% 0.012 160)',
    display: 'grid', placeItems: 'center', fontSize: 16,
  },
  brandName: { fontWeight: 600, fontSize: 15.5, letterSpacing: '-0.01em' },
  brandSep: { color: 'oklch(75% 0.015 160)', fontSize: 14 },
  brandPicker: { background: 'none', border: 'none', fontSize: 13.5, color: 'oklch(40% 0.02 160)', cursor: 'pointer', fontFamily: 'inherit' },
  nav: { display: 'flex', gap: 2, marginLeft: 'auto', marginRight: 'auto', background: 'oklch(99% 0.008 160)', border: '1px solid oklch(92% 0.012 160)', borderRadius: 10, padding: 3 },
  navBtn: { background: 'none', border: 'none', padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, color: 'oklch(45% 0.02 160)', cursor: 'pointer' },
  navOn: { background: 'oklch(94% 0.025 160)', color: 'oklch(28% 0.05 160)' },
  topActions: { display: 'flex', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 9,
    background: 'oklch(99% 0.008 160)', border: '1px solid oklch(92% 0.012 160)',
    fontSize: 15, cursor: 'pointer', color: 'oklch(40% 0.02 160)',
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    background: 'oklch(50% 0.08 160)', color: 'white',
    display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 600,
    marginLeft: 4,
  },
  heroPanel: {
    background: 'linear-gradient(135deg, oklch(94% 0.03 160), oklch(96% 0.018 160))',
    border: '1px solid oklch(90% 0.018 160)',
    borderRadius: 18, padding: '24px 28px', marginBottom: 16,
    display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32,
  },
  heroLeft: {},
  heroLabel: { fontSize: 13, color: 'oklch(40% 0.03 160)', fontWeight: 500 },
  heroNum: { fontSize: 52, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 6, marginBottom: 18, lineHeight: 1, color: 'oklch(22% 0.02 160)' },
  heroProgress: {},
  barTrack: { position: 'relative', height: 8, background: 'oklch(92% 0.018 160)', borderRadius: 999, overflow: 'visible' },
  barFill: { height: '100%', background: 'oklch(50% 0.08 160)', borderRadius: 999 },
  barMarker: { position: 'absolute', top: -4, width: 2, height: 16, background: 'oklch(38% 0.06 160)', borderRadius: 1 },
  barLegend: { display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'oklch(45% 0.025 160)', marginTop: 10 },
  heroRight: { display: 'flex', alignItems: 'center', justifyContent: 'space-around' },
  heroStat: { display: 'flex', flexDirection: 'column', gap: 4 },
  heroStatLabel: { fontSize: 12, color: 'oklch(45% 0.025 160)' },
  heroStatVal: { fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em' },
  heroDivider: { width: 1, height: 36, background: 'oklch(88% 0.02 160)' },
  trendCard: {
    background: 'oklch(99.5% 0.006 160)',
    border: '1px solid oklch(92% 0.012 160)',
    borderRadius: 16, padding: 22, marginBottom: 16,
  },
  cardHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.01em' },
  cardSub: { fontSize: 12, color: 'oklch(55% 0.02 160)', marginTop: 2 },
  tabRow: { display: 'flex', gap: 2, background: 'oklch(95% 0.012 160)', padding: 3, borderRadius: 8 },
  tab: { background: 'none', border: 'none', fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', color: 'oklch(50% 0.02 160)', fontFamily: 'inherit' },
  tabOn: { background: 'oklch(99.5% 0.006 160)', color: 'oklch(28% 0.05 160)' },
  bottomGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 },
  card: {
    background: 'oklch(99.5% 0.006 160)',
    border: '1px solid oklch(92% 0.012 160)',
    borderRadius: 16, padding: 22,
  },
  linkBtn: { background: 'none', border: 'none', color: 'oklch(45% 0.07 160)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  receiptList: { display: 'flex', flexDirection: 'column' },
  receiptRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid oklch(94% 0.012 160)' },
  receiptIcon: { width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 600 },
  rStore: { fontSize: 13.5, fontWeight: 500 },
  rCat: { fontSize: 12, color: 'oklch(55% 0.02 160)', marginTop: 2 },
  rAmt: { fontSize: 13.5, fontWeight: 500, fontVariantNumeric: 'tabular-nums' },
  rDate: { fontSize: 11.5, color: 'oklch(55% 0.02 160)', marginTop: 2 },
  addReceiptBtn: {
    width: '100%', marginTop: 14, padding: '10px 14px',
    background: 'oklch(95% 0.025 160)', color: 'oklch(35% 0.06 160)',
    border: '1px dashed oklch(75% 0.04 160)', borderRadius: 10,
    fontWeight: 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  plusIcon: { fontSize: 16, lineHeight: 1 },
  donutWrap: { display: 'flex', alignItems: 'center', gap: 18, paddingTop: 4 },
  legend: { flex: 1, display: 'flex', flexDirection: 'column', gap: 8 },
  legendRow: { display: 'flex', alignItems: 'center', gap: 10 },
  legendDot: { width: 9, height: 9, borderRadius: 2.5, flex: '0 0 auto' },
  legendName: { fontSize: 12.5, flex: 1, color: 'oklch(32% 0.02 160)' },
  legendPct: { fontSize: 12.5, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: 'oklch(40% 0.02 160)' },
};

// ============================================================================
// VARIANT C — Editorial
// Newspaper-like: white, serif display numbers, hairline rules, mono labels
// ============================================================================
function VariantEditorial() {
  const s = edStyles;
  return (
    <div style={s.root}>
      <div style={s.topbar}>
        <div>
          <div style={s.kicker}>BUDGETBANDZ · MAI MMXXVI</div>
          <div style={s.title}>Husholdning</div>
        </div>
        <div style={s.topRight}>
          <button style={s.linkBtn}>← Forrige måned</button>
          <button style={s.linkBtn}>Neste →</button>
          <span style={s.sep}>·</span>
          <button style={s.linkBtn}>Eksporter</button>
          <button style={s.btnDark}>Sett budsjett</button>
        </div>
      </div>

      <div style={s.hrThick} />

      {/* Three column big numbers */}
      <div style={s.bigRow}>
        <div style={s.bigCell}>
          <div style={s.bigLabel}>BRUKT</div>
          <div style={s.bigNum}>7 840<span style={s.bigUnit}>kr</span></div>
          <div style={s.bigMeta}>denne måneden</div>
        </div>
        <div style={s.vRule} />
        <div style={s.bigCell}>
          <div style={s.bigLabel}>BUDSJETT</div>
          <div style={s.bigNum}>12 000<span style={s.bigUnit}>kr</span></div>
          <div style={s.bigMeta}>65 % brukt</div>
          <div style={s.tinyBar}>
            <div style={{...s.tinyBarFill, width: `${SAMPLE.pct * 100}%`}} />
          </div>
        </div>
        <div style={s.vRule} />
        <div style={s.bigCell}>
          <div style={s.bigLabel}>GJENSTÅR</div>
          <div style={s.bigNum}>4 160<span style={s.bigUnit}>kr</span></div>
          <div style={s.bigMeta}>17 dager · 245 kr/dag</div>
        </div>
      </div>

      <div style={s.hrThick} />

      {/* Two-col content */}
      <div style={s.contentGrid}>
        {/* Left column */}
        <div>
          <div style={s.sectionHead}>
            <span style={s.sectionTitle}>Kvitteringer</span>
            <span style={s.sectionDate}>SISTE 7 DAGER</span>
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Dato</th>
                <th style={s.th}>Sted</th>
                <th style={s.th}>Kategori</th>
                <th style={{...s.th, textAlign: 'right'}}>Beløp</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE.receipts.map(r => (
                <tr key={r.id} style={s.tr}>
                  <td style={s.td}><span style={s.tdMono}>{r.date}</span></td>
                  <td style={s.td}>{r.store}</td>
                  <td style={s.td}><span style={{...s.catTag, borderColor: r.color, color: r.color}}>{r.cat}</span></td>
                  <td style={{...s.td, textAlign: 'right', fontVariantNumeric: 'tabular-nums'}}>{fmt(r.amt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={s.tableFoot}>
            <button style={s.btnGhostSm}>+ Ny kvittering</button>
            <button style={s.btnGhostSm}>Se alle 23 →</button>
          </div>
        </div>

        {/* Right column */}
        <div>
          <div style={s.sectionHead}>
            <span style={s.sectionTitle}>Fordeling</span>
            <span style={s.sectionDate}>MAI 2026</span>
          </div>
          <div style={s.edCatList}>
            {SAMPLE.categories.map((c, i) => (
              <div key={c.name} style={s.edCatRow}>
                <div style={s.edCatTop}>
                  <span style={s.edCatRank}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={s.edCatName}>{c.name}</span>
                  <span style={s.edCatAmt}>{fmtShort(c.amt)}</span>
                </div>
                <div style={s.edCatTrack}>
                  <div style={{...s.edCatFill, width: `${c.pct}%`}} />
                </div>
                <div style={s.edCatBottom}>
                  <span>{c.pct} % av totalt</span>
                  <span>{(SAMPLE.budget * c.pct / 100).toFixed(0)} kr budsjett</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{...s.sectionHead, marginTop: 28}}>
            <span style={s.sectionTitle}>Handleliste</span>
            <span style={s.sectionDate}>{SAMPLE.shopping.filter(x => !x.done).length} STK</span>
          </div>
          <div style={s.shopList}>
            {SAMPLE.shopping.map(item => (
              <label key={item.id} style={s.shopRow}>
                <input type="checkbox" defaultChecked={item.done} style={s.shopCheck} />
                <span style={{...s.shopName, ...(item.done ? s.shopNameDone : {})}}>{item.name}</span>
                <span style={s.shopCat}>{item.cat}</span>
              </label>
            ))}
            <div style={s.shopAdd}>
              <input style={s.shopInput} placeholder="Legg til vare…" />
              <button style={s.btnGhostSm}>Legg til</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const edStyles = {
  root: {
    fontFamily: 'Inter, system-ui, sans-serif',
    background: 'oklch(99% 0.005 90)',
    color: 'oklch(15% 0.01 60)',
    padding: '32px 40px 48px',
    minHeight: '100%',
    fontSize: 14,
  },
  topbar: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' },
  kicker: { fontSize: 11, letterSpacing: '0.18em', fontWeight: 600, color: 'oklch(45% 0.02 60)', fontFamily: '"JetBrains Mono", monospace' },
  title: { fontSize: 42, fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400, letterSpacing: '-0.02em', marginTop: 4 },
  topRight: { display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 8 },
  linkBtn: { background: 'none', border: 'none', fontSize: 13, color: 'oklch(28% 0.015 60)', cursor: 'pointer', fontFamily: 'inherit', padding: 0, textDecoration: 'underline', textDecorationColor: 'oklch(80% 0.015 60)', textUnderlineOffset: 4 },
  sep: { color: 'oklch(70% 0.015 60)' },
  btnDark: {
    background: 'oklch(18% 0.01 60)', color: 'oklch(99% 0.005 90)',
    border: 'none', padding: '8px 16px', fontSize: 13, fontWeight: 500,
    fontFamily: 'inherit', cursor: 'pointer',
  },
  hrThick: { height: 2, background: 'oklch(18% 0.01 60)', margin: '20px 0' },
  bigRow: { display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', gap: 24, padding: '8px 0 16px' },
  bigCell: { display: 'flex', flexDirection: 'column', gap: 4 },
  vRule: { background: 'oklch(85% 0.01 60)' },
  bigLabel: { fontSize: 10.5, letterSpacing: '0.2em', fontWeight: 600, color: 'oklch(45% 0.02 60)', fontFamily: '"JetBrains Mono", monospace' },
  bigNum: { fontSize: 58, fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1, marginTop: 6, fontVariantNumeric: 'tabular-nums' },
  bigUnit: { fontSize: 18, marginLeft: 8, color: 'oklch(50% 0.015 60)', fontStyle: 'italic' },
  bigMeta: { fontSize: 12.5, color: 'oklch(45% 0.015 60)', marginTop: 10 },
  tinyBar: { height: 2, background: 'oklch(90% 0.01 60)', marginTop: 10, position: 'relative' },
  tinyBarFill: { height: '100%', background: 'oklch(18% 0.01 60)' },
  contentGrid: { display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 40, marginTop: 8 },
  sectionHead: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, borderBottom: '1px solid oklch(18% 0.01 60)', paddingBottom: 6 },
  sectionTitle: { fontSize: 22, fontFamily: '"Instrument Serif", Georgia, serif', letterSpacing: '-0.015em' },
  sectionDate: { fontSize: 10.5, letterSpacing: '0.18em', fontWeight: 600, color: 'oklch(45% 0.02 60)', fontFamily: '"JetBrains Mono", monospace' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 10.5, letterSpacing: '0.16em', fontWeight: 600, color: 'oklch(50% 0.02 60)', padding: '8px 4px', borderBottom: '1px solid oklch(85% 0.01 60)', fontFamily: '"JetBrains Mono", monospace' },
  tr: {},
  td: { fontSize: 13, padding: '12px 4px', borderBottom: '1px solid oklch(92% 0.008 60)' },
  tdMono: { fontFamily: '"JetBrains Mono", monospace', fontSize: 11.5, color: 'oklch(45% 0.015 60)' },
  catTag: { fontSize: 11, padding: '2px 7px', border: '1px solid', borderRadius: 999 },
  tableFoot: { display: 'flex', justifyContent: 'space-between', marginTop: 14 },
  btnGhostSm: { background: 'none', border: '1px solid oklch(82% 0.01 60)', padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: 'oklch(22% 0.015 60)' },
  edCatList: { display: 'flex', flexDirection: 'column', gap: 14 },
  edCatRow: {},
  edCatTop: { display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 },
  edCatRank: { fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'oklch(55% 0.015 60)' },
  edCatName: { flex: 1, fontSize: 14, fontWeight: 500 },
  edCatAmt: { fontSize: 14, fontVariantNumeric: 'tabular-nums', fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 17 },
  edCatTrack: { height: 3, background: 'oklch(92% 0.008 60)' },
  edCatFill: { height: '100%', background: 'oklch(18% 0.01 60)' },
  edCatBottom: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'oklch(50% 0.015 60)', marginTop: 4, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.05em' },
  shopList: { display: 'flex', flexDirection: 'column' },
  shopRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px dashed oklch(88% 0.01 60)', cursor: 'pointer' },
  shopCheck: { width: 14, height: 14, accentColor: 'oklch(18% 0.01 60)' },
  shopName: { flex: 1, fontSize: 13.5 },
  shopNameDone: { textDecoration: 'line-through', color: 'oklch(55% 0.015 60)' },
  shopCat: { fontSize: 11, color: 'oklch(50% 0.015 60)', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.04em' },
  shopAdd: { display: 'flex', gap: 8, marginTop: 12 },
  shopInput: { flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid oklch(75% 0.01 60)', padding: '6px 2px', fontSize: 13, fontFamily: 'inherit', outline: 'none' },
};

// ============================================================================
// VARIANT D — Compact Sidebar (modern fintech)
// Left sidebar nav, denser dashboard with everything visible at a glance
// ============================================================================
function VariantSidebar() {
  const s = sbStyles;
  return (
    <div style={s.root}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sbBrand}>
          <div style={s.sbMark}>B</div>
          <span style={s.sbName}>BudgetBandz</span>
        </div>
        <div style={s.sbSection}>
          <div style={s.sbLabel}>OPPGJØR</div>
          <button style={s.sbAccount}>
            <span style={s.sbAccDot} />
            <span style={{flex: 1, textAlign: 'left'}}>Husholdning</span>
            <span style={s.sbCaret}>▾</span>
          </button>
        </div>
        <nav style={s.sbNav}>
          <button style={{...s.sbItem, ...s.sbItemOn}}>
            <SbIcon kind="grid" /> Oversikt
          </button>
          <button style={s.sbItem}><SbIcon kind="list" /> Kvitteringer <span style={s.sbBadge}>23</span></button>
          <button style={s.sbItem}><SbIcon kind="chart" /> Kategorier</button>
          <button style={s.sbItem}><SbIcon kind="cart" /> Handleliste <span style={s.sbBadge}>3</span></button>
          <button style={s.sbItem}><SbIcon kind="trend" /> Rapporter</button>
        </nav>
        <div style={s.sbFoot}>
          <div style={s.budgetMini}>
            <div style={s.budgetLabel}>Mai-budsjett</div>
            <div style={s.budgetVal}>4 160 kr <span style={s.budgetMeta}>igjen</span></div>
            <div style={s.budgetBar}><div style={{...s.budgetBarFill, width: '65%'}} /></div>
          </div>
          <button style={s.sbProfile}>
            <div style={s.sbAvatar}>EH</div>
            <div style={{flex: 1, textAlign: 'left'}}>
              <div style={s.sbProfName}>Erlend H.</div>
              <div style={s.sbProfSub}>Innstillinger</div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={s.main}>
        <div style={s.mainTop}>
          <div>
            <div style={s.mainKicker}>Oversikt</div>
            <h1 style={s.mainTitle}>God ettermiddag, Erlend</h1>
          </div>
          <div style={s.mainTopRight}>
            <div style={s.search}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg>
              <input placeholder="Søk i kvitteringer…" style={s.searchInput} />
              <span style={s.kbd}>⌘K</span>
            </div>
            <div style={s.monthSwitch}>
              <button style={s.monthBtn}>‹</button>
              <span style={s.monthNow}>Mai 2026</span>
              <button style={s.monthBtn}>›</button>
            </div>
            <button style={s.cta}>+ Ny kvittering</button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={s.kpiStrip}>
          <div style={s.kpi}>
            <div style={s.kpiLabel}>Brukt</div>
            <div style={s.kpiVal}>7 840 <span style={s.kpiUnit}>kr</span></div>
            <div style={s.kpiDelta}><span style={s.deltaUp}>▼ 4,3 %</span> vs. april</div>
          </div>
          <div style={s.kpi}>
            <div style={s.kpiLabel}>Budsjett</div>
            <div style={s.kpiVal}>12 000 <span style={s.kpiUnit}>kr</span></div>
            <div style={s.kpiDelta}>65 % brukt · 17 dager igjen</div>
          </div>
          <div style={s.kpi}>
            <div style={s.kpiLabel}>Gjenstår</div>
            <div style={s.kpiVal}>4 160 <span style={s.kpiUnit}>kr</span></div>
            <div style={s.kpiDelta}>≈ 245 kr/dag</div>
          </div>
          <div style={s.kpi}>
            <div style={s.kpiLabel}>Største kategori</div>
            <div style={s.kpiVal}>Mat <span style={s.kpiUnit}>& drikke</span></div>
            <div style={s.kpiDelta}>3 420 kr · 44 %</div>
          </div>
        </div>

        {/* Content grid */}
        <div style={s.contentGrid}>
          {/* Trend (large) */}
          <div style={{...s.panel, gridColumn: 'span 2'}}>
            <div style={s.panelHead}>
              <div>
                <div style={s.panelTitle}>Forbrukstrend</div>
                <div style={s.panelSub}>Siste 6 måneder · daglig snitt</div>
              </div>
              <div style={s.tabRow}>
                <button style={s.tab}>Uke</button>
                <button style={s.tab}>Måned</button>
                <button style={{...s.tab, ...s.tabOn}}>6M</button>
                <button style={s.tab}>År</button>
              </div>
            </div>
            <BarChart />
          </div>

          {/* Categories */}
          <div style={s.panel}>
            <div style={s.panelHead}>
              <div>
                <div style={s.panelTitle}>Per kategori</div>
                <div style={s.panelSub}>Mai 2026</div>
              </div>
            </div>
            <div style={s.catList}>
              {SAMPLE.categories.map(c => (
                <div key={c.name} style={s.catRow}>
                  <div style={{...s.catDot, background: c.color}} />
                  <span style={s.catRowName}>{c.name}</span>
                  <span style={s.catRowAmt}>{fmtShort(c.amt)}</span>
                  <span style={s.catRowPct}>{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Receipts */}
          <div style={{...s.panel, gridColumn: 'span 2'}}>
            <div style={s.panelHead}>
              <div>
                <div style={s.panelTitle}>Siste aktivitet</div>
                <div style={s.panelSub}>6 kvitteringer · sist 14. mai</div>
              </div>
              <button style={s.linkBtn}>Se alle →</button>
            </div>
            <div style={s.actList}>
              {SAMPLE.receipts.map(r => (
                <div key={r.id} style={s.actRow}>
                  <div style={{...s.actIcon, background: r.color + '22', color: r.color}}>
                    {r.store.charAt(0)}
                  </div>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={s.actStore}>{r.store}</div>
                    <div style={s.actCat}>{r.cat}</div>
                  </div>
                  <div style={s.actDate}>{r.date}</div>
                  <div style={s.actAmt}>−{fmt(r.amt)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Shopping list */}
          <div style={s.panel}>
            <div style={s.panelHead}>
              <div>
                <div style={s.panelTitle}>Handleliste</div>
                <div style={s.panelSub}>{SAMPLE.shopping.filter(x => !x.done).length} igjen</div>
              </div>
            </div>
            <div style={s.shopList}>
              {SAMPLE.shopping.map(item => (
                <div key={item.id} style={s.shopRow}>
                  <div style={{...s.checkbox, ...(item.done ? s.checkboxOn : {})}}>
                    {item.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><path d="M5 12l5 5 9-11"/></svg>}
                  </div>
                  <span style={{...s.shopName, ...(item.done ? s.shopNameDone : {})}}>{item.name}</span>
                  <span style={s.shopRowCat}>{item.cat}</span>
                </div>
              ))}
            </div>
            <div style={s.shopAdd}>
              <input style={s.shopInput} placeholder="Legg til vare…" />
              <button style={s.plusBtn}>+</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SbIcon({ kind }) {
  const p = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (kind === 'grid') return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
  if (kind === 'list') return <svg {...p}><path d="M4 6h16M4 12h16M4 18h10"/></svg>;
  if (kind === 'chart') return <svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>;
  if (kind === 'cart') return <svg {...p}><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.5 11h11L21 7H6"/></svg>;
  if (kind === 'trend') return <svg {...p}><path d="M3 17l6-6 4 4 7-8"/><path d="M14 7h6v6"/></svg>;
  return null;
}

function BarChart() {
  const data = [
    { label: 'Des', mat: 2200, transport: 900, andre: 2100 },
    { label: 'Jan', mat: 2600, transport: 1200, andre: 2300 },
    { label: 'Feb', mat: 3100, transport: 1600, andre: 2600 },
    { label: 'Mar', mat: 2900, transport: 1400, andre: 2500 },
    { label: 'Apr', mat: 3400, transport: 1800, andre: 3000 },
    { label: 'Mai', mat: 3420, transport: 1680, andre: 2740 },
  ];
  const max = 9000;
  const W = 700, H = 180, pad = 24, bw = 32;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} style={{width: '100%', display: 'block'}} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75, 1].map((p, i) => (
          <g key={i}>
            <line x1={pad} x2={W - pad} y1={H - p * (H - pad)} y2={H - p * (H - pad)} stroke="oklch(92% 0.005 240)" strokeWidth="1" />
            <text x={pad - 6} y={H - p * (H - pad) + 3} fontSize="9" fill="oklch(55% 0.01 240)" textAnchor="end" fontFamily="Inter">{(max * p / 1000).toFixed(0)}k</text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = pad + 30 + i * ((W - pad * 2 - 60) / (data.length - 1));
          const matH = (d.mat / max) * (H - pad);
          const trH = (d.transport / max) * (H - pad);
          const otH = (d.andre / max) * (H - pad);
          const isLast = i === data.length - 1;
          return (
            <g key={i}>
              <rect x={cx - bw/2} y={H - matH} width={bw} height={matH} rx="3" fill={isLast ? 'oklch(50% 0.08 240)' : 'oklch(78% 0.06 240)'} />
              <rect x={cx - bw/2} y={H - matH - trH} width={bw} height={trH} rx="3" fill={isLast ? 'oklch(60% 0.06 240)' : 'oklch(82% 0.04 240)'} />
              <rect x={cx - bw/2} y={H - matH - trH - otH} width={bw} height={otH} rx="3" fill={isLast ? 'oklch(70% 0.04 240)' : 'oklch(86% 0.025 240)'} />
              <text x={cx} y={H + 16} textAnchor="middle" fontSize="10" fill="oklch(45% 0.015 240)" fontFamily="Inter" fontWeight={isLast ? 600 : 400}>{d.label}</text>
            </g>
          );
        })}
      </svg>
      <div style={{display: 'flex', gap: 14, marginTop: 12, fontSize: 11.5, color: 'oklch(45% 0.015 240)'}}>
        <span style={{display: 'flex', alignItems: 'center', gap: 6}}><i style={{width: 9, height: 9, borderRadius: 2, background: 'oklch(50% 0.08 240)'}} />Mat & drikke</span>
        <span style={{display: 'flex', alignItems: 'center', gap: 6}}><i style={{width: 9, height: 9, borderRadius: 2, background: 'oklch(60% 0.06 240)'}} />Transport</span>
        <span style={{display: 'flex', alignItems: 'center', gap: 6}}><i style={{width: 9, height: 9, borderRadius: 2, background: 'oklch(70% 0.04 240)'}} />Andre kategorier</span>
      </div>
    </div>
  );
}

const sbStyles = {
  root: {
    fontFamily: 'Inter, system-ui, sans-serif',
    background: 'oklch(98% 0.005 240)',
    color: 'oklch(20% 0.015 240)',
    minHeight: '100%',
    fontSize: 14,
    display: 'grid',
    gridTemplateColumns: '232px 1fr',
  },
  sidebar: {
    background: 'oklch(99.5% 0.003 240)',
    borderRight: '1px solid oklch(93% 0.008 240)',
    padding: '20px 14px',
    display: 'flex', flexDirection: 'column', gap: 18,
  },
  sbBrand: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px' },
  sbMark: { width: 28, height: 28, borderRadius: 8, background: 'oklch(50% 0.08 240)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 600 },
  sbName: { fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.01em' },
  sbSection: {},
  sbLabel: { fontSize: 10.5, letterSpacing: '0.15em', fontWeight: 600, color: 'oklch(55% 0.015 240)', padding: '0 8px 6px' },
  sbAccount: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    background: 'oklch(96% 0.012 240)', border: '1px solid oklch(91% 0.012 240)',
    borderRadius: 9, padding: '8px 10px', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', color: 'oklch(22% 0.02 240)', fontFamily: 'inherit',
  },
  sbAccDot: { width: 8, height: 8, borderRadius: '50%', background: 'oklch(60% 0.1 160)' },
  sbCaret: { fontSize: 11, color: 'oklch(55% 0.02 240)' },
  sbNav: { display: 'flex', flexDirection: 'column', gap: 2 },
  sbItem: {
    display: 'flex', alignItems: 'center', gap: 11,
    background: 'none', border: 'none', padding: '8px 10px',
    fontSize: 13, fontWeight: 500, color: 'oklch(38% 0.02 240)',
    borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
  },
  sbItemOn: { background: 'oklch(95% 0.02 240)', color: 'oklch(22% 0.04 240)' },
  sbBadge: { marginLeft: 'auto', fontSize: 10.5, fontWeight: 600, background: 'oklch(93% 0.015 240)', color: 'oklch(40% 0.02 240)', padding: '1px 6px', borderRadius: 999 },
  sbFoot: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 },
  budgetMini: { background: 'linear-gradient(135deg, oklch(96% 0.025 240), oklch(98% 0.012 240))', border: '1px solid oklch(92% 0.012 240)', borderRadius: 10, padding: 12 },
  budgetLabel: { fontSize: 11, color: 'oklch(50% 0.02 240)', fontWeight: 500 },
  budgetVal: { fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', marginTop: 2 },
  budgetMeta: { fontSize: 11, color: 'oklch(50% 0.02 240)', fontWeight: 400 },
  budgetBar: { height: 4, background: 'oklch(92% 0.012 240)', borderRadius: 999, marginTop: 10, overflow: 'hidden' },
  budgetBarFill: { height: '100%', background: 'oklch(50% 0.08 240)', borderRadius: 999 },
  sbProfile: { display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: '6px 4px', cursor: 'pointer', fontFamily: 'inherit' },
  sbAvatar: { width: 30, height: 30, borderRadius: '50%', background: 'oklch(75% 0.04 30)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 600 },
  sbProfName: { fontSize: 12.5, fontWeight: 500 },
  sbProfSub: { fontSize: 11, color: 'oklch(55% 0.02 240)' },
  main: { padding: '20px 28px 32px', minWidth: 0, overflow: 'hidden' },
  mainTop: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 },
  mainKicker: { fontSize: 11, letterSpacing: '0.16em', fontWeight: 600, color: 'oklch(55% 0.015 240)' },
  mainTitle: { fontSize: 22, fontWeight: 600, letterSpacing: '-0.018em', marginTop: 4 },
  mainTopRight: { display: 'flex', alignItems: 'center', gap: 10 },
  search: { display: 'flex', alignItems: 'center', gap: 8, background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(92% 0.008 240)', borderRadius: 10, padding: '7px 10px', color: 'oklch(55% 0.015 240)', minWidth: 220 },
  searchInput: { border: 'none', background: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', flex: 1, color: 'oklch(22% 0.02 240)' },
  kbd: { fontSize: 10.5, background: 'oklch(94% 0.008 240)', padding: '1px 5px', borderRadius: 4, color: 'oklch(45% 0.015 240)' },
  monthSwitch: { display: 'flex', alignItems: 'center', gap: 4, background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(92% 0.008 240)', borderRadius: 10, padding: '4px 6px' },
  monthBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'oklch(45% 0.015 240)', padding: '2px 6px', fontSize: 13 },
  monthNow: { fontSize: 13, fontWeight: 500, padding: '0 6px' },
  cta: { background: 'oklch(22% 0.03 240)', color: 'white', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  kpiStrip: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 },
  kpi: { background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(93% 0.008 240)', borderRadius: 12, padding: '14px 16px' },
  kpiLabel: { fontSize: 12, color: 'oklch(50% 0.015 240)', fontWeight: 500 },
  kpiVal: { fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 6, fontVariantNumeric: 'tabular-nums' },
  kpiUnit: { fontSize: 13, color: 'oklch(50% 0.015 240)', fontWeight: 400 },
  kpiDelta: { fontSize: 11.5, color: 'oklch(50% 0.015 240)', marginTop: 6 },
  deltaUp: { color: 'oklch(50% 0.1 145)', fontWeight: 500 },
  contentGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  panel: { background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(93% 0.008 240)', borderRadius: 12, padding: 18 },
  panelHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  panelTitle: { fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' },
  panelSub: { fontSize: 11.5, color: 'oklch(50% 0.015 240)', marginTop: 2 },
  tabRow: { display: 'flex', gap: 2, background: 'oklch(95% 0.008 240)', padding: 3, borderRadius: 7 },
  tab: { background: 'none', border: 'none', fontSize: 11, fontWeight: 600, padding: '4px 9px', borderRadius: 5, cursor: 'pointer', color: 'oklch(48% 0.015 240)', fontFamily: 'inherit' },
  tabOn: { background: 'oklch(99.5% 0.003 240)', color: 'oklch(22% 0.04 240)' },
  linkBtn: { background: 'none', border: 'none', color: 'oklch(45% 0.08 240)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  catList: { display: 'flex', flexDirection: 'column' },
  catRow: { display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 10, alignItems: 'center', padding: '8px 0', borderTop: '1px solid oklch(94% 0.008 240)' },
  catDot: { width: 10, height: 10, borderRadius: 3 },
  catRowName: { fontSize: 13 },
  catRowAmt: { fontSize: 13, fontWeight: 500, fontVariantNumeric: 'tabular-nums' },
  catRowPct: { fontSize: 11.5, color: 'oklch(50% 0.015 240)', minWidth: 28, textAlign: 'right' },
  actList: { display: 'flex', flexDirection: 'column' },
  actRow: { display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 14, alignItems: 'center', padding: '9px 0', borderTop: '1px solid oklch(94% 0.008 240)' },
  actIcon: { width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', fontSize: 12.5, fontWeight: 600 },
  actStore: { fontSize: 13, fontWeight: 500 },
  actCat: { fontSize: 11.5, color: 'oklch(50% 0.015 240)', marginTop: 1 },
  actDate: { fontSize: 11.5, color: 'oklch(50% 0.015 240)' },
  actAmt: { fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  shopList: { display: 'flex', flexDirection: 'column' },
  shopRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid oklch(94% 0.008 240)' },
  checkbox: { width: 16, height: 16, borderRadius: 5, border: '1.5px solid oklch(82% 0.012 240)', display: 'grid', placeItems: 'center' },
  checkboxOn: { background: 'oklch(50% 0.08 240)', borderColor: 'oklch(50% 0.08 240)' },
  shopName: { flex: 1, fontSize: 13 },
  shopNameDone: { textDecoration: 'line-through', color: 'oklch(58% 0.015 240)' },
  shopRowCat: { fontSize: 11, color: 'oklch(50% 0.015 240)' },
  shopAdd: { display: 'flex', gap: 6, marginTop: 12 },
  shopInput: { flex: 1, background: 'oklch(98% 0.005 240)', border: '1px solid oklch(92% 0.008 240)', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, fontFamily: 'inherit', outline: 'none' },
  plusBtn: { background: 'oklch(22% 0.03 240)', color: 'white', border: 'none', borderRadius: 8, width: 32, fontSize: 16, cursor: 'pointer' },
};

Object.assign(window, { VariantWarm, VariantSage, VariantEditorial, VariantSidebar });
