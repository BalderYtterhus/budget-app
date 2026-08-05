// Sage variant — extended with settlement (oppgjør) views
// Two new artboards:
//   B² · Sage with settlement strip  — dashboard + balance pills + reconciliation card
//   B³ · Settlement detail page       — dedicated oppgjør screen

const SETTLE = {
  name: 'Husholdning',
  members: [
    { id: 'erlend',  name: 'Erlend H.',  short: 'EH', paid: 3400, color: 'oklch(60% 0.08 160)' },
    { id: 'mia',     name: 'Mia L.',     short: 'ML', paid: 2850, color: 'oklch(65% 0.07 30)' },
    { id: 'tobias',  name: 'Tobias K.',  short: 'TK', paid: 1590, color: 'oklch(62% 0.08 250)' },
  ],
  total: 7840,
  // each owes 7840 / 3 = 2613.33
  balances: [
    { id: 'erlend', delta:  +787 },
    { id: 'mia',    delta:  +237 },
    { id: 'tobias', delta: -1024 },
  ],
  // simplified settlements
  transfers: [
    { from: 'tobias', to: 'erlend', amt: 787 },
    { from: 'tobias', to: 'mia',    amt: 237 },
  ],
  recentSplits: [
    { id: 1, what: 'Rema 1000',     payer: 'erlend', amt: 487.50, date: '14. mai', split: '3 personer' },
    { id: 2, what: 'Vinmonopolet',  payer: 'mia',    amt: 329.00, date: '12. mai', split: '3 personer' },
    { id: 3, what: 'Strøm — april', payer: 'erlend', amt: 1240,   date: '08. mai', split: '3 personer' },
    { id: 4, what: 'Circle K',      payer: 'tobias', amt: 642.00, date: '09. mai', split: '2 personer' },
    { id: 5, what: 'Kiwi',          payer: 'mia',    amt: 412.80, date: '07. mai', split: '3 personer' },
  ],
};

const memberById = (id) => SETTLE.members.find(m => m.id === id);
const fmtKr = (n) => Math.abs(n).toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kr';
const fmtKrShort = (n) => Math.abs(n).toLocaleString('nb-NO') + ' kr';

