import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { COACHES, TEAM_SCHEDULES, RATE, getOneway } from './data'

const VISIBLE = COACHES.filter(c => !c.hidden)
const TEAMS   = [...new Set(VISIBLE.map(c => c.team))].sort()

// All unique tournament names across every team schedule
const ALL_TOURNAMENTS = [...new Set(
  Object.values(TEAM_SCHEDULES).flat().map(t => t.name)
)].sort()

function badgeClass(team) {
  if (team.startsWith('2027')) return 'badge-2027'
  if (team.startsWith('2028')) return 'badge-2028'
  if (team.startsWith('2029')) return 'badge-2029'
  if (team.startsWith('2030')) return 'badge-2030'
  return 'badge-dir'
}

function fmt(n) { return '$' + Number(n).toFixed(2) }

export default function App() {
  const [entries, setEntries]   = useState([])
  const [search,  setSearch]    = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [tournFilter, setTournFilter] = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => { loadEntries() }, [])

  async function loadEntries() {
    setLoading(true)
    const { data } = await supabase.from('entries').select('*').order('created_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  async function addEntry(coach, event, miles, tournDate, eventPay=0) {
    const amount = +(miles * RATE).toFixed(2)
    const { data, error } = await supabase.from('entries').insert([{
      coach: coach.name, team: coach.team,
      event, miles, amount, event_pay: eventPay,
      tourn_date: tournDate,
      logged_date: new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
      paid: false
    }]).select()
    if (error) { console.error('Insert error:', error); return }
    if (data) setEntries(prev => [data[0], ...prev])
  }

  async function togglePaid(entry) {
    const { data } = await supabase.from('entries').update({ paid: !entry.paid }).eq('id', entry.id).select()
    if (data) setEntries(prev => prev.map(e => e.id === entry.id ? data[0] : e))
  }

  async function deleteEntry(id) {
    await supabase.from('entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  async function resetAll() {
    if (!confirm('Delete ALL entries? This cannot be undone.')) return
    await supabase.from('entries').delete().neq('id', 0)
    setEntries([])
  }

  function exportCSV() {
    if (!entries.length) { alert('No entries yet.'); return }
    let csv = 'Coach,Team,Tournament,Tournament Date,Miles RT,Miles $,Event Pay,Total,Status,Logged\n'
    entries.forEach(e => {
      const total = Number(e.amount) + Number(e.event_pay||0)
      csv += `"${e.coach}","${e.team}","${e.event}","${e.tourn_date||''}",${e.miles},${e.amount},${e.event_pay||0},${total.toFixed(2)},"${e.paid?'Paid':'Unpaid'}","${e.logged_date}"\n`
    })
    const totMi = entries.reduce((s,e)=>s+e.miles,0)
    const totOw = entries.reduce((s,e)=>s+e.amount,0)
    const totPd = entries.filter(e=>e.paid).reduce((s,e)=>s+e.amount,0)
    csv += `\nTotal Miles,${totMi.toFixed(1)}\nTotal Owed,${fmt(totOw)}\nTotal Paid,${fmt(totPd)}\nOutstanding,${fmt(totOw-totPd)}`
    const a = Object.assign(document.createElement('a'),{
      href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})),
      download: `cbu-miles-${new Date().toISOString().slice(0,10)}.csv`
    })
    document.body.appendChild(a); a.click(); a.remove()
  }

  const totMi = entries.reduce((s,e)=>s+Number(e.miles),0)
  const totOw = entries.reduce((s,e)=>s+Number(e.amount)+Number(e.event_pay||0),0)
  const totPd = entries.filter(e=>e.paid).reduce((s,e)=>s+Number(e.amount)+Number(e.event_pay||0),0)

  const visible = VISIBLE.filter(c => {
    const q = search.toLowerCase()
    const schedKey  = c.scheduleKey || c.team
    const schedule  = TEAM_SCHEDULES[schedKey] || []
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.team.toLowerCase().includes(q)
    const matchT = !teamFilter || c.team === teamFilter
    const matchTourn = !tournFilter || schedule.some(t => t.name === tournFilter)
    return matchQ && matchT && matchTourn
  })

  return (
    <div className="app">
      <header className="hdr">
        <h1>CBU <em>Coaches</em> Reimbursement</h1>
        <p>#RedHatNation · $0.30 / mile · Round Trip</p>
      </header>

      <div className="stats">
        <div className="stat r"><div className="lbl">Total Miles</div><div className="val">{totMi.toFixed(1)}</div></div>
        <div className="stat r"><div className="lbl">Total Owed</div><div className="val">{fmt(totOw)}</div></div>
        <div className="stat g"><div className="lbl">Total Paid</div><div className="val">{fmt(totPd)}</div></div>
        <div className="stat y"><div className="lbl">Outstanding</div><div className="val">{fmt(totOw-totPd)}</div></div>
      </div>

      <div className="toolbar">
        <button className="btn btn-ghost" onClick={exportCSV}>⬇ Export CSV</button>
        <button className="btn btn-ghost" onClick={resetAll}>↺ Reset All</button>
      </div>

      <div className="filter-bar">
        <input placeholder="🔍  Search coach or team…" value={search} onChange={e=>setSearch(e.target.value)} />
        <select value={teamFilter} onChange={e=>setTeamFilter(e.target.value)}>
          <option value="">All Teams</option>
          {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={tournFilter} onChange={e=>setTournFilter(e.target.value)}>
          <option value="">All Tournaments</option>
          {ALL_TOURNAMENTS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? <div className="loading">Loading…</div> : (
        <div className="grid">
          {visible.map(coach => (
            <CoachCard
              key={coach.name}
              coach={coach}
              entries={entries.filter(e=>e.coach===coach.name)}
              onAdd={addEntry}
              onToggle={togglePaid}
              onDelete={deleteEntry}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CoachCard({ coach, entries, onAdd, onToggle, onDelete }) {
  const schedKey  = coach.scheduleKey || coach.team
  const schedule  = TEAM_SCHEDULES[schedKey] || []
  const [selIdx,  setSelIdx]  = useState('')
  const [miles,   setMiles]   = useState('')
  const [custom,  setCustom]  = useState('')
  const [eventPay, setEventPay] = useState('')
  const [preview, setPreview] = useState(null)

  const totAmt = entries.reduce((s,e)=>s+Number(e.amount)+Number(e.event_pay||0),0)
  const pdAmt  = entries.filter(e=>e.paid).reduce((s,e)=>s+Number(e.amount)+Number(e.event_pay||0),0)
  const owAmt  = totAmt - pdAmt
  const pct    = totAmt > 0 ? Math.round(pdAmt/totAmt*100) : 0

  function handleTSel(val) {
    setSelIdx(val)
    setCustom('')
    if (!val) { setMiles(''); setPreview(null); return }
    if (val === 'custom') { setMiles(''); setPreview(null); return }
    const t = schedule[+val]
    const coachKey = coach.name.split(' ')[0].toLowerCase()
    let rt
    if (t.overrideMiles && t.overrideMiles[coachKey] !== undefined) {
      rt = t.overrideMiles[coachKey]
    } else {
      const ow = getOneway(coach, t.city)
      rt = ow ? ow * 2 : null
    }
    if (rt) {
      setMiles(String(rt))
      setPreview({ label: t.name, miles: rt })
    } else {
      setMiles('')
      setPreview(null)
    }
  }

  function handleMiles(val) {
    setMiles(val)
    const m = parseFloat(val)
    if (!m || m <= 0) { setPreview(null); return }
    if (selIdx === 'custom') {
      setPreview(custom ? { label: custom, miles: m } : null)
    } else if (selIdx !== '') {
      setPreview({ label: schedule[+selIdx]?.name || '', miles: m })
    }
  }

  function handleCustom(val) {
    setCustom(val)
    const m = parseFloat(miles)
    if (val && m > 0) setPreview({ label: val, miles: m })
    else setPreview(null)
  }

  async function handleAdd() {
    const m = parseFloat(miles)
    const ep = parseFloat(eventPay) || 0
    const eventName = selIdx === 'custom' ? custom : schedule[+selIdx]?.name
    const tournDate = selIdx === 'custom' ? '' : schedule[+selIdx]?.date || ''
    if (!eventName || !m || m <= 0) return
    await onAdd(coach, eventName, m, tournDate, ep)
    setSelIdx(''); setMiles(''); setCustom(''); setEventPay(''); setPreview(null)
  }

  const canAdd = preview && parseFloat(miles) > 0 && (selIdx !== 'custom' || custom.trim())

  const milesAmt  = entries.reduce((s,e)=>s+Number(e.amount),0)
  const payAmt    = entries.reduce((s,e)=>s+Number(e.event_pay||0),0)

  return (
    <div className="card">
      <div className="ch">
        <div className="ch-l">
          <div className="name">{coach.name}</div>
          <div className={`team-badge ${badgeClass(coach.team)}`}>{coach.team}</div>
          <div className="addr">📍 {coach.address}</div>
        </div>
        <div className="ch-r">
          <div className="tot-lbl">Balance Due</div>
          <div className="tot-val">{fmt(owAmt)}</div>
          <div className="paid-line"><span>{fmt(pdAmt)}</span> paid of {fmt(totAmt)} ({pct}%)</div>
          {totAmt > 0 && <div className="prog-wrap"><div className="prog-bg"><div className="prog-fill" style={{width:`${pct}%`}} /></div></div>}
        </div>
      </div>

      <div className="cb">

        <div>
          <div className="flabel">Event Pay <span style={{color:'#6a84a8',fontWeight:400}}>(flat rate per event)</span></div>
          <input className="mi" type="number" value={eventPay} onChange={e=>setEventPay(e.target.value)} min="0" step="0.01" placeholder="$0.00" />
        </div>

        <div>
          <div className="flabel">Tournament</div>
          <select className="ts" value={selIdx} onChange={e=>handleTSel(e.target.value)}>
            <option value="">— Select tournament —</option>
            {schedule.map((t,i) => {
              const coachKey = coach.name.split(' ')[0].toLowerCase()
              let rt
              if (t.overrideMiles && t.overrideMiles[coachKey] !== undefined) {
                rt = t.overrideMiles[coachKey]
              } else {
                const ow = getOneway(coach, t.city)
                rt = ow ? ow * 2 : null
              }
              return <option key={i} value={i}>{t.date} · {t.name}{rt ? ` — ${rt} mi RT` : ' — (enter miles)'}</option>
            })}
            <option value="custom">✏ Custom…</option>
          </select>
        </div>

        {selIdx === 'custom' && (
          <div>
            <div className="flabel">Custom Tournament Name</div>
            <input className="mi" type="text" value={custom} onChange={e=>handleCustom(e.target.value)} placeholder="Tournament name" />
          </div>
        )}

        {(selIdx !== '' && selIdx !== undefined) && (
          <div>
            <div className="flabel">Round-Trip Miles <span style={{color:'#6a84a8',fontWeight:400}}>(auto-filled · edit if needed)</span></div>
            <input className="mi" type="number" value={miles} onChange={e=>handleMiles(e.target.value)} min="1" step="1" placeholder="0" />
          </div>
        )}

        {preview && (
          <div className="preview show">
            <div className="p-detail">
              {preview.miles} mi × ${RATE.toFixed(2)}/mi
              {parseFloat(eventPay) > 0 && ` + ${fmt(parseFloat(eventPay))} event pay`}
            </div>
            <div className="p-amount">{fmt(preview.miles * RATE + (parseFloat(eventPay)||0))}</div>
          </div>
        )}

        <button className="btn-add" disabled={!canAdd} onClick={handleAdd}>+ Add to Ledger</button>

        {entries.length > 0 && (
          <div className="ledger-totals">
            <span>Miles: <strong>{fmt(milesAmt)}</strong></span>
            <span>Event Pay: <strong>{fmt(payAmt)}</strong></span>
          </div>
        )}

        <div className="ledger">
          {entries.length === 0
            ? <div className="ledger-empty">No entries yet</div>
            : entries.map(e => (
              <div key={e.id} className="lrow">
                <div className="lr-info">
                  <div className="lr-event">{e.event}</div>
                  <div className="lr-meta">
                    {e.miles} mi RT · {fmt(e.amount)}
                    {Number(e.event_pay) > 0 && <span className="lr-pay"> + {fmt(e.event_pay)} pay</span>}
                    · {e.tourn_date || e.logged_date}
                  </div>
                </div>
                <div className="lr-amt">{fmt(Number(e.amount)+Number(e.event_pay||0))}</div>
                <button className={`tog ${e.paid?'paid':'unpaid'}`} onClick={()=>onToggle(e)}>{e.paid?'✓ Paid':'Unpaid'}</button>
                <button className="del" onClick={()=>onDelete(e.id)}>✕</button>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
