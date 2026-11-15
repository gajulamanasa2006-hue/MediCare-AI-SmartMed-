import React, { useState } from 'react'
import {
  Activity, AlertTriangle, Ambulance, Bell, BellRing, CalendarDays, CheckCircle2, ClipboardList, Clock,
  Heart, HeartPulse, MessageSquare, Pill, Plus, Send, Siren, Syringe, Users, UserCheck, X,
} from 'lucide-react'
import { PortalLayout, Panel, KpiRow } from '../../components/PortalLayout'
import {
  AiDisclaimer, Badge, Bar, Btn, Empty, Field, Img, Input, KV, Modal, Ring, Select, Table, Textarea, cn,
} from '../../components/ui'
import { BpChart, Donut, SimpleLine } from '../../components/charts'
import { BEDS, DOCTORS, IMG, PATIENT, VITALS } from '../../data/mock'
import { useApp } from '../../context/AppContext'
import { IcuCommandCenter } from './IcuCommandCenter'

const T: Record<string, { t: string; s: string }> = {
  dashboard: { t: 'Nursing Dashboard', s: 'Ward A · 24 beds · shift 08:00 – 20:00' },
  monitoring: { t: 'Patient Monitoring', s: 'Live vitals across the ward.' },
  vitals: { t: 'Vital Signs Entry', s: 'Record and validate observations.' },
  medication: { t: 'Medication Administration', s: 'Dose-by-dose administration record.' },
  alerts: { t: 'Patient Alerts', s: 'Escalations requiring nursing action.' },
  coordination: { t: 'Appointment Coordination', s: 'Move patients between departments.' },
  messages: { t: 'Doctor Communication', s: 'Secure messaging with the clinical team.' },
  emergency: { t: 'Emergency Notifications', s: 'Incoming emergencies and ambulance pre-alerts.' },
  icu: { t: 'ICU Command Center', s: 'Live monitoring · deterioration detection · task board' },
}

export default function NursePortal() {
  const [view, setView] = useState('dashboard')
  const meta = T[view] || T.dashboard
  return (
    <PortalLayout role="nurse" view={view} setView={setView} title={meta.t} sub={meta.s} searchPlaceholder="Search beds, patients or tasks…">
      {view === 'dashboard' && <Dashboard go={setView} />}
      {view === 'icu' && <IcuCommandCenter />}
      {view === 'monitoring' && <Monitoring />}
      {view === 'vitals' && <Vitals />}
      {view === 'medication' && <Medication />}
      {view === 'alerts' && <Alerts />}
      {view === 'coordination' && <Coordination />}
      {view === 'messages' && <Messages />}
      {view === 'emergency' && <EmergencyNotes />}
    </PortalLayout>
  )
}

const WARD = [
  { bed: 'A-101', patient: PATIENT.name, age: 20, sys: 118, dia: 76, hr: 74, spo2: 98, temp: 98.4, risk: 'Low', status: 'Stable' },
  { bed: 'A-102', patient: 'Ananya Sharma', age: 34, sys: 148, dia: 94, hr: 104, spo2: 96, temp: 99.1, risk: 'High', status: 'Monitor' },
  { bed: 'A-103', patient: 'Rahul Verma', age: 7, sys: 104, dia: 66, hr: 96, spo2: 99, temp: 101.2, risk: 'Medium', status: 'Febrile' },
  { bed: 'A-104', patient: 'Imran Baig', age: 52, sys: 132, dia: 86, hr: 82, spo2: 97, temp: 98.6, risk: 'Medium', status: 'Stable' },
  { bed: 'A-105', patient: 'Latha Krishnan', age: 44, sys: 126, dia: 82, hr: 78, spo2: 98, temp: 98.2, risk: 'Low', status: 'Post-op' },
]

