import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, AlertTriangle, Ambulance, ArrowRight, Bell, CalendarDays, CheckCircle2, Clock, Download,
  Droplet, FileText, FlaskConical, Gauge, Heart, HeartPulse, Info, MapPin, Navigation, Pill, Plus,
  Printer, ScrollText, ShieldCheck, Sparkles, Stethoscope, Syringe, Trash2, TrendingUp, Upload,
  UserCircle2, Weight, X, Zap, Phone, Siren,
} from 'lucide-react'
import { PortalLayout, Panel, KpiRow } from '../../components/PortalLayout'
import {
  AiDisclaimer, Badge, Bar, Btn, Empty, Field, Img, Input, KV, Modal, Ring, Select, Table, Textarea,
  TriageDisclaimer, cn,
} from '../../components/ui'
import { AdherenceBars, BpChart, Donut, SimpleLine, SugarChart } from '../../components/charts'
import { DEPARTMENTS, DOCTORS, HEALTH_TIPS, IMG, PATIENT, VITALS } from '../../data/mock'
import { analyseMeds, emergencyPriority, healthScore, lookupDrug, triageSymptoms } from '../../lib/ai'
import { useApp } from '../../context/AppContext'
import { MyHospitalStay, RecoveryTracker, ReportExplainer, FamilyGuardian } from './PatientAdvanced'
import {
  Medications, Prescriptions, Reports, Appointments, History, Assistant, Emergency, Profile, Notifications,
} from './PatientPortalViews'

const T: Record<string, { t: string; s: string }> = {
  stay: { t: 'My Hospital Stay', s: 'Admission, ward, medication schedule and approved updates' },
  recovery: { t: 'AI Recovery Progress Tracker', s: 'Post-discharge checklist, adherence and symptoms' },
  explainer: { t: 'AI Medical Report Explainer', s: 'Verified values with plain-language explanations' },
  family: { t: 'Family Health Guardian', s: 'Invitations, consent scopes and emergency contacts' },
  dashboard: { t: `Good afternoon, ${PATIENT.name.split(' ')[0]}`, s: 'Your medication, vitals and appointments in one place.' },
  twin: { t: 'Digital Health Twin', s: 'A live model of your body built from vitals, adherence and reports.' },
  monitoring: { t: 'Health Monitoring', s: 'Log vitals and follow your trends over time.' },
  medications: { t: 'My Medications', s: 'Schedules, reminders and adherence tracking.' },
  prescriptions: { t: 'Prescriptions', s: 'Digital prescriptions issued by your clinicians.' },
  reports: { t: 'Lab Reports', s: 'Every investigation with an AI explanation of the values.' },
  appointments: { t: 'Appointments', s: 'Upcoming visits, video consultations and history.' },
  history: { t: 'Medical History', s: 'Conditions, allergies, immunisation and documents.' },
  ai: { t: 'AI Health Assistant', s: 'Medication safety, symptom guidance and report reading.' },
  emergency: { t: 'Emergency Assistance', s: 'Request urgent help and track the responding ambulance.' },
  profile: { t: 'My Profile', s: 'Personal, insurance and emergency contact details.' },
  notifications: { t: 'Notifications', s: 'Reminders, results and messages.' },
}

export default function PatientPortal() {
  const [view, setView] = useState('dashboard')
  const meta = T[view] || T.dashboard
  return (
    <PortalLayout role="patient" view={view} setView={setView} title={meta.t} sub={meta.s} searchPlaceholder="Search medicines, reports, doctors…">
      {view === 'dashboard' && <Dashboard go={setView} />}
      {view === 'stay' && <MyHospitalStay />}
      {view === 'recovery' && <RecoveryTracker />}
      {view === 'explainer' && <ReportExplainer />}
      {view === 'family' && <FamilyGuardian />}
      {view === 'twin' && <HealthTwin />}
      {view === 'monitoring' && <Monitoring />}
      {view === 'medications' && <Medications />}
      {view === 'prescriptions' && <Prescriptions />}
      {view === 'reports' && <Reports />}
      {view === 'appointments' && <Appointments />}
      {view === 'history' && <History />}
      {view === 'ai' && <Assistant />}
      {view === 'emergency' && <Emergency />}
      {view === 'profile' && <Profile />}
      {view === 'notifications' && <Notifications />}
    </PortalLayout>
  )
}

