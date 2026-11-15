import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity, Ambulance, Bell, Building2, CalendarDays, ChevronDown, ClipboardList, FileText,
  Heart, LayoutDashboard, LogOut, Menu, Microscope, Pill, Search, ShieldCheck, Stethoscope,
  Users, X, FlaskConical, Gauge, Video, ListOrdered, UserPlus, Clock, ScanLine, BedDouble,
  Receipt, ScrollText, Settings, BellRing, FileSearch, Contact2, Syringe, ChartPie,
} from 'lucide-react'
import { cn } from './ui'
import { Logo } from './PublicShell'
import { useApp } from '../context/AppContext'
import { ROLE_META } from '../data/mock'
import { DEMO_USERS } from '../data/users'
import type { Role } from '../data/mock'

import { BedDouble as BedNav, TrendingUp as TrendNav, Sparkles as SparkNav, Siren as SirenNav, BrainCircuit as BrainNav, TestTubes as TubeNav } from 'lucide-react' // IconsNavExtra
export type NavItem = { id: string; label: string; icon: any }
export type NavGroup = { group: string; items: NavItem[] }

export const PORTAL_NAV: Record<Role, NavGroup[]> = {
  patient: [
    { group: 'Main', items: [
      { id: 'dashboard', label: 'Health Dashboard', icon: LayoutDashboard },
      { id: 'twin', label: 'Digital Health Twin', icon: Gauge },
      { id: 'monitoring', label: 'Health Monitoring', icon: Activity },
    ]},
    { group: 'My Care', items: [
      { id: 'medications', label: 'My Medications', icon: Pill },
      { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
      { id: 'reports', label: 'Lab Reports', icon: FlaskConical },
      { id: 'appointments', label: 'Appointments', icon: CalendarDays },
      { id: 'history', label: 'Medical History', icon: ScrollText },
      { id: 'stay', label: 'My Hospital Stay', icon: BedNav },
    ]},
    { group: 'Advanced Care', items: [
      { id: 'recovery', label: 'AI Recovery Tracker', icon: TrendNav },
      { id: 'explainer', label: 'Report Explainer', icon: SparkNav },
      { id: 'family', label: 'Family Guardian', icon: Users },
    ]},
    { group: 'Services', items: [
      { id: 'ai', label: 'AI Health Assistant', icon: Activity },
      { id: 'emergency', label: 'Emergency Assistance', icon: Ambulance },
      { id: 'profile', label: 'My Profile', icon: Contact2 },
      { id: 'notifications', label: 'Notifications', icon: BellRing },
    ]},
  ],
  doctor: [
    { group: 'Main', items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]},
    { group: 'Clinical Intelligence', items: [
      { id: 'clinical', label: 'ICU Risk Dashboard', icon: BrainNav },
    ]},
    { group: 'Patient Care', items: [
      { id: 'appointments', label: "Today's Appointments", icon: CalendarDays },
      { id: 'queue', label: 'Patient Queue', icon: ListOrdered },
      { id: 'patients', label: 'My Patients', icon: Users },
      { id: 'consultations', label: 'Consultations', icon: Stethoscope },
      { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
      { id: 'lab', label: 'Lab Reports', icon: FlaskConical },
      { id: 'followups', label: 'Follow-ups', icon: BellRing },
    ]},
    { group: 'Schedule', items: [
      { id: 'schedule', label: 'My Schedule', icon: Clock },
      { id: 'availability', label: 'Availability', icon: Settings },
    ]},
  ],
  nurse: [
    { group: 'Main', items: [
      { id: 'dashboard', label: 'Nursing Dashboard', icon: LayoutDashboard },
    ]},
    { group: 'ICU Command Center', items: [
      { id: 'icu', label: 'Live ICU Monitor', icon: SirenNav },
    ]},
    { group: 'Ward (cont.)', items: [
      { id: 'monitoring', label: 'Patient Monitoring', icon: Activity },
      { id: 'vitals', label: 'Vital Signs Entry', icon: Heart },
    ]},
    { group: 'Ward Operations', items: [
      { id: 'medication', label: 'Medication Administration', icon: Syringe },
      { id: 'alerts', label: 'Patient Alerts', icon: BellRing },
      { id: 'coordination', label: 'Appointment Coordination', icon: CalendarDays },
      { id: 'messages', label: 'Doctor Communication', icon: ClipboardList },
      { id: 'emergency', label: 'Emergency Notifications', icon: Ambulance },
    ]},
  ],
  reception: [
    { group: 'Main', items: [
      { id: 'dashboard', label: 'Front Desk Dashboard', icon: LayoutDashboard },
    ]},
    { group: 'Patient Services', items: [
      { id: 'directory', label: 'Patients Directory', icon: Users },
      { id: 'register', label: 'Register Patient', icon: UserPlus },
      { id: 'appointments', label: 'Appointments', icon: CalendarDays },
      { id: 'checkin', label: 'Check-In / Intake', icon: ClipboardList },
    ]},
    { group: 'Front Desk', items: [
      { id: 'emergency', label: 'Emergency Walk-In', icon: Ambulance },
      { id: 'queue', label: 'Waiting Queue', icon: ListOrdered },
      { id: 'schedules', label: 'Doctor Schedules', icon: Clock },
    ]},
  ],
  lab: [
    { group: 'Main', items: [
      { id: 'dashboard', label: 'Lab Dashboard', icon: LayoutDashboard },
    ]},
    { group: 'Intelligent Lab', items: [
      { id: 'intel', label: 'Critical & Trends', icon: TubeNav },
    ]},
    { group: 'Diagnostics (cont.)', items: [
      { id: 'requests', label: 'Test Requests', icon: ClipboardList },
      { id: 'upload', label: 'Upload Report', icon: ScanLine },
    ]},
    { group: 'Diagnostics', items: [
      { id: 'reports', label: 'Manage Reports', icon: FileText },
      { id: 'dispatch', label: 'Send to Doctor / Patient', icon: FileSearch },
      { id: 'catalog', label: 'Test Catalogue', icon: Microscope },
    ]},
  ],
  ambulance: [
    { group: 'Dispatch', items: [
      { id: 'dashboard', label: 'Live Emergency Tracking', icon: LayoutDashboard },
      { id: 'dispatch', label: 'Smart Dispatch', icon: SirenNav },
    ]},
    { group: 'Operations', items: [
      { id: 'fleet', label: 'Fleet Availability', icon: Ambulance },
      { id: 'journey', label: 'Journey Timeline', icon: Clock },
      { id: 'gps', label: 'GPS Ingest API', icon: Settings },
    ]},
  ],
  admin: [
    { group: 'Main', items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]},
    { group: 'Administration', items: [
      { id: 'users', label: 'Staff & Users', icon: Users },
      { id: 'doctors', label: 'Doctor Management', icon: Stethoscope },
      { id: 'patients', label: 'Patient Management', icon: Contact2 },
      { id: 'departments', label: 'Departments', icon: Building2 },
      { id: 'schedules', label: 'Doctor Schedules', icon: CalendarDays },
      { id: 'appointments', label: 'Appointments', icon: ClipboardList },
    ]},
    { group: 'Operations', items: [
      { id: 'beds', label: 'Bed Management', icon: BedDouble },
      { id: 'billing', label: 'Billing & Finance', icon: Receipt },
      { id: 'laboratory', label: 'Laboratory', icon: FlaskConical },
      { id: 'emergency', label: 'Emergency', icon: Ambulance },
    ]},
    { group: 'Governance', items: [
      { id: 'audit', label: 'Audit Logs', icon: ShieldCheck },
      { id: 'reports', label: 'Reports & Export', icon: ChartPie },
      { id: 'notifications', label: 'Notifications', icon: BellRing },
    ]},
  ],
}

