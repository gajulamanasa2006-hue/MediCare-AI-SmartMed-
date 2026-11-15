import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity, ArrowRight, Check, ChevronRight, Clock, Facebook, Heart, Instagram, Linkedin,
  Lock, Mail, MapPin, Menu, Phone, ShieldCheck, Twitter, User, UserPlus, X, Ambulance, Bot,
} from 'lucide-react'
import { cn } from './ui'
import { useApp } from '../context/AppContext'
import { ROLE_META } from '../data/mock'
import type { Role } from '../data/mock'

export function Logo({ light = false, small = false }:
  { light?: boolean; small?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className={cn('relative grid place-items-center rounded-xl grad-brand text-white shadow-sm transition-transform group-hover:scale-105',
        small ? 'h-9 w-9' : 'h-10 w-10')}>
        <svg viewBox="0 0 24 24" width={small ? 18 : 21} height={small ? 18 : 21} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s-7-4.5-7-10a4.6 4.6 0 0 1 7-3.9A4.6 4.6 0 0 1 19 11c0 5.5-7 10-7 10Z" />
          <path d="M8.5 12h1.6l1-2.2 1.4 4 1.1-1.8h1.9" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-teal-400" />
      </span>
      <span className="leading-none">
        <span className={cn('block font-extrabold tracking-tight', small ? 'text-[14.5px]' : 'text-[16.5px]', light ? 'text-white' : 'text-slate-900')}>
          SMARTMED
        </span>
        {!small && <span className={cn('mt-0.5 block text-[9.5px] font-semibold uppercase tracking-[0.14em]', light ? 'text-slate-400' : 'text-slate-500')}>Connected Care Platform</span>}
      </span>
    </Link>
  )
}

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/ai-tools', label: 'AI Health Tools' },
  { to: '/doctors', label: 'Doctors' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/emergency', label: 'Emergency' },
  { to: '/contact', label: 'Contact' },
]

/* ================================================================ Navbar */
export function Navbar({ onPortal }: { onPortal: () => void }) {
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)
  const { session } = useApp()
  const nav = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    const h = () => setSolid(window.scrollY > 8)
    h(); window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])
  useEffect(() => { setOpen(false); window.scrollTo(0, 0) }, [pathname])

  return (
    <>
      {/* top utility strip */}
      <div className="hidden bg-slate-900 py-2 text-white lg:block">
        <div className="container-x flex items-center justify-between text-[12px]">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><Phone size={12} className="text-teal-300" /> +91 80 4510 2200</span>
            <span className="flex items-center gap-1.5"><Mail size={12} className="text-teal-300" /> care@smartmed.health</span>
            <span className="flex items-center gap-1.5"><Clock size={12} className="text-teal-300" /> OPD 08:00–21:00 · Emergency 24 × 7</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-emerald-300"><ShieldCheck size={12} /> NABH-aligned demo · HIPAA-style controls</span>
            <Link to="/emergency" className="flex items-center gap-1.5 font-semibold text-rose-300 hover:text-rose-200">
              <Ambulance size={12} /> Emergency Assistance
            </Link>
          </div>
        </div>
      </div>

      <header className={cn('sticky top-0 z-50 w-full border-b transition-all duration-300',
        solid ? 'border-slate-200 bg-white/92 shadow-sm backdrop-blur-md' : 'border-transparent bg-white/80 backdrop-blur-sm')}>
        <div className="container-x flex h-[68px] items-center justify-between gap-4">
          <Logo />

          <nav className="hidden items-center gap-1 xl:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'}
                className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}>
                {n.label}
                <span className={cn('absolute -bottom-px left-0 h-0.5 w-full rounded-full bg-brand-600 transition-transform duration-300',
                  pathname === n.to ? 'scale-x-100' : 'scale-x-0')} />
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <a href="tel:+918045102200" className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 lg:flex">
              <Phone size={13} className="text-brand-600" /> +91 80 4510 2200
            </a>
            {session ? (
              <Link to={ROLE_META[session.role].home} className="btn btn-primary btn-md hidden sm:inline-flex">
                <Activity size={15} /> {ROLE_META[session.role].portal}
              </Link>
            ) : (
              <>
                <button onClick={onPortal} className="btn btn-ghost btn-md hidden sm:inline-flex"><Lock size={14} /> Login</button>
                <button onClick={onPortal} className="btn btn-primary btn-md hidden sm:inline-flex">Register <ArrowRight size={14} /></button>
              </>
            )}
            <button className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 xl:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-slate-200 bg-white xl:hidden anim-in">
            <div className="container-x grid gap-1 py-4">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.to === '/'}
                  className={({ isActive }) => cn('flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px] font-medium',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50')}>
                  {n.label} <ChevronRight size={15} className="text-slate-400" />
                </NavLink>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={onPortal} className="btn btn-ghost btn-md"><Lock size={14} /> Login</button>
                <button onClick={onPortal} className="btn btn-primary btn-md">Register</button>
              </div>
              <Link to="/emergency" className="btn btn-danger btn-md mt-1"><Ambulance size={15} /> Emergency Assistance</Link>
            </div>
          </div>
        )}
      </header>
    </>
  )
}

