import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, Ambulance, ArrowRight, BadgeCheck, Building2, Clock, Compass, HeartPulse,
  Mail, MapPin, MessageSquare, Navigation, Phone, Send, ShieldCheck, Truck, User, Check,
} from 'lucide-react'
import { PageHero } from '../components/PublicShell'
import { AiDisclaimer, Badge, Btn, Field, Img, Input, SectionHead, Select, Textarea, cn } from '../components/ui'
import { DEPARTMENTS, EMERGENCIES, IMG, PATIENT } from '../data/mock'
import { useApp } from '../context/AppContext'
import { emergencyPriority } from '../lib/ai'
import EmergencyTracking from '../components/EmergencyTracking'

const EMERGENCY_TYPES = [
  'Road traffic accident', 'Cardiac — chest pain / palpitations', 'Stroke symptoms', 'Breathing difficulty',
  'Severe bleeding', 'Fracture / trauma', 'Burns', 'Poisoning / overdose', 'Obstetric emergency',
  'High fever with seizures', 'Severe abdominal pain', 'Unconscious / unresponsive', 'Other',
]

const AMBULANCES = [
  { id: 'SMN-AMB-01', type: 'Advanced Life Support', crew: 'Paramedic + EMT', status: 'Available', location: 'Whitefield Depot', eta: '12 min', distance: '4.2 km' },
  { id: 'SMN-AMB-02', type: 'Advanced Life Support', crew: 'Paramedic + EMT', status: 'On Mission', location: 'Outer Ring Road', eta: '—', distance: '—' },
  { id: 'SMN-AMB-03', type: 'Basic Life Support', crew: 'Two EMTs', status: 'Available', location: 'Indiranagar Depot', eta: '9 min', distance: '2.9 km' },
  { id: 'SMN-AMB-04', type: 'Neonatal Transport', crew: 'Nurse + EMT', status: 'Available', location: 'Main Campus', eta: '15 min', distance: '6.1 km' },
  { id: 'SMN-AMB-05', type: 'Advanced Life Support', crew: 'Paramedic + EMT', status: 'On Mission', location: 'Indiranagar 100ft Road', eta: '—', distance: '—' },
]

