import { useState, useEffect, useMemo } from 'react'
import { supabase } from './lib/supabase'
import { AFFILIATES } from './data'

const PASSWORD = 'redhat2026'

const PROFIT_DATA = [{"name":"Jacksonville","events":[{"team":"CBU 2027 United Fleming","eventName":"2026 17U PG East Memorial Day Classic","startDate":"2026-05-22","endDate":"2026-05-25","gross":1625.0,"final":1543.75,"pgCost":1300.0,"profit":243.75},{"team":"CBU 2027 United Fleming","eventName":"2026 PG 17U BCS National Championship (INVITE)","startDate":"2026-07-17","endDate":"2026-07-21","gross":2425.0,"final":2303.75,"pgCost":1940.0,"profit":363.75},{"team":"CBU 2028 Hudgins","eventName":"2026 16U PG Battle at BOOMBAH","startDate":"2026-06-12","endDate":"2026-06-14","gross":1095.0,"final":1040.25,"pgCost":876.0,"profit":164.25},{"team":"CBU 2028 Hudgins","eventName":"2026 PG 16U WWBA National Championship","startDate":"2026-07-06","endDate":"2026-07-13","gross":3750.0,"final":3562.5,"pgCost":3000.0,"profit":562.5},{"team":"CBU 2028 Hudgins","eventName":"2026 PG 16U BCS National Championship (INVITE)","startDate":"2026-07-23","endDate":"2026-07-27","gross":2395.0,"final":2275.25,"pgCost":1916.0,"profit":359.25},{"team":"CBU United 2029 Murphy","eventName":"2026 18U PG Battle at the Beach","startDate":"2026-05-23","endDate":"2026-05-25","gross":1590.0,"final":1510.5,"pgCost":1331.0,"profit":179.5},{"team":"CBU United 2029 Murphy","eventName":"2026 PG 15U BCS National Championship (INVITE)","startDate":"2026-06-27","endDate":"2026-07-01","gross":1995.0,"final":1895.25,"pgCost":1596.0,"profit":299.25},{"team":"CBU United 2029 Murphy","eventName":"2026 PG 15U World Series - National","startDate":"2026-07-11","endDate":"2026-07-15","gross":2995.0,"final":2845.25,"pgCost":2396.0,"profit":449.25}],"totalFinal":16976.5,"totalPgCost":14355.0,"totalProfit":2621.5},{"name":"Jacksonville Youth","events":[{"team":"CBU 11U Sanchez","eventName":"2026 11U PG Citrus Series (AAA)","startDate":"2026-06-05","endDate":"2026-06-08","gross":550.0,"final":522.5,"pgCost":440.0,"profit":82.5},{"team":"CBU 13U Madsen","eventName":"2026 13U 60/90 PG Sunshine State Championship (OPEN)","startDate":"2026-06-05","endDate":"2026-06-07","gross":970.0,"final":921.5,"pgCost":826.0,"profit":95.5}],"totalFinal":1444.0,"totalPgCost":1266.0,"totalProfit":178.0},{"name":"Tampa","events":[{"team":"CBU United 10u Olasin","eventName":"2026 10U PG Father's Day Classic (OPEN)","startDate":"2026-06-19","endDate":"2026-06-21","gross":450.0,"final":427.5,"pgCost":360.0,"profit":67.5},{"team":"CBU United 13u Faber","eventName":"2026 13U PG Father's Day Classic (OPEN)","startDate":"2026-06-19","endDate":"2026-06-21","gross":725.0,"final":688.75,"pgCost":580.0,"profit":108.75}],"totalFinal":1116.25,"totalPgCost":940.0,"totalProfit":176.25},{"name":"Georgia","events":[{"team":"CBU 8U United Mahfouz","eventName":"2026 8U PG June Blast","startDate":"2026-06-06","endDate":"2026-06-07","gross":295.0,"final":280.25,"pgCost":236.0,"profit":44.25},{"team":"CBU 8U United Mahfouz","eventName":"2026 8U PG Hostess City of The South Grand Slam","startDate":"2026-06-20","endDate":"2026-06-21","gross":295.0,"final":280.25,"pgCost":236.0,"profit":44.25},{"team":"CBU United 12U Strickland","eventName":"2026 12U PG Gulf Coast World Series (Gulf Shores - Week 3)","startDate":"2026-06-10","endDate":"2026-06-13","gross":1145.0,"final":1087.75,"pgCost":916.0,"profit":171.75},{"team":"CBU United 12U Strickland","eventName":"2026 12U PG Southeast World Series - Dublin (AAA)","startDate":"2026-06-25","endDate":"2026-06-28","gross":695.0,"final":660.25,"pgCost":556.0,"profit":104.25}],"totalFinal":2308.5,"totalPgCost":1944.0,"totalProfit":364.5}]

