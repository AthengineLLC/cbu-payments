import { useState, useEffect, useMemo } from 'react'
import { supabase } from './lib/supabase'
import { AFFILIATES } from './data'

const PASSWORD = 'redhat2026'

// ── Perfect Game profit data (existing) ──────────────────────────────────────
const PG_PROFIT = [{"name":"Jacksonville","invoice":"Perfect Game","events":[{"team":"CBU 2027 United Fleming","eventName":"2026 17U PG East Memorial Day Classic","startDate":"2026-05-22","endDate":"2026-05-25","gross":1625.0,"final":1543.75,"pgCost":1300.0,"profit":243.75},{"team":"CBU 2027 United Fleming","eventName":"2026 PG 17U BCS National Championship (INVITE)","startDate":"2026-07-17","endDate":"2026-07-21","gross":2425.0,"final":2303.75,"pgCost":1940.0,"profit":363.75},{"team":"CBU 2028 Hudgins","eventName":"2026 16U PG Battle at BOOMBAH","startDate":"2026-06-12","endDate":"2026-06-14","gross":1095.0,"final":1040.25,"pgCost":876.0,"profit":164.25},{"team":"CBU 2028 Hudgins","eventName":"2026 PG 16U WWBA National Championship","startDate":"2026-07-06","endDate":"2026-07-13","gross":3750.0,"final":3562.5,"pgCost":3000.0,"profit":562.5},{"team":"CBU 2028 Hudgins","eventName":"2026 PG 16U BCS National Championship (INVITE)","startDate":"2026-07-23","endDate":"2026-07-27","gross":2395.0,"final":2275.25,"pgCost":1916.0,"profit":359.25},{"team":"CBU United 2029 Murphy","eventName":"2026 18U PG Battle at the Beach","startDate":"2026-05-23","endDate":"2026-05-25","gross":1590.0,"final":1510.5,"pgCost":1331.0,"profit":179.5},{"team":"CBU United 2029 Murphy","eventName":"2026 PG 15U BCS National Championship (INVITE)","startDate":"2026-06-27","endDate":"2026-07-01","gross":1995.0,"final":1895.25,"pgCost":1596.0,"profit":299.25},{"team":"CBU United 2029 Murphy","eventName":"2026 PG 15U World Series - National","startDate":"2026-07-11","endDate":"2026-07-15","gross":2995.0,"final":2845.25,"pgCost":2396.0,"profit":449.25},{"team":"CBU United 2029 Murphy","eventName":"2025 PG 17U National Elite Championship (INVITE)","startDate":"2025-07-12","endDate":"2025-07-16","gross":2595.0,"final":2465.25,"pgCost":2076.0,"profit":389.25}],"totalFinal":19441.75,"totalPgCost":16431.0,"totalProfit":3010.75},{"name":"Jacksonville Youth","invoice":"Perfect Game","events":[{"team":"CBU 11U Sanchez","eventName":"2026 11U PG Citrus Series (AAA)","startDate":"2026-06-05","endDate":"2026-06-08","gross":550.0,"final":522.5,"pgCost":440.0,"profit":82.5},{"team":"CBU 13U Madsen","eventName":"2026 13U 60/90 PG Sunshine State Championship (OPEN)","startDate":"2026-06-05","endDate":"2026-06-07","gross":970.0,"final":921.5,"pgCost":826.0,"profit":95.5}],"totalFinal":1444.0,"totalPgCost":1266.0,"totalProfit":178.0},{"name":"Tampa","invoice":"Perfect Game","events":[{"team":"CBU United 10u Olasin","eventName":"2026 10U PG Father's Day Classic (OPEN)","startDate":"2026-06-19","endDate":"2026-06-21","gross":450.0,"final":427.5,"pgCost":360.0,"profit":67.5},{"team":"CBU United 13u Faber","eventName":"2026 13U PG Father's Day Classic (OPEN)","startDate":"2026-06-19","endDate":"2026-06-21","gross":725.0,"final":688.75,"pgCost":580.0,"profit":108.75}],"totalFinal":1116.25,"totalPgCost":940.0,"totalProfit":176.25},{"name":"Georgia","invoice":"Perfect Game","events":[{"team":"CBU 8U United Mahfouz","eventName":"2026 8U PG June Blast","startDate":"2026-06-06","endDate":"2026-06-07","gross":295.0,"final":280.25,"pgCost":236.0,"profit":44.25},{"team":"CBU 8U United Mahfouz","eventName":"2026 8U PG Hostess City of The South Grand Slam","startDate":"2026-06-20","endDate":"2026-06-21","gross":295.0,"final":280.25,"pgCost":236.0,"profit":44.25},{"team":"CBU United 12U Strickland","eventName":"2026 12U PG Gulf Coast World Series (Gulf Shores - Week 3)","startDate":"2026-06-10","endDate":"2026-06-13","gross":1145.0,"final":1087.75,"pgCost":916.0,"profit":171.75},{"team":"CBU United 12U Strickland","eventName":"2026 12U PG Southeast World Series - Dublin (AAA)","startDate":"2026-06-25","endDate":"2026-06-28","gross":695.0,"final":660.25,"pgCost":556.0,"profit":104.25}],"totalFinal":2308.5,"totalPgCost":1944.0,"totalProfit":364.5}]

