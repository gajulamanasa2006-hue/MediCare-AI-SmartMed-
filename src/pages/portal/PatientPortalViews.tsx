/* =====================================================================
   SmartMed — Patient Portal: the nine views that were missing.
   Drop-in module. Uses ONLY APIs already present in the project:
     AppContext  · ui.tsx · charts.tsx · lib/ai.ts · data/mock.ts
   ===================================================================== */
import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, AlertTriangle, Ambulance, ArrowRight, Bell, CalendarDays, CheckCircle2, Clock,
  Download, Droplet, FileText, FlaskConical, Gauge, Heart, HeartPulse, Info, MapPin, Navigation,
  Pill, Plus, Printer, ScrollText, ShieldCheck, Sparkles, Stethoscope, Syringe, Trash2, TrendingUp,
  Upload, UserCircle2, Weight, X, Zap, Phone, Siren, Search,
} from 'lucide-react'
import { PortalLayout, Panel, KpiRow } from '../../components/PortalLayout'
import {
  AiDisclaimer, Badge, Bar, Btn, Card, Empty, Field, Img, Input, KV, Modal, Ring, Select, Table,
  Textarea, TriageDisclaimer, cn, statusTone,
} from '../../components/ui'
import { AdherenceBars, BpChart, Donut, SimpleLine, SugarChart } from '../../components/charts'
import { DEPARTMENTS, DOCTORS, HEALTH_TIPS, IMG, PATIENT, VITALS } from '../../data/mock'
import { analyseMeds, emergencyPriority, healthScore, triageSymptoms } from '../../lib/ai'
import { useApp } from '../../context/AppContext'

/* ------------------------------------------------------------------ helpers */
const SLOTS: ('Morning' | 'Afternoon' | 'Night')[] = ['Morning', 'Afternoon', 'Night']
const dayKey = new Date(2026, 9, 4).toDateString()
const today = () => new Date(2026, 9, 4).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

function Download2({ label = 'Download PDF' }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className="btn btn-ghost btn-sm">
      <Printer size={13} /> {label}
    </button>
  )
}

