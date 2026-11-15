/* MediCare AI — unified workspace (real backend auth + role-based sidebar).
   Mounted at #/app. Existing SmartMed portals and public pages stay untouched. */
import React, { useEffect, useState } from 'react'
import {
  Activity, Bell, CalendarDays, FileText, FlaskConical, Heart, LayoutDashboard, LogOut, Menu, Mic,
  Pill, ScanLine, Settings, ShieldCheck, Siren, Sparkles, Stethoscope, Users, X, BarChart3, ClipboardList,
} from 'lucide-react'
import { cn, Badge, Card } from '../../components/ui'
import { api, ApiError, getToken, setToken, type ApiUser } from '../../lib/api'
import { useApp } from '../../context/AppContext'
import {
  HealthMonitoring, RiskAnalysis, PrescriptionScanner, SafetyChecker, GenericFinder, Reminders,
  LabAnalyzer, EmergencySOS, VoiceAssistant, MyReports, Appointments, FamilyAccess, Profile, Section,
} from './MediCareViews'

/* ------------------------------------------------------------------ auth gate */
function AuthGate({ onAuthed }: { onAuthed: (u: ApiUser) => void }) {
  const { toast } = useApp()
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [f, setF] = useState<any>({ email: '', password: '', name: '', role: 'patient' })
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (mode === 'login') {
        const r = await api.login(f.email, f.password)
        setToken(r.token); onAuthed(r.user)
      } else if (mode === 'register') {
        const r = await api.register(f)
        setToken(r.token); onAuthed(r.user)
      } else {
        const r = await api.forgot(f.email)
        toast((r as any).token ? `Dev reset token (email delivery not configured): ${(r as any).token}` : 'If the email exists, a reset link has been sent.', 'info')
        setMode('login')
      }
    } catch (err) { toast((err as ApiError).message, 'error') }
  }
  return (
    <div className="grid min-h-screen place-items-center grad-soft px-4">
      <Card className="w-full max-w-md p-7 anim-up">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl grad-brand text-lg font-black text-white">M</div>
          <h1 className="mt-3 text-[22px] font-extrabold text-slate-900">MediCare AI</h1>
          <p className="text-[12.5px] font-semibold text-teal-600">Smart Healthcare. Safer Living.</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <>
              <div><label className="label">Full name</label>
                <input required className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
              <div><label className="label">I am a</label>
                <select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
                  <option value="patient">Patient</option><option value="doctor">Doctor</option><option value="family">Family member</option>
                </select></div>
            </>
          )}
          <div><label className="label">Email</label>
            <input required type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          {mode !== 'forgot' && (
            <div><label className="label">Password</label>
              <input required type="password" minLength={8} className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
          )}
          <button className="btn btn-primary btn-lg w-full">
            {mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}
          </button>
        </form>
        <div className="mt-4 flex justify-between text-[12px] font-semibold">
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-brand-600 hover:underline">
            {mode === 'login' ? 'Create an account' : 'I already have an account'}
          </button>
          <button onClick={() => setMode('forgot')} className="text-slate-500 hover:underline">Forgot password?</button>
        </div>
        <p className="mt-5 rounded-lg bg-slate-50 border border-slate-200 p-3 text-[11px] leading-relaxed text-slate-500">
          Demo accounts (after seeding, password <code>Medicare@123</code>): patient@demo.local · doctor@demo.local · family@demo.local · admin@demo.local
        </p>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ nav config */