/* ------------------------------------------------------------------ shared calculations */
function useHealth() {
  const { meds, reports, vitalsLog } = useApp()
  const active = meds.filter((m) => m.status === 'Active')
  const taken = active.reduce((n, m) => n + m.adherence.taken, 0)
  const missed = active.reduce((n, m) => n + m.adherence.missed, 0)
  const adherence = taken + missed ? (taken / (taken + missed)) * 100 : 100
  const last = vitalsLog[0] || { sys: PATIENT.vitals.systolic, dia: PATIENT.vitals.diastolic, sugar: PATIENT.vitals.sugar, hr: PATIENT.vitals.hr, weight: PATIENT.vitals.weight, spo2: PATIENT.vitals.spo2 }
  const bmi = last.weight / Math.pow(PATIENT.vitals.height / 100, 2)
  const abnormal = reports.flatMap((r) => r.rows).filter((r) => !(r.high === 0 || (r.value >= r.low && r.value <= r.high))).length
  const score = healthScore({ adherence, bpSys: last.sys, bpDia: last.dia, sugar: last.sugar, bmi, hr: last.hr, spo2: last.spo2, abnormalLabs: abnormal })
  return { active, adherence, last, bmi, abnormal, score }
}

function bpTone(sys: number, dia: number) {
  if (sys >= 140 || dia >= 90) return { tone: 'red', label: 'High' }
  if (sys >= 130 || dia >= 85) return { tone: 'amber', label: 'Elevated' }
  if (sys < 90 || dia < 60) return { tone: 'amber', label: 'Low' }
  return { tone: 'green', label: 'Normal' }
}

