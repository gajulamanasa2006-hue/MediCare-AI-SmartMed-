/* =====================================================================
   PATIENT PORTAL — Advanced personalized healthcare (additive)
   My Hospital Stay · Recovery Tracker · Report Explainer · Family Guardian
   ===================================================================== */
import React, { useMemo, useState } from 'react'
import {
  Activity, BadgeCheck, BedDouble, CalendarDays, CheckCircle2, ClipboardList, Clock,
  FileText, FlaskConical, Heart, HeartPulse, Info, Lock, Mail, Pill, Plus, ShieldCheck,
  Sparkles, Stethoscope, Trash2, TrendingUp, TriangleAlert, Upload, UserPlus, Users, X,
} from 'lucide-react'
import { Panel, KpiRow } from '../../components/PortalLayout'
import { AiDisclaimer, Badge, Btn, Empty, Field, Input, KV, Modal, Select, Table, Textarea, cn, statusTone, Ring } from '../../components/ui'
import { BpChart, SimpleLine, Donut, AdherenceBars } from '../../components/charts'
import { useClinical } from '../../context/ClinicalContext'
import { useApp } from '../../context/AppContext'
import { PATIENT, MEDS, VITALS } from '../../data/mock'
import { LAB_PARAMS, news2 } from '../../lib/icu'

