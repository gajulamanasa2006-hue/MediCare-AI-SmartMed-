/* =====================================================================
   LABORATORY PORTAL — Intelligent Lab Management
   Critical-value screening · trend intelligence · workflow tracking
   ===================================================================== */
import React, { useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowRight, BadgeCheck, CheckCircle2, ClipboardCheck, Bell, Beaker,
  FlaskConical, History, Play, ShieldAlert, Send, TrendingUp, Upload, UserCheck,
} from 'lucide-react'
import { Panel, KpiRow } from '../../components/PortalLayout'
import { Badge, Field, Input, KV, Select, cn, statusTone } from '../../components/ui'
import { SimpleLine } from '../../components/charts'
import { useClinical, type LabRequest } from '../../context/ClinicalContext'
import { LAB_PARAMS, criticalFlags } from '../../lib/icu'

const FLOW: LabRequest['status'][] = ['Requested', 'Sample Collected', 'Processing', 'Verification', 'Report Available']

const TREND: Record<string, { d: string; v: number }[]> = {
  hb: [{ d: 'Aug', v: 13.2 }, { d: 'Sep', v: 12.4 }, { d: 'Oct', v: 11.1 }, { d: 'Now', v: 9.4 }],
  wbc: [{ d: 'Aug', v: 7.1 }, { d: 'Sep', v: 9.8 }, { d: 'Oct', v: 14.2 }, { d: 'Now', v: 18.2 }],
  plt: [{ d: 'Aug', v: 262 }, { d: 'Sep', v: 248 }, { d: 'Oct', v: 214 }, { d: 'Now', v: 168 }],
  cr: [{ d: 'Aug', v: 0.9 }, { d: 'Sep', v: 1.1 }, { d: 'Oct', v: 1.6 }, { d: 'Now', v: 2.3 }],
  glu: [{ d: 'Aug', v: 104 }, { d: 'Sep', v: 128 }, { d: 'Oct', v: 176 }, { d: 'Now', v: 224 }],
}