const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (s) => new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const fmtTs = (ts) => new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

// ─── Lock ─────────────────────────────────────────────────────────────────────
function Lock({ onUnlock }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const submit = () => { if (pw === PASSWORD) onUnlock(); else { setErr(true); setPw('') } }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'var(--paper)', borderRadius: 4, border: '1px solid var(--line)', padding: '44px 36px', boxShadow: '0 30px 80px -30px rgba(11,31,58,0.25)' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.22em', color: 'var(--red)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 18 }}>#RedHatNation</div>
        <div className="serif" style={{ fontSize: 38, lineHeight: 1.02, margin: '0 0 8px' }}>CBU Tampa</div>
        <div className="serif" style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--muted)', marginBottom: 32 }}>Affiliate Pricing &amp; Payments</div>
        <label style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 10 }}>Access Password</label>
        <input type="password" value={pw} autoFocus onChange={e => { setPw(e.target.value); setErr(false) }} onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ width: '100%', padding: '14px 16px', fontSize: 16, border: `1px solid ${err ? 'var(--red)' : 'var(--line)'}`, background: 'white', borderRadius: 2, outline: 'none', fontFamily: 'inherit' }} />
        {err && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>Incorrect password.</div>}
        <button onClick={submit} style={{ width: '100%', marginTop: 18, padding: 14, background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 2, fontWeight: 600, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Enter</button>
      </div>
    </div>
  )
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Pill({ status }) {
  const map = { paid: ['var(--green)', 'Paid'], partial: ['var(--amber)', 'Partial'], unpaid: ['var(--red)', 'Unpaid'] }
  const [bg, label] = map[status]
  return <span style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, padding: '4px 8px', background: bg, color: 'white', borderRadius: 2 }}>{label}</span>
}