const PRIORITY_STYLE: Record<string, { bg: string; text: string; ring: string }> = {
  CRITICAL: { bg: 'bg-rose-500', text: 'text-white', ring: 'ring-rose-200' },
  HIGH: { bg: 'bg-amber-500', text: 'text-white', ring: 'ring-amber-200' },
  MEDIUM: { bg: 'bg-brand-500', text: 'text-white', ring: 'ring-brand-200' },
  LOW: { bg: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-200' },
}

export default function Emergency() {
  const { emergencies, addEmergency, updateEmergency, pushNotif, toast } = useApp()

  const [form, setForm] = useState({
    name: PATIENT.name, age: '20', gender: 'Female', mobile: PATIENT.mobile,
    type: '', location: '24, Lakeview Residency, Bengaluru, Karnataka 560037',
    landmark: 'Near Lakeview Park gate 2', notes: '', contact: PATIENT.emergency.name, contactMobile: PATIENT.emergency.mobile,
    breathing: 'Normal', conscious: 'Yes', bleeding: 'No',
  })
  const [submitted, setSubmitted] = useState<any>(null)
  const [active, setActive] = useState<any>(EMERGENCIES[0])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.type) { toast('Select the emergency type so the right team is activated.', 'error'); return }
    if (!form.location.trim()) { toast('A pickup location is required to dispatch an ambulance.', 'error'); return }

    const triage = emergencyPriority({
      type: form.type,
      symptoms: `${form.notes} ${form.type} ${form.landmark}`,
      age: Number(form.age),
      conscious: form.conscious === 'Yes',
      bleeding: form.bleeding.startsWith('Yes'),
      breathing: form.breathing !== 'Normal',
    })
    const id = 'EMG-2026-' + String(100015 + emergencies.length).slice(1)
    const rec = {
      id, patient: form.name, type: form.type, location: form.location,
      reported: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      priority: triage.priority as any, reason: triage.reason, dept: triage.dept, action: triage.action,
      ambulance: triage.priority === 'CRITICAL' ? 'SMN-AMB-01' : 'SMN-AMB-03',
      eta: triage.priority === 'CRITICAL' ? '5 min' : '11 min',
      status: 'En Route' as const, hospital: 'SmartMed — Main Campus',
    }
    addEmergency(rec)
    pushNotif({ cat: 'Emergency', title: `Emergency request ${rec.id} created`, body: `${triage.priority} priority · Ambulance ${rec.ambulance} dispatched · ETA ${rec.eta}.`, tone: 'red' })
    setSubmitted({ rec, triage })
    setActive(rec)
    toast(`Emergency request submitted — ${triage.priority} priority. Ambulance dispatched.`, 'warn')
  }

  const steps = [
    { l: 'Request received', d: 'Your location and details reached the control desk.', done: !!submitted },
    { l: 'AI triage complete', d: submitted ? `Priority set to ${submitted.triage.priority}.` : 'Awaiting submission.', done: !!submitted },
    { l: 'Ambulance assigned', d: submitted ? `${submitted.rec.ambulance} dispatched.` : 'Awaiting triage.', done: !!submitted },
    { l: 'En route to you', d: submitted ? `Estimated arrival ${submitted.rec.eta}.` : 'Awaiting dispatch.', done: !!submitted },
    { l: 'Emergency bay ready', d: submitted ? `${submitted.rec.dept} team alerted.` : 'Awaiting assignment.', done: !!submitted },
  ]

  return (
    <>
      <PageHero
        eyebrow="Emergency & ambulance"
        title={<>Help is one tap away — <span className="text-rose-500">day or night</span></>}
        sub="Submit an emergency request with your location and condition. The platform triages priority, dispatches the nearest suitable ambulance and alerts the receiving department before you arrive."
      >
        <div className="flex flex-wrap gap-3">
          <a href="#request" className="btn btn-danger btn-lg"><Ambulance size={16} /> 🚨 EMERGENCY ASSISTANCE</a>
          <a href="tel:+911800123456" className="btn btn-ghost btn-lg"><Phone size={15} /> Call 1800 123 456 (demo)</a>
        </div>
        <p className="mt-3 flex items-center gap-2 text-[11.5px] font-semibold text-rose-600">
          <AlertTriangle size={13} /> Demonstration only — this does not contact real emergency services. In a real emergency call your local emergency number immediately.
        </p>
      </PageHero>

      {/* live status strip */}
      <section className="border-y border-slate-200 bg-white py-5">
        <div className="container-x grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: 'Active emergency requests', v: emergencies.filter((e) => e.status !== 'Handed Over').length, i: AlertTriangle, tone: 'bg-rose-50 text-rose-600' },
            { l: 'Ambulances available', v: AMBULANCES.filter((a) => a.status === 'Available').length, i: Truck, tone: 'bg-emerald-50 text-emerald-600' },
            { l: 'Resuscitation bays free', v: '3 of 6', i: HeartPulse, tone: 'bg-brand-50 text-brand-600' },
            { l: 'Average response time', v: '9 min', i: Clock, tone: 'bg-amber-50 text-amber-600' },
          ].map((x) => (
            <div key={x.l} className="flex items-center gap-3.5">
              <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', x.tone)}><x.i size={19} /></span>
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">{x.l}</p>
                <p className="text-[19px] font-extrabold leading-tight text-slate-900">{x.v}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- advanced GPS dispatch + live tracking ---------------- */}
      <div className="border-y border-slate-200 bg-slate-50/60 py-10">
        <EmergencyTracking emergency={active} />
      </div>

      {/* ---------------- request + tracking ---------------- */}
      <section id="request" className="container-x py-14">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          {/* form */}
          <div>
            <div className="card overflow-hidden">
              <div className="border-b border-rose-100 bg-rose-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-600 text-white anim-pulse-red"><Ambulance size={19} /></span>
                  <div>
                    <h2 className="text-[16px] font-extrabold text-rose-900">Emergency assistance request</h2>
                    <p className="text-[12px] text-rose-700">Complete the fields below — the more detail, the better the triage.</p>
                  </div>
                </div>
              </div>

              <form onSubmit={submit} className="p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">1 · Emergency type</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {EMERGENCY_TYPES.map((t) => (
                    <button type="button" key={t} onClick={() => set('type', t)}
                      className={cn('rounded-lg border px-3 py-2.5 text-left text-[11.5px] font-semibold transition',
                        form.type === t ? 'border-rose-400 bg-rose-50 text-rose-800 ring-4 ring-rose-500/10' : 'border-slate-200 text-slate-700 hover:border-rose-300')}>
                      {t}
                    </button>
                  ))}
                </div>

                <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">2 · Patient information</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Patient name" required><Input value={form.name} onChange={(e: any) => set('name', e.target.value)} required /></Field>
                  <Field label="Age" required><Input value={form.age} onChange={(e: any) => set('age', e.target.value)} required /></Field>
                  <Field label="Gender" required>
                    <Select value={form.gender} onChange={(e: any) => set('gender', e.target.value)}>
                      {['Female', 'Male', 'Other'].map((g) => <option key={g}>{g}</option>)}
                    </Select>
                  </Field>
                  <Field label="Mobile" required><Input value={form.mobile} onChange={(e: any) => set('mobile', e.target.value)} required /></Field>
                </div>

                <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">3 · Location for pickup</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Field label="Full address" required hint="Captured automatically from device location in the mobile app.">
                    <Textarea rows={2} value={form.location} onChange={(e: any) => set('location', e.target.value)} required />
                  </Field>
                  <Field label="Nearby landmark">
                    <Textarea rows={2} value={form.landmark} onChange={(e: any) => set('landmark', e.target.value)} />
                  </Field>
                </div>
                <button type="button" onClick={() => toast('Device location attached to the request (demo).', 'info')}
                  className="btn btn-ghost btn-sm mt-3"><Compass size={13} /> Use my current location</button>

                <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">4 · Condition observations</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <Field label="Breathing">
                    <Select value={form.breathing} onChange={(e: any) => set('breathing', e.target.value)}>
                      {['Normal', 'Rapid / shallow', 'Laboured', 'Not breathing'].map((x) => <option key={x}>{x}</option>)}
                    </Select>
                  </Field>
                  <Field label="Conscious and responsive">
                    <Select value={form.conscious} onChange={(e: any) => set('conscious', e.target.value)}>
                      {['Yes', 'Drowsy', 'Unresponsive'].map((x) => <option key={x}>{x}</option>)}
                    </Select>
                  </Field>
                  <Field label="Visible severe bleeding">
                    <Select value={form.bleeding} onChange={(e: any) => set('bleeding', e.target.value)}>
                      {['No', 'Yes — controlled', 'Yes — uncontrolled'].map((x) => <option key={x}>{x}</option>)}
                    </Select>
                  </Field>
                </div>

                <div className="mt-4">
                  <Field label="Additional notes" hint="Medications taken, known allergies, medical history, number of casualties.">
                    <Textarea rows={3} value={form.notes} onChange={(e: any) => set('notes', e.target.value)}
                      placeholder="e.g. Two-wheeler collision 10 minutes ago. Patient is conscious, drowsy, complaining of neck pain. Known penicillin allergy." />
                  </Field>
                </div>

                <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">5 · Emergency contact</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Field label="Contact name"><Input value={form.contact} onChange={(e: any) => set('contact', e.target.value)} /></Field>
                  <Field label="Contact mobile"><Input value={form.contactMobile} onChange={(e: any) => set('contactMobile', e.target.value)} /></Field>
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand-600" />
                  <p className="text-[11.5px] leading-relaxed text-slate-600">
                    Submitting shares your location and condition with the emergency control desk, the assigned ambulance crew
                    and the receiving department. Data is retained in the audit log for quality review.
                  </p>
                </div>

                <button type="submit" className="btn btn-danger btn-lg mt-5 w-full">
                  <Ambulance size={16} /> Dispatch emergency assistance
                </button>
              </form>
            </div>
          </div>

          {/* tracking */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* map */}
            <div className="card overflow-hidden" style={{ padding: 0 }}>
              <div className="relative h-[268px] bg-slate-900">
                <div className="absolute inset-0 opacity-60" style={{
                  backgroundImage: 'linear-gradient(rgba(148,163,184,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.16) 1px, transparent 1px)',
                  backgroundSize: '34px 34px',
                }} />
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 22% 30%, rgba(37,99,235,0.25), transparent 45%), radial-gradient(circle at 78% 72%, rgba(13,148,136,0.22), transparent 48%)',
                }} />
                {/* route */}
                <svg viewBox="0 0 400 260" className="absolute inset-0 h-full w-full">
                  <path d="M40 220 C 120 200, 130 120, 200 118 S 300 90, 356 44" fill="none" stroke="#14b8a6" strokeWidth="3" strokeDasharray="8 6" />
                  <circle cx="40" cy="220" r="7" fill="#f43f5e" />
                  <circle cx="356" cy="44" r="9" fill="#22d3ee" />
                  <circle cx="120" cy="196" r="6" fill="#f8fafc" stroke="#14b8a6" strokeWidth="2" />
                  <circle cx="222" cy="112" r="6" fill="#f8fafc" stroke="#14b8a6" strokeWidth="2" />
                </svg>
                <div className="absolute left-3 top-3 rounded-lg bg-white/95 px-3 py-2 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ambulance {submitted?.rec.ambulance || active.ambulance}</p>
                  <p className="text-[12.5px] font-extrabold text-slate-900">ETA {submitted?.rec.eta || active.eta}</p>
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 shadow-sm">
                  <Navigation size={13} className="text-rose-500" />
                  <p className="text-[11px] font-semibold text-slate-700">Live route to {(submitted?.rec.location || active.location).slice(0, 34)}…</p>
                </div>
                <div className="absolute bottom-3 right-3 rounded-lg bg-slate-900/85 px-2.5 py-1.5">
                  <p className="text-[10px] font-semibold text-slate-300">Demo map · no live GPS</p>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-slate-900">Emergency case {submitted?.rec.id || active.id}</h3>
                  <span className={cn('rounded-full px-2.5 py-1 text-[10.5px] font-extrabold tracking-wide', PRIORITY_STYLE[submitted?.triage.priority || active.priority].bg, PRIORITY_STYLE[submitted?.triage.priority || active.priority].text)}>
                    {submitted?.triage.priority || active.priority}
                  </span>
                </div>
                <div className="mt-3.5 space-y-2.5">
                  {[
                    { k: 'Patient', v: submitted?.rec.patient || active.patient },
                    { k: 'Emergency type', v: submitted?.rec.type || active.type },
                    { k: 'Location', v: submitted?.rec.location || active.location },
                    { k: 'Reported at', v: submitted?.rec.reported || active.reported },
                    { k: 'Receiving department', v: submitted?.rec.dept || active.dept },
                    { k: 'Hospital', v: submitted?.rec.hospital || active.hospital },
                  ].map((x) => (
                    <div key={x.k} className="flex items-start justify-between gap-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{x.k}</span>
                      <span className="max-w-[62%] text-right text-[12px] font-semibold text-slate-800">{x.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI triage */}
            <div className="card p-5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600"><AlertTriangle size={15} /></span>
                <h3 className="text-[13.5px] font-bold text-slate-900">AI-assisted triage</h3>
              </div>
              <div className="mt-3.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <span className={cn('rounded-md px-2 py-1 text-[11px] font-extrabold', PRIORITY_STYLE[submitted?.triage.priority || active.priority].bg, PRIORITY_STYLE[submitted?.triage.priority || active.priority].text)}>
                    {submitted?.triage.priority || active.priority}
                  </span>
                  <span className="text-[11.5px] font-bold text-slate-700">Priority</span>
                </div>
                <p className="mt-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Reason</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-700">{submitted?.triage.reason || active.reason}</p>
                <p className="mt-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Recommended department</p>
                <p className="mt-1 text-[12px] font-semibold text-slate-800">{submitted?.triage.dept || active.dept}</p>
                <p className="mt-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Recommended action</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-700">{submitted?.triage.action || active.action}</p>
              </div>
              <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" />
                <p className="text-[11px] leading-relaxed text-amber-900">
                  This is AI-assisted triage for demonstration only. It is not a medical diagnosis and does not replace the
                  judgement of emergency clinicians.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ---------------- request tracking timeline ---------------- */}
      <section className="border-y border-slate-200 bg-white py-14">
        <div className="container-x">
          <SectionHead eyebrow="Live tracking" title="What happens after you press the button" sub={submitted ? `Tracking ${submitted.rec.id} — updated ${submitted.rec.reported}.` : 'Submit a request above to see live tracking populate.'} />
          <div className="mt-9 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {steps.map((s, i) => (
              <div key={s.l} className={cn('rounded-xl border p-4 transition-all', s.done ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200')}>
                <div className="flex items-center gap-2.5">
                  <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold',
                    s.done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600')}>
                    {s.done ? <Check size={13} /> : i + 1}
                  </span>
                  <p className={cn('text-[12.5px] font-bold', s.done ? 'text-emerald-900' : 'text-slate-700')}>{s.l}</p>
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-slate-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- fleet ---------------- */}
      <section className="container-x py-14">
        <SectionHead eyebrow="Ambulance fleet" title="Nearest suitable unit is dispatched automatically" sub="Life-support capability is matched to the triage priority — neonatal and advanced life support units are never sent by distance alone." />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AMBULANCES.map((a) => (
            <div key={a.id} className="card card-hover p-5">
              <div className="flex items-start justify-between">
                <span className={cn('grid h-11 w-11 place-items-center rounded-xl', a.type.includes('Neonatal') ? 'bg-violet-50 text-violet-600' : a.type.includes('Advanced') ? 'bg-brand-50 text-brand-600' : 'bg-teal-50 text-teal-600')}>
                  <Truck size={19} />
                </span>
                <Badge tone={a.status === 'Available' ? 'green' : 'amber'}>{a.status}</Badge>
              </div>
              <h3 className="mt-4 text-[14px] font-bold text-slate-900">{a.id}</h3>
              <p className="mt-1 text-[12px] font-semibold text-brand-600">{a.type}</p>
              <div className="mt-3 space-y-1.5 text-[11.5px] text-slate-600">
                <p className="flex items-center gap-2"><User size={12} /> {a.crew}</p>
                <p className="flex items-center gap-2"><MapPin size={12} /> {a.location}</p>
                <p className="flex items-center gap-2"><Clock size={12} /> {a.eta} away · {a.distance}</p>
              </div>
              <Link to="/portal/nurse" className="btn btn-ghost btn-sm mt-3.5 w-full">View crew status</Link>
            </div>
          ))}
          <div className="relative overflow-hidden rounded-2xl">
            <Img src={IMG.hospital} alt="Emergency department" className="h-full w-full" ratio="1/1" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
            <div className="absolute bottom-0 p-4">
              <p className="text-[13px] font-bold text-white">Emergency & Trauma</p>
              <p className="mt-1 text-[11.5px] text-slate-300">6 resuscitation bays · 24/7 trauma team · STAT imaging</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- active cases ---------------- */}
      <section className="border-y border-slate-200 bg-slate-50 py-14">
        <div className="container-x">
          <SectionHead eyebrow="Control desk" title="Active emergency cases" sub="Click a case to load it into the tracking panel above." />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {emergencies.map((e) => (
              <button key={e.id} onClick={() => { setActive(e); setSubmitted(null) }}
                className={cn('card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift',
                  active.id === e.id && 'ring-2 ring-brand-400')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{e.id} · {e.reported}</p>
                    <h3 className="mt-1.5 text-[14px] font-bold text-slate-900">{e.type}</h3>
                    <p className="mt-1 text-[12px] text-slate-600">{e.patient} · {e.location}</p>
                  </div>
                  <span className={cn('rounded-full px-2.5 py-1 text-[10.5px] font-extrabold', PRIORITY_STYLE[e.priority].bg, PRIORITY_STYLE[e.priority].text)}>{e.priority}</span>
                </div>
                <div className="mt-3.5 flex flex-wrap gap-2">
                  <Badge tone="slate">{e.ambulance}</Badge>
                  <Badge tone="teal">ETA {e.eta}</Badge>
                  <Badge tone={e.status === 'Transporting' ? 'blue' : e.status === 'On Scene' ? 'amber' : 'green'}>{e.status}</Badge>
                </div>
                <p className="mt-3 text-[11.5px] leading-relaxed text-slate-600">{e.reason}</p>
                {e.status !== 'Handed Over' && (
                  <div className="mt-3.5 flex gap-2" onClick={(ev) => ev.stopPropagation()}>
                    <button onClick={() => { updateEmergency(e.id, { status: 'Transporting' }); toast(`${e.ambulance} marked as transporting ${e.patient}.`, 'info') }} className="btn btn-ghost btn-sm">Transporting</button>
                    <button onClick={() => { updateEmergency(e.id, { status: 'Handed Over' }); toast(`${e.patient} handed over to ${e.dept}.`, 'success') }} className="btn btn-teal btn-sm">Hand over</button>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- emergency dept info ---------------- */}
      <section className="container-x py-14">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Emergency department</p>
            <h2 className="mt-3 text-[28px] font-extrabold leading-tight text-slate-900">What to expect on arrival</h2>
            <div className="mt-6 space-y-3">
              {[
                { t: 'Immediate triage', d: 'A triage nurse assigns an acuity level within two minutes of arrival. AI-generated priority is reviewed, never trusted blindly.' },
                { t: 'Resuscitation if required', d: 'Critical cases go straight to a bay with airway, monitoring and IV access prepared before the doors open.' },
                { t: 'Diagnostics at the bedside', d: 'Portable X-ray, ultrasound and point-of-care bloods reduce the time to a decision.' },
                { t: 'Specialist activation', d: 'The receiving department is alerted from the ambulance, so the team is waiting rather than being paged late.' },
                { t: 'Family communication', d: 'Your nominated emergency contact is notified with the case ID and the current status of the patient.' },
              ].map((x, i) => (
                <div key={x.t} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-50 text-[12px] font-bold text-rose-600">{i + 1}</span>
                  <div>
                    <p className="text-[13.5px] font-bold text-slate-900">{x.t}</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">{x.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="card p-4">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Emergency line</p>
                <p className="mt-1 flex items-center gap-2 text-[14px] font-extrabold text-slate-900"><Phone size={15} className="text-rose-500" /> 1800 123 456</p>
                <p className="mt-1 text-[11px] text-slate-500">Demo number · 24 hours</p>
              </div>
              <div className="card p-4">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Ambulance control</p>
                <p className="mt-1 flex items-center gap-2 text-[14px] font-extrabold text-slate-900"><Ambulance size={15} className="text-rose-500" /> 1800 123 457</p>
                <p className="mt-1 text-[11px] text-slate-500">Dispatch &amp; fleet coordination</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Img src={IMG.heroNurse} alt="Emergency nursing team" ratio="16/10" className="rounded-2xl" />
            <div className="card p-5">
              <div className="flex items-center gap-2.5">
                <BadgeCheck size={16} className="text-emerald-600" />
                <h3 className="text-[13.5px] font-bold text-slate-900">Linked emergency workflows</h3>
              </div>
              <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
                {[
                  { l: 'Nursing notifications', to: '/portal/nurse' },
                  { l: 'Front-desk walk-in intake', to: '/portal/reception' },
                  { l: 'Radiology STAT queue', to: '/portal/lab' },
                  { l: 'Admin emergency log', to: '/portal/admin' },
                  { l: 'Doctor on-call queue', to: '/portal/doctor' },
                  { l: 'Patient emergency status', to: '/portal/patient' },
                ].map((x) => (
                  <Link key={x.l} to={x.to} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-[12px] font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50">
                    {x.l} <ArrowRight size={13} className="text-brand-600" />
                  </Link>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <p className="text-[12.5px] font-bold text-slate-900">Departments reachable from emergency</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {DEPARTMENTS.map((d) => <span key={d.code} className="chip chip-sm">{d.name}</span>)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <AiDisclaimer text="AI-assisted triage estimates urgency from the information you supply and is provided for demonstration only. It is not a diagnosis. In any real medical emergency, contact your local emergency services immediately." />
        </div>
      </section>
    </>
  )
}
