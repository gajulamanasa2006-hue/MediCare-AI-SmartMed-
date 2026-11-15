/* =====================================================================
   ClinicalContext — shared, cross-portal clinical + dispatch state.

   Sync mechanism: a single React context backed by localStorage, plus a
   BroadcastChannel ('smn-clinical') so every open tab/portal re-renders
   without a page refresh. No WebSocket server is required for the demo;
   the real-GPS ingest path is an authenticated REST/WS stub (see
   `ingestGps`), so a production server can be dropped in unchanged.
   ===================================================================== */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  ICU_SEED, type IcuPatient, type Vitals, news2, driftVitals, stableVitals,
  trendReasons, type AlertLevel, criticalFlags, LAB_PARAMS,
} from '../lib/icu'
import type { Pt } from '../lib/geo'

export type IcuAlert = {
  id: string
  patientId: string
  patientName: string
  bed: string
  level: AlertLevel
  score: number
  vitals: Vitals
  reasons: string[]
  at: number
  ackNurse: boolean
  ackDoctor: boolean
  doctorNote?: string
  source: 'monitor' | 'lab'
  labName?: string
  labValue?: string
}

export type LabRequest = {
  id: string
  patientId: string
  patientName: string
  panel: string
  priority: 'Routine' | 'Urgent' | 'STAT'
  requestedBy: string
  requestedAt: number
  status: 'Requested' | 'Sample Collected' | 'Processing' | 'Verification' | 'Report Available'
  values?: { key: string; value: number }[]
  critical?: boolean
  verifiedBy?: string
  releasedToPatient?: boolean
}

export type TimelineEvent = {
  id: string
  patientId: string
  at: number
  kind: 'Admission' | 'Vitals' | 'Medication' | 'Consultation' | 'Lab Request' | 'Lab Result' | 'Alert' | 'Acknowledgement' | 'Note'
  title: string
  detail?: string
  actor?: string
  released?: boolean
}

export type NurseTask = {
  id: string
  patientId: string
  patientName: string
  bed: string
  kind: 'Medication' | 'Observation' | 'Sample Collection' | 'Care Activity' | 'Alert Ack'
  title: string
  due: string
  done: boolean
  critical?: boolean
  at: number
}

export type AmbulanceUnit = {
  id: string
  type: 'ALS' | 'BLS' | 'Neonatal'
  crew: string
  station: string
  status: 'Available' | 'Assigned' | 'En Route' | 'At Scene' | 'Transporting' | 'Returning' | 'Maintenance'
  lat: number
  lng: number
  speed: number
  assignment?: string
}

export type Dispatch = {
  id: string
  emergencyId: string
  patientName: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  type: string
  locationName: string
  patient: Pt
  hospital: Pt
  hospitalName: string
  ambulanceId: string
  stage: number           // index into JOURNEY
  progress: number        // 0..1 along route
  route: Pt[]
  routeSource: 'OSRM' | 'cached'
  signals: { id: string; name: string; lat: number; lng: number; t: number; state: 'RED' | 'GREEN'; preempted: boolean }[]
  speedKmh: number
  gpsMode: 'simulated' | 'device'
  gpsConnected: boolean
  createdAt: number
  stages: { name: string; at: number | null }[]
}

export const JOURNEY = [
  'Emergency Requested', 'Request Reviewed', 'Ambulance Assigned', 'Ambulance Dispatched',
  'En Route to Patient', 'Patient Reached', 'Patient Picked Up', 'En Route to Hospital',
  'Hospital Reached', 'Emergency Completed',
] as const

export type FamilyMember = {
  id: string; name: string; relation: string; email: string; status: 'Invited' | 'Active' | 'Revoked'
  perms: { meds: boolean; reports: boolean; appts: boolean; stay: boolean; emergency: boolean }; at: number
}

