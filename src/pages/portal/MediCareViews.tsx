/* MediCare AI — backend-connected health modules (patient role).
   All data flows through the Flask API + SQLite; nothing here is mocked. */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, AlertTriangle, Bell, CalendarDays, Camera, CheckCircle2, ChevronRight, Droplet, FileText,
  FlaskConical, Heart, HeartPulse, Info, Languages, Mic, MicOff, Pill, Plus, ScanLine, ShieldAlert,
  ShieldCheck, Sparkles, Siren, Speaker, Trash2, TrendingUp, Upload, UserPlus, Volume2, Weight, X,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Badge, Card, CardHead, cn } from '../../components/ui'
import { api, ApiError, listen, speak, stopSpeaking, speechSupported, getToken, setToken, type ApiUser } from '../../lib/api'
import { useApp } from '../../context/AppContext'

/* ================================================================ layout bits */
export function Section({ title, sub, icon, right, children }: any) {
  return (
    <Card>
      <CardHead icon={icon} title={title} sub={sub} right={right} />
      {children}
    </Card>
  )
}
const Disclaimer = ({ children }: any) => (
  <p className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-200 p-3 text-[11.5px] leading-relaxed text-slate-600">
    <Info size={13} className="mt-0.5 shrink-0 text-slate-400" />{children}
  </p>
)

/* ================================================================ HEALTH MONITORING */
const METRICS = [
  { key: 'glucose', label: 'Blood glucose', unit: 'mg/dL', color: '#0d9488' },
  { key: 'systolic', label: 'Systolic BP', unit: 'mmHg', color: '#2563eb' },
  { key: 'diastolic', label: 'Diastolic BP', unit: 'mmHg', color: '#60a5fa' },
  { key: 'heart_rate', label: 'Heart rate', unit: 'bpm', color: '#e11d48' },
  { key: 'spo2', label: 'Oxygen (SpO₂)', unit: '%', color: '#7c3aed' },
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#f59e0b' },
  { key: 'weight', label: 'Weight', unit: 'kg', color: '#475569' },
] as const

