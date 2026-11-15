import React, { useEffect, useState } from 'react'
import { AlertTriangle, Check, Info, ShieldAlert, X } from 'lucide-react'

export const cn = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ Card */
export function Card({ className = '', children, pad = true, hover = false, ...rest }:
  React.HTMLAttributes<HTMLDivElement> & { pad?: boolean; hover?: boolean }) {
  return (
    <div className={cn('card', pad && 'card-pad', hover && 'card-hover', className)} {...rest}>{children}</div>
  )
}

export function CardHead({ icon: Icon, title, sub, right, tone = 'brand' }:
  { icon?: any; title: string; sub?: string; right?: React.ReactNode; tone?: string }) {
  const tones: any = {
    brand: 'bg-brand-50 text-brand-600 border-brand-100',
    teal: 'bg-teal-50 text-teal-600 border-teal-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
  }
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg border', tones[tone])}>
            <Icon size={17} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-slate-900 leading-tight">{title}</h3>
          {sub && <p className="text-[12.5px] text-slate-500 mt-0.5 leading-snug">{sub}</p>}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ Badge */
const BADGE: Record<string, string> = {
  blue: 'bg-brand-50 text-brand-700 border-brand-100',
  teal: 'bg-teal-50 text-teal-700 border-teal-100',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-100',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-100',
}
export function Badge({ children, tone = 'slate', className = '' }:
  { children: React.ReactNode; tone?: keyof typeof BADGE | string; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap', BADGE[tone] || BADGE.slate, className)}>{children}</span>
}

export const statusTone = (s: string) =>
  s === 'COMPLETED' || s === 'Verified' || s === 'Active' || s === 'Available' || s === 'Handed Over' ? 'green'
  : s === 'BOOKED' || s === 'Draft' ? 'blue'
  : s === 'CHECKED-IN' || s === 'Processing' || s === 'En Route' || s === 'Transporting' || s === 'On Scene' ? 'teal'
  : s === 'WAITING' || s === 'Pending' ? 'amber'
  : s === 'CANCELLED' || s === 'Stopped' ? 'red'
  : s === 'CRITICAL' ? 'red'
  : s === 'HIGH' || s === 'Urgent' ? 'amber'
  : 'slate'

/* ------------------------------------------------------------------ Image with graceful fallback */
export function Img({ src, alt, className = '', ratio }:
  { src: string; alt: string; className?: string; ratio?: string }) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  if (failed) {
    return (
      <div className={cn('grid place-items-center bg-gradient-to-br from-brand-50 via-slate-50 to-teal-50', ratio, className)}>
        <div className="text-center px-4">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl grad-brand text-white text-lg font-black">SM</div>
          <p className="mt-2 text-[11.5px] font-semibold text-slate-500">SmartMed</p>
        </div>
      </div>
    )
  }
  return (
    <div className={cn('relative overflow-hidden bg-slate-100', ratio, className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100" />}
      <img
        src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} onLoad={() => setLoaded(true)}
        className={cn('h-full w-full object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0')}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ Buttons */
export function Btn({ as = 'button', variant = 'primary', size = 'md', className = '', children, ...rest }:
  any) {
  const map: any = {
    primary: 'btn-primary', teal: 'btn-teal', ghost: 'btn-ghost', soft: 'btn-soft', 'teal-soft': 'btn-teal-soft',
    amber: 'btn-amber', 'amber-soft': 'btn-amber-soft', danger: 'btn-danger', 'danger-soft': 'btn-danger-soft',
    navy: 'btn-navy', green: 'btn-green',
  }
  const sizeMap: any = { sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg' }
  const Tag: any = as
  return <Tag className={cn('btn', map[variant] || map.primary, sizeMap[size], className)} {...rest}>{children}</Tag>
}

/* ------------------------------------------------------------------ Stat card */
export function Stat({ label, value, sub, icon: Icon, tone = 'brand', trend }:
  { label: string; value: React.ReactNode; sub?: string; icon?: any; tone?: string; trend?: string }) {
  const ring: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600', teal: 'bg-teal-50 text-teal-600', green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600', purple: 'bg-violet-50 text-violet-600', red: 'bg-rose-50 text-rose-600',
    cyan: 'bg-cyan-50 text-cyan-600', slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card transition-all hover:shadow-lift hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-500 leading-tight">{label}</p>
        {Icon && <span className={cn('grid h-8 w-8 place-items-center rounded-lg', ring[tone] || ring.brand)}><Icon size={15} /></span>}
      </div>
      <p className="mt-2 text-[26px] font-extrabold text-slate-900 leading-none tabular-nums">{value}</p>
      {sub && <p className="mt-1.5 text-[11.5px] text-slate-500 leading-snug">{sub}</p>}
      {trend && <p className="mt-1 text-[11px] font-semibold text-emerald-600">{trend}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ Form fields */
export function Field({ label, hint, required, children, className = '' }:
  { label: string; hint?: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="label">{label}{required && <span className="req">*</span>}</label>
      {children}
      {hint && <p className="mt-1.5 text-[11.5px] text-slate-500">{hint}</p>}
    </div>
  )
}
export const Input = (p: any) => <input {...p} className={cn('input', p.className)} />
export const Textarea = (p: any) => <textarea {...p} className={cn('input', p.className)} />
export function Select({ children, ...p }: any) {
  return <select {...p} className={cn('input appearance-none bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%2364748b" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>\')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10', p.className)}>{children}</select>
}

/* ------------------------------------------------------------------ Search input */
export function Search({ placeholder, value, onChange }:
  { placeholder: string; value?: string; onChange?: (v: string) => void }) {
  return (
    <div className="relative w-full">
      <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
      <input className="input input-icon" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

/* ------------------------------------------------------------------ Tabs */
export function Tabs({ tabs, value, onChange, size = 'md' }:
  { tabs: { id: string; label: string; count?: number }[]; value: string; onChange: (v: string) => void; size?: 'sm' | 'md' }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-card">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg font-semibold transition-all',
            size === 'sm' ? 'px-3 py-1.5 text-[12px]' : 'px-3.5 py-2 text-[13px]',
            value === t.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100')}>
          {t.label}
          {t.count !== undefined && (
            <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', value === t.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600')}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ Health-score ring */
export function Ring({ value, size = 168, stroke = 14, label = 'Health Score', caption }:
  { value: number; size?: number; stroke?: number; label?: string; caption?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  const color = pct >= 80 ? '#059669' : pct >= 60 ? '#0d9488' : pct >= 40 ? '#f59e0b' : '#e11d48'
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          className="ring-anim" strokeDasharray={`${(pct / 100) * c} ${c}`} />
      </svg>
      <div className="absolute text-center">
        <p className="text-[34px] font-extrabold leading-none text-slate-900 tabular-nums">{pct}</p>
        <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-500 mt-1">{label}</p>
        {caption && <p className="text-[11px] text-slate-500 mt-0.5">{caption}</p>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Progress bar */
export function Bar({ value, tone = 'brand', showPct = true, height = 8 }:
  { value: number; tone?: string; showPct?: boolean; height?: number }) {
  const map: Record<string, string> = {
    brand: 'bg-brand-600', teal: 'bg-teal-600', green: 'bg-emerald-600',
    amber: 'bg-amber-500', red: 'bg-rose-500', purple: 'bg-violet-600',
  }
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 rounded-full bg-slate-200/80 overflow-hidden" style={{ height }}>
        <div className={cn('h-full rounded-full transition-all duration-700', map[tone] || map.brand)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      {showPct && <span className="w-10 shrink-0 text-right text-[12px] font-bold tabular-nums text-slate-700">{Math.round(value)}%</span>}
    </div>
  )
}

/* ------------------------------------------------------------------ Modal */
export function Modal({ open, onClose, title, sub, children, wide = false }:
  { open: boolean; onClose: () => void; title: string; sub?: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    if (open) window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-900/55 p-4 backdrop-blur-sm anim-in" onClick={onClose}>
      <div className={cn('my-6 w-full rounded-2xl bg-white shadow-2xl anim-up', wide ? 'max-w-4xl' : 'max-w-lg')} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 rounded-t-2xl grad-brand px-6 py-4">
          <div>
            <h3 className="text-[16px] font-bold text-white">{title}</h3>
            {sub && <p className="text-[12.5px] text-white/85 mt-0.5">{sub}</p>}
          </div>
          <button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/15 text-white transition hover:bg-white/25" aria-label="Close"><X size={16} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Toasts */
export function Toaster({ toasts, dismiss }: { toasts: { id: number; text: string; tone: string }[]; dismiss: (id: number) => void }) {
  const tones: any = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-rose-200 bg-rose-50 text-rose-800',
    info: 'border-brand-200 bg-brand-50 text-brand-800',
  }
  const icons: any = { success: Check, error: AlertTriangle, info: Info }
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(92vw,380px)] flex-col gap-2.5">
      {toasts.map((t) => {
        const I = icons[t.tone] || Info
        return (
          <div key={t.id} className={cn('pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lift anim-up', tones[t.tone])}>
            <I size={16} className="mt-0.5 shrink-0" />
            <p className="flex-1 text-[13px] font-medium leading-snug">{t.text}</p>
            <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100"><X size={14} /></button>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ Disclaimers */
export function AiDisclaimer({ text, className = '' }: { text?: string; className?: string }) {
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3', className)}>
      <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
      <p className="text-[12px] font-medium leading-relaxed text-amber-900">
        {text || 'AI-generated information is for assistance only and does not replace professional medical advice. Always confirm with a qualified clinician before changing any medication or treatment.'}
      </p>
    </div>
  )
}

export function TriageDisclaimer() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3">
      <ShieldAlert size={16} className="mt-0.5 shrink-0 text-rose-600" />
      <p className="text-[12px] font-medium leading-relaxed text-rose-900">
        This is AI-assisted triage for demonstration only. It is <strong>not a medical diagnosis</strong> and cannot confirm or rule out any condition. In a real emergency, call your local emergency number immediately.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ Empty state */
export function Empty({ title, sub, icon: Icon }:{ title: string; sub?: string; icon?: any }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
      {Icon && <Icon size={26} className="text-emerald-500" />}
      <p className="mt-3 text-[13.5px] font-semibold text-slate-700">{title}</p>
      {sub && <p className="mt-1 text-[12px] text-slate-500 max-w-sm">{sub}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ Section heading */
export function SectionHead({ eyebrow, title, sub, center = false, className = '' }:
  { eyebrow?: string; title: React.ReactNode; sub?: string; center?: boolean; className?: string }) {
  return (
    <div className={cn(center && 'text-center mx-auto max-w-3xl', className)}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="h-sec mt-2">{title}</h2>
      {sub && <p className={cn('mt-3.5 text-[15px] leading-relaxed text-slate-600', center && 'mx-auto max-w-2xl')}>{sub}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ Feature tile */
export function Feature({ icon: Icon, title, desc, tone = 'brand', className = '' }:
  { icon: any; title: string; desc: string; tone?: string; className?: string }) {
  const tones: any = {
    brand: 'bg-brand-50 text-brand-600 border-brand-100', teal: 'bg-teal-50 text-teal-600 border-teal-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100', rose: 'bg-rose-50 text-rose-600 border-rose-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100', green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100', slate: 'bg-slate-100 text-slate-600 border-slate-200',
  }
  return (
    <div className={cn('card card-pad card-hover', className)}>
      <span className={cn('grid h-11 w-11 place-items-center rounded-xl border', tones[tone])}><Icon size={20} /></span>
      <h3 className="mt-3.5 text-[14.5px] font-bold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-600">{desc}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ Data table */
export function Table({ head, children, className = '' }: { head: string[]; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-slate-200', className)}>
      <table className="tbl">
        <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ Key/value rows */
export function KV({ items, cols = 2 }: { items: { k: string; v: React.ReactNode }[]; cols?: number }) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-3.5', cols === 2 ? 'sm:grid-cols-2' : cols === 3 ? 'sm:grid-cols-3' : '')}>
      {items.map((i) => (
        <div key={i.k}>
          <dt className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-slate-500">{i.k}</dt>
          <dd className="mt-1 text-[13.5px] font-medium text-slate-800 break-words">{i.v}</dd>
        </div>
      ))}
    </dl>
  )
}
