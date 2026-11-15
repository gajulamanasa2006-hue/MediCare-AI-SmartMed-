import React from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, Ambulance, ArrowRight, BadgeCheck, BrainCircuit, Building2, CheckCircle2, ClipboardList,
  Cpu, Database, FileSearch, FlaskConical, Heart, HeartPulse, Layers, LineChart, Lock, Microscope,
  Pill, ShieldCheck, Sparkles, Stethoscope, Target, Users, Zap,
} from 'lucide-react'
import { PageHero } from '../components/PublicShell'
import { AiDisclaimer, Img, SectionHead, Stat } from '../components/ui'
import { IMG, DEPARTMENTS, STAFF } from '../data/mock'

const PILLARS = [
  { icon: BrainCircuit, t: 'AI-assisted healthcare', d: 'Clinical-grade decision support for medication safety, symptoms and laboratory interpretation — always with a human in the loop.' },
  { icon: Pill, t: 'Medication safety', d: 'Every prescription is screened for interactions, duplication, allergy conflicts and dose-timing errors before it reaches the patient.' },
  { icon: Activity, t: 'Personalized health insights', d: 'A digital health twin that learns from your vitals, adherence and reports to surface what actually needs attention.' },
  { icon: FileSearch, t: 'Medical report analysis', d: 'OCR extraction plus plain-language explanation of values, reference ranges and what a result means for you.' },
  { icon: ClipboardList, t: 'Appointment management', d: 'Departments, doctors, availability, tokens and live queue — bookable in-person, by video or as an emergency walk-in.' },
  { icon: Ambulance, t: 'Emergency assistance', d: 'One-tap emergency request with location capture, ambulance dispatch tracking and AI-assisted triage priority.' },
  { icon: Users, t: 'Connected healthcare ecosystem', d: 'Patients, doctors, nurses, reception, laboratory and administrators working on a single source of truth.' },
]

const FLOW = [
  { s: '01', t: 'Patient registers or checks in', d: 'Front desk or self-service registration creates a single patient identity with allergies, conditions and insurance on record.' },
  { s: '02', t: 'AI screens the medication plan', d: 'Every medicine, dose, frequency and existing prescription is validated against allergy and interaction rules.' },
  { s: '03', t: 'Consultation & prescription', d: 'The doctor records clinical notes and vitals, then issues a digital prescription with follow-up scheduling.' },
  { s: '04', t: 'Laboratory & diagnostics', d: 'Test requests flow to pathology or radiology; verified reports return to both the doctor and the patient.' },
  { s: '05', t: 'Continuous monitoring', d: 'Vitals, adherence and health score update the digital twin, triggering reminders or escalation when needed.' },
  { s: '06', t: 'Emergency readiness', d: 'If something is urgent, triage prioritisation and ambulance dispatch kick in without leaving the platform.' },
]

