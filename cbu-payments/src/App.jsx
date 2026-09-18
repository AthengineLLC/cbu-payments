import { useState, useEffect, useMemo } from 'react'
import { supabase } from './lib/supabase'
import { SEASONS, DEFAULT_SEASON } from './data'

const PASSWORD = 'redhat2026'



const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const round2 = (n) => +Number(n).toFixed(2)

// Merge Supabase-stored affiliates + line items into the season's affiliate list.
// Line items become event-shaped rows; a 5% discount toggles final = amount * 0.95.
function buildAffiliates(baseAffiliates, customAffs, lineItems) {
  const byAff = {}
  lineItems.forEach(li => { (byAff[li.affiliate] = byAff[li.affiliate] || []).push(li) })
  const toEvent = (li) => {
    const day = (li.created_at || '').slice(0, 10)
    const amount = Number(li.amount)
    return { team: li.team || 'Additional Charges', eventName: li.description, startDate: day, endDate: day,
      entryFee: amount, gateFees: 0, gross: amount, final: li.discount ? round2(amount * 0.95) : amount,
      lineItemId: li.id, lineDiscount: !!li.discount }
  }
  const merged = baseAffiliates.map(a => {
    const extra = (byAff[a.name] || []).map(toEvent)
    if (extra.length === 0) return a
    return { ...a, events: [...a.events, ...extra], finalTotal: round2(a.finalTotal + extra.reduce((s, e) => s + e.final, 0)) }
  })
  customAffs.forEach(ca => {
    if (baseAffiliates.some(a => a.name === ca.name)) return
    const extra = (byAff[ca.name] || []).map(toEvent)
    merged.push({ name: ca.name, teams: [], events: extra, finalTotal: round2(extra.reduce((s, e) => s + e.final, 0)), custom: true, affiliateId: ca.id })
  })
  merged.sort((a, b) => a.name === 'CBU' ? -1 : b.name === 'CBU' ? 1 : a.name.localeCompare(b.name))
  return merged
}
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
function TopNav({ page, onNavigate, season, onSeason }) {
  return (
    <div style={{ background: 'var(--navy)', color: 'white', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.2)', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
        <div style={{ width: 26, height: 26, background: 'var(--red)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>$</span>
        </div>
        <span className="serif" style={{ fontSize: 17 }}>CBU Tampa</span>
        <div style={{ display: 'flex', marginLeft: 6, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
          {SEASONS.map(s => (
            <button key={s.id} onClick={() => onSeason(s.id)} style={{
              background: season.id === s.id ? 'var(--red)' : 'transparent',
              border: 'none', color: season.id === s.id ? 'white' : 'rgba(255,255,255,0.55)',
              padding: '5px 10px', fontSize: 10, fontWeight: season.id === s.id ? 700 : 400,
              letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap'
            }}>{s.label}</button>
          ))}
        </div>
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
// Compute per-event payment status using oldest-first waterfall.
// Returns a Map from event (by reference) to 'paid' | 'partial' | 'owed', plus paidAmount for partials.
function computeEventStatus(events, totalPaid) {
  const sorted = [...events].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
  let remaining = totalPaid
  const statusMap = new Map()
  for (const e of sorted) {
    if (remaining >= e.final - 0.005) {
      statusMap.set(e, { status: 'paid', paidAmount: e.final })
      remaining -= e.final
    } else if (remaining > 0.005) {
      statusMap.set(e, { status: 'partial', paidAmount: +remaining.toFixed(2) })
      remaining = 0
    } else {
      statusMap.set(e, { status: 'owed', paidAmount: 0 })
    }
  }
  return statusMap
}

function EventStatusIcon({ status }) {
  if (status === 'paid') {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--green)', background: 'rgba(27,123,63,0.1)', padding: '3px 8px', borderRadius: 3, whiteSpace: 'nowrap' }}>✓ Paid</span>
  }
  if (status === 'partial') {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--amber)', background: 'rgba(180,83,9,0.1)', padding: '3px 8px', borderRadius: 3, whiteSpace: 'nowrap' }}>◐ Partial</span>
  }
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--red)', background: 'rgba(200,16,46,0.1)', padding: '3px 8px', borderRadius: 3, whiteSpace: 'nowrap' }}>● Owed</span>
}

function PublicView({ affiliates, payments, season }) {
  const [expanded, setExpanded] = useState(null)
  const paidMap = useMemo(() => {
    const m = {}
    payments.forEach(p => { m[p.affiliate] = (m[p.affiliate] || 0) + Number(p.amount) })
    return m
  }, [payments])

  const grandTotal   = affiliates.reduce((s, a) => s + a.finalTotal, 0)
  const grandSavings = affiliates.filter(a => a.events.length > 0)
    .reduce((s, a) => s + a.events.reduce((es, e) => es + (e.gross - e.final), 0), 0)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 16px 80px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.22em', color: 'var(--red)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>#RedHatNation · #United · #JustDoU</div>
        <div className="serif" style={{ fontSize: 34, lineHeight: 1.05, marginBottom: 8 }}>Affiliate Pricing <span style={{ color: 'var(--muted)' }}>· {season.label}</span></div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{season.priceNote} Tap any affiliate to see their breakdown.</div>
      </div>

      <div className="stats-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid var(--line)', background: 'var(--paper)', marginBottom: 24 }}>
        <Stat label="Affiliates" value={affiliates.length} />
        <Stat label="Combined Owed" value={fmt(grandTotal)} />
        <Stat label="Total Savings (5%)" value={fmt(grandSavings)} color="var(--green)" last />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {affiliates.map(aff => {
          const isOpen = expanded === aff.name
          const paid = paidMap[aff.name] || 0
          const balance = +(aff.finalTotal - paid).toFixed(2)
          const noDiscount = false  // all affiliates get 5% on public view
          const affSavings = aff.events.reduce((s, e) => s + (e.gross - e.final), 0)
          const byTeam = {}
          aff.events.forEach(e => { (byTeam[e.team] = byTeam[e.team] || []).push(e) })
          const eventStatusMap = computeEventStatus(aff.events, paid)
          const status = balance <= 0.005 ? 'paid' : paid > 0 ? 'partial' : 'unpaid'
          const pct = aff.finalTotal > 0 ? Math.min(100, Math.round((paid / aff.finalTotal) * 100)) : 0
          const fillColor = { paid: 'var(--green)', partial: 'var(--amber)', unpaid: 'var(--red)' }[status]

          return (
            <div key={aff.name} style={{ background: 'var(--paper)', border: '1px solid var(--line)', overflow: 'hidden' }}>
              <div onClick={() => setExpanded(isOpen ? null : aff.name)}
                style={{ padding: '16px 18px', cursor: 'pointer', background: isOpen ? 'rgba(11,31,58,0.04)' : 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <div className="serif" style={{ fontSize: 24 }}>{aff.name}</div>
                      {affSavings > 0 && <span style={{ fontSize: 11, background: 'rgba(27,123,63,0.1)', color: 'var(--green)', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>Saving {fmt(affSavings)}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {aff.events.length > 0 ? `${aff.events.length} event${aff.events.length !== 1 ? 's' : ''} · ${aff.teams.length} team${aff.teams.length !== 1 ? 's' : ''}` : aff.custom ? 'No charges yet' : 'Prior invoice'}
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
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic' }}>{aff.custom ? 'No charges yet.' : 'Prior invoice — event detail not available.'}</div>
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
                                  {!noDiscount && teamSavings > 0 && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }} className="num">{fmt(teamGross)}</span>}
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                          <span>{e.eventName}</span>
                                          {(() => {
                                            const st = eventStatusMap.get(e)
                                            return st ? <EventStatusIcon status={st.status} /> : null
                                          })()}
                                        </div>
                                        {e.invoice && <div style={{ marginTop: 2 }}><InvoiceBadge label={e.invoice} /></div>}
                                      </div>
                                      {noDiscount
                                        ? <div className="num" style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(e.final)}</div>
                                        : <><div className="num" style={{ textAlign: 'right', color: 'var(--muted)', textDecoration: 'line-through', fontSize: 12 }}>{e.gross > e.final ? fmt(e.gross) : ''}</div>
                                           <div className="num" style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 600 }}>{e.gross > e.final ? '−' + fmt(e.gross-e.final) : '—'}</div>
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
  const pct = aff.finalTotal > 0 ? Math.min(100, Math.round((paid / aff.finalTotal) * 100)) : 0
  const status = balance <= 0.005 ? 'paid' : paid > 0 ? 'partial' : 'unpaid'
  const fillColor = { paid: 'var(--green)', partial: 'var(--amber)', unpaid: 'var(--red)' }[status]
  return (
    <div onClick={onClick} style={{ padding: '16px 18px', cursor: 'pointer', background: selected ? 'rgba(11,31,58,0.05)' : 'transparent', transition: 'background 120ms' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <Pill status={status} />
            <span className="serif" style={{ fontSize: 22 }}>{aff.name}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            {aff.events.length > 0 ? `${aff.events.length} event${aff.events.length !== 1 ? 's' : ''} · ${aff.teams.length} team${aff.teams.length !== 1 ? 's' : ''}` : aff.custom ? 'No charges yet' : 'Prior invoice'}
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
function Detail({ aff, paidMap, log, onClose, onRefresh, season }) {
  const paid = paidMap[aff.name] || 0
  const balance = +(aff.finalTotal - paid).toFixed(2)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const byTeam = useMemo(() => { const m = {}; aff.events.forEach(e => { (m[e.team] = m[e.team] || []).push(e) }); return m }, [aff])
  const affLog = log.filter(l => l.affiliate === aff.name).slice().reverse()
  const noDiscount = !!aff.adminNoDiscount

  const recordPayment = async (amt, noteText) => {
    if (!amt || amt <= 0) return
    setBusy(true)
    const { error } = await supabase.from('payments').insert({ affiliate: aff.name, amount: amt, note: noteText || null, season: season.id })
    if (!error) { await onRefresh(); setAmount(''); setNote('') }
    else alert('Error: ' + error.message)
    setBusy(false)
  }
  const resetPayments = async () => {
    if (!confirm(`Reset all payments for ${aff.name}?`)) return
    setBusy(true)
    const { error } = await supabase.from('payments').delete().eq('affiliate', aff.name).eq('season', season.id)
    if (!error) await onRefresh()
    setBusy(false)
  }

  // ── Line items (invoicing) ──
  const [liDesc, setLiDesc] = useState('')
  const [liAmount, setLiAmount] = useState('')
  const [liTeam, setLiTeam] = useState('')
  const [liDisc, setLiDisc] = useState(false)

  const addLineItem = async () => {
    const amt = parseFloat(liAmount)
    if (!liDesc.trim() || !amt || amt <= 0) return
    setBusy(true)
    const { error } = await supabase.from('line_items').insert({ affiliate: aff.name, description: liDesc.trim(), team: liTeam.trim() || null, amount: amt, discount: liDisc, season: season.id })
    if (!error) { await onRefresh(); setLiDesc(''); setLiAmount(''); setLiTeam(''); setLiDisc(false) }
    else alert('Error: ' + error.message)
    setBusy(false)
  }
  const toggleLineDiscount = async (e) => {
    setBusy(true)
    const { error } = await supabase.from('line_items').update({ discount: !e.lineDiscount }).eq('id', e.lineItemId)
    if (!error) await onRefresh()
    else alert('Error: ' + error.message)
    setBusy(false)
  }
  const deleteLine = async (e) => {
    if (!confirm(`Remove "${e.eventName}" (${fmt(e.final)}) from ${aff.name}?`)) return
    setBusy(true)
    const { error } = await supabase.from('line_items').delete().eq('id', e.lineItemId)
    if (!error) await onRefresh()
    else alert('Error: ' + error.message)
    setBusy(false)
  }
  const deleteAffiliate = async () => {
    if (!confirm(`Delete affiliate "${aff.name}" and all of its line items and payments?`)) return
    setBusy(true)
    await supabase.from('line_items').delete().eq('affiliate', aff.name)
    await supabase.from('payments').delete().eq('affiliate', aff.name)
    const { error } = await supabase.from('affiliates').delete().eq('id', aff.affiliateId)
    if (error) alert('Error: ' + error.message)
    onClose()
    await onRefresh()
    setBusy(false)
  }

  return (
    <div style={{ marginTop: 16, background: 'var(--paper)', border: '1px solid var(--line)', padding: '24px 18px 28px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 5, height: 50, background: 'var(--red)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Affiliate Detail</div>
          <div className="serif" style={{ fontSize: 32, lineHeight: 1, marginBottom: 6 }}>{aff.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{aff.teams.join(' · ') || (aff.custom ? 'Custom affiliate' : 'Prior invoice')}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {aff.custom && <button disabled={busy} onClick={deleteAffiliate} style={{ background: 'transparent', border: '1px solid var(--red)', padding: '7px 12px', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--red)', whiteSpace: 'nowrap' }}>Delete Affiliate</button>}
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--line)', padding: '7px 12px', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--navy)', whiteSpace: 'nowrap' }}>Close</button>
        </div>
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

      <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Add Line Item</div>
      <div className="pay-grid" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr auto auto', gap: 8, marginBottom: 22, alignItems: 'end' }}>
        <div>
          <label style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Description</label>
          <input type="text" value={liDesc} onChange={e => setLiDesc(e.target.value)} placeholder="Hats, uniforms, event entry…"
            style={{ width: '100%', border: '1px solid var(--line)', background: 'white', padding: '11px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <div>
          <label style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Amount</label>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', background: 'white', padding: '0 10px' }}>
            <span className="num" style={{ color: 'var(--muted)', marginRight: 5, fontSize: 14 }}>$</span>
            <input type="number" step="0.01" min="0" value={liAmount} onChange={e => setLiAmount(e.target.value)} placeholder="0.00" className="num"
              style={{ border: 'none', outline: 'none', padding: '11px 0', fontSize: 15, width: '100%', background: 'transparent' }} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Group (optional)</label>
          <input type="text" value={liTeam} onChange={e => setLiTeam(e.target.value)} placeholder="Team / Merchandise…"
            style={{ width: '100%', border: '1px solid var(--line)', background: 'white', padding: '11px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <button onClick={() => setLiDisc(!liDisc)} title="Apply 5% discount to this line"
          style={{ background: liDisc ? 'var(--green)' : 'white', color: liDisc ? 'white' : 'var(--muted)', border: `1px solid ${liDisc ? 'var(--green)' : 'var(--line)'}`, padding: '11px 14px', fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, whiteSpace: 'nowrap' }}>
          5% {liDisc ? '✓' : ''}
        </button>
        <button disabled={busy || !liDesc.trim() || !parseFloat(liAmount) || parseFloat(liAmount) <= 0} onClick={addLineItem}
          style={{ background: 'var(--navy)', color: 'white', border: 'none', padding: '11px 14px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, opacity: (busy || !liDesc.trim() || !parseFloat(liAmount) || parseFloat(liAmount) <= 0) ? 0.4 : 1, whiteSpace: 'nowrap' }}>+ Add Line</button>
      </div>
      {parseFloat(liAmount) > 0 && liDisc && (
        <div style={{ fontSize: 11, color: 'var(--green)', marginTop: -14, marginBottom: 18 }}>
          With 5% discount: {fmt(parseFloat(liAmount))} → <strong>{fmt(round2(parseFloat(liAmount) * 0.95))}</strong>
        </div>
      )}

      <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Event Breakdown</div>
      {aff.events.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', border: '1px dashed var(--line)', marginBottom: 16 }}>{aff.custom ? 'No line items yet — add one above.' : 'Prior invoice — no event detail.'}</div>}
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
                      {e.lineItemId && (
                        <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
                          <button disabled={busy} onClick={() => toggleLineDiscount(e)} title={e.lineDiscount ? 'Remove 5% discount' : 'Apply 5% discount'}
                            style={{ background: e.lineDiscount ? 'var(--green)' : 'white', color: e.lineDiscount ? 'white' : 'var(--muted)', border: `1px solid ${e.lineDiscount ? 'var(--green)' : 'var(--line)'}`, padding: '3px 8px', fontSize: 9, letterSpacing: '0.08em', fontWeight: 700, cursor: 'pointer' }}>
                            5% {e.lineDiscount ? '✓' : ''}
                          </button>
                          <button disabled={busy} onClick={() => deleteLine(e)}
                            style={{ background: 'white', border: '1px solid var(--line)', color: 'var(--red)', padding: '3px 8px', fontSize: 9, letterSpacing: '0.08em', fontWeight: 700, cursor: 'pointer' }}>✕ Remove</button>
                        </div>
                      )}
                    </div>
                    {noDiscount
                      ? <div className="num" style={{ textAlign:'right', fontWeight:600 }}>{fmt(e.final)}</div>
                      : <><div className="num" style={{ textAlign:'right', color:'var(--muted)' }}>{fmt(e.gross)}</div>
                         <div className="num" style={{ textAlign:'right', color:'var(--red)' }}>−{fmt(e.gross-e.final)}</div>
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

function ProfitTab({ season }) {
  const pg = season.pgProfit, ps = season.psProfit
  const hasPs = ps.length > 0
  const pgRev    = pg.reduce((s,a) => s+a.totalFinal, 0)
  const psRev    = ps.reduce((s,a) => s+a.totalAffPays, 0)
  const pgProfit = pg.reduce((s,a) => s+a.totalProfit, 0)
  const psProfit = ps.reduce((s,a) => s+a.totalProfit, 0)
  const totalRev    = pgRev + psRev
  const totalProfit = pgProfit + psProfit
  const totalMargin = totalRev > 0 ? ((totalProfit/totalRev)*100).toFixed(1) : '0.0'

  return (
    <div>
      {/* Grand combined totals */}
      <div style={{ marginBottom: 8 }}>
        <div className="serif" style={{ fontSize: 26, marginBottom: 4 }}>{hasPs ? 'Combined Profit' : 'Profit'} · {season.label}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{hasPs ? 'All invoices · Perfect Game + Prospect Select' : 'Perfect Game'}</div>
      </div>
      {hasPs ? (
        <div className="stats-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '1px solid var(--line)', background: 'var(--paper)', marginBottom: 32 }}>
          <Stat label="Total Revenue" value={fmt(totalRev)} />
          <Stat label="PG Revenue" value={fmt(pgRev)} />
          <Stat label="PS Revenue" value={fmt(psRev)} />
          <Stat label="Total Profit" value={fmt(totalProfit)} color="var(--green)" last />
        </div>
      ) : (
        <div className="stats-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid var(--line)', background: 'var(--paper)', marginBottom: 32 }}>
          <Stat label="Revenue" value={fmt(totalRev)} />
          <Stat label="Profit" value={fmt(totalProfit)} color="var(--green)" />
          <Stat label="Margin" value={totalMargin + '%'} color="var(--green)" last />
        </div>
      )}
      {hasPs && (
        <div className="stats-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid var(--line)', background: 'var(--paper)', marginBottom: 36 }}>
          <Stat label="PG Profit" value={fmt(pgProfit)} color="var(--green)" />
          <Stat label="PS Profit" value={fmt(psProfit)} color="var(--green)" />
          <Stat label="Overall Margin" value={totalMargin + '%'} color="var(--green)" last />
        </div>
      )}

      <ProfitSection title="Perfect Game" data={pg} costLabel="PG Cost" />
      {hasPs && <ProfitSection title="Prospect Select" data={ps} costLabel="PS Cost" />}

      {season.profitNote && (
        <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>
          {season.profitNote.map((line, i) => <span key={i}>* {line}<br/></span>)}
        </div>
      )}
    </div>
  )
}

// ─── ADMIN Portal ─────────────────────────────────────────────────────────────
function AdminPortal({ affiliates, payments, onRefresh, season }) {
  const [unlocked, setUnlocked] = useState(false)
  const [tab, setTab] = useState('payments')
  const [selected, setSelected] = useState(null)
  const [newAff, setNewAff] = useState('')
  const [addingAff, setAddingAff] = useState(false)

  const paidMap = useMemo(() => {
    const m = {}
    payments.forEach(p => { m[p.affiliate] = (m[p.affiliate] || 0) + Number(p.amount) })
    return m
  }, [payments])

  const totals = useMemo(() => affiliates.reduce((acc, a) => {
    const paid = paidMap[a.name] || 0
    return { final: acc.final + a.finalTotal, paid: acc.paid + paid, balance: acc.balance + (a.finalTotal - paid) }
  }, { final: 0, paid: 0, balance: 0 }), [affiliates, paidMap])

  const addAffiliate = async () => {
    const name = newAff.trim()
    if (!name) return
    if (affiliates.some(a => a.name.toLowerCase() === name.toLowerCase())) { alert('An affiliate with that name already exists.'); return }
    setAddingAff(true)
    const { error } = await supabase.from('affiliates').insert({ name })
    if (error) alert('Error: ' + error.message)
    else { setNewAff(''); await onRefresh(); setSelected(name) }
    setAddingAff(false)
  }

  if (!unlocked) return <AdminLock onUnlock={() => setUnlocked(true)} />
  const selectedAff = selected ? affiliates.find(a => a.name === selected) : null

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--red)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Admin Portal</div>
          <div className="serif" style={{ fontSize: 34, lineHeight: 1 }}>CBU Tampa <span style={{ color: 'var(--muted)' }}>/</span> {season.label}</div>
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
          <div style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}>
            {affiliates.map((aff, i) => (
              <div key={aff.name} style={{ borderTop: i > 0 ? '1px solid var(--line)' : 'none' }}>
                <AffRow aff={aff} paid={paidMap[aff.name] || 0} selected={selected === aff.name} onClick={() => setSelected(selected === aff.name ? null : aff.name)} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <input value={newAff} onChange={e => setNewAff(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAffiliate()} placeholder="New affiliate name…"
              style={{ flex: 1, border: '1px solid var(--line)', background: 'white', padding: '11px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
            <button disabled={addingAff || !newAff.trim()} onClick={addAffiliate}
              style={{ background: 'var(--navy)', color: 'white', border: 'none', padding: '11px 16px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, opacity: (addingAff || !newAff.trim()) ? 0.4 : 1, whiteSpace: 'nowrap' }}>+ Add Affiliate</button>
          </div>
          {selectedAff && <Detail aff={selectedAff} paidMap={paidMap} log={payments} onClose={() => setSelected(null)} onRefresh={onRefresh} season={season} />}
        </>
      )}
      {tab === 'profit' && <ProfitTab season={season} />}
      <div style={{ marginTop: 50, textAlign: 'center', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>CBU Tampa Baseball · {season.invoiceNote}</div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('public')
  const [seasonId, setSeasonId] = useState(DEFAULT_SEASON)
  const [payments, setPayments] = useState([])
  const [customAffs, setCustomAffs] = useState([])
  const [lineItems, setLineItems] = useState([])
  const season = SEASONS.find(s => s.id === seasonId) || SEASONS[0]
  const loadAll = async () => {
    const [p, a, li] = await Promise.all([
      supabase.from('payments').select('*').eq('season', seasonId).order('created_at', { ascending: true }),
      supabase.from('affiliates').select('*').order('created_at', { ascending: true }),
      supabase.from('line_items').select('*').eq('season', seasonId).order('created_at', { ascending: true }),
    ])
    if (p.data) setPayments(p.data)
    if (a.data) setCustomAffs(a.data)
    if (li.data) setLineItems(li.data)
  }
  useEffect(() => { setPayments([]); setLineItems([]); loadAll() }, [seasonId])
  const affiliates = useMemo(() => buildAffiliates(season.affiliates, customAffs, lineItems), [season, customAffs, lineItems])
  return (
    <div style={{ minHeight: '100vh' }}>
      <TopNav page={page} onNavigate={setPage} season={season} onSeason={setSeasonId} />
      {page === 'public' && <PublicView affiliates={affiliates} payments={payments} season={season} />}
      {page === 'admin'  && <AdminPortal affiliates={affiliates} payments={payments} onRefresh={loadAll} season={season} />}
    </div>
  )
}
