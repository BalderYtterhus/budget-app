// Settlement variants for the other three directions
// A² · Warm linen + settlement
// C² · Editorial + settlement
// D² · Sidebar fintech + settlement

const { SETTLE: S, memberById: memById, fmtKr: fK, fmtKrShort: fKs } = window;

// ============================================================================
// A² — WARM LINEN + SETTLEMENT
// ============================================================================
function VariantWarmSettle() {
  const s = warmSettleStyles;
  const erlendBal = S.balances.find(b => b.id === 'erlend');
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

      {/* Settlement banner */}
      <div style={s.settleBanner}>
        <div style={s.settleStatus}>
          <div style={s.statusKicker}>OPPGJØR · HUSHOLDNING</div>
          <div style={s.statusBig}>
            Du får <span style={s.statusAmt}>787 kr</span> tilbake
          </div>
          <div style={s.statusFrom}>fra Tobias · forenklet fra 6 til 2 overføringer</div>
        </div>
        <div style={s.memberRow}>
          {S.members.map(m => {
            const b = S.balances.find(x => x.id === m.id);
            const pos = b.delta >= 0;
            return (
              <div key={m.id} style={s.member}>
                <div style={{...s.memberAvatar, background: m.color}}>{m.short}</div>
                <div style={s.memberInfo}>
                  <div style={s.memberName}>
                    {m.name.split(' ')[0]}
                    {m.id === 'erlend' && <span style={s.youTag}>du</span>}
                  </div>
                  <div style={s.memberPaid}>Betalt {fKs(m.paid)}</div>
                </div>
                <div style={{...s.memberBal, color: pos ? 'oklch(45% 0.1 145)' : 'oklch(55% 0.12 30)'}}>
                  {pos ? '+' : '−'}{fKs(b.delta)}
                </div>
              </div>
            );
          })}
        </div>
        <button style={s.settleCta}>Gjør opp →</button>
      </div>

      {/* Hero row */}
      <div style={s.heroRow}>
        <div style={{...s.card, ...s.heroCard}}>
          <div style={s.cardLabel}>Felles forbruk · mai</div>
          <div style={s.heroNum}>{fKs(S.total)}</div>
          <div style={s.heroMeta}>
            <span style={s.pill}>↓ 4,3 % vs. forrige</span>
            <span style={s.metaText}>av 12 000 kr budsjett</span>
          </div>
          {/* stacked by member */}
          <div style={s.stackedBar}>
            {S.members.map(m => (
              <div key={m.id} title={m.name} style={{height: '100%', width: `${(m.paid / S.total) * 100}%`, background: m.color}} />
            ))}
          </div>
          <div style={s.stackedLegend}>
            {S.members.map(m => (
              <span key={m.id} style={s.legendItem}>
                <i style={{...s.legendDot, background: m.color}} />
                {m.name.split(' ')[0]} · {fKs(m.paid)}
              </span>
            ))}
          </div>
        </div>

        <div style={s.miniCol}>
          <div style={s.card}>
            <div style={s.cardLabel}>Daglig snitt</div>
            <div style={s.miniNum}>561 kr</div>
            <div style={s.miniMeta}>17 dager igjen</div>
          </div>
          <div style={s.card}>
            <div style={s.cardLabel}>Kvitteringer</div>
            <div style={s.miniNum}>23</div>
            <div style={s.miniMeta}>6 nye denne uken</div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div style={s.mainGrid}>
        <div style={s.card}>
          <div style={s.cardHead}>
            <div>
              <div style={s.cardTitle}>Siste delte utgifter</div>
              <div style={s.cardSub}>Mai 2026</div>
            </div>
            <button style={s.linkBtn}>Se alle →</button>
          </div>
          <div style={s.list}>
            {S.recentSplits.map(sp => {
              const m = memById(sp.payer);
              return (
                <div key={sp.id} style={s.listRow}>
                  <div style={{...s.rowAvatar, background: m.color}}>{m.short}</div>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={s.rowTitle}>{sp.what}</div>
                    <div style={s.rowMeta}>{m.name.split(' ')[0]} betalte · delt på {sp.split.replace(' personer','')} · {sp.date}</div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={s.rowAmt}>{fK(sp.amt)}</div>
                    <div style={s.rowPer}>{fKs(sp.amt / 3)} hver</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardHead}>
            <div>
              <div style={s.cardTitle}>Forbruk per kategori</div>
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
                  <span style={s.catName}>{c.name}</span>
                  <span style={s.catAmt}>{fKs(c.amt)}</span>
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

const warmSettleStyles = {
  root: { fontFamily: 'Inter, system-ui, sans-serif', background: 'oklch(97.5% 0.012 75)', color: 'oklch(22% 0.015 60)', padding: '24px 30px 36px', minHeight: '100%', fontSize: 14 },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  brand: { display: 'flex', alignItems: 'center', gap: 14 },
  brandMark: { width: 44, height: 44, borderRadius: 12, background: 'oklch(58% 0.09 50)', color: 'oklch(98% 0.01 80)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 20, letterSpacing: '-0.02em' },
  brandName: { fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em' },
  brandSub: { fontSize: 12.5, color: 'oklch(50% 0.01 60)', marginTop: 1 },
  topActions: { display: 'flex', alignItems: 'center', gap: 10 },
  monthPicker: { display: 'flex', alignItems: 'center', gap: 8, background: 'oklch(99% 0.006 80)', border: '1px solid oklch(90% 0.008 70)', borderRadius: 10, padding: '6px 10px', fontSize: 13.5, fontWeight: 500 },
  monthArrow: { background: 'none', border: 'none', cursor: 'pointer', color: 'oklch(45% 0.01 60)', fontSize: 16, padding: '0 4px' },
  monthLabel: { minWidth: 76, textAlign: 'center' },
  btnGhost: { background: 'oklch(99% 0.006 80)', border: '1px solid oklch(90% 0.008 70)', borderRadius: 10, padding: '8px 14px', fontSize: 13.5, fontWeight: 500, color: 'oklch(28% 0.015 60)', cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary: { background: 'oklch(28% 0.018 60)', color: 'oklch(98% 0.008 80)', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: 'oklch(85% 0.025 50)', color: 'oklch(35% 0.04 50)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600, marginLeft: 4 },

  settleBanner: {
    background: 'oklch(96% 0.025 60)',
    border: '1px solid oklch(88% 0.03 55)',
    borderRadius: 16, padding: '16px 20px', marginBottom: 14,
    display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 22, alignItems: 'center',
  },
  settleStatus: { minWidth: 250 },
  statusKicker: { fontSize: 10.5, letterSpacing: '0.16em', fontWeight: 600, color: 'oklch(45% 0.05 50)' },
  statusBig: { fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 26, marginTop: 4, letterSpacing: '-0.02em', color: 'oklch(28% 0.025 50)' },
  statusAmt: { color: 'oklch(40% 0.1 145)' },
  statusFrom: { fontSize: 12, color: 'oklch(45% 0.02 50)', marginTop: 2 },
  memberRow: { display: 'flex', gap: 8 },
  member: { flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'oklch(99% 0.008 75)', border: '1px solid oklch(90% 0.015 60)', borderRadius: 12, padding: '8px 12px' },
  memberAvatar: { width: 30, height: 30, borderRadius: '50%', color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, flex: '0 0 auto' },
  memberInfo: { flex: 1, minWidth: 0 },
  memberName: { fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  memberPaid: { fontSize: 11, color: 'oklch(50% 0.015 60)', marginTop: 1 },
  memberBal: { fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  youTag: { fontSize: 9.5, fontWeight: 600, background: 'oklch(92% 0.04 50)', color: 'oklch(38% 0.08 50)', padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em' },
  settleCta: { background: 'oklch(38% 0.08 50)', color: 'oklch(98% 0.01 80)', border: 'none', borderRadius: 11, padding: '11px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },

  heroRow: { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, marginBottom: 14 },
  card: { background: 'oklch(99.5% 0.005 80)', border: '1px solid oklch(92% 0.008 70)', borderRadius: 16, padding: 20 },
  heroCard: { padding: 24 },
  cardLabel: { fontSize: 12.5, color: 'oklch(50% 0.01 60)', fontWeight: 500 },
  heroNum: { fontSize: 42, fontWeight: 500, letterSpacing: '-0.025em', marginTop: 8, fontFamily: '"Instrument Serif", Georgia, serif', lineHeight: 1 },
  heroMeta: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 16 },
  pill: { background: 'oklch(94% 0.04 145)', color: 'oklch(38% 0.07 145)', fontSize: 12, fontWeight: 500, padding: '3px 9px', borderRadius: 999 },
  metaText: { fontSize: 12.5, color: 'oklch(50% 0.01 60)' },
  stackedBar: { display: 'flex', height: 12, background: 'oklch(94% 0.008 70)', borderRadius: 999, overflow: 'hidden' },
  stackedLegend: { display: 'flex', gap: 16, marginTop: 10, fontSize: 11.5, color: 'oklch(40% 0.015 60)' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 2.5 },
  miniCol: { display: 'grid', gridTemplateRows: '1fr 1fr', gap: 14 },
  miniNum: { fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 8, fontFamily: '"Instrument Serif", Georgia, serif' },
  miniMeta: { fontSize: 12, color: 'oklch(50% 0.01 60)', marginTop: 4 },

  mainGrid: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 },
  cardHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  cardTitle: { fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.01em' },
  cardSub: { fontSize: 12, color: 'oklch(55% 0.01 60)', marginTop: 2 },
  linkBtn: { background: 'none', border: 'none', color: 'oklch(45% 0.07 50)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  list: { display: 'flex', flexDirection: 'column' },
  listRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid oklch(94% 0.008 70)' },
  rowAvatar: { width: 30, height: 30, borderRadius: '50%', color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, flex: '0 0 auto' },
  rowTitle: { fontSize: 13.5, fontWeight: 500 },
  rowMeta: { fontSize: 11.5, color: 'oklch(50% 0.01 60)', marginTop: 2 },
  rowAmt: { fontSize: 13.5, fontWeight: 500, fontVariantNumeric: 'tabular-nums' },
  rowPer: { fontSize: 11, color: 'oklch(50% 0.01 60)', marginTop: 2 },
  catList: { display: 'flex', flexDirection: 'column', gap: 12 },
  catTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 },
  catName: { fontSize: 12.5, color: 'oklch(38% 0.01 60)' },
  catAmt: { fontSize: 12.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  catTrack: { height: 5, background: 'oklch(94% 0.008 70)', borderRadius: 999, overflow: 'hidden' },
  catFill: { height: '100%', borderRadius: 999 },
};

// ============================================================================
// C² — EDITORIAL + SETTLEMENT
// ============================================================================
function VariantEditorialSettle() {
  const s = edSettleStyles;
  return (
    <div style={s.root}>
      <div style={s.topbar}>
        <div>
          <div style={s.kicker}>BUDGETBANDZ · HUSHOLDNING · MAI MMXXVI</div>
          <div style={s.title}>Oppgjør & forbruk</div>
        </div>
        <div style={s.topRight}>
          <button style={s.linkBtn}>← Forrige</button>
          <button style={s.linkBtn}>Neste →</button>
          <span style={s.sep}>·</span>
          <button style={s.linkBtn}>Eksporter</button>
          <button style={s.btnDark}>Gjør opp nå</button>
        </div>
      </div>

      <div style={s.hrThick} />

      {/* Settlement headline */}
      <div style={s.settleHeadline}>
        <div style={s.shLeft}>
          <div style={s.shKicker}>DIN STATUS</div>
          <div style={s.shBig}>
            Du får <span style={s.shAmt}>+787,00 kr</span>
          </div>
          <div style={s.shFrom}>fra Tobias K. · forenklet fra 6 til 2 overføringer</div>
        </div>
        <div style={s.shRight}>
          <div style={s.shStat}>
            <div style={s.shStatLabel}>FELLES TOTAL</div>
            <div style={s.shStatVal}>7 840 kr</div>
          </div>
          <div style={s.vRule} />
          <div style={s.shStat}>
            <div style={s.shStatLabel}>HVER ANDEL</div>
            <div style={s.shStatVal}>2 613 kr</div>
          </div>
          <div style={s.vRule} />
          <div style={s.shStat}>
            <div style={s.shStatLabel}>OVERFØRINGER</div>
            <div style={s.shStatVal}>2 stk</div>
          </div>
        </div>
      </div>

      <div style={s.hrThick} />

      {/* Members table */}
      <div style={s.sectionHead}>
        <span style={s.sectionTitle}>Medlemmer</span>
        <span style={s.sectionDate}>3 PERSONER · MAI 2026</span>
      </div>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Person</th>
            <th style={s.th}>Betalt</th>
            <th style={s.th}>Andel</th>
            <th style={s.th}>Difference</th>
            <th style={{...s.th, textAlign: 'right'}}>Balanse</th>
          </tr>
        </thead>
        <tbody>
          {S.members.map(m => {
            const bal = S.balances.find(b => b.id === m.id);
            const share = S.total / 3;
            const pos = bal.delta >= 0;
            return (
              <tr key={m.id} style={s.tr}>
                <td style={s.td}>
                  <div style={s.personCell}>
                    <div style={{...s.smallAvatar, background: m.color}}>{m.short}</div>
                    <span style={s.personName}>{m.name}{m.id === 'erlend' && <span style={s.youTag}>du</span>}</span>
                  </div>
                </td>
                <td style={{...s.td, fontVariantNumeric: 'tabular-nums'}}>{fK(m.paid)}</td>
                <td style={{...s.td, fontVariantNumeric: 'tabular-nums', color: 'oklch(50% 0.015 60)'}}>{fK(share)}</td>
                <td style={s.td}>
                  <div style={s.diffBar}>
                    {pos ? (
                      <>
                        <div style={s.diffCenter} />
                        <div style={{...s.diffPos, width: `${Math.min(Math.abs(bal.delta) / 1200 * 50, 50)}%`}} />
                      </>
                    ) : (
                      <>
                        <div style={{...s.diffNeg, width: `${Math.min(Math.abs(bal.delta) / 1200 * 50, 50)}%`}} />
                        <div style={s.diffCenter} />
                      </>
                    )}
                  </div>
                </td>
                <td style={{...s.td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 19, color: pos ? 'oklch(38% 0.08 145)' : 'oklch(45% 0.1 30)'}}>
                  {pos ? '+' : '−'}{fK(bal.delta)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={s.hrThin} />

      {/* Transfers + recent splits */}
      <div style={s.twoCol}>
        <div>
          <div style={s.sectionHead}>
            <span style={s.sectionTitle}>Forenklede overføringer</span>
            <span style={s.sectionDate}>SLIK GJØR DERE OPP</span>
          </div>
          <div style={s.transferList}>
            {S.transfers.map((t, i) => {
              const from = memById(t.from), to = memById(t.to);
              return (
                <div key={i} style={s.transferRow}>
                  <div style={s.transferAvatars}>
                    <div style={{...s.smallAvatar, background: from.color}}>{from.short}</div>
                    <span style={s.transferArrow}>→</span>
                    <div style={{...s.smallAvatar, background: to.color}}>{to.short}</div>
                  </div>
                  <div style={{flex: 1}}>
                    <div style={s.transferText}>
                      <b>{from.name.split(' ')[0]}</b> sender <b>{to.name.split(' ')[0]}{to.id === 'erlend' && ' (deg)'}</b>
                    </div>
                    <div style={s.transferMeta}>Vipps · Schibsted · kontooverføring</div>
                  </div>
                  <div style={s.transferAmt}>{fK(t.amt)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div style={s.sectionHead}>
            <span style={s.sectionTitle}>Aktivitet</span>
            <span style={s.sectionDate}>SISTE 7 DAGER</span>
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Dato</th>
                <th style={s.th}>Hva</th>
                <th style={s.th}>Av</th>
                <th style={{...s.th, textAlign: 'right'}}>Beløp</th>
              </tr>
            </thead>
            <tbody>
              {S.recentSplits.slice(0, 5).map(sp => {
                const m = memById(sp.payer);
                return (
                  <tr key={sp.id} style={s.tr}>
                    <td style={s.td}><span style={s.tdMono}>{sp.date}</span></td>
                    <td style={s.td}>{sp.what}</td>
                    <td style={s.td}>
                      <div style={s.personCell}>
                        <div style={{...s.smallAvatar, background: m.color, width: 22, height: 22, fontSize: 9.5}}>{m.short}</div>
                        <span>{m.name.split(' ')[0]}</span>
                      </div>
                    </td>
                    <td style={{...s.td, textAlign: 'right', fontVariantNumeric: 'tabular-nums'}}>{fK(sp.amt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const edSettleStyles = {
  root: { fontFamily: 'Inter, system-ui, sans-serif', background: 'oklch(99% 0.005 90)', color: 'oklch(15% 0.01 60)', padding: '28px 40px 40px', minHeight: '100%', fontSize: 14 },
  topbar: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' },
  kicker: { fontSize: 10.5, letterSpacing: '0.18em', fontWeight: 600, color: 'oklch(45% 0.02 60)', fontFamily: '"JetBrains Mono", monospace' },
  title: { fontSize: 38, fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400, letterSpacing: '-0.02em', marginTop: 4 },
  topRight: { display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 8 },
  linkBtn: { background: 'none', border: 'none', fontSize: 13, color: 'oklch(28% 0.015 60)', cursor: 'pointer', fontFamily: 'inherit', padding: 0, textDecoration: 'underline', textDecorationColor: 'oklch(80% 0.015 60)', textUnderlineOffset: 4 },
  sep: { color: 'oklch(70% 0.015 60)' },
  btnDark: { background: 'oklch(18% 0.01 60)', color: 'oklch(99% 0.005 90)', border: 'none', padding: '8px 16px', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' },
  hrThick: { height: 2, background: 'oklch(18% 0.01 60)', margin: '16px 0' },
  hrThin: { height: 1, background: 'oklch(18% 0.01 60)', margin: '20px 0' },

  settleHeadline: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, padding: '4px 0 8px' },
  shLeft: {},
  shKicker: { fontSize: 10.5, letterSpacing: '0.2em', fontWeight: 600, color: 'oklch(45% 0.02 60)', fontFamily: '"JetBrains Mono", monospace' },
  shBig: { fontSize: 38, fontFamily: '"Instrument Serif", Georgia, serif', letterSpacing: '-0.02em', marginTop: 8, lineHeight: 1.1 },
  shAmt: { color: 'oklch(35% 0.1 145)' },
  shFrom: { fontSize: 12.5, color: 'oklch(45% 0.015 60)', marginTop: 8, fontStyle: 'italic' },
  shRight: { display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', alignItems: 'center', gap: 18 },
  shStat: { display: 'flex', flexDirection: 'column', gap: 4 },
  shStatLabel: { fontSize: 10, letterSpacing: '0.16em', fontWeight: 600, color: 'oklch(50% 0.02 60)', fontFamily: '"JetBrains Mono", monospace' },
  shStatVal: { fontSize: 26, fontFamily: '"Instrument Serif", Georgia, serif', letterSpacing: '-0.02em', marginTop: 4, fontVariantNumeric: 'tabular-nums' },
  vRule: { background: 'oklch(85% 0.01 60)', height: '70%', alignSelf: 'center' },

  sectionHead: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, borderBottom: '1px solid oklch(18% 0.01 60)', paddingBottom: 6 },
  sectionTitle: { fontSize: 20, fontFamily: '"Instrument Serif", Georgia, serif', letterSpacing: '-0.015em' },
  sectionDate: { fontSize: 10.5, letterSpacing: '0.18em', fontWeight: 600, color: 'oklch(45% 0.02 60)', fontFamily: '"JetBrains Mono", monospace' },

  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 10.5, letterSpacing: '0.16em', fontWeight: 600, color: 'oklch(50% 0.02 60)', padding: '8px 4px', borderBottom: '1px solid oklch(85% 0.01 60)', fontFamily: '"JetBrains Mono", monospace' },
  tr: {},
  td: { fontSize: 13, padding: '12px 4px', borderBottom: '1px solid oklch(92% 0.008 60)' },
  tdMono: { fontFamily: '"JetBrains Mono", monospace', fontSize: 11.5, color: 'oklch(45% 0.015 60)' },
  personCell: { display: 'flex', alignItems: 'center', gap: 9 },
  smallAvatar: { width: 26, height: 26, borderRadius: '50%', color: 'white', display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 600, flex: '0 0 auto' },
  personName: { fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 7 },
  youTag: { fontSize: 9, fontWeight: 600, background: 'oklch(94% 0.015 60)', color: 'oklch(35% 0.02 60)', padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: '"JetBrains Mono", monospace' },
  diffBar: { position: 'relative', height: 4, background: 'oklch(94% 0.008 60)', display: 'flex' },
  diffCenter: { width: '50%', height: '100%' },
  diffPos: { height: '100%', background: 'oklch(50% 0.1 145)' },
  diffNeg: { height: '100%', background: 'oklch(58% 0.12 30)', marginLeft: 'auto' },

  twoCol: { display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 36 },
  transferList: { display: 'flex', flexDirection: 'column' },
  transferRow: { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 4px', borderBottom: '1px solid oklch(92% 0.008 60)' },
  transferAvatars: { display: 'flex', alignItems: 'center', gap: 6 },
  transferArrow: { color: 'oklch(40% 0.015 60)', fontSize: 14 },
  transferText: { fontSize: 13.5 },
  transferMeta: { fontSize: 11, color: 'oklch(50% 0.015 60)', marginTop: 2, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.05em' },
  transferAmt: { fontSize: 19, fontFamily: '"Instrument Serif", Georgia, serif', fontVariantNumeric: 'tabular-nums' },
};

// ============================================================================
// D² — FINTECH SIDEBAR + SETTLEMENT
// ============================================================================
function VariantSidebarSettle() {
  const s = sbSettleStyles;
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
          <div style={s.sbMembers}>
            {S.members.map(m => (
              <div key={m.id} style={s.sbMemberRow}>
                <div style={{...s.sbMemberAvatar, background: m.color}}>{m.short}</div>
                <span style={s.sbMemberName}>{m.name.split(' ')[0]}</span>
                <span style={{...s.sbMemberBal, color: S.balances.find(b => b.id === m.id).delta >= 0 ? 'oklch(45% 0.1 145)' : 'oklch(55% 0.12 30)'}}>
                  {S.balances.find(b => b.id === m.id).delta >= 0 ? '+' : '−'}{Math.abs(S.balances.find(b => b.id === m.id).delta)}
                </span>
              </div>
            ))}
            <button style={s.sbInvite}>+ Inviter medlem</button>
          </div>
        </div>
        <nav style={s.sbNav}>
          <button style={{...s.sbItem, ...s.sbItemOn}}>
            <SbiIcon kind="grid" /> Oversikt
          </button>
          <button style={s.sbItem}><SbiIcon kind="list" /> Kvitteringer <span style={s.sbBadge}>23</span></button>
          <button style={s.sbItem}><SbiIcon kind="users" /> Oppgjør <span style={{...s.sbBadge, background: 'oklch(50% 0.08 240)', color: 'white'}}>2</span></button>
          <button style={s.sbItem}><SbiIcon kind="chart" /> Kategorier</button>
          <button style={s.sbItem}><SbiIcon kind="trend" /> Rapporter</button>
        </nav>
        <div style={s.sbFoot}>
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
            <div style={s.mainKicker}>Husholdning · Oversikt</div>
            <h1 style={s.mainTitle}>God ettermiddag, Erlend</h1>
          </div>
          <div style={s.mainTopRight}>
            <div style={s.search}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg>
              <input placeholder="Søk…" style={s.searchInput} />
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

        {/* Settlement strip */}
        <div style={s.settleStrip}>
          <div style={s.settleHead}>
            <div>
              <div style={s.settleKicker}>OPPGJØR · MAI 2026</div>
              <div style={s.settleBig}>
                Du får tilbake <span style={s.settleAmt}>787,00 kr</span> <span style={s.settleFrom}>fra Tobias</span>
              </div>
            </div>
            <button style={s.settleCta}>Gjør opp →</button>
          </div>
          <div style={s.settleViz}>
            <div style={s.vizLabel}>Andel betalt</div>
            <div style={s.vizBar}>
              {S.members.map(m => (
                <div key={m.id} style={{...s.vizSeg, width: `${(m.paid / S.total) * 100}%`, background: m.color}}>
                  <span style={s.vizSegLabel}>{m.name.split(' ')[0]}</span>
                  <span style={s.vizSegAmt}>{fKs(m.paid)}</span>
                </div>
              ))}
            </div>
            <div style={s.vizMarker}>
              <div style={s.vizMarkerLine} />
              <span style={s.vizMarkerText}>Hver: 2 613 kr</span>
            </div>
          </div>
        </div>

        {/* KPI strip — condensed */}
        <div style={s.kpiStrip}>
          <div style={s.kpi}>
            <div style={s.kpiLabel}>Felles brukt</div>
            <div style={s.kpiVal}>7 840 <span style={s.kpiUnit}>kr</span></div>
            <div style={s.kpiDelta}>↓ 4,3 % vs. april</div>
          </div>
          <div style={s.kpi}>
            <div style={s.kpiLabel}>Budsjett</div>
            <div style={s.kpiVal}>12 000 <span style={s.kpiUnit}>kr</span></div>
            <div style={s.kpiDelta}>65 % brukt · 17 dager</div>
          </div>
          <div style={s.kpi}>
            <div style={s.kpiLabel}>Overføringer</div>
            <div style={s.kpiVal}>2 <span style={s.kpiUnit}>stk</span></div>
            <div style={s.kpiDelta}>forenklet fra 6</div>
          </div>
          <div style={s.kpi}>
            <div style={s.kpiLabel}>Din andel</div>
            <div style={s.kpiVal}>2 613 <span style={s.kpiUnit}>kr</span></div>
            <div style={s.kpiDelta}>av 7 840 kr totalt</div>
          </div>
        </div>

        {/* Content grid */}
        <div style={s.contentGrid}>
          <div style={{...s.panel, gridColumn: 'span 2'}}>
            <div style={s.panelHead}>
              <div>
                <div style={s.panelTitle}>Siste delte utgifter</div>
                <div style={s.panelSub}>6 av 23 i mai</div>
              </div>
              <button style={s.linkBtn}>Se alle →</button>
            </div>
            <div style={s.actList}>
              {S.recentSplits.map(sp => {
                const m = memById(sp.payer);
                return (
                  <div key={sp.id} style={s.actRow}>
                    <div style={{...s.actIcon, background: m.color}}>{m.short}</div>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={s.actTitle}>{sp.what}</div>
                      <div style={s.actSub}><b style={{color: 'oklch(28% 0.025 240)', fontWeight: 500}}>{m.name.split(' ')[0]}</b> betalte · delt på {sp.split.replace(' personer','')}</div>
                    </div>
                    <div style={s.actDate}>{sp.date}</div>
                    <div style={{textAlign: 'right'}}>
                      <div style={s.actAmt}>{fK(sp.amt)}</div>
                      <div style={s.actPer}>{fKs(sp.amt / 3)} hver</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={s.panel}>
            <div style={s.panelHead}>
              <div>
                <div style={s.panelTitle}>Per kategori</div>
                <div style={s.panelSub}>Mai 2026</div>
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
                  <div style={{...s.catDot, background: c.color}} />
                  <span style={s.catName}>{c.name}</span>
                  <span style={s.catAmt}>{fKs(c.amt)}</span>
                  <span style={s.catPct}>{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SbiIcon({ kind }) {
  const p = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (kind === 'grid') return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
  if (kind === 'list') return <svg {...p}><path d="M4 6h16M4 12h16M4 18h10"/></svg>;
  if (kind === 'chart') return <svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>;
  if (kind === 'users') return <svg {...p}><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M22 18c0-2.5-2-4.5-4.5-4.5"/></svg>;
  if (kind === 'trend') return <svg {...p}><path d="M3 17l6-6 4 4 7-8"/><path d="M14 7h6v6"/></svg>;
  return null;
}

const sbSettleStyles = {
  root: { fontFamily: 'Inter, system-ui, sans-serif', background: 'oklch(98% 0.005 240)', color: 'oklch(20% 0.015 240)', minHeight: '100%', fontSize: 14, display: 'grid', gridTemplateColumns: '232px 1fr' },
  sidebar: { background: 'oklch(99.5% 0.003 240)', borderRight: '1px solid oklch(93% 0.008 240)', padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 16 },
  sbBrand: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px' },
  sbMark: { width: 28, height: 28, borderRadius: 8, background: 'oklch(50% 0.08 240)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 600 },
  sbName: { fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.01em' },
  sbSection: {},
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
  sbItem: { display: 'flex', alignItems: 'center', gap: 11, background: 'none', border: 'none', padding: '8px 10px', fontSize: 13, fontWeight: 500, color: 'oklch(38% 0.02 240)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' },
  sbItemOn: { background: 'oklch(95% 0.02 240)', color: 'oklch(22% 0.04 240)' },
  sbBadge: { marginLeft: 'auto', fontSize: 10.5, fontWeight: 600, background: 'oklch(93% 0.015 240)', color: 'oklch(40% 0.02 240)', padding: '1px 6px', borderRadius: 999 },
  sbFoot: { marginTop: 'auto' },
  sbProfile: { width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: '6px 4px', cursor: 'pointer', fontFamily: 'inherit' },
  sbAvatar: { width: 30, height: 30, borderRadius: '50%', background: 'oklch(60% 0.08 160)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 600 },
  sbProfName: { fontSize: 12.5, fontWeight: 500 },
  sbProfSub: { fontSize: 11, color: 'oklch(55% 0.02 240)' },

  main: { padding: '20px 28px 32px', minWidth: 0, overflow: 'hidden' },
  mainTop: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 },
  mainKicker: { fontSize: 11, letterSpacing: '0.16em', fontWeight: 600, color: 'oklch(55% 0.015 240)' },
  mainTitle: { fontSize: 22, fontWeight: 600, letterSpacing: '-0.018em', marginTop: 4 },
  mainTopRight: { display: 'flex', alignItems: 'center', gap: 10 },
  search: { display: 'flex', alignItems: 'center', gap: 8, background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(92% 0.008 240)', borderRadius: 10, padding: '7px 10px', color: 'oklch(55% 0.015 240)', minWidth: 180 },
  searchInput: { border: 'none', background: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', flex: 1, color: 'oklch(22% 0.02 240)' },
  kbd: { fontSize: 10.5, background: 'oklch(94% 0.008 240)', padding: '1px 5px', borderRadius: 4, color: 'oklch(45% 0.015 240)' },
  monthSwitch: { display: 'flex', alignItems: 'center', gap: 4, background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(92% 0.008 240)', borderRadius: 10, padding: '4px 6px' },
  monthBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'oklch(45% 0.015 240)', padding: '2px 6px', fontSize: 13 },
  monthNow: { fontSize: 13, fontWeight: 500, padding: '0 6px' },
  cta: { background: 'oklch(22% 0.03 240)', color: 'white', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },

  // settlement strip
  settleStrip: { background: 'linear-gradient(135deg, oklch(96% 0.025 240), oklch(98% 0.012 240))', border: '1px solid oklch(91% 0.018 240)', borderRadius: 14, padding: '16px 20px', marginBottom: 14 },
  settleHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  settleKicker: { fontSize: 10.5, letterSpacing: '0.16em', fontWeight: 600, color: 'oklch(50% 0.04 240)' },
  settleBig: { fontSize: 18, marginTop: 6, color: 'oklch(28% 0.04 240)', fontWeight: 500 },
  settleAmt: { fontSize: 22, fontWeight: 600, color: 'oklch(35% 0.1 145)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' },
  settleFrom: { color: 'oklch(45% 0.02 240)', fontSize: 14, fontWeight: 400 },
  settleCta: { background: 'oklch(22% 0.03 240)', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  settleViz: {},
  vizLabel: { fontSize: 11, color: 'oklch(50% 0.02 240)', fontWeight: 500, marginBottom: 6 },
  vizBar: { display: 'flex', height: 36, borderRadius: 8, overflow: 'hidden', background: 'oklch(94% 0.012 240)' },
  vizSeg: { display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 12px', color: 'white', minWidth: 0 },
  vizSegLabel: { fontSize: 11, fontWeight: 600, opacity: 0.9 },
  vizSegAmt: { fontSize: 12.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  vizMarker: { position: 'relative', height: 16, marginTop: 2 },
  vizMarkerLine: { position: 'absolute', left: '33.3%', top: 0, width: 1, height: 10, background: 'oklch(28% 0.04 240)' },
  vizMarkerText: { position: 'absolute', left: '33.3%', top: 12, transform: 'translateX(-50%)', fontSize: 10.5, color: 'oklch(40% 0.02 240)', whiteSpace: 'nowrap', fontFamily: 'inherit' },

  kpiStrip: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 },
  kpi: { background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(93% 0.008 240)', borderRadius: 12, padding: '14px 16px' },
  kpiLabel: { fontSize: 12, color: 'oklch(50% 0.015 240)', fontWeight: 500 },
  kpiVal: { fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 6, fontVariantNumeric: 'tabular-nums' },
  kpiUnit: { fontSize: 12, color: 'oklch(50% 0.015 240)', fontWeight: 400 },
  kpiDelta: { fontSize: 11.5, color: 'oklch(50% 0.015 240)', marginTop: 6 },

  contentGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  panel: { background: 'oklch(99.5% 0.003 240)', border: '1px solid oklch(93% 0.008 240)', borderRadius: 12, padding: 18 },
  panelHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  panelTitle: { fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' },
  panelSub: { fontSize: 11.5, color: 'oklch(50% 0.015 240)', marginTop: 2 },
  linkBtn: { background: 'none', border: 'none', color: 'oklch(45% 0.08 240)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  actList: { display: 'flex', flexDirection: 'column' },
  actRow: { display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 14, alignItems: 'center', padding: '9px 0', borderTop: '1px solid oklch(94% 0.008 240)' },
  actIcon: { width: 30, height: 30, borderRadius: '50%', color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600 },
  actTitle: { fontSize: 13, fontWeight: 500 },
  actSub: { fontSize: 11.5, color: 'oklch(50% 0.015 240)', marginTop: 2 },
  actDate: { fontSize: 11.5, color: 'oklch(50% 0.015 240)' },
  actAmt: { fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  actPer: { fontSize: 11, color: 'oklch(50% 0.015 240)', marginTop: 1, fontVariantNumeric: 'tabular-nums' },
  catList: { display: 'flex', flexDirection: 'column' },
  catRow: { display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 10, alignItems: 'center', padding: '8px 0', borderTop: '1px solid oklch(94% 0.008 240)' },
  catDot: { width: 10, height: 10, borderRadius: 3 },
  catName: { fontSize: 13 },
  catAmt: { fontSize: 13, fontWeight: 500, fontVariantNumeric: 'tabular-nums' },
  catPct: { fontSize: 11.5, color: 'oklch(50% 0.015 240)', minWidth: 28, textAlign: 'right' },
};

Object.assign(window, { VariantWarmSettle, VariantEditorialSettle, VariantSidebarSettle });