/* ------------------------------------------------------------------ 1. My Hospital Stay */
export function MyHospitalStay() {
  const { icu, labRequests, timeline, alerts, dispatch } = useClinical()
  const { meds, appts } = useApp()
  const me = icu.find((p) => p.portalPatient) || icu[0]
  const released = labRequests.filter((l) => l.releasedToPatient || l.status === 'Report Available')
  const events = timeline.filter((e) => e.patientId === me?.id && e.released)

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl grad-navy p-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-teal-300">Current admission</p>
            <h3 className="mt-1 text-[19px] font-extrabold">Admitted · {me?.bed}</h3>
            <p className="mt-0.5 text-[12px] text-slate-300">{me?.ward} · {me?.diagnosis}</p>
            <p className="mt-1 text-[11px] text-slate-400">Admitted {me?.admittedAt} · Consultant {me?.doctor}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-center backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Monitoring</p>
            <p className="text-[13px] font-extrabold">{me ? news2(me.vitals).level : '—'}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ['Bed', me?.bed], ['Ward', me?.ward?.replace('ICU · ', '')], ['Nurse', me?.nurse], ['Doctor', me?.doctor],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-white/10 px-2.5 py-2">
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-teal-300">{k}</p>
              <p className="truncate text-[11.5px] font-semibold">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <KpiRow items={[
        { label: 'Admission status', value: 'In hospital', sub: me?.ward || '', icon: BedDouble, tone: 'brand' },
        { label: 'Approved updates', value: events.length, sub: 'Released by your care team', icon: ClipboardList, tone: 'teal' },
        { label: 'Released reports', value: released.length, sub: 'Verified laboratory results', icon: FlaskConical, tone: 'green' },
        { label: 'Ambulance link', value: dispatch ? 'Active' : 'None', sub: dispatch?.ambulanceId || 'No dispatch for you', icon: Activity, tone: dispatch ? 'amber' : 'slate' },
      ]} />

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel title="Upcoming scheduled care" sub="Confirmed by the ward team" icon={CalendarDays}>
          <div className="space-y-2">
            {[
              { t: 'Hourly observations', d: 'Today · every hour', who: me?.nurse },
              { t: 'Respiratory review', d: 'Today · 16:30', who: me?.doctor },
              { t: 'Nebulisation', d: 'Today · 18:00', who: me?.nurse },
              { t: 'Discharge planning chat', d: 'Tomorrow · 10:00', who: 'Ward coordinator' },
            ].map((x) => (
              <div key={x.t} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-50 text-teal-600"><Clock size={14} /></span>
                <div><p className="text-[12px] font-bold text-slate-800">{x.t}</p><p className="text-[10.5px] text-slate-500">{x.d} · {x.who}</p></div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Medication schedule" sub="What the ward is giving you right now" icon={Pill}>
          <div className="space-y-2">
            {['Salbutamol nebulisation — 4-hourly', 'Hydrocortisone 100 mg IV — 8-hourly', 'Oxygen 4 L/min via nasal prongs', 'Paracetamol 1 g — as required for fever'].map((m) => (
              <div key={m} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11.5px] text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />{m}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Released laboratory reports" sub="Only results approved for patient release" icon={FlaskConical}>
          <div className="space-y-2">
            {released.map((r) => (
              <div key={r.id} className="rounded-lg border border-slate-200 px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold text-slate-800">{r.panel}</p>
                  <Badge tone={r.critical ? 'amber' : 'green'}>{r.releasedToPatient ? 'Released' : 'Available'}</Badge>
                </div>
                <p className="text-[10.5px] text-slate-500">{r.id} · {new Date(r.requestedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                {r.values && <p className="mt-1 text-[10.5px] text-slate-600">{r.values.map((v) => `${LAB_PARAMS.find((p) => p.key === v.key)?.name || v.key}: ${v.value}`).join(' · ')}</p>}
              </div>
            ))}
            {!released.length && <Empty title="No reports released yet" sub="Verified results appear here once your care team approves them." icon={FlaskConical} />}
          </div>
        </Panel>

        <Panel title="Approved hospital updates" sub="Written by your clinical team, released to you" icon={BadgeCheck}>
          <div className="space-y-2">
            {events.slice(0, 5).map((e) => (
              <div key={e.id} className="rounded-lg border-l-2 border-teal-400 bg-slate-50 px-3 py-2">
                <p className="text-[11.5px] font-bold text-slate-800">{e.title}</p>
                {e.detail && <p className="text-[10.5px] text-slate-600">{e.detail}</p>}
                <p className="text-[10px] text-slate-400">{new Date(e.at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · {e.actor}</p>
              </div>
            ))}
            {!events.length && <p className="text-[11.5px] text-slate-500">No updates released yet.</p>}
          </div>
        </Panel>
      </div>

      <p className="rounded-lg bg-slate-50 px-3.5 py-2.5 text-[10.5px] leading-relaxed text-slate-500">
        Synthetic demonstration data. Internal clinical notes stay hidden until a clinician explicitly releases them.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ 2. Recovery tracker */
const CHECKLIST = [
  'Take inhaler / nebuliser as prescribed',
  'Record morning and evening peak flow',
  'Walk for 10 minutes twice a day',
  'Attend the respiratory follow-up',
  'Keep the rescue inhaler within reach at night',
]

export function RecoveryTracker() {
  const { timeline } = useClinical()
  const { meds } = useApp()
  const [done, setDone] = useState<number[]>([0, 2])
  const [symptoms, setSymptoms] = useState<any[]>([])
  const [sym, setSym] = useState({ label: 'Breathlessness', severity: '2' })

  const pct = Math.round((done.length / CHECKLIST.length) * 100)
  const adherence = 88
  const recovery = [
    { d: 'Day 1', w: 20 }, { d: 'Day 2', w: 34 }, { d: 'Day 3', w: 52 },
    { d: 'Day 4', w: 61 }, { d: 'Day 5', w: 74 }, { d: 'Today', w: 86 },
  ]

  return (
    <div className="space-y-5">
      <KpiRow items={[
        { label: 'Recovery score', value: `${pct}%`, sub: 'Checklist completeness', icon: TrendingUp, tone: 'teal' },
        { label: 'Medication adherence', value: `${adherence}%`, sub: 'Last 7 days', icon: Pill, tone: 'green' },
        { label: 'Follow-ups due', value: 2, sub: 'Respiratory + phlebotomy', icon: CalendarDays, tone: 'amber' },
        { label: 'Symptoms logged', value: symptoms.length, sub: 'Self-recorded', icon: Activity, tone: 'brand' },
      ]} />

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel title="Recovery checklist" sub="Clinician-configured, tick things off as you go" icon={CheckCircle2}>
          <div className="space-y-2">
            {CHECKLIST.map((c, i) => {
              const on = done.includes(i)
              return (
                <button key={c} onClick={() => setDone((d) => on ? d.filter((x) => x !== i) : [...d, i])}
                  className={cn('flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-[11.5px]',
                    on ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800' : 'border-slate-200 text-slate-700')}>
                  <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-md border', on ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300')}>{on && '✓'}</span>
                  {c}
                </button>
              )
            })}
          </div>
          <div className="mt-3"><div className="progress"><span style={{ width: `${pct}%` }} /></div></div>
          <p className="mt-1.5 text-[10.5px] text-slate-500">{pct}% of your recovery actions completed.</p>
        </Panel>

        <Panel title="Recovery progress" sub="Composite score over the last five days" icon={TrendingUp}>
          <SimpleLine data={recovery} k="w" name="Recovery" unit="%" color="#0d9488" height={180} domain={[0, 100]} />
          <AdherenceBars data={[{ d: 'Mon', v: 80 }, { d: 'Tue', v: 90 }, { d: 'Wed', v: 100 }, { d: 'Thu', v: 85 }, { d: 'Fri', v: 95 }]} height={150} />
        </Panel>

        <Panel title="Log a symptom" sub="Shared with your care team for review" icon={Activity}>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Field label="Symptom"><Select value={sym.label} onChange={(e: any) => setSym({ ...sym, label: e.target.value })}>
              {['Breathlessness', 'Cough', 'Fever', 'Chest tightness', 'Fatigue', 'Poor sleep'].map((s) => <option key={s}>{s}</option>)}
            </Select></Field>
            <Field label="Severity (1–5)"><Select value={sym.severity} onChange={(e: any) => setSym({ ...sym, severity: e.target.value })}>
              {['1', '2', '3', '4', '5'].map((s) => <option key={s}>{s}</option>)}
            </Select></Field>
          </div>
          <button onClick={() => setSymptoms((s) => [{ ...sym, at: Date.now() }, ...s])} className="btn btn-primary mt-3 w-full"><Plus size={14} /> Record symptom</button>
          <div className="mt-3 space-y-1.5">
            {symptoms.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-[11.5px]">
                <span className="text-slate-700">{s.label}</span>
                <Badge tone={Number(s.severity) >= 4 ? 'red' : 'amber'}>severity {s.severity}</Badge>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Follow-up appointments" sub="Booked and confirmed" icon={CalendarDays}>
          <div className="space-y-2">
            {[['Respiratory follow-up', 'Dr. Priya Nair', '04 Nov 2026 · 11:00'], ['Spirometry test', 'Pulmonology lab', '06 Nov 2026 · 09:30']].map(([t, w, d]) => (
              <div key={t} className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-[12px] font-bold text-slate-800">{t}</p>
                <p className="text-[10.5px] text-slate-500">{w} · {d}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2">
            <p className="text-[11px] font-bold text-teal-900">Clinician instructions</p>
            <p className="mt-0.5 text-[10.5px] leading-relaxed text-teal-800">
              Continue the inhaled steroid for 4 weeks. Return immediately if reliever use exceeds 4 times a day or
              SpO₂ falls below 94%. (Configured by your clinician — demonstration text.)
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ 3. Report explainer */
export function ReportExplainer() {
  const { labRequests } = useClinical()
  const [file, setFile] = useState<string>('')
  const [text, setText] = useState('')
  const [explained, setExplained] = useState(false)

  const glossary = [
    { t: 'Haemoglobin (Hb)', p: 'The red protein that carries oxygen around your body.' },
    { t: 'White blood cell count (WBC)', p: 'Cells that fight infection. A higher number can mean your body is fighting something.' },
    { t: 'Platelets', p: 'Tiny cells that help your blood to clot and stop bleeding.' },
    { t: 'Creatinine', p: 'A waste product filtered by your kidneys — a marker of kidney function.' },
    { t: 'CRP', p: 'C-reactive protein; a general marker of inflammation in the body.' },
  ]
  const explainedRows = [
    { name: 'Haemoglobin', value: 9.4, unit: 'g/dL', ref: '12.0–16.0', low: true },
    { name: 'White cell count', value: 18.2, unit: '×10⁹/L', ref: '4.0–11.0', high: true },
    { name: 'Platelet count', value: 168, unit: '×10⁹/L', ref: '150–400', low: false },
    { name: 'Creatinine', value: 2.3, unit: 'mg/dL', ref: '0.6–1.2', high: true },
  ]

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel title="Upload a report" sub="PDF or image of a laboratory report (synthetic demo)" icon={Upload}>
          <label className="grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-4 py-8 text-center hover:border-brand-400">
            <Upload size={22} className="text-brand-500" />
            <p className="mt-2 text-[12px] font-semibold text-slate-700">{file || 'Choose a report file'}</p>
            <p className="text-[10.5px] text-slate-500">PDF, PNG or JPG · text is extracted and explained</p>
            <input type="file" className="hidden" onChange={(e) => { setFile(e.target.files?.[0]?.name || ''); setExplained(false) }} />
          </label>
          <Field label="…or paste report text">
            <Textarea rows={4} value={text} onChange={(e: any) => setText(e.target.value)} placeholder="Hb 9.4 g/dL, WBC 18.2 ×10⁹/L, platelets 168, creatinine 2.3 mg/dL…" />
          </Field>
          <button onClick={() => setExplained(true)} className="btn btn-primary mt-3 w-full"><Sparkles size={14} /> Extract & explain</button>
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10.5px] leading-relaxed text-amber-900">
            AI-generated explanations are clearly separated from verified laboratory data. They explain terminology only —
            they never diagnose a condition or recommend treatment.
          </div>
        </Panel>

        <Panel title="Verified report values" sub="Source: laboratory information system (synthetic)" icon={BadgeCheck}>
          {explained ? (
            <Table head={['Measurement', 'Your value', 'Reference', 'Flag']}>
              {explainedRows.map((r) => (
                <tr key={r.name} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2.5 text-[11.5px] font-semibold text-slate-800">{r.name}</td>
                  <td className="px-3 py-2.5 text-[11.5px] tabular-nums text-slate-700">{r.value} {r.unit}</td>
                  <td className="px-3 py-2.5 text-[11px] tabular-nums text-slate-500">{r.ref}</td>
                  <td className="px-3 py-2.5">{r.low || r.high ? <Badge tone="amber">{r.low ? 'Below range' : 'Above range'}</Badge> : <Badge tone="green">In range</Badge>}</td>
                </tr>
              ))}
            </Table>
          ) : <Empty title="Nothing extracted yet" sub="Upload or paste a report to see verified values alongside plain-language explanations." icon={FileText} />}
        </Panel>
      </div>

      {explained && (
        <>
          <Panel title="What these words mean" sub="AI-generated plain-language glossary · not a diagnosis" icon={Sparkles}
            right={<Badge tone="amber">AI explanation</Badge>}>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {glossary.map((g) => (
                <div key={g.t} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-[12px] font-bold text-slate-800">{g.t}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{g.p}</p>
                </div>
              ))}
            </div>
            <AiDisclaimer />
          </Panel>

          <Panel title="Previous vs current measurements" sub="Same assay, four collection points" icon={TrendingUp}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { n: 'Haemoglobin', d: [{ d: 'Aug', v: 13.2 }, { d: 'Sep', v: 12.4 }, { d: 'Oct', v: 11.1 }, { d: 'Now', v: 9.4 }], c: '#2563eb' },
                { n: 'WBC', d: [{ d: 'Aug', v: 7.1 }, { d: 'Sep', v: 9.8 }, { d: 'Oct', v: 14.2 }, { d: 'Now', v: 18.2 }], c: '#f59e0b' },
                { n: 'Platelets', d: [{ d: 'Aug', v: 262 }, { d: 'Sep', v: 248 }, { d: 'Oct', v: 214 }, { d: 'Now', v: 168 }], c: '#e11d48' },
                { n: 'Creatinine', d: [{ d: 'Aug', v: 0.9 }, { d: 'Sep', v: 1.1 }, { d: 'Oct', v: 1.6 }, { d: 'Now', v: 2.3 }], c: '#7c3aed' },
              ].map((p) => (
                <div key={p.n}>
                  <p className="mb-1 text-[11px] font-bold text-slate-700">{p.n}</p>
                  <SimpleLine data={p.d} k="v" name={p.n} color={p.c} height={130} />
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ 4. Family Health Guardian */
export function FamilyGuardian() {
  const { family, inviteFamily, togglePerm, revokeFamily } = useClinical()
  const [form, setForm] = useState({ name: '', relation: 'Spouse', email: '' })

  const PERMS: { k: 'meds' | 'reports' | 'appts' | 'stay' | 'emergency'; l: string }[] = [
    { k: 'meds', l: 'Medications' }, { k: 'reports', l: 'Lab reports' }, { k: 'appts', l: 'Appointments' },
    { k: 'stay', l: 'Hospital stay' }, { k: 'emergency', l: 'Emergency contact' },
  ]

  return (
    <div className="space-y-5">
      <KpiRow items={[
        { label: 'Trusted people', value: family.filter((f) => f.status === 'Active').length, sub: `${family.filter((f) => f.status === 'Invited').length} pending invitation`, icon: Users, tone: 'brand' },
        { label: 'Consent scopes', value: PERMS.length, sub: 'Granular per-person control', icon: ShieldCheck, tone: 'teal' },
        { label: 'Revoked', value: family.filter((f) => f.status === 'Revoked').length, sub: 'Access withdrawn', icon: Lock, tone: 'slate' },
        { label: 'Emergency contacts', value: family.filter((f) => f.perms.emergency && f.status === 'Active').length, sub: 'Notified on dispatch', icon: Heart, tone: 'red' },
      ]} />

      <div className="grid gap-5 xl:grid-cols-[1fr_1.35fr]">
        <Panel title="Invite a family member" sub="They receive a consent request before seeing anything" icon={UserPlus}>
          <div className="grid gap-2.5">
            <Field label="Full name"><Input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ramesh R" /></Field>
            <Field label="Relationship"><Select value={form.relation} onChange={(e: any) => setForm({ ...form, relation: e.target.value })}>
              {['Spouse', 'Father', 'Mother', 'Sibling', 'Guardian', 'Caregiver'].map((r) => <option key={r}>{r}</option>)}
            </Select></Field>
            <Field label="Email"><Input value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" /></Field>
            <button
              onClick={() => { if (!form.name.trim() || !form.email.trim()) return; inviteFamily({ ...form, perms: { meds: true, reports: false, appts: true, stay: true, emergency: true } }); setForm({ name: '', relation: 'Spouse', email: '' }) }}
              className="btn btn-primary mt-1"><Mail size={14} /> Send invitation</button>
          </div>
          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[10.5px] leading-relaxed text-slate-600">
            No health information is shared until the invited person accepts and you switch the relevant scope on.
          </div>
        </Panel>

        <Panel title="Consent management" sub="Toggle exactly what each person can see" icon={ShieldCheck}>
          <div className="space-y-3">
            {family.map((m) => (
              <div key={m.id} className={cn('rounded-xl border p-3.5', m.status === 'Revoked' ? 'border-slate-200 bg-slate-50 opacity-70' : 'border-slate-200')}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[12.5px] font-extrabold text-slate-900">{m.name} <span className="text-[11px] font-semibold text-slate-400">· {m.relation}</span></p>
                    <p className="text-[10.5px] text-slate-500">{m.email}</p>
                  </div>
                  <Badge tone={m.status === 'Active' ? 'green' : m.status === 'Invited' ? 'amber' : 'slate'}>{m.status}</Badge>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {PERMS.map((p) => {
                    const on = m.perms[p.k]
                    return (
                      <button key={p.k} disabled={m.status === 'Revoked'} onClick={() => togglePerm(m.id, p.k)}
                        className={cn('rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition disabled:opacity-40',
                          on ? 'border-teal-300 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-500')}>
                        {on ? '✓ ' : '✕ '}{p.l}
                      </button>
                    )
                  })}
                </div>
                {m.status !== 'Revoked' && (
                  <button onClick={() => revokeFamily(m.id)} className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-bold text-rose-600">
                    <Trash2 size={11} /> Revoke access
                  </button>
                )}
              </div>
            ))}
            {!family.length && <Empty title="No family members yet" sub="Invite someone you trust to help manage your care." icon={Users} />}
          </div>
        </Panel>
      </div>

      <Panel title="What a guardian can see" sub="Scopes map directly onto patient-portal sections" icon={Info}>
        <KV cols={3} items={[
          { k: 'Medications', v: 'Dose schedule + adherence only' },
          { k: 'Lab reports', v: 'Released results only' },
          { k: 'Appointments', v: 'Dates, times, department' },
          { k: 'Hospital stay', v: 'Ward, bed, approved updates' },
          { k: 'Emergency contact', v: 'Called on ambulance dispatch' },
          { k: 'Never shared', v: 'Internal notes, clinician discussions' },
        ]} />
      </Panel>
    </div>
  )
}