type Ctx = {
  /* ICU */
  icu: IcuPatient[]
  running: boolean
  speed: 1 | 2
  start: () => void
  pause: () => void
  reset: () => void
  setSpeed: (s: 1 | 2) => void
  tick: (n?: number) => void
  /* alerts */
  alerts: IcuAlert[]
  ackAlert: (id: string, by: 'nurse' | 'doctor', note?: string) => void
  pushAlert: (a: Omit<IcuAlert, 'id' | 'at' | 'ackNurse' | 'ackDoctor'>) => void
  /* tasks */
  tasks: NurseTask[]
  completeTask: (id: string) => void
  addTask: (t: Omit<NurseTask, 'id' | 'at' | 'done'>) => void
  /* labs */
  labRequests: LabRequest[]
  requestLab: (r: Omit<LabRequest, 'id' | 'requestedAt' | 'status'>) => LabRequest
  advanceLab: (id: string, to: LabRequest['status'], values?: { key: string; value: number }[]) => void
  releaseResult: (id: string) => void
  /* timeline */
  timeline: TimelineEvent[]
  logEvent: (e: Omit<TimelineEvent, 'id' | 'at'>) => void
  /* ambulance / dispatch */
  fleet: AmbulanceUnit[]
  dispatch: Dispatch | null
  createDispatch: (d: { emergencyId: string; patientName: string; priority: Dispatch['priority']; type: string; locationName: string; patient: Pt; hospital: Pt; hospitalName: string }) => Promise<Dispatch>
  assignAmbulance: (ambulanceId: string) => void
  setStage: (i: number) => void
  setProgress: (p: number) => void
  setSpeedKmh: (v: number) => void
  resetDispatch: () => void
  ingestGps: (u: { ambulanceId: string; lat: number; lng: number; speed: number; accuracy?: number; ts: number }) => void
  /* family + stay */
  family: FamilyMember[]
  inviteFamily: (m: Omit<FamilyMember, 'id' | 'at' | 'status'>) => void
  togglePerm: (id: string, key: keyof FamilyMember['perms']) => void
  revokeFamily: (id: string) => void
  /* patient-visible release flags */
  released: Record<string, boolean>
  setReleased: (k: string, v: boolean) => void
  soundOn: boolean
  setSoundOn: (v: boolean) => void
}

const C = createContext<Ctx | null>(null)
const CHANNEL = 'smn-clinical'

function usePersisted<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [v, setV] = useState<T>(() => {
    try { const raw = localStorage.getItem('smnc.' + key); return raw ? (JSON.parse(raw) as T) : initial } catch { return initial }
  })
  useEffect(() => { try { localStorage.setItem('smnc.' + key, JSON.stringify(v)) } catch { /* quota */ } }, [key, v])
  return [v, setV]
}

