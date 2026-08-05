// D² sub-pages — pages accessible from the sidebar nav
// Shares a sidebar shell across: Kvitteringer, Oppgjør, Kategorier, Rapporter, Ny kvittering

const { SETTLE: SX, memberById: memX, fmtKr: fX, fmtKrShort: fXs } = window;

// ============================================================================
// Shared shell: sidebar + topbar + page container
// ============================================================================
function D2Shell({ active, kicker, title, sub, actions, children, search = 'Søk…' }) {
  const c = d2 ;
  return (
    <div style={c.root}>
      <aside style={c.sidebar}>
        <div style={c.sbBrand}>
          <div style={c.sbMark}>B</div>
          <span style={c.sbName}>BudgetBandz</span>
        </div>
        <div>
          <div style={c.sbLabel}>OPPGJØR</div>
          <button style={c.sbAccount}>
            <span style={c.sbAccDot} />
            <span style={{flex: 1, textAlign: 'left'}}>Husholdning</span>
            <span style={c.sbCaret}>▾</span>
          </button>
          <div style={c.sbMembers}>
            {SX.members.map(m => (
              <div key={m.id} style={c.sbMemberRow}>
                <div style={{...c.sbMemberAvatar, background: m.color}}>{m.short}</div>
                <span style={c.sbMemberName}>{m.name.split(' ')[0]}</span>
                <span style={{...c.sbMemberBal, color: SX.balances.find(b => b.id === m.id).delta >= 0 ? 'oklch(45% 0.1 145)' : 'oklch(55% 0.12 30)'}}>
                  {SX.balances.find(b => b.id === m.id).delta >= 0 ? '+' : '−'}{Math.abs(SX.balances.find(b => b.id === m.id).delta)}
                </span>
              </div>
            ))}
            <button style={c.sbInvite}>+ Inviter medlem</button>
          </div>
        </div>
        <nav style={c.sbNav}>
          <NavItem icon="grid"  active={active === 'oversikt'}>Oversikt</NavItem>
          <NavItem icon="list"  active={active === 'kvitteringer'} badge="23">Kvitteringer</NavItem>
          <NavItem icon="users" active={active === 'oppgjor'} badge="2" badgeAccent>Oppgjør</NavItem>
          <NavItem icon="chart" active={active === 'kategorier'}>Kategorier</NavItem>
          <NavItem icon="trend" active={active === 'rapporter'}>Rapporter</NavItem>
        </nav>
        <div style={c.sbFoot}>
          <button style={c.sbProfile}>
            <div style={c.sbAvatar}>EH</div>
            <div style={{flex: 1, textAlign: 'left'}}>
              <div style={c.sbProfName}>Erlend H.</div>
              <div style={c.sbProfSub}>Innstillinger</div>
            </div>
          </button>
        </div>
      </aside>

      <main style={c.main}>
        <div style={c.mainTop}>
          <div>
            <div style={c.mainKicker}>{kicker}</div>
            <h1 style={c.mainTitle}>{title}</h1>
            {sub && <div style={c.mainSub}>{sub}</div>}
          </div>
          <div style={c.mainTopRight}>
            <div style={c.search}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg>
              <input placeholder={search} style={c.searchInput} />
              <span style={c.kbd}>⌘K</span>
            </div>
            {actions}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

function NavItem({ icon, active, badge, badgeAccent, children }) {
  const c = d2;
  return (
    <button style={{...c.sbItem, ...(active ? c.sbItemOn : {})}}>
      <SbiIco kind={icon} />
      <span>{children}</span>
      {badge && <span style={{...c.sbBadge, ...(badgeAccent ? c.sbBadgeAccent : {})}}>{badge}</span>}
    </button>
  );
}

function SbiIco({ kind }) {
  const p = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (kind === 'grid') return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
  if (kind === 'list') return <svg {...p}><path d="M4 6h16M4 12h16M4 18h10"/></svg>;
  if (kind === 'chart') return <svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>;
  if (kind === 'users') return <svg {...p}><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M22 18c0-2.5-2-4.5-4.5-4.5"/></svg>;
  if (kind === 'trend') return <svg {...p}><path d="M3 17l6-6 4 4 7-8"/><path d="M14 7h6v6"/></svg>;
  return null;
}

// ============================================================================
// PAGE: Kvitteringer (receipts)
// ============================================================================
const ALL_RECEIPTS = [
  { id: 1,  store: 'Rema 1000',      cat: 'Mat & drikke', amt: 487.50, date: '2026-05-14', payer: 'erlend', split: 3, items: 14, status: 'split' },
  { id: 2,  store: 'Vinmonopolet',   cat: 'Mat & drikke', amt: 329.00, date: '2026-05-12', payer: 'mia',    split: 3, items: 2,  status: 'split' },
  { id: 3,  store: 'Apotek 1',       cat: 'Helse',        amt: 218.40, date: '2026-05-11', payer: 'erlend', split: 1, items: 3,  status: 'solo' },
  { id: 4,  store: 'Circle K',       cat: 'Transport',    amt: 642.00, date: '2026-05-09', payer: 'tobias', split: 2, items: 1,  status: 'split' },
  { id: 5,  store: 'Strøm — april',  cat: 'Husholdning',  amt: 1240.00, date: '2026-05-08', payer: 'erlend', split: 3, items: 1,  status: 'split' },
  { id: 6,  store: 'Kiwi',           cat: 'Mat & drikke', amt: 412.80, date: '2026-05-07', payer: 'mia',    split: 3, items: 22, status: 'split' },
  { id: 7,  store: 'H&M',            cat: 'Klær',         amt: 599.00, date: '2026-05-04', payer: 'mia',    split: 1, items: 2,  status: 'solo' },
  { id: 8,  store: 'Rema 1000',      cat: 'Mat & drikke', amt: 234.20, date: '2026-05-03', payer: 'tobias', split: 3, items: 9,  status: 'split' },
  { id: 9,  store: 'Narvesen',       cat: 'Mat & drikke', amt: 78.50,  date: '2026-05-02', payer: 'erlend', split: 1, items: 2,  status: 'solo' },
  { id: 10, store: 'IKEA',           cat: 'Husholdning',  amt: 1490.00, date: '2026-05-01', payer: 'erlend', split: 3, items: 5,  status: 'split' },
];
const monthName = (d) => ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'][new Date(d).getMonth()];
const dayNum = (d) => new Date(d).getDate();

function PageReceipts() {
  const c = d2;
  return (
    <D2Shell
      active="kvitteringer"
      kicker="Husholdning · Mai 2026"
      title="Kvitteringer"
      sub="23 kvitteringer · 7 840,00 kr totalt · 6 nye denne uken"
      search="Søk i 23 kvitteringer…"
      actions={
        <>
          <button style={c.btnGhost}>Filter</button>
          <button style={c.btnGhost}>Eksporter</button>
          <button style={c.btnPrimary}>+ Ny kvittering</button>
        </>
      }
    >
      {/* Filter chips */}
      <div style={c.chipRow}>
        <div style={c.chipGroup}>
          <button style={{...c.chip, ...c.chipOn}}>Alle <span style={c.chipCount}>23</span></button>
          <button style={c.chip}>Delt <span style={c.chipCount}>17</span></button>
          <button style={c.chip}>Solo <span style={c.chipCount}>6</span></button>
          <button style={c.chip}>Trenger gjennomgang <span style={c.chipCount}>2</span></button>
        </div>
        <div style={c.chipRight}>
          <button style={c.chipPlain}>Mai 2026 ▾</button>
          <button style={c.chipPlain}>Alle medlemmer ▾</button>
          <button style={c.chipPlain}>Alle kategorier ▾</button>
        </div>
      </div>

      {/* List grouped by date */}
      <div style={c.receiptsList}>
        {Object.entries(ALL_RECEIPTS.reduce((acc, r) => {
          (acc[r.date] = acc[r.date] || []).push(r);
          return acc;
        }, {})).map(([date, items]) => (
          <div key={date}>
            <div style={c.dateHeader}>
              <div style={c.dateLeft}>
                <span style={c.dateDay}>{dayNum(date)}</span>
                <div>
                  <div style={c.dateMonth}>{monthName(date)} 2026</div>
                  <div style={c.dateSub}>{items.length} kvittering{items.length > 1 ? 'er' : ''}</div>
                </div>
              </div>
              <div style={c.dateSum}>{fX(items.reduce((s, x) => s + x.amt, 0))}</div>
            </div>
            <div style={c.receiptRows}>
              {items.map(r => {
                const m = memX(r.payer);
                return (
                  <div key={r.id} style={c.receiptRow}>
                    <div style={c.thumb}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="oklch(55% 0.015 240)" strokeWidth="1.5"><path d="M5 4h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM8 9h8M8 13h8M8 17h5"/></svg>
                    </div>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={c.rTitle}>{r.store}</div>
                      <div style={c.rSub}>{r.items} varer · {r.cat}</div>
                    </div>
                    <div style={c.payerCell}>
                      <div style={{...c.payerAvatar, background: m.color}}>{m.short}</div>
                      <span style={c.payerName}>{m.name.split(' ')[0]} betalte</span>
                    </div>
                    <div style={c.splitCell}>
                      {r.status === 'split' ? (
                        <span style={c.tagSplit}>Delt · {r.split} pers</span>
                      ) : (
                        <span style={c.tagSolo}>Solo</span>
                      )}
                    </div>
                    <div style={c.amtCell}>
                      <div style={c.amtBig}>{fX(r.amt)}</div>
                      {r.status === 'split' && <div style={c.amtPer}>{fXs(r.amt / r.split)} hver</div>}
                    </div>
                    <button style={c.rowAction}>›</button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </D2Shell>
  );
}

// ============================================================================
// PAGE: Oppgjør (full settlement page)
// ============================================================================
function PageOppgjor() {
  const c = d2;
  // money flow
  const cx = 200, cy = 180, r = 110;
  const positions = SX.members.map((m, i) => {
    const angle = (-Math.PI / 2) + (i / SX.members.length) * Math.PI * 2;
    return { ...m, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  const posById = Object.fromEntries(positions.map(p => [p.id, p]));

  return (
    <D2Shell
      active="oppgjor"
      kicker="Husholdning · Mai 2026"
      title="Oppgjør"
      sub="Du får 787,00 kr tilbake · forenklet til 2 overføringer"
      actions={
        <>
          <button style={c.btnGhost}>Tidligere oppgjør</button>
          <button style={c.btnPrimary}>Marker som gjort opp</button>
        </>
      }
    >
      <div style={c.oppgjor2col}>
        {/* Left col */}
        <div>
          <div style={c.statusHero}>
            <div style={c.statusKicker}>DIN STATUS</div>
            <div style={c.statusBigRow}>
              <div>
                <div style={c.statusVerb}>Du får</div>
                <div style={c.statusAmt}>+787,00 kr</div>
              </div>
              <div style={c.statusBreakdown}>
                <div style={c.statusItem}>
                  <span style={c.statusItemLabel}>Du har betalt</span>
                  <span style={c.statusItemVal}>3 400,00</span>
                </div>
                <div style={c.statusItem}>
                  <span style={c.statusItemLabel}>Din andel</span>
                  <span style={c.statusItemVal}>2 613,33</span>
                </div>
                <div style={{...c.statusItem, borderTop: '1px solid oklch(85% 0.04 145)', paddingTop: 10, marginTop: 6}}>
                  <span style={{...c.statusItemLabel, color: 'oklch(35% 0.08 145)', fontWeight: 600}}>Du får tilbake</span>
                  <span style={{...c.statusItemVal, color: 'oklch(35% 0.1 145)', fontWeight: 600}}>+787,00</span>
                </div>
              </div>
            </div>
            <div style={c.statusActions}>
              <button style={c.btnPrimary}>Send påminnelse til Tobias</button>
              <button style={c.btnGhost}>Marker som mottatt</button>
            </div>
          </div>

          <div style={c.panel}>
            <div style={c.panelHead}>
              <div>
                <div style={c.panelTitle}>Pengeflyt</div>
                <div style={c.panelSub}>Forenklet fra 6 til 2 overføringer</div>
              </div>
            </div>
            <svg viewBox="0 0 400 380" style={{width: '100%', display: 'block', maxHeight: 360}}>
              {SX.transfers.map((t, i) => {
                const from = posById[t.from], to = posById[t.to];
                const dx = to.x - from.x, dy = to.y - from.y;
                const len = Math.hypot(dx, dy);
                const ux = dx / len, uy = dy / len;
                const pad = 36;
                const x0 = from.x + ux * pad, y0 = from.y + uy * pad;
                const x1 = to.x - ux * pad, y1 = to.y - uy * pad;
                const ah = 7;
                const px = -uy, py = ux;
                return (
                  <g key={i}>
                    <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="oklch(55% 0.08 240)" strokeWidth="2" />
                    <polygon points={`${x1},${y1} ${x1 - ux*ah + px*ah*0.6},${y1 - uy*ah + py*ah*0.6} ${x1 - ux*ah - px*ah*0.6},${y1 - uy*ah - py*ah*0.6}`} fill="oklch(55% 0.08 240)" />
                    <rect x={(x0+x1)/2 - 30} y={(y0+y1)/2 - 11} width="60" height="22" rx="11" fill="oklch(99.5% 0.003 240)" stroke="oklch(91% 0.018 240)" />
                    <text x={(x0+x1)/2} y={(y0+y1)/2 + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="oklch(30% 0.04 240)" fontFamily="Inter">{fXs(t.amt)}</text>
                  </g>
                );
              })}
              {positions.map(p => {
                const bal = SX.balances.find(b => b.id === p.id);
                return (
                  <g key={p.id}>
                    <circle cx={p.x} cy={p.y} r="34" fill={p.color} />
                    <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="14" fontWeight="600" fill="white" fontFamily="Inter">{p.short}</text>
                    <text x={p.x} y={p.y + 52} textAnchor="middle" fontSize="12" fontWeight="600" fill="oklch(22% 0.02 240)" fontFamily="Inter">{p.name.split(' ')[0]}{p.id === 'erlend' && ' (du)'}</text>
                    <text x={p.x} y={p.y + 67} textAnchor="middle" fontSize="11" fill={bal.delta >= 0 ? 'oklch(45% 0.1 145)' : 'oklch(50% 0.12 30)'} fontWeight="500" fontFamily="Inter">
                      {bal.delta >= 0 ? '+' : '−'}{fXs(bal.delta)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right col */}
        <div>
          <div style={c.panel}>
            <div style={c.panelHead}>
              <div>
                <div style={c.panelTitle}>Per medlem</div>
                <div style={c.panelSub}>Hver andel: 2 613,33 kr</div>
              </div>
            </div>
            <div style={c.memberList}>
              {SX.members.map(m => {
                const bal = SX.balances.find(b => b.id === m.id);
                const share = SX.total / 3;
                const pos = bal.delta >= 0;
                return (
                  <div key={m.id} style={c.memberRow}>
                    <div style={{...c.memberAvatar, background: m.color}}>{m.short}</div>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={c.memberTop}>
                        <span style={c.memberName}>{m.name}{m.id === 'erlend' && <span style={c.youTag}>du</span>}</span>
                        <span style={{...c.memberBal, color: pos ? 'oklch(45% 0.1 145)' : 'oklch(50% 0.12 30)'}}>
                          {pos ? '+' : '−'}{fX(bal.delta)}
                        </span>
                      </div>
                      <div style={c.memberBars}>
                        <div style={c.memberBarRow}>
                          <span style={c.memberBarLabel}>Betalt</span>
                          <div style={c.memberBarTrack}><div style={{...c.memberBarFill, width: `${Math.min((m.paid / 3500) * 100, 100)}%`, background: m.color}} /></div>
                          <span style={c.memberBarVal}>{fXs(m.paid)}</span>
                        </div>
                        <div style={c.memberBarRow}>
                          <span style={c.memberBarLabel}>Andel</span>
                          <div style={c.memberBarTrack}><div style={{...c.memberBarFill, width: `${(share / 3500) * 100}%`, background: 'oklch(85% 0.015 240)'}} /></div>
                          <span style={c.memberBarVal}>{fXs(share)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={c.panel}>
            <div style={c.panelHead}>
              <div>
                <div style={c.panelTitle}>Tidligere oppgjør</div>
                <div style={c.panelSub}>Siste 6 måneder</div>
              </div>
              <button style={c.linkBtn}>Alle →</button>
            </div>
            <div style={c.historyList}>
              {[
                { month: 'April 2026',    total: 8200, transfers: 3, settled: '2. mai' },
                { month: 'Mars 2026',     total: 6800, transfers: 2, settled: '1. apr' },
                { month: 'Februar 2026',  total: 7300, transfers: 2, settled: '3. mar' },
                { month: 'Januar 2026',   total: 6100, transfers: 2, settled: '1. feb' },
              ].map((h, i) => (
                <div key={i} style={c.historyRow}>
                  <div style={c.historyCheck}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 12l5 5 9-11"/></svg>
                  </div>
                  <div style={{flex: 1}}>
                    <div style={c.historyMonth}>{h.month}</div>
                    <div style={c.historySub}>Gjort opp {h.settled} · {h.transfers} overføringer</div>
                  </div>
                  <div style={c.historyAmt}>{fXs(h.total)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </D2Shell>
  );
}

// ============================================================================
// PAGE: Kategorier (categories)
// ============================================================================
// palette: low-chroma green→blue range, "see-through" feel
const CATS = [
  { name: 'Mat & drikke',  amt: 3420, budget: 5000, count: 12, trend: +12, color: 'oklch(72% 0.06 160)', sub: ['Dagligvarer · 2 980', 'Restaurant · 320', 'Take-away · 120'] },
  { name: 'Transport',     amt: 1680, budget: 2000, count:  4, trend:  -3, color: 'oklch(74% 0.05 200)', sub: ['Drivstoff · 1 200', 'Parkering · 280', 'Kollektiv · 200'] },
  { name: 'Husholdning',   amt: 1240, budget: 1800, count:  3, trend:  -8, color: 'oklch(74% 0.06 240)', sub: ['Strøm · 1 240'] },
  { name: 'Klær',          amt:  860, budget: 1000, count:  2, trend: +24, color: 'oklch(76% 0.05 270)', sub: ['H&M · 599', 'Sko · 261'] },
  { name: 'Helse',         amt:  640, budget:  800, count:  3, trend:  +5, color: 'oklch(74% 0.07 180)', sub: ['Apotek · 420', 'Tannlege · 220'] },
  { name: 'Underholdning', amt:    0, budget:  600, count:  0, trend:   0, color: 'oklch(76% 0.05 220)', sub: [] },
];

function PageKategorier() {
  const c = d2;
  return (
    <D2Shell
      active="kategorier"
      kicker="Husholdning · Mai 2026"
      title="Kategorier"
      sub="6 kategorier · 7 840,00 kr brukt av 11 200 kr budsjett"
      actions={<><button style={c.btnGhost}>Sorter ▾</button><button style={c.btnPrimary}>+ Ny kategori</button></>}
    >
      {/* Top: stacked bar overview */}
      <div style={c.panel}>
        <div style={c.panelHead}>
          <div>
            <div style={c.panelTitle}>Fordeling</div>
            <div style={c.panelSub}>Mai 2026 · prosent av totalt forbruk</div>
          </div>
        </div>
        <div style={c.overviewBar}>
          {CATS.filter(c => c.amt > 0).map(cat => (
            <div key={cat.name} style={{...c.overviewSeg, width: `${(cat.amt / 7840) * 100}%`, background: cat.color}}>
              <span style={c.overviewSegLabel}>{cat.name}</span>
              <span style={c.overviewSegPct}>{Math.round((cat.amt / 7840) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category cards */}
      <div style={c.catGrid}>
        {CATS.map(cat => {
          const pct = (cat.amt / cat.budget) * 100;
          const over = pct > 100;
          return (
            <div key={cat.name} style={c.catCard}>
              <div style={c.catCardTop}>
                <div style={{...c.catSwatch, background: cat.color}} />
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={c.catCardName}>{cat.name}</div>
                  <div style={c.catCardCount}>{cat.count} kvittering{cat.count !== 1 ? 'er' : ''}</div>
                </div>
                {cat.trend !== 0 && (
                  <div style={{...c.catTrend, color: cat.trend > 0 ? 'oklch(50% 0.1 30)' : 'oklch(48% 0.08 145)'}}>
                    {cat.trend > 0 ? '↑' : '↓'} {Math.abs(cat.trend)}%
                  </div>
                )}
              </div>
              <div style={c.catCardAmt}>
                {fXs(cat.amt)} <span style={c.catCardOf}>av {fXs(cat.budget)}</span>
              </div>
              <div style={c.catBudgetTrack}>
                <div style={{...c.catBudgetFill, width: `${Math.min(pct, 100)}%`, background: over ? 'oklch(55% 0.12 30)' : cat.color}} />
                {pct >= 80 && pct <= 100 && <div style={c.catBudgetWarn}>⚠</div>}
              </div>
              <div style={c.catCardFoot}>
                <span>{pct.toFixed(0)} % brukt</span>
                <span>{fXs(Math.max(cat.budget - cat.amt, 0))} igjen</span>
              </div>
              {cat.sub.length > 0 && (
                <div style={c.catSubList}>
                  {cat.sub.map((s, i) => <div key={i} style={c.catSubItem}>{s}</div>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </D2Shell>
  );
}

// ============================================================================
// PAGE: Rapporter (reports)
// ============================================================================
function PageRapporter() {
  const c = d2;
  return (
    <D2Shell
      active="rapporter"
      kicker="Husholdning"
      title="Rapporter"
      sub="Innsikt i forbruksvaner og trender"
      actions={
        <>
          <div style={c.dateRange}>
            <button style={c.dateRangeBtn}>Des 2025</button>
            <span style={c.dateRangeArrow}>→</span>
            <button style={c.dateRangeBtn}>Mai 2026</button>
          </div>
          <button style={c.btnGhost}>Eksporter PDF</button>
        </>
      }
    >
      {/* KPI strip */}
      <div style={c.kpiStrip}>
        <div style={c.kpi}>
          <div style={c.kpiLabel}>Snitt per måned</div>
          <div style={c.kpiVal}>6 925 <span style={c.kpiUnit}>kr</span></div>
          <div style={c.kpiDelta}>siste 6 måneder</div>
        </div>
        <div style={c.kpi}>
          <div style={c.kpiLabel}>Høyeste måned</div>
          <div style={c.kpiVal}>8 200 <span style={c.kpiUnit}>kr</span></div>
          <div style={c.kpiDelta}>April 2026</div>
        </div>
        <div style={c.kpi}>
          <div style={c.kpiLabel}>Mest brukt</div>
          <div style={c.kpiVal}>Mat <span style={c.kpiUnit}>& drikke</span></div>
          <div style={c.kpiDelta}>44 % av totalt</div>
        </div>
        <div style={c.kpi}>
          <div style={c.kpiLabel}>Spart vs. budsjett</div>
          <div style={c.kpiVal}>+12 480 <span style={c.kpiUnit}>kr</span></div>
          <div style={c.kpiDelta}>over 6 måneder</div>
        </div>
      </div>

      {/* Trend chart full width */}
      <div style={c.panel}>
        <div style={c.panelHead}>
          <div>
            <div style={c.panelTitle}>Månedlig forbruk</div>
            <div style={c.panelSub}>Stablet etter kategori · des 2025 → mai 2026</div>
          </div>
          <div style={c.tabRow}>
            <button style={{...c.tab, ...c.tabOn}}>Stablet</button>
            <button style={c.tab}>Linje</button>
            <button style={c.tab}>Andel</button>
          </div>
        </div>
        <BigBarChart />
      </div>

      {/* Two col */}
      <div style={c.twoCol}>
        <div style={c.panel}>
          <div style={c.panelHead}>
            <div>
              <div style={c.panelTitle}>Kategori over tid</div>
              <div style={c.panelSub}>Topp 5 · siste 6 måneder</div>
            </div>
          </div>
          <CategoryLines />
        </div>

        <div style={c.panel}>
          <div style={c.panelHead}>
            <div>
              <div style={c.panelTitle}>Medlems-bidrag</div>
              <div style={c.panelSub}>Hvem betaler hva</div>
            </div>
          </div>
          <div style={c.memberContribList}>
            {SX.members.map(m => {
              const monthly = [
                { l: 'Des', v: m.paid * 0.7 + Math.random() * 200 },
                { l: 'Jan', v: m.paid * 0.8 + Math.random() * 200 },
                { l: 'Feb', v: m.paid * 0.95 + Math.random() * 200 },
                { l: 'Mar', v: m.paid * 0.85 + Math.random() * 200 },
                { l: 'Apr', v: m.paid * 1.05 + Math.random() * 200 },
                { l: 'Mai', v: m.paid },
              ];
              const max = 3800;
              return (
                <div key={m.id} style={c.contribRow}>
                  <div style={{...c.contribAvatar, background: m.color}}>{m.short}</div>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={c.contribTop}>
                      <span style={c.contribName}>{m.name}</span>
                      <span style={c.contribTotal}>{fXs(m.paid * 6)}</span>
                    </div>
                    <div style={c.contribBars}>
                      {monthly.map((mo, i) => (
                        <div key={i} style={c.contribCol}>
                          <div style={{...c.contribBar, height: `${(mo.v / max) * 100}%`, background: m.color}} />
                          <span style={c.contribLabel}>{mo.l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </D2Shell>
  );
}

function BigBarChart() {
  const data = [
    { label: 'Des', mat: 2200, transport: 900, hus: 1100, klær: 400, andre: 600 },
    { label: 'Jan', mat: 2600, transport: 1200, hus: 1000, klær: 500, andre: 800 },
    { label: 'Feb', mat: 3100, transport: 1600, hus: 1200, klær: 600, andre: 800 },
    { label: 'Mar', mat: 2900, transport: 1400, hus: 1100, klær: 700, andre: 700 },
    { label: 'Apr', mat: 3400, transport: 1800, hus: 1300, klær: 900, andre: 800 },
    { label: 'Mai', mat: 3420, transport: 1680, hus: 1240, klær: 860, andre: 640 },
  ];
  const colors = ['#7a9b7a','#9b937a','#7a8d9b','#a87a9b','#b8967a'];
  const keys = ['mat','transport','hus','klær','andre'];
  const max = 9500;
  const W = 800, H = 220, pad = 28, bw = 40;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 28}`} style={{width: '100%', display: 'block'}} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75, 1].map((p, i) => (
          <g key={i}>
            <line x1={pad} x2={W - pad} y1={H - p * (H - pad)} y2={H - p * (H - pad)} stroke="oklch(93% 0.005 240)" strokeWidth="1" />
            <text x={pad - 6} y={H - p * (H - pad) + 3} fontSize="10" fill="oklch(55% 0.015 240)" textAnchor="end" fontFamily="Inter">{(max * p / 1000).toFixed(0)}k</text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = pad + 40 + i * ((W - pad * 2 - 80) / (data.length - 1));
          let acc = 0;
          return (
            <g key={i}>
              {keys.map((k, j) => {
                const h = (d[k] / max) * (H - pad);
                const y = H - acc - h;
                acc += h;
                return <rect key={k} x={cx - bw/2} y={y} width={bw} height={h} fill={colors[j]} stroke="oklch(98% 0.005 240)" strokeWidth="0.5" />;
              })}
              <text x={cx} y={H + 18} textAnchor="middle" fontSize="11" fill="oklch(45% 0.015 240)" fontFamily="Inter" fontWeight={i === data.length - 1 ? 600 : 400}>{d.label}</text>
            </g>
          );
        })}
      </svg>
      <div style={{display: 'flex', gap: 14, marginTop: 14, fontSize: 12, color: 'oklch(45% 0.015 240)', flexWrap: 'wrap'}}>
        {[['Mat & drikke', colors[0]], ['Transport', colors[1]], ['Husholdning', colors[2]], ['Klær', colors[3]], ['Andre', colors[4]]].map(([n, col]) => (
          <span key={n} style={{display: 'flex', alignItems: 'center', gap: 7}}><i style={{width: 10, height: 10, borderRadius: 3, background: col}} />{n}</span>
        ))}
      </div>
    </div>
  );
}

function CategoryLines() {
  const cats = [
    { name: 'Mat & drikke',  color: '#7a9b7a', series: [2200, 2600, 3100, 2900, 3400, 3420] },
    { name: 'Transport',     color: '#9b937a', series: [900, 1200, 1600, 1400, 1800, 1680] },
    { name: 'Husholdning',   color: '#7a8d9b', series: [1100, 1000, 1200, 1100, 1300, 1240] },
    { name: 'Klær',          color: '#a87a9b', series: [400, 500, 600, 700, 900, 860] },
    { name: 'Helse',         color: '#b8967a', series: [350, 420, 380, 500, 650, 640] },
  ];
  const W = 420, H = 200, pad = 24;
  const max = 4000;
  const months = ['Des','Jan','Feb','Mar','Apr','Mai'];
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} style={{width: '100%', display: 'block'}}>
        {[0.25, 0.5, 0.75, 1].map((p, i) => (
          <line key={i} x1={pad} x2={W - pad} y1={H - p * (H - pad)} y2={H - p * (H - pad)} stroke="oklch(93% 0.005 240)" strokeWidth="1" />
        ))}
        {cats.map(cat => {
          const pts = cat.series.map((v, i) => [pad + (i * (W - pad * 2)) / (cat.series.length - 1), H - (v / max) * (H - pad)]);
          const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
          return (
            <g key={cat.name}>
              <path d={path} fill="none" stroke={cat.color} strokeWidth="1.8" strokeLinejoin="round" />
              <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3.5" fill={cat.color} />
            </g>
          );
        })}
        {months.map((m, i) => (
          <text key={m} x={pad + (i * (W - pad * 2)) / (months.length - 1)} y={H + 16} textAnchor="middle" fontSize="10.5" fill="oklch(45% 0.015 240)" fontFamily="Inter">{m}</text>
        ))}
      </svg>
      <div style={{display: 'flex', gap: 12, marginTop: 10, fontSize: 11.5, color: 'oklch(45% 0.015 240)', flexWrap: 'wrap'}}>
        {cats.map(cat => (
          <span key={cat.name} style={{display: 'flex', alignItems: 'center', gap: 6}}><i style={{width: 9, height: 9, borderRadius: '50%', background: cat.color}} />{cat.name}</span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// PAGE: Ny kvittering (scan/upload + edit)
// ============================================================================
function PageNyKvittering() {
  const c = d2;
  return (
    <D2Shell
      active="oversikt"
      kicker="Husholdning › Kvitteringer › Ny"
      title="Ny kvittering"
      sub="Skannet 14. mai 2026 · Rema 1000 oppdaget"
      actions={
        <>
          <button style={c.btnGhost}>Avbryt</button>
          <button style={c.btnPrimary}>Lagre kvittering</button>
        </>
      }
    >
      <div style={c.scanLayout}>
        {/* Left: receipt preview */}
        <div style={c.scanPreview}>
          <div style={c.scanPreviewLabel}>SKANNET BILDE</div>
          <div style={c.receiptPaper}>
            <div style={c.rpStore}>REMA 1000</div>
            <div style={c.rpAddress}>Storgata 14, 0184 Oslo</div>
            <div style={c.rpDate}>14.05.2026  17:42</div>
            <div style={c.rpDivider} />
            {[
              ['Brød grovt 750g', '34,90'],
              ['Melk lett 1L', '24,50'],
              ['Tine Yoghurt 4pk', '52,00'],
              ['Banan ca. 1kg', '28,40'],
              ['Tomat 500g', '34,90'],
              ['Salat Iceberg', '22,90'],
              ['Kylling filét', '89,90'],
              ['Pasta penne 500g', '21,90'],
              ['Olivenolje 500ml', '78,50'],
              ['Egg 12pk', '52,00'],
              ['Smør 500g', '49,90'],
              ['Kaffe Friele 250g', '64,90'],
              ['Sjokolade Freia', '32,90'],
            ].map(([n, p], i) => (
              <div key={i} style={c.rpLine}>
                <span>{n}</span>
                <span style={{fontVariantNumeric: 'tabular-nums'}}>{p}</span>
              </div>
            ))}
            <div style={c.rpDivider} />
            <div style={{...c.rpLine, fontWeight: 700, fontSize: 12.5}}>
              <span>TOTALT</span>
              <span style={{fontVariantNumeric: 'tabular-nums'}}>487,50</span>
            </div>
            <div style={c.rpDivider} />
            <div style={c.rpFoot}>Vipps · ****1234 · Tusen takk!</div>
          </div>
          <div style={c.scanActions}>
            <button style={c.scanActionBtn}>↻ Skann på nytt</button>
            <button style={c.scanActionBtn}>↤ Last opp annet bilde</button>
          </div>
        </div>

        {/* Right: form */}
        <div style={c.scanForm}>
          <div style={c.confidenceBanner}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>
            <div style={{flex: 1}}>
              <div style={c.confTitle}>Lest med 98 % sikkerhet</div>
              <div style={c.confSub}>13 varer i 2 kategorier · vi har foreslått en deling</div>
            </div>
          </div>

          <div style={c.fieldRow}>
            <div style={c.field}>
              <label style={c.fieldLabel}>Butikk</label>
              <input style={c.fieldInput} defaultValue="Rema 1000" />
            </div>
            <div style={c.field}>
              <label style={c.fieldLabel}>Dato</label>
              <input style={c.fieldInput} defaultValue="14. mai 2026" />
            </div>
          </div>
          <div style={c.fieldRow}>
            <div style={c.field}>
              <label style={c.fieldLabel}>Beløp</label>
              <input style={c.fieldInput} defaultValue="487,50 kr" />
            </div>
            <div style={c.field}>
              <label style={c.fieldLabel}>Hovedkategori</label>
              <div style={c.fieldSelect}>
                <span style={c.fieldSelectDot} />
                <span>Mat & drikke</span>
                <span style={{marginLeft: 'auto'}}>▾</span>
              </div>
            </div>
          </div>

          <div style={c.section}>
            <div style={c.sectionTitle}>Hvem betalte?</div>
            <div style={c.payerRow}>
              {SX.members.map(m => (
                <button key={m.id} style={{...c.payerOpt, ...(m.id === 'erlend' ? c.payerOptOn : {})}}>
                  <div style={{...c.payerOptAvatar, background: m.color}}>{m.short}</div>
                  <span>{m.name.split(' ')[0]}{m.id === 'erlend' && ' (du)'}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={c.section}>
            <div style={c.sectionHead}>
              <span style={c.sectionTitle}>Del kostnaden</span>
              <div style={c.splitToggle}>
                <button style={{...c.splitOpt, ...c.splitOptOn}}>Likt</button>
                <button style={c.splitOpt}>Etter andel</button>
                <button style={c.splitOpt}>Manuelt</button>
              </div>
            </div>
            <div style={c.splitList}>
              {SX.members.map(m => (
                <div key={m.id} style={c.splitListRow}>
                  <div style={{...c.smallAvatar, background: m.color}}>{m.short}</div>
                  <span style={c.splitListName}>{m.name}{m.id === 'erlend' && <span style={c.youTagSm}>du</span>}</span>
                  <div style={c.splitToggleSmall}>
                    <button style={{...c.splitTogBtn, ...c.splitTogBtnOn}}>✓</button>
                  </div>
                  <span style={c.splitListAmt}>162,50 kr</span>
                </div>
              ))}
            </div>
          </div>

          <div style={c.section}>
            <div style={c.sectionHead}>
              <span style={c.sectionTitle}>Varer & underkategorier</span>
              <button style={c.linkBtnSm}>Endre kategorier →</button>
            </div>
            <div style={c.itemTags}>
              <span style={{...c.itemTag, background: '#7a9b7a22', color: '#3a5a3a'}}>11 varer · Dagligvarer</span>
              <span style={{...c.itemTag, background: '#9b8a7a22', color: '#5a4a3a'}}>2 varer · Snacks</span>
            </div>
          </div>
        </div>
      </div>
    </D2Shell>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const d2 = {
  root: { fontFamily: 'Inter, system-ui, sans-serif', background: 'oklch(98% 0.005 240)', color: 'oklch(20% 0.015 240)', minHeight: '100%', fontSize: 14, display: 'grid', gridTemplateColumns: '232px 1fr' },
  // sidebar
  sidebar: { background: 'oklch(99.5% 0.003 240)', borderRight: '1px solid oklch(93% 0.008 240)', padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 16 },
  sbBrand: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px' },
  sbMark: { width: 28, height: 28, borderRadius: 8, background: 'oklch(50% 0.08 240)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 600 },
  sbName: { fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.01em' },
  sbLabel: { fontSize: 10.5, letterSpacing: '0.15em', fontWeight: 600, color: 'oklch(55% 0.015 240)', padding: '0 8px 6px' },
  sbAccount: { width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'oklch(96% 0.012 240)', border: '1px solid oklch(91% 0.012 240)', borderRadius: 9, padding: '8px 10px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'oklch(22% 0.02 240)', fontFamily: 'inherit' },
  sbAccDot: { width: 8, height: 8, borderRadius: '50%', background: 'oklch(60% 0.1 160)' },
  sbCaret: { fontSize: 11, color: 'oklch(55% 0.02 240)' },
  sbMembers: { marginTop: 8, padding: '4px 4px 0', display: 'flex', flexDirection: 'column', gap: 2 },
  sbMemberRow: { display: 'flex', alignItems: 'center', gap: 9, padding: '5px 6px', borderRadius: 7 },
  sbMemberAvatar: { width: 22, height: 22, borderRadius: '50%', color: 'white', display: 'grid', placeItems: 'center', fontSize: 9.5, fontWeight: 600, flex: '0 0 auto' },
  sbMemberName: { fontSize: 12.5, flex: 1 },
  sbMemberBal: { fontSize: 11.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  sbInvite: { background: 'none', border: 'none', color: 'oklch(48% 0.06 240)', fontSize: 11.5, fontWeight: 500, cursor: 'pointer', textAlign: 'left', padding: '6px 6px', marginTop: 2, fontFamily: 'inherit' },
  sbNav: { display: 'flex', flexDirection: 'column', gap: 2 },
  sbItem: { display: 'flex', alignItems: 'center', gap: 11, background: 'none', border: 'none', padding: '8px 10px', fontSize: 13, fontWeight: 500, color: 'oklch(38% 0.02 240)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%' },
  sbItemOn: { background: 'oklch(95% 0.02 240)', color: 'oklch(22% 0.04 240)' },
  sbBadge: { marginLeft: 'auto', fontSize: 10.5, fontWeight: 600, background: 'oklch(93% 0.015 240)', color: 'oklch(40% 0.02 240)', padding: '1px 6px', borderRadius: 999 },
  sbBadgeAccent: { background: 'oklch(50% 0.08 240)', color: 'white' },
  sbFoot: { marginTop: 'auto' },
  sbProfile: { width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: '6px 4px', cursor: 'pointer', fontFamily: 'inherit' },
  sbAvatar: { width: 30, height: 30, borderRadius: '50%', background: 'oklch(60% 0.08 160)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 600 },
  sbProfName: { fontSize: 12.5, fontWeight: 500 },
  sbProfSub: { fontSize: 11, color: 'oklch(55% 0.02 240)' },

  // main shell
  main: { padding: '20px 28px 32px', minWidth: 0, overflow: 'hidden' },
  mainTop: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, gap: 16 },
  mainKicker: { fontSize: 11, letterSpacing: '0.16em', fontWeight: 600, color: 'oklch(55% 0.015 240)' },
  mainTitle: { fontSize: 26, fontWeight: 600, letterSpacing: '-0.018em', marginTop: 4 },
  mainSub: { fontSize: 13, color: 'oklch(48% 0.015 240)', marginTop: 4 },
  mainTopRight: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap' },
  search: { display: 'flex', alignItems: 'center', gap: 8, background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(92% 0.008 240)', borderRadius: 10, padding: '7px 10px', color: 'oklch(55% 0.015 240)', minWidth: 200 },
  searchInput: { border: 'none', background: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', flex: 1, color: 'oklch(22% 0.02 240)' },
  kbd: { fontSize: 10.5, background: 'oklch(94% 0.008 240)', padding: '1px 5px', borderRadius: 4, color: 'oklch(45% 0.015 240)' },
  btnGhost: { background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(92% 0.008 240)', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 500, color: 'oklch(28% 0.02 240)', cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary: { background: 'oklch(22% 0.03 240)', color: 'white', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  linkBtn: { background: 'none', border: 'none', color: 'oklch(45% 0.08 240)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  linkBtnSm: { background: 'none', border: 'none', color: 'oklch(45% 0.08 240)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },

  panel: { background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(93% 0.008 240)', borderRadius: 12, padding: 18, marginBottom: 14 },
  panelHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  panelTitle: { fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' },
  panelSub: { fontSize: 11.5, color: 'oklch(50% 0.015 240)', marginTop: 2 },
  tabRow: { display: 'flex', gap: 2, background: 'oklch(95% 0.008 240)', padding: 3, borderRadius: 7 },
  tab: { background: 'none', border: 'none', fontSize: 11, fontWeight: 600, padding: '4px 9px', borderRadius: 5, cursor: 'pointer', color: 'oklch(48% 0.015 240)', fontFamily: 'inherit' },
  tabOn: { background: 'oklch(99.5% 0.003 240)', color: 'oklch(22% 0.04 240)' },

  // ===== Kvitteringer page =====
  chipRow: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid oklch(93% 0.008 240)' },
  chipGroup: { display: 'flex', gap: 6 },
  chipRight: { display: 'flex', gap: 8, marginLeft: 'auto' },
  chip: { background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(92% 0.008 240)', borderRadius: 999, padding: '6px 12px', fontSize: 12.5, fontWeight: 500, color: 'oklch(38% 0.02 240)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 },
  chipOn: { background: 'oklch(28% 0.03 240)', color: 'white', borderColor: 'oklch(28% 0.03 240)' },
  chipCount: { fontSize: 11, opacity: 0.7, fontWeight: 500 },
  chipPlain: { background: 'none', border: 'none', fontSize: 12.5, color: 'oklch(40% 0.02 240)', cursor: 'pointer', fontFamily: 'inherit', padding: '6px 8px' },
  receiptsList: { display: 'flex', flexDirection: 'column', gap: 18 },
  dateHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px' },
  dateLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  dateDay: { fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', color: 'oklch(22% 0.025 240)', lineHeight: 1, minWidth: 36 },
  dateMonth: { fontSize: 13, fontWeight: 600 },
  dateSub: { fontSize: 11.5, color: 'oklch(50% 0.015 240)' },
  dateSum: { fontSize: 13, fontWeight: 600, color: 'oklch(40% 0.02 240)', fontVariantNumeric: 'tabular-nums' },
  receiptRows: { background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(93% 0.008 240)', borderRadius: 12, overflow: 'hidden' },
  receiptRow: { display: 'grid', gridTemplateColumns: '38px 1fr auto auto auto auto', gap: 16, alignItems: 'center', padding: '12px 16px', borderTop: '1px solid oklch(95% 0.008 240)' },
  thumb: { width: 38, height: 38, background: 'oklch(96% 0.008 240)', borderRadius: 8, display: 'grid', placeItems: 'center' },
  rTitle: { fontSize: 13.5, fontWeight: 500 },
  rSub: { fontSize: 11.5, color: 'oklch(50% 0.015 240)', marginTop: 2 },
  payerCell: { display: 'flex', alignItems: 'center', gap: 8 },
  payerAvatar: { width: 24, height: 24, borderRadius: '50%', color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 600 },
  payerName: { fontSize: 12, color: 'oklch(40% 0.02 240)' },
  splitCell: {},
  tagSplit: { fontSize: 11, fontWeight: 500, background: 'oklch(94% 0.025 240)', color: 'oklch(35% 0.06 240)', padding: '3px 8px', borderRadius: 999 },
  tagSolo: { fontSize: 11, fontWeight: 500, background: 'oklch(95% 0.008 240)', color: 'oklch(45% 0.02 240)', padding: '3px 8px', borderRadius: 999 },
  amtCell: { textAlign: 'right', minWidth: 100 },
  amtBig: { fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  amtPer: { fontSize: 11, color: 'oklch(50% 0.015 240)', marginTop: 2, fontVariantNumeric: 'tabular-nums' },
  rowAction: { background: 'none', border: 'none', fontSize: 16, color: 'oklch(55% 0.015 240)', cursor: 'pointer', padding: '0 4px' },

  // ===== Oppgjor page =====
  oppgjor2col: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  statusHero: { background: 'linear-gradient(135deg, oklch(92% 0.06 145), oklch(96% 0.025 145))', border: '1px solid oklch(86% 0.05 145)', borderRadius: 16, padding: '22px 24px', marginBottom: 14 },
  statusKicker: { fontSize: 10.5, letterSpacing: '0.18em', fontWeight: 600, color: 'oklch(38% 0.07 145)' },
  statusBigRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 12, alignItems: 'center' },
  statusVerb: { fontSize: 14, color: 'oklch(38% 0.05 145)' },
  statusAmt: { fontSize: 38, fontWeight: 500, letterSpacing: '-0.03em', color: 'oklch(35% 0.12 145)', marginTop: 4, fontVariantNumeric: 'tabular-nums' },
  statusBreakdown: { display: 'flex', flexDirection: 'column', gap: 6 },
  statusItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 },
  statusItemLabel: { color: 'oklch(38% 0.04 145)' },
  statusItemVal: { fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: 'oklch(28% 0.04 145)' },
  statusActions: { display: 'flex', gap: 8, marginTop: 18 },

  memberList: { display: 'flex', flexDirection: 'column', gap: 16 },
  memberRow: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  memberAvatar: { width: 36, height: 36, borderRadius: '50%', color: 'white', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600, flex: '0 0 auto' },
  memberTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  memberName: { fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 },
  memberBal: { fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  youTag: { fontSize: 9.5, fontWeight: 600, background: 'oklch(94% 0.025 240)', color: 'oklch(35% 0.06 240)', padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em' },
  memberBars: { display: 'flex', flexDirection: 'column', gap: 5 },
  memberBarRow: { display: 'grid', gridTemplateColumns: '50px 1fr 70px', gap: 10, alignItems: 'center' },
  memberBarLabel: { fontSize: 11, color: 'oklch(50% 0.015 240)' },
  memberBarTrack: { height: 6, background: 'oklch(94% 0.008 240)', borderRadius: 999, overflow: 'hidden' },
  memberBarFill: { height: '100%', borderRadius: 999 },
  memberBarVal: { fontSize: 11.5, fontVariantNumeric: 'tabular-nums', textAlign: 'right', fontWeight: 500 },

  historyList: { display: 'flex', flexDirection: 'column' },
  historyRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid oklch(94% 0.008 240)' },
  historyCheck: { width: 24, height: 24, borderRadius: '50%', background: 'oklch(60% 0.1 145)', display: 'grid', placeItems: 'center' },
  historyMonth: { fontSize: 13, fontWeight: 500 },
  historySub: { fontSize: 11.5, color: 'oklch(50% 0.015 240)', marginTop: 1 },
  historyAmt: { fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'oklch(40% 0.02 240)' },

  // ===== Kategorier page =====
  overviewBar: { display: 'flex', height: 40, borderRadius: 8, overflow: 'hidden', background: 'oklch(94% 0.012 240)' },
  overviewSeg: { display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 10px', color: 'white', minWidth: 0 },
  overviewSegLabel: { fontSize: 11, fontWeight: 600, opacity: 0.95, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  overviewSegPct: { fontSize: 11.5, fontWeight: 600 },
  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  catCard: { background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(93% 0.008 240)', borderRadius: 12, padding: 16 },
  catCardTop: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  catSwatch: { width: 14, height: 14, borderRadius: 4, flex: '0 0 auto' },
  catCardName: { fontSize: 14, fontWeight: 600 },
  catCardCount: { fontSize: 11.5, color: 'oklch(50% 0.015 240)', marginTop: 1 },
  catTrend: { fontSize: 11.5, fontWeight: 600 },
  catCardAmt: { fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' },
  catCardOf: { fontSize: 12, color: 'oklch(50% 0.015 240)', fontWeight: 400 },
  catBudgetTrack: { height: 6, background: 'oklch(94% 0.008 240)', borderRadius: 999, marginTop: 10, overflow: 'hidden', position: 'relative' },
  catBudgetFill: { height: '100%', borderRadius: 999 },
  catBudgetWarn: { display: 'none' },
  catCardFoot: { display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'oklch(50% 0.015 240)', marginTop: 8 },
  catSubList: { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12, paddingTop: 10, borderTop: '1px solid oklch(94% 0.008 240)' },
  catSubItem: { fontSize: 11.5, color: 'oklch(40% 0.02 240)' },

  // ===== Rapporter page =====
  dateRange: { display: 'flex', alignItems: 'center', gap: 6, background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(92% 0.008 240)', borderRadius: 10, padding: '4px 8px' },
  dateRangeBtn: { background: 'none', border: 'none', fontSize: 12.5, fontWeight: 500, padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit', color: 'oklch(22% 0.02 240)' },
  dateRangeArrow: { fontSize: 13, color: 'oklch(55% 0.015 240)' },
  kpiStrip: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 },
  kpi: { background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(93% 0.008 240)', borderRadius: 12, padding: '14px 16px' },
  kpiLabel: { fontSize: 12, color: 'oklch(50% 0.015 240)', fontWeight: 500 },
  kpiVal: { fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 6, fontVariantNumeric: 'tabular-nums' },
  kpiUnit: { fontSize: 12, color: 'oklch(50% 0.015 240)', fontWeight: 400 },
  kpiDelta: { fontSize: 11.5, color: 'oklch(50% 0.015 240)', marginTop: 6 },
  twoCol: { display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14 },
  memberContribList: { display: 'flex', flexDirection: 'column', gap: 18 },
  contribRow: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  contribAvatar: { width: 32, height: 32, borderRadius: '50%', color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, flex: '0 0 auto' },
  contribTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  contribName: { fontSize: 13, fontWeight: 600 },
  contribTotal: { fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'oklch(40% 0.02 240)' },
  contribBars: { display: 'flex', gap: 6, height: 60, alignItems: 'flex-end' },
  contribCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  contribBar: { width: '100%', borderRadius: 3, minHeight: 4 },
  contribLabel: { fontSize: 10, color: 'oklch(50% 0.015 240)' },

  // ===== Ny kvittering page =====
  scanLayout: { display: 'grid', gridTemplateColumns: '380px 1fr', gap: 18 },
  scanPreview: { display: 'flex', flexDirection: 'column', gap: 10 },
  scanPreviewLabel: { fontSize: 10.5, letterSpacing: '0.16em', fontWeight: 600, color: 'oklch(55% 0.015 240)' },
  receiptPaper: { background: 'oklch(98% 0.005 90)', borderRadius: 4, padding: '20px 18px', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'oklch(25% 0.01 60)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', position: 'relative' },
  rpStore: { fontSize: 14, fontWeight: 700, textAlign: 'center', letterSpacing: '0.05em' },
  rpAddress: { fontSize: 10, textAlign: 'center', marginTop: 2, color: 'oklch(45% 0.015 60)' },
  rpDate: { fontSize: 10, textAlign: 'center', marginTop: 8, color: 'oklch(45% 0.015 60)' },
  rpDivider: { borderTop: '1px dashed oklch(60% 0.01 60)', margin: '10px 0' },
  rpLine: { display: 'flex', justifyContent: 'space-between', padding: '2px 0' },
  rpFoot: { fontSize: 9.5, textAlign: 'center', color: 'oklch(50% 0.015 60)' },
  scanActions: { display: 'flex', gap: 8 },
  scanActionBtn: { flex: 1, background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(92% 0.008 240)', borderRadius: 9, padding: '8px 12px', fontSize: 12, fontWeight: 500, color: 'oklch(28% 0.02 240)', cursor: 'pointer', fontFamily: 'inherit' },

  scanForm: { display: 'flex', flexDirection: 'column', gap: 18 },
  confidenceBanner: { display: 'flex', alignItems: 'center', gap: 12, background: 'oklch(94% 0.04 145)', color: 'oklch(28% 0.08 145)', borderRadius: 10, padding: '10px 14px' },
  confTitle: { fontSize: 13, fontWeight: 600 },
  confSub: { fontSize: 11.5, opacity: 0.85, marginTop: 1 },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  fieldLabel: { fontSize: 11.5, color: 'oklch(48% 0.015 240)', fontWeight: 500 },
  fieldInput: { background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(92% 0.008 240)', borderRadius: 9, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: 'oklch(20% 0.015 240)' },
  fieldSelect: { display: 'flex', alignItems: 'center', gap: 8, background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(92% 0.008 240)', borderRadius: 9, padding: '9px 12px', fontSize: 13, cursor: 'pointer' },
  fieldSelectDot: { width: 9, height: 9, borderRadius: 2.5, background: '#7a9b7a' },

  section: { display: 'flex', flexDirection: 'column', gap: 10 },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: 600 },
  payerRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  payerOpt: { display: 'flex', alignItems: 'center', gap: 8, background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(92% 0.008 240)', borderRadius: 10, padding: '8px 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: 'oklch(22% 0.02 240)' },
  payerOptOn: { background: 'oklch(94% 0.025 240)', borderColor: 'oklch(60% 0.08 240)', boxShadow: '0 0 0 1px oklch(60% 0.08 240) inset' },
  payerOptAvatar: { width: 24, height: 24, borderRadius: '50%', color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 600 },
  splitToggle: { display: 'flex', gap: 2, background: 'oklch(95% 0.008 240)', padding: 3, borderRadius: 8 },
  splitOpt: { background: 'none', border: 'none', fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 5, cursor: 'pointer', color: 'oklch(48% 0.015 240)', fontFamily: 'inherit' },
  splitOptOn: { background: 'oklch(99.5% 0.003 240)', color: 'oklch(22% 0.04 240)' },
  splitList: { display: 'flex', flexDirection: 'column', gap: 2, background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(93% 0.008 240)', borderRadius: 10, padding: 4 },
  splitListRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7 },
  splitListName: { flex: 1, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 },
  splitToggleSmall: {},
  splitTogBtn: { width: 22, height: 22, borderRadius: 5, border: '1px solid oklch(85% 0.015 240)', background: 'white', fontSize: 11, cursor: 'pointer', color: 'oklch(55% 0.015 240)' },
  splitTogBtnOn: { background: 'oklch(50% 0.08 240)', borderColor: 'oklch(50% 0.08 240)', color: 'white' },
  splitListAmt: { fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', minWidth: 80, textAlign: 'right' },
  smallAvatar: { width: 24, height: 24, borderRadius: '50%', color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 600 },
  youTagSm: { fontSize: 9, fontWeight: 600, background: 'oklch(94% 0.025 240)', color: 'oklch(35% 0.06 240)', padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.06em', marginLeft: 2 },
  itemTags: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  itemTag: { fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 999 },
};

Object.assign(window, { PageReceipts, PageOppgjor, PageKategorier, PageRapporter, PageNyKvittering });
