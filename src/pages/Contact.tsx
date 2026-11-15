import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, Ambulance, ArrowRight, Building2, Clock, Headphones, Mail, MapPin, MessageSquare,
  Navigation, Phone, Send, ShieldCheck, Sparkles, Stethoscope, User, CheckCircle2, Globe, Users,
} from 'lucide-react'
import { PageHero } from '../components/PublicShell'
import { AiDisclaimer, Badge, Btn, Field, Img, Input, SectionHead, Select, Textarea, cn } from '../components/ui'
import { DEPARTMENTS, IMG } from '../data/mock'
import { useApp } from '../context/AppContext'

const FAQ = [
  { q: 'Is SmartMed a real hospital or a demo?', a: 'This site is a working demonstration build. Every patient, clinician, appointment and report is synthetic data created to show how the platform behaves. No real personal or medical information is stored.' },
  { q: 'Can the AI tell me what medicine to take?', a: 'No. The AI tools screen medications for interactions, duplicates and allergy conflicts and explain information in plain language — valuable, but not a prescription. Only a licensed clinician can decide your treatment.' },
  { q: 'How do I get a patient portal account?', a: 'In a real deployment, the front desk creates your record during registration and sends an activation link to your registered email. You then set your own password — staff never see it.' },
  { q: 'Who can see my medical record?', a: 'Access is role-scoped with signed sessions: your doctor sees clinical data, the laboratory sees test requests, and reception sees administrative details only. Every view is written to an audit log.' },
  { q: 'What happens if I report symptoms in an emergency?', a: 'The emergency module triages a priority level, dispatches the nearest appropriate ambulance and alerts the receiving department. In any real emergency you should also contact your local emergency number directly.' },
  { q: 'Do you support video consultations?', a: 'Yes. Video consultations can be booked for most departments, are typically charged at a reduced rate, and follow-up within seven days is included.' },
]