function Stat({ label, value, color, last }) {
  return (
    <div style={{ padding: '22px 24px', borderRight: last ? 'none' : '1px solid var(--line)' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>{label}</div>
      <div className="num" style={{ fontSize: 26, fontWeight: 600, color: color || 'var(--navy)' }}>{value}</div>
    </div>
  )
}

// ─── Nav Tabs ─────────────────────────────────────────────────────────────────
function NavTabs({ active, onChange }) {
  const tabs = [{ id: 'payments', label: 'Payments' }, { id: 'profit', label: 'Profit' }]
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--line)', marginBottom: 32 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: '12px 28px', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em',
          textTransform: 'uppercase', border: 'none', background: 'transparent',
          borderBottom: active === t.id ? '2px solid var(--red)' : '2px solid transparent',
          color: active === t.id ? 'var(--navy)' : 'var(--muted)',
          cursor: 'pointer', marginBottom: -1, transition: 'all 120ms'
        }}>{t.label}</button>
      ))}
    </div>
  )
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────
function AffRow({ aff, paid, selected, onClick }) {
  const balance = +(aff.finalTotal - paid).toFixed(2)
  const pct = Math.min(100, Math.round((paid / aff.finalTotal) * 100))
  const status = balance <= 0.005 ? 'paid' : paid > 0 ? 'partial' : 'unpaid'
  const fillColor = { paid: 'var(--green)', partial: 'var(--amber)', unpaid: 'var(--red)' }[status]
  return (
    <div onClick={onClick} style={{ padding: '20px 24px', cursor: 'pointer', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 24, background: selected ? 'rgba(11,31,58,0.05)' : 'transparent', transition: 'background 120ms' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(11,31,58,0.03)'}
      onMouseLeave={e => e.currentTarget.style.background = selected ? 'rgba(11,31,58,0.05)' : 'transparent'}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
          <Pill status={status} />
          <span className="serif" style={{ fontSize: 24 }}>{aff.name}</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {aff.events.length > 0 ? `· ${aff.events.length} event${aff.events.length !== 1 ? 's' : ''} · ${aff.teams.length} team${aff.teams.length !== 1 ? 's' : ''}` : '· Prior invoice'}
          </span>
        </div>
        <div style={{ height: 4, background: 'rgba(11,31,58,0.08)', borderRadius: 2, overflow: 'hidden', maxWidth: 420 }}>
          <div style={{ height: '100%', width: pct + '%', background: fillColor, transition: 'width 240ms' }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{fmt(paid)} paid of {fmt(aff.finalTotal)} ({pct}%)</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="num" style={{ fontSize: 28, fontWeight: 600, color: balance <= 0.005 ? 'var(--green)' : 'var(--navy)' }}>{fmt(balance)}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 4 }}>Balance Due</div>
      </div>
    </div>
  )
}

function Detail({ aff, paidMap, log, onClose, onRefresh }) {
  const paid = paidMap[aff.name] || 0
  const balance = +(aff.finalTotal - paid).toFixed(2)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const byTeam = useMemo(() => { const m = {}; aff.events.forEach(e => { (m[e.team] = m[e.team] || []).push(e) }); return m }, [aff])
  const affLog = log.filter(l => l.affiliate === aff.name).slice().reverse()

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

  const btnBase = { border: 'none', padding: '13px 18px', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }

  return (
    <div style={{ marginTop: 28, background: 'var(--paper)', border: '1px solid var(--line)', padding: '32px 32px 36px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 6, height: 60, background: 'var(--red)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Affiliate Detail</div>
          <div className="serif" style={{ fontSize: 40, lineHeight: 1, marginBottom: 8 }}>{aff.name}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{aff.teams.join(' · ') || 'Prior invoice'}</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--line)', padding: '8px 14px', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--navy)', whiteSpace: 'nowrap' }}>Close</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid var(--line)', marginBottom: 28 }}>
        <Stat label="Final Price" value={fmt(aff.finalTotal)} />
        <Stat label="Paid" value={fmt(paid)} color="var(--green)" />
        <Stat label="Balance" value={fmt(balance)} color={balance > 0.005 ? 'var(--red)' : 'var(--green)'} last />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr auto auto', gap: 10, marginBottom: 28, alignItems: 'end' }}>
        <div>
          <label style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Amount</label>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', background: 'white', padding: '0 12px' }}>
            <span className="num" style={{ color: 'var(--muted)', marginRight: 6 }}>$</span>
            <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="num"
              style={{ border: 'none', outline: 'none', padding: '12px 0', fontSize: 16, width: '100%', background: 'transparent' }} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Quick</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {['½ Bal', 'Full'].map((label, i) => (
              <button key={label} disabled={balance <= 0} onClick={() => setAmount(i === 0 ? (balance / 2).toFixed(2) : balance.toFixed(2))}
                style={{ flex: 1, background: 'white', border: '1px solid var(--line)', padding: '12px 0', fontSize: 12, fontFamily: 'inherit', opacity: balance <= 0 ? 0.4 : 1 }}>{label}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Note (optional)</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Check #1234, Venmo, etc."
            style={{ width: '100%', border: '1px solid var(--line)', background: 'white', padding: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <button disabled={busy || !amount || parseFloat(amount) <= 0} onClick={() => recordPayment(parseFloat(amount), note)}
          style={{ ...btnBase, background: 'var(--navy)', color: 'white', opacity: (busy || !amount || parseFloat(amount) <= 0) ? 0.4 : 1 }}>Record</button>
        <button disabled={busy || balance <= 0.005} onClick={() => recordPayment(balance, note || 'Marked paid in full')}
          style={{ ...btnBase, background: 'var(--red)', color: 'white', opacity: (busy || balance <= 0.005) ? 0.4 : 1 }}>Paid in Full</button>
      </div>
      <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>Event Breakdown · Streamlined View</div>
      {aff.events.length === 0 && (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', border: '1px dashed var(--line)', marginBottom: 18 }}>Prior invoice balance — no event detail available.</div>
      )}
      {Object.entries(byTeam).map(([team, evs]) => {
        const teamSum = evs.reduce((s, e) => s + e.final, 0)
        return (
          <div key={team} style={{ marginBottom: 18, border: '1px solid var(--line)', background: 'white' }}>
            <div style={{ background: 'var(--navy)', color: 'white', padding: '10px 16px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{team}</span>
              <span className="num" style={{ fontSize: 14 }}>{fmt(teamSum)}</span>
            </div>
            {evs.map((e, i) => (
              <div key={i} style={{ padding: '12px 16px', fontSize: 13, display: 'grid', gridTemplateColumns: '110px 1fr 95px 95px 105px', gap: 12, alignItems: 'center', borderTop: i > 0 ? '1px solid var(--line)' : 'none' }}>
                <div className="num" style={{ color: 'var(--muted)', fontSize: 12 }}>{fmtDate(e.startDate)}–{fmtDate(e.endDate)}</div>
                <div>{e.eventName}</div>
                <div className="num" style={{ textAlign: 'right', color: 'var(--muted)' }}>{fmt(e.gross)}</div>
                <div className="num" style={{ textAlign: 'right', color: 'var(--red)' }}>−{fmt(e.gross * 0.05)}</div>
                <div className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(e.final)}</div>
              </div>
            ))}
          </div>
        )
      })}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)' }}>Payment Log</div>
        {affLog.length > 0 && <button onClick={resetPayments} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'underline' }}>Reset</button>}
      </div>
      {affLog.length === 0
        ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', border: '1px dashed var(--line)' }}>No payments recorded yet.</div>
        : <div style={{ border: '1px solid var(--line)', background: 'white' }}>
            {affLog.map((p, i) => (
              <div key={p.id} style={{ padding: '12px 16px', fontSize: 13, display: 'grid', gridTemplateColumns: '180px 1fr 120px', gap: 12, alignItems: 'center', borderTop: i > 0 ? '1px solid var(--line)' : 'none' }}>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{fmtTs(p.created_at)}</div>
                <div>{p.note || <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>—</span>}</div>
                <div className="num" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--green)' }}>+{fmt(p.amount)}</div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}

// ─── Profit Tab ───────────────────────────────────────────────────────────────
function ProfitTab() {
  const [expanded, setExpanded] = useState(null)
  const grandRevenue = PROFIT_DATA.reduce((s, a) => s + a.totalFinal, 0)
  const grandCost    = PROFIT_DATA.reduce((s, a) => s + a.totalPgCost, 0)
  const grandProfit  = PROFIT_DATA.reduce((s, a) => s + a.totalProfit, 0)
  const margin       = ((grandProfit / grandRevenue) * 100).toFixed(1)

  return (
    <div>
      {/* Grand totals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '1px solid var(--line)', background: 'var(--paper)', marginBottom: 32 }}>
        <Stat label="Total Revenue" value={fmt(grandRevenue)} />
        <Stat label="Total PG Cost" value={fmt(grandCost)} color="var(--red)" />
        <Stat label="Total Profit" value={fmt(grandProfit)} color="var(--green)" />
        <Stat label="Margin" value={margin + '%'} color="var(--green)" last />
      </div>

      <div style={{ marginBottom: 14 }}>
        <div className="serif" style={{ fontSize: 28 }}>By Affiliate</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Revenue = what affiliate pays (5% off gross) · Cost = CBU's actual PG balance after rewards · Profit = Revenue − Cost</div>
      </div>

      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}>
        {PROFIT_DATA.map((aff, i) => {
          const isOpen = expanded === aff.name
          const profitMargin = ((aff.totalProfit / aff.totalFinal) * 100).toFixed(1)
          return (
            <div key={aff.name} style={{ borderTop: i > 0 ? '1px solid var(--line)' : 'none' }}>
              {/* Affiliate summary row */}
              <div onClick={() => setExpanded(isOpen ? null : aff.name)}
                style={{ padding: '18px 24px', cursor: 'pointer', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 24, transition: 'background 120ms', background: isOpen ? 'rgba(11,31,58,0.04)' : 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(11,31,58,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = isOpen ? 'rgba(11,31,58,0.04)' : 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div className="serif" style={{ fontSize: 22 }}>{aff.name}</div>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Revenue</div>
                      <div className="num" style={{ fontSize: 15 }}>{fmt(aff.totalFinal)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>PG Cost</div>
                      <div className="num" style={{ fontSize: 15, color: 'var(--red)' }}>{fmt(aff.totalPgCost)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Margin</div>
                      <div className="num" style={{ fontSize: 15 }}>{profitMargin}%</div>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="num" style={{ fontSize: 28, fontWeight: 600, color: 'var(--green)' }}>{fmt(aff.totalProfit)}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 4 }}>Profit</div>
                </div>
              </div>

              {/* Expanded event breakdown */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--line)', background: 'white' }}>
                  {/* Column headers */}
                  <div style={{ padding: '8px 24px', display: 'grid', gridTemplateColumns: '100px 1fr 110px 110px 110px 110px', gap: 12, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', borderBottom: '1px solid var(--line)', background: 'rgba(11,31,58,0.03)' }}>
                    <div>Dates</div>
                    <div>Event</div>
                    <div style={{ textAlign: 'right' }}>Affiliate Pays</div>
                    <div style={{ textAlign: 'right' }}>PG Cost</div>
                    <div style={{ textAlign: 'right' }}>Profit</div>
                    <div style={{ textAlign: 'right' }}>Margin</div>
                  </div>
                  {aff.events.map((e, idx) => {
                    const evMargin = ((e.profit / e.final) * 100).toFixed(1)
                    return (
                      <div key={idx} style={{ padding: '11px 24px', display: 'grid', gridTemplateColumns: '100px 1fr 110px 110px 110px 110px', gap: 12, alignItems: 'center', fontSize: 13, borderTop: idx > 0 ? '1px solid var(--line)' : 'none' }}>
                        <div className="num" style={{ color: 'var(--muted)', fontSize: 11 }}>{fmtDate(e.startDate)}–{fmtDate(e.endDate)}</div>
                        <div>
                          <div>{e.eventName}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{e.team}</div>
                        </div>
                        <div className="num" style={{ textAlign: 'right' }}>{fmt(e.final)}</div>
                        <div className="num" style={{ textAlign: 'right', color: 'var(--red)' }}>{fmt(e.pgCost)}</div>
                        <div className="num" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--green)' }}>{fmt(e.profit)}</div>
                        <div className="num" style={{ textAlign: 'right', color: 'var(--muted)' }}>{evMargin}%</div>
                      </div>
                    )
                  })}
                  {/* Affiliate subtotal */}
                  <div style={{ padding: '12px 24px', display: 'grid', gridTemplateColumns: '100px 1fr 110px 110px 110px 110px', gap: 12, alignItems: 'center', background: 'var(--navy)', color: 'white' }}>
                    <div></div>
                    <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Total — {aff.name}</div>
                    <div className="num" style={{ textAlign: 'right', fontSize: 14 }}>{fmt(aff.totalFinal)}</div>
                    <div className="num" style={{ textAlign: 'right', fontSize: 14 }}>{fmt(aff.totalPgCost)}</div>
                    <div className="num" style={{ textAlign: 'right', fontSize: 14, color: '#86efac' }}>{fmt(aff.totalProfit)}</div>
                    <div className="num" style={{ textAlign: 'right', fontSize: 14 }}>{profitMargin}%</div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
        * Eustis excluded — prior invoice, event-level cost data not available.
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
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

  if (!unlocked) return <Lock onUnlock={() => setUnlocked(true)} />

  const selectedAff = selected ? AFFILIATES.find(a => a.name === selected) : null

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 28px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 24, marginBottom: 0, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.22em', color: 'var(--red)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>#RedHatNation · #United · #JustDoU</div>
          <div className="serif" style={{ fontSize: 44, lineHeight: 1 }}>CBU Tampa <span style={{ color: 'var(--muted)' }}>/</span> Summer 2026</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>Affiliate Pricing &amp; Payment Tracker · Final pricing reflects 5% discount</div>
        </div>
        <button onClick={() => { setUnlocked(false); setSelected(null) }} style={{ background: 'transparent', border: '1px solid var(--line)', padding: '8px 14px', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--navy)' }}>Lock</button>
      </div>

      {/* Tabs */}
      <div style={{ marginTop: 24 }}>
        <NavTabs active={tab} onChange={t => { setTab(t); setSelected(null) }} />
      </div>

      {/* Payments Tab */}
      {tab === 'payments' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid var(--line)', background: 'var(--paper)', marginBottom: 32 }}>
            <Stat label="Total Owed" value={fmt(totals.final)} />
            <Stat label="Collected" value={fmt(totals.paid)} color="var(--green)" />
            <Stat label="Outstanding" value={fmt(totals.balance)} color={totals.balance > 0.005 ? 'var(--red)' : 'var(--green)'} last />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div className="serif" style={{ fontSize: 28 }}>Affiliates</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Tap a row to manage payments</div>
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

      {/* Profit Tab */}
      {tab === 'profit' && <ProfitTab />}

      <div style={{ marginTop: 60, textAlign: 'center', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>CBU Tampa Baseball · Invoice #26002</div>
    </div>
  )
}
