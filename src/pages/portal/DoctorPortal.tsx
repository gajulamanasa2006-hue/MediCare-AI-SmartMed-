import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, AlertTriangle, Bell, BellRing, CalendarDays, CheckCircle2, ClipboardList, Clock, Download,
  FileText, FlaskConical, Gauge, HeartPulse, ListOrdered, Microscope, Pill, Plus, Printer, ScrollText,
  Search, Settings, ShieldCheck, Stethoscope, Trash2, TrendingUp, User, Users, X, Zap,
} from 'lucide-react'
import { PortalLayout, Panel, KpiRow } from '../../components/PortalLayout'
import {
  AiDisclaimer, Badge, Bar, Btn, Empty, Field, Img, Input, KV, Modal, Ring, Select, Table, Textarea, cn,
} from '../../components/ui'
import { BpChart, Donut, OpsTrend, SimpleLine } from '../../components/charts'
import { DEPARTMENTS, DOCTORS, IMG, LAB_REQUESTS, PATIENT, STAFF, VITALS, type Consultation } from '../../data/mock'
import { analyseMeds, healthScore } from '../../lib/ai'
import { useApp } from '../../context/AppContext'
import { ClinicalIntelligence } from './ClinicalIntelligence'

const T: Record<string, { t: string; s: string }> = {
  clinical: { t: 'ICU Risk Dashboard', s: 'Explainable monitoring alerts · shared clinical timeline' },
  dashboard: { t: 'Good afternoon, Dr. Sharma', s: 'Tuesday, 04 October 2026 · General Medicine · OPD-02' },
  appointments: { t: "Today's Appointments", s: 'Accept, check in and complete consultations.' },
  queue: { t: 'Patient Queue', s: 'Live tokens and waiting times.' },
  patients: { t: 'My Patients', s: 'Patients linked to your appointments and consultations.' },
  consultations: { t: 'Consultations', s: 'Clinical notes, diagnosis and treatment plans.' },
  prescriptions: { t: 'Prescriptions', s: 'Issue and review digital prescriptions.' },
  lab: { t: 'Lab Reports & Requests', s: 'Results, trends and test recommendations.' },
  followups: { t: 'Follow-ups', s: 'Scheduled reviews and outstanding actions.' },
  schedule: { t: 'My Schedule', s: 'Week at a glance.' },
  availability: { t: 'Manage Availability', s: 'Set your working hours and appointment slots.' },
}

export default function DoctorPortal() {
  const [view, setView] = useState('dashboard')
  const meta = T[view] || T.dashboard
  return (
    <PortalLayout role="doctor" view={view} setView={setView} title={meta.t} sub={meta.s} searchPlaceholder="Search patients by name, ID or mobile…">
      {view === 'dashboard' && <Dashboard go={setView} />}
      {view === 'clinical' && <ClinicalIntelligence />}
      {view === 'appointments' && <Appointments />}
      {view === 'queue' && <QueueView />}
      {view === 'patients' && <Patients />}
      {view === 'consultations' && <Consultations />}
      {view === 'prescriptions' && <Prescriptions />}
      {view === 'lab' && <Lab />}
      {view === 'followups' && <Followups />}
      {view === 'schedule' && <Schedule />}
      {view === 'availability' && <Availability />}
    </PortalLayout>
  )
}

