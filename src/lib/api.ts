/* MediCare AI — API client for the Flask backend. Keeps the existing
   localStorage demo flows untouched; all NEW modules talk to the real DB. */
const BASE = (import.meta as any).env?.VITE_API_BASE || ''

export type ApiUser = { id: number; name: string; role: 'patient' | 'doctor' | 'family' | 'admin'; email: string; profile?: any }

let token: string | null = localStorage.getItem('mcai.token')
export const getToken = () => token
export function setToken(t: string | null) {
  token = t
  if (t) localStorage.setItem('mcai.token', t)
  else localStorage.removeItem('mcai.token')
}

export class ApiError extends Error { status: number
  constructor(message: string, status: number) { super(message); this.status = status } }

async function call<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(opts.headers as any) }
  if (!(opts.body instanceof FormData) && opts.body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(BASE + path, { ...opts, headers })
  } catch {
    throw new ApiError('Cannot reach the MediCare AI backend. Is it running on http://localhost:5000 ?', 0)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status)
  return data as T
}

export const api = {
  register: (d: any) => call<{ token: string; user: ApiUser }>('/api/auth/register', { method: 'POST', body: JSON.stringify(d) }),
  login: (email: string, password: string) => call<{ token: string; user: ApiUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => call('/api/auth/logout', { method: 'POST' }),
  me: () => call<{ user: ApiUser }>('/api/auth/me'),
  forgot: (email: string) => call<any>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  reset: (token2: string, password: string) => call('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: token2, password }) }),

  readings: (days = 30) => call<{ readings: any[] }>(`/api/readings?days=${days}`),
  addReading: (d: any) => call('/api/readings', { method: 'POST', body: JSON.stringify(d) }),
  risk: () => call<any>('/api/risk/analyze', { method: 'POST', body: JSON.stringify({}) }),

  ocrPrescription: (file: File) => { const f = new FormData(); f.append('file', file)
    return call<any>('/api/ocr/prescription', { method: 'POST', body: f }) },
  ocrLab: (file: File) => { const f = new FormData(); f.append('file', file)
    return call<any>('/api/ocr/lab', { method: 'POST', body: f }) },

  interactions: (medicines: string[]) => call<any>('/api/medicines/interactions', { method: 'POST', body: JSON.stringify({ medicines }) }),
  generic: (name: string) => call<any>(`/api/medicines/generic?name=${encodeURIComponent(name)}`),

  reminders: () => call<{ reminders: any[]; missed: any[] }>('/api/reminders'),
  addReminder: (d: any) => call('/api/reminders', { method: 'POST', body: JSON.stringify(d) }),
  logReminder: (reminder_id: number, status: 'taken' | 'skipped', sched_time: string) =>
    call('/api/reminders/log', { method: 'POST', body: JSON.stringify({ reminder_id, status, sched_time }) }),
  generateToday: () => call<{ created: number }>('/api/reminders/generate-today', { method: 'POST', body: JSON.stringify({}) }),

  contacts: () => call<{ contacts: any[] }>('/api/emergency/contacts'),
  addContact: (d: any) => call('/api/emergency/contacts', { method: 'POST', body: JSON.stringify(d) }),
  sos: (kind: string, note: string) => call<any>('/api/emergency/alert', { method: 'POST', body: JSON.stringify({ kind, note }) }),
  emEvents: () => call<{ events: any[] }>('/api/emergency/events'),

  appts: () => call<{ appointments: any[] }>('/api/appointments'),
  addAppt: (d: any) => call('/api/appointments', { method: 'POST', body: JSON.stringify(d) }),

  consents: () => call<{ consents: any[] }>('/api/consents'),
  grantConsent: (member_email: string, relation: string) =>
    call('/api/consents', { method: 'POST', body: JSON.stringify({ member_email, relation }) }),
  revokeConsent: (consent_id: number) => call('/api/consents/revoke', { method: 'POST', body: JSON.stringify({ consent_id }) }),

  sharedPatients: () => call<{ patients: any[] }>('/api/family/patients'),
  patientOverview: (pid: number) => call<any>(`/api/family/patient/${pid}/overview`),

  notifs: () => call<{ notifications: any[] }>('/api/notifications'),
  myReports: () => call<any>('/api/reports/my'),
  summary: () => call<any>('/api/reports/health-summary'),
  profile: () => call<{ profile: any }>('/api/profile'),
  saveProfile: (d: any) => call('/api/profile', { method: 'PUT', body: JSON.stringify(d) }),
  doctors: () => call<{ doctors: any[] }>('/api/doctors'),

  adminStats: () => call<any>('/api/admin/stats'),
  adminUsers: () => call<{ users: any[] }>('/api/admin/users'),
  adminAudit: () => call<{ logs: any[] }>('/api/admin/audit'),
}

/* ---------- browser speech helpers (Web Speech API with graceful fallback) ---------- */
export const speechSupported = () =>
  typeof window !== 'undefined' && 'webkitSpeechRecognition' in (window as any)

export function speak(text: string, lang = 'en-IN', onEnd?: () => void) {
  try {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.onend = () => onEnd?.()
    speechSynthesis.speak(u)
  } catch { onEnd?.() }
}
export function stopSpeaking() { try { speechSynthesis.cancel() } catch { /* noop */ } }

export function listen(lang: string, onResult: (t: string) => void, onErr?: (e: string) => void) {
  const SR: any = (window as any).webkitSpeechRecognition
  if (!SR) { onErr?.('Speech recognition is not supported in this browser. Please type the values instead.'); return null }
  const r = new SR()
  r.lang = lang; r.interimResults = false; r.maxAlternatives = 1
  r.onresult = (e: any) => onResult(e.results[0][0].transcript)
  r.onerror = (e: any) => onErr?.(e.error === 'not-allowed' ? 'Microphone permission was denied.' : 'Could not recognise speech, please try again.')
  r.start()
  return r
}