export default function Contact() {
  const { toast, pushNotif } = useApp()
  const [form, setForm] = useState({ name: '', email: '', phone: '', dept: 'General enquiry', message: '' })
  const [sent, setSent] = useState(false)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast('Name, email and message are all required.', 'error'); return
    }
    setSent(true)
    pushNotif({ cat: 'Message', title: 'Your enquiry has been received', body: `Reference CN-${Date.now().toString().slice(-6)} — our team will respond within one working day.`, tone: 'purple' })
    toast('Thank you — your message has been logged. Reference sent to your notifications.', 'success')
  }

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={<>Talk to the team behind <span className="text-teal-600">SmartMed</span></>}
        sub="Questions about the platform, a partnership, or a demo for your institution? Send a message, call the desk, or walk into the campus — we answer during working hours and around the clock for emergencies."
      >
        <div className="flex flex-wrap gap-3">
          <a href="#form" className="btn btn-primary btn-lg"><MessageSquare size={15} /> Send a message</a>
          <a href="tel:+911800123456" className="btn btn-ghost btn-lg"><Phone size={15} /> 1800 123 456 (demo)</a>
        </div>
      </PageHero>

      {/* contact cards */}
      <section className="border-b border-slate-200 bg-white py-14">
        <div className="container-x grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: MapPin, t: 'Campus address', l1: 'SmartMed Hospital', l2: '24 Lakeview Avenue, Bengaluru, Karnataka 560037', tone: 'bg-brand-50 text-brand-600' },
            { i: Phone, t: 'Reception & appointments', l1: '+91 1800 123 456', l2: 'Mon–Sat, 8:00 AM – 8:00 PM IST', tone: 'bg-teal-50 text-teal-600' },
            { i: Mail, t: 'Email', l1: 'hello@smartmed.health', l2: 'Response within one working day', tone: 'bg-violet-50 text-violet-600' },
            { i: Ambulance, t: 'Emergency (24 hours)', l1: '+91 1800 123 457', l2: 'Ambulance control & trauma desk', tone: 'bg-rose-50 text-rose-600' },
          ].map((x) => (
            <div key={x.t} className="card card-hover p-5">
              <span className={cn('grid h-11 w-11 place-items-center rounded-xl', x.tone)}><x.i size={19} /></span>
              <h3 className="mt-4 text-[13.5px] font-bold text-slate-900">{x.t}</h3>
              <p className="mt-2 text-[12.5px] font-semibold text-slate-800">{x.l1}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">{x.l2}</p>
            </div>
          ))}
        </div>
      </section>

      {/* working hours + form */}
      <section id="form" className="container-x py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            <div className="card p-6">
              <div className="flex items-center gap-2.5"><Clock size={16} className="text-brand-600" /><h3 className="text-[14px] font-bold text-slate-900">Working hours</h3></div>
              <div className="mt-4 space-y-2.5">
                {[
                  { d: 'Out-patient department', h: 'Mon–Sat · 8:00 AM – 8:00 PM' },
                  { d: 'Sunday & public holidays', h: 'Emergency & urgent care only' },
                  { d: 'Emergency & trauma', h: 'Open 24 hours, every day' },
                  { d: 'Laboratory & diagnostics', h: 'Mon–Sat · 7:00 AM – 9:00 PM' },
                  { d: 'In-house pharmacy', h: 'Open 24 hours' },
                  { d: 'Video consultations', h: 'Daily · 9:00 AM – 9:00 PM' },
                ].map((x) => (
                  <div key={x.d} className="flex items-center justify-between border-b border-slate-100 pb-2.5 last:border-0">
                    <span className="text-[12.5px] text-slate-700">{x.d}</span>
                    <span className="text-[12px] font-bold text-slate-900">{x.h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-2.5"><Headphones size={16} className="text-teal-600" /><h3 className="text-[14px] font-bold text-slate-900">Who to contact</h3></div>
              <div className="mt-4 space-y-2.5">
                {[
                  { t: 'Appointments & rescheduling', d: 'appointments@smartmed.health', to: '/appointments' },
                  { t: 'Patient records & reports', d: 'records@smartmed.health', to: '/portal/patient' },
                  { t: 'Billing & insurance', d: 'billing@smartmed.health', to: '/portal/admin' },
                  { t: 'Careers & partnerships', d: 'partners@smartmed.health', to: '/about' },
                  { t: 'Technical support', d: 'support@smartmed.health', to: '/services' },
                ].map((x) => (
                  <Link key={x.t} to={x.to} className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3 transition hover:border-brand-300 hover:bg-brand-50/40">
                    <div>
                      <p className="text-[12.5px] font-bold text-slate-900">{x.t}</p>
                      <p className="text-[11.5px] text-slate-500">{x.d}</p>
                    </div>
                    <ArrowRight size={14} className="text-brand-600" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl">
              <Img src={IMG.hospital} alt="SmartMed campus" className="h-52 w-full" ratio="16/9" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/92 to-transparent" />
              <div className="absolute bottom-0 p-5">
                <p className="text-[13.5px] font-bold text-white">SmartMed — Main Campus</p>
                <p className="mt-1 text-[11.5px] text-slate-300">24 Lakeview Avenue, Bengaluru 560037 · Metro: Lakeview (400 m)</p>
                <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer" className="mt-2.5 inline-flex items-center gap-1.5 text-[11.5px] font-bold text-teal-300">
                  <Navigation size={12} /> Open directions
                </a>
              </div>
            </div>
          </div>

          {/* form */}
          <div>
            {sent ? (
              <div className="card p-8 text-center anim-up">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={30} /></span>
                <h2 className="mt-5 text-[20px] font-extrabold text-slate-900">Message received</h2>
                <p className="mx-auto mt-2.5 max-w-md text-[13px] leading-relaxed text-slate-600">
                  Thank you, {form.name.split(' ')[0]}. Your enquiry has been logged and a reference has been added to your
                  notifications. In a live deployment this would create a support ticket routed to the relevant department.
                </p>
                <div className="mx-auto mt-5 max-w-sm rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 p-4">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-brand-700">Reference number</p>
                  <p className="mt-1 text-[20px] font-extrabold text-slate-900">CN-{Date.now().toString().slice(-6)}</p>
                  <p className="mt-1.5 text-[11.5px] text-slate-600">Expected response: within one working day</p>
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                  <button onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', dept: 'General enquiry', message: '' }) }} className="btn btn-primary">Send another message</button>
                  <Link to="/appointments" className="btn btn-ghost">Book an appointment</Link>
                </div>
              </div>
            ) : (
              <div className="card p-6">
                <h2 className="text-[16px] font-extrabold text-slate-900">Send us a message</h2>
                <p className="mt-1.5 text-[12.5px] text-slate-500">Tell us what you need. For clinical questions about your own treatment, please book a consultation instead.</p>

                <form onSubmit={submit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" required>
                      <div className="relative">
                        <User size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input className="input-icon" value={form.name} onChange={(e: any) => set('name', e.target.value)} placeholder="Your name" required />
                      </div>
                    </Field>
                    <Field label="Email address" required>
                      <div className="relative">
                        <Mail size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input className="input-icon" type="email" value={form.email} onChange={(e: any) => set('email', e.target.value)} placeholder="you@example.com" required />
                      </div>
                    </Field>
                    <Field label="Phone number">
                      <div className="relative">
                        <Phone size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input className="input-icon" value={form.phone} onChange={(e: any) => set('phone', e.target.value)} placeholder="+91 99999 00001" />
                      </div>
                    </Field>
                    <Field label="Department">
                      <Select value={form.dept} onChange={(e: any) => set('dept', e.target.value)}>
                        {['General enquiry', 'Appointments', 'Billing & insurance', 'Medical records', 'Laboratory', 'Careers & partnerships', 'Technical support'].map((d) => <option key={d}>{d}</option>)}
                      </Select>
                    </Field>
                  </div>

                  <Field label="Message" required hint="Please do not include sensitive medical details in this form.">
                    <Textarea rows={6} value={form.message} onChange={(e: any) => set('message', e.target.value)}
                      placeholder="How can we help?" required />
                  </Field>

                  <label className="flex items-start gap-2.5 text-[12px] leading-relaxed text-slate-600">
                    <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600" />
                    <span>I consent to SmartMed contacting me about this enquiry.</span>
                  </label>

                  <button type="submit" className="btn btn-primary btn-lg w-full"><Send size={15} /> Send message</button>

                  <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                    <ShieldCheck size={14} className="mt-0.5 shrink-0 text-brand-600" />
                    <p className="text-[11.5px] leading-relaxed text-slate-600">
                      Messages are encrypted in transit. For anything urgent, use the emergency line — do not rely on a web form.
                    </p>
                  </div>
                </form>
              </div>
            )}

            {/* department directory */}
            <div className="card mt-5 p-6">
              <div className="flex items-center gap-2.5"><Building2 size={16} className="text-brand-600" /><h3 className="text-[14px] font-bold text-slate-900">Department directory</h3></div>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {DEPARTMENTS.map((d) => (
                  <Link key={d.code} to="/appointments" className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 transition hover:border-brand-300 hover:bg-brand-50/40">
                    <span className="text-[12px] font-semibold text-slate-700">{d.name}</span>
                    <span className="text-[11px] font-bold text-slate-500">Ext. {d.code}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-slate-200 bg-slate-50 py-14">
        <div className="container-x">
          <SectionHead eyebrow="Frequently asked" title="Answers before you ask" center />
          <div className="mx-auto mt-9 grid max-w-4xl gap-3">
            {FAQ.map((f) => (
              <details key={f.q} className="card group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span className="text-[13.5px] font-bold text-slate-900">{f.q}</span>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition group-open:bg-brand-600 group-open:text-white">+</span>
                </summary>
                <p className="mt-3.5 text-[12.5px] leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>

          <div className="mx-auto mt-8 max-w-4xl">
            <AiDisclaimer text="SmartMed AI tools provide informational assistance only and are not a substitute for professional medical advice, diagnosis or treatment." />
          </div>
        </div>
      </section>

      {/* quick portals */}
      <section className="container-x py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: 'Patient support', d: 'Medication reminders, reports and appointments.', to: '/portal/patient', i: User },
            { t: 'Clinical enquiries', d: 'For clinicians referring or seeking records.', to: '/portal/doctor', i: Stethoscope },
            { t: 'Hospital administration', d: 'Billing, insurance and institutional matters.', to: '/portal/admin', i: Users },
            { t: 'Emergency desk', d: '24-hour ambulance and trauma coordination.', to: '/emergency', i: Ambulance },
          ].map((x) => (
            <Link key={x.t} to={x.to} className="card card-hover p-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><x.i size={19} /></span>
              <h3 className="mt-4 text-[13.5px] font-bold text-slate-900">{x.t}</h3>
              <p className="mt-2 text-[12px] leading-relaxed text-slate-600">{x.d}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-bold text-brand-600">Open <ArrowRight size={12} /></span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