const ALERTS = [
  { id: 'AL-1', level: 'Critical', bed: 'A-102', patient: 'Ananya Sharma', msg: 'Blood pressure 148/94 with tachycardia — cardiac review requested.', time: '4 min ago' },
  { id: 'AL-2', level: 'High', bed: 'A-103', patient: 'Rahul Verma', msg: 'Temperature 101.2 °F — antipyretic due and paediatric review advised.', time: '12 min ago' },
  { id: 'AL-3', level: 'Medium', bed: 'A-104', patient: 'Imran Baig', msg: 'Fasting glucose 168 mg/dL before breakfast dose.', time: '31 min ago' },
  { id: 'AL-4', level: 'Low', bed: 'A-105', patient: 'Latha Krishnan', msg: 'Dressing change due in 40 minutes.', time: '1 h ago' },
]

function Dashboard({ go }: { go: (v: string) => void }) {
  const { vitalsLog, meds, emergencies, toast } = useApp()
  return (
    <div className="space-y-5">
      <KpiRow
        items={[
          { label: 'Patients in ward', value: WARD.length, sub: `of ${BEDS.total} institutional beds`, icon: Users, tone: 'brand' },
          { label: 'High-risk patients', value: WARD.filter((w) => w.risk !== 'Low').length, sub: 'Require 2-hourly observation', icon: AlertTriangle, tone: 'amber' },
          { label: 'Active alerts', value: ALERTS.length, sub: '1 critical · 1 high', icon: BellRing, tone: 'red' },
          { label: 'Medications due', value: meds.filter((m) => m.status === 'Active').length, sub: 'Before 14:00 round', icon: Pill, tone: 'teal' },
          { label: 'Vitals logged today', value: vitalsLog.length, sub: 'Last entry 09:40', icon: HeartPulse, tone: 'green' },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-5">
          <Panel title="Ward A — live board" sub="Bed-by-bed observation status" icon={Activity}
            right={<button onClick={() => go('vitals')} className="btn btn-primary btn-sm"><Plus size={13} /> Record vitals</button>}>
            <Table head={['Bed', 'Patient', 'BP', 'HR', 'SpO₂', 'Temp', 'Risk', 'Status']}>
              {WARD.map((w) => (
                <tr key={w.bed} className={cn('border-b border-slate-100 last:border-0', w.risk === 'High' && 'bg-rose-50/50')}>
                  <td className="px-4 py-3 text-[12px] font-bold text-slate-800">{w.bed}</td>
                  <td className="px-4 py-3"><p className="text-[12.5px] font-semibold text-slate-800">{w.patient}</p><p className="text-[11px] text-slate-500">{w.age}y</p></td>
                  <td className={cn('px-4 py-3 text-[12px] font-bold tabular-nums', w.sys >= 140 ? 'text-rose-600' : 'text-slate-700')}>{w.sys}/{w.dia}</td>
                  <td className={cn('px-4 py-3 text-[12px] tabular-nums', w.hr > 100 ? 'font-bold text-rose-600' : 'text-slate-700')}>{w.hr}</td>
                  <td className="px-4 py-3 text-[12px] tabular-nums text-slate-700">{w.spo2}%</td>
                  <td className={cn('px-4 py-3 text-[12px] tabular-nums', w.temp > 100 ? 'font-bold text-amber-600' : 'text-slate-700')}>{w.temp}</td>
                  <td className="px-4 py-3"><Badge tone={w.risk === 'High' ? 'red' : w.risk === 'Medium' ? 'amber' : 'green'}>{w.risk}</Badge></td>
                  <td className="px-4 py-3 text-[11.5px] text-slate-600">{w.status}</td>
                </tr>
              ))}
            </Table>
          </Panel>

          <Panel title="Ward vitals trend" sub="Averaged across occupied beds" icon={HeartPulse}>
            <BpChart data={VITALS.bp} height={220} />
          </Panel>

          <Panel title="Shift handover notes" sub="Tasks pending for the next shift" icon={ClipboardList}>
            <div className="space-y-2.5">
              {[
                { t: 'Repeat BP for bed A-102 every 2 hours', by: 'Cardiology instruction · Dr. Imran Qureshi', tone: 'red' },
                { t: 'Administer antipyretic at 14:00 for A-103', by: 'Paediatrics · Dr. Kavya Rao', tone: 'amber' },
                { t: 'Collect fasting sample before dinner for A-104', by: 'Laboratory request LR-2026-000046', tone: 'blue' },
                { t: 'Dressing change and wound inspection for A-105', by: 'Post-operative protocol', tone: 'teal' },
              ].map((x) => (
                <div key={x.t} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3.5">
                  <span className={cn('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg',
                    x.tone === 'red' ? 'bg-rose-50 text-rose-600' : x.tone === 'amber' ? 'bg-amber-50 text-amber-600' : x.tone === 'blue' ? 'bg-brand-50 text-brand-600' : 'bg-teal-50 text-teal-600')}>
                    <ClipboardList size={14} />
                  </span>
                  <div className="min-w-0"><p className="text-[12.5px] font-bold text-slate-800">{x.t}</p><p className="mt-0.5 text-[11px] text-slate-500">{x.by}</p></div>
                  <button onClick={() => toast('Task acknowledged and assigned to you.', 'success')} className="btn btn-ghost btn-sm ml-auto">Acknowledge</button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Bed occupancy" sub={`${BEDS.occupied} of ${BEDS.total} occupied`} icon={Activity}>
            <div className="grid place-items-center"><Donut value={Math.round((BEDS.occupied / BEDS.total) * 100)} label="Occupancy" sub={`${BEDS.available} available`} height={200} /></div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[['Available', BEDS.available], ['Occupied', BEDS.occupied], ['Maintenance', BEDS.maintenance], ['ICU in use', `${BEDS.icuUsed}/${BEDS.icu}`]].map(([k, v]) => (
                <div key={k as string} className="rounded-xl border border-slate-200 p-3"><p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{k}</p><p className="mt-0.5 text-[16px] font-extrabold text-slate-900">{v}</p></div>
              ))}
            </div>
          </Panel>

          <Panel title="Active alerts" sub="Newest first" icon={BellRing}
            right={<button onClick={() => go('alerts')} className="text-[11.5px] font-bold text-brand-600">Manage</button>}>
            <div className="space-y-2.5">
              {ALERTS.slice(0, 3).map((a) => (
                <div key={a.id} className={cn('rounded-xl border p-3.5', a.level === 'Critical' ? 'border-rose-200 bg-rose-50/60' : a.level === 'High' ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200')}>
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold text-slate-900">{a.bed} · {a.patient}</p>
                    <Badge tone={a.level === 'Critical' ? 'red' : a.level === 'High' ? 'amber' : 'slate'}>{a.level}</Badge>
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-600">{a.msg}</p>
                  <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{a.time}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Emergency bay status" icon={Ambulance}
            right={<button onClick={() => go('emergency')} className="text-[11.5px] font-bold text-brand-600">Open</button>}>
            <div className="space-y-2.5">
              {emergencies.slice(0, 3).map((e) => (
                <div key={e.id} className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex items-center justify-between"><p className="text-[12px] font-bold text-slate-800">{e.type}</p><Badge tone={e.priority === 'CRITICAL' ? 'red' : e.priority === 'HIGH' ? 'amber' : 'slate'}>{e.priority}</Badge></div>
                  <p className="mt-1 text-[11px] text-slate-500">{e.patient} · {e.ambulance} · ETA {e.eta}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Ward imagery" icon={Heart}>
            <Img src={IMG.clinic} alt="Ward" ratio="16/9" className="rounded-xl" />
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Monitoring() {
  const [sel, setSel] = useState(WARD[0].bed)
  const w = WARD.find((x) => x.bed === sel)!
  return (
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <div className="space-y-5">
        <Panel title="Ward monitoring" sub="Select a bed to inspect" icon={Activity}
          right={<Select value={sel} onChange={(e: any) => setSel(e.target.value)}>{WARD.map((x) => <option key={x.bed} value={x.bed}>{x.bed} — {x.patient}</option>)}</Select>}>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[['BP', `${w.sys}/${w.dia}`, w.sys >= 140 ? 'red' : 'green'], ['Heart rate', `${w.hr}`, w.hr > 100 ? 'red' : 'green'],
              ['SpO₂', `${w.spo2}%`, w.spo2 >= 97 ? 'green' : 'amber'], ['Temperature', `${w.temp}°F`, w.temp > 100 ? 'amber' : 'green'],
              ['Risk', w.risk, w.risk === 'High' ? 'red' : w.risk === 'Medium' ? 'amber' : 'green'], ['Status', w.status, 'brand']].map(([k, v, t]) => (
              <div key={k as string} className="rounded-xl border border-slate-200 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k}</p>
                <p className={cn('mt-1 text-[14px] font-extrabold', t === 'red' ? 'text-rose-600' : t === 'amber' ? 'text-amber-600' : t === 'green' ? 'text-emerald-600' : 'text-slate-900')}>{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-5"><BpChart data={VITALS.bp} height={220} /></div>
        </Panel>

        <Panel title="Early-warning score" sub="Composite deterioration indicator (demo)" icon={AlertTriangle}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Ring value={w.risk === 'High' ? 72 : w.risk === 'Medium' ? 46 : 22} size={160} stroke={14} label="Risk index" caption={w.risk + ' risk'} /></div>
            <div className="space-y-3">
              {[['Respiratory', w.spo2 >= 97 ? 90 : 62], ['Circulatory', w.sys >= 140 || w.hr > 100 ? 58 : 88], ['Temperature', w.temp > 100 ? 64 : 92], ['Consciousness', 95]].map(([k, v]) => (
                <div key={k as string}><div className="flex items-center justify-between"><p className="text-[11.5px] font-bold text-slate-700">{k}</p><p className="text-[12px] font-extrabold text-slate-900">{v}</p></div>
                  <div className="mt-1.5"><Bar value={v as number} tone={(v as number) >= 80 ? 'green' : (v as number) >= 60 ? 'amber' : 'red'} showPct={false} height={6} /></div></div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="space-y-5">
        <Panel title="Observation schedule" icon={Clock}>
          <div className="space-y-2.5">
            {WARD.map((x) => (
              <div key={x.bed} className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5">
                <div><p className="text-[12px] font-bold text-slate-800">{x.bed} · {x.patient}</p><p className="text-[11px] text-slate-500">{x.risk === 'High' ? '2-hourly observations' : x.risk === 'Medium' ? '4-hourly observations' : '6-hourly observations'}</p></div>
                <button className="btn btn-soft btn-sm">Log now</button>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Ward reference imagery" icon={Heart}>
          <Img src={IMG.labMicro} alt="Clinical monitoring" ratio="16/9" className="rounded-xl" />
        </Panel>
      </div>
    </div>
  )
}

function Vitals() {
  const { addVitals, toast, vitalsLog } = useApp()
  const [bed, setBed] = useState(WARD[0].bed)
  const [f, setF] = useState({ sys: '', dia: '', temp: '', hr: '', spo2: '', weight: '' })
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }))
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.sys || !f.dia) { toast('Blood pressure values are required.', 'error'); return }
    addVitals({
      id: 'V-' + Date.now(), date: new Date(2026, 9, 4).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      sys: Number(f.sys), dia: Number(f.dia), sugar: PATIENT.vitals.sugar, hr: Number(f.hr) || 76,
      weight: Number(f.weight) || PATIENT.vitals.weight, spo2: Number(f.spo2) || 98, temp: Number(f.temp) || 98.4,
    })
    toast(`Vitals recorded for bed ${bed} and synced to the patient record.`, 'success')
    setF({ sys: '', dia: '', temp: '', hr: '', spo2: '', weight: '' })
  }
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.3fr]">
      <Panel title="Vital signs entry" sub="Values validate against expected ranges" icon={HeartPulse}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Bed / patient"><Select value={bed} onChange={(e: any) => setBed(e.target.value)}>{WARD.map((w) => <option key={w.bed} value={w.bed}>{w.bed} — {w.patient}</option>)}</Select></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Systolic (mmHg)" required><Input value={f.sys} onChange={(e: any) => set('sys', e.target.value)} placeholder="118" /></Field>
            <Field label="Diastolic (mmHg)" required><Input value={f.dia} onChange={(e: any) => set('dia', e.target.value)} placeholder="76" /></Field>
            <Field label="Temperature (°F)"><Input value={f.temp} onChange={(e: any) => set('temp', e.target.value)} placeholder="98.4" /></Field>
            <Field label="Pulse (bpm)"><Input value={f.hr} onChange={(e: any) => set('hr', e.target.value)} placeholder="74" /></Field>
            <Field label="SpO₂ (%)"><Input value={f.spo2} onChange={(e: any) => set('spo2', e.target.value)} placeholder="98" /></Field>
            <Field label="Weight (kg)"><Input value={f.weight} onChange={(e: any) => set('weight', e.target.value)} placeholder="47" /></Field>
          </div>
          <button type="submit" className="btn btn-primary w-full"><Plus size={14} /> Save observation</button>
        </form>
        <div className="mt-5"><AiDisclaimer text="Vital signs in this demo are stored in your browser only. Abnormal values are highlighted for escalation but do not trigger real clinical alerts." /></div>
      </Panel>

      <div className="space-y-5">
        <Panel title="Recent observations" sub={`${vitalsLog.length} entries`} icon={ClipboardList}>
          <Table head={['Date', 'BP', 'HR', 'SpO₂', 'Temp', 'Recorded by']}>
            {vitalsLog.map((v) => (
              <tr key={v.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-[12px] font-semibold text-slate-700">{v.date}</td>
                <td className={cn('px-4 py-3 text-[12px] font-bold tabular-nums', v.sys >= 140 ? 'text-rose-600' : 'text-slate-700')}>{v.sys}/{v.dia}</td>
                <td className="px-4 py-3 text-[12px] tabular-nums text-slate-700">{v.hr}</td>
                <td className="px-4 py-3 text-[12px] tabular-nums text-slate-700">{v.spo2}%</td>
                <td className="px-4 py-3 text-[12px] tabular-nums text-slate-700">{v.temp}</td>
                <td className="px-4 py-3 text-[11.5px] text-slate-500">Sr. Anjali Verma</td>
              </tr>
            ))}
          </Table>
        </Panel>
        <Panel title="Ward trend" sub="Blood pressure observations" icon={Activity}>
          <BpChart data={VITALS.bp} height={200} />
        </Panel>
      </div>
    </div>
  )
}

function Medication() {
  const { meds, doseLog, logDose, toast } = useApp()
  const [sel, setSel] = useState(WARD[0].bed)
  const active = meds.filter((m) => m.status === 'Active')
  const dayKey = new Date(2026, 9, 4).toDateString()
  return (
    <div className="space-y-5">
      <Panel title="Medication administration record" sub={`Bed ${sel} · ${WARD.find((w) => w.bed === sel)?.patient}`} icon={Syringe}
        right={<Select value={sel} onChange={(e: any) => setSel(e.target.value)}>{WARD.map((w) => <option key={w.bed} value={w.bed}>{w.bed} — {w.patient}</option>)}</Select>}>
        <Table head={['Medicine', 'Dose', 'Frequency', 'Timing', 'Meal', 'Status', 'Action']}>
          {active.map((m) => {
            const state = doseLog[`${m.id}|${m.slot}|${dayKey}`]
            return (
              <tr key={m.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-[12.5px] font-bold text-slate-800">{m.name}</td>
                <td className="px-4 py-3 text-[12px] text-slate-600">{m.strength} · {m.dose}</td>
                <td className="px-4 py-3 text-[12px] text-slate-600">{m.freq}</td>
                <td className="px-4 py-3 text-[12px] tabular-nums text-slate-600">{m.time} · {m.slot}</td>
                <td className="px-4 py-3 text-[12px] text-slate-600">{m.meal}</td>
                <td className="px-4 py-3"><Badge tone={state === 'Taken' ? 'green' : state === 'Missed' ? 'red' : 'amber'}>{state || 'Due'}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => { logDose(m.id, m.slot, 'Taken'); toast(`${m.name} administered and charted.`, 'success') }} className="btn btn-green btn-sm">Given</button>
                    <button onClick={() => { logDose(m.id, m.slot, 'Missed'); toast(`${m.name} withheld — reason recorded.`, 'warn') }} className="btn btn-danger-soft btn-sm">Withheld</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </Table>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Administration rules" icon={ShieldCheckIcon}>
          <ul className="space-y-2.5">
            {['Confirm two patient identifiers before every dose.', 'Check allergies on the chart before administering any new medicine.', 'Separate iron and levothyroxine doses by at least four hours.', 'Record the exact time of administration, not the scheduled time.', 'Report any suspected adverse reaction to the prescriber immediately.'].map((x) => (
              <li key={x} className="flex items-start gap-2.5 text-[12px] leading-relaxed text-slate-600"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-teal-600" /> {x}</li>
            ))}
          </ul>
        </Panel>
        <Panel title="Controlled & high-alert medicines" icon={AlertTriangle}>
          <div className="space-y-2.5">
            {[['Warfarin', 'Anticoagulant — double-check INR before dose', 'High alert'], ['Insulin', 'Hypoglycaemia risk — confirm glucose first', 'High alert'], ['Morphine', 'Controlled substance — witness signature required', 'Controlled'], ['Potassium chloride', 'Never give undiluted by IV push', 'High alert']].map(([n, d, t]) => (
              <div key={n} className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
                <div className="flex items-center justify-between"><p className="text-[12px] font-bold text-amber-900">{n}</p><Badge tone="amber">{t}</Badge></div>
                <p className="mt-1 text-[11.5px] text-amber-800">{d}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function ShieldCheckIcon(p: any) {
  return <CheckCircle2 {...p} />
}

function Alerts() {
  const [handled, setHandled] = useState<string[]>([])
  const { toast } = useApp()
  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <Panel title="Patient alerts" sub={`${ALERTS.length - handled.length} open`} icon={BellRing}>
        <div className="space-y-3">
          {ALERTS.map((a) => (
            <div key={a.id} className={cn('rounded-xl border p-4', handled.includes(a.id) ? 'border-slate-200 opacity-60' : a.level === 'Critical' ? 'border-rose-200 bg-rose-50/60' : a.level === 'High' ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200')}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-bold text-slate-900">{a.bed} · {a.patient}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{a.msg}</p>
                  <p className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{a.level} · {a.time}</p>
                </div>
                <div className="flex gap-2">
                  {!handled.includes(a.id) ? (
                    <>
                      <button onClick={() => { setHandled((h) => [...h, a.id]); toast('Alert acknowledged and escalated to the duty doctor.', 'success') }} className="btn btn-primary btn-sm">Acknowledge</button>
                      <button onClick={() => { setHandled((h) => [...h, a.id]); toast('Alert dismissed with a recorded reason.', 'info') }} className="btn btn-ghost btn-sm">Dismiss</button>
                    </>
                  ) : <Badge tone="green">Handled</Badge>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <div className="space-y-5">
        <Panel title="Escalation policy" icon={AlertTriangle}>
          <div className="space-y-2.5">
            {[['Critical', 'Immediate bedside review · call the duty doctor and prepare the crash cart.'], ['High', 'Review within 15 minutes · repeat observations and inform the treating consultant.'], ['Medium', 'Review within 60 minutes · document and continue scheduled monitoring.'], ['Low', 'Routine task · complete during the current round.']].map(([l, d]) => (
              <div key={l} className="rounded-xl border border-slate-200 p-3.5">
                <Badge tone={l === 'Critical' ? 'red' : l === 'High' ? 'amber' : l === 'Medium' ? 'brand' : 'slate'}>{l}</Badge>
                <p className="mt-2 text-[11.5px] leading-relaxed text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Alert volume" sub="Last 7 days" icon={Activity}>
          <SimpleLine data={[{ d: 'Mon', v: 6 }, { d: 'Tue', v: 9 }, { d: 'Wed', v: 4 }, { d: 'Thu', v: 11 }, { d: 'Fri', v: 7 }, { d: 'Sat', v: 5 }, { d: 'Sun', v: 3 }]} k="v" name="Alerts" color="#e11d48" height={170} />
        </Panel>
      </div>
    </div>
  )
}

function Coordination() {
  const { appts, updateAppt, toast } = useApp()
  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <Panel title="Patient movement" sub="Move patients between departments and update status" icon={CalendarDays}>
        <Table head={['Appointment', 'Patient', 'Department', 'Doctor', 'Time', 'Status', 'Action']}>
          {appts.map((a) => (
            <tr key={a.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 text-[11.5px] font-bold text-slate-700">{a.id}</td>
              <td className="px-4 py-3 text-[12px] font-semibold text-slate-800">{a.patient}</td>
              <td className="px-4 py-3 text-[12px] text-slate-600">{a.dept}</td>
              <td className="px-4 py-3 text-[12px] text-slate-600">{a.doctor}</td>
              <td className="px-4 py-3 text-[12px] tabular-nums text-slate-600">{a.time}</td>
              <td className="px-4 py-3"><Badge tone={a.status === 'COMPLETED' ? 'green' : a.status === 'WAITING' ? 'amber' : 'brand'}>{a.status}</Badge></td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5">
                  {a.status === 'BOOKED' && <button onClick={() => { updateAppt(a.id, { status: 'CHECKED-IN' }); toast(`${a.patient} checked in.`, 'success') }} className="btn btn-soft btn-sm">Check in</button>}
                  {a.status === 'CHECKED-IN' && <button onClick={() => { updateAppt(a.id, { status: 'WAITING' }); toast(`${a.patient} added to the queue.`, 'success') }} className="btn btn-amber-soft btn-sm">Queue</button>}
                  {a.status === 'WAITING' && <button onClick={() => { updateAppt(a.id, { status: 'COMPLETED' }); toast(`${a.patient} consultation completed.`, 'success') }} className="btn btn-green btn-sm">Complete</button>}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <div className="space-y-5">
        <Panel title="Department load" icon={Users}>
          {[['General Medicine', 72], ['Cardiology', 48], ['Pediatrics', 39], ['Orthopedics', 55], ['Emergency', 86]].map(([d, v]) => (
            <div key={d as string} className="mb-3"><div className="flex items-center justify-between"><p className="text-[12px] font-bold text-slate-700">{d}</p><p className="text-[12px] font-extrabold text-slate-900">{v}%</p></div>
              <div className="mt-1.5"><Bar value={v as number} tone={(v as number) > 80 ? 'red' : (v as number) > 60 ? 'amber' : 'green'} showPct={false} height={6} /></div></div>
          ))}
        </Panel>
        <Panel title="Transfer checklist" icon={ClipboardList}>
          <ul className="space-y-2.5">
            {['Confirm the receiving department accepts the patient.', 'Transfer the medication chart and allergy record with the patient.', 'Notify the patient\u2019s family where required.', 'Update the queue token and bed status in the system.', 'Document the transfer time and responsible nurse.'].map((x) => (
              <li key={x} className="flex items-start gap-2.5 text-[12px] leading-relaxed text-slate-600"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-teal-600" /> {x}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}

function Messages() {
  const { toast } = useApp()
  const [thread, setThread] = useState([
    { from: 'Dr. Imran Qureshi', role: 'Cardiology', text: 'Please repeat the BP for bed A-102 every 2 hours and inform me if systolic stays above 145.', time: '10:04 AM' },
    { from: 'Sr. Anjali Verma', role: 'Ward A', text: 'Noted, doctor. Reading at 10:20 was 148/94 with pulse 104. Patient reports mild breathlessness.', time: '10:22 AM' },
    { from: 'Dr. Imran Qureshi', role: 'Cardiology', text: 'Thank you. I will review at the bedside shortly. Keep oxygen ready but do not start unless SpO₂ falls below 94%.', time: '10:25 AM' },
  ])
  const [text, setText] = useState('')
  const send = () => {
    if (!text.trim()) return
    setThread((t) => [...t, { from: 'Sr. Anjali Verma', role: 'Ward A', text, time: '10:31 AM' }])
    setText('')
    toast('Message delivered to the clinical team.', 'success')
  }
  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <Panel title="Secure clinical messaging" sub="Ward A ↔ Cardiology" icon={MessageSquare}>
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {thread.map((m, i) => {
            const mine = m.from.startsWith('Sr.')
            return (
              <div key={i} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[80%] rounded-2xl px-4 py-3', mine ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-800')}>
                  <p className={cn('text-[11px] font-bold', mine ? 'text-brand-100' : 'text-slate-500')}>{m.from} · {m.role}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed">{m.text}</p>
                  <p className={cn('mt-1 text-[10.5px]', mine ? 'text-brand-200' : 'text-slate-400')}>{m.time}</p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex gap-2">
          <Input value={text} onChange={(e: any) => setText(e.target.value)} placeholder="Type a clinical message…" onKeyDown={(e: any) => e.key === 'Enter' && send()} />
          <button onClick={send} className="btn btn-primary"><Send size={14} /></button>
        </div>
        <div className="mt-3"><AiDisclaimer text="Messages in this demo are not transmitted anywhere. In production they are encrypted in transit and at rest, with full audit logging." /></div>
      </Panel>
      <div className="space-y-5">
        <Panel title="Care team" icon={Users}>
          <div className="space-y-2.5">
            {DOCTORS.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <Img src={d.img} alt={d.name} className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="min-w-0"><p className="truncate text-[12px] font-bold text-slate-800">{d.name}</p><p className="text-[11px] text-slate-500">{d.role}</p></div>
                <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Ward imagery" icon={Heart}>
          <Img src={IMG.heroNurse} alt="Nursing care" ratio="16/9" className="rounded-xl" />
        </Panel>
      </div>
    </div>
  )
}

function EmergencyNotes() {
  const { emergencies, toast } = useApp()
  return (
    <div className="space-y-5">
      <Panel title="Incoming emergencies" sub={`${emergencies.length} active`} icon={Ambulance}>
        <div className="space-y-3">
          {emergencies.map((e) => (
            <div key={e.id} className={cn('rounded-xl border p-4', e.priority === 'CRITICAL' ? 'border-rose-200 bg-rose-50/60' : 'border-slate-200')}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[13.5px] font-extrabold text-slate-900">{e.type}</p>
                  <p className="mt-0.5 text-[11.5px] text-slate-600">{e.patient} · {e.location} · reported {e.reported}</p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-slate-700">{e.reason}</p>
                </div>
                <div className="text-right">
                  <Badge tone={e.priority === 'CRITICAL' ? 'red' : e.priority === 'HIGH' ? 'amber' : 'slate'}>{e.priority}</Badge>
                  <p className="mt-1.5 text-[11.5px] font-bold text-slate-700">{e.ambulance} · ETA {e.eta}</p>
                  <p className="text-[11px] text-slate-500">{e.status}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => toast(`Resuscitation bay prepared for ${e.patient}.`, 'success')} className="btn btn-danger btn-sm">Prepare resus bay</button>
                <button onClick={() => toast('Duty doctor alerted with pre-arrival details.', 'success')} className="btn btn-soft btn-sm">Alert duty doctor</button>
                <button onClick={() => toast('Handover checklist opened.', 'info')} className="btn btn-ghost btn-sm">Handover checklist</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Pre-arrival preparation" icon={Siren}>
          <ul className="space-y-2.5">
            {['Confirm the resuscitation bay is clear and equipment is checked.', 'Verify oxygen, suction and monitoring are functional.', 'Prepare the trauma trolley and relevant drug packs.', 'Assign a receiving nurse and confirm the airway plan.', 'Log the ambulance arrival time on the emergency register.'].map((x) => (
              <li key={x} className="flex items-start gap-2.5 text-[12px] leading-relaxed text-slate-600"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-teal-600" /> {x}</li>
            ))}
          </ul>
        </Panel>
        <Panel title="Emergency imagery" icon={Ambulance}>
          <Img src={IMG.hospital} alt="Emergency department" ratio="16/9" className="rounded-xl" />
        </Panel>
      </div>
      <AiDisclaimer text="Emergency notifications in this demo use synthetic data. Always activate your institution's real emergency protocol and local emergency number in a genuine emergency." />
    </div>
  )
}