/* ================================================================ Portal chooser modal */
export function PortalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate()
  if (!open) return null
  const go = (r: Role) => { onClose(); nav('/auth?role=' + r) }
  const patient: Role[] = ['patient']
  const staff: Role[] = ['doctor', 'nurse', 'reception', 'lab', 'admin']

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm anim-in" onClick={onClose}>
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl anim-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 grad-brand px-6 py-5">
          <div>
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck size={18} />
              <h3 className="text-[17px] font-bold text-white">SmartMed Access Portals</h3>
            </div>
            <p className="mt-1 text-[12.5px] text-white/85">Select your designated healthcare portal below</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 text-white hover:bg-white/25"><X size={16} /></button>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          {[
            {
              title: 'Patient Portal', tag: 'Self-Service', tone: 'teal' as const,
              desc: 'Access your personal health record, AI medication-safety checks, prescriptions, lab reports, reminders and appointments.',
              roles: patient, primary: 'Sign in to Patient Portal', secondary: 'Create Patient Account',
              icon: Heart,
            },
            {
              title: 'Staff & Clinical Portals', tag: 'Institutional', tone: 'brand' as const,
              desc: 'Secure workspaces for Physicians, Nurses, Receptionists, Laboratory staff and Hospital Administrators.',
              roles: staff, primary: 'Sign in to Staff Portal', secondary: null,
              icon: Lock,
            },
          ].map((c) => (
            <div key={c.title} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className={cn('grid h-10 w-10 place-items-center rounded-lg border',
                  c.tone === 'teal' ? 'border-teal-100 bg-teal-50 text-teal-600' : 'border-brand-100 bg-brand-50 text-brand-600')}>
                  <c.icon size={19} />
                </span>
                <span className={cn('chip', c.tone === 'teal' ? 'chip-teal' : 'chip-blue')}>{c.tag}</span>
              </div>
              <h4 className="mt-3.5 text-[15px] font-bold text-slate-900">{c.title}</h4>
              <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-slate-600">{c.desc}</p>

              {c.title.startsWith('Staff') && (
                <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50/70 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">Institutional policy</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-brand-800/90">Staff accounts are provisioned exclusively by Hospital Administrators. Self-registration is disabled — use a demo role below.</p>
                </div>
              )}

              <div className="mt-4 grid gap-2">
                <button onClick={() => go(c.roles[0])} className={cn('btn btn-md w-full', c.tone === 'teal' ? 'btn-teal' : 'btn-navy')}>{c.primary}</button>
                {c.secondary && (
                  <button onClick={() => { onClose(); nav('/auth?mode=register&role=patient') }} className="btn btn-ghost btn-md w-full">
                    <UserPlus size={14} /> {c.secondary}
                  </button>
                )}
              </div>

              {c.roles.length > 1 && (
                <div className="mt-4 border-t border-dashed border-slate-200 pt-3.5">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-500">Demo role shortcuts</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.roles.map((r) => (
                      <button key={r} onClick={() => go(r)}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700">
                        {ROLE_META[r].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <p className="text-[11.5px] text-slate-500">
            Demo environment — all patients, staff and clinical values are synthetic. No real personal or medical data is stored.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ================================================================ Floating AI assistant */
export function AiBubble() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [log, setLog] = useState<{ me: boolean; t: string }[]>([
    { me: false, t: 'Hi! I am the SmartMed assistant. Ask me about medication safety, symptoms, reports or booking an appointment.' },
  ])
  const box = useRef<HTMLDivElement>(null)

  const answer = (s: string) => {
    const t = s.toLowerCase()
    if (/medicin|medicine|drug|pill|dose|interact/.test(t)) return 'Open AI Medication Safety in AI Health Tools — enter every medicine, dose, your allergies and conditions. The engine returns interactions, duplicates, allergy conflicts and a risk score. Always confirm with your pharmacist.'
    if (/symptom|fever|pain|cough|headache|rash|vomit/.test(t)) return 'Use the AI Symptom Assistant. Describe your symptoms in your own words and it returns possible concerns, an urgency level and the right department. It is triage support, not a diagnosis.'
    if (/report|lab|blood|x-ray|xray|scan|mri|ct/.test(t)) return 'Upload it in Medical Report OCR or AI Lab Analysis. Values outside the reference range get a plain-English explanation plus a suggested follow-up.'
    if (/appoint|book|slot|doctor|consult/.test(t)) return 'Go to Appointments — choose department, doctor, date, time and type (In-Person, Video or Emergency). You get a token and a confirmation card instantly.'
    if (/emergency|ambulance|accident|urgent/.test(t)) return 'Tap Emergency Assistance. Enter the emergency type and location and the AI Emergency Priority engine returns CRITICAL / HIGH / MEDIUM / LOW with dispatch guidance. In a real emergency, call your local emergency number.'
    if (/score|health twin|vitals|bp|sugar|heart/.test(t)) return 'Open the Digital Health Twin in your patient portal for live blood pressure, glucose, heart-rate and health-score trends with historical charts.'
    return 'I can help with medication safety, symptom triage, report analysis, health-score tracking and appointments. Try asking: "check my medicines for interactions" or "I have chest pain and sweating".'
  }

  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: 'smooth' }) }, [log, open])

  return (
    <>
      <button onClick={() => setOpen((o) => !o)}
        className={cn('fixed bottom-5 left-5 z-[70] grid h-13 w-13 place-items-center rounded-full text-white shadow-lift transition-all',
          'h-14 w-14 grad-brand hover:scale-105')} aria-label="AI assistant">
        {open ? <X size={20} /> : <Bot size={22} />}
      </button>
      {open && (
        <div className="fixed bottom-24 left-5 z-[70] flex w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl anim-up">
          <div className="flex items-center gap-3 grad-brand px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/20 text-white"><Bot size={17} /></span>
            <div>
              <p className="text-[13.5px] font-bold text-white">AI Assistant</p>
              <p className="text-[11px] text-white/80">Medication · Symptoms · Reports · Booking</p>
            </div>
          </div>
          <div ref={box} className="max-h-72 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {log.map((m, i) => (
              <div key={i} className={cn('flex', m.me ? 'justify-end' : 'justify-start')}>
                <p className={cn('max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed',
                  m.me ? 'rounded-br-sm bg-brand-600 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700')}>{m.t}</p>
              </div>
            ))}
          </div>
          <form className="flex items-center gap-2 border-t border-slate-200 bg-white p-3"
            onSubmit={(e) => { e.preventDefault(); if (!q.trim()) return; setLog((l) => [...l, { me: true, t: q }, { me: false, t: answer(q) }]); setQ('') }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about your health…" className="input py-2 text-[12.5px]" />
            <button className="btn btn-primary btn-sm shrink-0" type="submit">Send</button>
          </form>
          <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-[10px] text-slate-500">
            Informational assistance only — not a substitute for professional medical advice.
          </p>
        </div>
      )}
    </>
  )
}

