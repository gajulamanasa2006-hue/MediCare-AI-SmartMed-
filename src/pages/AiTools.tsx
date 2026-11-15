import React, { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, AlertTriangle, ArrowRight, BadgeCheck, BrainCircuit, Calculator, CheckCircle2, ClipboardCheck,
  FileCheck2, FileSearch, FileText, Heart, Info, Layers, Lightbulb, Pill, ScanLine, Search, ShieldAlert,
  ShieldCheck, Sparkles, Stethoscope, Upload, UploadCloud, X, Zap, FlaskConical, Gauge, Bell,
} from 'lucide-react'
import { PageHero } from '../components/PublicShell'
import {
  AiDisclaimer, Badge, Bar, Btn, Empty, Field, Img, Input, KV, Ring, SectionHead, Select, Table, Tabs,
  Textarea, TriageDisclaimer, cn,
} from '../components/ui'
import { AdherenceBars, Donut, SimpleLine } from '../components/charts'
import { IMG, MED_INFO, PATIENT, VITALS } from '../data/mock'
import { analyseMeds, healthScore, simulateOCR, triageSymptoms } from '../lib/ai'
import { useApp } from '../context/AppContext'

/* =====================================================================
   AI HEALTH TOOLS — five interactive, demo-safe AI assistants
   A. Medication Safety · B. Symptom Assistant · C. Report OCR
   D. Lab Report Analysis · E. AI Health Score
   ===================================================================== */

const URGENCY: Record<string, { tone: string; bar: string; label: string }> = {
  CRITICAL: { tone: 'bg-rose-50 text-rose-700 border-rose-200', bar: 'bg-rose-500', label: 'Emergency — seek immediate care' },
  HIGH: { tone: 'bg-amber-50 text-amber-800 border-amber-200', bar: 'bg-amber-500', label: 'Urgent — within 24 hours' },
  MEDIUM: { tone: 'bg-brand-50 text-brand-800 border-brand-200', bar: 'bg-brand-500', label: 'Prompt — within 2–3 days' },
  LOW: { tone: 'bg-emerald-50 text-emerald-800 border-emerald-200', bar: 'bg-emerald-500', label: 'Routine — scheduled consultation' },
}

export default function AiTools() {
  const { meds, reports, pushNotif, toast } = useApp()
  const [tab, setTab] = useState('medication')

  const tabs = [
    { id: 'medication', label: 'AI Medication Safety' },
    { id: 'symptom', label: 'AI Symptom Assistant' },
    { id: 'ocr', label: 'Medical Report OCR' },
    { id: 'lab', label: 'AI Lab Report Analysis' },
    { id: 'score', label: 'AI Health Score' },
  ]

  return (
    <>
      <PageHero
        eyebrow="SmartMed AI Health Tools"
        title={<>Five AI assistants, <span className="text-teal-600">one safety-first design</span></>}
        sub="Screen a medication plan for interactions and allergy conflicts, estimate the urgency of symptoms, extract text from any medical document, decode a lab report into plain language, and track a composite health score. Every tool is interactive in this demo."
      >
        <div className="flex flex-wrap gap-3">
          <Link to="/portal/patient" className="btn btn-primary btn-lg">Open in patient portal <ArrowRight size={15} /></Link>
          <Link to="/appointments" className="btn btn-ghost btn-lg">Book a consultation</Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {['Runs on a rule-based demo engine', 'No data leaves your browser', 'Assistance only — not a diagnosis'].map((x) => (
            <span key={x} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-slate-600">
              <CheckCircle2 size={12} className="text-teal-600" /> {x}
            </span>
          ))}
        </div>
      </PageHero>

      <section className="border-b border-slate-200 bg-white py-5">
        <div className="container-x"><Tabs tabs={tabs} value={tab} onChange={setTab} /></div>
      </section>

      <section className="container-x py-12">
        {tab === 'medication' && <MedicationSafety />}
        {tab === 'symptom' && <SymptomAssistant />}
        {tab === 'ocr' && <ReportOcr />}
        {tab === 'lab' && <LabAnalysis />}
        {tab === 'score' && <HealthScore />}
      </section>

      {/* discovery grid */}
      <section className="border-t border-slate-200 bg-slate-50 py-14">
        <div className="container-x">
          <SectionHead eyebrow="Where these tools live" title="AI is embedded across the whole platform" sub="The same engines appear inside the portals so clinicians and patients never need a separate app." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { i: Pill, t: 'Medication safety', d: 'Screening runs automatically on every new prescription.', to: '/portal/doctor', tone: 'bg-teal-50 text-teal-600' },
              { i: FileSearch, t: 'Report analysis', d: 'OCR and interpretation available on each lab report row.', to: '/portal/patient', tone: 'bg-brand-50 text-brand-600' },
              { i: Ambulance, t: 'Emergency triage', d: 'Priority scoring on every emergency request.', to: '/emergency', tone: 'bg-rose-50 text-rose-600' },
              { i: Gauge, t: 'Health score', d: 'Composite score on the patient dashboard and health twin.', to: '/portal/patient', tone: 'bg-violet-50 text-violet-600' },
            ].map((x) => (
              <Link key={x.t} to={x.to} className="card card-hover p-5">
                <span className={cn('grid h-11 w-11 place-items-center rounded-xl', x.tone)}><x.i size={19} /></span>
                <h3 className="mt-4 text-[13.5px] font-bold text-slate-900">{x.t}</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-600">{x.d}</p>
              </Link>
            ))}
          </div>
          <div className="mt-8">
            <AiDisclaimer text="AI-generated information across all SmartMed tools is for assistance and education only. It does not replace professional medical advice, diagnosis or treatment. Always confirm with a qualified clinician or pharmacist before changing any medication." />
          </div>
        </div>
      </section>
    </>
  )
}

