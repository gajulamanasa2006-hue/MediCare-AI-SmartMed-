/* =====================================================================
   DOCTOR PORTAL — Clinical Intelligence
   ICU risk dashboard · explainable alerts · AI clinical timeline
   ===================================================================== */
import React, { useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Clock, FlaskConical,
  HeartPulse, History, Pill, ShieldAlert, Stethoscope, Wind, BedDouble, FileText, Bell, X,
} from 'lucide-react'
import { Panel, KpiRow } from '../../components/PortalLayout'
import { Badge, Btn, Field, Input, KV, Select, cn, statusTone } from '../../components/ui'
import { SimpleLine, Donut } from '../../components/charts'
import { useClinical } from '../../context/ClinicalContext'
import { news2, type AlertLevel } from '../../lib/icu'
import { useApp } from '../../context/AppContext'

const LEVEL_TONE: Record<AlertLevel, string> = {
  Normal: 'green', 'Attention Required': 'amber', 'High Priority': 'amber', Critical: 'red',
}

const ICU_MEDS: Record<string, string[]> = {
  'ICU-001': ['Piperacillin-Tazobactam 4.5 g IV q8h', 'Paracetamol 1 g PRN', 'Enoxaparin 40 mg SC'],
  'ICU-002': ['Noradrenaline 0.08 µg/kg/min', 'Meropenem 1 g IV q8h', 'Insulin sliding scale'],
  'ICU-003': ['Salbutamol nebulisation q4h', 'Hydrocortisone 100 mg IV q8h', 'Oxygen 4 L/min nasal'],
  'ICU-004': ['Amlodipine 5 mg OD', 'Atorvastatin 20 mg ON', 'Heparin 5000 U SC'],
  'ICU-005': ['Furosemide 40 mg IV BD', 'Carvedilol 3.125 mg BD', 'Potassium replacement'],
  'ICU-006': ['Insulin Glargine 18 U ON', 'Metformin withheld', 'Glucose 10% infusion'],
}

