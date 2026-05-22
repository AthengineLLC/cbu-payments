import { useState, useEffect, useMemo } from 'react'
import { supabase } from './lib/supabase'
import { AFFILIATES } from './data'

const PASSWORD = 'redhat2026'

const fmt = (n) =>
  '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtDate = (s) => {
  const d = new Date(s + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const fmtTs = (ts) =>
  new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  })

// ─── Lock Screen ─────────────────────────────────────────────────────────────
function Lock({ onUnlock }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)

  const submit = () => {
    if (pw === PASSWORD) onUnlock()
    else { setErr(true); setPw('') }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{
        width: '100%', maxWidth: 420, background: 'var(--paper)', borderRadius: 4,
        border: '1px solid var(--line)', padding: '44px 36px',
        boxShadow: '0 30px 80px -30px rgba(11,31,58,0.25)'
      }}>
        <div style={{ fontSize: 11, letterSpacing: '0.22em', color: 'var(--red)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 18 }}>
          #RedHatNation
        </div>
        <div className="serif" style={{ fontSize: 38, lineHeight: 1.02, margin: '0 0 8px' }}>CBU Tampa</div>
        <div className="serif" style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--muted)', marginBottom: 32 }}>
          Affiliate Pricing &amp; Payments
        </div>
        <label style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 10 }}>
          Access Password
        </label>
        <input
          type="password"
          value={pw}
          autoFocus
          onChange={(e) => { setPw(e.target.value); setErr(false) }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          style={{
            width: '100%', padding: '14px 16px', fontSize: 16,
            border: `1px solid ${err ? 'var(--red)' : 'var(--line)'}`,
            background: 'white', borderRadius: 2, outline: 'none', fontFamily: 'inherit'
          }}
        />
        {err && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>Incorrect password.</div>}
        <button
          onClick={submit}
          style={{
            width: '100%', marginTop: 18, padding: 14, background: 'var(--navy)', color: 'white',
            border: 'none', borderRadius: 2, fontWeight: 600, fontSize: 14,
            letterSpacing: '0.06em', textTransform: 'uppercase'
          }}
        >
          Enter
        </button>
      </div>
    </div>
  )
}

// ─── Status Pill ─────────────────────────────────────────────────────────────
function Pill({ status }) {
  const map = { paid: ['var(--green)', 'Paid'], partial: ['var(--amber)', 'Partial'], unpaid: ['var(--red)', 'Unpaid'] }
  const [bg, label] = map[status]
  return (
    <span style={{
      fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700,
      padding: '4px 8px', background: bg, color: 'white', borderRadius: 2
    }}>{label}</span>
  )
}