const NAV = {
  patient: [
    { group: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    { group: 'Health', items: [
      { id: 'monitoring', label: 'Health Monitoring', icon: Activity },
      { id: 'risk', label: 'AI Risk Analysis', icon: Sparkles },
      { id: 'scanner', label: 'Prescription Scanner', icon: ScanLine },
      { id: 'safety', label: 'Medicine Safety Checker', icon: ShieldCheck },
      { id: 'generic', label: 'Generic Medicine Finder', icon: Pill },
      { id: 'reminders', label: 'Medicine Reminders', icon: Bell },
      { id: 'lab', label: 'Lab Report Analyzer', icon: FlaskConical },
      { id: 'reports', label: 'My Reports', icon: FileText },
    ]},
    { group: 'Care', items: [
      { id: 'sos', label: 'Emergency SOS', icon: Siren },
      { id: 'voice', label: 'Voice Assistant', icon: Mic },
      { id: 'appointments', label: 'Appointments', icon: CalendarDays },
      { id: 'family', label: 'Family & Doctor Access', icon: Users },
      { id: 'profile', label: 'My Profile', icon: Heart },
    ]},
  ],
  doctor: [
    { group: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    { group: 'Patients', items: [{ id: 'patients', label: 'My Patients', icon: Stethoscope }] },
    { group: 'Schedule', items: [{ id: 'appointments', label: 'Appointments', icon: CalendarDays }] },
  ],
  family: [
    { group: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    { group: 'Loved ones', items: [{ id: 'patients', label: 'Shared Patients', icon: Users }] },
  ],
  admin: [
    { group: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: BarChart3 }] },
    { group: 'System', items: [
      { id: 'users', label: 'User Management', icon: Users },
      { id: 'audit', label: 'Audit Logs', icon: ClipboardList },
    ]},
  ],
} as const

const TITLES: Record<string, { t: string; s: string }> = {
  dashboard: { t: 'Dashboard', s: 'MediCare AI — Smart Healthcare. Safer Living.' },
  monitoring: { t: 'Health Monitoring', s: 'Log and track glucose, blood pressure, heart rate, SpO₂, temperature and weight.' },
  risk: { t: 'AI Risk Analysis', s: 'Anomaly detection and trend screening over your logged readings.' },
  scanner: { t: 'Prescription Scanner', s: 'AI OCR reading of prescription photos and PDFs.' },
  safety: { t: 'Medicine Safety Checker', s: 'Drug-interaction and duplicate-ingredient checks (NIH RxNav).' },
  generic: { t: 'Generic Medicine Finder', s: 'Verified generic equivalents with the same active ingredient.' },
  reminders: { t: 'Medicine Reminders', s: 'Daily schedule, taken/missed tracking and alerts.' },
  lab: { t: 'Lab Report Analyzer', s: 'Extract lab values and compare with the report reference ranges.' },
  sos: { t: 'Emergency SOS', s: 'Alert your authorised family and doctor.' },
  voice: { t: 'Voice Assistant', s: 'English, हिन्दी and తెలుగు voice entry and read-aloud.' },
  appointments: { t: 'Appointments', s: 'Consultations with your authorised doctors.' },
  family: { t: 'Family & Doctor Access', s: 'Grant or revoke consent for your health data.' },
  reports: { t: 'My Reports', s: 'Everything you uploaded, plus a downloadable health summary.' },
  profile: { t: 'My Profile', s: 'Medical conditions, allergies, blood group and doctor details.' },
  patients: { t: 'Shared Patients', s: 'Patients who authorised you (consent-based access).' },
  users: { t: 'User Management', s: 'All registered accounts.' },
  audit: { t: 'Audit Logs', s: 'System activity trail.' },
}

/* ------------------------------------------------------------------ dashboards */
function PatientDashboard({ go }: { go: (v: string) => void }) {
  const [readings, setReadings] = useState<any[]>([])
  const [rems, setRems] = useState<any>({ reminders: [], missed: [] })
  const [appts, setAppts] = useState<any[]>([])
  const [notifs, setNotifs] = useState<any[]>([])
  useEffect(() => {
    api.readings(30).then((r) => setReadings(r.readings)).catch(() => {})
    api.reminders().then(setRems).catch(() => {})
    api.appts().then((r) => setAppts(r.appointments)).catch(() => {})
    api.notifs().then((r) => setNotifs(r.notifications)).catch(() => {})
  }, [])
  const last = readings[readings.length - 1]
  const kpis = [
    { label: 'Latest blood pressure', value: last ? `${last.systolic ?? '—'}/${last.diastolic ?? '—'}` : '—', sub: 'mmHg', to: 'monitoring' },
    { label: 'Latest glucose', value: last?.glucose ?? '—', sub: 'mg/dL', to: 'monitoring' },
    { label: 'Active reminders', value: rems.reminders?.length ?? 0, sub: `${(rems.missed || []).length} missed dose(s)`, to: 'reminders' },
    { label: 'Next appointment', value: appts[0] ? `${appts[0].date}` : '—', sub: appts[0]?.time || 'none booked', to: 'appointments' },
  ]
  return (
    <div className="space-y-5">
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <button key={k.label} onClick={() => go(k.to)} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-500">{k.label}</p>
            <p className="mt-2 text-[25px] font-extrabold tabular-nums text-slate-900">{k.value}</p>
            <p className="mt-1 text-[11px] text-slate-500">{k.sub}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Quick actions" sub="Most-used MediCare AI tools" icon={Sparkles}>
          <div className="grid grid-cols-2 gap-3">
            {[['monitoring', 'Log a reading', Activity], ['scanner', 'Scan a prescription', ScanLine],
              ['safety', 'Check medicine safety', ShieldCheck], ['sos', 'Emergency SOS', Siren]].map(([id, label, Icon]: any) => (
              <button key={id} onClick={() => go(id)} className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3.5 text-left transition hover:border-brand-300 hover:bg-brand-50/40">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600"><Icon size={16} /></span>
                <span className="text-[13px] font-bold text-slate-700">{label}</span>
              </button>
            ))}
          </div>
        </Section>
        <Section title="Notifications" sub="Reminders, emergency alerts and consent updates" icon={Bell}>
          {notifs.length === 0 ? <p className="text-[12.5px] text-slate-500">No notifications yet.</p> :
            notifs.slice(0, 6).map((n) => (
              <div key={n.id} className="border-b border-slate-100 py-2.5">
                <p className="text-[12.5px] font-bold text-slate-800">{n.title}</p>
                <p className="text-[11.5px] text-slate-500">{n.body}</p>
              </div>
            ))}
        </Section>
      </div>
      <p className="text-[11px] text-slate-400">MediCare AI provides informational assistance only and is not a substitute for professional medical advice, diagnosis or treatment.</p>
    </div>
  )
}

function PatientOverview({ go }: { go: (v: string) => void }) {
  const [list, setList] = useState<any[]>([])
  const [sel, setSel] = useState<number | null>(null)
  const [ov, setOv] = useState<any>(null)
  useEffect(() => { api.sharedPatients().then((r) => setList(r.patients)).catch(() => {}) }, [])
  useEffect(() => { if (sel) api.patientOverview(sel).then(setOv).catch(() => {}) }, [sel])
  return (
    <div className="space-y-5">
      <Section title="Authorised patients" sub="You only see patients who granted you consent" icon={Users}>
        {list.length === 0 ? <p className="text-[12.5px] text-slate-500">No patients have authorised you yet.</p> :
          <div className="flex flex-wrap gap-2">{list.map((p) => (
            <button key={p.patient_user_id} onClick={() => setSel(p.patient_user_id)}
              className={cn('btn btn-sm', sel === p.patient_user_id ? 'btn-primary' : 'btn-ghost')}>
              {p.name} <span className="opacity-60">({p.relation || 'member'})</span></button>
          ))}</div>}
      </Section>
      {ov && (
        <>
          <Section title={`${ov.patient} — latest readings`} icon={Activity}>
            <table className="tbl"><thead><tr><th>Date</th><th>Glucose</th><th>BP</th><th>HR</th><th>SpO₂</th></tr></thead>
              <tbody>{ov.latest_readings.map((r: any) => (
                <tr key={r.id}><td>{r.reading_date}</td><td>{r.glucose ?? '—'}</td>
                  <td>{r.systolic ?? '—'}/{r.diastolic ?? '—'}</td><td>{r.heart_rate ?? '—'}</td><td>{r.spo2 ?? '—'}</td></tr>
              ))}</tbody></table>
          </Section>
          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Reminders & missed doses" icon={Bell}>
              {ov.reminders.map((r: any) => <p key={r.id} className="text-[12.5px] font-semibold text-slate-700">{r.med_name} · {JSON.parse(r.times).join(', ')}</p>)}
              <p className="mt-2 text-[12px] font-bold uppercase tracking-wide text-slate-500">Missed</p>
              {ov.missed_doses.length === 0 ? <p className="text-[12px] text-slate-500">None 🎉</p> :
                ov.missed_doses.map((m: any) => <p key={m.id} className="text-[12px] text-rose-600">{m.med_name} — {m.sched_date} {m.sched_time}</p>)}
            </Section>
            <Section title="Recent emergency events" icon={Siren}>
              {ov.emergency_events.length === 0 ? <p className="text-[12px] text-slate-500">None.</p> :
                ov.emergency_events.map((e: any) => (
                  <p key={e.id} className="text-[12px] text-slate-600"><Badge tone="red">{e.kind}</Badge> {e.created_at} — {e.note}</p>
                ))}
            </Section>
          </div>
          <p className="text-[11px] text-slate-400">Access is consent-based: the patient can revoke it at any time, and every view is audit-logged.</p>
        </>
      )}
    </div>
  )
}

function AdminDashboard({ view }: { view: string }) {
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  useEffect(() => {
    api.adminStats().then(setStats).catch(() => {})
    if (view === 'users') api.adminUsers().then((r) => setUsers(r.users)).catch(() => {})
    if (view === 'audit') api.adminAudit().then((r) => setLogs(r.logs)).catch(() => {})
  }, [view])
  if (view === 'users')
    return <Section title="User management" icon={Users}>
      <table className="tbl"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
        <tbody>{users.map((u) => <tr key={u.id}><td>{u.id}</td><td className="font-semibold">{u.name}</td><td>{u.email}</td>
          <td><Badge tone={u.role === 'admin' ? 'purple' : 'blue'}>{u.role}</Badge></td><td>{u.created_at?.slice(0, 10)}</td></tr>)}</tbody></table>
    </Section>
  if (view === 'audit')
    return <Section title="Audit logs (last 100)" icon={ClipboardList}>
      <table className="tbl"><thead><tr><th>When</th><th>User</th><th>Action</th><th>Detail</th></tr></thead>
        <tbody>{logs.map((l) => <tr key={l.id}><td>{l.created_at}</td><td>{l.user_id ?? '—'}</td><td className="font-semibold">{l.action}</td><td>{l.detail}</td></tr>)}</tbody></table>
    </Section>
  return (
    <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      {[['Patients', stats?.patients], ['Doctors', stats?.doctors], ['Family members', stats?.family],
        ['Health readings', stats?.readings], ['Prescription uploads', stats?.prescriptions], ['Lab reports', stats?.lab_reports],
        ['Emergency events', stats?.emergency_events], ['Appointments', stats?.appointments], ['Active reminders', stats?.reminders]].map(([l, v]: any) => (
        <div key={l} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-500">{l}</p>
          <p className="mt-2 text-[25px] font-extrabold tabular-nums text-slate-900">{v ?? '—'}</p>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ shell */
export default function MediCareApp() {
  const { toast } = useApp()
  const [user, setUser] = useState<ApiUser | null>(null)
  const [ready, setReady] = useState(false)
  const [view, setView] = useState('dashboard')
  const [openNav, setOpenNav] = useState(false)

  useEffect(() => {
    if (getToken()) api.me().then((r) => setUser(r.user)).catch(() => setToken(null)).finally(() => setReady(true))
    else setReady(true)
  }, [])
  useEffect(() => {
    Notification.requestPermission?.().catch(() => {})
    if (!user) return
    const t = setInterval(() => {
      api.notifs().then((r) => {
        const un = r.notifications.filter((n: any) => !n.read)
        un.forEach((n: any) => { try { new Notification('MediCare AI', { body: `${n.title} — ${n.body}` }) } catch { /* noop */ } })
        if (un.length) api.me().catch(() => {})
      }).catch(() => {})
    }, 60000)
    return () => clearInterval(t)
  }, [user?.id])

  if (!ready) return null
  if (!user) return <AuthGate onAuthed={setUser} />

  const role = (user.role in NAV ? user.role : 'patient') as keyof typeof NAV
  const groups = NAV[role]
  const meta = TITLES[view] || TITLES.dashboard

  const logout = async () => { try { await api.logout() } catch { /* noop */ } setToken(null); setUser(null) }

  const sidebar = (
    <aside className="flex h-full w-[262px] shrink-0 flex-col grad-navy">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl grad-brand text-[15px] font-black text-white">M</span>
          <div><p className="text-[14px] font-extrabold text-white">MediCare AI</p>
            <p className="text-[9.5px] font-semibold tracking-wide text-teal-300">SMART HEALTHCARE. SAFER LIVING.</p></div>
        </div>
        <button onClick={() => setOpenNav(false)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 lg:hidden"><X size={16} /></button>
      </div>
      <div className="mx-3 mb-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full grad-brand text-[13px] font-bold text-white">
          {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
        </span>
        <div className="min-w-0"><p className="truncate text-[12.5px] font-bold text-white">{user.name}</p>
          <p className="truncate text-[10.5px] capitalize text-teal-300">{user.role} account</p></div>
      </div>
      <nav className="flex-1 overflow-y-auto pb-4">
        {groups.map((g) => (
          <div key={g.group}>
            <p className="side-group">{g.group}</p>
            {g.items.map((it: any) => (
              <button key={it.id} onClick={() => { setView(it.id); setOpenNav(false) }}
                className={cn('side-item w-[calc(100%-1rem)]', view === it.id && 'side-item-active')}>
                <it.icon size={16} className="shrink-0" /><span className="truncate">{it.label}</span>
              </button>
            ))}
          </div>
        ))}
        {role === 'patient' && <p className="px-4 pt-3 text-[10px] leading-relaxed text-slate-500">Sidebar shows patient features. Doctor, family and admin accounts see their own set.</p>}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-rose-300 transition hover:bg-rose-500/10">
          <LogOut size={15} /> Logout
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="sticky top-0 hidden h-screen lg:block">{sidebar}</div>
      {openNav && (
        <div className="fixed inset-0 z-[70] flex lg:hidden">
          <div className="h-full">{sidebar}</div>
          <div className="flex-1 bg-slate-900/50 backdrop-blur-sm" onClick={() => setOpenNav(false)} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-[62px] items-center gap-3 px-4 sm:px-6">
            <button onClick={() => setOpenNav(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"><Menu size={17} /></button>
            <p className="text-[13px] font-bold text-slate-700">MediCare AI</p>
            <span className="ml-auto rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11.5px] font-semibold capitalize text-slate-600">{user.role} workspace</span>
          </div>
        </header>
        <div className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6">
          <h1 className="text-[21px] font-extrabold leading-tight text-slate-900">{meta.t}</h1>
          <p className="mt-1 text-[12.5px] text-slate-500">{meta.s}</p>
        </div>
        <main className="flex-1 p-4 sm:p-6">
          {role === 'patient' && <>
            {view === 'dashboard' && <PatientDashboard go={setView} />}
            {view === 'monitoring' && <HealthMonitoring />}
            {view === 'risk' && <RiskAnalysis />}
            {view === 'scanner' && <PrescriptionScanner />}
            {view === 'safety' && <SafetyChecker />}
            {view === 'generic' && <GenericFinder />}
            {view === 'reminders' && <Reminders />}
            {view === 'lab' && <LabAnalyzer />}
            {view === 'sos' && <EmergencySOS />}
            {view === 'voice' && <VoiceAssistant />}
            {view === 'appointments' && <Appointments />}
            {view === 'family' && <FamilyAccess />}
            {view === 'reports' && <MyReports />}
            {view === 'profile' && <Profile />}
          </>}
          {(role === 'doctor' || role === 'family') && <>
            {view === 'dashboard' && <PatientOverview go={setView} />}
            {view === 'patients' && <PatientOverview go={setView} />}
          </>}
          {role === 'admin' && <AdminDashboard view={view} />}
        </main>
        <footer className="border-t border-slate-200 bg-white px-6 py-3.5">
          <p className="text-[11px] text-slate-500">
            MediCare AI — {user.role} workspace · Confidential · AI tools provide informational assistance only and are not a substitute for professional medical advice. Not an emergency medical service — in India call 112.
          </p>
        </footer>
      </div>
    </div>
  )
}
