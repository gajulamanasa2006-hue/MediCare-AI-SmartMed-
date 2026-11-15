/* =====================================================================
   AMBULANCE / EMERGENCY DISPATCH PORTAL
   Real interactive OSM map + road routing + GPS simulation.
   Traffic-signal preemption is a SIMULATION (no municipal API is connected).
   ===================================================================== */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, AlertTriangle, Ambulance, ArrowRight, CheckCircle2, Clock, Crosshair, Gauge,
  MapPin, Navigation, Pause, Play, Radio, RotateCcw, Route, Satellite, ShieldCheck, Siren,
  Truck, Wifi, WifiOff, Building2, User, Zap,
} from 'lucide-react'
import { PortalLayout, Panel, KpiRow } from '../../components/PortalLayout'
import { Badge, Btn, Empty, Field, Input, KV, Select, Table, cn, statusTone } from '../../components/ui'
import { GeoMap, type MapSignal } from '../../components/GeoMap'
import { useClinical, JOURNEY } from '../../context/ClinicalContext'
import { useApp } from '../../context/AppContext'
import {
  MAP_CENTERS, PATIENT_PT, HOSPITAL_PT, etaMinutes, fmtKm, pointAt, remainingKm, routeLengthKm, haversineKm,
} from '../../lib/geo'

const T: Record<string, { t: string; s: string }> = {
  dashboard: { t: 'Live Emergency Tracking', s: 'GPS dispatch console · Hyderabad, Telangana' },
  dispatch: { t: 'Smart Ambulance Dispatch', s: 'Nearest-unit recommendation and confirmation' },
  fleet: { t: 'Fleet Availability', s: 'Demo fleet · synthetic positions' },
  journey: { t: 'Journey Timeline', s: 'Every stage timestamped' },
  gps: { t: 'GPS Ingest (Device API)', s: 'Authorized device telemetry endpoint' },
}

export default function AmbulancePortal() {
  const [view, setView] = useState('dashboard')
  const meta = T[view] || T.dashboard
  return (
    <PortalLayout role="ambulance" view={view} setView={setView} title={meta.t} sub={meta.s} searchPlaceholder="Search ambulance, emergency ID, location…">
      {view === 'dashboard' && <LiveTracking />}
      {view === 'dispatch' && <DispatchConsole />}
      {view === 'fleet' && <Fleet />}
      {view === 'journey' && <Journey />}
      {view === 'gps' && <GpsApi />}
    </PortalLayout>
  )
}

