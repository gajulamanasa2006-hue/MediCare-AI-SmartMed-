import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity, Ambulance, ArrowRight, Award, Bot, Brain, Building2, Calendar, CalendarDays, CheckCircle2,
  ChevronLeft, ChevronRight, ClipboardList, Clock, Droplet, FileSearch, FlaskConical, Gauge, Heart,
  HeartHandshake, HeartPulse, LineChart, Lock, Microscope, Phone, Pill, Play, ScanLine, ShieldCheck,
  Sparkles, Star, Stethoscope, TrendingUp, Upload, UserCheck, Users, Video, Zap,
} from 'lucide-react'
import { cn, Img, SectionHead, Feature, Badge, Btn, Card } from '../components/ui'
import { DEPARTMENTS, DOCTORS, IMG, VITALS } from '../data/mock'
import { BpChart, OpsTrend, Donut } from '../components/charts'

/* ------------------------------------------------------------------ Hero carousel */
const SLIDES = [
  { img: IMG.heroDoctor,  badge: 'AI Medication Safety',  caption: 'Every prescription screened', eyebrow: 'Trusted, connected care' },
  { img: IMG.heroNurse,   badge: '24 × 7 Care Team',      caption: 'Care at every step', eyebrow: 'Doctors, nurses & coordinators' },
  { img: IMG.labBlood,    badge: 'SmartLab Diagnostics',  caption: 'Reports explained simply', eyebrow: 'Same-day verified results' },
  { img: IMG.pharmacy,    badge: 'Medication Intelligence', caption: 'Never miss a dose', eyebrow: 'Adherence you can see' },
]