export function PortalLayout({ role, view, setView, title, sub, actions, children, searchPlaceholder }:
  {
    role: Role; view: string; setView: (v: string) => void
    title: string; sub?: string; actions?: React.ReactNode
    children: React.ReactNode; searchPlaceholder?: string
  }) {
  const { session, logout, notif, readAll } = useApp()
  const nav = useNavigate()
  const [openNav, setOpenNav] = useState(false)
  const [openBell, setOpenBell] = useState(false)
  const [q, setQ] = useState('')
  const meta = ROLE_META[role]
  const user = DEMO_USERS[role]
  const groups = PORTAL_NAV[role]
  const unread = notif.filter((n) => !n.read).length

  const today = new Date(2026, 9, 4).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  const sidebar = (
    <aside className="flex h-full w-[262px] shrink-0 flex-col grad-navy">
      <div className="flex items-center justify-between px-4 py-4">
        <Logo light small />
        <button onClick={() => setOpenNav(false)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 lg:hidden"><X size={16} /></button>
      </div>
      <p className="px-4 pb-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal-300">{meta.label} Workspace</p>

      <div className="mx-3 mb-2 mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full grad-brand text-[13px] font-bold text-white">
          {(session?.name || user.name).split(' ').map((w) => w[0]).slice(0, 2).join('')}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-bold text-white">{session?.name || user.name}</p>
          <p className="truncate text-[10.5px] text-teal-300">{user.title}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto pb-4">
        {groups.map((g) => (
          <div key={g.group}>
            <p className="side-group">{g.group}</p>
            {g.items.map((it) => (
              <button key={it.id} onClick={() => { setView(it.id); setOpenNav(false) }}
                className={cn('side-item w-[calc(100%-1rem)]', view === it.id && 'side-item-active')}>
                <it.icon size={16} className="shrink-0" />
                <span className="truncate">{it.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button onClick={() => { logout(); nav('/') }}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-rose-300 transition hover:bg-rose-500/10">
          <LogOut size={15} /> Sign out
        </button>
        <p className="px-3 pt-2 text-[10px] leading-relaxed text-slate-500">
          Demo build v1.0.0 · JWT + role-based access prepared
        </p>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* desktop sidebar */}
      <div className="sticky top-0 hidden h-screen lg:block">{sidebar}</div>
      {/* mobile drawer */}
      {openNav && (
        <div className="fixed inset-0 z-[70] flex lg:hidden">
          <div className="h-full">{sidebar}</div>
          <div className="flex-1 bg-slate-900/50 backdrop-blur-sm" onClick={() => setOpenNav(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* header */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-[62px] items-center gap-3 px-4 sm:px-6">
            <button onClick={() => setOpenNav(true)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"><Menu size={17} /></button>

            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 xl:flex">
              <Building2 size={14} className="text-brand-600" />
              <span className="text-[12.5px] font-semibold text-slate-700">SmartMed Hospital</span>
              <ChevronDown size={13} className="text-slate-400" />
            </div>

            {searchPlaceholder && (
              <div className="relative hidden flex-1 max-w-md md:block">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[12.5px] outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10" />
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11.5px] font-semibold text-slate-600 lg:block">{today}</span>

              <div className="relative">
                <button onClick={() => setOpenBell((o) => !o)}
                  className="relative grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-brand-300 hover:text-brand-600">
                  <Bell size={16} />
                  {unread > 0 && <span className="absolute -right-1 -top-1 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
                </button>
                {openBell && (
                  <div className="absolute right-0 top-11 z-50 w-[330px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl anim-up">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <p className="text-[12.5px] font-bold text-slate-900">Notifications</p>
                      <button onClick={readAll} className="text-[11.5px] font-semibold text-brand-600 hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notif.slice(0, 6).map((n) => (
                        <div key={n.id} className={cn('border-b border-slate-50 px-4 py-3', !n.read && 'bg-brand-50/40')}>
                          <div className="flex items-start gap-2.5">
                            <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', n.read ? 'bg-slate-300' : 'bg-brand-500')} />
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold text-slate-800">{n.title}</p>
                              <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{n.body}</p>
                              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{n.cat} · {n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => { setOpenBell(false); setView('notifications') }}
                      className="w-full bg-slate-50 py-2.5 text-[11.5px] font-semibold text-brand-600 hover:bg-slate-100">
                      Open notification centre
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => { logout(); nav('/') }} className="btn btn-danger-soft btn-sm hidden sm:inline-flex">
                <LogOut size={13} /> Logout
              </button>
            </div>
          </div>
        </header>

        {/* page head */}
        <div className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[21px] font-extrabold leading-tight text-slate-900">{title}</h1>
              {sub && <p className="mt-1 text-[12.5px] text-slate-500">{sub}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6">{children}</main>

        <footer className="border-t border-slate-200 bg-white px-6 py-3.5">
          <p className="text-[11px] text-slate-500">
            SmartMed — {meta.portal} · Confidential clinical workspace (demo) · AI tools provide informational assistance only and are not a substitute for professional medical advice.
          </p>
        </footer>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ helpers used by portals */
export function Panel({ title, sub, icon: Icon, right, children, className = '', pad = true }:
  { title?: string; sub?: string; icon?: any; right?: React.ReactNode; children: React.ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cn('card', className)}>
      {(title || right) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            {Icon && <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600"><Icon size={15} /></span>}
            <div>
              <h2 className="text-[14px] font-bold text-slate-900">{title}</h2>
              {sub && <p className="text-[11.5px] text-slate-500">{sub}</p>}
            </div>
          </div>
          {right}
        </div>
      )}
      <div className={cn(pad && 'p-5')}>{children}</div>
    </section>
  )
}

export function KpiRow({ items }: { items: { label: string; value: React.ReactNode; sub?: string; icon?: any; tone?: string }[] }) {
  const ring: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600', teal: 'bg-teal-50 text-teal-600', green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600', purple: 'bg-violet-50 text-violet-600', red: 'bg-rose-50 text-rose-600',
    cyan: 'bg-cyan-50 text-cyan-600', slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <div className={cn('grid gap-3.5', items.length >= 5 ? 'sm:grid-cols-3 xl:grid-cols-5' : 'sm:grid-cols-2 xl:grid-cols-4')}>
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10.5px] font-bold uppercase leading-tight tracking-[0.1em] text-slate-500">{s.label}</p>
            {s.icon && <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', ring[s.tone || 'brand'])}><s.icon size={15} /></span>}
          </div>
          <p className="mt-2 text-[25px] font-extrabold leading-none tabular-nums text-slate-900">{s.value}</p>
          {s.sub && <p className="mt-1.5 text-[11px] leading-snug text-slate-500">{s.sub}</p>}
        </div>
      ))}
    </div>
  )
}