function Ambulance(props: any) {
  return <AlertTriangle {...props} />
}

/* =========================================================== A. MEDICATION SAFETY */
function MedicationSafety() {
  const { toast, pushNotif, meds } = useApp()
  const [rows, setRows] = useState([
    { name: 'Dolo 650', dose: '650 mg', freq: 'Twice daily', meal: 'After food' },
    { name: 'Brufen 400', dose: '400 mg', freq: 'Twice daily', meal: 'After food' },
  ])
  const [allergies, setAllergies] = useState('Peanuts, Penicillin, Ibuprofen')
  const [conditions, setConditions] = useState('Iron-deficiency anaemia, subclinical hypothyroidism')
  const [result, setResult] = useState<ReturnType<typeof analyseMeds> | null>(null)
  const [running, setRunning] = useState(false)

  const setRow = (i: number, k: string, v: string) => setRows((r) => r.map((x, k2) => (k2 === i ? { ...x, [k]: v } : x)))

  const run = () => {
    const list = rows.map((r) => r.name.trim()).filter(Boolean)
    if (!list.length) { toast('Add at least one medicine name to screen.', 'error'); return }
    setRunning(true)
    setTimeout(() => {
      const res = analyseMeds({ meds: list, allergies: allergies.split(',').map((a) => a.trim()), conditions })
      setResult(res)
      setRunning(false)
      pushNotif({
        cat: 'Medication',
        title: res.level === 'High' ? 'Medication safety check flagged issues' : 'Medication safety check completed',
        body: res.summary[0],
        tone: res.level === 'High' ? 'red' : res.level === 'Moderate' ? 'amber' : 'green',
      })
      toast(`Screening complete — risk level ${res.level}.`, res.level === 'High' ? 'warn' : 'success')
    }, 700)
  }

  const existing = meds.filter((m) => m.status === 'Active')

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
      <div className="space-y-5">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-600"><Pill size={20} /></span>
            <div>
              <h2 className="text-[16px] font-extrabold text-slate-900">AI Medication Safety</h2>
              <p className="text-[12px] text-slate-500">Enter or upload your medicines for interaction, duplication and allergy screening.</p>
            </div>
          </div>

          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Medicines to screen</p>
          <div className="mt-3 space-y-2.5">
            {rows.map((r, i) => (
              <div key={i} className="grid gap-2.5 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1.4fr_0.8fr_1fr_0.9fr_auto]">
                <Input value={r.name} onChange={(e: any) => setRow(i, 'name', e.target.value)} placeholder="Medicine name" />
                <Input value={r.dose} onChange={(e: any) => setRow(i, 'dose', e.target.value)} placeholder="Dosage" />
                <Input value={r.freq} onChange={(e: any) => setRow(i, 'freq', e.target.value)} placeholder="Frequency" />
                <Select value={r.meal} onChange={(e: any) => setRow(i, 'meal', e.target.value)} className="input">
                  {['After food', 'Before food', 'With food', 'Empty stomach'].map((m) => <option key={m}>{m}</option>)}
                </Select>
                <button onClick={() => setRows((x) => x.filter((_, k) => k !== i))} className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <button onClick={() => setRows((r) => [...r, { name: '', dose: '', freq: '', meal: 'After food' }])} className="btn btn-ghost btn-sm">+ Add medicine</button>
            <label className="btn btn-ghost btn-sm cursor-pointer">
              <UploadCloud size={13} /> Upload prescription
              <input type="file" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) { toast(`"${f.name}" attached — OCR read it as a prescription with 3 medicines (demo).`, 'info') }
              }} />
            </label>
            <button onClick={() => setRows(existing.map((m) => ({ name: m.name, dose: m.strength, freq: m.freq, meal: m.meal })))}
              className="btn btn-teal-soft btn-sm">Load my active medications ({existing.length})</button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Known allergies" hint="Comma separated. Penicillin, NSAIDs, peanuts, sulfa drugs…">
              <Textarea rows={2} value={allergies} onChange={(e: any) => setAllergies(e.target.value)} />
            </Field>
            <Field label="Patient conditions" hint="Pregnancy, kidney disease, diabetes, gastric ulcer…">
              <Textarea rows={2} value={conditions} onChange={(e: any) => setConditions(e.target.value)} />
            </Field>
          </div>

          <button onClick={run} disabled={running} className="btn btn-primary btn-lg mt-6 w-full disabled:opacity-60">
            {running ? <><Zap size={16} className="animate-pulse" /> Screening medicines…</> : <><ShieldCheck size={16} /> Run AI safety screening</>}
          </button>

          <div className="mt-4">
            <AiDisclaimer text="AI-generated information is for assistance only and does not replace professional medical advice. Never start, stop or change a dose based on this output alone." />
          </div>
        </div>

        {/* medication information cards */}
        {result && (
          <div className="card p-6 anim-up">
            <h3 className="text-[14px] font-bold text-slate-900">Medication information</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {result.info.map((m) => (
                <div key={m.name} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-bold text-slate-900">{m.name}</p>
                    <Badge tone={m.cls.includes('Unrecognised') ? 'amber' : 'teal'}>{m.cls}</Badge>
                  </div>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-slate-600"><strong className="text-slate-700">Commonly used for:</strong> {m.uses}</p>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-600"><strong className="text-slate-700">Caution:</strong> {m.caution}</p>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-600"><strong className="text-slate-700">Food:</strong> {m.food}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* result panel */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        {!result ? (
          <div className="card p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><ShieldCheck size={26} /></span>
            <h3 className="mt-4 text-[15px] font-bold text-slate-900">No screening yet</h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">
              Add your medicines, allergies and conditions, then run the check. Results appear here with interactions, duplicate
              therapy warnings, allergy conflicts and dosage reminders.
            </p>
            <div className="mt-5 space-y-2 text-left">
              {['Drug–drug interaction detection', 'Duplicate active-ingredient warnings', 'Allergy conflict screening', 'Dosage & timing reminders', 'Safety recommendations'].map((x) => (
                <p key={x} className="flex items-start gap-2.5 text-[12px] text-slate-600">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-teal-600" /> {x}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className={cn('card overflow-hidden anim-up', result.level === 'High' && 'ring-2 ring-rose-200')}>
              <div className={cn('px-5 py-4', result.level === 'High' ? 'bg-rose-50' : result.level === 'Moderate' ? 'bg-amber-50' : 'bg-emerald-50')}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={cn('grid h-10 w-10 place-items-center rounded-xl text-white', result.level === 'High' ? 'bg-rose-500' : result.level === 'Moderate' ? 'bg-amber-500' : 'bg-emerald-500')}>
                      {result.level === 'High' ? <ShieldAlert size={19} /> : <ShieldCheck size={19} />}
                    </span>
                    <div>
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Overall risk</p>
                      <p className="text-[16px] font-extrabold text-slate-900">{result.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[26px] font-extrabold leading-none text-slate-900">{result.riskScore}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">risk score</p>
                  </div>
                </div>
                <div className="mt-3"><Bar value={result.riskScore} tone={result.level === 'High' ? 'red' : result.level === 'Moderate' ? 'amber' : 'green'} showPct={false} height={7} /></div>
              </div>

              <div className="p-5">
                <p className="text-[12.5px] font-bold text-slate-900">Summary</p>
                <ul className="mt-2.5 space-y-2">
                  {result.summary.map((s) => (
                    <li key={s} className="flex items-start gap-2.5 text-[12px] leading-relaxed text-slate-600">
                      <Info size={13} className="mt-0.5 shrink-0 text-brand-600" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {result.flags.length > 0 && (
              <div className="card p-5 anim-up">
                <div className="flex items-center gap-2.5"><AlertTriangle size={15} className="text-amber-600" /><h3 className="text-[13.5px] font-bold text-slate-900">Possible interactions ({result.flags.length})</h3></div>
                <div className="mt-3.5 space-y-2.5">
                  {result.flags.map((f, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 p-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[12.5px] font-bold text-slate-900">{f.a}</span>
                        <ArrowRight size={12} className="text-slate-400" />
                        <span className="text-[12.5px] font-bold text-slate-900">{f.b}</span>
                        <Badge tone={f.level === 'Severe' ? 'red' : f.level === 'Moderate' ? 'amber' : 'slate'}>{f.level}</Badge>
                      </div>
                      <p className="mt-2 text-[11.5px] leading-relaxed text-slate-600">{f.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.allergyHits.length > 0 && (
              <div className="card p-5 anim-up">
                <div className="flex items-center gap-2.5"><ShieldAlert size={15} className="text-rose-600" /><h3 className="text-[13.5px] font-bold text-slate-900">Allergy conflicts ({result.allergyHits.length})</h3></div>
                <div className="mt-3.5 space-y-2.5">
                  {result.allergyHits.map((a, i) => (
                    <div key={i} className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5">
                      <p className="text-[12.5px] font-bold text-rose-900">{a.med} vs {a.allergen}</p>
                      <p className="mt-1 text-[11.5px] text-rose-800">{a.severity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.duplicates.length > 0 && (
              <div className="card p-5 anim-up">
                <div className="flex items-center gap-2.5"><Layers size={15} className="text-violet-600" /><h3 className="text-[13.5px] font-bold text-slate-900">Duplicate therapy ({result.duplicates.length})</h3></div>
                <div className="mt-3 space-y-2">
                  {result.duplicates.map((d, i) => (
                    <p key={i} className="rounded-lg bg-violet-50 px-3 py-2.5 text-[12px] font-semibold text-violet-900">{d[0]} and {d[1]} — same active ingredient</p>
                  ))}
                </div>
              </div>
            )}

            <div className="card p-5 anim-up">
              <div className="flex items-center gap-2.5"><Bell size={15} className="text-brand-600" /><h3 className="text-[13.5px] font-bold text-slate-900">Dosage reminders & safety recommendations</h3></div>
              <div className="mt-3.5 space-y-2.5">
                {[
                  'Take medicines at the same time each day and keep at least 30 minutes between conflicting products.',
                  'Do not double a missed dose — skip it and continue with the next scheduled dose.',
                  'Finish the full course of any antibiotic even if you feel better earlier.',
                  'Store away from heat and moisture; keep the dispensing label visible.',
                  'Bring this list to every consultation, including outside providers.',
                ].map((r) => (
                  <p key={r} className="flex items-start gap-2.5 text-[12px] leading-relaxed text-slate-600">
                    <Lightbulb size={13} className="mt-0.5 shrink-0 text-amber-500" /> {r}
                  </p>
                ))}
              </div>
              <button onClick={() => { pushNotif({ cat: 'Medication', title: 'Safety report saved to your record', body: 'The medication screening result was filed under your health record (demo).', tone: 'teal' }); toast('Safety report filed in your health record.', 'success') }}
                className="btn btn-teal-soft btn-sm mt-4 w-full">Save report to my record</button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

/* =========================================================== B. SYMPTOM ASSISTANT */
function SymptomAssistant() {
  const [text, setText] = useState('')
  const [age, setAge] = useState('20')
  const [known, setKnown] = useState('Iron-deficiency anaemia')
  const [res, setRes] = useState<ReturnType<typeof triageSymptoms> | null>(null)
  const [busy, setBusy] = useState(false)

  const samples = [
    'Fever for two days with body ache and sore throat',
    'Chest pain and breathlessness while climbing stairs',
    'Recurrent headache with blurred vision and vomiting',
    'Burning sensation while passing urine since yesterday',
  ]

  const run = (t?: string) => {
    const input = t ?? text
    if (input.trim().length < 4) return
    setBusy(true)
    setTimeout(() => {
      setRes(triageSymptoms(input, Number(age), known.split(',').map((k) => k.trim()).filter(Boolean)))
      setBusy(false)
    }, 650)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><Stethoscope size={20} /></span>
          <div>
            <h2 className="text-[16px] font-extrabold text-slate-900">AI Symptom Assistant</h2>
            <p className="text-[12px] text-slate-500">Describe how you feel in your own words — it will suggest concerns, urgency and the right department.</p>
          </div>
        </div>

        <div className="mt-6">
          <Field label="Describe your symptoms" required hint="Mention duration, severity, what makes it better or worse, and any medicine you have taken.">
            <Textarea rows={5} value={text} onChange={(e: any) => setText(e.target.value)}
              placeholder="e.g. I have had a fever for two days with body ache and a sore throat. Paracetamol helped for a few hours. I also feel slightly breathless when I walk fast." />
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {samples.map((s) => (
            <button key={s} onClick={() => { setText(s); run(s) }} className="chip chip-sm hover:border-brand-300 hover:text-brand-700">{s}</button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Age">
            <Input value={age} onChange={(e: any) => setAge(e.target.value)} />
          </Field>
          <Field label="Known conditions">
            <Input value={known} onChange={(e: any) => setKnown(e.target.value)} />
          </Field>
        </div>

        <button onClick={() => run()} disabled={busy} className="btn btn-primary btn-lg mt-6 w-full disabled:opacity-60">
          {busy ? <><BrainCircuit size={16} className="animate-pulse" /> Analysing your description…</> : <><Search size={16} /> Get AI guidance</>}
        </button>

        <div className="mt-4"><TriageDisclaimer /></div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Img src={IMG.digital2} alt="Digital symptom checking" ratio="16/9" className="rounded-xl" />
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-[12.5px] font-bold text-slate-900">When to skip the assistant entirely</p>
            <ul className="mt-2.5 space-y-2">
              {['Chest pain, pressure or pain spreading to the arm or jaw', 'Difficulty breathing or blue lips', 'Sudden weakness, drooping face or slurred speech', 'Uncontrolled bleeding or a deep wound', 'Loss of consciousness, confusion or a seizure', 'Severe abdominal pain with vomiting blood'].map((x) => (
                <li key={x} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-rose-800">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {x}
                </li>
              ))}
            </ul>
            <Link to="/emergency" className="btn btn-danger btn-sm mt-3.5 w-full">Open emergency assistance</Link>
          </div>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        {!res ? (
          <div className="card p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Stethoscope size={26} /></span>
            <h3 className="mt-4 text-[15px] font-bold text-slate-900">Describe your symptoms to begin</h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">
              The assistant returns possible health concerns, an urgency level, the recommended department and a suggested next
              step. It does not confirm a diagnosis.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden anim-up">
            <div className={cn('border-b px-5 py-4', URGENCY[res.level].tone)}>
              <p className="text-[10.5px] font-bold uppercase tracking-wider opacity-70">Urgency level</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-[20px] font-extrabold">{res.level}</p>
                <span className="rounded-lg bg-white/70 px-2.5 py-1 text-[11px] font-bold">{URGENCY[res.level].label}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/60">
                <div className={cn('h-full rounded-full', URGENCY[res.level].bar)} style={{ width: res.level === 'CRITICAL' ? '100%' : res.level === 'HIGH' ? '75%' : res.level === 'MEDIUM' ? '50%' : '25%' }} />
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Possible health concerns</p>
                <ul className="mt-2 space-y-2">
                  {res.concerns.map((c) => (
                    <li key={c} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-slate-700">
                      <Activity size={13} className="mt-0.5 shrink-0 text-brand-600" /> {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-3.5">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Recommended department</p>
                  <p className="mt-1 text-[13px] font-bold text-slate-900">{res.dept}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3.5">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Suggested next step</p>
                  <p className="mt-1 text-[12px] font-semibold leading-snug text-slate-800">{res.urgency}</p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">What to do now</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-700">{res.next}</p>
              </div>

              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Keywords matched</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {res.matched.length ? res.matched.map((m: string) => <Badge key={m} tone="brand">{m}</Badge>) : <span className="text-[11.5px] text-slate-500">No specific clinical keyword matched</span>}
                </div>
                <p className="mt-2 text-[11px] text-slate-500">Pattern confidence: {res.confidence}% (demo engine)</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link to={`/appointments?dept=${encodeURIComponent(res.dept)}`} className="btn btn-primary btn-sm">Book {res.dept}</Link>
                {res.level === 'CRITICAL' && <Link to="/emergency" className="btn btn-danger btn-sm">Emergency assistance</Link>}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

/* =========================================================== C. REPORT OCR */
function ReportOcr() {
  const { toast, addDoc } = useApp()
  const [file, setFile] = useState<string | null>(null)
  const [kind, setKind] = useState('Auto-detect')
  const [res, setRes] = useState<ReturnType<typeof simulateOCR> | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const run = (name: string) => {
    setFile(name); setBusy(true); setProgress(0)
    const t = setInterval(() => setProgress((p) => Math.min(96, p + 12)), 90)
    setTimeout(() => {
      clearInterval(t); setProgress(100)
      const r = simulateOCR(name, kind === 'Auto-detect' ? '' : kind)
      setRes(r); setBusy(false)
      addDoc({ id: 'DOC-' + Date.now(), patient: PATIENT.name, title: name, kind: r.kind, date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), by: 'Patient upload (OCR)' })
      toast(`OCR complete — ${r.kind} detected with ${r.confidence}% confidence.`, 'success')
    }, 1250)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-5">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600"><ScanLine size={20} /></span>
            <div>
              <h2 className="text-[16px] font-extrabold text-slate-900">Medical Report OCR</h2>
              <p className="text-[12px] text-slate-500">Upload a prescription, blood report, X-ray, CT, MRI or any medical document.</p>
            </div>
          </div>

          <div onClick={() => inputRef.current?.click()}
            className="mt-6 cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-brand-400 hover:bg-brand-50/40">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm"><UploadCloud size={26} /></span>
            <p className="mt-4 text-[13.5px] font-bold text-slate-900">Drop a document here or click to browse</p>
            <p className="mt-1.5 text-[11.5px] text-slate-500">PDF, JPG, PNG, DICOM export · up to 25 MB per file · OCR runs locally in this demo</p>
            <input ref={inputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.dcm"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) run(f.name) }} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Document type">
              <Select value={kind} onChange={(e: any) => setKind(e.target.value)}>
                {['Auto-detect', 'Prescription', 'Blood Test', 'Urine Test', 'X-Ray', 'CT Scan', 'MRI', 'Medical Document'].map((k) => <option key={k}>{k}</option>)}
              </Select>
            </Field>
            <div className="flex items-end gap-2">
              {['prescription-oct.pdf', 'cbc-report.jpg', 'chest-xray.png', 'brain-mri.pdf'].map((f) => (
                <button key={f} onClick={() => run(f)} className="chip chip-sm">{f.split('.')[0]}</button>
              ))}
            </div>
          </div>

          {busy && (
            <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold text-brand-800">Extracting text and structuring fields…</p>
                <p className="text-[12px] font-extrabold text-brand-700">{progress}%</p>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
          )}

          {file && !busy && res && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <FileCheck2 size={16} className="shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-bold text-emerald-900">{file}</p>
                <p className="text-[11.5px] text-emerald-700">Detected as {res.kind} · {res.pages} page · {res.confidence}% confidence · {res.extractedAt}</p>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-[14px] font-bold text-slate-900">Supported document types</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { i: Pill, t: 'Prescription', d: 'Medicine names, strengths, frequency and duration.' },
              { i: FlaskConical, t: 'Lab reports', d: 'Test name, value, unit and reference range.' },
              { i: Layers, t: 'Imaging', d: 'X-ray, CT and MRI impression text and study details.' },
              { i: FileText, t: 'Discharge summaries', d: 'Admission details, diagnosis and medication on discharge.' },
              { i: ClipboardCheck, t: 'Vaccination cards', d: 'Immunisation dates and batch information.' },
              { i: FileSearch, t: 'Other documents', d: 'Referral letters, insurance forms, handwritten notes.' },
            ].map((x) => (
              <div key={x.t} className="rounded-xl border border-slate-200 p-3.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><x.i size={16} /></span>
                <p className="mt-2.5 text-[12.5px] font-bold text-slate-900">{x.t}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-slate-600">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        {!res ? (
          <div className="card p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><ScanLine size={26} /></span>
            <h3 className="mt-4 text-[15px] font-bold text-slate-900">No document processed yet</h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">Extracted fields and an easy-to-understand summary appear here once you upload a file.</p>
          </div>
        ) : (
          <>
            <div className="card p-5 anim-up">
              <h3 className="text-[13.5px] font-bold text-slate-900">Extracted text</h3>
              <div className="mt-3.5 overflow-hidden rounded-xl border border-slate-200">
                <Table head={['Field', 'Extracted value']}>
                  {res.fields.map((f) => (
                    <tr key={f.field} className={cn('border-b border-slate-100 last:border-0', f.flag && 'bg-amber-50/60')}>
                      <td className="px-3.5 py-2.5 text-[12px] font-semibold text-slate-700">{f.field}</td>
                      <td className="px-3.5 py-2.5 text-[12px] text-slate-800">
                        {f.value}
                        {f.flag && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">outside range</span>}
                      </td>
                    </tr>
                  ))}
                </Table>
              </div>
            </div>

            <div className="card p-5 anim-up">
              <div className="flex items-center gap-2.5"><Sparkles size={15} className="text-teal-600" /><h3 className="text-[13.5px] font-bold text-slate-900">Easy-to-understand summary</h3></div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-slate-700">{res.plainEnglish}</p>
              <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Suggested next step</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-700">{res.nextStep}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => toast('Report filed in your medical documents.', 'success')} className="btn btn-teal-soft btn-sm">Save to my documents</button>
                <Link to="/ai-tools" onClick={() => setTabGlobal('lab')} className="btn btn-ghost btn-sm">Analyse lab values</Link>
              </div>
            </div>

            <AiDisclaimer />
          </>
        )}
      </aside>
    </div>
  )
}

function setTabGlobal(_: string) { /* tab switching handled by parent state on remount */ }

/* =========================================================== D. LAB ANALYSIS */
function LabAnalysis() {
  const { reports } = useApp()
  const [sel, setSel] = useState(reports[0]?.id || '')

  const report = useMemo(() => reports.find((r) => r.id === sel) || reports[0], [reports, sel])
  const rows = report?.rows || []
  const normal = rows.filter((r) => r.high === 0 || (r.value >= r.low && r.value <= r.high)).length
  const abnormal = rows.length - normal

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-5">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><FlaskConical size={20} /></span>
            <div>
              <h2 className="text-[16px] font-extrabold text-slate-900">AI Lab Report Analysis</h2>
              <p className="text-[12px] text-slate-500">Every value explained against its reference range, with a plausible reason and follow-up.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="Select a report from your record">
              <Select value={sel} onChange={(e: any) => setSel(e.target.value)}>
                {reports.map((r) => <option key={r.id} value={r.id}>{r.panel} — {r.date}</option>)}
              </Select>
            </Field>
            <div className="flex items-end">
              <label className="btn btn-ghost w-full cursor-pointer">
                <Upload size={14} /> Upload a lab report
                <input type="file" className="hidden" />
              </label>
            </div>
          </div>

          {report && (
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {[
                { l: 'Report ID', v: report.id },
                { l: 'Panel', v: report.panel },
                { l: 'Ordering doctor', v: report.doctor },
                { l: 'Status', v: report.status },
              ].map((x) => (
                <div key={x.l} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{x.l}</p>
                  <p className="mt-1 text-[12px] font-semibold text-slate-800">{x.v}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card overflow-hidden" style={{ padding: 0 }}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h3 className="text-[14px] font-bold text-slate-900">Value-by-value interpretation</h3>
            <div className="flex gap-2">
              <Badge tone="green">{normal} within range</Badge>
              <Badge tone={abnormal ? 'amber' : 'slate'}>{abnormal} outside range</Badge>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table head={['Test', 'Value', 'Reference range', 'Status', 'Simple explanation', 'Possible reason', 'Suggested follow-up']}>
              {(rows || []).map((r) => {
                const isNormal = r.high === 0 || (r.value >= r.low && r.value <= r.high)
                return (
                  <tr key={r.test} className={cn('border-b border-slate-100 last:border-0', !isNormal && 'bg-amber-50/40')}>
                    <td className="px-4 py-3.5 text-[12px] font-bold text-slate-800">{r.test}</td>
                    <td className="px-4 py-3.5 text-[12.5px] font-extrabold tabular-nums text-slate-900">{r.value} <span className="text-[10.5px] font-semibold text-slate-500">{r.unit}</span></td>
                    <td className="px-4 py-3.5 text-[11.5px] tabular-nums text-slate-600">{r.high === 0 ? 'Not applicable' : `${r.low} – ${r.high} ${r.unit}`}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn('rounded-full px-2.5 py-1 text-[10.5px] font-bold', isNormal ? 'bg-emerald-100 text-emerald-800' : r.value < r.low ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')}>
                        {isNormal ? 'Normal' : r.value < r.low ? 'Low' : 'High'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[11.5px] leading-relaxed text-slate-600">{r.explain}</td>
                    <td className="px-4 py-3.5 text-[11.5px] leading-relaxed text-slate-600">{r.cause}</td>
                    <td className="px-4 py-3.5 text-[11.5px] font-semibold leading-relaxed text-brand-700">{r.follow}</td>
                  </tr>
                )
              })}
            </Table>
          </div>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="card p-5">
          <h3 className="text-[13.5px] font-bold text-slate-900">AI summary</h3>
          <div className="mt-3.5 space-y-3">
            <div className="rounded-xl border border-slate-200 p-3.5">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Panel overview</p>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-700">
                {report?.panel} produced {rows?.length} measured values, of which {abnormal} fall outside the reference range.
                {abnormal === 0
                  ? ' No value requires clinical action in this demo dataset.'
                  : ' Values outside range are highlighted in amber — discuss them at your next consultation rather than adjusting anything yourself.'}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Flagged values</p>
              <div className="mt-2 space-y-2">
                {(rows || []).filter((r) => !(r.high === 0 || (r.value >= r.low && r.value <= r.high))).map((r) => (
                  <div key={r.test} className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-bold text-amber-900">{r.test}</p>
                      <p className="text-[12px] font-extrabold text-amber-900">{r.value} {r.unit}</p>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-amber-800">{r.cause}</p>
                  </div>
                ))}
                {abnormal === 0 && <p className="text-[12px] text-slate-500">No flagged values in this report.</p>}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">What to do next</p>
              <ul className="mt-2 space-y-2">
                {(rows || []).filter((r) => !(r.high === 0 || (r.value >= r.low && r.value <= r.high))).slice(0, 3).map((r) => (
                  <li key={r.test} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-slate-700">
                    <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-brand-600" /> {r.follow}
                  </li>
                ))}
                {abnormal === 0 && <li className="text-[11.5px] text-slate-600">File this report for comparison at your next check-up.</li>}
              </ul>
            </div>

            {(rows || []).length > 0 && (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Trend view · haemoglobin (demo)</p>
                <div className="mt-2">
                  <SimpleLine data={[{ d: 'Jul', v: 9.8 }, { d: 'Aug', v: 10.1 }, { d: 'Sep', v: 10.4 }]} k="v" name="Haemoglobin" unit=" g/dL" color="#0d9488" height={140} />
                </div>
              </div>
            )}
          </div>
        </div>

        <AiDisclaimer text="AI lab interpretation explains values in plain language for education. It is not a diagnosis and does not replace a pathologist's report or your physician's assessment." />
      </aside>
    </div>
  )
}

/* =========================================================== E. HEALTH SCORE */
function HealthScore() {
  const { meds, reports, vitalsLog } = useApp()

  const activeMeds = meds.filter((m) => m.status === 'Active')
  const taken = activeMeds.reduce((n, m) => n + m.adherence.taken, 0)
  const missed = activeMeds.reduce((n, m) => n + m.adherence.missed, 0)
  const adherence = taken + missed ? (taken / (taken + missed)) * 100 : 100

  const last = vitalsLog[0] || { sys: PATIENT.vitals.systolic, dia: PATIENT.vitals.diastolic, sugar: PATIENT.vitals.sugar, hr: PATIENT.vitals.hr, weight: PATIENT.vitals.weight, spo2: PATIENT.vitals.spo2 }
  const bmi = last.weight / Math.pow(PATIENT.vitals.height / 100, 2)
  const abnormalLabs = reports.flatMap((r) => r.rows).filter((r) => !(r.high === 0 || (r.value >= r.low && r.value <= r.high))).length

  const [lifestyle, setLifestyle] = useState(74)
  const score = healthScore({
    adherence, bpSys: last.sys, bpDia: last.dia, sugar: last.sugar, bmi, hr: last.hr, spo2: last.spo2, abnormalLabs,
  })

  const [simulated, setSimulated] = useState<number | null>(null)
  const { toast } = useApp()

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr]">
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Gauge size={20} /></span>
          <div>
            <h2 className="text-[16px] font-extrabold text-slate-900">AI Health Score</h2>
            <p className="text-[12px] text-slate-500">A weighted composite of vitals, adherence, lifestyle and recent reports.</p>
          </div>
        </div>

        <div className="mt-7 grid place-items-center">
          <Ring value={simulated ?? score.total} size={210} stroke={17} label="Overall Health Score" caption={score.band} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            { l: 'Medication adherence', v: Math.round(adherence), t: 'teal' },
            { l: 'Lifestyle', v: lifestyle, t: 'violet' },
            { l: 'Vitals', v: Math.round(score.parts[0].v), t: 'brand' },
            { l: 'Recent reports', v: Math.round(score.parts[6].v), t: 'amber' },
          ].map((x) => (
            <div key={x.l} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11.5px] font-bold text-slate-700">{x.l}</p>
                <p className="text-[15px] font-extrabold text-slate-900">{x.v}</p>
              </div>
              <div className="mt-2.5"><Bar value={x.v} tone={x.t} showPct={false} height={6} /></div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold text-slate-900">Lifestyle self-assessment</p>
            <p className="text-[12px] font-extrabold text-brand-700">{lifestyle}</p>
          </div>
          <input type="range" min={40} max={100} value={lifestyle} onChange={(e) => setLifestyle(Number(e.target.value))}
            className="mt-3 w-full accent-teal-600" />
          <p className="mt-1.5 text-[11.5px] text-slate-500">Adjust sleep quality, physical activity, nutrition and stress management to see the score respond.</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <button onClick={() => { setSimulated(Math.min(100, score.total + 6)); toast('Simulation applied: +6 points from improved adherence and activity.', 'info') }}
            className="btn btn-teal-soft btn-sm"><Sparkles size={13} /> Simulate improvement</button>
          {simulated !== null && <button onClick={() => setSimulated(null)} className="btn btn-ghost btn-sm">Reset to live score</button>}
        </div>

        <div className="mt-4">{score.advice && <AiDisclaimer text={`${score.advice} This score is a wellness indicator generated from demo data — it is not a diagnosis and does not replace professional medical assessment.`} />}</div>
      </div>

      <aside className="space-y-4">
        <div className="card p-5">
          <h3 className="text-[13.5px] font-bold text-slate-900">How the score is built</h3>
          <div className="mt-4 space-y-3.5">
            {score.parts.map((p) => (
              <div key={p.k}>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold text-slate-800">{p.k}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">weight {Math.round(p.w * 100)}%</span>
                    <span className="text-[12.5px] font-extrabold text-slate-900">{Math.round(p.v)}</span>
                  </div>
                </div>
                <div className="mt-2"><Bar value={p.v} tone={p.v >= 85 ? 'green' : p.v >= 60 ? 'teal' : 'amber'} showPct={false} height={6} /></div>
                <p className="mt-1 text-[11px] text-slate-500">{p.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-[13.5px] font-bold text-slate-900">Score history</h3>
          <div className="mt-3">
            <SimpleLine data={VITALS.score} k="v" name="Health score" color="#059669" height={160} domain={[50, 100]} />
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Weekly medication adherence</p>
            <div className="mt-1"><AdherenceBars data={VITALS.adherence} height={140} /></div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2.5"><Lightbulb size={15} className="text-amber-500" /><h3 className="text-[13.5px] font-bold text-slate-900">Highest-impact actions</h3></div>
          <div className="mt-3.5 space-y-2.5">
            {[
              { t: 'Close the adherence gap', d: `You are at ${Math.round(adherence)}%. Logging every dose adds up to 20 points of weight.`, to: '/portal/patient' },
              { t: 'Follow up on flagged labs', d: `${abnormalLabs} value(s) sit outside range — book a review to discuss them.`, to: '/appointments' },
              { t: 'Keep activity consistent', d: 'Sustained moderate activity for 20 minutes daily supports weight and glycaemic control.', to: '/ai-tools' },
            ].map((x) => (
              <Link key={x.t} to={x.to} className="block rounded-xl border border-slate-200 p-3.5 transition hover:border-brand-300 hover:bg-brand-50/40">
                <p className="text-[12.5px] font-bold text-slate-900">{x.t}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-slate-600">{x.d}</p>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