export function LabIntelligence() {
  const { labRequests, advanceLab, releaseResult, timeline, alerts } = useClinical()
  const [tab, setTab] = useState<'critical' | 'trend' | 'workflow'>('critical')
  const [entryId, setEntryId] = useState(labRequests.find((l) => l.status !== 'Report Available')?.id || '')
  /* seeded with values that deliberately breach the configured critical limits,
     so the screening panel is populated the moment the page opens */
  const [vals, setVals] = useState<Record<string, string>>({ hb: '22', glu: '420', wbc: '12.4', plt: '210', creat: '2.1', k: '4.2' })

  const target = labRequests.find((l) => l.id === entryId)
  const parsed = Object.entries(vals).filter(([, v]) => v !== '').map(([key, v]) => ({ key, value: Number(v) }))
  const flags = criticalFlags(parsed)

  const critical = labRequests.filter((l) => l.critical)
  const overdue = labRequests.filter((l) => l.critical && !l.releasedToPatient && Date.now() - l.requestedAt > 3600000)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
        <span className="live-dot bg-emerald-500" />
        <p className="text-[12px] font-bold text-slate-800">Critical-value watch active</p>
        <p className="text-[11px] text-slate-500">· thresholds configured per assay, clinician-approved for the demo</p>
        <div className="ml-auto flex flex-wrap gap-1">
          {([['critical', 'Critical screening'], ['trend', 'Trend intelligence'], ['workflow', 'Workflow']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k as any)} className={cn('chip chip-sm', tab === k && 'bg-brand-600 text-white')}>{l}</button>
          ))}
        </div>
      </div>

      <KpiRow items={[
        { label: 'Orders in lab', value: labRequests.filter((l) => l.status !== 'Report Available').length, sub: 'From all portals', icon: FlaskConical, tone: 'brand' },
        { label: 'Critical results', value: critical.length, sub: `${overdue.length} awaiting acknowledgement`, icon: ShieldAlert, tone: critical.length ? 'red' : 'green' },
        { label: 'Published today', value: labRequests.filter((l) => l.status === 'Report Available').length, sub: 'Visible to doctor + patient', icon: BadgeCheck, tone: 'teal' },
        { label: 'Parameters monitored', value: LAB_PARAMS.length, sub: 'Configurable thresholds', icon: Beaker, tone: 'amber' },
      ]} />

      {tab === 'critical' && (
        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <Panel title="Structured result entry" sub="Values are screened the moment they are entered" icon={Upload}>
            <div className="grid gap-2.5">
              <Field label="Laboratory order">
                <Select value={entryId} onChange={(e: any) => setEntryId(e.target.value)}>
                  {labRequests.map((l) => <option key={l.id} value={l.id}>{l.id} · {l.patientName} · {l.panel}</option>)}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                {LAB_PARAMS.slice(0, 6).map((p) => (
                  <label key={p.key} className="block">
                    <span className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{p.name} ({p.unit})</span>
                    <input value={vals[p.key] ?? ''} onChange={(e) => setVals({ ...vals, [p.key]: e.target.value })}
                      className="input text-[12px]" />
                  </label>
                ))}
              </div>
            </div>

            <div className={cn('mt-3 rounded-lg border px-3 py-2.5', flags.length ? 'border-rose-300 bg-rose-50' : 'border-emerald-200 bg-emerald-50')}>
              <p className={cn('text-[11.5px] font-extrabold', flags.length ? 'text-rose-800' : 'text-emerald-800')}>
                {flags.length ? `Critical-value screening: ${flags.length} value(s) outside the critical limit` : 'Critical-value screening: within limits'}
              </p>
              {flags.map((f) => (
                <p key={f.key} className="mt-0.5 text-[11px] text-rose-700">• {f.name} {f.value} {f.unit} — {f.reason}</p>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button disabled={!target} onClick={() => target && advanceLab(target.id, 'Verification', parsed)}
                className="btn btn-primary btn-sm disabled:opacity-40"><BadgeCheck size={13} /> Authored verification</button>
              <button disabled={!target} onClick={() => target && advanceLab(target.id, 'Report Available', parsed)}
                className="btn btn-teal-soft btn-sm disabled:opacity-40"><Send size={13} /> Publish result</button>
              <button disabled={!target || !flags.length} onClick={() => target && releaseResult(target.id)}
                className="btn btn-ghost btn-sm disabled:opacity-40">Release to patient</button>
            </div>
            <p className="mt-2 text-[10.5px] text-slate-500">Result entry → screening → authorised verification → alert → doctor & nurse notified → acknowledgement → escalation if overdue.</p>
          </Panel>

          <div className="space-y-5">
            <Panel title="Critical alerts" sub="Acknowledgement timestamps and notification history" icon={ShieldAlert}>
              <div className="space-y-2">
                {labRequests.filter((l) => l.critical).map((l) => (
                  <div key={l.id} className="rounded-lg border border-rose-200 bg-rose-50/50 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11.5px] font-bold text-slate-900">{l.id} · {l.patientName}</p>
                      <Badge tone="red">Critical</Badge>
                    </div>
                    <p className="text-[10.5px] text-slate-600">{l.panel} · {l.priority} · {new Date(l.requestedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="mt-1 text-[10.5px] text-slate-600">
                      Doctor {alerts.some((a) => a.patientId === l.patientId && a.ackDoctor) ? '✓ notified' : '· notified'} ·
                      Nurse {alerts.some((a) => a.patientId === l.patientId && a.ackNurse) ? '✓ notified' : '· notified'} ·
                      {l.releasedToPatient ? ' patient release ✓' : ' release pending'}
                    </p>
                    {!l.releasedToPatient && <button onClick={() => releaseResult(l.id)} className="mt-1.5 text-[10.5px] font-bold text-brand-700">Record release →</button>}
                  </div>
                ))}
                {!labRequests.filter((l) => l.critical).length && <p className="text-[11.5px] text-slate-500">No critical values flagged.</p>}
              </div>
            </Panel>

            <Panel title="Threshold configuration" sub="Demo values · require laboratory director sign-off" icon={ClipboardCheck}>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="tbl">
                  <thead><tr><th>Parameter</th><th>Ref. range</th><th>Critical low</th><th>Critical high</th></tr></thead>
                  <tbody>
                    {LAB_PARAMS.map((p) => (
                      <tr key={p.key}>
                        <td className="px-3 py-1.5 text-[11.5px] font-semibold text-slate-800">{p.name}</td>
                        <td className="px-3 py-1.5 text-[11px] tabular-nums text-slate-600">{p.low}–{p.high} {p.unit}</td>
                        <td className="px-3 py-1.5 text-[11px] tabular-nums text-rose-600">{p.criticalLow ?? '—'}</td>
                        <td className="px-3 py-1.5 text-[11px] tabular-nums text-rose-600">{p.criticalHigh ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'trend' && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { key: 'hb', name: 'Haemoglobin', unit: 'g/dL', color: '#2563eb' },
            { key: 'wbc', name: 'White cell count', unit: '×10⁹/L', color: '#f59e0b' },
            { key: 'plt', name: 'Platelet count', unit: '×10⁹/L', color: '#e11d48' },
            { key: 'cr', name: 'Creatinine', unit: 'mg/dL', color: '#7c3aed' },
            { key: 'glu', name: 'Blood glucose', unit: 'mg/dL', color: '#0d9488' },
          ].map((p) => {
            const series = TREND[p.key] || []
            const first = series[0]?.v ?? 0
            const last = series[series.length - 1]?.v ?? 0
            const pct = first ? Math.round(((last - first) / first) * 100) : 0
            return (
              <Panel key={p.key} title={p.name} sub={`${p.unit} · 4-point series`} icon={TrendingUp}
                right={<Badge tone={Math.abs(pct) >= 25 ? 'red' : Math.abs(pct) >= 10 ? 'amber' : 'green'}>{pct > 0 ? '+' : ''}{pct}%</Badge>}>
                <SimpleLine data={series} k="v" name={p.name} unit={p.unit} color={p.color} height={150} />
                <p className="mt-1 text-[10.5px] text-slate-500">
                  {Math.abs(pct) >= 25 ? 'Significant change flagged for clinician review.' : Math.abs(pct) >= 10 ? 'Moderate drift — trend noted.' : 'Stable across measurements.'}
                </p>
              </Panel>
            )
          })}
          <Panel title="Linked observations" sub="Feeds the clinical timeline and Digital Health Twin" icon={History}>
            <div className="space-y-1.5">
              {timeline.filter((e) => e.kind === 'Lab Result').slice(0, 4).map((e) => (
                <div key={e.id} className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                  <p className="text-[11.5px] font-bold text-slate-800">{e.title}</p>
                  <p className="text-[10.5px] text-slate-500">{new Date(e.at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))}
              {!timeline.filter((e) => e.kind === 'Lab Result').length && <p className="text-[11.5px] text-slate-500">Publish a result to populate the timeline.</p>}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'workflow' && (
        <Panel title="Laboratory workflow tracking" sub="Test Requested → Sample Collected → Processing → Verification → Report Available" icon={FlaskConical}>
          <div className="space-y-3">
            {labRequests.map((l) => {
              const idx = FLOW.indexOf(l.status)
              return (
                <div key={l.id} className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[12.5px] font-extrabold text-slate-900">{l.id} · {l.patientName}</p>
                      <p className="text-[11px] text-slate-500">{l.panel} · {l.priority} · {l.requestedBy}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {l.critical && <Badge tone="red">Critical value</Badge>}
                      <Badge tone={statusTone(l.status)}>{l.status}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    {FLOW.map((s, i) => (
                      <React.Fragment key={s}>
                        <div className="flex-1">
                          <div className={cn('h-1.5 rounded-full', i <= idx ? 'bg-teal-500' : 'bg-slate-200')} />
                          <p className={cn('mt-1 truncate text-[9.5px] font-semibold', i <= idx ? 'text-teal-700' : 'text-slate-400')}>{s}</p>
                        </div>
                        {i < FLOW.length - 1 && <ArrowRight size={10} className={cn('shrink-0', i < idx ? 'text-teal-500' : 'text-slate-300')} />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {FLOW.slice(idx + 1, idx + 2).map((nxt) => (
                      <button key={nxt} onClick={() => advanceLab(l.id, nxt, l.values)} className="btn btn-ghost btn-sm"><Play size={12} /> Advance to {nxt}</button>
                    ))}
                    {l.status === 'Report Available' && !l.releasedToPatient && <button onClick={() => releaseResult(l.id)} className="btn btn-teal-soft btn-sm"><UserCheck size={12} /> Release to patient</button>}
                    {l.releasedToPatient && <span className="chip chip-sm bg-emerald-50 text-emerald-700">✓ visible in patient portal</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      )}

      <p className="rounded-lg bg-slate-50 px-3.5 py-2.5 text-[10.5px] leading-relaxed text-slate-500">
        All values, patients and thresholds are synthetic demonstration data. Nothing here constitutes a diagnosis or a
        treatment recommendation; release to the patient portal is always an explicit human action.
      </p>
    </div>
  )
}