export function HealthMonitoring() {
  const { toast } = useApp()
  const [rows, setRows] = useState<any[]>([])
  const [days, setDays] = useState(7)
  const [form, setForm] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [recog, setRecog] = useState<any>(null)
  const [listeningKey, setListeningKey] = useState<string | null>(null)

  const load = (d = days) => api.readings(d).then((r) => setRows(r.readings)).catch((e) => toast(e.message, 'error'))
  useEffect(() => { load(days) }, [days])

  const chartData = useMemo(() => rows.map((r) => ({
    date: r.reading_date?.slice(5), ...METRICS.reduce((o, m) => ({ ...o, [m.key]: r[m.key] }), {}),
  })), [rows])

  const latest = rows[rows.length - 1]
  const unusual = (k: string, v?: number | null) => {
    if (v == null) return false
    const bands: Record<string, [number, number]> = { glucose: [70, 180], systolic: [90, 140], diastolic: [60, 90], heart_rate: [60, 100], spo2: [92, 100], temperature: [36.1, 37.8] }
    const b = bands[k]; return b ? (v < b[0] || v > b[1]) : false
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await api.addReading(form)
      toast('Reading saved to your MediCare AI record.')
      if ((res as any).warnings?.length) (res as any).warnings.forEach((w: string) => toast(w, 'warn'))
      setForm({}); load(days)
    } catch (err) { toast((err as ApiError).message, 'error') } finally { setBusy(false) }
  }

  const voiceFill = (key: string) => {
    if (!speechSupported()) { toast('Voice entry is not supported in this browser — type the value instead.', 'warn'); return }
    if (recog) { recog.stop?.(); setRecog(null); setListeningKey(null); return }
    const r = listen('en-IN', (text) => {
      const num = parseFloat(text.replace(/[^0-9.]/g, ''))
      setListeningKey(null)
      if (isNaN(num)) { toast(`Heard "…${text}" — could not read a number from that. Try again, e.g. "one two zero".`, 'warn') }
      else { setForm((f) => ({ ...f, [key]: String(num) })); toast(`Heard ${num} for ${key}.`) }
    }, (e) => { setListeningKey(null); toast(e, 'warn') })
    setRecog(r); setListeningKey(key)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)} className={cn('btn btn-sm', days === d ? 'btn-primary' : 'btn-ghost')}>
            {d === 7 ? 'Daily (7d)' : d === 30 ? 'Weekly (30d)' : 'Monthly (90d)'}
          </button>
        ))}
      </div>

      <Section title="Today's reading" sub="Manual or voice entry. One value is enough." icon={Activity}>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m) => {
            const lv = latest?.[m.key]
            return (
              <div key={m.key} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11.5px] font-bold uppercase tracking-wide text-slate-500">{m.label}</label>
                  <button type="button" onClick={() => voiceFill(m.key)} title="Voice entry"
                    className={cn('grid h-7 w-7 place-items-center rounded-full border',
                      listeningKey === m.key ? 'border-rose-300 bg-rose-50 text-rose-600 animate-pulse' : 'border-slate-200 text-slate-400 hover:text-brand-600')}>
                    {listeningKey === m.key ? <Mic size={13} /> : <MicOff size={13} />}
                  </button>
                </div>
                {latest && (
                  <p className={cn('mt-1 text-[11px] font-semibold', unusual(m.key, lv) ? 'text-rose-600' : 'text-slate-400')}>
                    Last: {lv ?? '—'} {m.unit}{unusual(m.key, lv) ? ' · unusual' : ''}
                  </p>
                )}
                <input inputMode="decimal" value={form[m.key] || ''} onChange={(e) => setForm((f) => ({ ...f, [m.key]: e.target.value }))}
                  placeholder={m.unit} className="input mt-1.5 py-2 text-[15px]" />
              </div>
            )
          })}
          <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap gap-2">
            <button disabled={busy} className="btn btn-primary">{busy ? 'Saving…' : 'Save reading'}</button>
            <span className="text-[11.5px] text-slate-500 self-center">🎤 Press a mic icon, then say the number, e.g. “118”.</span>
          </div>
        </form>
        <Disclaimer>Every value you log is stored in your MediCare AI record. A single unusual reading is never treated as a diagnosis — recheck and repeat before drawing conclusions.</Disclaimer>
      </Section>

      {(['glucose', 'systolic', 'diastolic', 'heart_rate'] as const).map((k) => {
        const m = METRICS.find((x) => x.key === k)!
        const data = chartData.filter((d: any) => d[k] != null)
        return (
          <Section key={k} title={m.label} sub={`${m.unit} · last ${days} days`} icon={TrendingUp}>
            {data.length === 0 ? <p className="text-[12.5px] text-slate-500">No readings yet in this window.</p> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data}>
                  <defs><linearGradient id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={m.color} stopOpacity={0.35} /><stop offset="100%" stopColor={m.color} stopOpacity={0.02} />
                  </linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} /><Tooltip />
                  <Area type="monotone" dataKey={k} stroke={m.color} strokeWidth={2} fill={`url(#g-${k})`} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Section>
        )
      })}

      <Section title="Reading history" sub={`${rows.length} reading(s) in the selected window`} icon={FileText}>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Date</th>{METRICS.map((m) => <th key={m.key}>{m.label}</th>)}</tr></thead>
            <tbody>{[...rows].reverse().slice(0, 20).map((r) => (
              <tr key={r.id}>
                <td className="font-semibold">{r.reading_date}</td>
                {METRICS.map((m) => (
                  <td key={m.key} className={unusual(m.key, r[m.key]) ? 'text-rose-600 font-semibold' : ''}>
                    {r[m.key] ?? '—'}{r[m.key] != null ? ` ${m.unit}` : ''}
                  </td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}

/* ================================================================ AI RISK */
export function RiskAnalysis() {
  const { toast } = useApp()
  const [data, setData] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const run = () => { setBusy(true)
    api.risk().then(setData).catch((e) => toast(e.message, 'error')).finally(() => setBusy(false)) }
  useEffect(run, [])

  const tone = data?.risk_level === 'High' ? 'red' : data?.risk_level === 'Medium' ? 'amber' : 'green'
  return (
    <div className="space-y-5">
      <Section title="AI health risk analysis" sub="Isolation Forest anomaly detection + linear trend analysis over your logged readings"
        icon={Sparkles} right={<button onClick={run} disabled={busy} className="btn btn-primary btn-sm">{busy ? 'Analysing…' : 'Re-run analysis'}</button>}>
        {!data ? <p className="text-[12.5px] text-slate-500">Run the analysis to screen your readings.</p>
          : data.status === 'insufficient_data' ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-[13.5px] font-bold text-amber-800"><Info size={15} /> Not enough data yet</p>
              <p className="mt-1 text-[12.5px] text-amber-700">{data.message}</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone={tone}>Risk level: {data.risk_level}</Badge>
                <Badge tone="slate">{data.readings_used} readings analysed</Badge>
                <Badge tone="slate">{data.out_of_range_count} out-of-range value(s)</Badge>
              </div>
              <p className="mt-3 text-[12.5px] text-slate-600"><strong>Suggested next step:</strong> {(data.suggested_next_steps || []).join(' ')}</p>
              {(data.anomalies || []).length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500">Detected unusual patterns</p>
                  {data.anomalies.map((a: any, i: number) => (
                    <div key={i} className="rounded-lg border border-slate-200 p-3">
                      <p className="text-[12.5px] font-bold text-slate-800">{a.date}</p>
                      <p className="text-[12px] text-slate-600">{Object.entries(a.values).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>
                      <p className="mt-1 text-[11.5px] text-slate-500">{a.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
              {(data.trends || []).length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500">Trends over time</p>
                  {data.trends.map((t: any, i: number) => (
                    <p key={i} className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[12.5px] text-slate-700">{t.explanation}</p>
                  ))}
                </div>
              )}
            </>
          )}
        <Disclaimer>{data?.disclaimer || 'Algorithmic screening only — not a medical diagnosis, not clinically validated, and never a replacement for professional advice.'}</Disclaimer>
      </Section>
    </div>
  )
}

/* ================================================================ PRESCRIPTION SCANNER */
export const RX_LANGS: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' }
export const RX_NOTICES: Record<string, string> = {
  en: 'This OCR output is a first pass only. A pharmacist or doctor must verify every medicine and dose before you rely on it.',
  hi: 'यह OCR आउटपुट केवल पहला चरण है। इस पर भरोसा करने से पहले फार्मासिस्ट या डॉक्टर से हर दवा और खुराक की जांच कराएं।',
  te: 'ఈ OCR అవుట్‌పుట్ మొదటి దశ మాత్రమే. దీనిపై ఆధారపడే ముందు ఫార్మసిస్ట్ లేదా వైద్యుడితో ప్రతి మందు, మోతాదును ధృవీకరించండి.',
}
export function PrescriptionScanner() {
  const { toast } = useApp()
  const [result, setResult] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [lang, setLang] = useState<'en' | 'hi' | 'te'>('en')
  const fileRef = useRef<HTMLInputElement>(null)

  const upload = async (f: File | undefined) => {
    if (!f) return
    setBusy(true)
    try { setResult(await api.ocrPrescription(f)); toast('Prescription processed — please confirm each medicine below.') }
    catch (e) { toast((e as ApiError).message, 'error') } finally { setBusy(false) }
  }

  const readAloud = () => {
    if (!result) return
    stopSpeaking()
    const lines = (result.meds || []).map((m: any) =>
      `${m.name}. ${m.dosage}. ${m.frequency || ''} ${m.before_food || ''} ${m.duration || ''}`).join('. ')
    speak(`Your prescription contains: ${lines || 'no medicines detected'}. ${RX_NOTICES[lang]}`, RX_LANGS[lang])
  }

  return (
    <div className="space-y-5">
      <Section title="AI prescription scanner" sub="Photo, camera capture or PDF · Tesseract OCR runs on the MediCare AI server" icon={ScanLine}>
        <div
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files?.[0]) }}
          onClick={() => fileRef.current?.click()}
          className="grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-brand-400 hover:bg-brand-50/40">
          <Upload size={26} className="text-brand-500" />
          <p className="mt-2 text-[13.5px] font-bold text-slate-700">Upload prescription photo, camera capture or PDF</p>
          <p className="text-[11.5px] text-slate-500">PNG, JPG, WEBP or PDF · up to 10 MB · stored privately per patient</p>
          {busy && <p className="mt-2 text-[12px] font-semibold text-brand-600">Running OCR…</p>}
          <input ref={fileRef} type="file" accept="image/*,application/pdf" capture="environment" hidden
            onChange={(e) => upload(e.target.files?.[0] || undefined)} />
        </div>
        <Disclaimer>Extracted text can be wrong for handwriting. Uncertain words are highlighted; never accept a guessed medicine name or dosage.</Disclaimer>
      </Section>

      {result && (
        <Section title="Extracted prescription" sub={`OCR confidence: ${result.ocr_conf ?? '—'}%`} icon={FileText}
          right={<div className="flex flex-wrap gap-2">
            <select value={lang} onChange={(e) => setLang(e.target.value as any)} className="input py-1.5 text-[12px] w-auto">
              <option value="en">English</option><option value="hi">हिन्दी</option><option value="te">తెలుగు</option>
            </select>
            <button onClick={readAloud} className="btn btn-teal-soft btn-sm"><Volume2 size={13} /> Read aloud</button>
          </div>}>
          {(result.uncertain_words || []).length > 0 && (
            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
              <strong>Uncertain words</strong> (low OCR confidence — please verify): {result.uncertain_words.join(', ')}
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Food</th><th>Duration</th><th>Instructions</th><th>Confirm</th></tr></thead>
              <tbody>{(result.meds || []).map((m: any, i: number) => (
                <tr key={i}>
                  <td className="font-semibold">{m.name}</td>
                  <td>{m.dosage || '—'}</td><td>{m.frequency || '—'}</td><td>{m.before_food || '—'}</td>
                  <td>{m.duration || '—'}</td><td className="max-w-[220px] text-[12px]">{m.instructions || '—'}</td>
                  <td><Badge tone="amber">Needs pharmacist verification</Badge></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {(result.meds || []).length === 0 && (
            <p className="text-[12.5px] text-slate-500">No structured medicines detected in the text below — read the raw text and add medicines as reminders manually.</p>
          )}
          <details className="mt-3"><summary className="cursor-pointer text-[12px] font-semibold text-brand-600">Show raw OCR text</summary>
            <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-[11.5px] text-slate-600">{result.raw_text}</pre>
          </details>
          <Disclaimer>{RX_NOTICES[lang]}</Disclaimer>
        </Section>
      )}
    </div>
  )
}

/* ================================================================ MEDICINE SAFETY CHECKER */
export function SafetyChecker() {
  const { toast } = useApp()
  const [items, setItems] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [res, setRes] = useState<any>(null)
  const [busy, setBusy] = useState(false)

  const add = () => { const v = draft.trim(); if (v && !items.includes(v)) setItems([...items, v]); setDraft('') }
  const check = async () => {
    if (items.length < 2) { toast('Add at least two medicines to check for interactions.', 'warn'); return }
    setBusy(true)
    try { setRes(await api.interactions(items)) } catch (e) { toast((e as ApiError).message, 'error') } finally { setBusy(false) }
  }

  return (
    <div className="space-y-5">
      <Section title="Medicine safety checker" sub="Live interaction & duplicate-ingredient data from RxNav (NIH) RxNorm" icon={ShieldCheck}>
        <div className="flex gap-2">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
            placeholder="Type a medicine name, e.g. Paracetamol" className="input" />
          <button onClick={add} className="btn btn-soft"><Plus size={15} /> Add</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((m) => (
            <span key={m} className="chip chip-blue">{m}
              <button onClick={() => setItems(items.filter((x) => x !== m))}><X size={12} /></button></span>
          ))}
        </div>
        <button onClick={check} disabled={busy} className="btn btn-primary mt-4">{busy ? 'Checking with NIH RxNav…' : 'Check safety'}</button>
      </Section>

      {res && (
        <Section title="Safety results" sub={res.checked_with} icon={ShieldAlert}>
          {res.unresolved?.length > 0 && (
            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
              Could not match in RxNorm (no invented results for them): {res.unresolved.join(', ')}
            </p>
          )}
          {[...(res.pairs || []), ...(res.duplicates || [])].map((p: any, i: number) => (
            <div key={i} className={cn('mb-2 rounded-xl border p-3.5',
              p.severity === 'major' ? 'border-rose-200 bg-rose-50' : 'border-slate-200')}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13px] font-bold text-slate-800">{p.medicines?.join(' + ')}</p>
                <Badge tone={p.severity === 'major' ? 'red' : p.shared_ingredient ? 'amber' : 'slate'}>
                  {p.shared_ingredient ? 'Duplicate ingredient' : p.severity === 'major' ? 'Major' : p.severity === 'moderate' ? 'Moderate' : 'Note'}
                </Badge>
              </div>
              <p className="mt-1 text-[12.5px] text-slate-600">{p.reason || p.shared_ingredient}</p>
              <p className="mt-1 text-[11px] text-slate-400">Source: {p.source}</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-700">{p.recommended_action}</p>
            </div>
          ))}
          {(res.pairs || []).length === 0 && (res.duplicates || []).length === 0 && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-[12.5px] text-emerald-700">
              No interactions found in the NIH RxNav database for this combination. Absence of a result is not a guarantee — always confirm with a pharmacist.
            </p>
          )}
          {(res.allergies || []).map((a: any, i: number) => (
            <div key={`al-${i}`} className="mb-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5">
              <p className="text-[13px] font-bold text-rose-700">Allergy warning: {a.medicine} matches your recorded allergy “{a.allergy}”</p>
              <p className="text-[12px] text-rose-600">{a.recommended_action}</p>
            </div>
          ))}
          <Disclaimer>{res.notice}</Disclaimer>
        </Section>
      )}
    </div>
  )
}

/* ================================================================ GENERIC FINDER */
export function GenericFinder() {
  const [q, setQ] = useState('')
  const [res, setRes] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const search = async (e: React.FormEvent) => {
    e.preventDefault(); if (!q.trim()) return
    setBusy(true)
    try { setRes(await api.generic(q.trim())) } finally { setBusy(false) }
  }
  return (
    <div className="space-y-5">
      <Section title="Generic medicine finder" sub="Search by brand or active ingredient · RxNav (NIH) RxNorm equivalents" icon={Pill}>
        <form onSubmit={search} className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Crocin / Paracetamol / Amlodipine" className="input" />
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Searching…' : 'Search'}</button>
        </form>
      </Section>
      {res && (
        <Section title={res.found ? `Results for ${res.name}` : `No verified match for ${res.name}`} icon={Pill}
          sub={res.found ? `RxNorm id ${res.rxcui}` : undefined}>
          {res.found ? (
            <>
              <p className="text-[12.5px] text-slate-600"><strong>Active ingredient(s):</strong> {res.ingredients?.join(', ') || '—'}</p>
              <div className="mt-3 overflow-x-auto">
                <table className="tbl">
                  <thead><tr><th>Equivalent product (RxNorm)</th><th>Type</th></tr></thead>
                  <tbody>{res.equivalents?.map((e: any) => (
                    <tr key={e.rxcui}><td className="font-semibold">{e.name}</td><td>{e.tty}</td></tr>
                  ))}</tbody>
                </table>
              </div>
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
                💰 {res.pricing?.detail}
              </p>
            </>
          ) : <p className="text-[12.5px] text-slate-600">{res.notice}</p>}
          <Disclaimer>{res.notice || 'A pharmacist or doctor must approve any substitution; strength and dosage form must match exactly.'}</Disclaimer>
        </Section>
      )}
    </div>
  )
}

/* ================================================================ REMINDERS */
export function Reminders() {
  const { toast } = useApp()
  const [data, setData] = useState<any>({ reminders: [], missed: [] })
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<any>({ med_name: '', dosage: '', times: '08:00', before_food: 'after food', expiry_date: '' })

  const load = () => api.reminders().then(setData).catch((e) => toast(e.message, 'error'))
  useEffect(() => { api.generateToday().catch(() => {}); load() }, [])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.addReminder({ ...form, times: form.times.split(',').map((t: string) => t.trim()).filter(Boolean) })
      toast('Reminder saved — daily browser/in-app notifications will follow while the app is open.')
      setShowAdd(false); load()
    } catch (err) { toast((err as ApiError).message, 'error') }
  }
  const log = async (id: number, status: 'taken' | 'skipped', time: string) => {
    try {
      await api.logReminder(id, status, time)
      if (status === 'skipped') toast('Marked not taken. Do NOT take an extra dose to catch up — ask your doctor or pharmacist.', 'warn')
      else toast('Dose logged as taken. ✓')
      load()
    } catch (e) { toast((e as ApiError).message, 'error') }
  }

  const remind = (med: string, time: string) => {
    Notification.requestPermission?.().then(() => new Notification('MediCare AI reminder', { body: `Time for ${med} (${time}).` }))
    speak(`Reminder: it is time to take your medicine ${med}.`)
  }

  return (
    <div className="space-y-5">
      <Section title="Medicine reminders" sub="Daily schedule with taken / missed tracking" icon={Bell}
        right={<button onClick={() => setShowAdd(!showAdd)} className="btn btn-primary btn-sm"><Plus size={13} /> Add medicine</button>}>
        {showAdd && (
          <form onSubmit={add} className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
            <div><label className="label">Medicine name *</label><input required className="input" value={form.med_name} onChange={(e) => setForm({ ...form, med_name: e.target.value })} /></div>
            <div><label className="label">Dosage</label><input className="input" placeholder="500 mg" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} /></div>
            <div><label className="label">Reminder times (comma separated)</label><input className="input" placeholder="08:00, 20:00" value={form.times} onChange={(e) => setForm({ ...form, times: e.target.value })} /></div>
            <div><label className="label">Food instruction</label>
              <select className="input" value={form.before_food} onChange={(e) => setForm({ ...form, before_food: e.target.value })}>
                <option>after food</option><option>before food</option><option>empty stomach</option><option>—</option>
              </select></div>
            <div><label className="label">Expiry date (alerts near expiry)</label><input type="date" className="input" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
            <div className="flex items-end"><button className="btn btn-primary w-full">Save reminder</button></div>
          </form>
        )}
        <div className="space-y-3">
          {data.reminders?.map((r: any) => (
            <div key={r.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[14px] font-bold text-slate-900">{r.med_name} <span className="font-semibold text-slate-500">{r.dosage}</span></p>
                  <p className="text-[11.5px] text-slate-500">{r.times_list ? '' : ''}{JSON.parse(r.times).join(' · ')} · {r.before_food || '—'}{r.expiry_date ? ` · expires ${r.expiry_date}` : ''}</p>
                </div>
                <button onClick={() => JSON.parse(r.times).forEach((t: string) => remind(r.med_name, t))}
                  className="btn btn-teal-soft btn-sm"><Volume2 size={12} /> Test reminder</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {JSON.parse(r.times).map((t: string) => {
                  const l = (r.today_logs || []).find((x: any) => x.sched_time === t)
                  return (
                    <div key={t} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                      <span className="text-[13px] font-bold text-slate-700">{t}</span>
                      {l?.status === 'taken' ? <Badge tone="green">Taken ✓</Badge>
                        : l?.status === 'missed' ? <Badge tone="red">Missed</Badge>
                        : l?.status === 'skipped' ? <Badge tone="amber">Not taken</Badge>
                        : <>
                            <button onClick={() => log(r.id, 'taken', t)} className="btn btn-green btn-sm py-1.5">Taken</button>
                            <button onClick={() => log(r.id, 'skipped', t)} className="btn btn-danger-soft btn-sm py-1.5">Not taken</button>
                          </>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {data.reminders?.length === 0 && <p className="text-[12.5px] text-slate-500">No active reminders. Add your first medicine above.</p>}
        </div>
        <Disclaimer>Missed a dose? Do NOT take an extra dose to catch up. Ask your doctor or pharmacist what to do.</Disclaimer>
      </Section>

      <Section title="Missed-dose log" sub="Last 20 missed doses" icon={AlertTriangle}>
        {(data.missed || []).length === 0 ? <p className="text-[12.5px] text-slate-500">No missed doses recorded. 🎉</p> :
          <table className="tbl"><thead><tr><th>Medicine</th><th>Date</th><th>Time</th></tr></thead>
            <tbody>{data.missed.map((m: any) => (
              <tr key={m.id}><td className="font-semibold">{m.med_name}</td><td>{m.sched_date}</td><td>{m.sched_time}</td></tr>
            ))}</tbody></table>}
      </Section>
    </div>
  )
}

/* ================================================================ LAB ANALYZER */
export function LabAnalyzer() {
  const { toast } = useApp()
  const [res, setRes] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const upload = async (f: File | undefined) => {
    if (!f) return
    setBusy(true)
    try { setRes(await api.ocrLab(f)); toast('Lab report processed — review the extracted values below.') }
    catch (e) { toast((e as ApiError).message, 'error') } finally { setBusy(false) }
  }
  const tone = (f: string) => f === 'above' || f === 'below' ? 'amber' : f === 'normal' ? 'green' : 'slate'
  return (
    <div className="space-y-5">
      <Section title="AI lab report analyzer" sub="PDF, JPG or PNG · values compared against the reference range printed on your report" icon={FlaskConical}>
        <div onClick={() => fileRef.current?.click()}
          className="grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-teal-400 hover:bg-teal-50/40">
          <Upload size={26} className="text-teal-500" />
          <p className="mt-2 text-[13.5px] font-bold text-slate-700">Upload a lab report (PDF / JPG / PNG)</p>
          {busy && <p className="mt-2 text-[12px] font-semibold text-teal-600">Extracting values…</p>}
          <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={(e) => upload(e.target.files?.[0] || undefined)} />
        </div>
      </Section>
      {res && (
        <Section title="Extracted lab values" sub={`OCR confidence: ${res.ocr_conf ?? '—'}%`} icon={FileText}>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Test</th><th>Your value</th><th>Unit</th><th>Reference range (from report)</th><th>Status</th><th>What it means</th></tr></thead>
              <tbody>{res.results.map((r: any, i: number) => (
                <tr key={i}>
                  <td className="font-semibold">{r.test_name}</td>
                  <td>{r.value}</td><td>{r.unit}</td><td>{r.ref_range || '—'}</td>
                  <td><Badge tone={tone(r.flag)}>{r.flag === 'above' ? 'Above range' : r.flag === 'below' ? 'Below range' : r.flag === 'normal' ? 'In range' : 'No range detected'}</Badge></td>
                  <td className="max-w-[260px] text-[12px]">{r.explanation || '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <Disclaimer>{res.notice}</Disclaimer>
        </Section>
      )}
    </div>
  )
}

/* ================================================================ EMERGENCY SOS */
export function EmergencySOS() {
  const { toast } = useApp()
  const [contacts, setContacts] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState<any>(null)
  const [form, setForm] = useState<any>({ name: '', relation: '', phone: '', email: '' })
  const load = () => { api.contacts().then((r) => setContacts(r.contacts)).catch(() => {}); api.emEvents().then((r) => setEvents(r.events)).catch(() => {}) }
  useEffect(() => { load() }, [])

  const sos = async () => {
    setBusy(true)
    try {
      const r = await api.sos('sos', note)
      setLast(r); toast('Emergency alert created — authorised family/doctor have been notified in-app.', 'warn')
      load()
    } catch (e) { toast((e as ApiError).message, 'error') } finally { setBusy(false) }
  }
  const addContact = async (e: React.FormEvent) => {
    e.preventDefault()
    try { await api.addContact(form); toast('Emergency contact added.'); setForm({ name: '', relation: '', phone: '', email: '' }); load() }
    catch (err) { toast((err as ApiError).message, 'error') }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <p className="flex items-start gap-2 text-[13px] font-bold text-rose-700">
          <ShieldAlert size={16} className="mt-0.5 shrink-0" />
          MediCare AI is NOT an emergency medical service. For severe symptoms or any suspected emergency, call
          <a href="tel:112" className="mx-1 rounded-lg bg-rose-600 px-2.5 py-0.5 text-white">112 (India)</a>
          immediately. Never delay emergency care while waiting for AI analysis or family responses.
        </p>
      </div>

      <Section title="Emergency SOS" sub="Notifies authorised family members, your linked doctor and contacts (in-app; SMS/Email when configured)" icon={Siren}>
        <div className="flex flex-col items-center py-4">
          <button onClick={sos} disabled={busy}
            className="grid h-44 w-44 place-items-center rounded-full bg-rose-600 text-white shadow-lift transition active:scale-95 hover:bg-rose-700 anim-pulse-red">
            <div className="text-center">
              <Siren size={40} className="mx-auto" />
              <p className="mt-1 text-[19px] font-extrabold tracking-wide">SOS</p>
              <p className="text-[10.5px] font-semibold opacity-90">{busy ? 'Sending…' : 'Press & hold to alert'}</p>
            </div>
          </button>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note, e.g. feeling dizzy after walking"
            className="input mt-4 max-w-md" />
        </div>
        {last && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-[12px] text-slate-600">
            <p className="font-bold text-slate-800">Alert status</p>
            <p className="mt-1">{last.delivered?.join(' · ')}</p>
          </div>
        )}
      </Section>

      <Section title="Emergency contacts" sub="Alerted on every SOS" icon={Heart}>
        <table className="tbl"><thead><tr><th>Name</th><th>Relation</th><th>Phone</th><th>Email</th></tr></thead>
          <tbody>{contacts.map((c) => (
            <tr key={c.id}><td className="font-semibold">{c.name}</td><td>{c.relation}</td><td>{c.phone}</td><td>{c.email || '—'}</td></tr>
          ))}{contacts.length === 0 && <tr><td colSpan={4} className="text-slate-500">No contacts yet.</td></tr>}</tbody></table>
        <form onSubmit={addContact} className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
          <input required placeholder="Name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Relation" className="input" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} />
          <input required placeholder="Phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <button className="btn btn-primary"><UserPlus size={14} /> Add contact</button>
        </form>
      </Section>

      <Section title="Emergency event log" icon={FileText}>
        {events.length === 0 ? <p className="text-[12.5px] text-slate-500">No emergency events recorded.</p> :
          <table className="tbl"><thead><tr><th>When</th><th>Kind</th><th>Note</th><th>Delivery</th></tr></thead>
            <tbody>{events.map((e) => (
              <tr key={e.id}><td>{e.created_at}</td><td><Badge tone="red">{e.kind}</Badge></td><td>{e.note || '—'}</td>
                <td className="max-w-[280px] text-[11.5px]">{e.delivered_via}</td></tr>
            ))}</tbody></table>}
      </Section>
    </div>
  )
}

/* ================================================================ VOICE ASSISTANT */
export function VoiceAssistant() {
  const [lang, setLang] = useState<'en' | 'hi' | 'te'>('en')
  const [heard, setHeard] = useState('')
  const [reply, setReply] = useState('')
  const [rec, setRec] = useState<any>(null)
  const { toast } = useApp()
  const NAMES = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' }
  const GREET = { en: 'Hello! I am your MediCare AI voice assistant. You can say things like: log my readings, read my reminders, or open prescription scanner.',
    hi: 'नमस्ते! मैं आपका MediCare AI वॉइस असिस्टेंट हूँ। आप कह सकते हैं: रीडिंग दर्ज करो, रिमाइंडर सुनाओ, या प्रिस्क्रिप्शन स्कैनर खोलो।',
    te: 'నమస్కారం! నేను మీ MediCare AI వాయిస్ అసిస్టెంట్. మీరు చెప్పవచ్చు: రీడింగ్ నమోదు చేయు, రిమైండర్లు చెప్పు, లేదా ప్రిస్క్రిప్షన్ స్కానర్ తెరువు।' }

  const respond = (text: string) => {
    const t = text.toLowerCase()
    let out = GREET[lang]
    if (/reminder|रिमाइंडर|రిమైండర్/.test(t)) {
      api.reminders().then((r) => {
        const lines = r.reminders.map((x) => `${x.med_name} at ${JSON.parse(x.times).join(' and ')}`).join('. ') || 'no active reminders'
        out = lang === 'hi' ? `आपकी दवाएं: ${lines}` : lang === 'te' ? `మీ మందులు: ${lines}` : `Your medicines: ${lines}`
        setReply(out); speak(out, NAMES[lang])
      }).catch(() => {})
      return
    }
    if (/reading|glucose|sugar|blood|pressure|रीडिंग|रक्त|రీడింగ్/.test(t)) {
      api.readings(7).then((r) => {
        const last = r.readings[r.readings.length - 1]
        out = last ? (lang === 'hi' ? `आखिरी रीडिंग: शुगर ${last.glucose ?? 'ज्ञात नहीं'}, बीपी ${last.systolic ?? '?'}/${last.diastolic ?? '?'}।` :
          lang === 'te' ? `చివరి రీడింగ్: షుగర్ ${last.glucose ?? '?'}, బీపీ ${last.systolic ?? '?'}/${last.diastolic ?? '?'}.` :
          `Your latest reading: glucose ${last.glucose ?? 'n/a'}, blood pressure ${last.systolic ?? '?'}/${last.diastolic ?? '?'}.`) :
          (lang === 'hi' ? 'अभी कोई रीडिंग दर्ज नहीं है।' : lang === 'te' ? 'ఇంకా రీడింగ్లు లేవు.' : 'No readings logged yet.')
        setReply(out); speak(out, NAMES[lang])
      }).catch(() => {})
      return
    }
    setReply(out); speak(out, NAMES[lang])
  }

  const toggle = () => {
    if (rec) { rec.stop?.(); setRec(null); return }
    if (!speechSupported()) { toast('Speech recognition is not supported in this browser (works best in Chrome). Type your question instead.', 'warn'); return }
    const r = listen(NAMES[lang], (t) => { setHeard(t); respond(t) }, (e) => toast(e, 'warn'))
    setRec(r)
  }

  return (
    <Section title="AI voice assistant" sub="Telugu · हिन्दी · English — speech-to-text, text-to-speech and simple explanations" icon={Mic}>
      <div className="flex flex-wrap items-center gap-3">
        <select value={lang} onChange={(e) => setLang(e.target.value as any)} className="input w-auto">
          <option value="en">English</option><option value="hi">हिन्दी</option><option value="te">తెలుగు</option>
        </select>
        <button onClick={toggle} className={cn('btn', rec ? 'btn-danger' : 'btn-primary')}>
          {rec ? <><Mic size={15} /> Listening… tap to stop</> : <><Mic size={15} /> Tap to speak</>}
        </button>
        <button onClick={() => speak(reply || GREET[lang], NAMES[lang])} className="btn btn-teal-soft"><Volume2 size={15} /> Speak again</button>
        <button onClick={stopSpeaking} className="btn btn-ghost"><Speaker size={15} /> Stop</button>
      </div>
      <div className="mt-4 space-y-2">
        {heard && <p className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[12.5px] text-slate-600"><strong>You said:</strong> {heard}</p>}
        {reply && <p className="rounded-lg bg-brand-50 border border-brand-100 p-3 text-[12.5px] text-brand-800"><strong>MediCare AI:</strong> {reply}</p>}
        {!speechSupported() && <p className="text-[11.5px] text-amber-600">Voice input is unavailable in this browser; Read-aloud (text-to-speech) still works.</p>}
      </div>
      <Disclaimer>The assistant speaks only information from your own record, in simple language. It does not give medical advice or diagnoses.</Disclaimer>
    </Section>
  )
}

/* ================================================================ MY REPORTS / SUMMARY */
export function MyReports() {
  const [rep, setRep] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)
  useEffect(() => { api.myReports().then(setRep).catch(() => {}); api.summary().then(setSummary).catch(() => {}) }, [])
  const download = () => {
    if (!summary) return
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'medicare-health-summary.json'; a.click()
  }
  return (
    <div className="space-y-5">
      <Section title="My reports" sub="Prescriptions and lab reports you have uploaded" icon={FileText}
        right={<button onClick={download} className="btn btn-teal-soft btn-sm">Download health summary</button>}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500 mb-2">Prescriptions</p>
            {(rep?.prescriptions || []).length === 0 ? <p className="text-[12.5px] text-slate-500">None yet.</p> :
              (rep?.prescriptions || []).map((p: any) => (
                <p key={p.id} className="flex items-center gap-2 border-b border-slate-100 py-2 text-[12.5px]">
                  <FileText size={13} className="text-brand-500" /> {p.file} <span className="ml-auto text-slate-400">{p.date}</span></p>
              ))}
          </div>
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500 mb-2">Lab reports</p>
            {(rep?.labs || []).length === 0 ? <p className="text-[12.5px] text-slate-500">None yet.</p> :
              (rep?.labs || []).map((p: any) => (
                <p key={p.id} className="flex items-center gap-2 border-b border-slate-100 py-2 text-[12.5px]">
                  <FlaskConical size={13} className="text-teal-500" /> {p.file} <span className="ml-auto text-slate-400">{p.date}</span></p>
              ))}
          </div>
        </div>
        {summary && <Disclaimer>{summary.disclaimer} {summary.label}</Disclaimer>}
      </Section>
    </div>
  )
}

/* ================================================================ APPOINTMENTS */
export function Appointments() {
  const { toast } = useApp()
  const [rows, setRows] = useState<any[]>([])
  const [docs, setDocs] = useState<any[]>([])
  const [form, setForm] = useState<any>({ doctor_user_id: '', date: '', time: '', reason: '' })
  const load = () => api.appts().then((r) => setRows(r.appointments)).catch((e) => toast(e.message, 'error'))
  useEffect(() => { load(); api.doctors().then((r) => setDocs(r.doctors)).catch(() => {}) }, [])
  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    try { await api.addAppt(form); toast('Appointment booked.'); setForm({ doctor_user_id: '', date: '', time: '', reason: '' }); load() }
    catch (err) { toast((err as ApiError).message, 'error') }
  }
  return (
    <Section title="Appointments" sub="Your consultations with authorised doctors" icon={CalendarDays}>
      <table className="tbl"><thead><tr><th>Date</th><th>Time</th><th>Doctor</th><th>Reason</th><th>Status</th></tr></thead>
        <tbody>{rows.map((a) => (
          <tr key={a.id}><td>{a.date}</td><td>{a.time}</td><td>{a.doctor_name || `#${a.doctor_user_id}`}</td>
            <td>{a.reason || '—'}</td><td><Badge tone={a.status === 'booked' ? 'blue' : 'green'}>{a.status}</Badge></td></tr>
        ))}{rows.length === 0 && <tr><td colSpan={5} className="text-slate-500">No appointments yet.</td></tr>}</tbody></table>
      <form onSubmit={add} className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
        <select required className="input" value={form.doctor_user_id} onChange={(e) => setForm({ ...form, doctor_user_id: e.target.value })}>
          <option value="">Choose doctor…</option>
          {docs.map((d) => <option key={d.user_id} value={d.user_id}>{d.name} ({d.specialty || 'General'})</option>)}
        </select>
        <input required type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <input required type="time" className="input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
        <button className="btn btn-primary">Book</button>
      </form>
    </Section>
  )
}

/* ================================================================ FAMILY / CONSENT */
export function FamilyAccess() {
  const { toast } = useApp()
  const [rows, setRows] = useState<any[]>([])
  const [email, setEmail] = useState(''); const [relation, setRelation] = useState('Family')
  const load = () => api.consents().then((r) => setRows(r.consents)).catch((e) => toast(e.message, 'error'))
  useEffect(() => { load() }, [])
  const grant = async (e: React.FormEvent) => {
    e.preventDefault()
    try { await api.grantConsent(email, relation); toast('Access granted — they can now view your health summary.'); setEmail(''); load() }
    catch (err) { toast((err as ApiError).message, 'error') }
  }
  const revoke = async (id: number) => { await api.revokeConsent(id); toast('Access revoked.'); load() }
  return (
    <Section title="Family & doctor access (consent)" sub="You decide who can see your health data — and can revoke at any time" icon={ShieldCheck}>
      <form onSubmit={grant} className="mb-4 flex flex-wrap gap-2">
        <input required type="email" placeholder="Family member's email" className="input max-w-xs" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Relation" className="input max-w-[160px]" value={relation} onChange={(e) => setRelation(e.target.value)} />
        <button className="btn btn-primary"><UserPlus size={14} /> Grant access</button>
      </form>
      <table className="tbl"><thead><tr><th>Member email</th><th>Relation</th><th>Status</th><th>Granted</th><th></th></tr></thead>
        <tbody>{rows.map((c) => (
          <tr key={c.id}><td>{c.member_email}</td><td>{c.relation || '—'}</td>
            <td><Badge tone={c.status === 'granted' ? 'green' : 'slate'}>{c.status}</Badge></td><td>{c.created_at?.slice(0, 10)}</td>
            <td>{c.status === 'granted' && <button onClick={() => revoke(c.id)} className="btn btn-danger-soft btn-sm py-1.5">Revoke</button>}</td></tr>
        ))}{rows.length === 0 && <tr><td colSpan={5} className="text-slate-500">Nobody has access yet.</td></tr>}</tbody></table>
      <Disclaimer>Revoked members lose access immediately. Every access is written to the audit log.</Disclaimer>
    </Section>
  )
}

/* ================================================================ PROFILE */
export function Profile() {
  const { toast } = useApp()
  const [p, setP] = useState<any>(null)
  const [docs, setDocs] = useState<any[]>([])
  useEffect(() => {
    api.profile().then((r) => setP(r.profile || {})).catch(() => setP({}))
    api.doctors().then((r) => setDocs(r.doctors)).catch(() => {})
  }, [])
  if (!p) return null
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    try { await api.saveProfile(p); toast('Profile saved.') } catch (err) { toast((err as ApiError).message, 'error') }
  }
  const F = (label: string, key: string, type = 'text', list?: any[]) => (
    <div><label className="label">{label}</label>
      {list ? <select className="input" value={p[key] || ''} onChange={(e) => setP({ ...p, [key]: e.target.value })}>
        <option value="">—</option>{list.map((d: any) => <option key={d.user_id} value={d.user_id}>{d.name}</option>)}</select>
      : <input type={type} className="input" value={p[key] || ''} onChange={(e) => setP({ ...p, [key]: e.target.value })} />}</div>
  )
  return (
    <Section title="My health profile" sub="Used by the safety checker, emergency alerts and your doctor" icon={Heart}>
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {F('Age', 'age', 'number')}{F('Contact number', 'phone')}{F('Emergency contact', 'emergency_contact')}
        {F('Existing conditions', 'conditions')}{F('Known allergies', 'allergies')}{F('Blood group', 'blood_group')}
        {F('Primary doctor', 'doctor_id', 'text', docs)}
        <div className="sm:col-span-2 lg:col-span-3"><button className="btn btn-primary">Save profile</button></div>
      </form>
      <Disclaimer>Your allergy list automatically feeds the Medicine Safety Checker.</Disclaimer>
    </Section>
  )
}
