import React from 'react'
import {
  LayoutDashboard, ClipboardList, ScanLine, FileText, FileSearch, Microscope,
  FlaskConical, UploadCloud, CheckCircle2, Clock, AlertTriangle, Send, Eye,
  Droplet, Activity, Scan, Search as SearchIcon, BadgeCheck, Timer,
} from 'lucide-react'
import { PortalLayout, Panel, KpiRow } from '../../components/PortalLayout'
import {
  Card, CardHead, Badge, Btn, Stat, Field, Input, Textarea, Select, Search,
  Tabs, Table, Modal, Empty, statusTone, KV, Bar, AiDisclaimer,
} from '../../components/ui'
import { OpsTrend, Donut } from '../../components/charts'
import { useApp } from '../../context/AppContext'
import { LabIntelligence } from './LabIntelligence'
import { LAB_REQUESTS, LAB_REPORTS } from '../../data/mock'

type View = 'dashboard' | 'requests' | 'upload' | 'reports' | 'dispatch' | 'catalog' | 'intel'

const MODALITIES = ['Blood Test', 'Urine Test', 'X-Ray', 'CT', 'MRI', 'Other Diagnostics']

const CATALOG = [
  { code: 'BLD-CBC', test: 'Complete Blood Count (CBC)', mod: 'Blood Test', tube: 'EDTA (Purple)', tat: '4 hrs', price: 450 },
  { code: 'BLD-LIP', test: 'Lipid Profile', mod: 'Blood Test', tube: 'SST (Gold)', tat: '6 hrs', price: 750 },
  { code: 'BLD-THY', test: 'Thyroid Profile (T3/T4/TSH)', mod: 'Blood Test', tube: 'SST (Gold)', tat: '8 hrs', price: 900 },
  { code: 'BLD-VIT', test: 'Vitamin D (25-OH)', mod: 'Blood Test', tube: 'SST (Gold)', tat: '12 hrs', price: 1200 },
  { code: 'BLD-HBA', test: 'HbA1c (Glycated Haemoglobin)', mod: 'Blood Test', tube: 'EDTA (Purple)', tat: '6 hrs', price: 700 },
  { code: 'URN-RM', test: 'Urine Routine & Microscopy', mod: 'Urine Test', tube: 'Sterile container', tat: '3 hrs', price: 350 },
  { code: 'RAD-XR', test: 'X-Ray — Chest PA', mod: 'X-Ray', tube: 'N/A', tat: '30 min', price: 400 },
  { code: 'RAD-CT', test: 'CT Head — Plain', mod: 'CT', tube: 'N/A', tat: '1 hr', price: 3200 },
  { code: 'RAD-MRI', test: 'MRI Brain — Plain', mod: 'MRI', tube: 'N/A', tat: '2 hrs', price: 6500 },
  { code: 'RAD-USG', test: 'Ultrasound — Abdomen & Pelvis', mod: 'Other Diagnostics', tube: 'N/A', tat: '45 min', price: 1500 },
]

const ABNORMAL: Record<string, boolean> = {
  Haemoglobin: true, TSH: true, 'Vitamin D': true, MCV: true,
}

function useNow() {
  const [now, setNow] = React.useState(() => new Date(2026, 9, 4, 10, 4, 0))
  React.useEffect(() => {
    const t = window.setInterval(() => setNow((d) => new Date(d.getTime() + 1000)), 1000)
    return () => window.clearInterval(t)
  }, [])
  return now
}
const pad = (n: number) => String(n).padStart(2, '0')

/* ------------------------------ dashboard ------------------------------ */