/* ================================================================== 1. MEDICATIONS */
export function Medications() {
  const { meds, addMed, removeMed, doseLog, logDose, toast, pushNotif } = useApp()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('All')
  const [q, setQ] = useState('')
  const [form, setForm] = useState({ name: '', strength: '', slot: 'Morning', time: '08:00 AM', meal: 'After Food', dose: '1 tablet', frequency: 'Once daily', prescriber: 'Dr. Rajesh Sharma', notes: '' })

  const list = useMemo(() => {
    let l = meds
    if (filter !== 'All') l = l.filter((m) => m.status === filter)
    if (q.trim()) {
      const s = q.toLowerCase()
      l = l.filter((m) => (m.name + (m.strength || '')).toLowerCase().includes(s))
    }
    return l
  }, [meds, filter, q])

  const active = meds.filter((m) => m.status === 'Active')
  const taken = active.reduce((n, m) => n + (m.adherence?.taken || 0), 0)
  const missed = active.reduce((n, m) => n + (m.adherence?.missed || 0), 0)
  const adherence = taken + missed ? Math.round((taken / (taken + missed)) * 100) : 100

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast('Medicine name is required.', 'error'); return }
    addMed({
      id: 'MED-' + Date.now(),
      name: form.name,
      strength: form.strength || '—',
      slot: form.slot as any,
      time: form.time,
      meal: form.meal,
      dose: form.dose,
      frequency: form.frequency,
      prescriber: form.prescriber,
      notes: form.notes,
      status: 'Active',
      adherence: { taken: 0, missed: 0 },
    } as any)
    pushNotif({ cat: 'Medication', title: 'Medicine added', body: `${form.name} ${form.strength} scheduled for ${form.slot}.`, tone: 'teal' })
    toast(`${form.name} added to your schedule.`, 'success')
    setForm({ ...form, name: '', strength: '', notes: '' })
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <KpiRow items={[
        { label: 'Active medicines', value: active.length, sub: 'Currently prescribed', icon: Pill, tone: 'brand' },
        { label: 'Adherence', value: `${adherence}%`, sub: `${taken} taken · ${missed} missed`, icon: CheckCircle2, tone: 'green' },
        { label: 'Doses today', value: active.length, sub: `${SLOTS.length} time slots`, icon: Clock, tone: 'teal' },
        { label: 'Allergies', value: (PATIENT.allergies || []).length, sub: 'Screened on every refill', icon: AlertTriangle, tone: 'amber' },
      ]} />

      <Panel title="Today's schedule" sub="Log each dose — adherence and the health twin update instantly." icon={CalendarDays}
        right={<button onClick={() => setOpen(true)} className="btn btn-primary btn-sm"><Plus size={13} /> Add medicine</button>}>
        <div className="grid gap-3 sm:grid-cols-3">
          {SLOTS.map((slot) => (
            <div key={slot} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">{slot}</p>
                <Clock size={13} className="text-slate-400" />
              </div>
              <div className="mt-3 space-y-2">
                {active.filter((m) => m.slot === slot).map((m) => {
                  const state = doseLog[`${m.id}|${slot}|${dayKey}`]
                  return (
                    <div key={m.id} className="rounded-lg bg-slate-50 p-2.5">
                      <p className="text-[12px] font-bold text-slate-800">{m.name} <span className="font-semibold text-slate-500">{m.strength}</span></p>
                      <p className="text-[11px] text-slate-500">{m.time} · {m.meal} · {m.dose}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <button onClick={() => { logDose(m.id, slot, 'Taken'); toast(`${m.name} marked as taken.`, 'success') }}
                          className={cn('rounded-md px-2 py-1 text-[10.5px] font-bold', state === 'Taken' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 ring-1 ring-emerald-200')}>Taken</button>
                        <button onClick={() => { logDose(m.id, slot, 'Missed'); toast(`${m.name} marked as missed.`, 'warn') }}
                          className={cn('rounded-md px-2 py-1 text-[10.5px] font-bold', state === 'Missed' ? 'bg-rose-500 text-white' : 'bg-white text-rose-700 ring-1 ring-rose-200')}>Missed</button>
                        <span className={cn('rounded-md px-2 py-1 text-[10.5px] font-bold', !state ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400')}>{state ? 'Logged' : 'Upcoming'}</span>
                      </div>
                    </div>
                  )
                })}
                {!active.filter((m) => m.slot === slot).length && <p className="text-[11.5px] text-slate-400">No medicine scheduled.</p>}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="All medicines" sub={`${list.length} of ${meds.length} shown`} icon={Pill}
          right={
            <div className="flex gap-2">
              <div className="w-40"><Input placeholder="Search…" value={q} onChange={(e: any) => setQ(e.target.value)} /></div>
              <div className="w-32"><Select value={filter} onChange={(e: any) => setFilter(e.target.value)}>
                {['All', 'Active', 'Completed', 'Stopped'].map((s) => <option key={s} value={s}>{s}</option>)}
              </Select></div>
            </div>
          }>
          {list.length ? (
            <Table head={['Medicine', 'Dose', 'Schedule', 'Adherence', 'Status', '']}>
              {list.map((m) => {
                const t = m.adherence?.taken || 0, mi = m.adherence?.missed || 0
                const pct = t + mi ? Math.round((t / (t + mi)) * 100) : 0
                return (
                  <tr key={m.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-[12.5px] font-bold text-slate-800">{m.name}</p>
                      <p className="text-[11px] text-slate-500">{m.strength}</p>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-600">{m.dose}<p className="text-[11px] text-slate-400">{m.meal}</p></td>
                    <td className="px-4 py-3 text-[12px] text-slate-600">{m.slot}<p className="text-[11px] text-slate-400">{m.time}</p></td>
                    <td className="px-4 py-3"><div className="w-24"><Bar value={pct} tone={pct >= 85 ? 'green' : pct >= 60 ? 'amber' : 'red'} height={6} /></div></td>
                    <td className="px-4 py-3"><Badge tone={statusTone(m.status)}>{m.status}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { removeMed(m.id); toast(`${m.name} removed from the active list.`, 'info') }}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" title="Remove"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                )
              })}
            </Table>
          ) : <Empty title="No medicines match" sub="Adjust the filter or add a new medicine." icon={Pill} />}
        </Panel>

        <div className="space-y-5">
          <Panel title="Adherence this week" sub="Doses logged on time" icon={CheckCircle2}>
            <AdherenceBars data={VITALS.adherence} height={200} />
          </Panel>
          <Panel title="Safety note" icon={ShieldCheck}>
            <p className="text-[12px] leading-relaxed text-slate-600">
              Your record lists allergies to <strong>{(PATIENT.allergies || []).map((a: any) => a.name).join(', ') || 'none'}</strong>.
              Every new medicine is screened against these before it reaches your schedule.
            </p>
            <Link to="/ai-tools" className="btn btn-teal-soft btn-sm mt-3"><Sparkles size={13} /> Run a safety check</Link>
          </Panel>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add a medicine" sub="It will appear in your schedule and adherence tracking.">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Medicine name" required><Input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="Dolo 650" /></Field>
            <Field label="Strength"><Input value={form.strength} onChange={(e: any) => setForm({ ...form, strength: e.target.value })} placeholder="650 mg" /></Field>
            <Field label="Slot"><Select value={form.slot} onChange={(e: any) => setForm({ ...form, slot: e.target.value })}>{SLOTS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
            <Field label="Time"><Input value={form.time} onChange={(e: any) => setForm({ ...form, time: e.target.value })} placeholder="08:00 AM" /></Field>
            <Field label="Food"><Select value={form.meal} onChange={(e: any) => setForm({ ...form, meal: e.target.value })}>{['Before Food', 'After Food', 'With Food', 'Empty stomach'].map((s) => <option key={s}>{s}</option>)}</Select></Field>
            <Field label="Dose"><Input value={form.dose} onChange={(e: any) => setForm({ ...form, dose: e.target.value })} placeholder="1 tablet" /></Field>
            <Field label="Frequency"><Input value={form.frequency} onChange={(e: any) => setForm({ ...form, frequency: e.target.value })} /></Field>
            <Field label="Prescribed by"><Input value={form.prescriber} onChange={(e: any) => setForm({ ...form, prescriber: e.target.value })} /></Field>
          </div>
          <Field label="Notes"><Textarea rows={2} value={form.notes} onChange={(e: any) => setForm({ ...form, notes: e.target.value })} placeholder="SOS if temperature above 100°F" /></Field>
          <div className="flex gap-2"><button className="btn btn-primary" type="submit"><Plus size={14} /> Add medicine</button><button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button></div>
        </form>
      </Modal>
    </div>
  )
}

/* ================================================================== 2. PRESCRIPTIONS */
export function Prescriptions() {
  const { consultations, toast } = useApp()
  const [active, setActive] = useState<any>(null)
  const withRx = consultations.filter((c: any) => c.prescription)
  const rows = withRx.length ? withRx : consultations.slice(0, 3)

  return (
    <div className="space-y-5">
      <KpiRow items={[
        { label: 'Active prescriptions', value: rows.length, sub: 'Issued by your clinicians', icon: FileText, tone: 'brand' },
        { label: 'Last issued', value: rows[0]?.date || '—', sub: rows[0]?.doctor || 'No prescription yet', icon: CalendarDays, tone: 'teal' },
        { label: 'Refills pending', value: 1, sub: 'Dolo 650 · 5 day course', icon: Syringe, tone: 'amber' },
        { label: 'Digital signature', value: 'Valid', sub: 'Verified prescriber', icon: ShieldCheck, tone: 'green' },
      ]} />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Panel title="Prescription history" sub="Tap a row to open the full digital prescription." icon={ScrollText}
          right={<Download2 label="Print all" />}>
          {rows.length ? (
            <Table head={['Prescription', 'Date', 'Doctor', 'Diagnosis', 'Status', '']}>
              {rows.map((c: any) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-[12px] font-bold text-slate-800">{c.id}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">{c.date}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">{c.doctor}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">{(c.diagnosis || '—').slice(0, 42)}…</td>
                  <td className="px-4 py-3"><Badge tone="green">Active</Badge></td>
                  <td className="px-4 py-3 text-right"><button onClick={() => setActive(c)} className="text-[11.5px] font-bold text-brand-600">View</button></td>
                </tr>
              ))}
            </Table>
          ) : <Empty title="No prescriptions yet" sub="Your doctor's prescriptions will appear here." icon={FileText} />}
        </Panel>

        <Panel title="Medicines on your latest prescription" icon={Pill}>
          <div className="space-y-2.5">
            {(rows[0]?.prescription?.items || []).map((i: any, n: number) => (
              <div key={n} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12.5px] font-bold text-slate-800">{i.name}</p>
                  <Badge tone="brand">{i.dose}</Badge>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{i.freq} · {i.duration} · {i.meal}</p>
                {i.notes && <p className="mt-1 text-[11px] italic text-slate-500">{i.notes}</p>}
              </div>
            ))}
            {!(rows[0]?.prescription?.items || []).length && <p className="text-[12px] text-slate-500">No active items to show.</p>}
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Advice</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-slate-700">{rows[0]?.prescription?.advice || 'Rest, oral fluids, and complete the full course. Return if symptoms worsen.'}</p>
          </div>
        </Panel>
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title={active ? `Prescription ${active.id}` : ''} sub={active ? `${active.date} · ${active.doctor}` : ''} wide>
        {active && (
          <div className="space-y-4">
            <KV items={[
              { k: 'Patient', v: active.patient || PATIENT.name }, { k: 'Patient ID', v: active.patientId || PATIENT.id },
              { k: 'Diagnosis', v: active.diagnosis || '—' }, { k: 'Status', v: active.status || 'Completed' },
            ]} />
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-[12px] font-bold text-slate-800">Treatment plan</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-600">{active.plan || '—'}</p>
            </div>
            <div className="flex gap-2"><Download2 /><button className="btn btn-ghost btn-sm" onClick={() => { toast('A copy has been queued to your email.', 'info'); setActive(null) }}><Upload size={13} /> Email copy</button></div>
          </div>
        )}
      </Modal>
      <AiDisclaimer text="Prescriptions are issued by licensed clinicians. This screen is a display of your record and is not a substitute for the printed prescription." />
    </div>
  )
}

/* ================================================================== 3. LAB REPORTS */
export function Reports() {
  const { reports, toast } = useApp()
  const [sel, setSel] = useState<any>(null)

  const abn = (r: any) => (r.rows || []).filter((x: any) => !(x.high === 0 || (x.value >= x.low && x.value <= x.high)))
  const all = reports
  const flagged = all.filter((r: any) => abn(r).length > 0)

  return (
    <div className="space-y-5">
      <KpiRow items={[
        { label: 'Reports on file', value: all.length, sub: 'Across all departments', icon: FlaskConical, tone: 'brand' },
        { label: 'Needs attention', value: flagged.length, sub: 'Values outside range', icon: AlertTriangle, tone: flagged.length ? 'amber' : 'green' },
        { label: 'Last report', value: all[0]?.date || '—', sub: all[0]?.panel || all[0]?.title || '—', icon: CalendarDays, tone: 'teal' },
        { label: 'Verified', value: all.filter((r: any) => r.status === 'Verified').length, sub: 'Signed off by a pathologist', icon: ShieldCheck, tone: 'green' },
      ]} />

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <Panel title="Your reports" sub="Select a report to see the values in plain English." icon={FileText}>
          <div className="space-y-3">
            {all.map((r: any) => {
              const bad = abn(r).length
              return (
                <button key={r.id} onClick={() => setSel(r)}
                  className={cn('w-full rounded-xl border p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/30', sel?.id === r.id ? 'border-brand-300 bg-brand-50/40' : 'border-slate-200')}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[12.5px] font-bold text-slate-900">{r.panel || r.title || r.id}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{r.date || r.requested || '—'} · {r.doctor || 'Pathology'} · {(r.rows || []).length} markers</p>
                    </div>
                    <Badge tone={bad ? 'amber' : 'green'}>{bad ? `${bad} flagged` : 'Normal'}</Badge>
                  </div>
                </button>
              )
            })}
            {!all.length && <Empty title="No lab reports yet" sub="Reports appear here as soon as the laboratory publishes them." icon={FlaskConical} />}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Trend" sub="Blood glucose recorded across your reports" icon={TrendingUp}>
            <SugarChart data={VITALS.sugar} height={200} />
          </Panel>
          <Panel title="What to do next" icon={Info}>
            <div className="space-y-2.5 text-[12px] leading-relaxed text-slate-600">
              <p>Values marked <span className="font-bold text-amber-700">amber</span> sit outside the reference range printed on the report.</p>
              <p>Ranges vary by age, sex and laboratory method — only your clinician can interpret them for you.</p>
            </div>
            <button onClick={() => toast('Report shared with Dr. Rajesh Sharma.', 'success')} className="btn btn-primary btn-sm mt-3.5"><Upload size={13} /> Share with my doctor</button>
          </Panel>
        </div>
      </div>

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel ? (sel.panel || sel.title || sel.id) : ''} sub={sel ? `${sel.date || ''} · ${sel.doctor || 'Pathology'}` : ''} wide>
        {sel && (
          <div className="space-y-4">
            <Table head={['Marker', 'Result', 'Reference', 'Flag']}>
              {(sel.rows || []).map((x: any, i: number) => {
                const bad = !(x.high === 0 || (x.value >= x.low && x.value <= x.high))
                return (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2.5 text-[12px] font-semibold text-slate-700">{x.name || x.k || 'Marker ' + (i + 1)}</td>
                    <td className={cn('px-4 py-2.5 text-[12px] font-bold tabular-nums', bad ? 'text-amber-700' : 'text-slate-800')}>{x.value}{x.unit ? ' ' + x.unit : ''}</td>
                    <td className="px-4 py-2.5 text-[12px] tabular-nums text-slate-500">{x.high === 0 ? '—' : `${x.low} – ${x.high}`}</td>
                    <td className="px-4 py-2.5">{bad ? <Badge tone="amber">Out of range</Badge> : <Badge tone="green">Normal</Badge>}</td>
                  </tr>
                )
              })}
            </Table>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-[12px] font-bold text-slate-800"><Sparkles size={14} className="text-brand-600" /> Plain-English summary</p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-600">
                {abn(sel).length
                  ? `${abn(sel).length} of ${(sel.rows || []).length} markers fall outside the printed reference range (${abn(sel).map((x: any) => x.name || x.k).join(', ')}). This can be normal for some people — discuss it at your next visit.`
                  : `All ${(sel.rows || []).length} markers sit inside the printed reference range. No action is required on this report.`}
              </p>
            </div>
            <div className="flex gap-2"><Download2 /><button className="btn btn-ghost btn-sm" onClick={() => toast('Report shared with Dr. Rajesh Sharma.', 'success')}><Upload size={13} /> Share</button></div>
          </div>
        )}
      </Modal>
      <AiDisclaimer text="Reference ranges differ between laboratories and populations. AI explanations are informational only and never replace a clinician's interpretation." />
    </div>
  )
}

/* ================================================================== 4. APPOINTMENTS */
export function Appointments() {
  const { appts, addAppt, updateAppt, toast, pushNotif } = useApp()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('Upcoming')
  const [form, setForm] = useState({ doctor: DOCTORS[0]?.name || 'Dr. Rajesh Sharma', date: '12 Oct 2026', time: '10:30 AM', type: 'In-Person', reason: '' })

  const upcoming = appts.filter((a) => !['COMPLETED', 'CANCELLED'].includes(a.status))
  const past = appts.filter((a: any) => ['COMPLETED', 'CANCELLED'].includes(a.status))
  const list = tab === 'Upcoming' ? upcoming : tab === 'Past' ? past : appts.filter((a) => a.status === 'CANCELLED')
  const doc = DOCTORS.find((d) => d.name === form.doctor)

  const book = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.reason.trim()) { toast('Please add a reason for the visit.', 'error'); return }
    addAppt({
      id: 'APT-' + Date.now(), doctor: form.doctor, dept: doc?.dept || 'General Medicine', type: form.type,
      date: form.date, time: form.time, token: 'T-' + (10 + appts.length), status: 'BOOKED', reason: form.reason,
    } as any)
    pushNotif({ cat: 'Appointment', title: 'Appointment booked', body: `${form.doctor} · ${form.date} at ${form.time}.`, tone: 'blue' })
    toast('Appointment requested — you will receive a confirmation token.', 'success')
    setForm({ ...form, reason: '' })
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <KpiRow items={[
        { label: 'Upcoming', value: upcoming.length, sub: 'Confirmed and pending', icon: CalendarDays, tone: 'brand' },
        { label: 'Next visit', value: upcoming[0]?.time || '—', sub: upcoming[0]?.doctor || 'Nothing scheduled', icon: Clock, tone: 'teal' },
        { label: 'Completed', value: past.length, sub: 'In your history', icon: CheckCircle2, tone: 'green' },
        { label: 'Video consults', value: appts.filter((a) => a.type === 'Video').length, sub: 'From home', icon: Stethoscope, tone: 'violet' },
      ]} />

      <Panel title="Your appointments" sub="Book, reschedule or cancel a visit." icon={CalendarDays}
        right={<button onClick={() => setOpen(true)} className="btn btn-primary btn-sm"><Plus size={13} /> Book appointment</button>}>
        <div className="mb-4 flex gap-2">
          {['Upcoming', 'Past', 'Cancelled'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('rounded-full px-3.5 py-1.5 text-[12px] font-bold transition', tab === t ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>{t}</button>
          ))}
        </div>
        {list.length ? (
          <div className="space-y-3">
            {list.map((a: any) => (
              <div key={a.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-extrabold text-slate-900">{a.doctor}</p>
                    <p className="text-[11.5px] text-slate-500">{a.dept} · {a.type} · Token {a.token}</p>
                    <p className="mt-1.5 text-[11.5px] text-slate-600"><strong>{a.date}</strong> at <strong>{a.time}</strong></p>
                    {a.reason && <p className="mt-1 text-[11.5px] text-slate-500">Reason: {a.reason}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge tone={a.status === 'COMPLETED' ? 'green' : a.status === 'CANCELLED' ? 'red' : 'brand'}>{a.status}</Badge>
                    {a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && (
                      <div className="flex gap-2">
                        <button onClick={() => { updateAppt(a.id, { status: 'CANCELLED' }); toast('Appointment cancelled.', 'warn') }}
                          className="btn btn-ghost btn-sm"><X size={12} /> Cancel</button>
                        <button onClick={() => { updateAppt(a.id, { status: 'BOOKED' }); toast('Reschedule request sent to the front desk.', 'info') }}
                          className="btn btn-teal-soft btn-sm">Reschedule</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty title={`No ${tab.toLowerCase()} appointments`} sub="Book a consultation to get started." icon={CalendarDays} />}
      </Panel>

      <Panel title="Book a new appointment" sub="Choose a specialist and a slot that suits you." icon={Stethoscope}>
        <form onSubmit={book} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Doctor" required><Select value={form.doctor} onChange={(e: any) => setForm({ ...form, doctor: e.target.value })}>{DOCTORS.map((d) => <option key={d.id} value={d.name}>{d.name} — {d.dept}</option>)}</Select></Field>
          <Field label="Date" required><Input value={form.date} onChange={(e: any) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Time" required><Select value={form.time} onChange={(e: any) => setForm({ ...form, time: e.target.value })}>{['09:00 AM', '09:30 AM', '10:30 AM', '11:30 AM', '04:00 PM', '05:30 PM'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
          <Field label="Type"><Select value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })}>{['In-Person', 'Video', 'Follow-up'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
          <div className="sm:col-span-2 xl:col-span-3"><Field label="Reason for visit" required><Input value={form.reason} onChange={(e: any) => setForm({ ...form, reason: e.target.value })} placeholder="Knee pain after activity" /></Field></div>
          <div className="flex items-end"><button className="btn btn-primary w-full" type="submit"><CalendarDays size={14} /> Confirm booking</button></div>
        </form>
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title="Quick book" sub="Confirm your visit details.">
        <form onSubmit={book} className="space-y-4">
          <Field label="Doctor"><Select value={form.doctor} onChange={(e: any) => setForm({ ...form, doctor: e.target.value })}>{DOCTORS.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}</Select></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date"><Input value={form.date} onChange={(e: any) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="Time"><Input value={form.time} onChange={(e: any) => setForm({ ...form, time: e.target.value })} /></Field>
          </div>
          <Field label="Reason" required><Textarea rows={2} value={form.reason} onChange={(e: any) => setForm({ ...form, reason: e.target.value })} /></Field>
          <button className="btn btn-primary" type="submit"><CheckCircle2 size={14} /> Confirm</button>
        </form>
      </Modal>
    </div>
  )
}

/* ================================================================== 5. MEDICAL HISTORY */
export function History() {
  const { consultations, reports, docs, addDoc, toast } = useApp()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', kind: 'Discharge', by: 'Dr. Rajesh Sharma' })

  const conditions = PATIENT.history || []
  const upload = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast('Give the document a title.', 'error'); return }
    addDoc({ id: 'DOC-' + Date.now(), patient: PATIENT.name, title: form.title, kind: form.kind, date: today(), by: form.by })
    toast('Document added to your medical history.', 'success')
    setForm({ ...form, title: '' })
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <KpiRow items={[
        { label: 'Conditions', value: conditions.length, sub: 'Documented diagnoses', icon: Heart, tone: 'brand' },
        { label: 'Consultations', value: consultations.length, sub: 'Across all clinicians', icon: Stethoscope, tone: 'teal' },
        { label: 'Documents', value: docs.length, sub: 'Uploaded and issued', icon: FileText, tone: 'violet' },
        { label: 'Vaccinations', value: (PATIENT.vaccines || []).length, sub: 'Up to date', icon: ShieldCheck, tone: 'green' },
      ]} />

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Conditions & allergies" sub="Carried on every prescription check" icon={Heart}>
          <div className="space-y-2">
            {conditions.map((h: string) => (
              <div key={h} className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3.5 py-2.5">
                <Activity size={14} className="text-brand-600" /><p className="text-[12.5px] text-slate-700">{h}</p>
              </div>
            ))}
            {!conditions.length && <p className="text-[12px] text-slate-500">No chronic conditions recorded.</p>}
          </div>
          <div className="mt-4">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Allergies</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(PATIENT.allergies || []).map((a: any) => <Badge key={a.name} tone="red">{a.name} · {a.severity || 'moderate'}</Badge>)}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Immunisation</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{(PATIENT.vaccines || []).map((v: string) => <Badge key={v} tone="green">{v}</Badge>)}</div>
          </div>
        </Panel>

        <Panel title="Consultation history" sub={`${consultations.length} recorded visits`} icon={ScrollText}>
          <div className="space-y-3">
            {consultations.map((c: any) => (
              <div key={c.id} className="rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-bold text-slate-900">{c.id}</p>
                  <Badge tone={c.status === 'Completed' ? 'green' : 'amber'}>{c.status}</Badge>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">{c.date} · {c.doctor}</p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-600">{c.diagnosis}</p>
              </div>
            ))}
            {!consultations.length && <Empty title="No consultations yet" sub="Your visit notes will appear here." icon={Stethoscope} />}
          </div>
        </Panel>
      </div>

      <Panel title="Documents" sub="Discharge summaries, scans and old prescriptions." icon={FileText}
        right={<button onClick={() => setOpen(true)} className="btn btn-primary btn-sm"><Plus size={13} /> Add document</button>}>
        <Table head={['Document', 'Type', 'Date', 'Issued by', '']}>
          {docs.map((d) => (
            <tr key={d.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 text-[12px] font-semibold text-slate-800">{d.title}</td>
              <td className="px-4 py-3"><Badge tone="slate">{d.kind}</Badge></td>
              <td className="px-4 py-3 text-[12px] text-slate-600">{d.date}</td>
              <td className="px-4 py-3 text-[12px] text-slate-600">{d.by}</td>
              <td className="px-4 py-3 text-right"><button onClick={() => window.print()} className="text-[11.5px] font-bold text-brand-600">Download</button></td>
            </tr>
          ))}
        </Table>
        {!docs.length && <Empty title="No documents" sub="Add a discharge summary or an old prescription." icon={FileText} />}
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title="Add a document" sub="It is stored in your record and visible to your care team.">
        <form onSubmit={upload} className="space-y-4">
          <Field label="Title" required><Input value={form.title} onChange={(e: any) => setForm({ ...form, title: e.target.value })} placeholder="Cardiology discharge summary" /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type"><Select value={form.kind} onChange={(e: any) => setForm({ ...form, kind: e.target.value })}>{['Discharge', 'Prescription', 'Scan', 'Immunisation', 'Other'].map((k) => <option key={k}>{k}</option>)}</Select></Field>
            <Field label="Issued by"><Input value={form.by} onChange={(e: any) => setForm({ ...form, by: e.target.value })} /></Field>
          </div>
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
            <Upload size={18} className="mx-auto text-slate-400" />
            <p className="mt-2 text-[11.5px] text-slate-500">Drag a file here, or use the title above to register a paper document.</p>
          </div>
          <button className="btn btn-primary" type="submit"><Plus size={14} /> Save document</button>
        </form>
      </Modal>
    </div>
  )
}

/* ================================================================== 6. AI HEALTH ASSISTANT */
export function Assistant() {
  const { meds, toast, pushNotif } = useApp()
  const [tab, setTab] = useState<'safety' | 'symptoms'>('safety')
  const [extra, setExtra] = useState('')
  const [symptom, setSymptom] = useState('Fever with chills for two days')
  const [res, setRes] = useState<any>(null)
  const [triage, setTriage] = useState<any>(null)

  const activeNames = meds.filter((m) => m.status === 'Active').map((m) => m.name)
  const check = () => {
    const r = analyseMeds({
      meds: [...activeNames, ...extra.split(',').map((s) => s.trim()).filter(Boolean)],
      allergies: (PATIENT.allergies || []).map((a: any) => a.name),
      conditions: (PATIENT.history || []).join(', '),
    } as any)
    setRes(r)
    pushNotif({ cat: 'AI Safety', title: r.level === 'High' ? 'Safety check flagged issues' : 'Safety check completed', body: `Risk level ${r.level} · score ${r.riskScore}.`, tone: r.level === 'High' ? 'red' : 'green' })
    toast(`Screening complete — risk level ${r.level}.`, r.level === 'High' ? 'warn' : 'success')
  }
  const run = () => {
    const r = triageSymptoms(symptom, PATIENT.age, (PATIENT.history || []).map((h: string) => h.split(' ')[0]))
    setTriage(r)
    toast(`Triage complete — ${r.level} urgency.`, r.level === 'CRITICAL' ? 'warn' : 'info')
  }

  return (
    <div className="space-y-5">
      <div className="card overflow-hidden">
        <div className="relative">
          <Img src={IMG.digital2 || IMG.digital} alt="AI health assistant" className="h-40 w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-900/80 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-6">
            <div className="flex items-center gap-2"><span className="live-dot" /><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-300">AI assistant · online</p></div>
            <h2 className="mt-2 text-[22px] font-extrabold text-white">Ask about your medicines and symptoms</h2>
            <p className="mt-1 max-w-lg text-[12px] text-slate-300">Screened against your {(PATIENT.allergies || []).length} allergies, {activeNames.length} active medicines and your recorded history.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {[{ k: 'safety', l: 'Medication safety' }, { k: 'symptoms', l: 'Symptom triage' }].map((t: any) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={cn('rounded-full px-4 py-2 text-[12.5px] font-bold transition', tab === t.k ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>{t.l}</button>
        ))}
      </div>

      {tab === 'safety' && (
        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <Panel title="Check a new medicine" sub="Everything on your active list is included automatically." icon={ShieldCheck}>
            <Field label="Add medicines (comma separated)"><Textarea rows={3} value={extra} onChange={(e: any) => setExtra(e.target.value)} placeholder="Ibuprofen, Aspirin" /></Field>
            <div className="mt-3 flex flex-wrap gap-1.5">{activeNames.map((n: string) => <Badge key={n} tone="brand">{n}</Badge>)}</div>
            <button onClick={check} className="btn btn-primary mt-4 w-full"><Zap size={14} /> Run safety check</button>
          </Panel>

          <Panel title="Result" sub="Interaction, duplication and allergy screening" icon={Sparkles}>
            {res ? (
              <div className="space-y-4">
                <div className={cn('rounded-xl p-4', res.level === 'High' ? 'bg-rose-50' : res.level === 'Moderate' ? 'bg-amber-50' : 'bg-emerald-50')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={cn('grid h-9 w-9 place-items-center rounded-lg text-white', res.level === 'High' ? 'bg-rose-500' : res.level === 'Moderate' ? 'bg-amber-500' : 'bg-emerald-500')}><ShieldCheck size={17} /></span>
                      <div><p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Risk level</p><p className="text-[14px] font-extrabold text-slate-900">{res.level}</p></div>
                    </div>
                    <p className="text-[26px] font-extrabold tabular-nums text-slate-900">{res.riskScore}</p>
                  </div>
                  <div className="mt-3"><Bar value={res.riskScore} tone={res.level === 'High' ? 'red' : res.level === 'Moderate' ? 'amber' : 'green'} showPct={false} height={7} /></div>
                </div>
                <div className="space-y-1.5">
                  {(res.summary || []).map((s: string, i: number) => (
                    <p key={i} className="flex gap-2 text-[11.5px] leading-relaxed text-slate-700"><Info size={13} className="mt-0.5 shrink-0 text-brand-500" /> {s}</p>
                  ))}
                </div>
                {(res.flags || []).length > 0 && (
                  <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Flags</p>
                    <div className="mt-2 space-y-2">
                      {res.flags.map((f: any, i: number) => (
                        <div key={i} className="rounded-lg border border-slate-200 p-3">
                          <div className="flex items-center justify-between"><p className="text-[12px] font-bold text-slate-800">{f.title || f.k || 'Interaction'}</p><Badge tone={f.level === 'Severe' ? 'red' : f.level === 'Moderate' ? 'amber' : 'slate'}>{f.level || 'Info'}</Badge></div>
                          <p className="mt-1 text-[11.5px] text-slate-600">{f.detail || f.d}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : <Empty title="No check run yet" sub="Add a medicine and run the check." icon={ShieldCheck} />}
          </Panel>
        </div>
      )}

      {tab === 'symptoms' && (
        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <Panel title="Describe your symptoms" sub="Plain language is fine." icon={Activity}>
            <Field label="What are you feeling?" required><Textarea rows={4} value={symptom} onChange={(e: any) => setSymptom(e.target.value)} /></Field>
            <button onClick={run} className="btn btn-primary mt-4 w-full"><Zap size={14} /> Get guidance</button>
            <TriageDisclaimer />
          </Panel>
          <Panel title="Guidance" sub="Urgency, suggested department and next step" icon={Stethoscope}>
            {triage ? (
              <div className="space-y-4">
                <div className={cn('rounded-xl p-4', triage.level === 'CRITICAL' ? 'bg-rose-50' : triage.level === 'HIGH' ? 'bg-amber-50' : triage.level === 'MEDIUM' ? 'bg-sky-50' : 'bg-emerald-50')}>
                  <div className="flex items-center justify-between">
                    <div><p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Urgency</p><p className="text-[20px] font-extrabold text-slate-900">{triage.level}</p></div>
                    <Badge tone={triage.level === 'CRITICAL' ? 'red' : triage.level === 'HIGH' ? 'amber' : 'green'}>{triage.urgency || 'Assessment'}</Badge>
                  </div>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-slate-700">{triage.summary}</p>
                </div>
                <KV items={[{ k: 'Suggested department', v: triage.dept || 'General Medicine' }, { k: 'Next step', v: triage.nextStep || 'Book a consultation' }, { k: 'Confidence', v: `${Math.round((triage.confidence || 0.8) * 100)}%` }, { k: 'Recorded allergies', v: (PATIENT.allergies || []).map((a: any) => a.name).join(', ') }]} />
                <div className="flex gap-2">
                  <Link to="/appointments" className="btn btn-primary btn-sm">Book appointment</Link>
                  {triage.level === 'CRITICAL' && <Link to="/emergency" className="btn btn-danger btn-sm"><Siren size={13} /> Emergency</Link>}
                </div>
              </div>
            ) : <Empty title="No assessment yet" sub="Describe your symptoms to get guidance." icon={Stethoscope} />}
          </Panel>
        </div>
      )}
      <AiDisclaimer />
    </div>
  )
}

/* ================================================================== 7. EMERGENCY */
export function Emergency() {
  const { emergencies, addEmergency, updateEmergency, toast, pushNotif } = useApp()
  const [form, setForm] = useState({ type: 'Breathing difficulty', location: PATIENT.address || 'Home address', note: '' })
  const [activeId, setActiveId] = useState<string | null>(null)

  const live = emergencies.find((e: any) => !['Closed', 'Resolved', 'Completed'].includes(e.status))
  const prio = emergencyPriority({ type: form.type, note: form.note, age: PATIENT.age, conditions: (PATIENT.history || []).join(', ') } as any)

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const id = 'EMG-' + Date.now()
    addEmergency({ id, type: form.type, location: form.location, note: form.note, status: 'Dispatched', priority: prio?.level || 'HIGH', at: new Date().toISOString() } as any)
    setActiveId(id)
    pushNotif({ cat: 'Emergency', title: 'Ambulance dispatched', body: `${form.type} · ${form.location}. Control room notified.`, tone: 'red' })
    toast('Emergency request sent. An ambulance has been dispatched.', 'warn')
  }

  return (
    <div className="space-y-5">
      <div className="card overflow-hidden border-rose-200">
        <div className="bg-gradient-to-r from-rose-600 to-rose-500 px-5 py-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/20"><Ambulance size={20} /></span>
              <div><p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-rose-100">Emergency assistance</p><p className="text-[17px] font-extrabold">Help is reachable in ~7 minutes</p></div>
            </div>
            <a href="tel:108" className="btn btn-md bg-white text-rose-700"><Phone size={14} /> Call 108</a>
          </div>
        </div>
      </div>

      <KpiRow items={[
        { label: 'Status', value: live ? live.status : 'Standby', sub: live ? `${live.type}` : 'No active request', icon: Siren, tone: live ? 'red' : 'slate' },
        { label: 'Nearest ambulance', value: 'SMN-AMB-01', sub: '7 min · Advanced life support', icon: Ambulance, tone: 'brand' },
        { label: 'Emergency contact', value: PATIENT.emergency?.name || '—', sub: PATIENT.emergency?.mobile || '—', icon: Phone, tone: 'teal' },
        { label: 'Requests filed', value: emergencies.length, sub: 'This account', icon: ScrollText, tone: 'slate' },
      ]} />

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel title="Request emergency help" sub="A control-room operator calls you back immediately." icon={Siren}>
          <form onSubmit={send} className="space-y-4">
            <Field label="Emergency type" required><Select value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })}>
              {['Breathing difficulty', 'Cardiac — chest pain', 'Stroke symptoms', 'Severe bleeding', 'Fracture / trauma', 'Burns', 'Poisoning / overdose', 'Severe abdominal pain', 'Unconscious', 'Other'].map((t) => <option key={t}>{t}</option>)}
            </Select></Field>
            <Field label="Location" required><Input value={form.location} onChange={(e: any) => setForm({ ...form, location: e.target.value })} /></Field>
            <Field label="What happened?"><Textarea rows={3} value={form.note} onChange={(e: any) => setForm({ ...form, note: e.target.value })} placeholder="Collapsed at home, conscious but breathless." /></Field>
            {prio && (
              <div className={cn('rounded-xl p-3.5', prio.level === 'CRITICAL' ? 'bg-rose-50' : 'bg-amber-50')}>
                <p className="text-[11.5px] font-bold text-slate-900">AI pre-triage: {prio.level} priority</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-700">{prio.reason || 'Dispatch immediately and keep the line open.'}</p>
              </div>
            )}
            <button className="btn btn-danger w-full" type="submit"><Siren size={15} /> Send emergency request</button>
          </form>
        </Panel>

        <div className="space-y-5">
          <Panel title="Live request" sub="Ambulance tracking" icon={Navigation}>
            {live || activeId ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[12.5px] font-bold text-rose-900">{(live || {}).type || form.type}</p>
                    <Badge tone="red">{(live || {}).status || 'Dispatched'}</Badge>
                  </div>
                  <p className="mt-1 text-[11.5px] text-rose-800">Vehicle SMN-AMB-01 · ETA 7 minutes · Paramedic assigned</p>
                  <div className="mt-3 space-y-2">
                    {[['Request received', true], ['Ambulance assigned', true], ['En route', true], ['Arrived', false]].map(([l, done]: any) => (
                      <div key={l} className="flex items-center gap-2.5">
                        <span className={cn('grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold', done ? 'bg-rose-600 text-white' : 'bg-white text-rose-400 ring-1 ring-rose-200')}>{done ? '✓' : '·'}</span>
                        <p className={cn('text-[11.5px]', done ? 'font-semibold text-rose-900' : 'text-rose-500')}>{l}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { const id = (live || {}).id || activeId; if (id) updateEmergency(id, { status: 'Closed' }); setActiveId(null); toast('Emergency request closed.', 'success') }}
                    className="btn btn-ghost btn-sm"><CheckCircle2 size={13} /> Mark resolved</button>
                  <a href="tel:108" className="btn btn-danger btn-sm"><Phone size={13} /> Call control room</a>
                </div>
              </div>
            ) : <Empty title="No active emergency" sub="Use the form to request help — it is logged instantly." icon={Ambulance} />}
          </Panel>

          <Panel title="Your emergency contact" icon={Phone}>
            <KV items={[{ k: 'Name', v: PATIENT.emergency?.name || '—' }, { k: 'Mobile', v: PATIENT.emergency?.mobile || '—' }, { k: 'Blood group', v: PATIENT.blood }, { k: 'Allergies', v: (PATIENT.allergies || []).map((a: any) => a.name).join(', ') }]} />
            <AiDisclaimer text="Emergency guidance is informational. In a life-threatening situation call your local emergency number immediately." />
          </Panel>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== 8. MY PROFILE */
export function Profile() {
  const { toast, newPatients } = useApp()
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState({
    name: PATIENT.name, mobile: PATIENT.mobile, email: PATIENT.email, address: PATIENT.address,
    lang: PATIENT.lang, insurance: PATIENT.insurance, policy: PATIENT.policy,
    ecName: PATIENT.emergency?.name || '', ecMobile: PATIENT.emergency?.mobile || '',
  })
  const [prefs, setPrefs] = useState({ doseReminders: true, reportAlerts: true, apptSms: true, researchShare: false })

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.mobile.trim()) { toast('Name and mobile number are required.', 'error'); return }
    setEdit(false)
    toast('Profile updated. Your care team sees the new details.', 'success')
  }

  return (
    <div className="space-y-5">
      <Panel title="Profile" sub="Your identity, insurance and emergency contact." icon={UserCircle2}
        right={!edit ? <button onClick={() => setEdit(true)} className="btn btn-primary btn-sm">Edit profile</button> : null}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 text-[20px] font-extrabold text-white">
            {(form.name || 'M').split(' ').map((x) => x[0]).slice(0, 2).join('')}
          </div>
          <div>
            <p className="text-[17px] font-extrabold text-slate-900">{form.name}</p>
            <p className="text-[12px] text-slate-500">{PATIENT.id} · {PATIENT.age}y · {PATIENT.gender} · {PATIENT.blood}</p>
          </div>
          <div className="ml-auto flex gap-2"><Badge tone="green">Verified account</Badge><Badge tone="brand">{PATIENT.insurance}</Badge></div>
        </div>

        {edit ? (
          <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required><Input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Mobile" required><Input value={form.mobile} onChange={(e: any) => setForm({ ...form, mobile: e.target.value })} /></Field>
            <Field label="Email"><Input value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Preferred language"><Input value={form.lang} onChange={(e: any) => setForm({ ...form, lang: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="Address"><Input value={form.address} onChange={(e: any) => setForm({ ...form, address: e.target.value })} /></Field></div>
            <Field label="Insurance provider"><Input value={form.insurance} onChange={(e: any) => setForm({ ...form, insurance: e.target.value })} /></Field>
            <Field label="Policy number"><Input value={form.policy} onChange={(e: any) => setForm({ ...form, policy: e.target.value })} /></Field>
            <Field label="Emergency contact name"><Input value={form.ecName} onChange={(e: any) => setForm({ ...form, ecName: e.target.value })} /></Field>
            <Field label="Emergency contact mobile"><Input value={form.ecMobile} onChange={(e: any) => setForm({ ...form, ecMobile: e.target.value })} /></Field>
            <div className="flex gap-2 sm:col-span-2">
              <button className="btn btn-primary" type="submit"><CheckCircle2 size={14} /> Save changes</button>
              <button type="button" className="btn btn-ghost" onClick={() => setEdit(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Personal</p>
              <div className="mt-2"><KV items={[{ k: 'Mobile', v: form.mobile }, { k: 'Email', v: form.email }, { k: 'Address', v: form.address }, { k: 'Language', v: form.lang }]} /></div>
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Insurance & emergency</p>
              <div className="mt-2"><KV items={[{ k: 'Provider', v: form.insurance }, { k: 'Policy', v: form.policy }, { k: 'Emergency contact', v: form.ecName }, { k: 'Contact mobile', v: form.ecMobile }]} /></div>
            </div>
          </div>
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Notification preferences" sub="Choose what reaches you." icon={Bell}>
          <div className="space-y-3">
            {[
              { k: 'doseReminders', l: 'Dose reminders', d: 'Push a reminder at each scheduled time' },
              { k: 'reportAlerts', l: 'Report alerts', d: 'Notify me when a lab report is published' },
              { k: 'apptSms', l: 'Appointment SMS', d: 'Text confirmation and token details' },
              { k: 'researchShare', l: 'Anonymous research', d: 'Allow de-identified data in studies' },
            ].map((p) => (
              <button key={p.k} onClick={() => { setPrefs({ ...prefs, [p.k]: !(prefs as any)[p.k] }); toast(`${p.l} ${(prefs as any)[p.k] ? 'disabled' : 'enabled'}.`, 'info') }}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3.5 text-left transition hover:border-brand-300">
                <div><p className="text-[12.5px] font-bold text-slate-800">{p.l}</p><p className="text-[11px] text-slate-500">{p.d}</p></div>
                <span className={cn('relative h-5 w-9 shrink-0 rounded-full transition', (prefs as any)[p.k] ? 'bg-brand-600' : 'bg-slate-300')}>
                  <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', (prefs as any)[p.k] ? 'left-4.5' : 'left-0.5')} />
                </span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Health summary" sub="Carried with every consultation" icon={HeartPulse}>
          <div className="grid place-items-center"><Ring value={PATIENT.healthScore || 90} size={150} stroke={14} label="Health score" caption="Composite" /></div>
          <div className="mt-4"><KV items={[
            { k: 'Height', v: `${PATIENT.vitals?.height || '—'} cm` }, { k: 'Weight', v: `${PATIENT.vitals?.weight || '—'} kg` },
            { k: 'BMI', v: PATIENT.vitals?.bmi || '—' }, { k: 'Blood group', v: PATIENT.blood },
            { k: 'Conditions', v: (PATIENT.history || []).length }, { k: 'Linked records', v: newPatients?.length || 0 },
          ]} /></div>
          <Link to="/ai-tools" className="btn btn-teal-soft btn-sm mt-4"><Sparkles size={13} /> Open AI health tools</Link>
        </Panel>
      </div>
    </div>
  )
}

/* ================================================================== 9. NOTIFICATIONS */
export function Notifications() {
  const { notif, markRead, readAll, toast } = useApp()
  const [cat, setCat] = useState('All')
  const cats = ['All', ...Array.from(new Set(notif.map((n) => n.cat)))]
  const list = cat === 'All' ? notif : notif.filter((n) => n.cat === cat)
  const unread = notif.filter((n) => !n.read).length

  const toneOf = (t?: string) => (t === 'red' ? 'bg-rose-50 text-rose-600' : t === 'amber' ? 'bg-amber-50 text-amber-600' : t === 'teal' ? 'bg-teal-50 text-teal-600' : 'bg-brand-50 text-brand-600')

  return (
    <div className="space-y-5">
      <KpiRow items={[
        { label: 'Unread', value: unread, sub: 'Needs your attention', icon: Bell, tone: 'brand' },
        { label: 'Total', value: notif.length, sub: 'All time', icon: ScrollText, tone: 'slate' },
        { label: 'Categories', value: cats.length - 1, sub: 'Results, doses, appointments', icon: FileText, tone: 'teal' },
        { label: 'Reminders today', value: notif.filter((n) => n.cat === 'Medication').length, sub: 'Dose and refill alerts', icon: Clock, tone: 'amber' },
      ]} />

      <Panel title="Notification centre" sub={`${unread} unread of ${notif.length}`} icon={Bell}
        right={<button onClick={() => { readAll(); toast('All notifications marked as read.', 'success') }} className="btn btn-ghost btn-sm"><CheckCircle2 size={13} /> Mark all read</button>}>
        <div className="mb-4 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={cn('rounded-full px-3 py-1.5 text-[11.5px] font-bold transition', cat === c ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>{c}</button>
          ))}
        </div>
        <div className="space-y-2.5">
          {list.map((n) => (
            <div key={n.id} className={cn('flex items-start gap-3 rounded-xl border p-3.5 transition', n.read ? 'border-slate-100 bg-white' : 'border-brand-200 bg-brand-50/40')}>
              <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', toneOf((n as any).tone))}><Bell size={15} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12.5px] font-bold text-slate-900">{n.title}</p>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">{n.time}</span>
                </div>
                <p className="mt-0.5 text-[11.5px] leading-snug text-slate-600">{n.body}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge tone="slate">{n.cat}</Badge>
                  {!n.read && <button onClick={() => markRead(n.id)} className="text-[11px] font-bold text-brand-600">Mark read</button>}
                </div>
              </div>
            </div>
          ))}
          {!list.length && <Empty title="Nothing here" sub="You are all caught up." icon={Bell} />}
        </div>
      </Panel>
    </div>
  )
}