// ── Prospect Select profit data ───────────────────────────────────────────────
const PS_PROFIT = [
  {"name":"CBU","invoice":"Prospect Select","noDiscount":true,"events":[
    {"team":"CBU 2027 Scout Olasin","eventName":"Florida Invite","startDate":"2026-05-29","endDate":"2026-06-01","affPays":2500,"psCost":650,"profit":1850},
    {"team":"CBU 2029 Scout Team Pascual","eventName":"Florida Invite","startDate":"2026-05-29","endDate":"2026-06-01","affPays":2500,"psCost":650,"profit":1850},
    {"team":"CBU 2028 Scout Team DiBenedetto","eventName":"Florida Invite","startDate":"2026-05-29","endDate":"2026-06-01","affPays":2500,"psCost":650,"profit":1850},
    {"team":"CBU 2027 United Thomas","eventName":"Palm Beach Classic","startDate":"2026-06-05","endDate":"2026-06-10","affPays":2100,"psCost":650,"profit":1450},
    {"team":"CBU 2027 Scout Team McCoy","eventName":"Palm Beach Classic","startDate":"2026-06-05","endDate":"2026-06-10","affPays":2100,"psCost":650,"profit":1450},
    {"team":"CBU 2027 Scout Team Menendez","eventName":"Palm Beach Classic","startDate":"2026-06-05","endDate":"2026-06-10","affPays":2100,"psCost":650,"profit":1450},
    {"team":"CBU 2029 Scout Team Wisser","eventName":"Palm Beach Classic","startDate":"2026-06-05","endDate":"2026-06-10","affPays":2100,"psCost":650,"profit":1450},
    {"team":"CBU 2029 United Cates","eventName":"Palm Beach Classic","startDate":"2026-06-05","endDate":"2026-06-10","affPays":2100,"psCost":650,"profit":1450},
    {"team":"CBU 2028 United Severidt","eventName":"Palm Beach Classic","startDate":"2026-06-05","endDate":"2026-06-10","affPays":2100,"psCost":650,"profit":1450},
    {"team":"CBU 2028 United Merrell","eventName":"Palm Beach Classic","startDate":"2026-06-05","endDate":"2026-06-10","affPays":2100,"psCost":650,"profit":1450},
    {"team":"CBU 2030 United Navy","eventName":"Palm Beach Classic Futures","startDate":"2026-06-11","endDate":"2026-06-14","affPays":995,"psCost":995,"profit":0},
    {"team":"CBU 2030 United Red","eventName":"Palm Beach Classic Futures","startDate":"2026-06-11","endDate":"2026-06-14","affPays":995,"psCost":995,"profit":0},
    {"team":"CBU 2030 United Santiago","eventName":"Palm Beach Classic Futures","startDate":"2026-06-11","endDate":"2026-06-14","affPays":995,"psCost":995,"profit":0},
    {"team":"CBU 2027 Scout Team McCoy","eventName":"Black Bear Classic","startDate":"2026-06-17","endDate":"2026-06-21","affPays":2100,"psCost":650,"profit":1450},
    {"team":"CBU 2027 Scout Team Menendez","eventName":"Black Bear Classic","startDate":"2026-06-17","endDate":"2026-06-21","affPays":2100,"psCost":650,"profit":1450},
    {"team":"CBU 2027 United Thomas","eventName":"Black Bear Classic","startDate":"2026-06-17","endDate":"2026-06-21","affPays":2100,"psCost":650,"profit":1450},
    {"team":"CBU 2027 Scout Team Menendez","eventName":"Boston Classic","startDate":"2026-07-06","endDate":"2026-07-11","affPays":2695,"psCost":650,"profit":2045},
  ],"totalAffPays":34180,"totalPsCost":12085,"totalProfit":22095},
  {"name":"Jacksonville","invoice":"Prospect Select","events":[
    {"team":"CBU United Fleming 17U","eventName":"Palm Beach Classic","startDate":"2026-06-05","endDate":"2026-06-10","affPays":1995,"psCost":650,"profit":1345},
    {"team":"CBU United Murphy - 15U","eventName":"Palm Beach Classic","startDate":"2026-06-05","endDate":"2026-06-10","affPays":1995,"psCost":650,"profit":1345},
    {"team":"CBU United Fleming 17U","eventName":"Black Bear Classic","startDate":"2026-06-17","endDate":"2026-06-21","affPays":1995,"psCost":650,"profit":1345},
    {"team":"CBU United Murphy - 15U","eventName":"Palm Beach Open","startDate":"2026-06-20","endDate":"2026-06-24","affPays":1705.25,"psCost":650,"profit":1055.25},
  ],"totalAffPays":7690.25,"totalPsCost":2600,"totalProfit":5090.25},
]

const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (s) => new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const fmtTs = (ts) => new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Stat({ label, value, color, last }) {
  return (
    <div style={{ padding: '18px 20px', borderRight: last ? 'none' : '1px solid var(--line)' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
      <div className="num" style={{ fontSize: 22, fontWeight: 600, color: color || 'var(--navy)', wordBreak: 'break-all' }}>{value}</div>
    </div>
  )
}

function Pill({ status }) {
  const map = { paid: ['var(--green)', 'Paid'], partial: ['var(--amber)', 'Partial'], unpaid: ['var(--red)', 'Unpaid'] }
  const [bg, label] = map[status]
  return <span style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, padding: '4px 8px', background: bg, color: 'white', borderRadius: 2, whiteSpace: 'nowrap' }}>{label}</span>
}

