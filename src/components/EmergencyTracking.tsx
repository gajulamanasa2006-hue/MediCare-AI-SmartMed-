/* =====================================================================
   Emergency page → advanced GPS dispatch + tracking (additive).
   Uses the shared Leaflet map, the clinical store and OSRM road routing.
   ===================================================================== */
import React, { useEffect, useMemo, useState } from 'react'
import {
  Ambulance, ArrowRight, CheckCircle2, Clock, Crosshair, MapPin, Navigation, Pause, Play,
  RotateCcw, Satellite, Siren, Wifi, WifiOff, Zap, ShieldCheck, AlertTriangle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, KV, cn } from './ui'
import { GeoMap, type MapSignal } from './GeoMap'
import { useClinical, JOURNEY } from '../context/ClinicalContext'
import {
  MAP_CENTERS, PATIENT_PT, HOSPITAL_PT, etaMinutes, fmtKm, pointAt, remainingKm, routeLengthKm, haversineKm,
} from '../lib/geo'

export default function EmergencyTracking({ emergency }: { emergency?: any }) {
  const { dispatch, createDispatch, assignAmbulance, setProgress, setSpeedKmh, resetDispatch, fleet } = useClinical()
  const [playing, setPlaying] = useState(true)
  const [center, setCenter] = useState(MAP_CENTERS[0])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!playing || !dispatch) return
    const iv = setInterval(() => setProgress(Math.min(1, dispatch.progress + 0.02)), 1100)
    return () => clearInterval(iv)
  }, [playing, dispatch?.progress, setProgress])

  const route = dispatch?.route || []
  const pos = route.length && dispatch ? pointAt(route, dispatch.progress) : PATIENT_PT
  const kmLeft = route.length && dispatch ? remainingKm(route, dispatch.progress) : 0
  const total = route.length ? routeLengthKm(route) : 0
  const eta = route.length && dispatch ? etaMinutes(route, dispatch.progress, dispatch.speedKmh) : 0
  const nearest = useMemo(() => fleet.filter((f) => f.status === 'Available')
    .map((f) => ({ ...f, km: haversineKm({ lat: f.lat, lng: f.lng }, PATIENT_PT) }))
    .sort((a, b) => a.km - b.km)[0], [fleet])

  const signals: MapSignal[] = (dispatch?.signals || []).map((s) => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng, state: s.state }))

  return (
    <section className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">SMARTMED EMERGENCY TRACKING</p>
            <h3 className="mt-1 text-[17px] font-extrabold text-slate-900">
              {dispatch ? `Emergency ID: ${dispatch.emergencyId}` : 'Interactive GPS dispatch'}
            </h3>
            <p className="mt-0.5 text-[11.5px] text-slate-500">
              Leaflet + OpenStreetMap · routed on real roads (OSRM) · {dispatch?.routeSource === 'cached' ? 'cached demo route' : 'live routing'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="amber">Simulation data</Badge>
            {dispatch && <Badge tone={dispatch.priority === 'CRITICAL' ? 'red' : 'amber'}>{dispatch.priority}</Badge>}
          </div>
        </div>

        {!dispatch ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_1fr]">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-[12.5px] font-bold text-slate-800">Start a live dispatch demo</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-600">
                Loads a Hyderabad → Secunderabad road route with three simulated traffic signals. The ambulance marker
                moves along the route, ETA and distance are recomputed every second, and signals turn green as it
                approaches then return to red once it passes.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button disabled={creating} onClick={async () => {
                  setCreating(true)
                  await createDispatch({
                    emergencyId: emergency?.id || ('EMG-2026-' + String(1000 + Math.floor(Math.random() * 8999))),
                    patientName: emergency?.patient || 'Manasa R',
                    priority: (emergency?.priority as any) || 'CRITICAL',
                    type: emergency?.type || 'Breathing difficulty',
                    locationName: emergency?.location || 'Hitec City, Hyderabad',
                    patient: PATIENT_PT, hospital: HOSPITAL_PT, hospitalName: 'SmartMed · Secunderabad',
                  })
                  setCreating(false)
                }} className="btn btn-danger btn-sm disabled:opacity-50">
                  <Siren size={13} /> {creating ? 'Creating route…' : 'Create dispatch & track'}
                </button>
                <Link to="/portal/ambulance" className="btn btn-ghost btn-sm"><Ambulance size={13} /> Open ambulance portal</Link>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-[12.5px] font-bold text-slate-800">Nearest available unit</p>
              {nearest ? (
                <>
                  <p className="mt-1 text-[11.5px] text-slate-600">{nearest.id} · {nearest.type} · {nearest.station}</p>
                  <p className="text-[11.5px] text-slate-600">{nearest.km.toFixed(1)} km from the pickup point</p>
                  <Link to="/portal/ambulance" className="mt-2 inline-flex text-[11.5px] font-bold text-brand-700">Confirm assignment in the dispatch console <ArrowRight size={12} className="ml-1" /></Link>
                </>
              ) : <p className="mt-1 text-[11.5px] text-slate-500">No units available — check the fleet page.</p>}
            </div>
          </div>
        ) : (
          <>
            {/* status banner */}
            <div className="mt-4 grid gap-2 rounded-xl bg-navy-950 p-3.5 text-white sm:grid-cols-3 lg:grid-cols-6">
              {[
                ['Emergency ID', dispatch.emergencyId],
                ['Priority', dispatch.priority],
                ['Ambulance', dispatch.ambulanceId || 'Awaiting assignment'],
                ['Status', JOURNEY[dispatch.stage]],
                ['Distance remaining', fmtKm(kmLeft)],
                ['ETA', `${eta} min`],
                ['GPS connection', dispatch.gpsConnected ? 'Active' : 'No fix'],
                ['Mode', dispatch.gpsMode === 'device' ? 'Device GPS' : 'Simulated'],
                ['Route', dispatch.routeSource === 'cached' ? 'Cached' : 'OSRM live'],
              ].slice(0, 9).map(([k, v]) => (
                <div key={k as string}>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-teal-300">{k}</p>
                  <p className="truncate text-[12px] font-extrabold">{v}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
              <div>
                <GeoMap height={340} center={center} zoom={center.z} route={route} travelled={dispatch.progress}
                  ambulance={pos} patient={dispatch.patient} hospital={dispatch.hospital} signals={signals}
                  extra={fleet.filter((f) => f.status === 'Available').map((f) => ({ lat: f.lat, lng: f.lng, label: f.id.slice(-2) }))} />
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <button onClick={() => setPlaying((p) => !p)} className="btn btn-primary btn-sm">
                    {playing ? <><Pause size={12} /> Pause tracking</> : <><Play size={12} /> Resume tracking</>}
                  </button>
                  <button onClick={() => { setPlaying(false); resetDispatch() }} className="btn btn-ghost btn-sm"><RotateCcw size={12} /> Reset</button>
                  <div className="ml-auto flex flex-wrap gap-1">
                    {MAP_CENTERS.slice(0, 6).map((c) => (
                      <button key={c.k} onClick={() => setCenter(c)} className={cn('chip chip-sm', center.k === c.k && 'ring-1 ring-brand-400')}>{c.label.split(' ')[0]}</button>
                    ))}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[10.5px] font-semibold text-slate-600">
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Ambulance</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Patient</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Hospital</span>
                  <span className="ml-auto text-slate-400">{fmtKm(total)} total route</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-slate-800"><Zap size={13} className="text-amber-500" /> Signal pre-emption</p>
                  <div className="mt-2 space-y-1.5">
                    {dispatch.signals.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-2.5 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="flex flex-col gap-0.5 rounded bg-navy-950 p-1">
                            <span className={cn('h-1.5 w-1.5 rounded-full', s.state === 'RED' ? 'bg-rose-500' : 'bg-slate-700')} />
                            <span className={cn('h-1.5 w-1.5 rounded-full', s.state === 'GREEN' ? 'bg-emerald-500' : 'bg-slate-700')} />
                          </span>
                          <span className="text-[11px] font-bold text-slate-700">{s.id} · {s.name}</span>
                        </div>
                        <Badge tone={s.state === 'GREEN' ? 'green' : 'red'}>{s.state}</Badge>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] leading-relaxed text-amber-800">
                    SIMULATION — not connected to real traffic infrastructure.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[11.5px] font-extrabold text-slate-800">Tracking controls</p>
                  <label className="mt-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Speed · {dispatch.speedKmh} km/h</label>
                  <input type="range" min={10} max={90} value={dispatch.speedKmh} onChange={(e) => setSpeedKmh(Number(e.target.value))} className="mt-1 w-full accent-teal-600" />
                  {!dispatch.ambulanceId && (
                    <button onClick={() => nearest && assignAmbulance(nearest.id)} className="btn btn-teal- btn-sm mt-2 w-full">
                      <CheckCircle2 size={12} /> Assign {nearest?.id || 'nearest unit'}
                    </button>
                  )}
                  <Link to="/portal/ambulance" className="btn btn-ghost btn-sm mt-2 w-full"><Satellite size={12} /> Full dispatch console</Link>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[11.5px] font-extrabold text-slate-800">Journey</p>
                  <div className="mt-1.5 space-y-1">
                    {JOURNEY.map((n, i) => (
                      <div key={n} className="flex items-center gap-2">
                        <span className={cn('h-1.5 w-1.5 rounded-full', i < dispatch.stage ? 'bg-emerald-500' : i === dispatch.stage ? 'bg-amber-500' : 'bg-slate-300')} />
                        <span className={cn('text-[10.5px]', i <= dispatch.stage ? 'font-semibold text-slate-700' : 'text-slate-400')}>{n}</span>
                        {dispatch.stages[i]?.at && <span className="ml-auto text-[9.5px] text-slate-400">{new Date(dispatch.stages[i].at!).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
              Ambulance position, speed and traffic-signal states are synthetic. Live device GPS is only accepted from an
              authorized onboard unit through the authenticated telemetry endpoint.
            </p>
          </>
        )}
      </div>
    </section>
  )
}