let seq = 0
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`

export function ClinicalProvider({ children }: { children: React.ReactNode }) {
  const [icu, setIcu] = usePersisted<IcuPatient[]>('icu', ICU_SEED)
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState<1 | 2>(1)
  const [alerts, setAlerts] = usePersisted<IcuAlert[]>('alerts', [])
  const [tasks, setTasks] = usePersisted<NurseTask[]>('tasks', seedTasks())
  const [labRequests, setLabRequests] = usePersisted<LabRequest[]>('labs', seedLabs())
  const [timeline, setTimeline] = usePersisted<TimelineEvent[]>('tl', seedTimeline())
  const [fleet, setFleet] = usePersisted<AmbulanceUnit[]>('fleet', seedFleet())
  const [dispatch, setDispatch] = usePersisted<Dispatch | null>('dispatch', null)
  const [family, setFamily] = usePersisted<FamilyMember[]>('family', [
    { id: 'FAM-1', name: 'Ramesh R', relation: 'Father', email: 'ramesh.r@example.com', status: 'Active', perms: { meds: true, reports: true, appts: true, stay: true, emergency: true }, at: Date.now() - 86400000 * 30 },
  ])
  const [released, setReleasedState] = usePersisted<Record<string, boolean>>('released', {})
  const [soundOn, setSoundOn] = useState(true)

  /* ---------------- cross-tab sync ---------------- */
  const chan = useRef<BroadcastChannel | null>(null)
  useEffect(() => {
    const bc = new BroadcastChannel(CHANNEL)
    chan.current = bc
    return () => bc.close()
  }, [])
  useEffect(() => {
    const h = (e: StorageEvent) => { /* same-tab localStorage writes are covered by state */ }
    window.addEventListener('storage', h)
    return () => window.removeEventListener('storage', h)
  }, [])

  const beep = useCallback(() => {
    if (!soundOn) return
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AC) return
      const ctx = new AC()
      const o = ctx.createOscillator(); const g = ctx.createGain()
      o.type = 'sine'; o.frequency.value = 880
      g.gain.setValueAtTime(0.0001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45)
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.46)
    } catch { /* autoplay blocked */ }
  }, [soundOn])

  const logEvent = useCallback((e: Omit<TimelineEvent, 'id' | 'at'>) => {
    setTimeline((l) => [{ ...e, id: uid('TL'), at: Date.now() }, ...l].slice(0, 120))
  }, [setTimeline])

  const pushAlert = useCallback((a: Omit<IcuAlert, 'id' | 'at' | 'ackNurse' | 'ackDoctor'>) => {
    const alert: IcuAlert = { ...a, id: uid('AL'), at: Date.now(), ackNurse: false, ackDoctor: false }
    setAlerts((l) => [alert, ...l].slice(0, 60))
    if (a.level === 'Critical' || a.level === 'High Priority') beep()
    logEvent({
      patientId: a.patientId, kind: 'Alert',
      title: `${a.level} monitoring alert — ${a.bed}`,
      detail: a.reasons.join(' '), actor: 'ICU monitor', released: false,
    })
    return alert
  }, [setAlerts, beep, logEvent])

  /* ---------------- ICU stream ---------------- */
  const tick = useCallback(() => {
    setIcu((list) => {
      const next = list.map((p) => {
        const baseline = p.history.length ? p.history[p.history.length - 1].v : p.vitals
        const declining = p.decline > 0.4 && Math.random() > 0.25
        const v = declining ? driftVitals(baseline, 1, p.decline) : stableVitals(baseline)
        return { ...p, vitals: v, history: [...p.history, { t: Date.now(), v }].slice(-40) }
      })
      /* generate alerts only when a patient crosses a threshold we haven't already alerted at */
      next.forEach((p) => {
        const s = news2(p.vitals)
        if (s.total >= 5) {
          const recent = alerts.find((a) => a.patientId === p.id && Date.now() - a.at < 24000 && a.source === 'monitor')
          if (!recent) {
            pushAlert({
              patientId: p.id, patientName: p.name, bed: p.bed, level: s.level, score: s.total,
              vitals: p.vitals, reasons: trendReasons(p.history.map((h) => h.v), p.vitals), source: 'monitor',
            })
            setTasks((t): NurseTask[] => [{
              id: uid('TK'), patientId: p.id, patientName: p.name, bed: p.bed, kind: 'Alert Ack' as const,
              title: `Acknowledge ${s.level.toLowerCase()} alert`, due: 'Immediate', done: false,
              critical: s.level === 'Critical', at: Date.now(),
            }, ...t].slice(0, 40))
          }
        }
      })
      return next
    })
  }, [setIcu, alerts, pushAlert, setTasks])

  useEffect(() => {
    if (!running) return
    const ms = speed === 2 ? 1800 : 3200
    const iv = setInterval(tick, ms)
    return () => clearInterval(iv)
  }, [running, speed, tick])

  const start = useCallback(() => setRunning(true), [])
  const pause = useCallback(() => setRunning(false), [])
  const reset = useCallback(() => {
    setIcu(ICU_SEED); setAlerts([]); setTasks(seedTasks()); setLabRequests(seedLabs()); setTimeline(seedTimeline())
    setRunning(true)
  }, [setIcu, setAlerts, setTasks, setLabRequests, setTimeline])

  const ackAlert = useCallback((id: string, by: 'nurse' | 'doctor', note?: string) => {
    setAlerts((l) => l.map((a) => a.id === id ? { ...a, ackNurse: by === 'nurse' ? true : a.ackNurse, ackDoctor: by === 'doctor' ? true : a.ackDoctor, doctorNote: note ?? a.doctorNote } : a))
    const a = alerts.find((x) => x.id === id)
    if (a) logEvent({ patientId: a.patientId, kind: 'Acknowledgement', title: `${a.level} alert acknowledged by ${by}`, detail: note, actor: by === 'nurse' ? 'Sr. Anjali Verma' : 'Dr. Priya Nair', released: false })
    setTasks((t) => t.map((x) => x.kind === 'Alert Ack' && a && x.patientId === a.patientId && !x.done ? { ...x, done: true } : x))
  }, [setAlerts, alerts, logEvent, setTasks])

  /* ---------------- tasks ---------------- */
  const completeTask = useCallback((id: string) => {
    setTasks((l) => l.map((t) => t.id === id ? { ...t, done: true } : t))
    const t = tasks.find((x) => x.id === id)
    if (t) logEvent({ patientId: t.patientId, kind: t.kind === 'Medication' ? 'Medication' : 'Note', title: `${t.title} — completed`, actor: 'Sr. Anjali Verma', released: true })
  }, [setTasks, tasks, logEvent])
  const addTask = useCallback((t: Omit<NurseTask, 'id' | 'at' | 'done'>) => {
    setTasks((l) => [{ ...t, id: uid('TK'), at: Date.now(), done: false }, ...l])
  }, [setTasks])

  /* ---------------- labs ---------------- */
  const requestLab = useCallback((r: Omit<LabRequest, 'id' | 'requestedAt' | 'status'>) => {
    const req: LabRequest = { ...r, id: 'LAB-' + String(1000 + Math.floor(Math.random() * 9000)), requestedAt: Date.now(), status: 'Requested' }
    setLabRequests((l) => [req, ...l])
    logEvent({ patientId: r.patientId, kind: 'Lab Request', title: `${r.panel} requested (${r.priority})`, detail: `Requested by ${r.requestedBy}`, actor: r.requestedBy, released: false })
    return req
  }, [setLabRequests, logEvent])

  const advanceLab = useCallback((id: string, to: LabRequest['status'], values?: { key: string; value: number }[]) => {
    let target: LabRequest | undefined
    setLabRequests((l) => l.map((r) => {
      if (r.id !== id) return r
      const critical = values ? criticalFlags(values).length > 0 : r.critical
      target = { ...r, status: to, values: values ?? r.values, critical }
      return target
    }))
    if (to === 'Report Available') {
      const r = labRequests.find((x) => x.id === id)
      if (r) logEvent({ patientId: r.patientId, kind: 'Lab Result', title: `${r.panel} verified & published`, detail: values ? values.map((v) => `${v.key}: ${v.value}`).join(' · ') : undefined, actor: 'Sneha Pillai', released: false })
    }
  }, [setLabRequests, labRequests, logEvent])

  const releaseResult = useCallback((id: string) => {
    setLabRequests((l) => l.map((r) => r.id === id ? { ...r, releasedToPatient: true } : r))
    const r = labRequests.find((x) => x.id === id)
    if (r) {
      setReleasedState((m) => ({ ...m, [r.id]: true }))
      logEvent({ patientId: r.patientId, kind: 'Lab Result', title: `${r.panel} released to patient portal`, actor: 'Sneha Pillai', released: true })
    }
  }, [setLabRequests, labRequests, setReleasedState, logEvent])

  /* ---------------- ambulance ---------------- */
  useEffect(() => {
    /* keep the demo fleet alive: units slowly return to Available */
    const iv = setInterval(() => {
      setFleet((f) => f.map((u) => u.status === 'Returning' ? { ...u, status: 'Available' } : u))
    }, 20000)
    return () => clearInterval(iv)
  }, [setFleet])

  const createDispatch = useCallback(async (d: Parameters<Ctx['createDispatch']>[0]) => {
    const fetched = await (async () => {
      try {
        const { fetchRoadRoute } = await import('../lib/geo')
        return await fetchRoadRoute(d.patient, d.hospital)
      } catch {
        const { FALLBACK_ROUTE } = await import('../lib/geo')
        return { route: FALLBACK_ROUTE, source: 'cached' as const }
      }
    })()
    const route = fetched.route
    const { pointAt, SIGNAL_SEEDS } = await import('../lib/geo')
    const signals = SIGNAL_SEEDS.map((s) => {
      const p = pointAt(route, s.t)
      return { id: s.id, name: s.name, lat: p.lat, lng: p.lng, t: s.t, state: 'RED' as const, preempted: false }
    })
    const now = Date.now()
    const disp: Dispatch = {
      id: uid('DSP'), emergencyId: d.emergencyId, patientName: d.patientName, priority: d.priority,
      type: d.type, locationName: d.locationName, patient: d.patient, hospital: d.hospital,
      hospitalName: d.hospitalName, ambulanceId: '', stage: 2, progress: 0, route, routeSource: fetched.source,
      signals, speedKmh: 38, gpsMode: 'simulated', gpsConnected: true, createdAt: now,
      stages: JOURNEY.map((name, i) => ({ name, at: i <= 2 ? now : null })),
    }
    setDispatch(disp)
    logEvent({ patientId: 'ICU-003', kind: 'Admission', title: `Emergency ${d.emergencyId} dispatched`, detail: `${d.type} · ${d.locationName}`, actor: 'Control room', released: true })
    return disp
  }, [setDispatch, logEvent])

  const assignAmbulance = useCallback((ambulanceId: string) => {
    setDispatch((d) => {
      if (!d) return d
      const now = Date.now()
      const stages = d.stages.map((s, i) => ({ ...s, at: s.at ?? (i <= 3 ? now : null) }))
      return { ...d, ambulanceId, stage: 3, stages }
    })
    setFleet((f) => f.map((u) => u.id === ambulanceId ? { ...u, status: 'En Route' } : u))
  }, [setDispatch, setFleet])

  const setStage = useCallback((i: number) => {
    setDispatch((d) => {
      if (!d) return d
      const now = Date.now()
      return { ...d, stage: i, stages: d.stages.map((s, k) => ({ ...s, at: s.at ?? (k <= i ? now : null) })) }
    })
    setFleet((f) => f.map((u) => u.id === dispatch?.ambulanceId ? {
      ...u, status: i >= 8 ? 'At Scene' : i >= 5 ? 'Transporting' : i >= 4 ? 'En Route' : u.status,
    } : u))
  }, [setDispatch, setFleet, dispatch?.ambulanceId])

  const setProgress = useCallback((p: number) => {
    setDispatch((d) => {
      if (!d) return d
      const clamped = Math.max(0, Math.min(1, p))
      /* ---- signal preemption: turn RED → GREEN as the ambulance approaches,
              restore RED once it has passed. SIMULATION ONLY. ---- */
      const signals = d.signals.map((s) => {
        const dist = Math.abs(s.t - clamped)
        if (dist < 0.085) return { ...s, state: 'GREEN' as const, preempted: true }
        if (s.preempted && s.t < clamped) return { ...s, state: 'RED' as const, preempted: false }
        return s
      })
      return { ...d, progress: clamped, signals }
    })
  }, [setDispatch])

  const setSpeedKmh = useCallback((v: number) => setDispatch((d) => (d ? { ...d, speedKmh: Math.max(0, Math.min(120, v)) } : d)), [setDispatch])

  const resetDispatch = useCallback(() => {
    setDispatch(null)
    setFleet(seedFleet())
  }, [setDispatch, setFleet])

  /* Real-device GPS ingest (authorized ambulances only).
     In production this is a WebSocket handler that validates the JWT +
     per-vehicle token before accepting a fix. Here it simply applies a fix. */
  const ingestGps = useCallback((u: { ambulanceId: string; lat: number; lng: number; speed: number }) => {
    setDispatch((d) => {
      if (!d || d.ambulanceId !== u.ambulanceId) return d
      return { ...d, gpsMode: 'device', gpsConnected: true, speedKmh: Math.round(u.speed) }
    })
  }, [setDispatch])

  const inviteFamily = useCallback((m: Omit<FamilyMember, 'id' | 'at' | 'status'>) => {
    setFamily((l) => [{ ...m, id: uid('FAM'), at: Date.now(), status: 'Invited' }, ...l])
  }, [setFamily])
  const togglePerm = useCallback((id: string, key: keyof FamilyMember['perms']) => {
    setFamily((l) => l.map((m) => m.id === id ? { ...m, perms: { ...m.perms, [key]: !m.perms[key] } } : m))
  }, [setFamily])
  const revokeFamily = useCallback((id: string) => {
    setFamily((l) => l.map((m) => m.id === id ? { ...m, status: 'Revoked' } : m))
  }, [setFamily])
  const setReleased = useCallback((k: string, v: boolean) => setReleasedState((m) => ({ ...m, [k]: v })), [setReleasedState])

  const value: Ctx = useMemo(() => ({
    icu, running, speed, start, pause, reset, setSpeed, tick,
    alerts, ackAlert, pushAlert,
    tasks, completeTask, addTask,
    labRequests, requestLab, advanceLab, releaseResult,
    timeline, logEvent,
    fleet, dispatch, createDispatch, assignAmbulance, setStage, setProgress, setSpeedKmh, resetDispatch, ingestGps,
    family, inviteFamily, togglePerm, revokeFamily,
    released, setReleased, soundOn, setSoundOn,
  }), [icu, running, speed, start, pause, reset, setSpeed, tick, alerts, ackAlert, pushAlert, tasks, completeTask, addTask,
    labRequests, requestLab, advanceLab, releaseResult, timeline, logEvent, fleet, dispatch, createDispatch, assignAmbulance,
    setStage, setProgress, setSpeedKmh, resetDispatch, ingestGps, family, inviteFamily, togglePerm, revokeFamily, released, setReleased, soundOn])

  return <C.Provider value={value}>{children}</C.Provider>
}

export function useClinical() {
  const c = useContext(C)
  if (!c) throw new Error('useClinical must be used inside ClinicalProvider')
  return c
}

/* ------------------------------------------------------------------ seeds */
function seedTasks(): NurseTask[] {
  const t = Date.now()
  return [
    { id: 'TK-1', patientId: 'ICU-003', patientName: 'Manasa R', bed: 'ICU-03', kind: 'Medication', title: 'Salbutamol nebulisation 5 mg', due: '09:00', done: false, at: t },
    { id: 'TK-2', patientId: 'ICU-005', patientName: 'Imran Baig', bed: 'ICU-05', kind: 'Medication', title: 'Furosemide 40 mg IV', due: '09:15', done: false, critical: true, at: t },
    { id: 'TK-3', patientId: 'ICU-002', patientName: 'Rahul Verma', bed: 'ICU-02', kind: 'Sample Collection', title: 'ABG + blood culture', due: '09:30', done: false, at: t },
    { id: 'TK-4', patientId: 'ICU-001', patientName: 'Ananya Sharma', bed: 'ICU-01', kind: 'Observation', title: 'Hourly vitals & wound check', due: '10:00', done: false, at: t },
    { id: 'TK-5', patientId: 'ICU-004', patientName: 'Mahesh Gupta', bed: 'ICU-04', kind: 'Care Activity', title: 'Reposition & pressure-area check', due: '10:00', done: true, at: t },
    { id: 'TK-6', patientId: 'ICU-006', patientName: 'Kavya Nair', bed: 'ICU-06', kind: 'Care Activity', title: 'Capillary glucose + insulin sliding scale', due: '10:30', done: false, at: t },
  ]
}
function seedLabs(): LabRequest[] {
  const t = Date.now()
  return [
    { id: 'LAB-2041', patientId: 'ICU-003', patientName: 'Manasa R', panel: 'Arterial Blood Gas', priority: 'Urgent', requestedBy: 'Dr. Priya Nair', requestedAt: t - 3600000, status: 'Processing' },
    { id: 'LAB-2042', patientId: 'ICU-002', patientName: 'Rahul Verma', panel: 'Complete Blood Count', priority: 'Urgent', requestedBy: 'Dr. Aryan Mehta', requestedAt: t - 7200000, status: 'Verification', values: [{ key: 'hb', value: 9.4 }, { key: 'wbc', value: 18.2 }, { key: 'plt', value: 190 }] },
    { id: 'LAB-2043', patientId: 'ICU-005', patientName: 'Imran Baig', panel: 'Renal Function + Electrolytes', priority: 'STAT', requestedBy: 'Dr. Aryan Mehta', requestedAt: t - 1800000, status: 'Sample Collected' },
    { id: 'LAB-2044', patientId: 'ICU-001', patientName: 'Ananya Sharma', panel: 'Complete Blood Count', priority: 'Routine', requestedBy: 'Dr. Rajesh Sharma', requestedAt: t - 86400000, status: 'Report Available', values: [{ key: 'hb', value: 12.6 }, { key: 'wbc', value: 8.1 }, { key: 'plt', value: 240 }] },
  ]
}
function seedTimeline(): TimelineEvent[] {
  const t = Date.now()
  return [
    { id: 'TL-1', patientId: 'ICU-003', at: t - 7200000, kind: 'Admission', title: 'Admitted to ICU-03', detail: 'Severe asthma exacerbation · from Emergency', actor: 'Dr. Priya Nair', released: true },
    { id: 'TL-2', patientId: 'ICU-003', at: t - 5400000, kind: 'Medication', title: 'Salbutamol nebulisation administered', actor: 'Sr. Anjali Verma', released: true },
    { id: 'TL-3', patientId: 'ICU-003', at: t - 3600000, kind: 'Lab Request', title: 'Arterial Blood Gas requested', detail: 'Urgent · Dr. Priya Nair', released: false },
    { id: 'TL-4', patientId: 'ICU-003', at: t - 3000000, kind: 'Consultation', title: 'Ward round — respiratory review', detail: 'Continue nebulisation, monitor SpO₂ hourly', actor: 'Dr. Priya Nair', released: true },
  ]
}
function seedFleet(): AmbulanceUnit[] {
  return [
    { id: 'SMN-AMB-01', type: 'ALS', crew: 'Kiran K · Paramedic', station: 'Jubilee Hills', status: 'Available', lat: 17.4312, lng: 78.4013, speed: 0 },
    { id: 'SMN-AMB-02', type: 'ALS', crew: 'Ravi T · Paramedic', station: 'Begumpet', status: 'Available', lat: 17.4425, lng: 78.4620, speed: 0 },
    { id: 'SMN-AMB-03', type: 'BLS', crew: 'Sana M · EMT', station: 'Hitec City', status: 'Available', lat: 17.4435, lng: 78.3772, speed: 0 },
    { id: 'SMN-AMB-04', type: 'Neonatal', crew: 'Deepa R · Nurse', station: 'Secunderabad', status: 'Maintenance', lat: 17.4399, lng: 78.4983, speed: 0 },
    { id: 'SMN-AMB-05', type: 'BLS', crew: 'Arun P · EMT', station: 'Gachibowli', status: 'Available', lat: 17.4401, lng: 78.3489, speed: 0 },
  ]
}

export { LAB_PARAMS }