// ============================================================================
// VARIANT B² — Sage dashboard with settlement strip
// ============================================================================
function VariantSageSettle() {
  const s = sageSettleStyles;
  return (
    <div style={s.root}>
      <div style={s.topbar}>
        <div style={s.brand}>
          <div style={s.brandMark}>◐</div>
          <span style={s.brandName}>BudgetBandz</span>
        </div>
        <div style={s.nav}>
          <button style={{...s.navBtn, ...s.navOn}}>Oversikt</button>
          <button style={s.navBtn}>Kvitteringer</button>
          <button style={s.navBtn}>Oppgjør</button>
          <button style={s.navBtn}>Rapporter</button>
        </div>
        <div style={s.topActions}>
          <button style={s.iconBtn}>⌕</button>
          <div style={s.avatar}>EH</div>
        </div>
      </div>

      {/* Settlement strip — sits up top so it's the first thing you see */}
      <div style={s.settleStrip}>
        <div style={s.settleLeft}>
          <div style={s.settleHeader}>
            <span style={s.settleDot} />
            <span style={s.settleName}>Husholdning</span>
            <span style={s.settleSub}>· 3 medlemmer · Mai 2026</span>
            <span style={s.settleCaret}>▾</span>
          </div>
          <div style={s.settleStatus}>
            Du får <b style={s.posAmount}>787 kr</b> tilbake fra Tobias
          </div>
        </div>
        <div style={s.memberChips}>
          {SETTLE.members.map(m => {
            const bal = SETTLE.balances.find(b => b.id === m.id);
            const pos = bal.delta >= 0;
            return (
              <div key={m.id} style={s.chip}>
                <div style={{...s.chipAvatar, background: m.color}}>{m.short}</div>
                <div style={s.chipText}>
                  <div style={s.chipName}>{m.name}{m.id === 'erlend' && <span style={s.youTag}>du</span>}</div>
                  <div style={s.chipPaid}>Betalt {fmtKrShort(m.paid)}</div>
                </div>
                <div style={{...s.chipBal, color: pos ? 'oklch(45% 0.1 145)' : 'oklch(50% 0.12 30)'}}>
                  {pos ? '+' : '−'}{fmtKrShort(bal.delta)}
                </div>
              </div>
            );
          })}
        </div>
        <button style={s.settleCta}>
          Gjør opp
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </button>
      </div>

      {/* Hero — kept compact since settlement is now up top */}
      <div style={s.heroPanel}>
        <div style={s.heroLeft}>
          <div style={s.heroLabel}>Felles forbruk i mai</div>
          <div style={s.heroNum}>{fmtKrShort(SETTLE.total)}</div>
          <div style={s.heroProgress}>
            <div style={s.stackedBar}>
              {SETTLE.members.map((m, i) => {
                const w = (m.paid / SETTLE.total) * 100;
                return <div key={m.id} title={m.name} style={{...s.stackedSeg, width: `${w}%`, background: m.color}} />;
              })}
            </div>
            <div style={s.barLegend}>
              {SETTLE.members.map(m => (
                <span key={m.id} style={s.barLegendItem}>
                  <i style={{...s.barLegendDot, background: m.color}} />
                  {m.name.split(' ')[0]} · {Math.round(m.paid / SETTLE.total * 100)}%
                </span>
              ))}
            </div>
          </div>
        </div>
        <div style={s.heroRight}>
          <div style={s.budgetCard}>
            <div style={s.budgetTop}>
              <span style={s.budgetLabel}>Mot budsjett</span>
              <span style={s.budgetPct}>65 %</span>
            </div>
            <div style={s.budgetTrack}>
              <div style={{...s.budgetFill, width: '65%'}} />
            </div>
            <div style={s.budgetFoot}>
              <span>4 160 kr igjen</span>
              <span>17 dager</span>
            </div>
          </div>
          <div style={s.miniRow}>
            <div style={s.mini}><div style={s.miniLabel}>Snitt/dag</div><div style={s.miniVal}>561 kr</div></div>
            <div style={s.mini}><div style={s.miniLabel}>Kvitteringer</div><div style={s.miniVal}>23</div></div>
          </div>
        </div>
      </div>

      {/* Bottom: recent splits + category */}
      <div style={s.bottomGrid}>
        <div style={s.card}>
          <div style={s.cardHead}>
            <div>
              <div style={s.cardTitle}>Siste delte utgifter</div>
              <div style={s.cardSub}>Mai 2026 · 23 totalt</div>
            </div>
            <button style={s.linkBtn}>Alle →</button>
          </div>
          <div style={s.splitList}>
            {SETTLE.recentSplits.map(sp => {
              const m = memberById(sp.payer);
              return (
                <div key={sp.id} style={s.splitRow}>
                  <div style={{...s.splitAvatar, background: m.color}}>{m.short}</div>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={s.splitWhat}>{sp.what}</div>
                    <div style={s.splitMeta}>
                      <b style={{fontWeight: 500, color: 'oklch(32% 0.02 160)'}}>{m.name.split(' ')[0]}</b> betalte · delt på {sp.split.replace(' personer', '')} · {sp.date}
                    </div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={s.splitAmt}>{fmtKr(sp.amt)}</div>
                    <div style={s.splitPer}>{fmtKr(sp.amt / 3)} hver</div>
                  </div>
                </div>
              );
            })}
          </div>
          <button style={s.addBtn}>
            <span>+</span><span>Ny delt utgift</span>
          </button>
        </div>

        <div style={s.card}>
          <div style={s.cardHead}>
            <div>
              <div style={s.cardTitle}>Kategorier</div>
              <div style={s.cardSub}>Mai 2026</div>
            </div>
          </div>
          <div style={s.catList}>
            {[
              { name: 'Mat & drikke',  amt: 3420, pct: 44, color: '#7a9b7a' },
              { name: 'Transport',     amt: 1680, pct: 21, color: '#9b937a' },
              { name: 'Husholdning',   amt: 1240, pct: 16, color: '#7a8d9b' },
              { name: 'Klær',          amt:  860, pct: 11, color: '#a87a9b' },
              { name: 'Helse',         amt:  640, pct:  8, color: '#b8967a' },
            ].map(c => (
              <div key={c.name} style={s.catRow}>
                <div style={s.catTop}>
                  <div style={{...s.catSwatch, background: c.color}} />
                  <span style={s.catName}>{c.name}</span>
                  <span style={s.catAmt}>{fmtKrShort(c.amt)}</span>
                </div>
                <div style={s.catTrack}>
                  <div style={{...s.catFill, width: `${c.pct}%`, background: c.color}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VARIANT B³ — Settlement detail (oppgjør page)
// ============================================================================
function VariantSettleDetail() {
  const s = settleDetailStyles;
  // network: members & flows
  const cx = 240, cy = 200, r = 130;
  const positions = SETTLE.members.map((m, i) => {
    const angle = (-Math.PI / 2) + (i / SETTLE.members.length) * Math.PI * 2;
    return { ...m, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  const posById = Object.fromEntries(positions.map(p => [p.id, p]));

  return (
    <div style={s.root}>
      <div style={s.topbar}>
        <div style={s.brand}>
          <div style={s.brandMark}>◐</div>
          <span style={s.brandName}>BudgetBandz</span>
          <span style={s.crumb}>›</span>
          <span style={s.crumbActive}>Oppgjør</span>
        </div>
        <div style={s.topActions}>
          <button style={s.iconBtn}>⌕</button>
          <div style={s.avatar}>EH</div>
        </div>
      </div>

      <div style={s.pageHead}>
        <div>
          <div style={s.pageKicker}>OPPGJØR · MAI 2026</div>
          <h1 style={s.pageTitle}>Husholdning</h1>
          <div style={s.pageSub}>3 medlemmer · 23 delte utgifter · totalt {fmtKrShort(SETTLE.total)}</div>
        </div>
        <div style={s.pageActions}>
          <button style={s.btnGhost}>Inviter</button>
          <button style={s.btnGhost}>Eksporter</button>
          <button style={s.btnPrimary}>Gjør opp nå</button>
        </div>
      </div>

      <div style={s.grid}>
        {/* Left: status hero + network */}
        <div style={s.leftCol}>
          <div style={s.statusCard}>
            <div style={s.statusKicker}>DIN STATUS</div>
            <div style={s.statusBig}>
              <span style={s.statusVerb}>Du får</span>
              <span style={s.statusAmt}>+787,00 kr</span>
            </div>
            <div style={s.statusFrom}>
              <span style={{...s.miniAvatar, background: memberById('tobias').color}}>TK</span>
              <span>fra <b>Tobias K.</b></span>
            </div>
            <div style={s.statusActions}>
              <button style={s.btnSolid}>Send påminnelse</button>
              <button style={s.btnSubtle}>Marker som mottatt</button>
            </div>
          </div>

          <div style={s.netCard}>
            <div style={s.cardHead}>
              <div style={s.cardTitle}>Pengeflyt</div>
              <div style={s.cardSub}>Hvem skylder hvem — forenklet</div>
            </div>
            <svg viewBox="0 0 480 400" style={{width: '100%', display: 'block'}}>
              {/* arrows */}
              {SETTLE.transfers.map((t, i) => {
                const from = posById[t.from], to = posById[t.to];
                const dx = to.x - from.x, dy = to.y - from.y;
                const len = Math.hypot(dx, dy);
                const ux = dx / len, uy = dy / len;
                const pad = 38;
                const x0 = from.x + ux * pad, y0 = from.y + uy * pad;
                const x1 = to.x - ux * pad, y1 = to.y - uy * pad;
                // arrowhead
                const ah = 7;
                const px = -uy, py = ux;
                return (
                  <g key={i}>
                    <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="oklch(50% 0.08 160)" strokeWidth="2" />
                    <polygon
                      points={`${x1},${y1} ${x1 - ux*ah + px*ah*0.6},${y1 - uy*ah + py*ah*0.6} ${x1 - ux*ah - px*ah*0.6},${y1 - uy*ah - py*ah*0.6}`}
                      fill="oklch(50% 0.08 160)"
                    />
                    <g>
                      <rect x={(x0+x1)/2 - 32} y={(y0+y1)/2 - 11} width="64" height="22" rx="11" fill="oklch(98% 0.012 160)" stroke="oklch(88% 0.018 160)" />
                      <text x={(x0+x1)/2} y={(y0+y1)/2 + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="oklch(30% 0.04 160)" fontFamily="Inter">{fmtKrShort(t.amt)}</text>
                    </g>
                  </g>
                );
              })}
              {/* members */}
              {positions.map(p => {
                const bal = SETTLE.balances.find(b => b.id === p.id);
                return (
                  <g key={p.id}>
                    <circle cx={p.x} cy={p.y} r="36" fill={p.color} />
                    <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="14" fontWeight="600" fill="white" fontFamily="Inter">{p.short}</text>
                    <text x={p.x} y={p.y + 56} textAnchor="middle" fontSize="12" fontWeight="600" fill="oklch(22% 0.02 160)" fontFamily="Inter">{p.name.split(' ')[0]}{p.id === 'erlend' && ' (du)'}</text>
                    <text x={p.x} y={p.y + 71} textAnchor="middle" fontSize="11" fill={bal.delta >= 0 ? 'oklch(45% 0.1 145)' : 'oklch(50% 0.12 30)'} fontWeight="500" fontFamily="Inter">
                      {bal.delta >= 0 ? '+' : '−'}{fmtKrShort(bal.delta)}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div style={s.netFoot}>
              <span style={s.balanced}>● I balanse</span>
              <span style={s.netNote}>Forenklet til <b>2 overføringer</b> i stedet for 6</span>
            </div>
          </div>
        </div>

        {/* Right: per-member detail + activity */}
        <div style={s.rightCol}>
          <div style={s.memberCard}>
            <div style={s.cardHead}>
              <div style={s.cardTitle}>Per medlem</div>
              <div style={s.cardSub}>Hver andel: {fmtKr(SETTLE.total / 3)}</div>
            </div>
            <div style={s.memberList}>
              {SETTLE.members.map(m => {
                const bal = SETTLE.balances.find(b => b.id === m.id);
                const share = SETTLE.total / 3;
                const pos = bal.delta >= 0;
                const paidPct = (m.paid / Math.max(m.paid, share)) * 100;
                const sharePct = (share / Math.max(m.paid, share)) * 100;
                return (
                  <div key={m.id} style={s.memberRow}>
                    <div style={{...s.memberAvatar, background: m.color}}>{m.short}</div>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={s.memberTop}>
                        <span style={s.memberName}>{m.name}{m.id === 'erlend' && <span style={s.youTag}>du</span>}</span>
                        <span style={{...s.memberBal, color: pos ? 'oklch(45% 0.1 145)' : 'oklch(50% 0.12 30)'}}>
                          {pos ? '+' : '−'}{fmtKr(bal.delta)}
                        </span>
                      </div>
                      <div style={s.memberBars}>
                        <div style={s.memberBarRow}>
                          <span style={s.memberBarLabel}>Betalt</span>
                          <div style={s.memberBarTrack}><div style={{...s.memberBarFill, width: `${paidPct}%`, background: m.color}} /></div>
                          <span style={s.memberBarVal}>{fmtKrShort(m.paid)}</span>
                        </div>
                        <div style={s.memberBarRow}>
                          <span style={s.memberBarLabel}>Andel</span>
                          <div style={s.memberBarTrack}><div style={{...s.memberBarFill, width: `${sharePct}%`, background: 'oklch(85% 0.015 160)'}} /></div>
                          <span style={s.memberBarVal}>{fmtKrShort(share)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={s.activityCard}>
            <div style={s.cardHead}>
              <div style={s.cardTitle}>Aktivitet</div>
              <div style={s.cardSub}>Siste 7 dager</div>
            </div>
            <div style={s.activityList}>
              {SETTLE.recentSplits.map(sp => {
                const m = memberById(sp.payer);
                return (
                  <div key={sp.id} style={s.activityRow}>
                    <div style={s.activityDot}>
                      <div style={{...s.miniAvatar, background: m.color, width: 26, height: 26, fontSize: 10}}>{m.short}</div>
                    </div>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={s.activityText}>
                        <b>{m.name.split(' ')[0]}</b> la til <b>{sp.what}</b>
                      </div>
                      <div style={s.activityMeta}>{sp.date} · delt på {sp.split.replace(' personer', '')}</div>
                    </div>
                    <div style={s.activityAmt}>{fmtKr(sp.amt)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const sageSettleStyles = {
  root: { fontFamily: 'Inter, system-ui, sans-serif', background: 'oklch(97.5% 0.015 160)', color: 'oklch(22% 0.02 160)', padding: '20px 28px 32px', minHeight: '100%', fontSize: 14 },
  topbar: { display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18 },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  brandMark: { width: 30, height: 30, borderRadius: 8, background: 'oklch(50% 0.08 160)', color: 'oklch(98% 0.012 160)', display: 'grid', placeItems: 'center', fontSize: 16 },
  brandName: { fontWeight: 600, fontSize: 15.5, letterSpacing: '-0.01em' },
  nav: { display: 'flex', gap: 2, marginLeft: 'auto', marginRight: 'auto', background: 'oklch(99% 0.008 160)', border: '1px solid oklch(92% 0.012 160)', borderRadius: 10, padding: 3 },
  navBtn: { background: 'none', border: 'none', padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, color: 'oklch(45% 0.02 160)', cursor: 'pointer', fontFamily: 'inherit' },
  navOn: { background: 'oklch(94% 0.025 160)', color: 'oklch(28% 0.05 160)' },
  topActions: { display: 'flex', alignItems: 'center', gap: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 9, background: 'oklch(99% 0.008 160)', border: '1px solid oklch(92% 0.012 160)', fontSize: 15, cursor: 'pointer', color: 'oklch(40% 0.02 160)' },
  avatar: { width: 34, height: 34, borderRadius: '50%', background: 'oklch(60% 0.08 160)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 600 },

  // Settlement strip
  settleStrip: {
    background: 'oklch(99.5% 0.006 160)',
    border: '1px solid oklch(90% 0.018 160)',
    borderRadius: 16, padding: '14px 18px',
    marginBottom: 14,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    gap: 22,
    alignItems: 'center',
  },
  settleLeft: { minWidth: 220 },
  settleHeader: { display: 'flex', alignItems: 'center', gap: 8 },
  settleDot: { width: 8, height: 8, borderRadius: '50%', background: 'oklch(50% 0.08 160)' },
  settleName: { fontWeight: 600, fontSize: 14 },
  settleSub: { fontSize: 12, color: 'oklch(50% 0.02 160)' },
  settleCaret: { fontSize: 11, color: 'oklch(50% 0.02 160)', marginLeft: 'auto' },
  settleStatus: { fontSize: 13, color: 'oklch(38% 0.02 160)', marginTop: 6 },
  posAmount: { color: 'oklch(45% 0.1 145)', fontWeight: 600 },

  memberChips: { display: 'flex', gap: 10 },
  chip: { flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'oklch(97.5% 0.015 160)', border: '1px solid oklch(92% 0.012 160)', borderRadius: 12, padding: '8px 12px' },
  chipAvatar: { width: 32, height: 32, borderRadius: '50%', color: 'white', display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 600, flex: '0 0 auto' },
  chipText: { flex: 1, minWidth: 0 },
  chipName: { fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  youTag: { fontSize: 9.5, fontWeight: 600, background: 'oklch(94% 0.025 160)', color: 'oklch(35% 0.06 160)', padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em' },
  chipPaid: { fontSize: 11, color: 'oklch(55% 0.02 160)', marginTop: 1 },
  chipBal: { fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },

  settleCta: { display: 'flex', alignItems: 'center', gap: 8, background: 'oklch(38% 0.06 160)', color: 'oklch(98% 0.012 160)', border: 'none', borderRadius: 11, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },

  // hero
  heroPanel: { display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, marginBottom: 14 },
  heroLeft: { background: 'linear-gradient(135deg, oklch(94% 0.03 160), oklch(96% 0.018 160))', border: '1px solid oklch(90% 0.018 160)', borderRadius: 16, padding: '20px 22px' },
  heroLabel: { fontSize: 12.5, color: 'oklch(40% 0.03 160)', fontWeight: 500 },
  heroNum: { fontSize: 42, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 4, marginBottom: 14, lineHeight: 1, color: 'oklch(22% 0.02 160)' },
  heroProgress: {},
  stackedBar: { display: 'flex', height: 12, borderRadius: 999, overflow: 'hidden', background: 'oklch(92% 0.018 160)' },
  stackedSeg: { height: '100%' },
  barLegend: { display: 'flex', gap: 14, marginTop: 10, fontSize: 11.5, color: 'oklch(40% 0.025 160)' },
  barLegendItem: { display: 'flex', alignItems: 'center', gap: 6 },
  barLegendDot: { width: 8, height: 8, borderRadius: 2.5 },

  heroRight: { display: 'flex', flexDirection: 'column', gap: 12 },
  budgetCard: { background: 'oklch(99.5% 0.006 160)', border: '1px solid oklch(92% 0.012 160)', borderRadius: 14, padding: '14px 16px' },
  budgetTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  budgetLabel: { fontSize: 12, color: 'oklch(50% 0.02 160)', fontWeight: 500 },
  budgetPct: { fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' },
  budgetTrack: { height: 6, background: 'oklch(94% 0.012 160)', borderRadius: 999, marginTop: 8, overflow: 'hidden' },
  budgetFill: { height: '100%', background: 'oklch(50% 0.08 160)', borderRadius: 999 },
  budgetFoot: { display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'oklch(50% 0.02 160)', marginTop: 8 },
  miniRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 },
  mini: { background: 'oklch(99.5% 0.006 160)', border: '1px solid oklch(92% 0.012 160)', borderRadius: 14, padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  miniLabel: { fontSize: 12, color: 'oklch(50% 0.02 160)' },
  miniVal: { fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 4 },

  // bottom
  bottomGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 },
  card: { background: 'oklch(99.5% 0.006 160)', border: '1px solid oklch(92% 0.012 160)', borderRadius: 16, padding: 20 },
  cardHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.01em' },
  cardSub: { fontSize: 12, color: 'oklch(55% 0.02 160)', marginTop: 2 },
  linkBtn: { background: 'none', border: 'none', color: 'oklch(45% 0.07 160)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },

  splitList: { display: 'flex', flexDirection: 'column' },
  splitRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid oklch(94% 0.012 160)' },
  splitAvatar: { width: 32, height: 32, borderRadius: '50%', color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, flex: '0 0 auto' },
  splitWhat: { fontSize: 13.5, fontWeight: 500 },
  splitMeta: { fontSize: 11.5, color: 'oklch(50% 0.02 160)', marginTop: 2 },
  splitAmt: { fontSize: 13.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  splitPer: { fontSize: 11, color: 'oklch(50% 0.02 160)', marginTop: 2 },

  addBtn: { width: '100%', marginTop: 12, padding: '9px 14px', background: 'oklch(95% 0.025 160)', color: 'oklch(35% 0.06 160)', border: '1px dashed oklch(75% 0.04 160)', borderRadius: 10, fontWeight: 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },

  catList: { display: 'flex', flexDirection: 'column', gap: 12 },
  catRow: {},
  catTop: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 },
  catSwatch: { width: 10, height: 10, borderRadius: 3, flex: '0 0 auto' },
  catName: { flex: 1, fontSize: 12.5 },
  catAmt: { fontSize: 12.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  catTrack: { height: 5, background: 'oklch(94% 0.012 160)', borderRadius: 999, overflow: 'hidden' },
  catFill: { height: '100%', borderRadius: 999 },
};

const settleDetailStyles = {
  root: { fontFamily: 'Inter, system-ui, sans-serif', background: 'oklch(97.5% 0.015 160)', color: 'oklch(22% 0.02 160)', padding: '20px 32px 36px', minHeight: '100%', fontSize: 14 },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  brandMark: { width: 28, height: 28, borderRadius: 7, background: 'oklch(50% 0.08 160)', color: 'oklch(98% 0.012 160)', display: 'grid', placeItems: 'center', fontSize: 15 },
  brandName: { fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.01em' },
  crumb: { color: 'oklch(70% 0.015 160)' },
  crumbActive: { fontSize: 14, color: 'oklch(28% 0.04 160)', fontWeight: 500 },
  topActions: { display: 'flex', alignItems: 'center', gap: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 9, background: 'oklch(99% 0.008 160)', border: '1px solid oklch(92% 0.012 160)', fontSize: 15, cursor: 'pointer', color: 'oklch(40% 0.02 160)' },
  avatar: { width: 34, height: 34, borderRadius: '50%', background: 'oklch(60% 0.08 160)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 600 },

  pageHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid oklch(90% 0.018 160)' },
  pageKicker: { fontSize: 10.5, letterSpacing: '0.2em', fontWeight: 600, color: 'oklch(45% 0.04 160)' },
  pageTitle: { fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', margin: '4px 0 6px', lineHeight: 1 },
  pageSub: { fontSize: 13, color: 'oklch(45% 0.025 160)' },
  pageActions: { display: 'flex', gap: 8, paddingBottom: 4 },
  btnGhost: { background: 'oklch(99.5% 0.006 160)', border: '1px solid oklch(90% 0.018 160)', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 500, color: 'oklch(28% 0.04 160)', cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary: { background: 'oklch(38% 0.06 160)', color: 'oklch(98% 0.012 160)', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },

  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 14 },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 14 },

  statusCard: { background: 'linear-gradient(135deg, oklch(92% 0.05 160), oklch(96% 0.018 160))', border: '1px solid oklch(88% 0.025 160)', borderRadius: 16, padding: '22px 24px' },
  statusKicker: { fontSize: 10.5, letterSpacing: '0.18em', fontWeight: 600, color: 'oklch(40% 0.05 160)' },
  statusBig: { display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8 },
  statusVerb: { fontSize: 15, color: 'oklch(35% 0.04 160)' },
  statusAmt: { fontSize: 40, fontWeight: 500, letterSpacing: '-0.03em', color: 'oklch(35% 0.1 145)', fontVariantNumeric: 'tabular-nums' },
  statusFrom: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'oklch(35% 0.04 160)', marginTop: 10 },
  miniAvatar: { width: 22, height: 22, borderRadius: '50%', color: 'white', display: 'grid', placeItems: 'center', fontSize: 9.5, fontWeight: 600 },
  statusActions: { display: 'flex', gap: 8, marginTop: 18 },
  btnSolid: { background: 'oklch(38% 0.06 160)', color: 'oklch(98% 0.012 160)', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnSubtle: { background: 'transparent', border: '1px solid oklch(80% 0.03 160)', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 500, color: 'oklch(32% 0.04 160)', cursor: 'pointer', fontFamily: 'inherit' },

  netCard: { background: 'oklch(99.5% 0.006 160)', border: '1px solid oklch(92% 0.012 160)', borderRadius: 16, padding: 20, flex: 1 },
  cardHead: { marginBottom: 6 },
  cardTitle: { fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.01em' },
  cardSub: { fontSize: 12, color: 'oklch(55% 0.02 160)', marginTop: 2 },
  netFoot: { display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'oklch(45% 0.025 160)', marginTop: 6, paddingTop: 10, borderTop: '1px solid oklch(94% 0.012 160)' },
  balanced: { color: 'oklch(45% 0.1 145)', fontWeight: 600 },
  netNote: {},

  memberCard: { background: 'oklch(99.5% 0.006 160)', border: '1px solid oklch(92% 0.012 160)', borderRadius: 16, padding: 20 },
  memberList: { display: 'flex', flexDirection: 'column', gap: 14, marginTop: 6 },
  memberRow: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  memberAvatar: { width: 38, height: 38, borderRadius: '50%', color: 'white', display: 'grid', placeItems: 'center', fontSize: 12.5, fontWeight: 600, flex: '0 0 auto' },
  memberTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  memberName: { fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 },
  memberBal: { fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  youTag: { fontSize: 9.5, fontWeight: 600, background: 'oklch(94% 0.025 160)', color: 'oklch(35% 0.06 160)', padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em' },
  memberBars: { display: 'flex', flexDirection: 'column', gap: 5 },
  memberBarRow: { display: 'grid', gridTemplateColumns: '60px 1fr 80px', gap: 10, alignItems: 'center' },
  memberBarLabel: { fontSize: 11.5, color: 'oklch(50% 0.02 160)' },
  memberBarTrack: { height: 6, background: 'oklch(94% 0.012 160)', borderRadius: 999, overflow: 'hidden' },
  memberBarFill: { height: '100%', borderRadius: 999 },
  memberBarVal: { fontSize: 11.5, fontVariantNumeric: 'tabular-nums', textAlign: 'right', fontWeight: 500 },

  activityCard: { background: 'oklch(99.5% 0.006 160)', border: '1px solid oklch(92% 0.012 160)', borderRadius: 16, padding: 20, flex: 1 },
  activityList: { display: 'flex', flexDirection: 'column', marginTop: 6 },
  activityRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: '1px solid oklch(94% 0.012 160)' },
  activityDot: { flex: '0 0 auto' },
  activityText: { fontSize: 13 },
  activityMeta: { fontSize: 11.5, color: 'oklch(50% 0.02 160)', marginTop: 2 },
  activityAmt: { fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
};

Object.assign(window, { VariantSageSettle, VariantSettleDetail, SETTLE, memberById, fmtKr, fmtKrShort });