export default function Home() {
  const nav = useNavigate()
  const [i, setI] = useState(0)
  useEffect(() => { const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 5200); return () => clearInterval(t) }, [])
  const s = SLIDES[i]

  return (
    <>
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden grad-hero">
        <div className="absolute inset-0 dotgrid opacity-40" aria-hidden />
        <div className="absolute -right-32 -top-24 h-80 w-80 rounded-full bg-teal-200/30 blur-3xl" aria-hidden />
        <div className="absolute -left-24 top-40 h-72 w-72 rounded-full bg-brand-200/30 blur-3xl" aria-hidden />

        <div className="container-x relative grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
          <div className="anim-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3.5 py-1.5 text-[12px] font-semibold text-teal-700 shadow-sm backdrop-blur">
              <Sparkles size={13} /> AI-powered healthcare ecosystem
            </span>

            <h1 className="mt-5 text-[34px] font-extrabold leading-[1.08] sm:text-[44px] lg:text-[52px]">
              SMARTMED
            </h1>
            <p className="mt-3 text-[19px] font-bold text-slate-800 sm:text-[22px]">
              Empowering Patients for Safe and Effective Medication Use
            </p>
            <p className="mt-5 max-w-xl text-[14.5px] leading-relaxed text-slate-600">
              An intelligent healthcare platform combining AI, medication safety, medical analysis, personalized health monitoring
              and connected healthcare services — for patients, doctors, nurses, laboratories, front-desk teams, emergency
              services and administrators in one secure ecosystem.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Btn size="lg" variant="primary" onClick={() => nav('/auth?mode=register&role=patient')}>Get Started <ArrowRight size={16} /></Btn>
              <Btn size="lg" variant="ghost" onClick={() => nav('/appointments')}><CalendarDays size={16} /> Book Appointment</Btn>
              <Btn size="lg" variant="teal-soft" onClick={() => nav('/ai-tools')}><Bot size={16} /> Explore AI Health Tools</Btn>
            </div>

            <div className="mt-9 grid max-w-2xl gap-5 sm:grid-cols-3">
              {[
                { i: Stethoscope, t: 'Expert Doctors', d: 'Board-certified multi-specialty panel', tone: 'brand' },
                { i: CalendarDays, t: 'Easy Appointments', d: 'In-person, video or emergency slots', tone: 'teal' },
                { i: ShieldCheck, t: 'Secure & Private', d: 'Role-based access with audit trails', tone: 'green' },
              ].map((f) => (
                <div key={f.t} className="flex items-start gap-3">
                  <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg border',
                    f.tone === 'brand' ? 'border-brand-100 bg-brand-50 text-brand-600' : f.tone === 'teal' ? 'border-teal-100 bg-teal-50 text-teal-600' : 'border-emerald-100 bg-emerald-50 text-emerald-600')}>
                    <f.i size={16} />
                  </span>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">{f.t}</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-slate-500">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* hero visual carousel */}
          <div className="relative anim-up d2">
            <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white p-2.5 shadow-lift">
              <div className="relative overflow-hidden rounded-2xl">
                <Img key={s.img} src={s.img} alt={`${s.badge} — SmartMed`} ratio="aspect-[4/3]" className="anim-in" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-900/65 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal-300">{s.eyebrow}</p>
                    <p className="mt-1 text-[15px] font-bold text-white">{s.caption}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {SLIDES.map((_, k) => (
                      <button key={k} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`}
                        className={cn('h-1.5 rounded-full transition-all', k === i ? 'w-6 bg-white' : 'w-1.5 bg-white/50')} />
                    ))}
                  </div>
                </div>
              </div>

              {/* floating badges */}
              <div className="absolute left-5 top-5 flex items-center gap-2 rounded-xl border border-slate-100 bg-white/95 px-3 py-2 shadow-lift backdrop-blur anim-float">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-50 text-teal-600"><ShieldCheck size={14} /></span>
                <div>
                  <p className="text-[11.5px] font-bold leading-tight text-slate-900">{s.badge}</p>
                  <p className="text-[10px] text-slate-500">Verified in this session</p>
                </div>
              </div>
            </div>

            {/* live mini-stat floats */}
            <div className="absolute -bottom-5 -left-4 hidden w-56 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-lift sm:block anim-float" style={{ animationDelay: '.8s' }}>
              <div className="flex items-center justify-between">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Medication adherence</p>
                <Badge tone="green">On track</Badge>
              </div>
              <p className="mt-1.5 text-[22px] font-extrabold leading-none text-slate-900">93<span className="text-[13px] text-slate-500">%</span></p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-[93%] rounded-full bg-emerald-500" />
              </div>
            </div>

            <div className="absolute -right-4 -top-5 hidden w-44 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-lift lg:block anim-float" style={{ animationDelay: '1.6s' }}>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Health score</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-[22px] font-extrabold leading-none text-slate-900">82</p>
                <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600"><TrendingUp size={12} /> +11</span>
              </div>
            </div>
          </div>
        </div>

        {/* trust strip */}
        <div className="relative border-t border-slate-200/80 bg-white/70 backdrop-blur">
          <div className="container-x grid gap-6 py-7 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { v: '120+', l: 'Inpatient beds managed', i: Building2 },
              { v: '8', l: 'Clinical departments', i: HeartPulse },
              { v: '24×7', l: 'Emergency & ambulance', i: Ambulance },
              { v: '6', l: 'Role-based portals', i: Users },
            ].map((t) => (
              <div key={t.l} className="flex items-center gap-3.5">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-600"><t.i size={19} /></span>
                <div>
                  <p className="text-[21px] font-extrabold leading-none text-slate-900">{t.v}</p>
                  <p className="mt-1 text-[12px] text-slate-500">{t.l}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ QUICK ACTIONS ============================ */}
      <section className="container-x -mt-7 relative z-10">
        <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { t: 'Check My Medicines', d: 'Screen interactions, duplicates and allergies', i: Pill, to: '/ai-tools', tone: 'teal' },
            { t: 'Describe My Symptoms', d: 'Get an urgency level and right department', i: Bot, to: '/ai-tools', tone: 'brand' },
            { t: 'Analyse My Report', d: 'OCR + plain-English lab explanation', i: FileSearch, to: '/ai-tools', tone: 'violet' },
            { t: 'Emergency Assistance', d: 'AI triage + ambulance tracking demo', i: Ambulance, to: '/emergency', tone: 'rose' },
          ].map((a) => (
            <Link key={a.t} to={a.to}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lift transition-all hover:-translate-y-1 hover:border-brand-200">
              <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl border',
                a.tone === 'teal' ? 'border-teal-100 bg-teal-50 text-teal-600'
                : a.tone === 'brand' ? 'border-brand-100 bg-brand-50 text-brand-600'
                : a.tone === 'violet' ? 'border-violet-100 bg-violet-50 text-violet-600'
                : 'border-rose-100 bg-rose-50 text-rose-600')}>
                <a.i size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold text-slate-900">{a.t}</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-slate-500">{a.d}</p>
              </div>
              <ArrowRight size={16} className="shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-600" />
            </Link>
          ))}
        </div>
      </section>

      {/* ============================ WHY / ABOUT BLOCK ============================ */}
      <section className="container-x mt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative order-2 lg:order-1">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-2.5 shadow-card">
              <Img src={IMG.hospital} alt="SmartMed modern hospital facility" ratio="aspect-[4/3]" className="rounded-2xl" />
            </div>
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-lift backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl grad-brand text-white"><HeartHandshake size={18} /></span>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">Patient-Centered Care</p>
                    <p className="text-[11px] text-slate-500">275 reviews · 4.9 average</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[0, 1, 2, 3, 4].map((k) => <Star key={k} size={13} fill="currentColor" />)}
                </div>
              </div>
            </div>
            <div className="absolute -right-4 top-8 hidden rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-lift lg:block anim-float">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Lab turnaround</p>
              <p className="mt-0.5 text-[18px] font-extrabold text-slate-900">Same day</p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="eyebrow">The SmartMed experience</p>
            <h2 className="h-sec mt-2">Compassionate Healthcare Powered by <span className="text-grad">Clinical Intelligence</span></h2>
            <p className="mt-4 text-[14.5px] leading-relaxed text-slate-600">
              SmartMed links every step of your care journey. Patients safely manage medications and understand their own
              health information; clinicians, nurses, laboratories, front-desk teams, emergency services and administrators work
              on the same connected record — with role-based access and a full audit trail.
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {[
                { i: ShieldCheck, t: 'Medication Safety First', d: 'Interaction, duplicate-therapy and allergy screening before a dose is ever taken.', tone: 'brand' },
                { i: Bot, t: 'Integrated AI Assistance', d: 'Symptom triage, OCR extraction, lab interpretation and health scoring in one place.', tone: 'teal' },
                { i: Award, t: 'Multi-Specialty Specialists', d: 'Eight departments with board-certified consultants and published sub-specialties.', tone: 'violet' },
                { i: Ambulance, t: 'Rapid Emergency Response', d: 'AI prioritisation, ambulance dispatch and live arrival tracking.', tone: 'rose' },
              ].map((f) => (
                <div key={f.t} className="flex gap-3.5">
                  <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl border',
                    f.tone === 'brand' ? 'border-brand-100 bg-brand-50 text-brand-600'
                    : f.tone === 'teal' ? 'border-teal-100 bg-teal-50 text-teal-600'
                    : f.tone === 'violet' ? 'border-violet-100 bg-violet-50 text-violet-600'
                    : 'border-rose-100 bg-rose-50 text-rose-600')}>
                    <f.i size={18} />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-bold text-slate-900">{f.t}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Btn variant="primary" onClick={() => nav('/about')}>Learn about the platform <ArrowRight size={15} /></Btn>
              <Btn variant="ghost" onClick={() => nav('/services')}>View all services</Btn>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ FEATURE GRID ============================ */}
      <section className="container-x mt-24">
        <SectionHead center eyebrow="Everything in one ecosystem"
          title={<>Seven connected capabilities, <span className="text-grad">one patient record</span></>}
          sub="Each module is fully navigable in this demonstration — open any card to use it with live demo interactions." />
        <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[
            { i: Bot, t: 'AI-Powered Healthcare', d: 'Medication screening, symptom triage, OCR and lab interpretation in one assistant.', tone: 'brand' },
            { i: Pill, t: 'Medication Safety', d: 'Interaction flags, duplicate therapy detection, allergy conflicts and dose reminders.', tone: 'teal' },
            { i: Activity, t: 'Smart Health Monitoring', d: 'Blood pressure, glucose, heart rate, weight and adherence trends over time.', tone: 'green' },
            { i: FileSearch, t: 'Medical Report Analysis', d: 'Upload prescriptions, blood reports, X-ray, CT or MRI and get a plain-English summary.', tone: 'violet' },
            { i: Ambulance, t: 'Emergency Assistance', d: 'One-tap request, AI priority scoring, ambulance assignment and live tracking.', tone: 'rose' },
            { i: Heart, t: 'Personalized Healthcare', d: 'A digital health twin built from your own vitals, adherence and reports.', tone: 'teal' },
            { i: Video, t: 'Doctor Consultation', d: 'In-person, video or emergency consultations with notes and e-prescriptions.', tone: 'brand' },
            { i: FlaskConical, t: 'Laboratory Management', d: 'Test requests, sample status, verified results routed to doctors and patients.', tone: 'cyan' },
          ].map((f, k) => <Feature key={f.t} icon={f.i} title={f.t} desc={f.d} tone={f.tone} className={cn('anim-up', 'd' + Math.min(6, k + 1))} />)}
        </div>
      </section>

      {/* ============================ MEDICATION SAFETY SPOTLIGHT ============================ */}
      <section className="mt-24 overflow-hidden bg-slate-900 py-20 text-white">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3.5 py-1.5 text-[12px] font-semibold text-teal-300">
              <Pill size={13} /> Medication Safety
            </span>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight text-white sm:text-[38px]">
              Safer medication use, <span className="text-teal-300">before the first dose</span>
            </h2>
            <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-slate-300">
              Enter or upload a medicine and the AI Medication Safety engine returns drug information, possible interactions,
              duplicate-medication warnings, allergy warnings, dosage reminders and safety recommendations — with the flagged
              severity clearly stated.
            </p>

            <ul className="mt-7 space-y-3.5">
              {[
                'Severe vs moderate interaction grading with a plain-English reason',
                'Duplicate active-ingredient detection across brand names',
                'Cross-checks every entry against your recorded allergy list',
                'Dose reminders for morning, afternoon and night slots',
                'Adherence tracking with taken / missed / upcoming states',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[13.5px] text-slate-200">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-teal-400" /> {t}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Btn variant="teal" size="lg" onClick={() => nav('/ai-tools')}><Pill size={16} /> Run a safety check</Btn>
              <Btn variant="navy" size="lg" className="border border-white/15" onClick={() => nav('/auth?role=patient')}>See my medication list</Btn>
            </div>
            <p className="mt-5 max-w-xl text-[11.5px] leading-relaxed text-amber-300">
              AI-generated information is for assistance only and does not replace professional medical advice.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">Interaction screen · demo</p>
                <Badge tone="amber">2 flags</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { a: 'Dolo 650', b: 'Brufen 400', lv: 'Severe', n: 'Paracetamol + NSAID — both flagged; NSAIDs are contraindicated with your documented Brufen allergy.', tone: 'red' },
                  { a: 'Ferrous Ascorbate', b: 'Pantoprazole', lv: 'Minor', n: 'Reduced gastric acid may slightly lower iron absorption — separate doses where practical.', tone: 'amber' },
                ].map((r) => (
                  <div key={r.a + r.b} className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12.5px] font-bold text-white">{r.a} <span className="text-slate-500">+</span> {r.b}</p>
                      <Badge tone={r.tone}>{r.lv}</Badge>
                    </div>
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-300">{r.n}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Risk score</p>
                <p className="mt-1 text-[30px] font-extrabold leading-none text-amber-300">46</p>
                <p className="mt-1 text-[11.5px] text-slate-300">Moderate — pharmacist review advised</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Doses logged today</p>
                <p className="mt-1 text-[30px] font-extrabold leading-none text-teal-300">3 / 4</p>
                <p className="mt-1 text-[11.5px] text-slate-300">Night dose due at 9:30 PM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ DEPARTMENTS ============================ */}
      <section className="container-x mt-24">
        <SectionHead eyebrow="Clinical departments"
          title={<>From preventive screening to <span className="text-grad">critical intervention</span></>}
          sub="Every department operates under documented clinical safety protocols, with its own consultant panel, laboratory routing and OPD schedule." />

        <div className="mt-11 grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="relative h-full overflow-hidden rounded-2xl grad-navy p-6 text-white">
              <Badge tone="teal" className="!bg-teal-400/15 !text-teal-200 !border-teal-400/30">NABL-aligned laboratory</Badge>
              <h3 className="mt-4 text-[21px] font-extrabold leading-tight text-white">Advanced Pathology &amp; Diagnostics</h3>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-300">
                Complete pathology and imaging under one roof, with results routed straight into your health record and
                interpreted by AI Lab Analysis.
              </p>
              <ul className="mt-5 space-y-2.5">
                {['Routine & specialised blood panels', 'Digital radiology — X-Ray, CT, MRI', 'Same-day verified results', 'Secure downloadable PDF reports', 'AI plain-English interpretation'].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[12.5px] text-slate-200">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-teal-300" /> {t}
                  </li>
                ))}
              </ul>
              <Btn variant="teal" size="sm" className="mt-6" onClick={() => nav('/ai-tools')}>Analyse a report</Btn>
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
            {DEPARTMENTS.filter((d) => d.code !== 'EMR').slice(0, 6).map((d) => (
              <Link key={d.code} to="/services"
                className="group rounded-2xl border border-slate-200 bg-white p-4.5 p-5 shadow-card transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift">
                <div className="flex items-start justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: d.color + '14', color: d.color }}>
                    <Stethoscope size={18} />
                  </span>
                  <Badge tone="slate">{d.code}</Badge>
                </div>
                <p className="mt-3 text-[13.5px] font-bold text-slate-900">{d.name}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">{d.desc}</p>
              </Link>
            ))}
            <Link to="/emergency" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-lift sm:col-span-2">
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700"><Ambulance size={20} /></span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-amber-900">24/7 Critical &amp; Trauma Care</p>
                  <p className="text-[11.5px] text-amber-800/80">Resuscitation, triage and AI-assisted emergency prioritisation with ambulance tracking.</p>
                </div>
                <ArrowRight size={17} className="ml-auto shrink-0 text-amber-700" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================ DOCTORS CAROUSEL ============================ */}
      <DoctorCarousel onBook={() => nav('/appointments')} onAll={() => nav('/doctors')} />

      {/* ============================ AI TOOLS SHOWCASE ============================ */}
      <section className="container-x mt-24">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
          <div className="grid lg:grid-cols-5">
            <div className="p-7 lg:col-span-2 lg:p-9">
              <p className="eyebrow">SmartMed AI</p>
              <h2 className="mt-2 text-2xl font-extrabold leading-tight sm:text-[30px]">Five AI tools built into your care journey</h2>
              <p className="mt-3.5 text-[13.5px] leading-relaxed text-slate-600">
                Every tool runs on your own demo data and returns a clearly-labelled advisory result. Nothing here replaces
                professional medical advice — it helps you ask better questions.
              </p>

              <div className="mt-7 space-y-3">
                {[
                  { i: Pill, t: 'AI Medication Safety', d: 'Interactions, duplicates, allergy conflicts, risk score' },
                  { i: Bot, t: 'AI Symptom Assistant', d: 'Possible concerns, urgency level, department routing' },
                  { i: ScanLine, t: 'Medical Report OCR', d: 'Extract and structure prescriptions, blood reports, scans' },
                  { i: FlaskConical, t: 'AI Lab Report Analysis', d: 'Value vs reference range with plain-English reasons' },
                  { i: Gauge, t: 'AI Health Score', d: 'Weighted score across vitals, adherence, labs and lifestyle' },
                ].map((t) => (
                  <button key={t.t} onClick={() => nav('/ai-tools')}
                    className="group flex w-full items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-3.5 text-left transition-all hover:border-brand-300 hover:bg-brand-50/50">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors"><t.i size={16} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold text-slate-900">{t.t}</span>
                      <span className="block text-[11.5px] text-slate-500">{t.d}</span>
                    </span>
                    <ArrowRight size={15} className="shrink-0 text-slate-300 group-hover:text-brand-600" />
                  </button>
                ))}
              </div>
            </div>

            <div className="relative bg-slate-900 p-7 text-white lg:col-span-3 lg:p-9">
              <div className="absolute inset-0 dotgrid opacity-[0.12]" aria-hidden />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-300">Digital Health Twin · preview</p>
                    <h3 className="mt-1.5 text-[19px] font-extrabold text-white">Live vitals &amp; trend intelligence</h3>
                  </div>
                  <Badge tone="teal" className="!bg-teal-400/15 !text-teal-200 !border-teal-400/30">Demo data</Badge>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {[
                    { l: 'Blood Pressure', v: '118/76', u: 'mmHg', i: HeartPulse, tone: 'text-rose-300' },
                    { l: 'Fasting Glucose', v: '96', u: 'mg/dL', i: Droplet, tone: 'text-amber-300' },
                    { l: 'Heart Rate', v: '74', u: 'bpm', i: Activity, tone: 'text-teal-300' },
                  ].map((m) => (
                    <div key={m.l} className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur">
                      <div className="flex items-center justify-between">
                        <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{m.l}</p>
                        <m.i size={14} className={m.tone} />
                      </div>
                      <p className="mt-2 text-[22px] font-extrabold leading-none text-white">
                        {m.v}<span className="ml-1 text-[11.5px] font-semibold text-slate-400">{m.u}</span>
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Blood pressure · 7-month trend</p>
                  <div className="mt-2 [&_.recharts-text]:fill-slate-400 [&_.recharts-cartesian-grid_line]:stroke-white/10">
                    <BpChart data={VITALS.bp} height={190} />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Btn variant="teal" size="md" onClick={() => nav('/auth?role=patient')}><Activity size={15} /> Open my Health Twin</Btn>
                  <Btn variant="navy" size="md" className="border border-white/15" onClick={() => nav('/ai-tools')}><Gauge size={15} /> Recalculate health score</Btn>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ EMERGENCY CTA ============================ */}
      <section className="container-x mt-24">
        <div className="relative overflow-hidden rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-7 sm:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-200/40 blur-3xl" aria-hidden />
          <div className="relative grid items-center gap-9 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3.5 py-1.5 text-[12px] font-bold text-rose-700">
                <Ambulance size={13} /> 24 × 7 Emergency &amp; Ambulance
              </span>
              <h2 className="mt-4 text-2xl font-extrabold leading-tight sm:text-[32px]">One tap. AI triage. <span className="text-rose-600">Live ambulance tracking.</span></h2>
              <p className="mt-3.5 max-w-xl text-[13.5px] leading-relaxed text-slate-600">
                Submit the emergency type and location and the AI Emergency Priority engine returns CRITICAL, HIGH, MEDIUM or LOW
                with the reason, the recommended department and the recommended action — then assigns the nearest ambulance and
                shows the estimated arrival on a map-style tracker.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/emergency" className="btn btn-danger btn-lg anim-pulse-red">
                  <Ambulance size={17} /> Emergency Assistance
                </Link>
                <a href="tel:+918045102299" className="btn btn-ghost btn-lg"><Phone size={16} /> +91 80 4510 2299</a>
              </div>
              <p className="mt-4 text-[11.5px] text-slate-500">
                Demonstration only — no real emergency service is contacted. In a real emergency call your local emergency number.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lift">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600"><HeartPulse size={18} /></span>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">EMG-2026-000011 · active</p>
                    <p className="text-[11px] text-slate-500">Road traffic accident · ORR Junction</p>
                  </div>
                </div>
                <Badge tone="red">CRITICAL</Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { l: 'Ambulance', v: 'SMN-AMB-02', s: 'Advanced Life Support' },
                  { l: 'ETA', v: '4 min', s: 'Transporting now' },
                  { l: 'Destination', v: 'ER Bay 1', s: 'Trauma team alerted' },
                ].map((x) => (
                  <div key={x.l} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{x.l}</p>
                    <p className="mt-1 text-[14px] font-extrabold text-slate-900">{x.v}</p>
                    <p className="text-[10.5px] text-slate-500">{x.s}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 relative h-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <svg viewBox="0 0 400 170" className="h-full w-full">
                  <rect width="400" height="170" fill="#eef2f7" />
                  <g stroke="#dbe3ec" strokeWidth="1">
                    {Array.from({ length: 9 }).map((_, k) => <line key={'h' + k} x1="0" y1={k * 20} x2="400" y2={k * 20} />)}
                    {Array.from({ length: 17 }).map((_, k) => <line key={'v' + k} x1={k * 25} y1="0" x2={k * 25} y2="170" />)}
                  </g>
                  <path d="M20 140 C 90 120, 120 70, 200 66 S 320 40, 386 26" stroke="#2563eb" strokeWidth="5" fill="none" strokeLinecap="round" />
                  <path d="M20 140 C 90 120, 120 70, 200 66 S 320 40, 386 26" stroke="#93c5fd" strokeWidth="2" fill="none" strokeDasharray="7 6" />
                  <circle cx="20" cy="140" r="7" fill="#e11d48" />
                  <circle cx="20" cy="140" r="13" fill="#e11d48" opacity=".22" />
                  <circle cx="250" cy="56" r="17" fill="#2563eb" />
                  <g transform="translate(243,49)" fill="#fff"><path d="M4 0h6l1 2h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V1a1 1 0 0 1 1-1h1Z" /></g>
                  <circle cx="386" cy="26" r="6" fill="#0d9488" />
                  <text x="392" y="20" fontSize="9" fill="#0f766e" fontWeight="700" textAnchor="end">Hospital</text>
                </svg>
                <div className="absolute left-3 top-3 rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1.5 text-[10.5px] font-bold text-slate-700 shadow-sm">
                  SMN-AMB-02 · 4 min away
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ PORTALS GRID ============================ */}
      <section className="container-x mt-24">
        <SectionHead center eyebrow="Six role-based portals"
          title={<>Built as a professional <span className="text-grad">hospital management system</span></>}
          sub="Each portal has its own navigation, permissions and workflows. Sign in with a demo role to explore any of them instantly." />
        <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { r: 'patient', i: Heart, t: 'Patient Portal', d: 'Health score, vitals, medications, prescriptions, lab reports, AI assistant, notifications.', tone: 'teal' },
            { r: 'doctor', i: Stethoscope, t: 'Doctor Portal', d: 'Patient list, history, consultations, diagnosis notes, e-prescriptions, follow-ups.', tone: 'brand' },
            { r: 'nurse', i: ClipboardList, t: 'Nursing Portal', d: 'Patient monitoring, vital signs, medication administration, alerts, coordination.', tone: 'violet' },
            { r: 'reception', i: CalendarDays, t: 'Front Desk Portal', d: 'Patient registration, appointment booking, doctor availability, token queue.', tone: 'amber' },
            { r: 'lab', i: Microscope, t: 'Laboratory Portal', d: 'Test requests, sample status, report upload, verification and routing.', tone: 'cyan' },
            { r: 'admin', i: Building2, t: 'Admin Console', d: 'Users, doctors, departments, appointments, billing, audit logs, reports.', tone: 'rose' },
          ].map((p) => (
            <Card key={p.t} hover className="flex flex-col">
              <span className={cn('grid h-11 w-11 place-items-center rounded-xl border',
                p.tone === 'teal' ? 'border-teal-100 bg-teal-50 text-teal-600'
                : p.tone === 'brand' ? 'border-brand-100 bg-brand-50 text-brand-600'
                : p.tone === 'violet' ? 'border-violet-100 bg-violet-50 text-violet-600'
                : p.tone === 'amber' ? 'border-amber-100 bg-amber-50 text-amber-600'
                : p.tone === 'cyan' ? 'border-cyan-100 bg-cyan-50 text-cyan-600'
                : 'border-rose-100 bg-rose-50 text-rose-600')}>
                <p.i size={20} />
              </span>
              <h3 className="mt-4 text-[14.5px] font-bold text-slate-900">{p.t}</h3>
              <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-slate-600">{p.d}</p>
              <button onClick={() => nav('/auth?role=' + p.r)} className="btn btn-soft btn-sm mt-4 self-start">
                <Lock size={13} /> Open demo portal
              </button>
            </Card>
          ))}
        </div>
      </section>

      {/* ============================ TESTIMONIALS ============================ */}
      <section className="container-x mt-24">
        <SectionHead center eyebrow="Trusted by patients and clinicians"
          title="What the team says about connected care" />
        <div className="mt-11 grid gap-5 lg:grid-cols-3">
          {[
            { n: 'Radhika D C', r: 'Patient · Anemia & thyroid follow-up', t: 'The medication check caught a duplicate paracetamol and flagged my Brufen allergy before I took anything. My haemoglobin finally trended up once the iron reminder stuck.', tone: 'teal' },
            { n: 'Dr. Rajesh Sharma', r: 'General Physician · 20 years', t: 'Consultation notes, e-prescriptions and lab requests sit in one record. The audit trail means I can show exactly what was prescribed and when.', tone: 'brand' },
            { n: 'Sr. Anjali Verma', r: 'Nursing In-charge · Ward A', t: 'Vital-sign entry and medication administration are two taps. The alert list tells me which room needs me first instead of me walking the whole ward.', tone: 'violet' },
          ].map((t) => (
            <Card key={t.n} className="flex flex-col">
              <div className="flex gap-0.5 text-amber-400">{[0, 1, 2, 3, 4].map((k) => <Star key={k} size={14} fill="currentColor" />)}</div>
              <p className="mt-4 flex-1 text-[13px] leading-relaxed text-slate-600">“{t.t}”</p>
              <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                <span className={cn('grid h-10 w-10 place-items-center rounded-full text-[13px] font-bold text-white grad-brand')}>
                  {t.n.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </span>
                <div>
                  <p className="text-[12.5px] font-bold text-slate-900">{t.n}</p>
                  <p className="text-[11px] text-slate-500">{t.r}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ============================ FINAL CTA ============================ */}
      <section className="container-x mt-24">
        <div className="relative overflow-hidden rounded-3xl grad-navy px-7 py-12 text-center sm:px-12">
          <div className="absolute inset-0 dotgrid opacity-[0.14]" aria-hidden />
          <div className="relative mx-auto max-w-3xl">
            <h2 className="text-2xl font-extrabold leading-tight text-white sm:text-[34px]">
              Empowering Patients for Safe and Effective Medication Use
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-slate-300">
              Start with a free AI medication-safety check, build your digital health twin, or book a consultation with the right
              specialist — all in one connected platform.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Btn variant="teal" size="lg" onClick={() => nav('/ai-tools')}><Pill size={16} /> Check my medicines</Btn>
              <Btn variant="primary" size="lg" onClick={() => nav('/appointments')}><CalendarDays size={16} /> Book an appointment</Btn>
              <Btn variant="navy" size="lg" className="border border-white/20" onClick={() => nav('/auth?mode=register&role=patient')}>
                <UserCheck size={16} /> Create patient account
              </Btn>
            </div>
            <p className="mt-6 text-[11.5px] text-slate-400">
              AI tools provide informational assistance and are not a substitute for professional medical advice.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ Doctor carousel */
function DoctorCarousel({ onBook, onAll }: { onBook: () => void; onAll: () => void }) {
  const [sel, setSel] = useState(2)
  const list = DOCTORS.slice(0, 6)
  const move = (d: number) => setSel((s) => (s + d + list.length) % list.length)
  const visible = [-1, 0, 1].map((o) => (sel + o + list.length) % list.length)

  return (
    <section className="container-x mt-24">
      <SectionHead center eyebrow="Meet our specialists"
        title={<>Board-certified doctors across <span className="text-grad">eight departments</span></>}
        sub="Every consultant publishes their qualifications, experience, consultation fee and weekly OPD slots so you can choose with confidence." />

      <div className="mt-11">
        {/* desktop coverflow */}
        <div className="hidden items-center justify-center gap-5 lg:flex">
          <button onClick={() => move(-1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-card transition hover:border-brand-300 hover:text-brand-600" aria-label="Previous doctor">
            <ChevronLeft size={19} />
          </button>

          <div className="grid flex-1 grid-cols-3 items-center gap-5" style={{ maxWidth: 940 }}>
            {visible.map((idx, pos) => {
              const d = list[idx]
              const active = pos === 1
              return (
                <div key={d.id}
                  className={cn('overflow-hidden rounded-2xl border bg-white transition-all duration-500',
                    active ? 'scale-[1.04] border-brand-500 shadow-lift ring-4 ring-brand-500/10' : 'border-slate-200 opacity-80 shadow-card hover:opacity-100')}>
                  <div className="p-2.5">
                    <Img src={d.img} alt={`${d.name}, ${d.role}`} ratio="aspect-[4/5]" className="rounded-xl" />
                  </div>
                  <div className="px-4 pb-4 pt-1 text-center">
                    <p className="text-[14.5px] font-bold text-slate-900">{d.name}</p>
                    <p className="mt-0.5 text-[12px] font-semibold text-brand-600">{d.role}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{d.qual} · {d.exp}</p>
                    <div className="mt-2.5 flex items-center justify-center gap-2">
                      <Badge tone="slate">{d.dept}</Badge>
                      <Badge tone="green"><Star size={10} fill="currentColor" /> {d.rating}</Badge>
                    </div>
                    {active && (
                      <div className="mt-3.5 space-y-1.5 text-left">
                        <p className="text-[11px] text-slate-500"><span className="font-semibold text-slate-700">OPD:</span> {d.days}</p>
                        <p className="text-[11px] text-slate-500"><span className="font-semibold text-slate-700">Fee:</span> ₹{d.fee} · {d.lang}</p>
                      </div>
                    )}
                    <button onClick={onBook} className={cn('btn mt-4 w-full', active ? 'btn-primary btn-md' : 'btn-ghost btn-md')}>
                      <CalendarDays size={14} /> Book
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <button onClick={() => move(1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-card transition hover:border-brand-300 hover:text-brand-600" aria-label="Next doctor">
            <ChevronRight size={19} />
          </button>
        </div>

        {/* mobile cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
          {list.slice(0, 4).map((d) => (
            <div key={d.id} className="card overflow-hidden">
              <div className="p-2.5"><Img src={d.img} alt={`${d.name}, ${d.role}`} ratio="aspect-[4/3]" className="rounded-xl" /></div>
              <div className="px-4 pb-4">
                <p className="text-[14px] font-bold text-slate-900">{d.name}</p>
                <p className="text-[12px] font-semibold text-brand-600">{d.role}</p>
                <p className="mt-1 text-[11px] text-slate-500">{d.qual} · {d.exp}</p>
                <button onClick={onBook} className="btn btn-primary btn-sm mt-3 w-full"><CalendarDays size={13} /> Book</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Btn variant="ghost" size="md" onClick={onAll}>View all {DOCTORS.length} doctors <ArrowRight size={15} /></Btn>
        </div>
      </div>
    </section>
  )
}