const STACK = [
  { icon: Layers, t: 'React + TypeScript + Tailwind', d: 'Component-driven SPA with a design system of tokens, cards and role-specific layouts.' },
  { icon: Cpu, t: 'Python FastAPI service layer', d: 'REST endpoints for auth, patients, medications, reports, appointments and emergencies.' },
  { icon: Database, t: 'MongoDB document store', d: 'Collections per domain with indexed lookups for patient IDs, tokens and audit trails.' },
  { icon: Lock, t: 'JWT + role-based access', d: 'Six roles with scoped tokens; sensitive fields encrypted at rest and every access written to an audit log.' },
  { icon: Zap, t: 'AI-ready architecture', d: 'Medication safety, symptom triage, OCR, lab analysis, health scoring and emergency prioritisation adapters.' },
  { icon: ShieldCheck, t: 'Safety-first by design', d: 'Every AI output carries an explicit limitation notice; nothing replaces a licensed clinician.' },
]

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="About SmartMed"
        title={<>Healthcare that connects, <span className="text-teal-600">and medication that is safe</span></>}
        sub="SmartMed is an intelligent healthcare ecosystem built around one idea: a patient should never have to guess whether a medicine is safe, what a lab value means, or who is responsible for the next step in their care."
      >
        <div className="flex flex-wrap gap-3">
          <Link to="/ai-tools" className="btn btn-primary btn-lg">Explore AI Health Tools <ArrowRight size={15} /></Link>
          <Link to="/appointments" className="btn btn-ghost btn-lg">Book an appointment</Link>
        </div>
      </PageHero>

      {/* ---------------- mission ---------------- */}
      <section className="container-x py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Our mission</p>
            <h2 className="mt-3 text-[30px] font-extrabold leading-tight text-slate-900">
              Empowering patients for safe and effective medication use
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-slate-600">
              Adverse medication events remain one of the most preventable causes of harm in modern healthcare. Most happen not
              because clinicians are careless, but because information is fragmented — a prescription written in one system,
              an allergy recorded on paper, a lab result in a folder nobody re-opened.
            </p>
            <p className="mt-3.5 text-[14px] leading-relaxed text-slate-600">
              SmartMed closes that loop. Patients get an understandable, always-available view of their medications,
              vitals and reports. Clinicians get the same record with decision support layered on top. Reception, nursing and
              laboratory teams work from that record instead of around it.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Stat label="Connected roles" value="6" sub="Patient to administrator" icon={Users} tone="brand" />
              <Stat label="AI safety checks" value="5" sub="Medication to triage" icon={BrainCircuit} tone="teal" />
              <Stat label="Departments" value={String(DEPARTMENTS.length)} sub="General to emergency" icon={Building2} tone="violet" />
            </div>
          </div>
          <div className="space-y-4">
            <Img src={IMG.heroConsult} alt="Clinician reviewing a patient's medication record" ratio="16/10" className="rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
              <Img src={IMG.medList} alt="Medication list coordination between care teams" ratio="4/3" className="rounded-2xl" />
              <Img src={IMG.digital} alt="Digital health data visualisation" ratio="4/3" className="rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- pillars ---------------- */}
      <section className="border-y border-slate-200 bg-white py-16">
        <div className="container-x">
          <SectionHead
            eyebrow="What we do"
            title="Seven capabilities, one connected record"
            sub="Each capability below is live in this demo — open the AI Health Tools section or any portal to try it."
            center
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <div key={p.t} className="card card-hover p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><p.icon size={20} /></span>
                <h3 className="mt-4 text-[14.5px] font-bold text-slate-900">{p.t}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600">{p.d}</p>
              </div>
            ))}
            <div className="rounded-2xl grad-navy p-5 text-white">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-teal-300"><Target size={20} /></span>
              <h3 className="mt-4 text-[14.5px] font-bold">Our north star</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-300">
                Zero preventable medication harm — achieved through transparency, not restriction. Patients deserve to understand
                their own treatment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- patient journey ---------------- */}
      <section className="container-x py-16">
        <SectionHead eyebrow="How care flows" title="One patient journey, six coordinated steps" sub="Nothing is re-typed between roles. The record moves, the people act." />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FLOW.map((f) => (
            <div key={f.s} className="card card-hover p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg grad-brand text-[12px] font-extrabold text-white">{f.s}</span>
                <h3 className="text-[14px] font-bold text-slate-900">{f.t}</h3>
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-slate-600">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- technology ---------------- */}
      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="container-x">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <p className="eyebrow">Technology</p>
              <h2 className="mt-3 text-[30px] font-extrabold leading-tight text-slate-900">Built as a production system, demonstrated with synthetic data</h2>
              <p className="mt-4 text-[13.5px] leading-relaxed text-slate-600">
                The front end is a typed React single-page application. The back end is a FastAPI service with MongoDB collections
                and JWT authentication; AI capabilities are implemented as replaceable adapters, so a real model endpoint can be
                dropped in without touching the UI.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['React', 'TypeScript', 'Tailwind CSS', 'Recharts', 'FastAPI', 'MongoDB', 'JWT', 'OCR adapter', 'Audit logging'].map((t) => (
                  <span key={t} className="chip">{t}</span>
                ))}
              </div>
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
                <BadgeCheck size={16} className="mt-0.5 shrink-0 text-brand-600" />
                <p className="text-[12.5px] leading-relaxed text-brand-900">
                  <strong>Demo notice:</strong> all patients, clinicians, appointments, vitals and reports in this build are
                  synthetic. No real personal or medical information is stored or transmitted.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {STACK.map((s) => (
                <div key={s.t} className="card p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-teal-600"><s.icon size={18} /></span>
                  <h3 className="mt-3.5 text-[13.5px] font-bold text-slate-900">{s.t}</h3>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- team ---------------- */}
      <section className="container-x py-16">
        <SectionHead eyebrow="Who runs the platform" title="A connected care team" sub="Each role has a dedicated workspace with exactly the access it needs — and nothing more." center />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Stethoscope, r: 'Doctors', d: 'Consultations, diagnoses, e-prescriptions, test orders and follow-ups.', to: '/portal/doctor', tone: 'brand' },
            { icon: HeartPulse, r: 'Nursing & care coordination', d: 'Vitals, medication administration, alerts and escalation.', to: '/portal/nurse', tone: 'violet' },
            { icon: ClipboardList, r: 'Front desk & reception', d: 'Registration, booking, check-in, tokens and live queue.', to: '/portal/reception', tone: 'amber' },
            { icon: Microscope, r: 'Laboratory & radiology', d: 'Test requests, sample status, verified report upload and dispatch.', to: '/portal/lab', tone: 'cyan' },
          ].map((x) => (
            <Link key={x.r} to={x.to} className="card card-hover p-5">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${x.tone === 'brand' ? 'bg-brand-50 text-brand-600' : x.tone === 'violet' ? 'bg-violet-50 text-violet-600' : x.tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-cyan-50 text-cyan-700'}`}>
                <x.icon size={20} />
              </span>
              <h3 className="mt-4 text-[14px] font-bold text-slate-900">{x.r}</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600">{x.d}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-brand-600">Open portal <ArrowRight size={13} /></span>
            </Link>
          ))}
        </div>

        <div className="mt-10 card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">Platform staff directory</h3>
              <p className="mt-1 text-[12.5px] text-slate-500">{STAFF.length} provisioned accounts across clinical, diagnostic and administrative functions.</p>
            </div>
            <Link to="/portal/admin" className="btn btn-ghost btn-sm">Manage staff <ArrowRight size={13} /></Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STAFF.slice(0, 9).map((s) => (
              <div key={s.code} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-[11.5px] font-bold text-slate-600">
                  {s.name.replace('Dr. ', '').split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold text-slate-800">{s.name}</p>
                  <p className="truncate text-[11px] text-slate-500">{s.spec}</p>
                </div>
                <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{s.role}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="card p-5">
            <div className="flex items-center gap-2.5"><Sparkles size={16} className="text-teal-600" /><h3 className="text-[14px] font-bold text-slate-900">What AI does — and does not do</h3></div>
            <ul className="mt-3.5 space-y-2.5">
              {[
                'It surfaces possible interactions, duplications and allergy conflicts for review.',
                'It explains laboratory values in plain language against reference ranges.',
                'It estimates urgency so urgent cases are not queued behind routine ones.',
                'It never issues a diagnosis, never prescribes, and never overrides a clinician.',
                'Every output is labelled as assistance and requires professional confirmation.',
              ].map((x) => (
                <li key={x} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-slate-600">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-teal-600" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2.5"><ShieldCheck size={16} className="text-brand-600" /><h3 className="text-[14px] font-bold text-slate-900">Privacy, security & governance</h3></div>
            <ul className="mt-3.5 space-y-2.5">
              {[
                'Role-scoped JWT sessions — a receptionist cannot open a clinical note.',
                'Sensitive identifiers (government ID, policy numbers) encrypted at rest.',
                'Every record view and change written to an immutable audit log.',
                'Consent captured at registration; patient controls portal activation.',
                'AI processing is advisory only and never used for automated denial of care.',
              ].map((x) => (
                <li key={x} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-slate-600">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand-600" /> {x}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <AiDisclaimer text="SmartMed AI features provide informational assistance for education and demonstration. They do not diagnose disease, do not replace professional medical advice, and must not be used as the sole basis for any treatment decision." />
        </div>
      </section>

      {/* ---------------- cta ---------------- */}
      <section className="container-x pb-16">
        <div className="relative overflow-hidden rounded-2xl grad-navy px-7 py-11 sm:px-12">
          <div className="absolute inset-0 dotgrid opacity-[0.12]" aria-hidden />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="text-[26px] font-extrabold leading-tight text-white">Ready to see the whole ecosystem working?</h2>
              <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-slate-300">
                Jump into any role portal with one click, or start from the patient side and follow a medication through
                screening, prescription, dispensing and monitoring.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link to="/portal/patient" className="btn btn-teal btn-lg">Patient portal</Link>
              <Link to="/auth?role=doctor" className="btn btn-lg border border-white/15 bg-white/5 text-white hover:bg-white/10">Staff sign in</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