function InvoiceBadge({ label }) {
  const colors = { 'Perfect Game': ['#1a365d','#bee3f8'], 'Prospect Select': ['#1a3a1a','#c6f6d5'] }
  const [bg, text] = colors[label] || ['#333','#eee']
  return <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, padding: '3px 7px', background: bg, color: text, borderRadius: 2, whiteSpace: 'nowrap' }}>{label}</span>
}

// ─── Top Nav ──────────────────────────────────────────────────────────────────
function TopNav({ page, onNavigate }) {
  return (
    <div style={{ background: 'var(--navy)', color: 'white', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
        <div style={{ width: 26, height: 26, background: 'var(--red)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>$</span>
        </div>
        <span className="serif" style={{ fontSize: 17 }}>CBU Tampa</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 4 }} className="nav-subtitle">· Summer 2026</span>
      </div>
      <div style={{ display: 'flex' }}>
        {[{ id: 'public', label: 'Affiliate View' }, { id: 'admin', label: 'Admin Portal' }].map(item => (
          <button key={item.id} onClick={() => onNavigate(item.id)} style={{
            background: 'transparent', border: 'none', color: page === item.id ? 'white' : 'rgba(255,255,255,0.5)',
            padding: '14px 14px', fontSize: 11, fontWeight: page === item.id ? 700 : 400,
            letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
            borderBottom: page === item.id ? '2px solid var(--red)' : '2px solid transparent', whiteSpace: 'nowrap'
          }}>{item.label}</button>
        ))}
      </div>
    </div>
  )
}

// ─── PUBLIC: Affiliate View ───────────────────────────────────────────────────
function PublicView({ payments }) {
  const [expanded, setExpanded] = useState(null)
  const paidMap = useMemo(() => {
    const m = {}
    payments.forEach(p => { m[p.affiliate] = (m[p.affiliate] || 0) + Number(p.amount) })
    return m
  }, [payments])

  const grandTotal   = AFFILIATES.reduce((s, a) => s + a.finalTotal, 0)
  const grandSavings = AFFILIATES.filter(a => !a.noDiscount && a.events.length > 0)
    .reduce((s, a) => s + a.events.reduce((es, e) => es + (e.gross - e.final), 0), 0)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 16px 80px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.22em', color: 'var(--red)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>#RedHatNation · #United · #JustDoU</div>
        <div className="serif" style={{ fontSize: 34, lineHeight: 1.05, marginBottom: 8 }}>Affiliate Pricing</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>All pricing reflects a <strong>5% discount</strong> off list price. Tap any affiliate to see their breakdown.</div>
      </div>

      <div className="stats-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid var(--line)', background: 'var(--paper)', marginBottom: 24 }}>
        <Stat label="Affiliates" value={AFFILIATES.length} />
        <Stat label="Combined Owed" value={fmt(grandTotal)} />
        <Stat label="Total Savings (5%)" value={fmt(grandSavings)} color="var(--green)" last />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {AFFILIATES.map(aff => {
          const isOpen = expanded === aff.name
          const paid = paidMap[aff.name] || 0
          const balance = +(aff.finalTotal - paid).toFixed(2)
          const noDiscount = !!aff.noDiscount
          const affSavings = noDiscount ? 0 : aff.events.reduce((s, e) => s + (e.gross - e.final), 0)
          const byTeam = {}
          aff.events.forEach(e => { (byTeam[e.team] = byTeam[e.team] || []).push(e) })
          const status = balance <= 0.005 ? 'paid' : paid > 0 ? 'partial' : 'unpaid'
          const pct = Math.min(100, Math.round((paid / aff.finalTotal) * 100))
          const fillColor = { paid: 'var(--green)', partial: 'var(--amber)', unpaid: 'var(--red)' }[status]

          return (
            <div key={aff.name} style={{ background: 'var(--paper)', border: '1px solid var(--line)', overflow: 'hidden' }}>
              <div onClick={() => setExpanded(isOpen ? null : aff.name)}
                style={{ padding: '16px 18px', cursor: 'pointer', background: isOpen ? 'rgba(11,31,58,0.04)' : 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <div className="serif" style={{ fontSize: 24 }}>{aff.name}</div>
                      {noDiscount && <span style={{ fontSize: 10, background: 'rgba(11,31,58,0.08)', color: 'var(--navy)', padding: '3px 8px', borderRadius: 20, fontWeight: 600, letterSpacing: '0.06em' }}>CBU BRANCH</span>}
                      {affSavings > 0 && <span style={{ fontSize: 11, background: 'rgba(27,123,63,0.1)', color: 'var(--green)', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>Saving {fmt(affSavings)}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {aff.events.length > 0 ? `${aff.events.length} event${aff.events.length !== 1 ? 's' : ''} · ${aff.teams.length} team${aff.teams.length !== 1 ? 's' : ''}` : 'Prior invoice'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div className="num" style={{ fontSize: 22, fontWeight: 700, color: balance <= 0.005 ? 'var(--green)' : 'var(--navy)' }}>{fmt(balance)}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Balance Due</div>
                    </div>
                    <div style={{ fontSize: 16, color: 'var(--muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>▾</div>
                  </div>
                </div>
                <div style={{ height: 4, background: 'rgba(11,31,58,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pct + '%', background: fillColor, transition: 'width 240ms' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>{fmt(paid)} paid of {fmt(aff.finalTotal)} ({pct}%)</div>
              </div>

              {isOpen && (
                <div style={{ borderTop: '1px solid var(--line)' }}>
                  {aff.events.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic' }}>Prior invoice — event detail not available.</div>
                  ) : (
                    <>
                      {affSavings > 0 && (
                        <div style={{ margin: '16px 16px 0', padding: '12px 16px', background: 'rgba(27,123,63,0.08)', border: '1px solid rgba(27,123,63,0.2)', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Your 5% Discount Summary</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>List {fmt(aff.events.reduce((s,e)=>s+e.gross,0))} → Your price {fmt(aff.finalTotal)}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>−{fmt(affSavings)}</div>
                            <div style={{ fontSize: 10, color: 'var(--green)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>You Save</div>
                          </div>
                        </div>
                      )}
                      {noDiscount && (
                        <div style={{ margin: '16px 16px 0', padding: '12px 16px', background: 'rgba(11,31,58,0.05)', border: '1px solid var(--line)', borderRadius: 4 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>CBU Branch — Standard Pricing</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>CBU teams pay the standard entry fee — the same rate CBU pays the tournament organizer.</div>
                        </div>
                      )}
                      <div style={{ padding: '16px' }}>
                        {Object.entries(byTeam).map(([team, evs]) => {
                          const teamGross = evs.reduce((s,e) => s+e.gross, 0)
                          const teamFinal = evs.reduce((s,e) => s+e.final, 0)
                          const teamSavings = teamGross - teamFinal
                          return (
                            <div key={team} style={{ marginBottom: 14, border: '1px solid var(--line)', background: 'white' }}>
                              <div style={{ background: 'var(--navy)', color: 'white', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 600, fontSize: 13 }}>{team}</span>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                  {!noDiscount && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }} className="num">{fmt(teamGross)}</span>}
                                  <span className="num" style={{ fontSize: 14, fontWeight: 600 }}>{fmt(teamFinal)}</span>
                                  {!noDiscount && teamSavings > 0 && <span style={{ fontSize: 10, background: 'rgba(27,123,63,0.3)', color: '#86efac', padding: '2px 7px', borderRadius: 10 }}>−{fmt(teamSavings)}</span>}
                                </div>
                              </div>
                              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                <div style={{ minWidth: 400 }}>
                                  <div style={{ padding: '6px 14px', display: 'grid', gridTemplateColumns: noDiscount ? '90px 1fr 110px' : '90px 1fr 90px 80px 100px', gap: 10, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', borderBottom: '1px solid var(--line)', background: 'rgba(11,31,58,0.02)' }}>
                                    <div>Dates</div><div>Event</div>
                                    {noDiscount ? <div style={{ textAlign: 'right' }}>Entry Fee</div> : <><div style={{ textAlign: 'right' }}>List</div><div style={{ textAlign: 'right' }}>Savings</div><div style={{ textAlign: 'right' }}>Your Price</div></>}
                                  </div>
                                  {evs.map((e, i) => (
                                    <div key={i} style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: noDiscount ? '90px 1fr 110px' : '90px 1fr 90px 80px 100px', gap: 10, alignItems: 'center', fontSize: 12, borderTop: i > 0 ? '1px solid var(--line)' : 'none' }}>
                                      <div className="num" style={{ color: 'var(--muted)', fontSize: 10 }}>{fmtDate(e.startDate)}–{fmtDate(e.endDate)}</div>
                                      <div>
                                        <div>{e.eventName}</div>
                                        {e.invoice && <div style={{ marginTop: 2 }}><InvoiceBadge label={e.invoice} /></div>}
                                      </div>
                                      {noDiscount
                                        ? <div className="num" style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(e.final)}</div>
                                        : <><div className="num" style={{ textAlign: 'right', color: 'var(--muted)', textDecoration: 'line-through', fontSize: 12 }}>{fmt(e.gross)}</div>
                                           <div className="num" style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 600 }}>−{fmt(e.gross-e.final)}</div>
                                           <div className="num" style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(e.final)}</div></>
                                      }
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 40, textAlign: 'center', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        CBU Baseball · All prices reflect 5% CBU discount where applicable
      </div>
    </div>
  )
}

// ─── ADMIN: Lock ──────────────────────────────────────────────────────────────
function AdminLock({ onUnlock }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const submit = () => { if (pw === PASSWORD) onUnlock(); else { setErr(true); setPw('') } }
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, background: 'var(--paper)', border: '1px solid var(--line)', padding: '36px 28px', boxShadow: '0 20px 60px -20px rgba(11,31,58,0.2)' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.22em', color: 'var(--red)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>Admin Portal</div>
        <div className="serif" style={{ fontSize: 26, marginBottom: 22 }}>Password Required</div>
        <label style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Password</label>
        <input type="password" value={pw} autoFocus onChange={e => { setPw(e.target.value); setErr(false) }} onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ width: '100%', padding: '12px 14px', fontSize: 16, border: `1px solid ${err ? 'var(--red)' : 'var(--line)'}`, background: 'white', outline: 'none', fontFamily: 'inherit', marginBottom: 6, borderRadius: 2 }} />
        {err && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 8 }}>Incorrect password.</div>}
        <button onClick={submit} style={{ width: '100%', marginTop: 10, padding: 13, background: 'var(--navy)', color: 'white', border: 'none', fontWeight: 600, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 2 }}>Enter</button>
      </div>
    </div>
  )
}

// ─── ADMIN: Affiliate Row ─────────────────────────────────────────────────────
function AffRow({ aff, paid, selected, onClick }) {
  const balance = +(aff.finalTotal - paid).toFixed(2)
  const pct = Math.min(100, Math.round((paid / aff.finalTotal) * 100))
  const status = balance <= 0.005 ? 'paid' : paid > 0 ? 'partial' : 'unpaid'
  const fillColor = { paid: 'var(--green)', partial: 'var(--amber)', unpaid: 'var(--red)' }[status]
  return (
    <div onClick={onClick} style={{ padding: '16px 18px', cursor: 'pointer', background: selected ? 'rgba(11,31,58,0.05)' : 'transparent', transition: 'background 120ms' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <Pill status={status} />
            <span className="serif" style={{ fontSize: 22 }}>{aff.name}</span>
            {aff.noDiscount && <span style={{ fontSize: 9, background: 'rgba(11,31,58,0.1)', color: 'var(--navy)', padding: '3px 7px', borderRadius: 2, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>CBU Branch</span>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            {aff.events.length > 0 ? `${aff.events.length} event${aff.events.length !== 1 ? 's' : ''} · ${aff.teams.length} team${aff.teams.length !== 1 ? 's' : ''}` : 'Prior invoice'}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, color: balance <= 0.005 ? 'var(--green)' : 'var(--navy)' }}>{fmt(balance)}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Balance Due</div>
        </div>
      </div>
      <div style={{ height: 4, background: 'rgba(11,31,58,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: fillColor, transition: 'width 240ms' }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>{fmt(paid)} paid of {fmt(aff.finalTotal)} ({pct}%)</div>
    </div>
  )
}

// ─── ADMIN: Detail Panel ──────────────────────────────────────────────────────
function Detail({ aff, paidMap, log, onClose, onRefresh }) {
  const paid = paidMap[aff.name] || 0
  const balance = +(aff.finalTotal - paid).toFixed(2)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const byTeam = useMemo(() => { const m = {}; aff.events.forEach(e => { (m[e.team] = m[e.team] || []).push(e) }); return m }, [aff])
  const affLog = log.filter(l => l.affiliate === aff.name).slice().reverse()
  const noDiscount = !!aff.noDiscount

  const recordPayment = async (amt, noteText) => {
    if (!amt || amt <= 0) return
    setBusy(true)
    const { error } = await supabase.from('payments').insert({ affiliate: aff.name, amount: amt, note: noteText || null })
    if (!error) { await onRefresh(); setAmount(''); setNote('') }
    else alert('Error: ' + error.message)
    setBusy(false)
  }
  const resetPayments = async () => {
    if (!confirm(`Reset all payments for ${aff.name}?`)) return
    setBusy(true)
    const { error } = await supabase.from('payments').delete().eq('affiliate', aff.name)
    if (!error) await onRefresh()
    setBusy(false)
  }

  return (
    <div style={{ marginTop: 16, background: 'var(--paper)', border: '1px solid var(--line)', padding: '24px 18px 28px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 5, height: 50, background: 'var(--red)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Affiliate Detail</div>
          <div className="serif" style={{ fontSize: 32, lineHeight: 1, marginBottom: 6 }}>{aff.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{aff.teams.join(' · ') || 'Prior invoice'}</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--line)', padding: '7px 12px', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--navy)', whiteSpace: 'nowrap', flexShrink: 0 }}>Close</button>
      </div>

      <div className="stats-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid var(--line)', marginBottom: 22 }}>
        <Stat label="Final Price" value={fmt(aff.finalTotal)} />
        <Stat label="Paid" value={fmt(paid)} color="var(--green)" />
        <Stat label="Balance" value={fmt(balance)} color={balance > 0.005 ? 'var(--red)' : 'var(--green)'} last />
      </div>

      <div className="pay-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr auto auto', gap: 8, marginBottom: 22, alignItems: 'end' }}>
        <div>
          <label style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Amount</label>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', background: 'white', padding: '0 10px' }}>
            <span className="num" style={{ color: 'var(--muted)', marginRight: 5, fontSize: 14 }}>$</span>
            <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="num"
              style={{ border: 'none', outline: 'none', padding: '11px 0', fontSize: 15, width: '100%', background: 'transparent' }} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Quick</label>
          <div style={{ display: 'flex', gap: 5 }}>
            {['½','Full'].map((label, i) => (
              <button key={label} disabled={balance <= 0} onClick={() => setAmount(i === 0 ? (balance/2).toFixed(2) : balance.toFixed(2))}
                style={{ flex: 1, background: 'white', border: '1px solid var(--line)', padding: '11px 0', fontSize: 12, fontFamily: 'inherit', opacity: balance <= 0 ? 0.4 : 1 }}>{label}</button>
            ))}
          </div>
        </div>
        <div className="pay-note">
          <label style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Note</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Check #, Venmo…"
            style={{ width: '100%', border: '1px solid var(--line)', background: 'white', padding: '11px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <button className="pay-rec" disabled={busy || !amount || parseFloat(amount) <= 0} onClick={() => recordPayment(parseFloat(amount), note)}
          style={{ background: 'var(--navy)', color: 'white', border: 'none', padding: '11px 14px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, opacity: (busy || !amount || parseFloat(amount) <= 0) ? 0.4 : 1, whiteSpace: 'nowrap' }}>Record</button>
        <button className="pay-full" disabled={busy || balance <= 0.005} onClick={() => recordPayment(balance, note || 'Marked paid in full')}
          style={{ background: 'var(--red)', color: 'white', border: 'none', padding: '11px 14px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, opacity: (busy || balance <= 0.005) ? 0.4 : 1, whiteSpace: 'nowrap' }}>Paid in Full</button>
      </div>

      <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Event Breakdown</div>
      {aff.events.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', border: '1px dashed var(--line)', marginBottom: 16 }}>Prior invoice — no event detail.</div>}
      {Object.entries(byTeam).map(([team, evs]) => {
        const teamSum = evs.reduce((s,e) => s+e.final, 0)
        return (
          <div key={team} style={{ marginBottom: 14, border: '1px solid var(--line)', background: 'white' }}>
            <div style={{ background: 'var(--navy)', color: 'white', padding: '9px 14px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{team}</span>
              <span className="num" style={{ fontSize: 13 }}>{fmt(teamSum)}</span>
            </div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ minWidth: noDiscount ? 340 : 420 }}>
                <div style={{ padding: '6px 14px', display: 'grid', gridTemplateColumns: noDiscount ? '90px 1fr 100px' : '90px 1fr 85px 80px 95px', gap: 8, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', borderBottom: '1px solid var(--line)', background: 'rgba(11,31,58,0.02)' }}>
                  <div>Dates</div><div>Event</div>
                  {noDiscount ? <div style={{ textAlign:'right' }}>Entry Fee</div> : <><div style={{ textAlign:'right' }}>Gross</div><div style={{ textAlign:'right' }}>Disc.</div><div style={{ textAlign:'right' }}>Final</div></>}
                </div>
                {evs.map((e, i) => (
                  <div key={i} style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: noDiscount ? '90px 1fr 100px' : '90px 1fr 85px 80px 95px', gap: 8, alignItems: 'center', fontSize: 12, borderTop: i > 0 ? '1px solid var(--line)' : 'none' }}>
                    <div className="num" style={{ color: 'var(--muted)', fontSize: 10 }}>{fmtDate(e.startDate)}–{fmtDate(e.endDate)}</div>
                    <div>
                      <div>{e.eventName}</div>
                      {e.invoice && <div style={{ marginTop: 2 }}><InvoiceBadge label={e.invoice} /></div>}
                    </div>
                    {noDiscount
                      ? <div className="num" style={{ textAlign:'right', fontWeight:600 }}>{fmt(e.final)}</div>
                      : <><div className="num" style={{ textAlign:'right', color:'var(--muted)' }}>{fmt(e.gross)}</div>
                         <div className="num" style={{ textAlign:'right', color:'var(--red)' }}>−{fmt(e.gross*0.05)}</div>
                         <div className="num" style={{ textAlign:'right', fontWeight:600 }}>{fmt(e.final)}</div></>
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>Payment Log</div>
        {affLog.length > 0 && <button onClick={resetPayments} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'underline' }}>Reset</button>}
      </div>
      {affLog.length === 0
        ? <div style={{ padding: 16, textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', border: '1px dashed var(--line)' }}>No payments yet.</div>
        : <div style={{ border: '1px solid var(--line)', background: 'white' }}>
            {affLog.map((p, i) => (
              <div key={p.id} style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', fontSize: 12, borderTop: i > 0 ? '1px solid var(--line)' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{p.note || <span style={{ color:'var(--muted)', fontStyle:'italic' }}>—</span>}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{fmtTs(p.created_at)}</div>
                </div>
                <div className="num" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--green)', whiteSpace: 'nowrap' }}>+{fmt(p.amount)}</div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}

// ─── ADMIN: Profit Tab ────────────────────────────────────────────────────────
function ProfitSection({ title, data, costLabel }) {
  const [expanded, setExpanded] = useState(null)
  const grandRev    = data.reduce((s,a) => s + (a.totalFinal ?? a.totalAffPays), 0)
  const grandCost   = data.reduce((s,a) => s + (a.totalPgCost ?? a.totalPsCost), 0)
  const grandProfit = data.reduce((s,a) => s + a.totalProfit, 0)
  const margin      = grandRev > 0 ? ((grandProfit/grandRev)*100).toFixed(1) : '0.0'

  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div className="serif" style={{ fontSize: 24 }}>{title}</div>
        <InvoiceBadge label={title === 'Perfect Game' ? 'Perfect Game' : 'Prospect Select'} />
      </div>
      <div className="stats-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '1px solid var(--line)', background: 'var(--paper)', marginBottom: 16 }}>
        <Stat label="Revenue" value={fmt(grandRev)} />
        <Stat label={costLabel} value={fmt(grandCost)} color="var(--red)" />
        <Stat label="Profit" value={fmt(grandProfit)} color="var(--green)" />
        <Stat label="Margin" value={margin + '%'} color="var(--green)" last />
      </div>
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}>
        {data.map((aff, i) => {
          const isOpen = expanded === (aff.name + title)
          const rev    = aff.totalFinal ?? aff.totalAffPays
          const cost   = aff.totalPgCost ?? aff.totalPsCost
          const profit = aff.totalProfit
          const margin_  = rev > 0 ? ((profit/rev)*100).toFixed(1) : '0.0'
          return (
            <div key={aff.name + title} style={{ borderTop: i > 0 ? '1px solid var(--line)' : 'none' }}>
              <div onClick={() => setExpanded(isOpen ? null : (aff.name + title))}
                style={{ padding: '16px 18px', cursor: 'pointer', background: isOpen ? 'rgba(11,31,58,0.04)' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <div className="serif" style={{ fontSize: 20 }}>{aff.name}</div>
                    {aff.noDiscount && <span style={{ fontSize: 9, background: 'rgba(11,31,58,0.1)', color: 'var(--navy)', padding: '2px 6px', borderRadius: 2, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>CBU Branch</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div><div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Revenue</div><div className="num" style={{ fontSize: 13 }}>{fmt(rev)}</div></div>
                    <div><div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{costLabel}</div><div className="num" style={{ fontSize: 13, color: 'var(--red)' }}>{fmt(cost)}</div></div>
                    <div><div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Margin</div><div className="num" style={{ fontSize: 13 }}>{margin_}%</div></div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="num" style={{ fontSize: 24, fontWeight: 600, color: profit >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(profit)}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Profit</div>
                </div>
              </div>
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--line)', background: 'white' }}>
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <div style={{ minWidth: 520 }}>
                      <div style={{ padding: '7px 18px', display: 'grid', gridTemplateColumns: '90px 1fr 95px 95px 95px 75px', gap: 10, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', borderBottom: '1px solid var(--line)', background: 'rgba(11,31,58,0.03)' }}>
                        <div>Dates</div><div>Event</div>
                        <div style={{ textAlign:'right' }}>Aff. Pays</div>
                        <div style={{ textAlign:'right' }}>{costLabel}</div>
                        <div style={{ textAlign:'right' }}>Profit</div>
                        <div style={{ textAlign:'right' }}>Margin</div>
                      </div>
                      {aff.events.map((e, idx) => {
                        const ePays   = e.final ?? e.affPays
                        const eCost   = e.pgCost ?? e.psCost
                        const eProfit = e.profit
                        const eMargin = ePays > 0 ? ((eProfit/ePays)*100).toFixed(1) : '0.0'
                        return (
                          <div key={idx} style={{ padding: '10px 18px', display: 'grid', gridTemplateColumns: '90px 1fr 95px 95px 95px 75px', gap: 10, alignItems: 'center', fontSize: 12, borderTop: idx > 0 ? '1px solid var(--line)' : 'none' }}>
                            <div className="num" style={{ color:'var(--muted)', fontSize:10 }}>{fmtDate(e.startDate)}–{fmtDate(e.endDate)}</div>
                            <div><div>{e.eventName}</div><div style={{ fontSize:10, color:'var(--muted)', marginTop:1 }}>{e.team}</div></div>
                            <div className="num" style={{ textAlign:'right' }}>{fmt(ePays)}</div>
                            <div className="num" style={{ textAlign:'right', color:'var(--red)' }}>{fmt(eCost)}</div>
                            <div className="num" style={{ textAlign:'right', fontWeight:600, color: eProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(eProfit)}</div>
                            <div className="num" style={{ textAlign:'right', color:'var(--muted)' }}>{eMargin}%</div>
                          </div>
                        )
                      })}
                      <div style={{ padding:'10px 18px', display:'grid', gridTemplateColumns:'90px 1fr 95px 95px 95px 75px', gap:10, background:'var(--navy)', color:'white' }}>
                        <div/><div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Total — {aff.name}</div>
                        <div className="num" style={{ textAlign:'right', fontSize:13 }}>{fmt(rev)}</div>
                        <div className="num" style={{ textAlign:'right', fontSize:13 }}>{fmt(cost)}</div>
                        <div className="num" style={{ textAlign:'right', fontSize:13, color:'#86efac' }}>{fmt(profit)}</div>
                        <div className="num" style={{ textAlign:'right', fontSize:13 }}>{margin_}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProfitTab() {
  const pgRev    = PG_PROFIT.reduce((s,a) => s+a.totalFinal, 0)
  const psRev    = PS_PROFIT.reduce((s,a) => s+a.totalAffPays, 0)
  const pgProfit = PG_PROFIT.reduce((s,a) => s+a.totalProfit, 0)
  const psProfit = PS_PROFIT.reduce((s,a) => s+a.totalProfit, 0)
  const totalRev    = pgRev + psRev
  const totalProfit = pgProfit + psProfit
  const totalMargin = totalRev > 0 ? ((totalProfit/totalRev)*100).toFixed(1) : '0.0'

  return (
    <div>
      {/* Grand combined totals */}
      <div style={{ marginBottom: 8 }}>
        <div className="serif" style={{ fontSize: 26, marginBottom: 4 }}>Combined Profit</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>All invoices · Perfect Game + Prospect Select</div>
      </div>
      <div className="stats-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '1px solid var(--line)', background: 'var(--paper)', marginBottom: 32 }}>
        <Stat label="Total Revenue" value={fmt(totalRev)} />
        <Stat label="PG Revenue" value={fmt(pgRev)} />
        <Stat label="PS Revenue" value={fmt(psRev)} />
        <Stat label="Total Profit" value={fmt(totalProfit)} color="var(--green)" last />
      </div>
      <div className="stats-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid var(--line)', background: 'var(--paper)', marginBottom: 36 }}>
        <Stat label="PG Profit" value={fmt(pgProfit)} color="var(--green)" />
        <Stat label="PS Profit" value={fmt(psProfit)} color="var(--green)" />
        <Stat label="Overall Margin" value={totalMargin + '%'} color="var(--green)" last />
      </div>

      <ProfitSection title="Perfect Game" data={PG_PROFIT} costLabel="PG Cost" />
      <ProfitSection title="Prospect Select" data={PS_PROFIT} costLabel="PS Cost" />

      <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>
        * Eustis excluded — prior invoice, event-level cost data not available.<br/>
        * CBU branch: no 5% discount, revenue = full entry fee, cost = PS deposit/balance due.
      </div>
    </div>
  )
}

// ─── ADMIN Portal ─────────────────────────────────────────────────────────────
function AdminPortal() {
  const [unlocked, setUnlocked] = useState(false)
  const [tab, setTab] = useState('payments')
  const [payments, setPayments] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadPayments = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: true })
    if (!error) setPayments(data || [])
    setLoading(false)
  }
  useEffect(() => { if (unlocked) loadPayments() }, [unlocked])

  const paidMap = useMemo(() => {
    const m = {}
    payments.forEach(p => { m[p.affiliate] = (m[p.affiliate] || 0) + Number(p.amount) })
    return m
  }, [payments])

  const totals = useMemo(() => AFFILIATES.reduce((acc, a) => {
    const paid = paidMap[a.name] || 0
    return { final: acc.final + a.finalTotal, paid: acc.paid + paid, balance: acc.balance + (a.finalTotal - paid) }
  }, { final: 0, paid: 0, balance: 0 }), [paidMap])

  if (!unlocked) return <AdminLock onUnlock={() => setUnlocked(true)} />
  const selectedAff = selected ? AFFILIATES.find(a => a.name === selected) : null

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--red)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Admin Portal</div>
          <div className="serif" style={{ fontSize: 34, lineHeight: 1 }}>CBU Tampa <span style={{ color: 'var(--muted)' }}>/</span> Summer 2026</div>
        </div>
        <button onClick={() => { setUnlocked(false); setSelected(null) }} style={{ background: 'transparent', border: '1px solid var(--line)', padding: '7px 12px', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--navy)', flexShrink: 0 }}>Lock</button>
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', margin: '20px 0 24px' }}>
        {[{ id: 'payments', label: 'Payments' }, { id: 'profit', label: 'Profit' }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelected(null) }} style={{
            padding: '11px 22px', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
            border: 'none', background: 'transparent',
            borderBottom: tab === t.id ? '2px solid var(--red)' : '2px solid transparent',
            color: tab === t.id ? 'var(--navy)' : 'var(--muted)', cursor: 'pointer', marginBottom: -1
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'payments' && (
        <>
          <div className="stats-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid var(--line)', background: 'var(--paper)', marginBottom: 24 }}>
            <Stat label="Total Owed" value={fmt(totals.final)} />
            <Stat label="Collected" value={fmt(totals.paid)} color="var(--green)" />
            <Stat label="Outstanding" value={fmt(totals.balance)} color={totals.balance > 0.005 ? 'var(--red)' : 'var(--green)'} last />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div className="serif" style={{ fontSize: 26 }}>Affiliates</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Tap to manage</div>
          </div>
          {loading
            ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
            : <div style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}>
                {AFFILIATES.map((aff, i) => (
                  <div key={aff.name} style={{ borderTop: i > 0 ? '1px solid var(--line)' : 'none' }}>
                    <AffRow aff={aff} paid={paidMap[aff.name] || 0} selected={selected === aff.name} onClick={() => setSelected(selected === aff.name ? null : aff.name)} />
                  </div>
                ))}
              </div>
          }
          {selectedAff && <Detail aff={selectedAff} paidMap={paidMap} log={payments} onClose={() => setSelected(null)} onRefresh={loadPayments} />}
        </>
      )}
      {tab === 'profit' && <ProfitTab />}
      <div style={{ marginTop: 50, textAlign: 'center', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>CBU Tampa Baseball · PG Invoice #26002 · Prospect Select Invoice</div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('public')
  const [payments, setPayments] = useState([])
  useEffect(() => {
    supabase.from('payments').select('affiliate, amount').then(({ data }) => { if (data) setPayments(data) })
  }, [])
  return (
    <div style={{ minHeight: '100vh' }}>
      <TopNav page={page} onNavigate={setPage} />
      {page === 'public' && <PublicView payments={payments} />}
      {page === 'admin'  && <AdminPortal />}
    </div>
  )
}