/* ================================================================== DASHBOARD */
function Dashboard({ go }: { go: (v: string) => void }) {
  const { appts, reports, queue, consultations } = useApp()
  const today = appts.filter((a) => a.date === '29 Sep 2026' || a.date === '04 Oct 2026')
  const pending = reports.filter((r) => r.status !== 'Verified')
  const done = appts.filter((a) => a.status === 'COMPLETED').length

  return (
    <div className="space-y-5">
      <KpiRow
        items={[
          { label: "Today's appointments", value: today.length, sub: '2 in-person · 1 video', icon: CalendarDays, tone: 'brand' },
          { label: 'Patients waiting', value: queue.length, sub: `${queue[0]?.patient || '—'} next · ${queue[0]?.waited || ''}`, icon: ListOrdered, tone: 'amber' },
          { label: 'Completed', value: done, sub: 'Avg consult 14 min', icon: CheckCircle2, tone: 'green' },
          { label: 'Pending lab reports', value: pending.length, sub: 'Awaiting verification', icon: FlaskConical, tone: 'cyan' },
          { label: 'Consultations saved', value: consultations.length, sub: 'Latest CNS-2026-000001', icon: Stethoscope, tone: 'purple' },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Panel title="Today's schedule" sub="29–30 September 2026" icon={CalendarDays}
            right={<button onClick={() => go('appointments')} className="btn btn-ghost btn-sm">Open full list</button>}>
            <Table head={['Time', 'Patient', 'Type', 'Status', 'Token', 'Action']}>
              {today.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-[12.5px] font-bold tabular-nums text-slate-800">{a.time}</td>
                  <td className="px-4 py-3"><p className="text-[12.5px] font-semibold text-slate-800">{a.patient}</p><p className="text-[11px] text-slate-500">{a.reason}</p></td>
                  <td className="px-4 py-3 text-[11.5px] text-slate-600">{a.type}</td>
                  <td className="px-4 py-3"><Badge tone={a.status === 'COMPLETED' ? 'green' : a.status === 'WAITING' ? 'amber' : 'brand'}>{a.status}</Badge></td>
                  <td className="px-4 py-3 text-[11.5px] font-bold text-slate-700">{a.token}</td>
                  <td className="px-4 py-3"><button onClick={() => go('consultations')} className="btn btn-soft btn-sm">Open</button></td>
                </tr>
              ))}
            </Table>
          </Panel>

          <Panel title="Appointments this week" sub="OPD vs emergency volume" icon={TrendingUp}>
            <OpsTrend data={VITALS.adherence.map((x, i) => ({ d: VITALS.daily[i].d, opd: 30 + x.v, emg: 3 + i }))} height={230} />
          </Panel>

          <Panel title="Pending lab reports" sub="Verify or act on these results" icon={FlaskConical}>
            <Table head={['Report', 'Panel', 'Patient', 'Date', 'Status', 'Action']}>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-[12px] font-bold text-slate-800">{r.id}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">{r.panel}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">{PATIENT.name}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">{r.date}</td>
                  <td className="px-4 py-3"><Badge tone={r.status === 'Verified' ? 'green' : r.status === 'Processing' ? 'amber' : 'slate'}>{r.status}</Badge></td>
                  <td className="px-4 py-3"><button onClick={() => go('lab')} className="btn btn-ghost btn-sm">Review</button></td>
                </tr>
              ))}
            </Table>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Live queue" sub={`${queue.length} waiting`} icon={ListOrdered}
            right={<button onClick={() => go('queue')} className="text-[11.5px] font-bold text-brand-600">Manage</button>}>
            <div className="space-y-2.5">
              {queue.map((q, i) => (
                <div key={q.token} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                  <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[12px] font-extrabold', i === 0 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600')}>{q.token}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-[12.5px] font-bold text-slate-800">{q.patient}</p><p className="text-[11px] text-slate-500">{q.dept} · waited {q.waited}</p></div>
                  <Badge tone={q.priority === 'Urgent' ? 'amber' : 'slate'}>{q.priority}</Badge>
                </div>
              ))}
              {!queue.length && <Empty title="Queue is clear" sub="No patients waiting right now." icon={CheckCircle2} />}
            </div>
          </Panel>

          <Panel title="Clinical decision support" sub="Medication safety screening on your active patient" icon={ShieldCheck}>
            <MedSafetyMini />
          </Panel>

          <Panel title="Quick actions" icon={Zap}>
            <div className="grid gap-2.5">
              {[
                { t: 'Start consultation', d: 'Record notes, vitals and diagnosis.', go: 'consultations' },
                { t: 'Issue prescription', d: 'Create RX with safety screening.', go: 'prescriptions' },
                { t: 'Recommend a test', d: 'Blood, urine, X-ray, CT or MRI.', go: 'lab' },
                { t: 'Schedule follow-up', d: 'Book the next review.', go: 'followups' },
              ].map((x) => (
                <button key={x.t} onClick={() => go(x.go)} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40">
                  <div><p className="text-[12.5px] font-bold text-slate-900">{x.t}</p><p className="text-[11px] text-slate-500">{x.d}</p></div>
                  <Plus size={14} className="text-brand-600" />
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function MedSafetyMini() {
  const { meds } = useApp()
  const active = meds.filter((m) => m.status === 'Active')
  const res = analyseMeds({ meds: active.map((m) => m.name), allergies: PATIENT.allergies.map((a) => a.name), conditions: PATIENT.history.join(', ') })
  return (
    <div>
      <div className={cn('rounded-xl p-4', res.level === 'High' ? 'bg-rose-50' : res.level === 'Moderate' ? 'bg-amber-50' : 'bg-emerald-50')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={cn('grid h-9 w-9 place-items-center rounded-lg text-white', res.level === 'High' ? 'bg-rose-500' : res.level === 'Moderate' ? 'bg-amber-500' : 'bg-emerald-500')}><ShieldCheck size={17} /></span>
            <div><p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Screening risk</p><p className="text-[14px] font-extrabold text-slate-900">{res.level}</p></div>
          </div>
          <p className="text-[22px] font-extrabold text-slate-900">{res.riskScore}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {res.summary.slice(0, 3).map((s) => <p key={s} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-slate-600"><AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-500" /> {s}</p>)}
      </div>
      <button onClick={() => window.location.assign('#/ai-tools')} className="btn btn-teal-soft btn-sm mt-3.5">Full safety analysis</button>
    </div>
  )
}

/* ================================================================== APPOINTMENTS */
function Appointments() {
  const { appts, updateAppt, toast, pushNotif } = useApp()
  const [tab, setTab] = useState('all')
  const list = appts.filter((a) => (tab === 'all' ? true : tab === 'today' ? a.date === '29 Sep 2026' : a.status === tab.toUpperCase().replace('-', '-')))

  const advance = (id: string, status: any) => {
    updateAppt(id, { status })
    toast(`Appointment marked ${status}.`, status === 'CANCELLED' ? 'warn' : 'success')
    pushNotif({ cat: 'Appointment', title: `Appointment ${status.toLowerCase()}`, body: `Appointment ${id} is now ${status}.`, tone: status === 'CANCELLED' ? 'red' : 'blue' })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {[['all', 'All'], ['today', 'Today'], ['booked', 'Booked'], ['checked-in', 'Checked in'], ['waiting', 'Waiting'], ['completed', 'Completed']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={cn('chip', tab === id && 'chip-active')}>{label}</button>
        ))}
      </div>

      <Panel title="Appointment schedule" sub={`${list.length} record(s)`} icon={CalendarDays}>
        <Table head={['ID', 'Date · Time', 'Patient', 'Doctor', 'Type', 'Priority', 'Status', 'Action']}>
          {list.map((a) => (
            <tr key={a.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 text-[11.5px] font-bold text-slate-700">{a.id}</td>
              <td className="px-4 py-3"><p className="text-[12px] font-semibold text-slate-800">{a.date}</p><p className="text-[11px] tabular-nums text-slate-500">{a.time}</p></td>
              <td className="px-4 py-3"><p className="text-[12px] font-semibold text-slate-800">{a.patient}</p><p className="text-[11px] text-slate-500">{a.patientId}</p></td>
              <td className="px-4 py-3 text-[12px] text-slate-600">{a.doctor}</td>
              <td className="px-4 py-3 text-[11.5px] text-slate-600">{a.type}</td>
              <td className="px-4 py-3"><Badge tone={a.priority === 'Critical' ? 'red' : a.priority === 'Urgent' ? 'amber' : 'slate'}>{a.priority}</Badge></td>
              <td className="px-4 py-3"><Badge tone={a.status === 'COMPLETED' ? 'green' : a.status === 'CANCELLED' ? 'red' : a.status === 'WAITING' ? 'amber' : 'brand'}>{a.status}</Badge></td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {a.status === 'BOOKED' && <button onClick={() => advance(a.id, 'CHECKED-IN')} className="btn btn-soft btn-sm">Check in</button>}
                  {a.status === 'CHECKED-IN' && <button onClick={() => advance(a.id, 'WAITING')} className="btn btn-soft btn-sm">Add to queue</button>}
                  {(a.status === 'WAITING' || a.status === 'CHECKED-IN') && <button onClick={() => advance(a.id, 'COMPLETED')} className="btn btn-green btn-sm">Complete</button>}
                  {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && <button onClick={() => advance(a.id, 'CANCELLED')} className="btn btn-danger-soft btn-sm">Cancel</button>}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <AiDisclaimer text="Appointment actions are recorded in the audit log in a live deployment. This demo persists changes in your browser so every flow stays usable." />
    </div>
  )
}

function QueueView() {
  const { queue, setQueueStatus, toast } = useApp()
  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <Panel title="Live queue" sub="Call the next patient into the consultation room" icon={ListOrdered}>
        <div className="space-y-3">
          {queue.map((q, i) => (
            <div key={q.token} className="flex items-center gap-4 rounded-xl border border-slate-200 p-4">
              <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[13px] font-extrabold', i === 0 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600')}>{q.token}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-slate-900">{q.patient}</p>
                <p className="text-[11.5px] text-slate-500">{q.dept} · {q.doctor} · waited {q.waited}</p>
              </div>
              <Badge tone={q.priority === 'Urgent' ? 'amber' : 'slate'}>{q.priority}</Badge>
              <button onClick={() => { setQueueStatus(q.token, 'Completed'); toast(`${q.patient} marked completed.`, 'success') }} className="btn btn-green btn-sm">Mark done</button>
            </div>
          ))}
          {!queue.length && <Empty title="Queue is clear" sub="No patients are currently waiting." icon={CheckCircle2} />}
        </div>
      </Panel>
      <Panel title="Consultation room status" icon={Stethoscope}>
        <div className="space-y-3">
          {[
            { r: 'OPD-02 · General Medicine', s: 'In use', who: 'Dr. Rajesh Sharma' },
            { r: 'Wing A-204 · Orthopedics', s: 'Available', who: 'Dr. Aryan Mehta' },
            { r: 'Cath Lab-1 · Cardiology', s: 'In procedure', who: 'Dr. Imran Qureshi' },
            { r: 'Wing D-301 · Neurology', s: 'Available', who: 'Dr. Vikram Desai' },
            { r: 'ER-01 · Emergency', s: 'Active — critical case', who: 'Dr. Meera Iyer' },
          ].map((x) => (
            <div key={x.r} className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5">
              <div><p className="text-[12.5px] font-bold text-slate-800">{x.r}</p><p className="text-[11px] text-slate-500">{x.who}</p></div>
              <Badge tone={x.s === 'Available' ? 'green' : x.s.includes('critical') ? 'red' : 'amber'}>{x.s}</Badge>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

/* ================================================================== PATIENTS */
function Patients() {
  const { appts, consultations, reports, meds, docs } = useApp()
  const [sel, setSel] = useState<string | null>(null)
  const [tab, setTab] = useState('info')
  const roster = [
    { id: PATIENT.id, name: PATIENT.name, age: `${PATIENT.age}y / ${PATIENT.gender}`, mobile: PATIENT.mobile, blood: PATIENT.blood, dept: 'General Medicine', flag: true },
    { id: 'SMN-2026-000002', name: 'Ananya Sharma', age: '34y / Female', mobile: '+91 99999 00002', blood: 'B+', dept: 'Cardiology', flag: false },
    { id: 'SMN-2026-000003', name: 'Rahul Verma', age: '7y / Male', mobile: '+91 99999 00003', blood: 'A+', dept: 'Pediatrics', flag: false },
    { id: 'SMN-2026-000004', name: 'Imran Baig', age: '52y / Male', mobile: '+91 99999 00004', blood: 'AB+', dept: 'General Medicine', flag: false },
  ]

  if (sel) {
    const p = roster.find((r) => r.id === sel)!
    return (
      <div className="space-y-5">
        <button onClick={() => setSel(null)} className="btn btn-ghost btn-sm"><X size={13} /> Back to patient list</button>

        <div className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl grad-brand text-[18px] font-extrabold text-white">{p.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
              <div>
                <h2 className="text-[19px] font-extrabold text-slate-900">{p.name}</h2>
                <p className="mt-0.5 text-[12.5px] text-slate-500">{p.id} · {p.age} · {p.blood} · {p.mobile}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="teal">{p.dept}</Badge>
                  {p.flag && <Badge tone="amber">Documented allergies</Badge>}
                  <Badge tone="brand">Out-Patient</Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => window.location.assign('#/portal/doctor/')} className="btn btn-primary btn-sm"><Stethoscope size={13} /> New consultation</button>
              <button className="btn btn-soft btn-sm"><FileText size={13} /> Issue prescription</button>
              <button className="btn btn-ghost btn-sm"><Printer size={13} /> Print record</button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[['info', 'Patient info'], ['allergies', 'Allergies & history'], ['consults', 'Consultations'], ['rx', 'Prescriptions'], ['lab', 'Lab requests'], ['appt', 'Appointment history'], ['meds', 'Current medications'], ['docs', 'Documents']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={cn('chip', tab === id && 'chip-active')}>{label}</button>
          ))}
        </div>

        {tab === 'info' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Demographics" icon={User}><KV items={[
              { k: 'Patient ID', v: p.id }, { k: 'Name', v: p.name }, { k: 'Age / Sex', v: p.age },
              { k: 'Blood group', v: p.blood }, { k: 'Mobile', v: p.mobile }, { k: 'Email', v: PATIENT.email },
              { k: 'Address', v: PATIENT.address }, { k: 'Preferred language', v: PATIENT.lang },
            ]} /></Panel>
            <Panel title="Critical vitals baseline" icon={HeartPulse}>
              <div className="grid grid-cols-3 gap-3">
                {[['Height', `${PATIENT.vitals.height} cm`], ['Weight', `${PATIENT.vitals.weight} kg`], ['BMI', `${PATIENT.vitals.bmi}`],
                  ['BP', `${PATIENT.vitals.systolic}/${PATIENT.vitals.diastolic}`], ['Glucose', `${PATIENT.vitals.sugar} mg/dL`], ['HR', `${PATIENT.vitals.hr} bpm`]].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-slate-200 p-3 text-center"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k}</p><p className="mt-1 text-[13.5px] font-extrabold text-slate-900">{v}</p></div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Insurance</p>
                <p className="mt-1 text-[12.5px] font-semibold text-slate-800">{PATIENT.insurance} · {PATIENT.policy}</p>
              </div>
            </Panel>
          </div>
        )}

        {tab === 'allergies' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Known allergies" sub="Blocking alerts on prescribing" icon={AlertTriangle}>
              <div className="space-y-2.5">
                {PATIENT.allergies.map((a) => (
                  <div key={a.name} className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/60 p-3.5">
                    <p className="text-[12.5px] font-bold text-rose-900">{a.name}</p>
                    <Badge tone={a.severity === 'Severe' ? 'red' : 'amber'}>{a.severity}</Badge>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Medical history & immunisation" icon={ScrollText}>
              <div className="space-y-2">
                {PATIENT.history.map((h) => <p key={h} className="rounded-lg bg-slate-50 px-3.5 py-2.5 text-[12.5px] text-slate-700">{h}</p>)}
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">{PATIENT.vaccines.map((v) => <Badge key={v} tone="green">{v}</Badge>)}</div>
            </Panel>
          </div>
        )}

        {tab === 'consults' && (
          <Panel title="Consultations" icon={Stethoscope}
            right={<button className="btn btn-primary btn-sm"><Plus size={13} /> New</button>}>
            {consultations.length ? (
              <div className="space-y-3">
                {consultations.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13px] font-bold text-slate-900">{c.id} · {c.date}</p>
                      <Badge tone={c.status === 'Completed' ? 'green' : 'amber'}>{c.status}</Badge>
                    </div>
                    <p className="mt-2 text-[12px] text-slate-600"><strong>Complaint:</strong> {c.complaint}</p>
                    <p className="mt-1 text-[12px] text-slate-600"><strong>Diagnosis:</strong> {c.diagnosis}</p>
                    <p className="mt-1 text-[12px] text-slate-600"><strong>Plan:</strong> {c.plan}</p>
                  </div>
                ))}
              </div>
            ) : <Empty title="No consultations yet" sub="Start a consultation to record clinical notes." icon={Stethoscope} />}
          </Panel>
        )}

        {tab === 'rx' && (
          <Panel title="Prescriptions" icon={FileText}>
            {consultations.filter((c) => c.prescription).map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 p-4">
                <p className="text-[13px] font-bold text-slate-900">{c.prescription!.id} · {c.date}</p>
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                  <Table head={['Medicine', 'Dose', 'Frequency', 'Duration', 'Meal']}>
                    {c.prescription!.items.map((i) => (
                      <tr key={i.name} className="border-b border-slate-100 last:border-0">
                        <td className="px-3.5 py-2.5 text-[12px] font-semibold text-slate-800">{i.name}</td>
                        <td className="px-3.5 py-2.5 text-[12px] text-slate-600">{i.dose}</td>
                        <td className="px-3.5 py-2.5 text-[12px] text-slate-600">{i.freq}</td>
                        <td className="px-3.5 py-2.5 text-[12px] text-slate-600">{i.duration}</td>
                        <td className="px-3.5 py-2.5 text-[12px] text-slate-600">{i.meal}</td>
                      </tr>
                    ))}
                  </Table>
                </div>
              </div>
            ))}
            {!consultations.some((c) => c.prescription) && <Empty title="No prescriptions issued" sub="Create one from the prescriptions page." icon={FileText} />}
          </Panel>
        )}

        {tab === 'lab' && (
          <Panel title="Lab requests & reports" icon={FlaskConical}>
            <Table head={['Request', 'Panel', 'Type', 'Requested', 'Status', 'Priority']}>
              {LAB_REQUESTS.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-[12px] font-bold text-slate-700">{r.id}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">{r.panel}</td>
                  <td className="px-4 py-3 text-[11.5px] text-slate-600">{r.type}</td>
                  <td className="px-4 py-3 text-[11.5px] text-slate-600">{r.requested}</td>
                  <td className="px-4 py-3"><Badge tone={r.status === 'Verified' ? 'green' : r.status === 'Processing' ? 'amber' : 'slate'}>{r.status}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={r.priority === 'Critical' ? 'red' : r.priority === 'Urgent' ? 'amber' : 'slate'}>{r.priority}</Badge></td>
                </tr>
              ))}
            </Table>
          </Panel>
        )}

        {tab === 'appt' && (
          <Panel title="Appointment history" icon={CalendarDays}>
            <Table head={['ID', 'Date', 'Time', 'Doctor', 'Type', 'Status', 'Token']}>
              {appts.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-[11.5px] font-bold text-slate-700">{a.id}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">{a.date}</td>
                  <td className="px-4 py-3 text-[12px] tabular-nums text-slate-600">{a.time}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">{a.doctor}</td>
                  <td className="px-4 py-3 text-[11.5px] text-slate-600">{a.type}</td>
                  <td className="px-4 py-3"><Badge tone={a.status === 'COMPLETED' ? 'green' : a.status === 'CANCELLED' ? 'red' : 'brand'}>{a.status}</Badge></td>
                  <td className="px-4 py-3 text-[11.5px] font-bold text-slate-700">{a.token}</td>
                </tr>
              ))}
            </Table>
          </Panel>
        )}

        {tab === 'meds' && (
          <Panel title="Current medications" icon={Pill}>
            <Table head={['Medicine', 'Strength', 'Frequency', 'Meal', 'Purpose', 'Status']}>
              {meds.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-[12px] font-bold text-slate-800">{m.name}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">{m.strength}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">{m.freq}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">{m.meal}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">{m.purpose}</td>
                  <td className="px-4 py-3"><Badge tone={m.status === 'Active' ? 'green' : m.status === 'Stopped' ? 'red' : 'slate'}>{m.status}</Badge></td>
                </tr>
              ))}
            </Table>
          </Panel>
        )}

        {tab === 'docs' && (
          <Panel title="Medical documents" icon={FileText}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {docs.map((d) => (
                <div key={d.id} className="rounded-xl border border-slate-200 p-4">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600"><FileText size={16} /></span>
                  <p className="mt-2.5 text-[12.5px] font-bold text-slate-900">{d.title}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{d.kind} · {d.date} · {d.by}</p>
                  <button className="btn btn-ghost btn-sm mt-3"><Download size={12} /> Download</button>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    )
  }

  return (
    <Panel title="Patients" sub={`${roster.length} patients linked to your practice`} icon={Users}
      right={<div className="flex gap-2"><button className="btn btn-ghost btn-sm"><Search size={13} /> Search</button><button className="btn btn-primary btn-sm"><Plus size={13} /> Add patient</button></div>}>
      <Table head={['Patient ID', 'Name', 'Age / Sex', 'Contact', 'Blood group', 'Department', 'Action']}>
        {roster.map((p) => (
          <tr key={p.id} className="border-b border-slate-100 last:border-0">
            <td className="px-4 py-3 text-[11.5px] font-bold text-slate-700">{p.id}</td>
            <td className="px-4 py-3 text-[12.5px] font-semibold text-slate-800">{p.name}</td>
            <td className="px-4 py-3 text-[12px] text-slate-600">{p.age}</td>
            <td className="px-4 py-3 text-[12px] text-slate-600">{p.mobile}</td>
            <td className="px-4 py-3 text-[12px] font-bold text-rose-600">{p.blood}</td>
            <td className="px-4 py-3 text-[12px] text-slate-600">{p.dept}</td>
            <td className="px-4 py-3"><button onClick={() => { setSel(p.id); setTab('info') }} className="btn btn-soft btn-sm">View record</button></td>
          </tr>
        ))}
      </Table>
    </Panel>
  )
}

/* ================================================================== CONSULTATIONS */
function Consultations() {
  const { consultations, addConsultation, meds, toast, pushNotif } = useApp()
  const [form, setForm] = useState({ complaint: 'Fever with chills and body ache for 2 days', diagnosis: 'Acute viral febrile illness (suspected)', plan: 'Antipyretic with proton-pump cover, oral hydration, review in 72 hours', notes: 'Advised tepid sponging and ORS. NSAIDs avoided due to documented allergy.', sys: '118', dia: '76', temp: '100.6', pulse: '92', spo2: '98' })
  const [saved, setSaved] = useState<Consultation | null>(null)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const safety = analyseMeds({ meds: meds.filter((m) => m.status === 'Active').map((m) => m.name), allergies: PATIENT.allergies.map((a) => a.name), conditions: PATIENT.history.join(', ') })

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const c: Consultation = {
      id: 'CNS-2026-' + String(consultations.length + 2).padStart(6, '0'),
      patient: PATIENT.name, patientId: PATIENT.id, doctor: 'Dr. Rajesh Sharma', date: new Date(2026, 9, 4).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      complaint: form.complaint, diagnosis: form.diagnosis, plan: form.plan, notes: form.notes,
      vitals: { sys: Number(form.sys), dia: Number(form.dia), temp: Number(form.temp), pulse: Number(form.pulse), spo2: Number(form.spo2) },
      status: 'Completed',
    }
    addConsultation(c)
    setSaved(c)
    pushNotif({ cat: 'Follow-up', title: 'Consultation completed', body: `${c.id} saved for ${c.patient}. Duration recorded.`, tone: 'teal' })
    toast('Consultation saved to the patient record.', 'success')
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <div className="space-y-5">
        <Panel title="Record consultation" sub={`${PATIENT.name} · ${PATIENT.id} · consultation room OPD-02`} icon={Stethoscope}
          right={<Badge tone="brand">Draft · auto-saved</Badge>}>
          <form onSubmit={save} className="space-y-4">
            <Field label="Chief complaint" required><Textarea rows={2} value={form.complaint} onChange={(e: any) => set('complaint', e.target.value)} /></Field>
            <Field label="Diagnosis" required><Textarea rows={2} value={form.diagnosis} onChange={(e: any) => set('diagnosis', e.target.value)} /></Field>
            <Field label="Treatment plan" required><Textarea rows={2} value={form.plan} onChange={(e: any) => set('plan', e.target.value)} /></Field>
            <Field label="Clinical notes (internal)"><Textarea rows={2} value={form.notes} onChange={(e: any) => set('notes', e.target.value)} /></Field>

            <div>
              <p className="mb-2.5 text-[12px] font-bold text-slate-700">Vital signs</p>
              <div className="grid gap-3 sm:grid-cols-5">
                {[['sys', 'Systolic'], ['dia', 'Diastolic'], ['temp', 'Temp °F'], ['pulse', 'Pulse'], ['spo2', 'SpO₂ %']].map(([k, l]) => (
                  <Field key={k} label={l}><Input value={(form as any)[k]} onChange={(e: any) => set(k, e.target.value)} /></Field>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button type="submit" className="btn btn-primary"><CheckCircle2 size={14} /> Save consultation</button>
              <button type="button" className="btn btn-ghost">Save as draft</button>
              <Link to="/portal/doctor" className="btn btn-ghost" onClick={(e) => e.preventDefault()}>Cancel</Link>
            </div>
          </form>

          <div className="mt-5">
            <div className={cn('rounded-xl p-4', safety.level === 'High' ? 'bg-rose-50' : safety.level === 'Moderate' ? 'bg-amber-50' : 'bg-emerald-50')}>
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={16} className={safety.level === 'High' ? 'text-rose-600' : 'text-emerald-600'} />
                <p className="text-[12.5px] font-bold text-slate-900">Medication safety screening — {safety.level} risk ({safety.riskScore})</p>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-700">{safety.summary[0]}</p>
            </div>
          </div>
        </Panel>

        {saved && (
          <Panel title="Consultation saved" sub={saved.id} icon={CheckCircle2}>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <p className="text-[12.5px] font-bold text-emerald-900">{saved.id} completed successfully.</p>
              <p className="mt-1 text-[11.5px] text-emerald-800">Duration 1.0 min · {saved.patient} · {saved.date}</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[['+ Issue prescription', FileText], ['+ Recommend lab test', FlaskConical], ['+ Schedule follow-up', CalendarDays]].map(([l, I]: any) => (
                <button key={l} className="rounded-xl border border-slate-200 p-3.5 text-left transition hover:border-brand-300 hover:bg-brand-50/40">
                  <I size={15} className="text-brand-600" />
                  <p className="mt-2 text-[12px] font-bold text-slate-800">{l}</p>
                </button>
              ))}
            </div>
          </Panel>
        )}
      </div>

      <div className="space-y-5">
        <Panel title="Previous consultations" sub={`${consultations.length} in this record`} icon={ScrollText}>
          <div className="space-y-3">
            {consultations.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between"><p className="text-[12.5px] font-bold text-slate-900">{c.id}</p><Badge tone={c.status === 'Completed' ? 'green' : 'amber'}>{c.status}</Badge></div>
                <p className="mt-1 text-[11px] text-slate-500">{c.date} · {c.doctor}</p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-slate-600">{c.diagnosis}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {Object.entries(c.vitals).map(([k, v]) => <Badge key={k} tone="slate">{k.toUpperCase()} {v}</Badge>)}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Patient snapshot" icon={User}>
          <div className="flex items-center gap-3">
            <Img src={IMG.heroConsult} alt="Consultation" className="h-16 w-16 shrink-0 rounded-xl" />
            <div><p className="text-[13px] font-bold text-slate-900">{PATIENT.name}</p><p className="text-[11.5px] text-slate-500">{PATIENT.age}y · {PATIENT.gender} · {PATIENT.blood}</p></div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="rounded-lg bg-rose-50 px-3 py-2.5"><p className="text-[10.5px] font-bold uppercase tracking-wider text-rose-700">Allergies</p><p className="mt-0.5 text-[11.5px] text-rose-900">{PATIENT.allergies.map((a) => a.name).join(', ')}</p></div>
            <div className="rounded-lg bg-slate-50 px-3 py-2.5"><p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">History</p><p className="mt-0.5 text-[11.5px] text-slate-700">{PATIENT.history.join(' · ')}</p></div>
          </div>
          <div className="mt-4"><Donut value={PATIENT.healthScore} label="Health score" sub="Composite" color="#059669" height={170} /></div>
        </Panel>
      </div>
    </div>
  )
}

/* ================================================================== PRESCRIPTIONS */
function Prescriptions() {
  const { consultations, toast, pushNotif, meds } = useApp()
  const [items, setItems] = useState([{ name: 'Dolo 650 (Paracetamol)', dose: '650 mg', freq: '1-0-1 (Twice daily)', duration: '5 Days', meal: 'After Food', notes: 'SOS if temperature > 100°F' }])
  const [advice, setAdvice] = useState('Rest, 3 L oral fluids per day. Avoid Ibuprofen and peanuts (documented allergies). Return immediately if breathing difficulty or rash appears.')
  const [followUp, setFollowUp] = useState('11 Oct 2026')
  const [preview, setPreview] = useState<any>(null)
  const rx = consultations.find((c) => c.prescription)?.prescription
  const safety = analyseMeds({ meds: [...meds.filter((m) => m.status === 'Active').map((m) => m.name), ...items.map((i) => i.name)], allergies: PATIENT.allergies.map((a) => a.name), conditions: PATIENT.history.join(', ') })

  const setItem = (i: number, k: string, v: string) => setItems((r) => r.map((x, k2) => (k2 === i ? { ...x, [k]: v } : x)))
  const issue = () => {
    setPreview({ id: 'RX-2026-' + String(2).padStart(6, '0'), items, advice, followUp, date: '04 October 2026' })
    pushNotif({ cat: 'Prescription', title: 'New prescription issued', body: `RX-2026-000002 with ${items.length} medication(s) sent to the patient.`, tone: 'green' })
    toast('Prescription issued and shared with the patient.', 'success')
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
      <div className="space-y-5">
        <Panel title="Create prescription" sub={`${PATIENT.name} · ${PATIENT.id} · consultation CNS-2026-000001`} icon={FileText}>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <Table head={['Medicine name', 'Dose', 'Frequency', 'Duration', 'Meal', 'Notes', '']}>
              {items.map((it, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  {['name', 'dose', 'freq', 'duration', 'meal', 'notes'].map((k) => (
                    <td key={k} className="px-3 py-2.5"><Input value={(it as any)[k]} onChange={(e: any) => setItem(i, k, e.target.value)} /></td>
                  ))}
                  <td className="px-3 py-2.5"><button onClick={() => setItems((r) => r.filter((_, k) => k !== i))} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </Table>
          </div>
          <button onClick={() => setItems((r) => [...r, { name: '', dose: '', freq: '1-0-1 (Twice daily)', duration: '5 Days', meal: 'After Food', notes: '' }])} className="btn btn-ghost btn-sm mt-3"><Plus size={13} /> Add medication</button>

          <div className="mt-5 space-y-4">
            <Field label="General advice / instructions"><Textarea rows={3} value={advice} onChange={(e: any) => setAdvice(e.target.value)} /></Field>
            <Field label="Follow-up date"><Input value={followUp} onChange={(e: any) => setFollowUp(e.target.value)} /></Field>
          </div>

          <div className={cn('mt-5 rounded-xl p-4', safety.level === 'High' ? 'bg-rose-50' : safety.level === 'Moderate' ? 'bg-amber-50' : 'bg-emerald-50')}>
            <div className="flex items-center justify-between">
              <p className="text-[12.5px] font-bold text-slate-900">Pre-issue safety check — {safety.level} risk</p>
              <p className="text-[13px] font-extrabold text-slate-900">{safety.riskScore}</p>
            </div>
            <ul className="mt-2 space-y-1.5">
              {safety.summary.slice(0, 3).map((s) => <li key={s} className="text-[11.5px] leading-relaxed text-slate-700">• {s}</li>)}
            </ul>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button onClick={issue} className="btn btn-primary"><CheckCircle2 size={14} /> Issue prescription</button>
            <button className="btn btn-ghost">Cancel</button>
          </div>
        </Panel>

        {preview && (
          <Panel title="Prescription preview" sub="PDF-style document preview" icon={Printer}
            right={<div className="flex gap-2"><button onClick={() => toast('PDF download queued (demo).', 'info')} className="btn btn-soft btn-sm"><Download size={13} /> Download PDF</button><button onClick={() => window.print()} className="btn btn-ghost btn-sm"><Printer size={13} /> Print</button></div>}>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-[16px] font-extrabold text-slate-900">SmartMed Healthcare</p>
                  <p className="text-[11.5px] text-slate-500">24 Lakeview Avenue, Bengaluru 560037 · +91 1800 123 456</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Prescription</p>
                  <p className="text-[13px] font-extrabold text-slate-900">{preview.id}</p>
                  <p className="text-[11px] text-slate-500">{preview.date}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Patient</p><p className="mt-0.5 text-[13px] font-bold text-slate-900">{PATIENT.name}</p><p className="text-[11.5px] text-slate-500">{PATIENT.id} · {PATIENT.age}y / {PATIENT.gender} · {PATIENT.blood}</p></div>
                <div><p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Prescriber</p><p className="mt-0.5 text-[13px] font-bold text-slate-900">Dr. Rajesh Sharma</p><p className="text-[11.5px] text-slate-500">MBBS, MD (General Medicine) · Reg. KMC-45219</p></div>
              </div>
              <div className="mt-4"><Table head={['Medicine', 'Dose', 'Frequency', 'Duration', 'Instructions']}>
                {preview.items.map((i: any, k: number) => (
                  <tr key={k} className="border-b border-slate-100 last:border-0">
                    <td className="px-3.5 py-2.5 text-[12px] font-semibold text-slate-800">{i.name}</td>
                    <td className="px-3.5 py-2.5 text-[12px] text-slate-600">{i.dose}</td>
                    <td className="px-3.5 py-2.5 text-[12px] text-slate-600">{i.freq}</td>
                    <td className="px-3.5 py-2.5 text-[12px] text-slate-600">{i.duration}</td>
                    <td className="px-3.5 py-2.5 text-[12px] text-slate-600">{i.meal}{i.notes ? ` · ${i.notes}` : ''}</td>
                  </tr>
                ))}
              </Table></div>
              <div className="mt-4 rounded-xl bg-slate-50 p-3.5"><p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Advice</p><p className="mt-1 text-[12px] leading-relaxed text-slate-700">{preview.advice}</p></div>
              <div className="mt-4 flex items-end justify-between border-t border-slate-200 pt-4">
                <p className="text-[11.5px] text-slate-500">Follow-up: <strong className="text-slate-800">{preview.followUp}</strong></p>
                <p className="text-[12px] italic text-slate-600">Dr. Rajesh Sharma</p>
              </div>
            </div>
          </Panel>
        )}
      </div>

      <div className="space-y-5">
        <Panel title="Issued prescriptions" sub={`${consultations.filter((c) => c.prescription).length} record(s)`} icon={ScrollText}>
          {rx ? (
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-[12.5px] font-bold text-slate-900">{rx.id}</p>
              <p className="mt-1 text-[11.5px] text-slate-500">29 September 2026 · {PATIENT.name}</p>
              <div className="mt-3 space-y-2">
                {rx.items.map((i) => (
                  <div key={i.name} className="rounded-lg bg-slate-50 px-3 py-2.5"><p className="text-[12px] font-bold text-slate-800">{i.name}</p><p className="text-[11px] text-slate-500">{i.dose} · {i.freq} · {i.duration} · {i.meal}</p></div>
                ))}
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 p-3"><p className="text-[11.5px] leading-relaxed text-slate-600">{rx.advice}</p></div>
            </div>
          ) : <Empty title="No prescriptions issued" sub="Create one from the form." icon={FileText} />}
        </Panel>

        <Panel title="Prescribing safety reference" icon={ShieldCheck}>
          <div className="space-y-2.5">
            {[
              ['Penicillin allergy', 'Avoid amoxicillin and other beta-lactams — documented severe reaction.'],
              ['NSAID avoidance', 'Brufen/ibuprofen documented as an allergy; prefer paracetamol.'],
              ['Iron & thyroid spacing', 'Separate ferrous ascorbate and levothyroxine by at least 4 hours.'],
              ['Duplicate therapy', 'Dolo and Crocin share the same active ingredient (paracetamol).'],
              ['Renal caution', 'Review dose of renally-cleared drugs if eGFR falls below 45 mL/min.'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-slate-200 p-3.5">
                <p className="text-[12px] font-bold text-slate-900">{t}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-slate-600">{d}</p>
              </div>
            ))}
          </div>
          <AiDisclaimer />
        </Panel>
      </div>
    </div>
  )
}

/* ================================================================== LAB */
function Lab() {
  const { reports, addReport, toast, pushNotif } = useApp()
  const [sel, setSel] = useState(reports[0]?.id)
  const [panel, setPanel] = useState('Lipid Profile + Troponin')
  const [type, setType] = useState('Blood Test')
  const [priority, setPriority] = useState('Routine')
  const report = reports.find((r) => r.id === sel) || reports[0]
  const abnormal = (report?.rows || []).filter((r) => !(r.high === 0 || (r.value >= r.low && r.value <= r.high)))

  const recommend = () => {
    addReport({
      id: 'LAB-2026-' + String(46 + reports.length).padStart(6, '0'),
      panel, date: '04 Oct 2026', doctor: 'Dr. Rajesh Sharma', lab: 'SmartMed Diagnostics', type, status: 'Pending',
      rows: [{ test: 'Pending analysis', value: 0, unit: '—', low: 0, high: 0, explain: 'Result will be filled by the laboratory once the sample is processed.', cause: 'Awaiting sample collection and reporting.', follow: 'Blood draw scheduled at the laboratory counter.' }],
    })
    pushNotif({ cat: 'Lab Report', title: 'Test recommended', body: `${panel} requested for ${PATIENT.name} (${priority}).`, tone: 'blue' })
    toast(`${panel} requested — the laboratory has been notified.`, 'success')
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <div className="space-y-5">
        <Panel title="Reports" sub={`${reports.length} records · select to interpret`} icon={FlaskConical}
          right={<Select value={sel} onChange={(e: any) => setSel(e.target.value)}>{reports.map((r) => <option key={r.id} value={r.id}>{r.panel}</option>)}</Select>}>
          {report && (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                {[['Report', report.id], ['Panel', report.panel], ['Date', report.date], ['Status', report.status]].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-slate-200 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k}</p><p className="mt-0.5 text-[12px] font-semibold text-slate-800">{v}</p></div>
                ))}
              </div>
              <div className="mt-4">
                <Table head={['Test', 'Value', 'Reference', 'Status', 'Interpretation']}>
                  {report.rows.map((r) => {
                    const normal = r.high === 0 || (r.value >= r.low && r.value <= r.high)
                    return (
                      <tr key={r.test} className={cn('border-b border-slate-100 last:border-0', !normal && 'bg-amber-50/50')}>
                        <td className="px-4 py-3 text-[12px] font-bold text-slate-800">{r.test}</td>
                        <td className="px-4 py-3 text-[12px] font-extrabold tabular-nums text-slate-900">{r.value} <span className="text-[10.5px] font-semibold text-slate-500">{r.unit}</span></td>
                        <td className="px-4 py-3 text-[11.5px] tabular-nums text-slate-600">{r.high === 0 ? 'N/A' : `${r.low}–${r.high}`}</td>
                        <td className="px-4 py-3"><Badge tone={normal ? 'green' : r.value < r.low ? 'amber' : 'red'}>{normal ? 'Normal' : r.value < r.low ? 'Low' : 'High'}</Badge></td>
                        <td className="px-4 py-3 text-[11.5px] leading-relaxed text-slate-600">{r.explain}</td>
                      </tr>
                    )
                  })}
                </Table>
              </div>
            </>
          )}
        </Panel>

        <Panel title="Recommend a test" sub="Raise a laboratory request for this patient" icon={Microscope}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Panel / investigation"><Input value={panel} onChange={(e: any) => setPanel(e.target.value)} /></Field>
            <Field label="Type"><Select value={type} onChange={(e: any) => setType(e.target.value)}>{['Blood Test', 'Urine Test', 'X-Ray', 'CT', 'MRI', 'Other Diagnostics'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
            <Field label="Priority"><Select value={priority} onChange={(e: any) => setPriority(e.target.value)}>{['Routine', 'Urgent', 'Critical'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
          </div>
          <button onClick={recommend} className="btn btn-primary mt-4"><Plus size={14} /> Raise request</button>
        </Panel>
      </div>

      <div className="space-y-5">
        <Panel title="Outstanding requests" sub={`${LAB_REQUESTS.length} across the institution`} icon={ClipboardList}>
          <Table head={['Request', 'Panel', 'Type', 'Priority', 'Status']}>
            {LAB_REQUESTS.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0">
                <td className="px-3.5 py-2.5 text-[11.5px] font-bold text-slate-700">{r.id}</td>
                <td className="px-3.5 py-2.5 text-[11.5px] text-slate-600">{r.panel}</td>
                <td className="px-3.5 py-2.5 text-[11px] text-slate-600">{r.type}</td>
                <td className="px-3.5 py-2.5"><Badge tone={r.priority === 'Critical' ? 'red' : r.priority === 'Urgent' ? 'amber' : 'slate'}>{r.priority}</Badge></td>
                <td className="px-3.5 py-2.5"><Badge tone={r.status === 'Verified' ? 'green' : r.status === 'Processing' ? 'amber' : 'slate'}>{r.status}</Badge></td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Trend view" sub="Selected panel over time" icon={TrendingUp}>
          <SimpleLine data={[{ d: 'Jul', v: 9.8 }, { d: 'Aug', v: 10.1 }, { d: 'Sep', v: 10.4 }]} k="v" name="Haemoglobin" unit=" g/dL" color="#0d9488" height={170} />
          <div className="mt-3 rounded-xl bg-slate-50 p-3.5">
            <p className="text-[11.5px] font-bold text-slate-900">AI interpretation</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-600">
              {abnormal.length
                ? `${abnormal.length} value(s) sit outside the reference range. The pattern is consistent with the recorded iron-deficiency anaemia and subclinical hypothyroidism — clinical correlation is advised.`
                : 'All measured values fall within their reference ranges.'}
            </p>
          </div>
        </Panel>

        <Panel title="Report images" icon={FileText}>
          <div className="grid grid-cols-2 gap-3">
            <Img src={IMG.labBlood} alt="Blood analysis" ratio="4/3" className="rounded-xl" />
            <Img src={IMG.labMicro} alt="Microscopy" ratio="4/3" className="rounded-xl" />
          </div>
        </Panel>
      </div>
    </div>
  )
}

function Followups() {
  const { appts, consultations, toast } = useApp()
  const due = consultations.filter((c) => c.prescription?.followUp)
  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <Panel title="Scheduled follow-ups" sub="Reviews generated from completed consultations" icon={BellRing}>
        <div className="space-y-3">
          {due.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
              <div>
                <p className="text-[13px] font-bold text-slate-900">{c.patient}</p>
                <p className="text-[11.5px] text-slate-500">Follow-up {c.prescription!.followUp} · after {c.id}</p>
                <p className="mt-1 text-[11.5px] text-slate-600">{c.diagnosis}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toast('Reminder sent to the patient (demo).', 'success')} className="btn btn-soft btn-sm">Send reminder</button>
                <button onClick={() => toast('Follow-up marked complete.', 'success')} className="btn btn-green btn-sm">Mark done</button>
              </div>
            </div>
          ))}
          {!due.length && <Empty title="No follow-ups due" sub="Completed consultations with a follow-up date appear here." icon={BellRing} />}
        </div>
      </Panel>
      <Panel title="Upcoming appointments" sub="Next 7 days" icon={CalendarDays}>
        <div className="space-y-2.5">
          {appts.filter((a) => a.status === 'BOOKED').map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5">
              <div><p className="text-[12.5px] font-bold text-slate-800">{a.patient}</p><p className="text-[11px] text-slate-500">{a.date} · {a.time} · {a.type}</p></div>
              <Badge tone="brand">{a.token}</Badge>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function Schedule() {
  const days = [
    { d: 'Mon', n: 28, items: ['09:30 Radhika D C', '11:00 Imran Baig'] },
    { d: 'Tue', n: 29, items: ['10:30 Ananya Sharma', '14:00 Video review'] },
    { d: 'Wed', n: 30, items: ['09:00 OPD block'] },
    { d: 'Thu', n: 1, items: ['10:30 Latha Krishnan'] },
    { d: 'Fri', n: 2, items: ['09:30 Ward rounds'] },
    { d: 'Sat', n: 3, items: ['11:00 Follow-up clinic'] },
  ]
  return (
    <Panel title="Week of 28 September – 04 October 2026" sub="Your clinical commitments" icon={Clock}
      right={<div className="flex gap-2"><button className="btn btn-ghost btn-sm">← Previous</button><button className="btn btn-ghost btn-sm">Next →</button></div>}>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {days.map((x) => (
          <div key={x.d} className={cn('rounded-xl border p-3.5', x.n === 29 ? 'border-brand-300 bg-brand-50/50' : 'border-slate-200')}>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{x.d}</p>
            <p className="text-[20px] font-extrabold text-slate-900">{String(x.n).padStart(2, '0')}</p>
            <div className="mt-2 space-y-1.5">
              {x.items.map((i) => <p key={i} className="rounded-md bg-white px-2 py-1.5 text-[10.5px] font-semibold text-slate-700 shadow-sm">{i}</p>)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[['Consultations today', '3', 'CalendarDays'], ['Average duration', '14 min', 'Clock'], ['Follow-ups due', '2', 'BellRing']].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-slate-200 p-4"><p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{l}</p><p className="mt-1 text-[20px] font-extrabold text-slate-900">{v}</p></div>
        ))}
      </div>
    </Panel>
  )
}

function Availability() {
  const [rows, setRows] = useState([
    { d: 'Monday', on: true, from: '09:00', to: '17:00', dur: '15 min' },
    { d: 'Tuesday', on: true, from: '09:00', to: '17:00', dur: '15 min' },
    { d: 'Wednesday', on: true, from: '09:00', to: '13:00', dur: '15 min' },
    { d: 'Thursday', on: true, from: '09:00', to: '17:00', dur: '20 min' },
    { d: 'Friday', on: false, from: '09:00', to: '17:00', dur: '15 min' },
    { d: 'Saturday', on: true, from: '09:00', to: '12:00', dur: '15 min' },
  ])
  const { toast } = useApp()
  const set = (i: number, k: string, v: any) => setRows((r) => r.map((x, k2) => (k2 === i ? { ...x, [k]: v } : x)))
  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <Panel title="Weekly availability schedule" sub="Only active days are shown to patients when booking." icon={Settings}
        right={<button onClick={() => toast('Availability saved and published to the booking engine.', 'success')} className="btn btn-primary btn-sm">Save changes</button>}>
        <div className="space-y-2.5">
          {rows.map((r, i) => (
            <div key={r.d} className="grid items-center gap-3 rounded-xl border border-slate-200 p-3.5 sm:grid-cols-[1.1fr_0.6fr_0.8fr_0.8fr_0.8fr]">
              <p className="text-[12.5px] font-bold text-slate-800">{r.d}</p>
              <label className="flex items-center gap-2 text-[11.5px] font-semibold text-slate-600">
                <input type="checkbox" checked={r.on} onChange={(e) => set(i, 'on', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" /> Available
              </label>
              <Input value={r.from} onChange={(e: any) => set(i, 'from', e.target.value)} disabled={!r.on} />
              <Input value={r.to} onChange={(e: any) => set(i, 'to', e.target.value)} disabled={!r.on} />
              <Select value={r.dur} onChange={(e: any) => set(i, 'dur', e.target.value)} disabled={!r.on}>{['10 min', '15 min', '20 min', '30 min'].map((d) => <option key={d}>{d}</option>)}</Select>
            </div>
          ))}
        </div>
      </Panel>
      <div className="space-y-5">
        <Panel title="Slot summary" icon={Gauge}>
          <div className="mb-3"><Ring value={78} size={150} stroke={13} label="Utilisation" caption="This week" /></div>
          <KV cols={1} items={[
            { k: 'Bookable days', v: rows.filter((r) => r.on).length + ' of 6' },
            { k: 'Slot duration', v: '15 minutes (default)' },
            { k: 'Max daily appointments', v: '32' },
            { k: 'Video consultations', v: 'Enabled · 6 per day' },
          ]} />
        </Panel>
        <Panel title="Booking rules" icon={ShieldCheck}>
          <ul className="space-y-2.5">
            {['Patients can self-book up to 30 days in advance.', 'Emergency appointments bypass availability and route to the ER.', 'Video slots are separate from in-person capacity.', 'Blocked days are hidden instantly from the public booking page.'].map((x) => (
              <li key={x} className="flex items-start gap-2.5 text-[12px] leading-relaxed text-slate-600"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-teal-600" /> {x}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