export function ClinicalIntelligence() {
  const { icu, alerts, ackAlert, timeline, labRequests, requestLab, running } = useClinical()
  const { toast } = useApp()
  const [tab, setTab] = useState<'risk' | 'alerts' | 'timeline'>('risk')
  const [sel, setSel] = useState('ICU-003')

  const scored = icu.map((p) => ({ ...p, s: news2(p.vitals) }))
  const patient = scored.find((p) => p.id === sel) || scored[0]
  const openAlerts = alerts.filter((a) => !a.ackDoctor)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
        <span className={cn('live-dot', running ? 'bg-emerald-500' : 'bg-slate-400')} />
        <p className="text-[12px] font-bold text-slate-800">Shared clinical stream {running ? 'live' : 'paused'}</p>
        <p className="text-[11px] text-slate-500">· synced with Nurse, Laboratory and Patient portals via BroadcastChannel store</p>
        <div className="ml-auto flex gap-1">
          {([['risk', 'ICU risk'], ['alerts', `Alerts (${openAlerts.length})`], ['timeline', 'Timeline']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k as any)} className={cn('chip chip-sm', tab === k && 'bg-brand-600 text-white')}>{l}</button>
          ))}
        </div>
      </div>

      <KpiRow items={[
        { label: 'ICU patients', value: icu.length, sub: 'Assigned to you', icon: BedDouble, tone: 'brand' },
        { label: 'Open monitoring alerts', value: openAlerts.length, sub: `${alerts.filter((a) => a.score >= 7 && !a.ackDoctor).length} critical`, icon: Bell, tone: openAlerts.length ? 'red' : 'green' },
        { label: 'Pathology pending', value: labRequests.filter((l) => l.status !== 'Report Available').length, sub: `${labRequests.filter((l) => l.critical).length} flagged critical`, icon: FlaskConical, tone: 'amber' },
        { label: 'Timeline events', value: timeline.length, sub: 'Auto-generated, newest first', icon: History, tone: 'teal' },
      ]} />

      {tab === 'risk' && (
        <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
          <div className="space-y-4">
            {scored.map((p) => {
              const labs = labRequests.filter((l) => l.patientId === p.id)
              const al = alerts.filter((a) => a.patientId === p.id && !a.ackDoctor)
              return (
                <button key={p.id} onClick={() => setSel(p.id)}
                  className={cn('w-full rounded-xl border p-4 text-left transition hover:shadow-card',
                    p.id === sel ? 'border-brand-300 bg-brand-50/30' : 'border-slate-200 bg-white')}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[13.5px] font-extrabold text-slate-900">{p.name} <span className="ml-1 text-[11px] font-bold text-slate-400">{p.id}</span></p>
                      <p className="text-[11px] text-slate-500">{p.bed} · {p.diagnosis}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {al.length > 0 && <Badge tone="red">{al.length} alert{al.length > 1 ? 's' : ''}</Badge>}
                      {labs.filter((l) => l.critical).length > 0 && <Badge tone="amber">critical lab</Badge>}
                      <Badge tone={LEVEL_TONE[p.s.level]}>{p.s.level}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-5 gap-1.5 text-center">
                    {[
                      { l: 'HR', v: p.vitals.hr, bad: p.vitals.hr > 110 || p.vitals.hr < 50 },
                      { l: 'BP', v: `${p.vitals.sys}/${p.vitals.dia}`, bad: p.vitals.sys < 100 },
                      { l: 'SpO₂', v: `${p.vitals.spo2}%`, bad: p.vitals.spo2 < 94 },
                      { l: 'RR', v: p.vitals.rr, bad: p.vitals.rr > 20 },
                      { l: 'Temp', v: `${p.vitals.temp.toFixed(1)}°`, bad: p.vitals.temp > 38 },
                    ].map((m) => (
                      <div key={m.l} className={cn('rounded-lg py-1.5', m.bad ? 'bg-rose-50' : 'bg-slate-50')}>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{m.l}</p>
                        <p className={cn('text-[12px] font-extrabold tabular-nums', m.bad ? 'text-rose-600' : 'text-slate-800')}>{m.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[10.5px] text-slate-500">
                    <span>NEWS2 <strong className={cn('text-[12px]', p.s.total >= 7 ? 'text-rose-600' : p.s.total >= 5 ? 'text-amber-600' : 'text-emerald-600')}>{p.s.total}</strong></span>
                    <span>{labs.length} lab {labs.length === 1 ? 'order' : 'orders'} · {ICU_MEDS[p.id]?.length || 0} active meds</span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="space-y-5">
            <Panel title={`${patient?.name} · ${patient?.bed}`} sub={`${patient?.id} · ${patient?.diagnosis}`} icon={Stethoscope}>
              <div className="flex items-center gap-3">
                <Donut value={Math.min(100, (patient?.s.total ?? 0) * 5)} label="NEWS2" sub={`${patient?.s.total ?? 0} / 20`}
                  color={(patient?.s.total ?? 0) >= 7 ? '#e11d48' : (patient?.s.total ?? 0) >= 5 ? '#f59e0b' : '#059669'} height={140} />
                <div className="flex-1 space-y-1">
                  {(patient?.s.parts || []).map((x) => (
                    <div key={x.k} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-500">{x.k}</span>
                      <span className="font-bold tabular-nums text-slate-800">{x.value}</span>
                      <span className={cn('h-1.5 w-1.5 rounded-full', x.pts === 0 ? 'bg-emerald-500' : x.pts <= 2 ? 'bg-amber-500' : 'bg-rose-500')} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">SpO₂ trend</p>
                  <SimpleLine data={(patient?.history || []).slice(-16).map((h, i) => ({ d: i, v: h.v.spo2 }))} k="v" name="SpO₂" unit="%" color="#2563eb" height={94} domain={[86, 100]} />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Heart rate trend</p>
                  <SimpleLine data={(patient?.history || []).slice(-16).map((h, i) => ({ d: i, v: h.v.hr }))} k="v" name="HR" unit="bpm" color="#0d9488" height={94} domain={[50, 150]} />
                </div>
              </div>
            </Panel>

            <Panel title="Active medications" sub="Reconciled from the medication administration record" icon={Pill}>
              <div className="space-y-1.5">
                {(ICU_MEDS[patient?.id] || []).map((m) => (
                  <div key={m} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11.5px] text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />{m}
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Recent laboratory results" sub="Critical flags shown in red" icon={FlaskConical}>
              <div className="space-y-2">
                {labRequests.filter((l) => l.patientId === patient?.id).map((l) => (
                  <div key={l.id} className="rounded-lg border border-slate-200 px-2.5 py-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[11.5px] font-bold text-slate-800">{l.panel}</p>
                      <Badge tone={l.critical ? 'red' : statusTone(l.status)}>{l.critical ? 'Critical' : l.status}</Badge>
                    </div>
                    <p className="text-[10.5px] text-slate-500">{l.id} · {l.priority} · {l.requestedBy}</p>
                  </div>
                ))}
                {!labRequests.filter((l) => l.patientId === patient?.id).length && <p className="text-[11.5px] text-slate-500">No orders for this patient.</p>}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length ? alerts.map((a) => (
            <div key={a.id} className={cn('rounded-xl border p-4', a.score >= 7 ? 'border-rose-300 bg-rose-50/30' : 'border-amber-200')}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[12.5px] font-extrabold tracking-wide text-slate-900">PATIENT MONITORING ALERT</p>
                  <p className="text-[11.5px] text-slate-600">Patient: {a.patientId} · {a.patientName} · {a.bed}</p>
                  <p className="text-[10.5px] text-slate-500">{new Date(a.at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · NEWS2 {a.score}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge tone={a.score >= 7 ? 'red' : 'amber'}>{a.level}</Badge>
                  {a.ackNurse ? <Badge tone="green">Nurse ✓</Badge> : <Badge tone="slate">Nurse pending</Badge>}
                  {a.ackDoctor ? <Badge tone="green">Doctor ✓</Badge> : <Badge tone="slate">Doctor pending</Badge>}
                </div>
              </div>
              <p className="mt-2.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Observations</p>
              <ul className="mt-1 space-y-1">
                {a.reasons.map((r, i) => <li key={i} className="text-[11.5px] leading-relaxed text-slate-700">• {r}</li>)}
              </ul>
              <p className="mt-2.5 text-[11.5px] font-bold text-rose-700">Status: {a.score >= 7 ? 'Urgent Clinical Review Required' : 'Clinical review advised'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => ackAlert(a.id, 'doctor')} disabled={a.ackDoctor} className="btn btn-primary btn-sm disabled:opacity-40"><CheckCircle2 size={13} /> Acknowledge alert</button>
                <button onClick={() => { setSel(a.patientId); setTab('risk') }} className="btn btn-ghost btn-sm">View patient</button>
                <button onClick={() => {
                  requestLab({ patientId: a.patientId, patientName: a.patientName, panel: 'Arterial Blood Gas', priority: a.score >= 7 ? 'STAT' : 'Urgent', requestedBy: 'Dr. Priya Nair' })
                  toast('Laboratory request sent — the Laboratory portal sees it immediately.', 'success')
                }} className="btn btn-teal-soft btn-sm"><FlaskConical size={13} /> Request labs</button>
                <button onClick={() => setTab('timeline')} className="btn btn-ghost btn-sm"><History size={13} /> Review clinical timeline</button>
              </div>
              {a.ackDoctor && <p className="mt-2 text-[10.5px] font-bold text-emerald-700">✓ Acknowledged — status synced to the Nurse portal.</p>}
            </div>
          )) : <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-[12px] text-slate-500">No monitoring alerts. The ICU stream is generating trends continuously.</div>}
        </div>
      )}

      {tab === 'timeline' && <ClinicalTimeline patientId={patient?.id} />}
    </div>
  )
}

export function ClinicalTimeline({ patientId }: { patientId?: string }) {
  const { timeline, labRequests, alerts } = useClinical()
  const [filter, setFilter] = useState<string>('All')
  const kinds = ['All', 'Admission', 'Vitals', 'Medication', 'Consultation', 'Lab Request', 'Lab Result', 'Alert', 'Acknowledgement']
  const rows = useMemo(() => {
    const t = (timeline || []).filter((e) => (!patientId || e.patientId === patientId || e.kind === 'Admission'))
    return (filter === 'All' ? t : t.filter((e) => e.kind === filter)).slice(0, 40)
  }, [timeline, patientId, filter])

  const tone: Record<string, string> = {
    Admission: 'bg-brand-50 text-brand-600', Vitals: 'bg-teal-50 text-teal-600',
    Medication: 'bg-violet-50 text-violet-600', Consultation: 'bg-emerald-50 text-emerald-600',
    'Lab Request': 'bg-amber-50 text-amber-600', 'Lab Result': 'bg-amber-50 text-amber-700',
    Alert: 'bg-rose-50 text-rose-600', Acknowledgement: 'bg-emerald-50 text-emerald-700', Note: 'bg-slate-100 text-slate-600',
  }

  return (
    <Panel title="AI clinical timeline" sub="Admissions, vitals, medications, consults, lab orders, results and alert acknowledgements — updates automatically"
      icon={History}
      right={
        <div className="flex flex-wrap gap-1">
          {kinds.map((k) => (
            <button key={k} onClick={() => setFilter(k)} className={cn('chip chip-sm', filter === k && 'bg-brand-600 text-white')}>{k}</button>
          ))}
        </div>
      }>
      <div className="relative space-y-0">
        {rows.map((e, i) => (
          <div key={e.id} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold', tone[e.kind] || tone.Note)}>
                {e.kind === 'Alert' ? '!' : e.kind === 'Lab Result' ? '▲' : e.kind === 'Medication' ? 'Rx' : e.kind === 'Admission' ? 'A' : '·'}
              </span>
              {i < rows.length - 1 && <span className="my-0.5 min-h-[22px] w-0.5 flex-1 bg-slate-200" />}
            </div>
            <div className="pb-3">
              <p className="text-[12px] font-bold text-slate-800">{e.title}</p>
              {e.detail && <p className="text-[11px] text-slate-600">{e.detail}</p>}
              <p className="mt-0.5 text-[10px] text-slate-400">
                {new Date(e.at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                {e.actor ? ` · ${e.actor}` : ''} {e.released ? '· released to patient' : '· internal'}
              </p>
            </div>
          </div>
        ))}
        {!rows.length && <p className="text-[12px] text-slate-500">No events for this filter.</p>}
      </div>
      <p className="mt-2 text-[10.5px] text-slate-500">{labRequests.length} lab orders · {alerts.length} alerts in the shared store.</p>
    </Panel>
  )
}