/* ================================================================== DASHBOARD */
function Dashboard({ go }: { go: (v: string) => void }) {
  const { appts, meds, reports, notif, doseLog, logDose, toast } = useApp()
  const { active, adherence, last, score } = useHealth()
  const bp = bpTone(last.sys, last.dia)
  const next = appts.filter((a) => a.status === 'BOOKED' || a.status === 'CHECKED-IN' || a.status === 'WAITING')[0]
  const today = appts.filter((a) => a.date === '29 Sep 2026')
  const slots: ('Morning' | 'Afternoon' | 'Night')[] = ['Morning', 'Afternoon', 'Night']
  const dayKey = new Date(2026, 9, 4).toDateString()

  return (
    <div className="space-y-5">
      <KpiRow
        items={[
          { label: 'Health score', value: score.total, sub: `${score.band} · ${score.parts.length} weighted factors`, icon: Gauge, tone: 'green' },
          { label: 'Blood pressure', value: `${last.sys}/${last.dia}`, sub: `${bp.label} · mmHg · logged today`, icon: HeartPulse, tone: 'brand' },
          { label: 'Blood sugar', value: `${last.sugar}`, sub: 'mg/dL fasting · normal range', icon: Droplet, tone: 'teal' },
          { label: 'Medication status', value: `${Math.round(adherence)}%`, sub: `${active.length} active · adherence this month`, icon: Pill, tone: 'violet' },
          { label: 'Upcoming appointment', value: next ? next.time : '—', sub: next ? `${next.doctor} · ${next.dept}` : 'No appointment booked', icon: CalendarDays, tone: 'cyan' },
          { label: 'Active prescriptions', value: active.length, sub: 'Latest RX-2026-000001', icon: FileText, tone: 'amber' },
          { label: 'Emergency status', value: 'Standby', sub: 'Ambulance reachable in ~7 min', icon: Ambulance, tone: 'slate' },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          <Panel title="Today's medication schedule" sub="Tap a dose to log it — your adherence updates instantly." icon={Pill}
            right={<Link to="/ai-tools" className="btn btn-teal-soft btn-sm"><ShieldCheck size={13} /> Safety check</Link>}>
            <div className="grid gap-3 sm:grid-cols-3">
              {slots.map((slot) => (
                <div key={slot} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">{slot}</p>
                    <Clock size={13} className="text-slate-400" />
                  </div>
                  <div className="mt-3 space-y-2">
                    {meds.filter((m) => m.status === 'Active' && m.slot === slot).map((m) => {
                      const state = doseLog[`${m.id}|${slot}|${dayKey}`]
                      return (
                        <div key={m.id} className="rounded-lg bg-slate-50 p-2.5">
                          <p className="text-[12px] font-bold text-slate-800">{m.name} <span className="font-semibold text-slate-500">{m.strength}</span></p>
                          <p className="text-[11px] text-slate-500">{m.time} · {m.meal} · {m.dose}</p>
                          <div className="mt-2 flex gap-1.5">
                            <button onClick={() => { logDose(m.id, slot, 'Taken'); toast(`${m.name} marked as taken.`, 'success') }}
                              className={cn('rounded-md px-2 py-1 text-[10.5px] font-bold', state === 'Taken' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 ring-1 ring-emerald-200')}>Taken</button>
                            <button onClick={() => { logDose(m.id, slot, 'Missed'); toast(`${m.name} marked as missed.`, 'warn') }}
                              className={cn('rounded-md px-2 py-1 text-[10.5px] font-bold', state === 'Missed' ? 'bg-rose-500 text-white' : 'bg-white text-rose-700 ring-1 ring-rose-200')}>Missed</button>
                            <span className={cn('rounded-md px-2 py-1 text-[10.5px] font-bold', !state ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400')}>{state ? 'Logged' : 'Upcoming'}</span>
                          </div>
                        </div>
                      )
                    })}
                    {!meds.filter((m) => m.status === 'Active' && m.slot === slot).length && <p className="text-[11.5px] text-slate-400">No medicine scheduled.</p>}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => go('medications')} className="btn btn-ghost btn-sm mt-4">Manage all medications <ArrowRight size={13} /></button>
          </Panel>

          <Panel title="Blood pressure trend" sub="Last 7 months · systolic / diastolic" icon={TrendingUp}>
            <BpChart data={VITALS.bp} height={230} />
          </Panel>

          <div className="grid gap-5 sm:grid-cols-2">
            <Panel title="Blood glucose" sub="Fasting vs post-prandial" icon={Droplet}>
              <SugarChart data={VITALS.sugar} height={210} />
            </Panel>
            <Panel title="Weekly adherence" sub="Percentage of doses logged on time" icon={CheckCircle2}>
              <AdherenceBars data={VITALS.adherence} height={210} />
            </Panel>
          </div>
        </div>

        <div className="space-y-5">
          <Panel title="Health score breakdown" sub="How the composite is weighted" icon={Gauge}>
            <div className="grid place-items-center"><Ring value={score.total} size={168} stroke={15} label="Health Score" caption={score.band} /></div>
            <div className="mt-5 space-y-3">
              {score.parts.map((p) => (
                <div key={p.k}>
                  <div className="flex items-center justify-between"><p className="text-[11.5px] font-bold text-slate-700">{p.k}</p><p className="text-[12px] font-extrabold text-slate-900">{Math.round(p.v)}</p></div>
                  <div className="mt-1.5"><Bar value={p.v} tone={p.v >= 85 ? 'green' : p.v >= 60 ? 'teal' : 'amber'} showPct={false} height={6} /></div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Next appointment" sub="Token and room details" icon={CalendarDays}
            right={<button onClick={() => go('appointments')} className="text-[11.5px] font-bold text-brand-600">View all</button>}>
            {next ? (
              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-extrabold text-slate-900">{next.doctor}</p>
                    <p className="text-[12px] text-slate-600">{next.dept} · {next.type}</p>
                  </div>
                  <Badge tone={next.status === 'BOOKED' ? 'brand' : 'amber'}>{next.status}</Badge>
                </div>
                <div className="mt-3.5 grid grid-cols-3 gap-3">
                  {[['Date', next.date], ['Time', next.time], ['Token', next.token]].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-white p-2.5"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k}</p><p className="mt-0.5 text-[12px] font-bold text-slate-800">{v}</p></div>
                  ))}
                </div>
                <p className="mt-3 text-[11.5px] text-slate-600"><strong>Reason:</strong> {next.reason}</p>
                <div className="mt-3.5 flex flex-wrap gap-2">
                  <Link to="/appointments" className="btn btn-primary btn-sm">Reschedule</Link>
                  <Link to="/doctors" className="btn btn-ghost btn-sm">Book another</Link>
                </div>
              </div>
            ) : <Empty title="No upcoming appointment" sub="Book a consultation from the appointments page." icon={CalendarDays} />}
            <div className="mt-4 space-y-2">
              {today.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
                  <div><p className="text-[12px] font-bold text-slate-800">{a.doctor}</p><p className="text-[11px] text-slate-500">{a.time} · {a.dept}</p></div>
                  <Badge tone={a.status === 'COMPLETED' ? 'green' : 'slate'}>{a.status}</Badge>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recent alerts" sub={`${notif.filter((n) => !n.read).length} unread`} icon={Bell}
            right={<button onClick={() => go('notifications')} className="text-[11.5px] font-bold text-brand-600">Open centre</button>}>
            <div className="space-y-2.5">
              {notif.slice(0, 4).map((n) => (
                <div key={n.id} className="flex items-start gap-2.5 rounded-lg border border-slate-100 p-3">
                  <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', n.read ? 'bg-slate-300' : 'bg-brand-500')} />
                  <div><p className="text-[12px] font-semibold text-slate-800">{n.title}</p><p className="mt-0.5 text-[11px] leading-snug text-slate-500">{n.body}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{n.cat} · {n.time}</p></div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Medication safety tip" icon={Sparkles}>
            <p className="text-[12.5px] font-bold text-slate-900">{HEALTH_TIPS[0].t}</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">{HEALTH_TIPS[0].d}</p>
            <Link to="/ai-tools" className="btn btn-teal-soft btn-sm mt-3.5">Open AI medication safety</Link>
          </Panel>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== DIGITAL HEALTH TWIN */
function HealthTwin() {
  const { meds, reports, vitalsLog, toast } = useApp()
  const { active, adherence, last, bmi, abnormal, score } = useHealth()
  const [sim, setSim] = useState(false)
  const weight = VITALS.weight

  return (
    <div className="space-y-5">
      <div className="card overflow-hidden">
        <div className="relative">
          <Img src={IMG.digital} alt="Digital health model" className="h-52 w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-900/80 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-6">
            <div className="flex items-center gap-2">
              <span className="live-dot" /><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-300">Digital twin · live sync</p>
            </div>
            <h2 className="mt-2 text-[24px] font-extrabold text-white">Your body, modelled in real time</h2>
            <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-slate-300">
              {vitalsLog.length} vitals entries, {active.length} active medicines and {reports.length} reports feed this twin. Trends update as you log data.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['BP ' + last.sys + '/' + last.dia, 'Glucose ' + last.sugar + ' mg/dL', 'HR ' + last.hr + ' bpm', 'SpO₂ ' + last.spo2 + '%', 'BMI ' + bmi.toFixed(1)].map((x) => (
                <span key={x} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11.5px] font-semibold text-white backdrop-blur">{x}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr_1fr]">
        <Panel title="Cardiovascular" sub="Blood pressure & heart rate" icon={HeartPulse}>
          <Donut value={Math.max(0, Math.min(100, 100 - Math.max(0, (last.sys - 120)) * 2))} label="BP control" sub={`${last.sys}/${last.dia} mmHg`} color={last.sys >= 130 ? '#f59e0b' : '#2563eb'} />
          <div className="mt-4"><SimpleLine data={VITALS.hr} k="v" name="Heart rate" unit=" bpm" color="#e11d48" height={150} domain={[60, 90]} /></div>
        </Panel>
        <Panel title="Metabolic" sub="Glucose, weight & BMI" icon={Droplet}>
          <Donut value={score.parts[2].v} label="Glycaemic" sub={`${last.sugar} mg/dL fasting`} color="#0d9488" />
          <div className="mt-4"><SimpleLine data={weight} k="v" name="Weight" unit=" kg" color="#7c3aed" height={150} /></div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[['Weight', `${last.weight} kg`], ['Height', `${PATIENT.vitals.height} cm`], ['BMI', bmi.toFixed(1)]].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-slate-50 p-2.5 text-center"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k}</p><p className="mt-0.5 text-[13px] font-extrabold text-slate-900">{v}</p></div>
            ))}
          </div>
        </Panel>
        <Panel title="Treatment & risk" sub="Adherence and report safety" icon={ShieldCheck}>
          <Donut value={adherence} label="Adherence" sub={`${active.length} active medicines`} color="#059669" />
          <div className="mt-4 space-y-3">
            {[
              { k: 'Report safety', v: score.parts[6].v, t: abnormal ? 'amber' : 'green', s: `${abnormal} value(s) outside range` },
              { k: 'Body composition', v: score.parts[1].v, t: 'teal', s: 'BMI ' + bmi.toFixed(1) },
              { k: 'Oxygenation', v: score.parts[4].v, t: 'brand', s: 'SpO₂ ' + last.spo2 + '%' },
              { k: 'Rhythm', v: score.parts[3].v, t: 'purple', s: 'HR ' + last.hr + ' bpm' },
            ].map((x) => (
              <div key={x.k}>
                <div className="flex items-center justify-between"><p className="text-[11.5px] font-bold text-slate-700">{x.k}</p><p className="text-[12px] font-extrabold text-slate-900">{Math.round(x.v)}</p></div>
                <div className="mt-1.5"><Bar value={x.v} tone={x.t} showPct={false} height={6} /></div>
                <p className="mt-1 text-[10.5px] text-slate-500">{x.s}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Historical trend analysis" sub="Trajectory over recent months" icon={TrendingUp}
        right={
          <button onClick={() => { setSim(!sim); toast(sim ? 'Simulation cleared — showing recorded values.' : 'Simulation applied: projected care plan over 3 months (demo).', 'info') }}
            className="btn btn-teal-soft btn-sm">{sim ? 'Show recorded' : 'Simulate care plan'}</button>
        }>
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400">Composite health score</p>
            <SimpleLine data={sim ? VITALS.score.map((x, i) => ({ ...x, v: Math.min(96, x.v + 2 + i * 2) })) : VITALS.score} k="v" name="Health score" color="#059669" height={210} domain={[50, 100]} />
          </div>
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400">Weight trajectory</p>
            <SimpleLine data={weight} k="v" name="Weight" unit=" kg" color="#7c3aed" height={210} />
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            { l: 'Trend direction', v: score.total >= 80 ? 'Improving' : 'Needs attention' },
            { l: 'Data points', v: `${vitalsLog.length + VITALS.bp.length} readings` },
            { l: 'Last sync', v: vitalsLog[0]?.date || '29 Sep 2026' },
            { l: 'Twin confidence', v: `${Math.min(96, 62 + vitalsLog.length * 4)}%` },
          ].map((x) => (
            <div key={x.l} className="rounded-xl border border-slate-200 p-3.5"><p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{x.l}</p><p className="mt-1 text-[13px] font-bold text-slate-900">{x.v}</p></div>
          ))}
        </div>
      </Panel>

      <AiDisclaimer text="The Digital Health Twin is a visual model built from demo data. It illustrates how connected health data can be presented; it is not a diagnostic device and does not replace professional medical assessment." />
    </div>
  )
}

/* ================================================================== MONITORING */
function Monitoring() {
  const { vitalsLog, addVitals, toast } = useApp()
  const { last, bmi, score } = useHealth()
  const [form, setForm] = useState({ sys: '', dia: '', sugar: '', hr: '', weight: '', spo2: '', temp: '' })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.sys || !form.dia) { toast('Systolic and diastolic values are required.', 'error'); return }
    addVitals({
      id: 'V-' + Date.now(),
      date: new Date(2026, 9, 4).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      sys: Number(form.sys), dia: Number(form.dia),
      sugar: Number(form.sugar) || last.sugar, hr: Number(form.hr) || last.hr,
      weight: Number(form.weight) || last.weight, spo2: Number(form.spo2) || last.spo2,
      temp: Number(form.temp) || 98.4,
    })
    toast('Vitals logged to your record and reflected in the health twin.', 'success')
    setForm({ sys: '', dia: '', sugar: '', hr: '', weight: '', spo2: '', temp: '' })
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { l: 'Blood pressure', v: `${last.sys}/${last.dia}`, u: 'mmHg', i: HeartPulse, tone: 'brand', s: bpTone(last.sys, last.dia).label },
          { l: 'Blood glucose', v: `${last.sugar}`, u: 'mg/dL', i: Droplet, tone: 'teal', s: 'Fasting' },
          { l: 'Heart rate', v: `${last.hr}`, u: 'bpm', i: Activity, tone: 'red', s: last.hr > 90 ? 'Above normal' : 'Within normal' },
          { l: 'SpO₂', v: `${last.spo2}`, u: '%', i: Activity, tone: 'green', s: last.spo2 >= 97 ? 'Normal' : 'Monitor' },
        ].map((x) => (
          <div key={x.l} className="card card-hover p-4">
            <div className="flex items-start justify-between"><p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">{x.l}</p><span className={cn('grid h-8 w-8 place-items-center rounded-lg', `bg-${x.tone}-50 text-${x.tone}-600`)}><x.i size={15} /></span></div>
            <p className="mt-2 text-[26px] font-extrabold leading-none tabular-nums text-slate-900">{x.v} <span className="text-[12px] font-semibold text-slate-500">{x.u}</span></p>
            <p className="mt-1.5 text-[11px] text-slate-500">{x.s}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="Log a new reading" sub="Values appear immediately in the twin and charts." icon={Plus}>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Systolic (mmHg)" required><Input value={form.sys} onChange={(e: any) => set('sys', e.target.value)} placeholder="118" /></Field>
              <Field label="Diastolic (mmHg)" required><Input value={form.dia} onChange={(e: any) => set('dia', e.target.value)} placeholder="76" /></Field>
              <Field label="Blood glucose (mg/dL)"><Input value={form.sugar} onChange={(e: any) => set('sugar', e.target.value)} placeholder="96" /></Field>
              <Field label="Heart rate (bpm)"><Input value={form.hr} onChange={(e: any) => set('hr', e.target.value)} placeholder="74" /></Field>
              <Field label="Weight (kg)"><Input value={form.weight} onChange={(e: any) => set('weight', e.target.value)} placeholder="47" /></Field>
              <Field label="SpO₂ (%)"><Input value={form.spo2} onChange={(e: any) => set('spo2', e.target.value)} placeholder="98" /></Field>
            </div>
            <Field label="Temperature (°F)"><Input value={form.temp} onChange={(e: any) => set('temp', e.target.value)} placeholder="98.4" /></Field>
            <button className="btn btn-primary w-full" type="submit"><Plus size={14} /> Save reading</button>
          </form>
        </Panel>

        <div className="space-y-5">
          <Panel title="Trend charts" sub="Recorded history" icon={TrendingUp}>
            <div className="space-y-5">
              <div><p className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400">Blood pressure · 7 months</p><BpChart data={VITALS.bp} height={200} /></div>
              <div><p className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400">Blood glucose · fasting / post-prandial</p><SugarChart data={VITALS.sugar} height={190} /></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div><p className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400">Heart rate</p><SimpleLine data={VITALS.hr} k="v" name="HR" unit=" bpm" color="#e11d48" height={160} domain={[60, 90]} /></div>
                <div><p className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400">Weight</p><SimpleLine data={VITALS.weight} k="v" name="Weight" unit=" kg" color="#7c3aed" height={160} /></div>
              </div>
              <div><p className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400">Health score</p><SimpleLine data={VITALS.score} k="v" name="Score" color="#059669" height={160} domain={[50, 100]} /></div>
            </div>
          </Panel>

          <Panel title="Recent readings" sub={`${vitalsLog.length} entries stored locally`} icon={ScrollText}>
            <Table head={['Date', 'BP', 'Glucose', 'HR', 'Weight', 'SpO₂', 'Temp']}>
              {vitalsLog.map((v) => (
                <tr key={v.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2.5 text-[12px] font-semibold text-slate-700">{v.date}</td>
                  <td className="px-4 py-2.5 text-[12px] tabular-nums text-slate-700">{v.sys}/{v.dia}</td>
                  <td className="px-4 py-2.5 text-[12px] tabular-nums text-slate-700">{v.sugar}</td>
                  <td className="px-4 py-2.5 text-[12px] tabular-nums text-slate-700">{v.hr}</td>
                  <td className="px-4 py-2.5 text-[12px] tabular-nums text-slate-700">{v.weight}</td>
                  <td className="px-4 py-2.5 text-[12px] tabular-nums text-slate-700">{v.spo2}</td>
                  <td className="px-4 py-2.5 text-[12px] tabular-nums text-slate-700">{v.temp}</td>
                </tr>
              ))}
            </Table>
          </Panel>
        </div>
      </div>

      <Panel title="Lifestyle tracking" sub="Daily activity logged by the patient app" icon={Activity}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: 'Steps', d: VITALS.daily.map((x) => ({ d: x.d, v: x.steps })), c: '#2563eb', u: '' },
            { l: 'Sleep', d: VITALS.daily.map((x) => ({ d: x.d, v: x.sleep })), c: '#7c3aed', u: ' h' },
            { l: 'Water', d: VITALS.daily.map((x) => ({ d: x.d, v: x.water })), c: '#0ea5e9', u: ' L' },
            { l: 'Energy intake', d: VITALS.daily.map((x) => ({ d: x.d, v: x.kcal })), c: '#f59e0b', u: ' kcal' },
          ].map((x) => (
            <div key={x.l} className="rounded-xl border border-slate-200 p-3.5">
              <p className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400">{x.l}</p>
              <div className="mt-2"><SimpleLine data={x.d} k="v" name={x.l} unit={x.u} color={x.c} height={140} /></div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
