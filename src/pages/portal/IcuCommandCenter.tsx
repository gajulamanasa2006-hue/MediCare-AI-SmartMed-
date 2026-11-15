/* =====================================================================
   NURSE PORTAL — ICU Command Center
   Live monitoring · deterioration detection (NEWS2 demo) · task management
   ===================================================================== */
import React, { useMemo, useState } from 'react'
import {
  Activity, AlarmClock, AlertTriangle, Bell, CheckCircle2, ClipboardList, Clock, FlaskConical,
  Heart, HeartPulse, Pause, Play, RotateCcw, ShieldAlert, Siren, Syringe, Thermometer, Users,
  Volume2, VolumeX, Wind, BedDouble, History,
} from 'lucide-react'
import { Panel, KpiRow } from '../../components/PortalLayout'
import { Badge, Btn, Empty, KV, Tabs, cn, statusTone, Bar } from '../../components/ui'
import { SimpleLine, Donut } from '../../components/charts'
import { useClinical } from '../../context/ClinicalContext'
import { news2, LEVEL_RANK, type AlertLevel } from '../../lib/icu'

const LEVEL_TONE: Record<AlertLevel, string> = {
  Normal: 'green', 'Attention Required': 'amber', 'High Priority': 'amber', Critical: 'red',
}

export function IcuCommandCenter() {
  const {
    icu, running, speed, start, pause, reset: resetSim, setSpeed, alerts, ackAlert,
    tasks, completeTask, soundOn, setSoundOn, tick,
  } = useClinical()
  const [tab, setTab] = useState('monitor')
  const [sel, setSel] = useState<string>('ICU-003')

  const open = alerts.filter((a) => !a.ackDoctor || !a.ackNurse)
  const critical = alerts.filter((a) => a.score >= 7 && !a.ackNurse)
  const scored = icu.map((p) => ({ ...p, s: news2(p.vitals) }))
  const worst = scored.reduce((m, p) => (p.s.total > m.s.total ? p : m), scored[0])
  const patient = scored.find((p) => p.id === sel) || scored[0]

  return (
    <div className="space-y-5">
      {/* status strip */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
        <span className={cn('live-dot', running ? 'bg-emerald-500' : 'bg-slate-400')} />
        <p className="text-[12px] font-bold text-slate-800">{running ? 'Live stream active' : 'Stream paused'}</p>
        <p className="text-[11px] text-slate-500">· synthetic ICU telemetry, refreshes every {speed === 2 ? '1.8' : '3.2'} s</p>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <button onClick={start} disabled={running} className="btn btn-sm btn-primary disabled:opacity-40"><Play size={12} /> Start simulation</button>
          <button onClick={pause} disabled={!running} className="btn btn-sm btn-ghost disabled:opacity-40"><Pause size={12} /> Pause</button>
          <button onClick={resetSim} className="btn btn-sm btn-ghost"><RotateCcw size={12} /> Reset</button>
          <button onClick={() => tick()} className="btn btn-sm btn-teal-soft">Step once</button>
          <button onClick={() => setSpeed(speed === 1 ? 2 : 1)} className="btn btn-sm btn-ghost">{speed === 1 ? '1×' : '2×'}</button>
          <button onClick={() => setSoundOn(!soundOn)} className="btn btn-sm btn-ghost" title="Alert sound">{soundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}</button>
        </div>
      </div>

      <KpiRow items={[
        { label: 'ICU patients', value: icu.length, sub: 'Bays A–C monitored', icon: BedDouble, tone: 'brand' },
        { label: 'Open alerts', value: open.length, sub: `${critical.length} unacknowledged critical`, icon: Bell, tone: critical.length ? 'red' : 'green' },
        { label: 'Highest NEWS2', value: worst?.s.total ?? 0, sub: `${worst?.name} · ${worst?.bed}`, icon: HeartPulse, tone: 'amber' },
        { label: 'Tasks due', value: tasks.filter((t) => !t.done).length, sub: `${tasks.filter((t) => !t.done && t.critical).length} critical`, icon: ClipboardList, tone: 'teal' },
      ]} />

      <Tabs size="md" value={tab} onChange={setTab} tabs={[
        { id: 'monitor', label: 'Live monitoring' },
        { id: 'alerts', label: 'Alerts', count: open.length },
        { id: 'tasks', label: 'Task board' },
        { id: 'history', label: 'Alert history' },
      ]} />

      {tab === 'monitor' && (
        <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {scored.map((p) => (
              <button key={p.id} onClick={() => setSel(p.id)}
                className={cn('rounded-xl border p-4 text-left transition hover:shadow-card',
                  p.id === sel ? 'border-brand-300 bg-brand-50/30' : 'border-slate-200 bg-white')}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-extrabold text-slate-900">{p.name}</p>
                    <p className="text-[11px] text-slate-500">{p.id} · {p.bed}</p>
                  </div>
                  <Badge tone={LEVEL_TONE[p.s.level]}>{p.s.level}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                  {[
                    { l: 'HR', v: p.vitals.hr, u: 'bpm', bad: p.vitals.hr > 110 || p.vitals.hr < 50 },
                    { l: 'BP', v: `${p.vitals.sys}/${p.vitals.dia}`, u: 'mmHg', bad: p.vitals.sys < 100 },
                    { l: 'SpO₂', v: p.vitals.spo2, u: '%', bad: p.vitals.spo2 < 94 },
                    { l: 'RR', v: p.vitals.rr, u: '/min', bad: p.vitals.rr > 20 },
                  ].map((m) => (
                    <div key={m.l} className={cn('rounded-lg py-1.5', m.bad ? 'bg-rose-50' : 'bg-slate-50')}>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{m.l}</p>
                      <p className={cn('text-[12.5px] font-extrabold tabular-nums', m.bad ? 'text-rose-600' : 'text-slate-800')}>{m.v}</p>
                      <p className="text-[8.5px] text-slate-400">{m.u}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between text-[10.5px] text-slate-500">
                  <span>NEWS2 <strong className="text-slate-800">{p.s.total}</strong></span>
                  <span>{new Date(p.history[p.history.length - 1]?.t || Date.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-5">
            <Panel title={patient?.name || ''} sub={`${patient?.bed} · ${patient?.diagnosis}`} icon={Activity}>
              <div className="flex items-center justify-between">
                <Donut value={Math.min(100, (patient?.s.total ?? 0) * 5)} label="NEWS2" sub={`${patient?.s.total ?? 0} / 20`} color={(patient?.s.total ?? 0) >= 7 ? '#e11d48' : (patient?.s.total ?? 0) >= 5 ? '#f59e0b' : '#059669'} height={150} />
                <div className="space-y-1.5">
                  {(patient?.s.parts || []).map((x) => (
                    <div key={x.k} className="flex items-center gap-2 text-[11px]">
                      <span className={cn('h-2 w-2 rounded-full', x.pts === 0 ? 'bg-emerald-500' : x.pts <= 2 ? 'bg-amber-500' : 'bg-rose-500')} />
                      <span className="w-28 text-slate-500">{x.k}</span>
                      <span className="font-bold tabular-nums text-slate-800">{x.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 h-24">
                <SimpleLine data={(patient?.history || []).slice(-14).map((h, i) => ({ d: i, v: h.v.spo2 }))} k="v" name="SpO₂" unit="%" color="#2563eb" height={96} domain={[86, 100]} />
              </div>
            </Panel>

            <Panel title="Active alerts" sub="Critical alerts appear first" icon={ShieldAlert}>
              <div className="space-y-2">
                {alerts.slice(0, 4).map((a) => (
                  <div key={a.id} className={cn('rounded-lg border p-2.5', a.score >= 7 ? 'border-rose-200 bg-rose-50/60' : 'border-amber-200 bg-amber-50/50')}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11.5px] font-bold text-slate-900">{a.bed} · {a.patientName}</p>
                      <Badge tone={a.score >= 7 ? 'red' : 'amber'}>{a.level}</Badge>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-slate-600">{a.reasons[0]}</p>
                    {!a.ackNurse
                      ? <button onClick={() => ackAlert(a.id, 'nurse')} className="mt-1.5 text-[10.5px] font-bold text-brand-700">Acknowledge</button>
                      : <p className="mt-1.5 text-[10px] font-bold text-emerald-700">✓ Acknowledged by nurse</p>}
                  </div>
                ))}
                {!alerts.length && <p className="text-[11.5px] text-slate-500">No alerts generated yet.</p>}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'alerts' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3">
            <p className="flex items-center gap-2 text-[11.5px] font-bold text-rose-900"><Siren size={13} /> Critical alerts are listed separately from routine observations.</p>
          </div>
          {alerts.length ? alerts.map((a) => (
            <div key={a.id} className={cn('rounded-xl border p-4', a.score >= 7 ? 'border-rose-300' : 'border-amber-200')}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-extrabold text-slate-900">PATIENT MONITORING ALERT · {a.bed}</p>
                  <p className="text-[11.5px] text-slate-500">{a.patientName} ({a.patientId}) · {new Date(a.at).toLocaleTimeString('en-GB')} · NEWS2 {a.score}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={a.score >= 7 ? 'red' : 'amber'}>{a.level}</Badge>
                  {a.ackNurse ? <Badge tone="green">Nurse ✓</Badge> : <Badge tone="slate">Nurse pending</Badge>}
                  {a.ackDoctor ? <Badge tone="green">Doctor ✓</Badge> : <Badge tone="slate">Doctor pending</Badge>}
                </div>
              </div>
              <ul className="mt-2.5 space-y-1">
                {a.reasons.map((r, i) => <li key={i} className="text-[11.5px] leading-relaxed text-slate-700">• {r}</li>)}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <button disabled={a.ackNurse} onClick={() => ackAlert(a.id, 'nurse')} className="btn btn-primary btn-sm disabled:opacity-40"><CheckCircle2 size={13} /> Acknowledge</button>
                <button onClick={() => { setSel(a.patientId); setTab('monitor') }} className="btn btn-ghost btn-sm">View patient</button>
              </div>
            </div>
          )) : <Empty title="No alerts" sub="The monitor has not detected a concerning trend." icon={ShieldAlert} />}
        </div>
      )}

      {tab === 'tasks' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Critical & overdue" sub="Escalated to the in-charge nurse" icon={AlertTriangle}>
            <div className="space-y-2">
              {tasks.filter((t) => !t.done && (t.critical || t.kind === 'Alert Ack')).map((t) => <TaskRow key={t.id} t={t} onDone={completeTask} />)}
              {!tasks.filter((t) => !t.done && (t.critical || t.kind === 'Alert Ack')).length && <p className="text-[11.5px] text-slate-500">Nothing critical outstanding.</p>}
            </div>
          </Panel>
          <Panel title="Routine tasks" sub="Medication, observations, sampling and care" icon={ClipboardList}>
            <div className="space-y-2">
              {tasks.filter((t) => !t.done && !t.critical && t.kind !== 'Alert Ack').map((t) => <TaskRow key={t.id} t={t} onDone={completeTask} />)}
            </div>
          </Panel>
          <div className="xl:col-span-2">
            <Panel title="Completed this shift" sub={`${tasks.filter((t) => t.done).length} tasks closed`} icon={CheckCircle2}>
              <div className="grid gap-2 sm:grid-cols-2">
                {tasks.filter((t) => t.done).map((t) => <TaskRow key={t.id} t={t} onDone={completeTask} />)}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <Panel title="Alert history" sub="Every generated alert with acknowledgement state" icon={History}>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="tbl">
              <thead><tr><th>Time</th><th>Bed</th><th>Patient</th><th>Level</th><th>NEWS2</th><th>Nurse</th><th>Doctor</th><th>Reason</th></tr></thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id}>
                    <td className="px-3 py-2.5 text-[11.5px] tabular-nums text-slate-600">{new Date(a.at).toLocaleTimeString('en-GB')}</td>
                    <td className="px-3 py-2.5 text-[11.5px] font-bold text-slate-800">{a.bed}</td>
                    <td className="px-3 py-2.5 text-[11.5px] text-slate-600">{a.patientName}</td>
                    <td className="px-3 py-2.5"><Badge tone={a.score >= 7 ? 'red' : 'amber'}>{a.level}</Badge></td>
                    <td className="px-3 py-2.5 text-[11.5px] font-bold tabular-nums">{a.score}</td>
                    <td className="px-3 py-2.5 text-[11.5px]">{a.ackNurse ? '✓' : '—'}</td>
                    <td className="px-3 py-2.5 text-[11.5px]">{a.ackDoctor ? '✓' : '—'}</td>
                    <td className="px-3 py-2.5 text-[11px] text-slate-500 max-w-[280px] truncate">{a.reasons[0]}</td>
                  </tr>
                ))}
                {!alerts.length && <tr><td colSpan={8} className="px-3 py-6 text-center text-[12px] text-slate-500">No alerts recorded.</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <p className="rounded-lg bg-slate-50 px-3.5 py-2.5 text-[10.5px] leading-relaxed text-slate-500">
        Demonstration only. NEWS2 is used as a validated early-warning framework; all readings are synthetic and no
        diagnosis or treatment is suggested. Thresholds are prototype values and require clinical sign-off before real use.
      </p>
    </div>
  )
}

function TaskRow({ t, onDone }: { t: any; onDone: (id: string) => void }) {
  const icon = t.kind === 'Medication' ? Syringe : t.kind === 'Sample Collection' ? FlaskConical
    : t.kind === 'Observation' ? Heart : t.kind === 'Alert Ack' ? ShieldAlert : ClipboardList
  const Icon = icon
  return (
    <div className={cn('flex items-center gap-3 rounded-lg border p-2.5', t.done ? 'border-slate-100 bg-slate-50/60 opacity-70' : t.critical ? 'border-rose-200' : 'border-slate-200')}>
      <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', t.critical ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-600')}><Icon size={14} /></span>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-[12px] font-bold', t.done ? 'text-slate-500 line-through' : 'text-slate-800')}>{t.title}</p>
        <p className="text-[10.5px] text-slate-500">{t.kind} · {t.bed} · {t.patientName} · due {t.due}</p>
      </div>
      {!t.done && <button onClick={() => onDone(t.id)} className="btn btn-ghost btn-sm shrink-0"><CheckCircle2 size={12} /> Done</button>}
      {t.done && <Badge tone="green">Done</Badge>}
    </div>
  )
}