/* ------------------------------------------------------------------ live tracking */
function LiveTracking() {
  const { dispatch, setProgress, setSpeedKmh, resetDispatch, fleet, createDispatch } = useClinical()
  const booted = useRef(false)
  const { toast } = useApp()
  const [playing, setPlaying] = useState(true)
  const [center, setCenter] = useState(MAP_CENTERS[0])
  const [zoom, setZoom] = useState(12)

  /* the console always shows a live route: boot a demo dispatch once */
  useEffect(() => {
    if (dispatch || booted.current) return
    booted.current = true
    createDispatch({
      emergencyId: 'EMG-2026-0012', patientName: 'Manasa R', priority: 'CRITICAL',
      type: 'Breathing difficulty', locationName: 'Hitec City, Hyderabad',
      patient: PATIENT_PT, hospital: HOSPITAL_PT, hospitalName: 'SmartMed · Secunderabad',
    })
  }, [dispatch, createDispatch])

  useEffect(() => {
    if (!playing || !dispatch) return
    const iv = setInterval(() => {
      setProgress(Math.min(1, dispatch.progress + 0.02))
    }, 1100)
    return () => clearInterval(iv)
  }, [playing, dispatch?.progress, setProgress])

  const route = dispatch?.route || []
  const pos = route.length ? pointAt(route, dispatch!.progress) : PATIENT_PT
  const total = route.length ? routeLengthKm(route) : 0
  const kmLeft = route.length ? remainingKm(route, dispatch!.progress) : 0
  const eta = route.length ? etaMinutes(route, dispatch!.progress, dispatch!.speedKmh) : 0
  const signals: MapSignal[] = (dispatch?.signals || []).map((s) => ({ ...s }))

  if (!dispatch) {
    return (
      <div className="space-y-5">
        <Empty title="No active dispatch" sub="Create one from the Emergency request page, or start the demo dispatch below." icon={Ambulance} />
        <Panel title="Start a demo dispatch" sub="Loads a pre-built Hyderabad route so you can test tracking immediately." icon={Siren}>
          <Link to="/emergency" className="btn btn-primary"><Siren size={14} /> Create a dispatch from the Emergency page</Link>
          <p className="mt-3 text-[11.5px] leading-relaxed text-slate-500">
            Go to <strong>Emergency Assistance</strong> → submit a request → a dispatch is created and appears here automatically.
          </p>
        </Panel>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <KpiRow items={[
        { label: 'Emergency ID', value: dispatch.emergencyId, sub: `${dispatch.type}`, icon: Siren, tone: 'red' },
        { label: 'Ambulance', value: dispatch.ambulanceId || 'Unassigned', sub: dispatch.ambulanceId ? 'Assigned' : 'Awaiting confirmation', icon: Ambulance, tone: 'brand' },
        { label: 'Distance remaining', value: fmtKm(kmLeft), sub: `${fmtKm(total)} total road route`, icon: Route, tone: 'teal' },
        { label: 'ETA (computed)', value: `${eta} min`, sub: `at ${dispatch.speedKmh} km/h · live calc`, icon: Clock, tone: 'amber' },
        { label: 'Priority', value: dispatch.priority, sub: dispatch.locationName, icon: AlertTriangle, tone: dispatch.priority === 'CRITICAL' ? 'red' : 'amber' },
        { label: 'GPS link', value: dispatch.gpsMode === 'device' ? 'Device' : 'Simulated', sub: dispatch.gpsConnected ? 'Connected' : 'No fix', icon: dispatch.gpsConnected ? Wifi : WifiOff, tone: dispatch.gpsConnected ? 'green' : 'slate' },
      ]} />

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Panel title="Live route map" sub="OpenStreetMap · drag to pan, scroll to zoom" icon={MapPin}
          right={<Badge tone="amber">SIMULATION · no live GPS</Badge>}>
          <GeoMap
            height={420}
            center={{ lat: center.lat, lng: center.lng }}
            zoom={center.z}
            route={route}
            travelled={dispatch.progress}
            ambulance={pos}
            patient={dispatch.patient}
            hospital={dispatch.hospital}
            signals={signals}
            extra={fleet.filter((f) => f.status === 'Available' && f.id !== dispatch.ambulanceId).map((f) => ({ lat: f.lat, lng: f.lng, label: f.id.slice(-2), tone: '#0ea5e9' }))}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={() => setPlaying((p) => !p)} className="btn btn-primary btn-sm">
              {playing ? <><Pause size={13} /> Pause tracking</> : <><Play size={13} /> Resume tracking</>}
            </button>
            <button onClick={() => { resetDispatch() }} className="btn btn-ghost btn-sm"><RotateCcw size={13} /> Reset simulation</button>
            <div className="ml-auto flex items-center gap-1.5">
              {MAP_CENTERS.slice(0, 7).map((c) => (
                <button key={c.k} onClick={() => setCenter(c)} className={cn('chip chip-sm', center.k === c.k && 'ring-1 ring-brand-400')}>{c.label.split(' ')[0]}</button>
              ))}
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {[['🚑 Ambulance', 'blue'], ['📍 Patient', 'red'], ['🏥 Hospital', 'green']].map(([l, t]) => (
              <div key={l} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600">
                <span>{l.split(' ')[0]}</span>{l.split(' ')[1]}
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Signal pre-emption" sub="RED → GREEN as the ambulance approaches, restored after it passes" icon={Zap}
            right={<Badge tone="amber">Simulation</Badge>}>
            <div className="space-y-2.5">
              {dispatch.signals.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex flex-col gap-1 rounded bg-navy-900 p-1">
                      <span className={cn('h-2 w-2 rounded-full', s.state === 'RED' ? 'bg-rose-500 shadow-[0_0_6px_#ef4444]' : 'bg-slate-700')} />
                      <span className={cn('h-2 w-2 rounded-full', s.state === 'GREEN' ? 'bg-emerald-500 shadow-[0_0_6px_#22c55e]' : 'bg-slate-700')} />
                    </span>
                    <div>
                      <p className="text-[12px] font-bold text-slate-800">{s.id} · {s.name}</p>
                      <p className="text-[10.5px] text-slate-500">{s.preempted ? 'Pre-empted by dispatch' : 'Normal cycle'}</p>
                    </div>
                  </div>
                  <Badge tone={s.state === 'GREEN' ? 'green' : 'red'}>{s.state}</Badge>
                </div>
              ))}
            </div>
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[10.5px] leading-relaxed text-amber-800">
              SIMULATION — not connected to real traffic infrastructure. No municipal signal controller is accessed.
            </p>
          </Panel>

          <Panel title="Tracking controls" sub="Speed feeds the ETA calculation" icon={Gauge}>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Simulated speed · {dispatch.speedKmh} km/h</label>
            <input type="range" min={10} max={90} value={dispatch.speedKmh} onChange={(e) => setSpeedKmh(Number(e.target.value))} className="mt-2 w-full accent-teal-600" />
            <div className="mt-3 flex gap-2">
              <button onClick={() => setProgress(Math.min(1, dispatch.progress + 0.06))} className="btn btn-ghost btn-sm">Advance +6%</button>
              <button onClick={() => setProgress(1)} className="btn btn-teal-soft btn-sm">Send to hospital</button>
            </div>
            <KV items={[
              { k: 'Route source', v: dispatch.routeSource === 'cached' ? 'Cached demo road route' : 'OSRM live routing' },
              { k: 'Progress', v: `${Math.round(dispatch.progress * 100)}%` },
              { k: 'Current stage', v: JOURNEY[dispatch.stage] },
              { k: 'Handover', v: dispatch.hospitalName },
            ]} />
          </Panel>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ dispatch console */
function DispatchConsole() {
  const { fleet, dispatch, createDispatch, assignAmbulance } = useClinical()
  const { toast } = useApp()
  const [loc, setLoc] = useState('Hitec City, Hyderabad')
  const [type, setType] = useState('Breathing difficulty')
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('HIGH')
  const [busy, setBusy] = useState(false)

  const ranked = useMemo(() => {
    return fleet
      .filter((f) => f.status === 'Available')
      .map((f) => {
        const km = haversineKm({ lat: f.lat, lng: f.lng }, PATIENT_PT)
        return { ...f, km, eta: Math.max(2, Math.round((km / 34) * 60)) }
      })
      .sort((a, b) => a.km - b.km)
  }, [fleet])

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel title="Emergency request" sub="Location captured with permission; coordinates are synthetic" icon={Siren}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Pickup location"><Input value={loc} onChange={(e: any) => setLoc(e.target.value)} /></Field>
            <Field label="Emergency type"><Select value={type} onChange={(e: any) => setType(e.target.value)}>
              {['Breathing difficulty', 'Cardiac — chest pain', 'Stroke symptoms', 'Road traffic accident', 'Severe bleeding', 'Fracture / trauma', 'Other'].map((t) => <option key={t}>{t}</option>)}
            </Select></Field>
            <Field label="Triage priority"><Select value={priority} onChange={(e: any) => setPriority(e.target.value)}>
              {['CRITICAL', 'HIGH', 'MEDIUM'].map((p) => <option key={p}>{p}</option>)}
            </Select></Field>
            <Field label="Receiving hospital"><Input defaultValue="SmartMed · Secunderabad" readOnly /></Field>
          </div>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await createDispatch({
                emergencyId: 'EMG-2026-' + String(1000 + Math.floor(Math.random() * 8999)),
                patientName: 'Manasa R', priority, type, locationName: loc,
                patient: PATIENT_PT, hospital: HOSPITAL_PT, hospitalName: 'SmartMeds · Secunderabad',
              })
              setBusy(false)
              toast('Dispatch created. Assign an ambulance below.', 'success')
            }}
            className="btn btn-danger mt-4 w-full"><Siren size={14} /> Create dispatch</button>
          <p className="mt-2 text-[10.5px] text-slate-500">Road route fetched from OSRM; a cached demo route is used if the network is unavailable.</p>
        </Panel>

        <Panel title="Recommended units" sub="Ranked by road distance to the patient" icon={Ambulance}>
          <div className="space-y-2.5">
            {ranked.map((u, i) => (
              <div key={u.id} className={cn('rounded-xl border p-3.5', i === 0 ? 'border-teal-300 bg-teal-50/40' : 'border-slate-200')}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[12.5px] font-extrabold text-slate-900">{u.id} {i === 0 && <span className="ml-1 rounded bg-teal-600 px-1.5 py-0.5 text-[9.5px] font-bold text-white">RECOMMENDED</span>}</p>
                    <p className="text-[11px] text-slate-500">{u.type} · {u.crew} · {u.station}</p>
                  </div>
                  <Badge tone="green">{u.km.toFixed(1)} km</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[11px] text-slate-500">Road ETA ≈ {u.eta} min</p>
                  <button
                    disabled={!dispatch}
                    onClick={() => { assignAmbulance(u.id); toast(`${u.id} assigned and dispatched.`, 'success') }}
                    className="btn btn-primary btn-sm disabled:opacity-40"><CheckCircle2 size={13} /> Confirm assignment</button>
                </div>
              </div>
            ))}
            {!ranked.length && <Empty title="No available units" sub="All ambulances are assigned or in maintenance." icon={Ambulance} />}
          </div>
        </Panel>
      </div>
      {dispatch && (
        <Panel title="Current assignment" sub="Updates propagate to the patient and emergency console" icon={ShieldCheck}>
          <KV cols={3} items={[
            { k: 'Emergency', v: dispatch.emergencyId }, { k: 'Ambulance', v: dispatch.ambulanceId || '—' },
            { k: 'Priority', v: dispatch.priority }, { k: 'Location', v: dispatch.locationName },
            { k: 'Hospital', v: dispatch.hospitalName }, { k: 'Stage', v: JOURNEY[dispatch.stage] },
          ]} />
        </Panel>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ fleet */
function Fleet() {
  const { fleet, dispatch } = useClinical()
  const route = dispatch?.route || []
  const pos = route.length && dispatch ? pointAt(route, dispatch.progress) : null
  return (
    <div className="space-y-5">
      <KpiRow items={[
        { label: 'Total units', value: fleet.length, sub: 'Demo fleet', icon: Truck, tone: 'brand' },
        { label: 'Available', value: fleet.filter((f) => f.status === 'Available').length, sub: 'Ready to dispatch', icon: CheckCircle2, tone: 'green' },
        { label: 'On mission', value: fleet.filter((f) => ['Assigned', 'En Route', 'Transporting', 'At Scene'].includes(f.status)).length, sub: 'Assigned now', icon: Ambulance, tone: 'amber' },
        { label: 'Maintenance', value: fleet.filter((f) => f.status === 'Maintenance').length, sub: 'Out of service', icon: AlertTriangle, tone: 'slate' },
      ]} />
      <Panel title="Fleet map" sub="Available units shown as numbered markers · simulated positions" icon={MapPin}
        right={<Badge tone="amber">Simulation</Badge>}>
        <GeoMap height={330} route={route} travelled={dispatch?.progress || 0} ambulance={pos || undefined}
          patient={PATIENT_PT} hospital={HOSPITAL_PT}
          signals={(dispatch?.signals || []).map((s) => ({ ...s }))}
          extra={fleet.filter((f) => f.status === 'Available').map((f) => ({ lat: f.lat, lng: f.lng, label: f.id.slice(-2) }))} />
      </Panel>
      <Panel title="Units" sub={`${fleet.length} vehicles`} icon={Truck}>
        <Table head={['Unit', 'Type', 'Crew', 'Station', 'Status', 'Distance to patient', '']}>
          {fleet.map((f) => (
            <tr key={f.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 text-[12px] font-bold text-slate-800">{f.id}</td>
              <td className="px-4 py-3 text-[12px] text-slate-600">{f.type}</td>
              <td className="px-4 py-3 text-[12px] text-slate-600">{f.crew}</td>
              <td className="px-4 py-3 text-[12px] text-slate-600">{f.station}</td>
              <td className="px-4 py-3"><Badge tone={statusTone(f.status)}>{f.status}</Badge></td>
              <td className="px-4 py-3 text-[12px] tabular-nums text-slate-600">{haversineKm({ lat: f.lat, lng: f.lng }, PATIENT_PT).toFixed(1)} km</td>
              <td className="px-4 py-3 text-right text-[11px] text-slate-400">{f.lat.toFixed(3)}, {f.lng.toFixed(3)}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------ journey */
function Journey() {
  const { dispatch, setStage } = useClinical()
  if (!dispatch) return <Empty title="No journey in progress" sub="Create a dispatch to see the timeline." icon={Route} />
  return (
    <div className="space-y-5">
      <Panel title="Journey timeline" sub={`${dispatch.emergencyId} · ${dispatch.locationName}`} icon={Route}
        right={<Badge tone={dispatch.stage >= 9 ? 'green' : 'amber'}>{JOURNEY[dispatch.stage]}</Badge>}>
        <div className="space-y-0">
          {JOURNEY.map((name, i) => {
            const done = i < dispatch.stage
            const active = i === dispatch.stage
            const at = dispatch.stages[i]?.at
            return (
              <div key={name} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold',
                    done ? 'bg-emerald-600 text-white' : active ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400')}>
                    {done ? '✓' : i + 1}
                  </span>
                  {i < JOURNEY.length - 1 && <span className={cn('my-0.5 w-0.5 flex-1 min-h-[26px]', done ? 'bg-emerald-300' : 'bg-slate-200')} />}
                </div>
                <div className="pb-3">
                  <p className={cn('text-[12.5px] font-bold', active ? 'text-amber-700' : done ? 'text-slate-800' : 'text-slate-400')}>{name}</p>
                  <p className="text-[10.5px] text-slate-500">
                    {at ? new Date(at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                    {active && ' · in progress'}
                  </p>
                </div>
                {active && i < JOURNEY.length - 1 && (
                  <button onClick={() => setStage(i + 1)} className="mb-3 self-start btn btn-ghost btn-sm">Advance <ArrowRight size={12} /></button>
                )}
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------ GPS API stub */
function GpsApi() {
  const { ingestGps, dispatch } = useClinical()
  const { toast } = useApp()
  const [form, setForm] = useState({ ambulanceId: dispatch?.ambulanceId || 'SMN-AMB-01', lat: '17.4401', lng: '78.3489', speed: '42' })

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    ingestGps({ ambulanceId: form.ambulanceId, lat: Number(form.lat), lng: Number(form.lng), speed: Number(form.speed), ts: Date.now() })
    toast('Telemetry accepted — tracking switched to device mode.', 'success')
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <Panel title="Authorized device telemetry" sub="This is the contract a production WebSocket handler would implement." icon={Satellite}>
        <form onSubmit={send} className="grid gap-3 sm:grid-cols-2">
          <Field label="Ambulance ID"><Input value={form.ambulanceId} onChange={(e: any) => setForm({ ...form, ambulanceId: e.target.value })} /></Field>
          <Field label="Speed (km/h)"><Input value={form.speed} onChange={(e: any) => setForm({ ...form, speed: e.target.value })} /></Field>
          <Field label="Latitude"><Input value={form.lat} onChange={(e: any) => setForm({ ...form, lat: e.target.value })} /></Field>
          <Field label="Longitude"><Input value={form.lng} onChange={(e: any) => setForm({ ...form, lng: e.target.value })} /></Field>
          <div className="sm:col-span-2"><button className="btn btn-primary w-full" type="submit"><Radio size={14} /> Send simulated fix</button></div>
        </form>
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[10.5px] leading-relaxed text-slate-600">
          Real GPS is only accepted from an authorized onboard device with an authenticated token and explicit
          location-sharing consent from the crew. The demo accepts a manual fix so the switch is testable.
        </p>
      </Panel>
      <Panel title="Payload contract" sub="POST /api/ambulance/telemetry (WebSocket: ambulance.gps)" icon={ShieldCheck}>
        <pre className="overflow-x-auto rounded-xl bg-navy-950 p-4 text-[11px] leading-relaxed text-teal-200">{`{
  "ambulanceId": "SMN-AMB-01",
  "lat": 17.4401,
  "lng": 78.3489,
  "speedKmh": 42,
  "heading": 92,
  "accuracyM": 6,
  "ts": 1793119200000,
  "assignment": "EMG-2026-1042",
  "auth": "<device token>"
}`}</pre>
        <KV items={[
          { k: 'Transport', v: 'WSS (fallback: REST POST)' },
          { k: 'Auth', v: 'Per-vehicle token + crew JWT' },
          { k: 'Consent', v: 'Explicit location-sharing only' },
          { k: 'Current mode', v: dispatch?.gpsMode === 'device' ? 'Device GPS' : 'Simulated' },
        ]} />
      </Panel>
    </div>
  )
}