// ─── Stat Box ─────────────────────────────────────────────────────────────────
function Stat({ label, value, color, last }) {
  return (
    <div style={{ padding: '22px 24px', borderRight: last ? 'none' : '1px solid var(--line)' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>{label}</div>
      <div className="num" style={{ fontSize: 26, fontWeight: 600, color: color || 'var(--navy)' }}>{value}</div>
    </div>
  )
}

// ─── Affiliate Row ────────────────────────────────────────────────────────────
function AffRow({ aff, paid, selected, onClick }) {
  const balance = +(aff.finalTotal - paid).toFixed(2)
  const pct = Math.min(100, Math.round((paid / aff.finalTotal) * 100))
  const status = balance <= 0.005 ? 'paid' : paid > 0 ? 'partial' : 'unpaid'
  const fillColor = { paid: 'var(--green)', partial: 'var(--amber)', unpaid: 'var(--red)' }[status]

  return (
    <div
      onClick={onClick}
      style={{
        padding: '20px 24px', cursor: 'pointer',
        display: 'grid', gridTemplateColumns: '1fr auto',
        alignItems: 'center', gap: 24,
        background: selected ? 'rgba(11,31,58,0.05)' : 'transparent',
        transition: 'background 120ms'
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(11,31,58,0.03)'}
      onMouseLeave={e => e.currentTarget.style.background = selected ? 'rgba(11,31,58,0.05)' : 'transparent'}
    >
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
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
          {fmt(paid)} paid of {fmt(aff.finalTotal)} ({pct}%)
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="num" style={{ fontSize: 28, fontWeight: 600, color: balance <= 0.005 ? 'var(--green)' : 'var(--navy)' }}>
          {fmt(balance)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 4 }}>
          Balance Due
        </div>
      </div>
    </div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function Detail({ aff, paidMap, log, onClose, onRefresh }) {
  const paid = paidMap[aff.name] || 0
  const balance = +(aff.finalTotal - paid).toFixed(2)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const byTeam = useMemo(() => {
    const m = {}
    aff.events.forEach(e => { (m[e.team] = m[e.team] || []).push(e) })
    return m
  }, [aff])

  const affLog = log.filter(l => l.affiliate === aff.name).slice().reverse()

  const recordPayment = async (amt, noteText) => {
    if (!amt || amt <= 0) return
    setBusy(true)
    const { error } = await supabase.from('payments').insert({
      affiliate: aff.name,
      amount: amt,
      note: noteText || null
    })
    if (!error) { await onRefresh(); setAmount(''); setNote('') }
    else alert('Error saving: ' + error.message)
    setBusy(false)
  }

  const markPaidFull = () => {
    if (balance <= 0.005) return
    recordPayment(balance, note || 'Marked paid in full')
  }

  const resetPayments = async () => {
    if (!confirm(`Reset all payments for ${aff.name}?`)) return
    setBusy(true)
    const { error } = await supabase.from('payments').delete().eq('affiliate', aff.name)
    if (!error) await onRefresh()
    else alert('Error: ' + error.message)
    setBusy(false)
  }

  const inputStyle = {
    width: '100%', border: '1px solid var(--line)', background: 'white',
    padding: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none'
  }
  const btnBase = {
    border: 'none', padding: '13px 18px', fontSize: 12,
    letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600
  }

  return (
    <div style={{
      marginTop: 28, background: 'var(--paper)', border: '1px solid var(--line)',
      padding: '32px 32px 36px', position: 'relative'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 6, height: 60, background: 'var(--red)' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Affiliate Detail</div>
          <div className="serif" style={{ fontSize: 40, lineHeight: 1, marginBottom: 8 }}>{aff.name}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{aff.teams.join(' · ')}</div>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: '1px solid var(--line)', padding: '8px 14px',
          fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--navy)', whiteSpace: 'nowrap'
        }}>Close</button>
      </div>

      {/* Snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid var(--line)', marginBottom: 28 }}>
        <Stat label="Final Price" value={fmt(aff.finalTotal)} />
        <Stat label="Paid" value={fmt(paid)} color="var(--green)" />
        <Stat label="Balance" value={fmt(balance)} color={balance > 0.005 ? 'var(--red)' : 'var(--green)'} last />
      </div>

      {/* Payment Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr auto auto', gap: 10, marginBottom: 28, alignItems: 'end' }}>
        <div>
          <label style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Amount</label>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', background: 'white', padding: '0 12px' }}>
            <span className="num" style={{ color: 'var(--muted)', marginRight: 6 }}>$</span>
            <input
              type="number" step="0.01" min="0" value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="num"
              style={{ border: 'none', outline: 'none', padding: '12px 0', fontSize: 16, width: '100%', background: 'transparent' }}
            />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Quick</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {['½ Bal', 'Full'].map((label, i) => (
              <button key={label} disabled={balance <= 0}
                onClick={() => setAmount(i === 0 ? (balance / 2).toFixed(2) : balance.toFixed(2))}
                style={{
                  flex: 1, background: 'white', border: '1px solid var(--line)',
                  padding: '12px 0', fontSize: 12, fontFamily: 'inherit',
                  opacity: balance <= 0 ? 0.4 : 1
                }}
              >{label}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Note (optional)</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            placeholder="Check #1234, Venmo, etc." style={inputStyle} />
        </div>
        <button
          disabled={busy || !amount || parseFloat(amount) <= 0}
          onClick={() => recordPayment(parseFloat(amount), note)}
          style={{ ...btnBase, background: 'var(--navy)', color: 'white', opacity: (busy || !amount || parseFloat(amount) <= 0) ? 0.4 : 1 }}
        >Record</button>
        <button
          disabled={busy || balance <= 0.005}
          onClick={markPaidFull}
          style={{ ...btnBase, background: 'var(--red)', color: 'white', opacity: (busy || balance <= 0.005) ? 0.4 : 1 }}
        >Paid in Full</button>
      </div>

      {/* Event Breakdown */}
      <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>
        Event Breakdown · Streamlined View
      </div>
      {aff.events.length === 0 && (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', border: '1px dashed var(--line)', marginBottom: 18 }}>
          Prior invoice balance — no event detail available.
        </div>
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
              <div key={i} style={{
                padding: '12px 16px', fontSize: 13,
                display: 'grid', gridTemplateColumns: '110px 1fr 95px 95px 105px', gap: 12, alignItems: 'center',
                borderTop: i > 0 ? '1px solid var(--line)' : 'none'
              }}>
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

      {/* Payment Log */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)' }}>Payment Log</div>
        {affLog.length > 0 && (
          <button onClick={resetPayments} style={{
            background: 'transparent', border: 'none', color: 'var(--muted)',
            fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'underline'
          }}>Reset</button>
        )}
      </div>
      {affLog.length === 0
        ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', border: '1px dashed var(--line)' }}>No payments recorded yet.</div>
        : (
          <div style={{ border: '1px solid var(--line)', background: 'white' }}>
            {affLog.map((p, i) => (
              <div key={p.id} style={{
                padding: '12px 16px', fontSize: 13,
                display: 'grid', gridTemplateColumns: '180px 1fr 120px', gap: 12, alignItems: 'center',
                borderTop: i > 0 ? '1px solid var(--line)' : 'none'
              }}>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{fmtTs(p.created_at)}</div>
                <div>{p.note || <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>—</span>}</div>
                <div className="num" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--green)' }}>+{fmt(p.amount)}</div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [unlocked, setUnlocked] = useState(false)
  const [payments, setPayments] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadPayments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: true })
    if (!error) setPayments(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (unlocked) loadPayments()
  }, [unlocked])

  // Sum paid per affiliate
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--line)', paddingBottom: 24, marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.22em', color: 'var(--red)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
            #RedHatNation · #United · #JustDoU
          </div>
          <div className="serif" style={{ fontSize: 44, lineHeight: 1 }}>
            CBU Tampa <span style={{ color: 'var(--muted)' }}>/</span> Summer 2026
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>
            Affiliate Pricing &amp; Payment Tracker · Final pricing reflects 5% discount
          </div>
        </div>
        <button onClick={() => { setUnlocked(false); setSelected(null) }} style={{
          background: 'transparent', border: '1px solid var(--line)', padding: '8px 14px',
          fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--navy)'
        }}>Lock</button>
      </div>

      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid var(--line)', background: 'var(--paper)', marginBottom: 32 }}>
        <Stat label="Total Owed" value={fmt(totals.final)} />
        <Stat label="Collected" value={fmt(totals.paid)} color="var(--green)" />
        <Stat label="Outstanding" value={fmt(totals.balance)} color={totals.balance > 0.005 ? 'var(--red)' : 'var(--green)'} last />
      </div>

      {/* Affiliates */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div className="serif" style={{ fontSize: 28 }}>Affiliates</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Tap a row to manage payments</div>
      </div>

      {loading
        ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
        : (
          <div style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}>
            {AFFILIATES.map((aff, i) => (
              <div key={aff.name} style={{ borderTop: i > 0 ? '1px solid var(--line)' : 'none' }}>
                <AffRow
                  aff={aff}
                  paid={paidMap[aff.name] || 0}
                  selected={selected === aff.name}
                  onClick={() => setSelected(selected === aff.name ? null : aff.name)}
                />
              </div>
            ))}
          </div>
        )
      }

      {/* Detail */}
      {selectedAff && (
        <Detail
          aff={selectedAff}
          paidMap={paidMap}
          log={payments}
          onClose={() => setSelected(null)}
          onRefresh={loadPayments}
        />
      )}

      <div style={{ marginTop: 60, textAlign: 'center', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        CBU Tampa Baseball · Invoice #26002
      </div>
    </div>
  )
}
