import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  NOTIFICATIONS, MEDS, APPOINTMENTS, LAB_REPORTS, CONSULTATIONS, EMERGENCIES, QUEUE, PATIENT,
  type Role, type Notif, type Med, type Appointment, type LabReport, type Consultation, type Emergency,
} from '../data/mock'
import { DEMO_USERS } from '../data/users'

/* ============================================================
   SmartMed — application state
   Mock auth + localStorage persistence so every form, flow and
   role portal behaves like a real application (demo build).
   ============================================================ */

export type Session = { role: Role; name: string; email: string; at: number } | null
export type Toast = { id: number; text: string; tone: 'success' | 'error' | 'info' | 'warn' }
export type DoseState = 'Taken' | 'Missed' | 'Upcoming'
export type VitalsLog = { id: string; date: string; sys: number; dia: number; sugar: number; hr: number; weight: number; spo2: number; temp: number }
export type NewPatient = { id: string; name: string; age: number; gender: string; mobile: string; email: string; blood: string; dept: string; allergies: string; condition: string; at: string }
export type PatientDoc = { id: string; patient: string; title: string; kind: string; date: string; by: string }

type Ctx = {
  session: Session
  login: (role: Role, name: string, email: string) => void
  logout: () => void
  /* ui */
  toasts: Toast[]
  toast: (text: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
  /* notifications */
  notif: Notif[]
  pushNotif: (n: { cat: string; title: string; body: string; tone?: string; time?: string }) => void
  markRead: (id: string) => void
  readAll: () => void
  /* medications */
  meds: Med[]
  addMed: (m: Med) => void
  removeMed: (id: string) => void
  doseLog: Record<string, DoseState>
  logDose: (medId: string, slot: string, state: DoseState) => void
  /* appointments */
  appts: Appointment[]
  addAppt: (a: Appointment) => void
  updateAppt: (id: string, patch: Partial<Appointment>) => void
  /* reports & consultations */
  reports: LabReport[]
  addReport: (r: LabReport) => void
  consultations: Consultation[]
  addConsultation: (c: Consultation) => void
  /* emergencies */
  emergencies: Emergency[]
  addEmergency: (e: Emergency) => void
  updateEmergency: (id: string, patch: Partial<Emergency>) => void
  /* front desk */
  queue: typeof QUEUE
  addQueue: (q: (typeof QUEUE)[number]) => void
  setQueueStatus: (token: string, status: string) => void
  newPatients: NewPatient[]
  addPatient: (p: NewPatient) => void
  /* nursing / monitoring */
  vitalsLog: VitalsLog[]
  addVitals: (v: VitalsLog) => void
  /* documents */
  docs: PatientDoc[]
  addDoc: (d: PatientDoc) => void
  /* misc */
  portalOpen: boolean
  setPortalOpen: (v: boolean) => void
  reset: () => void
}

const AppCtx = createContext<Ctx | null>(null)

function usePersisted<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem('smn.' + key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch { return initial }
  })
  useEffect(() => {
    try { localStorage.setItem('smn.' + key, JSON.stringify(val)) } catch { /* quota */ }
  }, [key, val])
  return [val, setVal]
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = usePersisted<Session>('session', null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [notif, setNotif] = usePersisted<Notif[]>('notif', NOTIFICATIONS)
  const [meds, setMeds] = usePersisted<Med[]>('meds', MEDS)
  const [doseLog, setDoseLog] = usePersisted<Record<string, DoseState>>('doseLog', {})
  const [appts, setAppts] = usePersisted<Appointment[]>('appts', APPOINTMENTS)
  const [reports, setReports] = usePersisted<LabReport[]>('reports', LAB_REPORTS)
  const [consultations, setConsultations] = usePersisted<Consultation[]>('consultations', CONSULTATIONS)
  const [emergencies, setEmergencies] = usePersisted<Emergency[]>('emergencies', EMERGENCIES)
  const [queue, setQueue] = usePersisted<typeof QUEUE>('queue', QUEUE)
  const [newPatients, setNewPatients] = usePersisted<NewPatient[]>('patients', [
    { id: 'SMN-2026-000001', name: 'Manasa R', age: 24, gender: 'Female', mobile: '+91 98765 40001', email: 'manasa.demo@smartmed.health', blood: 'O+', dept: 'General Medicine', allergies: 'Penicillin, Peanuts, Ibuprofen', condition: 'Out-Patient', at: '04 Oct 2026' },
    { id: 'SMN-2026-000002', name: 'Ananya Sharma', age: 34, gender: 'Female', mobile: '+91 99999 00002', email: 'ananya@example.com', blood: 'B+', dept: 'Cardiology', allergies: 'None recorded', condition: 'Checked-In', at: '04 Oct 2026' },
    { id: 'SMN-2026-000003', name: 'Rahul Verma', age: 7, gender: 'Male', mobile: '+91 99999 00003', email: 'verma.family@example.com', blood: 'A+', dept: 'Pediatrics', allergies: 'Lactose intolerance', condition: 'Waiting', at: '04 Oct 2026' },
    { id: 'SMN-2026-000004', name: 'Imran Baig', age: 52, gender: 'Male', mobile: '+91 99999 00004', email: 'imran.b@example.com', blood: 'AB+', dept: 'General Medicine', allergies: 'Sulfa drugs', condition: 'Booked', at: '04 Oct 2026' },
    { id: 'SMN-2026-000005', name: 'Kavya Nair', age: 29, gender: 'Female', mobile: '+91 99999 00005', email: 'kavya.n@example.com', blood: 'O-', dept: 'General Medicine', allergies: 'Dust, Shellfish', condition: 'Booked', at: '05 Oct 2026' },
  ])
  const [vitalsLog, setVitalsLog] = usePersisted<VitalsLog[]>('vitals', [
    { id: 'V-1', date: '29 Sep 2026', sys: 118, dia: 76, sugar: 96, hr: 74, weight: 47, spo2: 98, temp: 98.4 },
    { id: 'V-2', date: '28 Sep 2026', sys: 121, dia: 80, sugar: 99, hr: 77, weight: 47, spo2: 97, temp: 98.6 },
    { id: 'V-3', date: '27 Sep 2026', sys: 119, dia: 77, sugar: 94, hr: 79, weight: 46.8, spo2: 98, temp: 98.2 },
  ])
  const [docs, setDocs] = usePersisted<PatientDoc[]>('docs', [
    { id: 'DOC-1', patient: 'Manasa R', title: 'Discharge Summary — Feb 2026', kind: 'Discharge', date: '12 Feb 2026', by: 'Dr. Rajesh Sharma' },
    { id: 'DOC-2', patient: 'Manasa R', title: 'Vaccination Card', kind: 'Immunisation', date: '04 Jan 2026', by: 'Nursing Station A' },
    { id: 'DOC-3', patient: 'Manasa R', title: 'Old Prescription Scan', kind: 'Prescription', date: '18 Aug 2026', by: 'Dr. Aryan Mehta' },
    { id: 'DOC-4', patient: 'Manasa R', title: 'Pulmonary Function Report', kind: 'Scan', date: '09 Sep 2026', by: 'Dr. Priya Nair' },
  ])
  const [portalOpen, setPortalOpen] = useState(false)

  const toast = useCallback((text: string, tone: Toast['tone'] = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4600)
  }, [])

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const login = useCallback((role: Role, name: string, email: string) => {
    setSession({ role, name, email, at: Date.now() })
  }, [setSession])

  const logout = useCallback(() => setSession(null), [setSession])

  const pushNotif = useCallback((n: { cat: string; title: string; body: string; tone?: string; time?: string }) => {
    setNotif((list) => [{ ...n, id: 'N' + Date.now(), read: false, time: n.time || 'Just now' } as Notif, ...list])
  }, [setNotif])

  const markRead = useCallback((id: string) => setNotif((l) => l.map((n) => (n.id === id ? { ...n, read: true } : n))), [setNotif])
  const readAll = useCallback(() => setNotif((l) => l.map((n) => ({ ...n, read: true }))), [setNotif])

  const addMed = useCallback((m: Med) => setMeds((l) => [m, ...l]), [setMeds])
  const removeMed = useCallback((id: string) => setMeds((l) => l.filter((m) => m.id !== id)), [setMeds])
  const logDose = useCallback((medId: string, slot: string, state: DoseState) => {
    const key = `${medId}|${slot}|${new Date(2026, 9, 4).toDateString()}`
    setDoseLog((d) => ({ ...d, [key]: state }))
  }, [setDoseLog])

  const addAppt = useCallback((a: Appointment) => setAppts((l) => [a, ...l]), [setAppts])
  const updateAppt = useCallback((id: string, patch: Partial<Appointment>) =>
    setAppts((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a))), [setAppts])

  const addReport = useCallback((r: LabReport) => setReports((l) => [r, ...l]), [setReports])
  const addConsultation = useCallback((c: Consultation) => setConsultations((l) => [c, ...l]), [setConsultations])

  const addEmergency = useCallback((e: Emergency) => setEmergencies((l) => [e, ...l]), [setEmergencies])
  const updateEmergency = useCallback((id: string, patch: Partial<Emergency>) =>
    setEmergencies((l) => l.map((e) => (e.id === id ? { ...e, ...patch } : e))), [setEmergencies])

  const addQueue = useCallback((q: (typeof QUEUE)[number]) => setQueue((l) => [...l, q]), [setQueue])
  const setQueueStatus = useCallback((token: string, status: string) =>
    setQueue((l) => l.map((q) => (q.token === token ? { ...q, status } : q))), [setQueue])
  const addPatient = useCallback((p: NewPatient) => setNewPatients((l) => [p, ...l]), [setNewPatients])

  const addVitals = useCallback((v: VitalsLog) => setVitalsLog((l) => [v, ...l]), [setVitalsLog])
  const addDoc = useCallback((d: PatientDoc) => setDocs((l) => [d, ...l]), [setDocs])

  const reset = useCallback(() => {
    ;['session', 'notif', 'meds', 'doseLog', 'appts', 'reports', 'consultations', 'emergencies', 'queue', 'patients', 'vitals', 'docs']
      .forEach((k) => localStorage.removeItem('smn.' + k))
    setSession(null)
    toast('Demo data restored to factory defaults.', 'info')
  }, [setSession, toast])

  const value: Ctx = {
    session, login, logout, toasts, toast, dismissToast,
    notif, pushNotif, markRead, readAll,
    meds, addMed, removeMed, doseLog, logDose,
    appts, addAppt, updateAppt,
    reports, addReport, consultations, addConsultation,
    emergencies, addEmergency, updateEmergency,
    queue, addQueue, setQueueStatus, newPatients, addPatient,
    vitalsLog, addVitals, docs, addDoc,
    portalOpen, setPortalOpen, reset,
  }
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp() {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp must be used inside AppProvider')
  return c
}

/* convenience: current patient identity (demo user) */
export const CURRENT_PATIENT = PATIENT
export const DEMO = DEMO_USERS
