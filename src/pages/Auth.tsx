import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, BadgeCheck, Check, CheckCircle2, Heart, Info, KeyRound, Lock,
  Mail, ShieldCheck, Smartphone, Stethoscope, UserPlus, AlertCircle, Building2,
} from 'lucide-react'
import { cn, Btn, Field, Input, Select } from '../components/ui'
import { Logo } from '../components/PublicShell'
import { useApp } from '../context/AppContext'
import { ROLE_META } from '../data/mock'
import { DEMO_USERS, PATIENT_ACCOUNTS } from '../data/users'
import type { Role } from '../data/mock'

const STAFF_ROLES: Role[] = ['doctor', 'nurse', 'reception', 'lab', 'admin', 'ambulance']

export default function Auth() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { login, toast } = useApp()

  const initRole = (params.get('role') as Role) || 'patient'
  const initMode = params.get('mode') === 'register' ? 'register' : 'signin'

  const [tab, setTab] = useState<'patient' | 'staff'>(STAFF_ROLES.includes(initRole) ? 'staff' : 'patient')
  const [mode, setMode] = useState<'signin' | 'register' | 'forgot'>(initMode as any)
  const [role, setRole] = useState<Role>(initRole)
  const [step, setStep] = useState<'form' | 'otp' | 'done'>('form')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [showPw, setShowPw] = useState(false)
  const [email, setEmail] = useState(DEMO_USERS[initRole].email)
  const [name, setName] = useState('')

  const setTabRole = (t: 'patient' | 'staff') => {
    setTab(t)
    const r: Role = t === 'patient' ? 'patient' : 'doctor'
    setRole(r); setEmail(DEMO_USERS[r].email)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'forgot') { toast('Reset link sent to your email (demo).', 'info'); setMode('signin'); return }
    setStep('otp')
  }

  const verify = () => {
    if (otp.join('').length < 6) { toast('Enter all six digits of the verification code.', 'error'); return }
    setStep('done')
    const display = mode === 'register' ? (name || 'New Patient') : DEMO_USERS[role].name
    setTimeout(() => {
      login(role, display, email)
      nav(ROLE_META[role].home)
    }, 900)
  }

  const fillDemo = (r: Role) => {
    setRole(r); setEmail(DEMO_USERS[r].email); setTab(STAFF_ROLES.includes(r) ? 'staff' : 'patient')
    setMode('signin'); setStep('form'); toast(`Demo credentials loaded for ${ROLE_META[r].label}.`, 'info')
  }

  const leftBullets = tab === 'patient'
    ? ['Personal health record & digital health twin', 'AI medication-safety screening before every dose', 'Prescriptions, lab reports and reminders in one place', 'In-person, video and emergency appointment booking']
    : ['Doctor e-prescriptions, notes & clinical vitals', 'Front-desk patient registration, tokens & live queue', 'Diagnostic pathology, radiology and verified reports', 'Role-based access control with full audit logging']

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* ---------------- left brand banner ---------------- */}
        <div className="relative hidden overflow-hidden grad-navy p-10 lg:flex lg:w-[46%] lg:flex-col">
          <div className="absolute inset-0 dotgrid opacity-[0.14]" aria-hidden />
          <div className="relative flex items-center justify-between">
            <Logo light />
            <Link to="/" className="btn btn-sm border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10">
              <ArrowLeft size={13} /> Back to Home
            </Link>
          </div>

          <div className="relative mt-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3.5 py-1.5 text-[11.5px] font-semibold text-teal-300">
              <ShieldCheck size={13} /> SmartMed {tab === 'patient' ? 'Patient' : 'Staff & Clinical'} Access
            </span>
            <h1 className="mt-5 text-[34px] font-extrabold leading-tight text-white">
              {tab === 'patient' ? 'Your Health, Connected.' : 'Institutional Clinical Workspace'}
            </h1>
            <p className="mt-3.5 max-w-md text-[13.5px] leading-relaxed text-slate-300">
              {tab === 'patient'
                ? 'Secure self-service access to your health record, medications and reports — with AI assistance at every step.'
                : 'Secure point-of-care clinical management for physicians, nursing, front-desk, laboratory and administration teams.'}
            </p>
            <ul className="mt-7 space-y-3">
              {leftBullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[12.5px] text-slate-200">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-teal-400" /> {b}
                </li>
              ))}
            </ul>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { l: 'JWT sessions', v: 'Prepared' },
                { l: 'Role scopes', v: '6 roles' },
                { l: 'Audit trail', v: 'Enabled' },
              ].map((x) => (
                <div key={x.l} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{x.l}</p>
                  <p className="mt-1 text-[13px] font-bold text-teal-300">{x.v}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="relative mt-8 text-[10.5px] leading-relaxed text-slate-500">
            Demonstration environment — synthetic patients and staff only. No real personal or medical data is stored or transmitted.
          </p>
        </div>

        {/* ---------------- right form ---------------- */}
        <div className="flex flex-1 items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-md">
            <div className="mb-5 flex items-center justify-between lg:hidden">
              <Logo />
              <Link to="/" className="btn btn-ghost btn-sm"><ArrowLeft size={13} /> Home</Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift">
              {/* tab switch */}
              <div className="flex gap-1 border-b border-slate-200 bg-slate-50 p-2">
                {([['patient', 'Patient Portal', Heart], ['staff', 'Staff Portal', Stethoscope]] as const).map(([id, label, Icon]) => (
                  <button key={id} onClick={() => { setTabRole(id); setStep('form') }}
                    className={cn('flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[12.5px] font-semibold transition-all',
                      tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {step === 'form' && (
                  <form onSubmit={submit}>
                    <h2 className="text-[18px] font-extrabold text-slate-900">
                      {mode === 'register' ? 'Create your patient account' : mode === 'forgot' ? 'Reset your password' : tab === 'patient' ? 'Patient Sign In' : 'Staff Sign In'}
                    </h2>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">
                      {mode === 'forgot'
                        ? 'Enter the email on your record and we will send a secure reset link.'
                        : mode === 'register'
                          ? 'Register to manage medications, reports and appointments securely.'
                          : tab === 'patient'
                            ? 'Enter your credentials to access your personal health record.'
                            : 'Enter your institutional credentials to access your staff portal.'}
                    </p>

                    {tab === 'staff' && mode === 'signin' && (
                      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-brand-100 bg-brand-50/70 p-3">
                        <Info size={14} className="mt-0.5 shrink-0 text-brand-600" />
                        <p className="text-[11.5px] leading-relaxed text-brand-800">
                          <strong>Institutional access policy:</strong> staff accounts are provisioned exclusively by Hospital Administrators. Self-registration is disabled — use a demo role below.
                        </p>
                      </div>
                    )}

                    <div className="mt-5 space-y-4">
                      {mode === 'register' && (
                        <>
                          <Field label="Full name" required>
                            <div className="relative">
                              <UserPlus size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                              <Input className="input-icon" placeholder="e.g. Radhika D C" value={name} onChange={(e: any) => setName(e.target.value)} required />
                            </div>
                          </Field>
                          <Field label="Mobile number" required>
                            <div className="relative">
                              <Smartphone size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                              <Input className="input-icon" placeholder="+91 99999 00001" required />
                            </div>
                          </Field>
                        </>
                      )}

                      <Field label="Email address" required>
                        <div className="relative">
                          <Mail size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input className="input-icon" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
                        </div>
                      </Field>

                      {tab === 'staff' && mode === 'signin' && (
                        <Field label="System role" required>
                          <Select value={role} onChange={(e: any) => { setRole(e.target.value); setEmail(DEMO_USERS[e.target.value as Role].email) }}>
                            {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_META[r].label} — {ROLE_META[r].portal}</option>)}
                          </Select>
                        </Field>
                      )}

                      {mode !== 'forgot' && (
                        <Field label="Password" required>
                          <div className="relative">
                            <Lock size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input className="input-icon pr-10" type={showPw ? 'text' : 'password'} defaultValue="Demo@2026" required />
                            <button type="button" onClick={() => setShowPw((s) => !s)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-brand-600 hover:underline">
                              {showPw ? 'HIDE' : 'SHOW'}
                            </button>
                          </div>
                        </Field>
                      )}

                      {mode === 'register' && (
                        <Field label="Confirm password" required>
                          <div className="relative">
                            <Lock size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input className="input-icon" type="password" defaultValue="Demo@2026" required />
                          </div>
                        </Field>
                      )}

                      <label className="flex items-start gap-2.5 text-[12px] text-slate-600">
                        <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                        <span>{mode === 'register'
                          ? 'I consent to SmartMed storing my health information for care delivery (demo).'
                          : 'Keep me signed in on this device'}</span>
                      </label>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-3">
                      {mode !== 'register' ? (
                        <button type="button" onClick={() => setMode('forgot')} className="text-[12px] font-semibold text-brand-600 hover:underline">Forgot password?</button>
                      ) : <span />}
                      {mode === 'forgot'
                        ? <button type="button" onClick={() => setMode('signin')} className="text-[12px] font-semibold text-slate-500 hover:underline">Back to sign in</button>
                        : null}
                    </div>

                    <button type="submit" className={cn('btn btn-lg mt-4 w-full', tab === 'patient' ? 'btn-teal' : 'btn-navy')}>
                      {mode === 'register' ? <><UserPlus size={15} /> Create account</> : mode === 'forgot' ? <><KeyRound size={15} /> Send reset link</> : <><Lock size={15} /> Sign in to {tab === 'patient' ? 'Patient' : 'Staff'} Portal</>}
                    </button>

                    {mode !== 'register' && (
                      <p className="mt-4 text-center text-[12px] text-slate-500">
                        New patient?{' '}
                        <button type="button" onClick={() => setMode('register')} className="font-semibold text-teal-600 hover:underline">Create a patient account</button>
                      </p>
                    )}
                  </form>
                )}

                {step === 'otp' && (
                  <div>
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-600"><Smartphone size={22} /></span>
                    <h2 className="mt-4 text-[18px] font-extrabold text-slate-900">Verify it is you</h2>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">
                      A six-digit verification code was sent to <strong className="text-slate-700">{email.replace(/^(.{2}).*(@.*)$/, '$1•••$2')}</strong>.
                      In this demo, any six digits are accepted.
                    </p>

                    <div className="mt-5 flex gap-2">
                      {otp.map((d, i) => (
                        <input key={i} value={d} maxLength={1} inputMode="numeric"
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '')
                            setOtp((o) => o.map((x, k) => (k === i ? v : x)))
                            if (v && e.target.nextSibling) (e.target.nextSibling as HTMLInputElement).focus()
                          }}
                          className="h-12 w-full rounded-lg border border-slate-300 text-center text-[17px] font-bold text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10" />
                      ))}
                    </div>

                    <button onClick={() => setOtp(['1', '2', '3', '4', '5', '6'])} className="mt-3 text-[11.5px] font-semibold text-brand-600 hover:underline">
                      Autofill demo code
                    </button>

                    <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                      <BadgeCheck size={14} className="shrink-0 text-emerald-600" />
                      <p className="text-[11.5px] leading-relaxed text-emerald-800">
                        Session will be issued as a signed JWT payload with a role scope of <strong>{ROLE_META[role].label}</strong>.
                      </p>
                    </div>

                    <div className="mt-5 flex gap-2.5">
                      <button onClick={() => setStep('form')} className="btn btn-ghost btn-lg flex-1"><ArrowLeft size={15} /> Back</button>
                      <button onClick={verify} className="btn btn-primary btn-lg flex-1">Verify &amp; continue <ArrowRight size={15} /></button>
                    </div>
                    <p className="mt-3 text-center text-[11.5px] text-slate-500">
                      Didn't get it? <button className="font-semibold text-brand-600 hover:underline">Resend code</button>
                    </p>
                  </div>
                )}

                {step === 'done' && (
                  <div className="py-8 text-center">
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Check size={26} /></span>
                    <h2 className="mt-4 text-[18px] font-extrabold text-slate-900">Authentication successful</h2>
                    <p className="mt-1.5 text-[12.5px] text-slate-500">Opening the {ROLE_META[role].portal}…</p>
                    <div className="mx-auto mt-5 h-1.5 w-40 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full w-full origin-left animate-pulse rounded-full bg-emerald-500" />
                    </div>
                  </div>
                )}

                {/* demo quick roles */}
                {step === 'form' && mode === 'signin' && (
                  <div className="mt-6 border-t border-dashed border-slate-200 pt-5">
                    <p className="mt-5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-500">Patient demo accounts — pick a profile</p>
                    <div className="mt-2.5 space-y-1.5">
                      {PATIENT_ACCOUNTS.map((acc) => (
                        <button key={acc.id} type="button"
                          onClick={() => { login('patient', acc.name, acc.email); toast(`Signed in as ${acc.name} (${acc.id}).`, 'success'); nav('/portal/patient') }}
                          className={cn('flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition hover:border-teal-300 hover:bg-teal-50/50',
                            acc.primary ? 'border-teal-300 bg-teal-50/60' : 'border-slate-200')}>
                          <span className="flex items-center gap-2">
                            <span className={cn('grid h-7 w-7 place-items-center rounded-full text-[10.5px] font-bold text-white', acc.primary ? 'bg-teal-600' : 'bg-slate-400')}>
                              {acc.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                            </span>
                            <span>
                              <span className="block text-[12px] font-bold text-slate-800">{acc.name}{acc.primary ? ' · default' : ''}</span>
                              <span className="block text-[10.5px] text-slate-500">{acc.id} · {acc.age}y {acc.gender} · {acc.note}</span>
                            </span>
                          </span>
                          <span className="text-[11px] font-bold text-teal-700">Open</span>
                        </button>
                      ))}
                    </div>

                    <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-500">Demo accounts — one-click sign in</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(['patient', 'doctor', 'nurse', 'reception', 'lab', 'admin'] as Role[]).map((r) => (
                        <button key={r} onClick={() => fillDemo(r)}
                          className={cn('rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition',
                            role === r ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700')}>
                          {ROLE_META[r].label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
                      <AlertCircle size={12} className="mt-0.5 shrink-0" />
                      Passwords are never validated in this demo build. A FastAPI + MongoDB backend with real bcrypt hashing and JWT issuance is included in the project source.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-teal-600" /> bcrypt hashing</span>
              <span className="flex items-center gap-1.5"><KeyRound size={12} className="text-brand-600" /> JWT sessions</span>
              <span className="flex items-center gap-1.5"><Building2 size={12} className="text-violet-600" /> Audit logged</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