function Dashboard({ go }: { go: (v: View) => void }) {
  const { reports } = useApp()
  const now = useNow()
  const processing = LAB_REQUESTS.filter((r) => r.status === 'Processing').length
  const pending = LAB_REQUESTS.filter((r) => r.status === 'Pending').length
  const verified = LAB_REQUESTS.filter((r) => r.status === 'Verified').length

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-4 text-[13px] font-semibold text-teal-800">
        Lab workstation active — Sneha Pillai, Pathology &amp; Radiology. Session clock:{' '}
        <span className="font-mono">{pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}</span>
      </div>

      <KpiRow
        items={[
          { label: 'Test Requests Today', value: LAB_REQUESTS.length + 8, sub: 'All modalities', icon: ClipboardList, tone: 'brand' },
          { label: 'Processing', value: processing, sub: 'On the bench now', icon: Timer, tone: 'amber' },
          { label: 'Awaiting Sample', value: pending, sub: 'Collection pending', icon: Clock, tone: 'purple' },
          { label: 'Reports Verified', value: verified + 11, sub: 'Signed & released', icon: BadgeCheck, tone: 'green' },
          { label: 'Critical Flags', value: 2, sub: 'Require doctor callback', icon: AlertTriangle, tone: 'red' },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHead icon={Activity} title="Lab Throughput — This Week" sub="Samples received and reports released" tone="teal" />
          <OpsTrend data={[{ day: 'Mon', opd: 34, emg: 28 }, { day: 'Tue', opd: 41, emg: 33 }, { day: 'Wed', opd: 38, emg: 36 }, { day: 'Thu', opd: 45, emg: 39 }, { day: 'Fri', opd: 52, emg: 44 }, { day: 'Sat', opd: 30, emg: 26 }, { day: 'Sun', opd: 18, emg: 14 }]} height={250} />
        </Card>
        <Card>
          <CardHead icon={FlaskConical} title="Sample Status" sub="Current bench load" tone="purple" />
          <Donut value={36} total={48} label="Reports released" sub="48 orders received today" color="#0d9488" height={200} />
          <div className="mt-3 space-y-2 text-[12px]">
            {[['Received', 18, 'blue'], ['In Analysis', 12, 'amber'], ['Verified', 6, 'green']].map(([l, v, t]) => (
              <div key={l as string} className="flex items-center justify-between">
                <span className="text-slate-600">{l as string}</span>
                <Badge tone={t as any}>{v as number}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHead
          icon={ClipboardList}
          title="Latest Test Requests"
          sub="Requests raised by clinicians — demo data"
          tone="blue"
          right={<Btn size="sm" variant="ghost" onClick={() => go('requests')}>Open Test Requests</Btn>}
        />
        <Table head={['Request', 'Patient', 'Panel', 'Modality', 'Ordered By', 'Priority', 'Status']}>
          {LAB_REQUESTS.slice(0, 6).map((r) => (
            <tr key={r.id} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pl-4 font-mono text-[11px] font-semibold text-slate-500">{r.id}</td>
              <td className="py-3 text-[13px] font-semibold">{r.patient}</td>
              <td className="py-3 text-[12px] text-slate-600">{r.panel}</td>
              <td className="py-3"><Badge tone={r.type === 'Blood Test' ? 'red' : r.type === 'Urine Test' ? 'amber' : 'purple'}>{r.type}</Badge></td>
              <td className="py-3 text-[12px] text-slate-600">{r.doctor}</td>
              <td className="py-3"><Badge tone={r.priority === 'Critical' ? 'red' : r.priority === 'Urgent' ? 'amber' : 'slate'}>{r.priority}</Badge></td>
              <td className="py-3 pr-4"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
            </tr>
          ))}
        </Table>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {[
          { l: 'Blood Tests', v: 24, i: Droplet, t: 'red' },
          { l: 'Imaging (CT / MRI / X-Ray)', v: 11, i: Scan, t: 'purple' },
          { l: 'Other Diagnostics', v: 7, i: Microscope, t: 'teal' },
        ].map((s) => <Stat key={s.l} label={s.l} value={s.v} sub="Today" icon={s.i as any} tone={s.t as any} />)}
      </div>
    </div>
  )
}

/* ------------------------------ requests ------------------------------ */

function Requests() {
  const { toast } = useApp()
  const [tab, setTab] = React.useState('all')
  const [rows, setRows] = React.useState(LAB_REQUESTS as any[])
  const list = rows.filter((r) => tab === 'all' || r.status === tab)

  const advance = (id: string, next: string) => {
    setRows((s) => s.map((r) => (r.id === id ? { ...r, status: next } : r)))
    toast(`${id} updated to ${next}`, 'success')
  }

  return (
    <Card>
      <CardHead icon={ClipboardList} title="Test Requests" sub="Move each order through sample → analysis → verification" tone="blue" right={<Btn size="sm" variant="soft">Print Worklist</Btn>} />
      <div className="mb-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'all', label: 'All', count: rows.length },
            { id: 'Pending', label: 'Pending', count: rows.filter((r) => r.status === 'Pending').length },
            { id: 'Processing', label: 'Processing', count: rows.filter((r) => r.status === 'Processing').length },
            { id: 'Verified', label: 'Verified', count: rows.filter((r) => r.status === 'Verified').length },
          ]}
        />
      </div>
      {list.length === 0 ? <Empty title="No requests in this state" icon={CheckCircle2} /> : (
        <Table head={['Request', 'Patient', 'Panel', 'Modality', 'Sample', 'Ordered', 'Priority', 'Status', 'Action']}>
          {list.map((r) => (
            <tr key={r.id} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pl-4 font-mono text-[11px] font-semibold text-slate-500">{r.id}</td>
              <td className="py-3 text-[13px] font-semibold">{r.patient}</td>
              <td className="py-3 text-[12px] text-slate-600">{r.panel}</td>
              <td className="py-3 text-[12px] text-slate-600">{r.type}</td>
              <td className="py-3"><Badge tone={r.sample === 'Awaiting' ? 'amber' : 'teal'}>{r.sample}</Badge></td>
              <td className="py-3 text-[12px] text-slate-600">{r.requested}</td>
              <td className="py-3"><Badge tone={r.priority === 'Critical' ? 'red' : r.priority === 'Urgent' ? 'amber' : 'slate'}>{r.priority}</Badge></td>
              <td className="py-3"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
              <td className="py-3 pr-4">
                <div className="flex gap-1.5">
                  {r.status === 'Pending' && <Btn size="sm" variant="ghost" onClick={() => advance(r.id, 'Processing')}>Start Analysis</Btn>}
                  {r.status === 'Processing' && <Btn size="sm" variant="teal-soft" onClick={() => advance(r.id, 'Verified')}>Verify</Btn>}
                  {r.status === 'Verified' && <span className="text-[12px] font-semibold text-emerald-600">Released</span>}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  )
}

/* ------------------------------ upload ------------------------------ */

function Upload() {
  const { addReport, toast } = useApp()
  const [mod, setMod] = React.useState('Blood Test')
  const [f, setF] = React.useState({ request: 'LR-2026-000045', patient: 'Radhika D C', panel: 'Urine Routine & Microscopy', file: 'urine_routine_0410.pdf' })
  const [stage, setStage] = React.useState<'idle' | 'reading' | 'done'>('idle')
  const [extracted, setExtracted] = React.useState<any[]>([])
  const set = (k: string) => (e: any) => setF((s) => ({ ...s, [k]: e.target.value }))

  const run = () => {
    setStage('reading')
    window.setTimeout(() => {
      const rows = mod === 'Blood Test'
        ? [
            { test: 'Haemoglobin', value: 10.4, unit: 'g/dL', low: 12, high: 15, flag: 'Low' },
            { test: 'Total WBC', value: 8.1, unit: '×10³/µL', low: 4, high: 11, flag: 'Normal' },
            { test: 'Platelets', value: 245, unit: '×10³/µL', low: 150, high: 410, flag: 'Normal' },
          ]
        : [
            { test: 'Colour', value: 'Pale yellow', unit: '—', low: '', high: '', flag: 'Normal' },
            { test: 'Protein', value: 'Trace', unit: '—', low: '', high: '', flag: 'Abnormal' },
            { test: 'Pus Cells', value: 6, unit: '/hpf', low: 0, high: 5, flag: 'Abnormal' },
          ]
      setExtracted(rows)
      setStage('done')
      toast('Values extracted — review before verifying', 'info')
    }, 1100)
  }

  const release = () => {
    const id = `LAB-2026-00${40 + Math.floor(Math.random() * 9)}`
    addReport({
      id, panel: f.panel, date: '04 Oct 2026', doctor: 'Dr. Rajesh Sharma', lab: 'Sneha Pillai',
      type: mod, status: 'Verified', patient: f.patient, rows: extracted,
    })
    toast(`Report ${id} verified and queued for dispatch`, 'success')
    setStage('idle')
    setExtracted([])
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHead icon={UploadCloud} title="Upload / Enter Report Values" sub="Attach the instrument output and review the parsed values" tone="teal" />
        <div className="space-y-4">
          <Field label="Linked Test Request"><Input value={f.request} onChange={set('request')} /></Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Patient"><Input value={f.patient} onChange={set('patient')} /></Field>
            <Field label="Modality"><Select value={mod} onChange={(e: any) => setMod(e.target.value)}>{MODALITIES.map((m) => <option key={m}>{m}</option>)}</Select></Field>
          </div>
          <Field label="Panel / Test Name"><Input value={f.panel} onChange={set('panel')} /></Field>
          <Field label="Attach Instrument File" hint="Demo accepts any file name — values are simulated">
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <UploadCloud className="mx-auto text-slate-400" size={26} />
              <p className="mt-2 text-[12px] font-semibold text-slate-600">{f.file}</p>
              <input type="file" className="mt-2 w-full text-[11px]" onChange={(e: any) => setF((s) => ({ ...s, file: e.target.files?.[0]?.name || s.file }))} />
            </div>
          </Field>
          <div className="rounded-xl bg-slate-50 p-3 text-[12px] text-slate-600">
            Values written here flow into the patient record, the doctor portal and the patient's lab report list in this demo.
          </div>
          <div className="flex flex-wrap gap-2">
            {stage === 'idle' && <Btn onClick={run}><ScanLine size={15} /> Parse &amp; Extract</Btn>}
            {stage === 'reading' && <Btn variant="soft">Reading document…</Btn>}
            {stage === 'done' && <Btn variant="teal" onClick={release}><CheckCircle2 size={15} /> Verify &amp; Save Report</Btn>}
            <Btn variant="ghost">Save Draft</Btn>
          </div>
        </div>
      </Card>

      <Card>
        <CardHead icon={FileSearch} title="Extracted Values" sub="Review each row before verification" tone="purple" />
        {stage !== 'done' ? (
          <Empty title="Nothing extracted yet" sub="Parse a document to see the value table here." icon={ScanLine} />
        ) : (
          <>
            <Table head={['Test', 'Value', 'Unit', 'Flag']}>
              {extracted.map((r) => (
                <tr key={r.test} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pl-4 text-[13px] font-semibold">{r.test}</td>
                  <td className="py-3 text-[13px] font-bold text-slate-800">{String(r.value)}</td>
                  <td className="py-3 text-[12px] text-slate-500">{r.unit}</td>
                  <td className="py-3 pr-4"><Badge tone={r.flag === 'Normal' ? 'green' : r.flag === 'Low' ? 'amber' : 'red'}>{r.flag}</Badge></td>
                </tr>
              ))}
            </Table>
            <div className="mt-4">
              <Bar value={94} tone="teal" />
              <p className="mt-1 text-[11px] text-slate-500">Document parse confidence: 94%</p>
            </div>
            <div className="mt-4">
              <AiDisclaimer text="Extracted values must be checked against the instrument output by a qualified lab technologist before verification." />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

/* ------------------------------ reports ------------------------------ */

function Reports() {
  const { reports } = useApp()
  const all = [...reports, ...LAB_REPORTS]
  const [sel, setSel] = React.useState<any>(null)

  return (
    <div className="space-y-5">
      <Card>
        <CardHead icon={FileText} title={`Patient Reports (${all.length})`} sub="Verified and pending reports in the demo archive" tone="blue" right={<Btn size="sm" variant="soft">Print All</Btn>} />
        <div className="mb-4 max-w-md"><Search placeholder="Search patient, panel or report ID" /></div>
        <Table head={['Report', 'Patient', 'Panel', 'Modality', 'Date', 'Doctor', 'Status', 'Action']}>
          {all.map((r: any) => (
            <tr key={r.id} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pl-4 font-mono text-[11px] font-semibold text-slate-500">{r.id}</td>
              <td className="py-3 text-[13px] font-semibold">{r.patient || 'Radhika D C'}</td>
              <td className="py-3 text-[12px] text-slate-600">{r.panel}</td>
              <td className="py-3"><Badge tone={r.type === 'Blood Test' ? 'red' : r.type === 'Urine Test' ? 'amber' : 'purple'}>{r.type}</Badge></td>
              <td className="py-3 text-[12px] text-slate-600">{r.date}</td>
              <td className="py-3 text-[12px] text-slate-600">{r.doctor}</td>
              <td className="py-3"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
              <td className="py-3 pr-4"><Btn size="sm" variant="ghost" onClick={() => setSel(r)}><Eye size={13} /> Open</Btn></td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={!!sel} onClose={() => setSel(null)} title="Laboratory Report" sub={sel ? `${sel.id} · ${sel.panel}` : ''} wide>
        {sel && (
          <div className="space-y-4">
            <KV
              items={[
                { k: 'Patient', v: sel.patient || 'Radhika D C' },
                { k: 'Panel', v: sel.panel },
                { k: 'Modality', v: sel.type },
                { k: 'Reported On', v: sel.date },
                { k: 'Ordered By', v: sel.doctor },
                { k: 'Pathologist', v: sel.lab || 'Sneha Pillai' },
              ]}
              cols={3}
            />
            <Table head={['Test', 'Value', 'Reference Range', 'Status', 'Explanation', 'Suggested Follow-up']}>
              {(sel.rows || []).map((r: any) => {
                const bad = ABNORMAL[r.test] || (typeof r.value === 'number' && (r.low === 0 && r.high === 0 ? false : r.value < r.low || r.value > r.high))
                return (
                  <tr key={r.test} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pl-4 text-[13px] font-semibold">{r.test}</td>
                    <td className="py-3 text-[13px] font-bold">{r.value} <span className="text-[11px] font-normal text-slate-500">{r.unit}</span></td>
                    <td className="py-3 text-[12px] text-slate-600">{r.low && r.high ? `${r.low} – ${r.high} ${r.unit}` : '—'}</td>
                    <td className="py-3"><Badge tone={bad ? 'amber' : 'green'}>{bad ? 'Abnormal' : 'Within range'}</Badge></td>
                    <td className="py-3 text-[12px] text-slate-600">{r.explain}</td>
                    <td className="py-3 pr-4 text-[12px] text-slate-600">{r.follow}</td>
                  </tr>
                )
              })}
            </Table>
            <AiDisclaimer />
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ------------------------------ dispatch ------------------------------ */

function Dispatch() {
  const { toast } = useApp()
  const [sent, setSent] = React.useState<Record<string, { doctor: boolean; patient: boolean }>>({})
  const rows = LAB_REPORTS

  const send = (id: string, to: 'doctor' | 'patient') => {
    setSent((s) => ({ ...s, [id]: { doctor: false, patient: false, ...(s[id] || {}), [to]: true } }))
    toast(`${id} ${to === 'doctor' ? 'pushed to the treating doctor' : 'shared to the patient portal'}`, 'success')
  }

  return (
    <Card>
      <CardHead icon={Send} title="Send Reports to Doctor & Patient" sub="Release verified reports to the right people" tone="green" />
      <Table head={['Report', 'Panel', 'Patient', 'Verified By', 'Doctor Notified', 'Patient Notified', 'Action']}>
        {rows.map((r) => (
          <tr key={r.id} className="border-b border-slate-100 last:border-0">
            <td className="py-3 pl-4 font-mono text-[11px] font-semibold text-slate-500">{r.id}</td>
            <td className="py-3 text-[12px] text-slate-700">{r.panel}</td>
            <td className="py-3 text-[13px] font-semibold">Radhika D C</td>
            <td className="py-3 text-[12px] text-slate-600">{r.lab}</td>
            <td className="py-3">{sent[r.id]?.doctor ? <Badge tone="green">Sent</Badge> : <Badge tone="slate">Pending</Badge>}</td>
            <td className="py-3">{sent[r.id]?.patient ? <Badge tone="green">Sent</Badge> : <Badge tone="slate">Pending</Badge>}</td>
            <td className="py-3 pr-4">
              <div className="flex gap-1.5">
                <Btn size="sm" variant="ghost" onClick={() => send(r.id, 'doctor')}>To Doctor</Btn>
                <Btn size="sm" variant="teal-soft" onClick={() => send(r.id, 'patient')}>To Patient</Btn>
              </div>
            </td>
          </tr>
        ))}
      </Table>
      <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/70 p-3 text-[12px] text-brand-800">
        Dispatch events are written to the audit log (LAB_REPORT_DISPATCHED) with actor, timestamp and destination in the
        full build.
      </div>
    </Card>
  )
}

/* ------------------------------ catalog ------------------------------ */

function Catalog() {
  const [q, setQ] = React.useState('')
  const rows = CATALOG.filter((c) => !q || `${c.test} ${c.mod} ${c.code}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <Card>
      <CardHead icon={Microscope} title="Test Catalogue" sub="Available panels, specimen requirements and tariff" tone="purple" />
      <div className="mb-4 max-w-md"><Search placeholder="Search test, code or modality" value={q} onChange={setQ} /></div>
      <Table head={['Code', 'Test / Panel', 'Modality', 'Specimen', 'Turnaround', 'Price', 'Status']}>
        {rows.map((c) => (
          <tr key={c.code} className="border-b border-slate-100 last:border-0">
            <td className="py-3 pl-4 font-mono text-[11px] font-semibold text-slate-500">{c.code}</td>
            <td className="py-3 text-[13px] font-semibold">{c.test}</td>
            <td className="py-3"><Badge tone={c.mod === 'Blood Test' ? 'red' : c.mod === 'Urine Test' ? 'amber' : 'purple'}>{c.mod}</Badge></td>
            <td className="py-3 text-[12px] text-slate-600">{c.tube}</td>
            <td className="py-3 text-[12px] text-slate-600">{c.tat}</td>
            <td className="py-3 text-[12px] font-semibold">₹{c.price}</td>
            <td className="py-3 pr-4"><Badge tone="green">Available</Badge></td>
          </tr>
        ))}
      </Table>
    </Card>
  )
}

/* ------------------------------ shell ------------------------------ */

const TITLES: Record<View, { t: string; s: string }> = {
  dashboard: { t: 'Lab Dashboard', s: 'Pathology & Radiology workstation' },
  requests: { t: 'Test Requests', s: 'Orders raised by clinicians' },
  upload: { t: 'Upload Report', s: 'Parse and verify instrument output' },
  reports: { t: 'Manage Reports', s: 'Patient report archive' },
  dispatch: { t: 'Send to Doctor / Patient', s: 'Report release workflow' },
  intel: { t: 'Critical Values & Trends', s: 'Critical-result screening, trend intelligence and workflow tracking' },
  catalog: { t: 'Test Catalogue', s: 'Panels, specimens and tariffs' },
}

export default function LabPortal() {
  const [view, setView] = React.useState<View>('dashboard')
  return (
    <PortalLayout
      role="lab"
      view={view}
      setView={(v: string) => setView(v as View)}
      title={TITLES[view].t}
      sub={TITLES[view].s}
      searchPlaceholder="Search requests, reports, patients…"
    >
      {view === 'dashboard' && <Dashboard go={setView} />}
      {view === 'intel' && <LabIntelligence />}
      {view === 'requests' && <Requests />}
      {view === 'upload' && <Upload />}
      {view === 'reports' && <Reports />}
      {view === 'dispatch' && <Dispatch />}
      {view === 'catalog' && <Catalog />}
    </PortalLayout>
  )
}
