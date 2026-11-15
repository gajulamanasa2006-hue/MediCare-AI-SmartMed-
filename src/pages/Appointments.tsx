import React, { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertCircle, Ambulance, ArrowRight, BadgeCheck, Building2, CalendarDays, Check, CheckCircle2,
  ClipboardCheck, Clock, CreditCard, FileText, Info, Printer, Stethoscope, Ticket, User, Video, X,
} from 'lucide-react'
import { PageHero } from '../components/PublicShell'
import { AiDisclaimer, Badge, Btn, Empty, Field, Img, Input, SectionHead, Select, Table, Textarea, cn } from '../components/ui'
import { DEPARTMENTS, DOCTORS, IMG, PATIENT } from '../data/mock'
import { useApp } from '../context/AppContext'

const TIMES = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM']

export default function Appointments() {
  const [params] = useSearchParams()
  const { appts, addAppt, pushNotif, toast } = useApp()

  const presetDoctor = params.get('doctor') || ''
  const presetType = params.get('type') || ''

  const [step, setStep] = useState(1)
  const [dept, setDept] = useState(presetDoctor ? (DOCTORS.find((d) => d.name === presetDoctor)?.dept || '') : '')
  const [doctor, setDoctor] = useState(presetDoctor)
  const [date, setDate] = useState('2026-10-06')
  const [time, setTime] = useState(params.get('time') || '')
  const [type, setType] = useState(presetType || 'In-Person')
  const [reason, setReason] = useState('')
  const [name, setName] = useState(PATIENT.name)
  const [mobile, setMobile] = useState(PATIENT.mobile)
  const [email, setEmail] = useState(PATIENT.email)
  const [confirmed, setConfirmed] = useState<any>(null)

  const deptDoctors = useMemo(() => DOCTORS.filter((d) => !dept || d.dept === dept), [dept])
  const chosen = DOCTORS.find((d) => d.name === doctor)
  const takenSlots = appts.filter((a) => a.doctor === doctor && a.date.includes(date.split('-')[2].replace(/^0/, ''))).map((a) => a.time)

  const nextDays = useMemo(() => {
    const out: { iso: string; label: string; dow: string; n: number }[] = []
    for (let i = 0; i < 12; i++) {
      const d = new Date(2026, 9, 4 + i)
      out.push({
        iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        dow: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        n: d.getDate(),
      })
    }
    return out
  }, [])

  const fee = type === 'Video Consultation' ? Math.round((chosen?.fee || 700) * 0.8) : type === 'Emergency' ? 600 : (chosen?.fee || 700)

  const submit = () => {
    if (!dept || !doctor || !time || !reason.trim()) {
      toast('Please complete the department, doctor, time slot and reason for visit.', 'error')
      return
    }
    const id = 'APT-2026-' + String(100000 + appts.length + 1).slice(1)
    const rec = {
      id, patient: name, patientId: PATIENT.id, doctor, doctorId: chosen?.id || 'DOC-103',
      dept, date: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time, type: type as any, reason, status: (type === 'Emergency' ? 'CHECKED-IN' : 'BOOKED') as any,
      priority: (type === 'Emergency' ? 'Critical' : 'Routine') as any,
      token: 'T-' + String(10 + appts.length).padStart(2, '0'), fee,
    }
    addAppt(rec)
    pushNotif({ cat: 'Appointment', title: 'Appointment confirmed', body: `${doctor} · ${dept} · ${rec.date} ${time} · Token ${rec.token}`, tone: 'blue' })
    setConfirmed(rec)
    setStep(5)
    toast('Appointment booked successfully. Confirmation sent.', 'success')
  }

  const steps = ['Department & doctor', 'Date & time', 'Appointment type', 'Patient details', 'Confirmation']

  return (
    <>
      <PageHero
        eyebrow="Appointments"
        title={<>Book care in <span className="text-teal-600">under a minute</span></>}
        sub="Choose a department and specialist, pick a slot that suits you, and receive a token for the live queue. In-person, video and emergency pathways are all supported."
      />

      {/* stepper */}
      <section className="border-b border-slate-200 bg-white py-5">
        <div className="container-x flex flex-wrap items-center gap-2">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <button onClick={() => i + 1 < step && setStep(i + 1)}
                className={cn('flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition',
                  step === i + 1 ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                    : step > i + 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                <span className={cn('grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold',
                  step === i + 1 ? 'bg-brand-600 text-white' : step > i + 1 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-white')}>
                  {step > i + 1 ? <Check size={11} /> : i + 1}
                </span>
                {s}
              </button>
              {i < steps.length - 1 && <span className="hidden h-px w-5 bg-slate-200 sm:block" />}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="container-x py-12">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* ---------------- form column ---------------- */}
          <div>
            {step === 1 && (
              <div className="card p-6">
                <h2 className="text-[16px] font-bold text-slate-900">Step 1 · Select department and doctor</h2>
                <p className="mt-1.5 text-[12.5px] text-slate-500">Not sure which department? The AI Symptom Assistant can recommend one.</p>

                <div className="mt-6">
                  <p className="text-[12.5px] font-bold text-slate-900">Department <span className="text-rose-500">*</span></p>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {DEPARTMENTS.map((d) => (
                      <button key={d.code} onClick={() => { setDept(d.name); setDoctor('') }}
                        className={cn('rounded-xl border p-3.5 text-left transition-all',
                          dept === d.name ? 'border-brand-400 bg-brand-50 ring-4 ring-brand-500/10' : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50')}>
                        <div className="flex items-center justify-between">
                          <span className="text-[12.5px] font-bold text-slate-900">{d.name}</span>
                          <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{d.code}</span>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-snug text-slate-500">{d.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {dept && (
                  <div className="mt-7 anim-up">
                    <p className="text-[12.5px] font-bold text-slate-900">Available doctors in {dept}</p>
                    <div className="mt-3 space-y-2.5">
                      {deptDoctors.length === 0 && <Empty title="No doctor listed for this department" sub="Choose General Medicine or Emergency & Trauma." icon={Stethoscope} />}
                      {deptDoctors.map((d) => (
                        <button key={d.id} onClick={() => setDoctor(d.name)}
                          className={cn('flex w-full flex-wrap items-center gap-4 rounded-xl border p-3.5 text-left transition-all',
                            doctor === d.name ? 'border-brand-400 bg-brand-50 ring-4 ring-brand-500/10' : 'border-slate-200 hover:border-brand-300')}>
                          <Img src={d.img} alt={d.name} className="h-12 w-12 shrink-0 rounded-lg" ratio="1/1" />
                          <div className="min-w-[150px] flex-1">
                            <p className="text-[13px] font-bold text-slate-900">{d.name}</p>
                            <p className="text-[11.5px] text-slate-500">{d.role} · {d.exp}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[12.5px] font-bold text-slate-900">₹{d.fee}</p>
                            <p className="text-[11px] text-slate-500">{d.days}</p>
                          </div>
                          {doctor === d.name && <CheckCircle2 size={17} className="text-brand-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-7 flex justify-between">
                  <Link to="/doctors" className="btn btn-ghost">Browse all specialists</Link>
                  <button disabled={!dept || !doctor} onClick={() => setStep(2)} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40">
                    Continue <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="card p-6">
                <h2 className="text-[16px] font-bold text-slate-900">Step 2 · Choose a date and time</h2>
                <p className="mt-1.5 text-[12.5px] text-slate-500">
                  {doctor} · {dept} · consulting days {chosen?.days}
                </p>

                <p className="mt-6 text-[12.5px] font-bold text-slate-900">Select date</p>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                  {nextDays.map((d) => (
                    <button key={d.iso} onClick={() => { setDate(d.iso); setTime('') }}
                      className={cn('shrink-0 rounded-xl border px-3.5 py-2.5 text-center transition-all',
                        date === d.iso ? 'border-brand-400 bg-brand-50 ring-4 ring-brand-500/10' : 'border-slate-200 hover:border-brand-300')}>
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">{d.dow}</p>
                      <p className="mt-0.5 text-[15px] font-extrabold text-slate-900">{d.n}</p>
                      <p className="text-[10px] text-slate-500">{d.label.split(' ')[1]}</p>
                    </button>
                  ))}
                </div>

                <p className="mt-6 text-[12.5px] font-bold text-slate-900">Available slots</p>
                <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                  {TIMES.map((t) => {
                    const isTaken = takenSlots.includes(t) || (chosen?.slots ? !chosen.slots.includes(t) : false)
                    return (
                      <button key={t} disabled={isTaken} onClick={() => setTime(t)}
                        className={cn('rounded-lg border px-2 py-2.5 text-[11.5px] font-semibold transition',
                          isTaken ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through'
                            : time === t ? 'border-brand-400 bg-brand-600 text-white' : 'border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-brand-50')}>
                        {t}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-3 flex items-center gap-2 text-[11.5px] text-slate-500">
                  <Info size={12} /> Times shown in IST. Slots already booked by other patients are struck through.
                </p>

                <div className="mt-7 flex justify-between">
                  <button onClick={() => setStep(1)} className="btn btn-ghost">Back</button>
                  <button disabled={!time} onClick={() => setStep(3)} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40">
                    Continue <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="card p-6">
                <h2 className="text-[16px] font-bold text-slate-900">Step 3 · Appointment type and reason</h2>
                <p className="mt-1.5 text-[12.5px] text-slate-500">Emergency bookings skip the queue and go straight to triage.</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { id: 'In-Person', d: 'Physical visit at the hospital', i: Building2, note: `₹${chosen?.fee || 700}` },
                    { id: 'Video Consultation', d: 'Secure video call from home', i: Video, note: `₹${Math.round((chosen?.fee || 700) * 0.8)} · 20% off` },
                    { id: 'Emergency', d: 'Immediate triage, walk-in', i: Ambulance, note: '₹600 flat' },
                  ].map((t) => (
                    <button key={t.id} onClick={() => setType(t.id)}
                      className={cn('rounded-xl border p-4 text-left transition-all',
                        type === t.id ? 'border-brand-400 bg-brand-50 ring-4 ring-brand-500/10' : 'border-slate-200 hover:border-brand-300')}>
                      <span className={cn('grid h-9 w-9 place-items-center rounded-lg', type === t.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600')}>
                        <t.i size={17} />
                      </span>
                      <p className="mt-3 text-[13px] font-bold text-slate-900">{t.id}</p>
                      <p className="mt-1 text-[11.5px] text-slate-500">{t.d}</p>
                      <p className="mt-2 text-[11.5px] font-bold text-brand-700">{t.note}</p>
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  <Field label="Reason for visit" required hint="Describe your symptoms or the purpose of the consultation in your own words.">
                    <Textarea rows={4} value={reason} onChange={(e: any) => setReason(e.target.value)}
                      placeholder="e.g. Persistent fever for two days with body ache and reduced appetite. Currently taking Dolo 650 twice daily." />
                  </Field>
                </div>

                {type === 'Video Consultation' && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50/70 p-4 anim-up">
                    <Video size={15} className="mt-0.5 shrink-0 text-teal-700" />
                    <p className="text-[12px] leading-relaxed text-teal-900">
                      A secure consultation link will be available on the appointment card 15 minutes before the slot. Please
                      join from a quiet space with a stable connection, and keep your medication list open.
                    </p>
                  </div>
                )}

                {type === 'Emergency' && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/70 p-4 anim-up">
                    <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-700" />
                    <p className="text-[12px] leading-relaxed text-rose-900">
                      <strong>If this is a life-threatening situation, do not wait for a booking.</strong> Use the emergency
                      assistance line so an ambulance and resuscitation bay can be allocated immediately.
                    </p>
                  </div>
                )}

                <div className="mt-7 flex justify-between">
                  <button onClick={() => setStep(2)} className="btn btn-ghost">Back</button>
                  <button disabled={!reason.trim()} onClick={() => setStep(4)} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40">
                    Continue <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="card p-6">
                <h2 className="text-[16px] font-bold text-slate-900">Step 4 · Patient details</h2>
                <p className="mt-1.5 text-[12.5px] text-slate-500">Details are pre-filled from your registered record. Edit if booking for a dependent.</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" required>
                    <Input value={name} onChange={(e: any) => setName(e.target.value)} />
                  </Field>
                  <Field label="Mobile number" required>
                    <Input value={mobile} onChange={(e: any) => setMobile(e.target.value)} />
                  </Field>
                  <Field label="Email address" required>
                    <Input type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
                  </Field>
                  <Field label="Patient ID">
                    <Input value={PATIENT.id} readOnly className="bg-slate-50 text-slate-500" />
                  </Field>
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[12px] font-bold text-slate-800">Declared allergies on record</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PATIENT.allergies.map((a) => (
                      <Badge key={a.name} tone={a.severity === 'Severe' ? 'red' : 'amber'}>{a.name} · {a.severity}</Badge>
                    ))}
                  </div>
                  <p className="mt-2.5 text-[11.5px] leading-relaxed text-slate-500">
                    Allergies are automatically shown to the consulting doctor and checked when a prescription is generated.
                  </p>
                </div>

                <label className="mt-5 flex items-start gap-2.5 text-[12px] leading-relaxed text-slate-600">
                  <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600" />
                  <span>I confirm the information above is accurate and consent to being contacted about this appointment.</span>
                </label>

                <div className="mt-7 flex justify-between">
                  <button onClick={() => setStep(3)} className="btn btn-ghost">Back</button>
                  <button onClick={submit} className="btn btn-primary btn-lg"><CalendarDays size={15} /> Confirm appointment</button>
                </div>
              </div>
            )}

            {step === 5 && confirmed && (
              <div className="card overflow-hidden anim-up">
                <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-white"><Check size={20} /></span>
                    <div>
                      <h2 className="text-[16px] font-bold text-emerald-900">Appointment confirmed</h2>
                      <p className="text-[12px] text-emerald-700">A confirmation has been added to your notifications.</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-700">SmartMed · Appointment token</p>
                        <p className="mt-2 text-[24px] font-extrabold leading-none text-slate-900">{confirmed.token}</p>
                        <p className="mt-1.5 text-[12px] text-slate-600">{confirmed.id}</p>
                      </div>
                      <span className="rounded-lg bg-white px-3 py-2 text-[11.5px] font-bold text-brand-700 shadow-sm">{confirmed.type}</span>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {[
                        { k: 'Patient', v: confirmed.patient },
                        { k: 'Doctor', v: `${confirmed.doctor}` },
                        { k: 'Department', v: confirmed.dept },
                        { k: 'Date & time', v: `${confirmed.date} · ${confirmed.time}` },
                        { k: 'Priority', v: confirmed.priority },
                        { k: 'Consultation fee', v: `₹${confirmed.fee}` },
                      ].map((x) => (
                        <div key={x.k}>
                          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{x.k}</p>
                          <p className="mt-0.5 text-[12.5px] font-semibold text-slate-800">{x.v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 border-t border-dashed border-brand-200 pt-3.5">
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Reason for visit</p>
                      <p className="mt-0.5 text-[12.5px] text-slate-700">{confirmed.reason}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <button onClick={() => window.print()} className="btn btn-ghost"><Printer size={14} /> Print slip</button>
                    <Link to="/portal/patient" className="btn btn-teal">Track in patient portal <ArrowRight size={14} /></Link>
                    <button onClick={() => { setStep(1); setConfirmed(null); setReason(''); setTime('') }} className="btn btn-primary">Book another</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ---------------- summary column ---------------- */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="card p-5">
              <h3 className="text-[13.5px] font-bold text-slate-900">Booking summary</h3>
              <div className="mt-4 space-y-3">
                {[
                  { i: Building2, k: 'Department', v: dept || 'Not selected' },
                  { i: Stethoscope, k: 'Doctor', v: doctor || 'Not selected' },
                  { i: CalendarDays, k: 'Date', v: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
                  { i: Clock, k: 'Time', v: time || 'Not selected' },
                  { i: Video, k: 'Type', v: type },
                ].map((x) => (
                  <div key={x.k} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><x.i size={14} /></span>
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{x.k}</p>
                      <p className="truncate text-[12.5px] font-semibold text-slate-800">{x.v}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-[12.5px] font-semibold text-slate-600">Estimated fee</span>
                <span className="text-[18px] font-extrabold text-slate-900">₹{fee}</span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                Payable at the hospital or via the patient portal. Insurance policies on record are applied during billing.
              </p>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600"><Ticket size={15} /></span>
                <h3 className="text-[13.5px] font-bold text-slate-900">How the queue works</h3>
              </div>
              <ol className="mt-3.5 space-y-2.5">
                {[
                  'You receive a token (for example T-11) when the booking is confirmed.',
                  'Check in at the front desk or self-service kiosk on arrival.',
                  'Your token appears in the live queue with an estimated wait.',
                  'Emergency cases are triaged ahead of routine appointments.',
                ].map((s, i) => (
                  <li key={s} className="flex items-start gap-2.5 text-[12px] leading-relaxed text-slate-600">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>

            <div className="relative overflow-hidden rounded-2xl">
              <Img src={IMG.clinic} alt="Consultation room" className="h-44 w-full" ratio="16/9" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
              <div className="absolute bottom-0 p-4">
                <p className="text-[12.5px] font-bold text-white">Need help choosing?</p>
                <p className="mt-1 text-[11.5px] text-slate-300">Describe your symptoms and the AI assistant will point you to the right department.</p>
                <Link to="/ai-tools" className="mt-2.5 inline-flex items-center gap-1.5 text-[11.5px] font-bold text-teal-300">
                  Open symptom assistant <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            <AiDisclaimer />
          </aside>
        </div>

        {/* my appointments */}
        <div className="mt-14">
          <SectionHead eyebrow="Your bookings" title="Appointments on record" sub="Statuses update live as you check in and consultations are completed." />
          <div className="mt-7 card overflow-hidden" style={{ padding: 0 }}>
            <div className="overflow-x-auto">
              <Table head={['Appointment ID', 'Patient', 'Doctor / Department', 'Date & time', 'Type', 'Token', 'Status', 'Fee']}>
                {appts.slice(0, 8).map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3.5 text-[12px] font-semibold text-slate-800">{a.id}</td>
                    <td className="px-4 py-3.5 text-[12px] text-slate-600">{a.patient}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-[12px] font-semibold text-slate-800">{a.doctor}</p>
                      <p className="text-[11px] text-slate-500">{a.dept}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[12px] text-slate-700">{a.date}</p>
                      <p className="text-[11px] text-slate-500">{a.time}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-slate-600">{a.type}</td>
                    <td className="px-4 py-3.5"><span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">{a.token}</span></td>
                    <td className="px-4 py-3.5">
                      <Badge tone={a.status === 'COMPLETED' ? 'green' : a.status === 'CANCELLED' ? 'red' : a.status === 'WAITING' ? 'amber' : a.status === 'CHECKED-IN' ? 'teal' : 'blue'}>{a.status}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] font-semibold text-slate-800">₹{a.fee}</td>
                  </tr>
                ))}
              </Table>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link to="/portal/patient" className="btn btn-ghost btn-sm">Manage in patient portal</Link>
            <Link to="/portal/reception" className="btn btn-ghost btn-sm">Front-desk view</Link>
            <span className="text-[11.5px] text-slate-500">{appts.length} records shown · demo data</span>
          </div>
        </div>
      </section>
    </>
  )
}