/* ================================================================ Footer */
export function Footer({ onPortal }: { onPortal: () => void }) {
  const cols = [
    { h: 'SmartMed', links: [['About', '/about'], ['How it works', '/about'], ['Accessibility', '/contact'], ['Security & privacy', '/about'], ['Careers (demo)', '/contact']] },
    { h: 'Quick Links', links: [['Home', '/'], ['Doctors', '/doctors'], ['Appointments', '/appointments'], ['Emergency', '/emergency'], ['Contact', '/contact']] },
    { h: 'Services', links: [['General Medicine', '/services'], ['Cardiology', '/services'], ['Neurology', '/services'], ['Orthopedics', '/services'], ['Laboratory', '/services'], ['Emergency & Trauma', '/services']] },
    { h: 'AI Health Tools', links: [['Medication Safety', '/ai-tools'], ['Symptom Assistant', '/ai-tools'], ['Report OCR', '/ai-tools'], ['Lab Report Analysis', '/ai-tools'], ['AI Health Score', '/ai-tools']] },
    { h: 'Patient Resources', links: [['Patient Portal', '/auth?role=patient'], ['Digital Health Twin', '/auth?role=patient'], ['Medication Reminders', '/auth?role=patient'], ['Notification Centre', '/auth?role=patient'], ['Staff Portals', '/auth?role=doctor']] },
  ]
  return (
    <footer className="mt-20 grad-navy text-slate-300">
      <div className="container-x py-14">
        <div className="grid gap-10 lg:grid-cols-6">
          <div className="lg:col-span-1">
            <Logo light />
            <p className="mt-4 text-[12.5px] leading-relaxed text-slate-400">
              An intelligent healthcare ecosystem connecting patients, doctors, nurses, laboratories, front-desk teams and emergency services in one platform.
            </p>
            <div className="mt-5 flex gap-2">
              {[Facebook, Twitter, Instagram, Linkedin].map((I, i) => (
                <a key={i} href="#top" aria-label="social" className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:border-teal-400/40 hover:bg-teal-400/10 hover:text-teal-300">
                  <I size={15} />
                </a>
              ))}
            </div>
          </div>

          {cols.slice(0, 5).map((c) => (
            <div key={c.h}>
              <h4 className="text-[12px] font-bold uppercase tracking-[0.12em] text-white">{c.h}</h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map(([l, to]) => (
                  <li key={l}>
                    <Link to={to} className="text-[12.5px] text-slate-400 transition hover:text-teal-300">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-[0.12em] text-white">Contact</h4>
            <ul className="mt-4 space-y-3 text-[12.5px] text-slate-400">
              <li className="flex gap-2.5"><MapPin size={14} className="mt-0.5 shrink-0 text-teal-400" /> 24  Avenue, Health District, Bengaluru 560103</li>
              <li className="flex gap-2.5"><Phone size={14} className="mt-0.5 shrink-0 text-teal-400" /> +91 80 4510 2200</li>
              <li className="flex gap-2.5"><Mail size={14} className="mt-0.5 shrink-0 text-teal-400" /> care@smartmed.health</li>
              <li className="flex gap-2.5"><Clock size={14} className="mt-0.5 shrink-0 text-teal-400" /> OPD 08:00–21:00 · Emergency 24×7</li>
            </ul>
            <button onClick={onPortal} className="btn btn-teal btn-sm mt-4">Open Access Portals</button>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-amber-400/25 bg-amber-400/10 px-5 py-4">
          <p className="text-[12px] font-medium leading-relaxed text-amber-200">
            <strong className="font-bold">Important:</strong> AI tools provide informational assistance and are not a substitute for professional medical advice.
            All clinical values, patients and staff shown in this demonstration are synthetic. In a medical emergency, contact your local emergency number immediately.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-[11.5px] text-slate-500 sm:flex-row">
          <p>© 2026 SmartMed. Empowering Patients for Safe and Effective Medication Use.</p>
          <p className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-teal-400" /> JWT · Role-based access · Audit logged</span>
            <span>v1.0.0</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

/* ================================================================ Public shell */
export function PublicShell({ children }: { children: React.ReactNode }) {
  const [portal, setPortal] = useState(false)
  return (
    <div id="top" className="flex min-h-screen flex-col">
      <Navbar onPortal={() => setPortal(true)} />
      <main className="flex-1">{children}</main>
      <Footer onPortal={() => setPortal(true)} />
      <PortalModal open={portal} onClose={() => setPortal(false)} />
      <AiBubble />
    </div>
  )
}

/* ================================================================ Page hero (inner pages) */
export function PageHero({ eyebrow, title, sub, children }:
  { eyebrow: string; title: React.ReactNode; sub: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 grad-hero">
      <div className="absolute inset-0 dotgrid opacity-[0.35]" aria-hidden />
      <div className="container-x relative py-14 lg:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-[42px]">{title}</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{sub}</p>
          {children && <div className="mt-7 flex flex-wrap items-center justify-center gap-3">{children}</div>}
        </div>
      </div>
    </section>
  )
}
