import React from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, Ambulance, ArrowRight, Baby, Bone, Brain, BrainCircuit, CalendarDays, ClipboardList,
  FileSearch, FlaskConical, Heart, HeartPulse, Microscope, Pill, ScanLine, ShieldCheck, Sparkles,
  Stethoscope, Syringe, Users, Video, Bell, Gauge,
} from 'lucide-react'
import { PageHero } from '../components/PublicShell'
import { Img, SectionHead } from '../components/ui'
import { DEPARTMENTS, IMG } from '../data/mock'

const ICONS: Record<string, any> = { Stethoscope, HeartPulse, Brain, Bone, Sparkles, Baby, Ambulance }

const SERVICE_GROUPS = [
  {
    id: 'clinical',
    eyebrow: 'Clinical services',
    title: 'Care delivery, end to end',
    items: [
      { icon: Stethoscope, t: 'Doctor consultation', d: 'In-person and video consultations with clinical notes, diagnosis, vitals and follow-up planning captured in one record.', to: '/appointments' },
      { icon: ClipboardList, t: 'Appointment management', d: 'Department and doctor selection, live availability, token issuance and queue position tracking.', to: '/appointments' },
      { icon: FileSearch, t: 'Medical report analysis', d: 'Upload a prescription, blood report, X-ray, CT or MRI and receive an OCR-extracted, plain-language summary.', to: '/ai-tools' },
      { icon: FlaskConical, t: 'Laboratory & diagnostics', d: 'Pathology and radiology test requests with status tracking and verified report dispatch to doctor and patient.', to: '/portal/lab' },
    ],
  },
  {
    id: 'medication',
    eyebrow: 'Medication services',
    title: 'Safety at every dose',
    items: [
      { icon: Pill, t: 'Smart medication system', d: 'Add medicines with dose, frequency, food timing, dates and reminder times — organised into morning, afternoon and night.', to: '/portal/patient' },
      { icon: BrainCircuit, t: 'AI medication safety', d: 'Interaction, duplication, allergy and dosage screening with safety recommendations before you take the next dose.', to: '/ai-tools' },
      { icon: Bell, t: 'Adherence tracking & reminders', d: 'Taken, missed and upcoming states with adherence percentage and gentle escalation when doses slip.', to: '/portal/patient' },
      { icon: Syringe, t: 'Medication administration', d: 'Nursing rounds record administration against the prescribed schedule with witness and time stamps.', to: '/portal/nurse' },
    ],
  },
  {
    id: 'monitoring',
    eyebrow: 'Monitoring services',
    title: 'Continuous, not occasional',
    items: [
      { icon: Activity, t: 'Smart health monitoring', d: 'Log blood pressure, glucose, heart rate, weight and SpO₂ — trends are charted automatically.', to: '/portal/patient' },
      { icon: Gauge, t: 'Digital health twin', d: 'A live model of your physiological and adherence state with historical trends and a composite health score.', to: '/portal/patient' },
      { icon: Users, t: 'Nursing patient monitoring', d: 'Ward-level dashboards with alerts for out-of-range vitals and overdue observations.', to: '/portal/nurse' },
      { icon: Video, t: 'Video consultation', d: 'Remote review of reports and medications without travelling — ideal for follow-ups and chronic care.', to: '/appointments' },
    ],
  },
  {
    id: 'emergency',
    eyebrow: 'Emergency services',
    title: 'When minutes matter',
    items: [
      { icon: Ambulance, t: 'Emergency assistance', d: 'One-tap request capturing location, emergency type and patient details, with ambulance dispatch and ETA tracking.', to: '/emergency' },
      { icon: ShieldCheck, t: 'AI emergency priority', d: 'Triage prioritisation into critical, high, medium or low with reasoning and recommended department.', to: '/emergency' },
      { icon: HeartPulse, t: 'Trauma & resuscitation', d: 'Dedicated emergency department with bay allocation, on-call activation and handover documentation.', to: '/services' },
      { icon: ScanLine, t: 'Rapid diagnostics', d: 'Point-of-care and STAT imaging pathways so critical results return while the patient is still in the bay.', to: '/portal/lab' },
    ],
  },
]

export default function Services() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title={<>Everything a connected hospital does — <span className="text-teal-600">in one platform</span></>}
        sub="From a routine medication review to a critical ambulance dispatch, each service below is functional in this demo build. Pick a service to open the exact screen where it lives."
      >
        <div className="flex flex-wrap gap-3">
          <Link to="/appointments" className="btn btn-primary btn-lg">Book an appointment <ArrowRight size={15} /></Link>
          <Link to="/emergency" className="btn btn-danger btn-lg"><Ambulance size={15} /> Emergency assistance</Link>
        </div>
      </PageHero>

      {/* departments */}
      <section className="container-x py-16">
        <SectionHead
          eyebrow="Departments"
          title="Specialist departments under one roof"
          sub="Each department carries its own clinicians, rooms, schedules and appointment slots."
        />
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEPARTMENTS.map((d) => {
            const Icon = ICONS[d.icon] || Stethoscope
            return (
              <div key={d.code} className="card card-hover p-5">
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: d.color }}><Icon size={19} /></span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold tracking-wider text-slate-500">{d.code}</span>
                </div>
                <h3 className="mt-4 text-[14.5px] font-bold text-slate-900">{d.name}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600">{d.desc}</p>
                <Link to="/appointments" className="mt-3.5 inline-flex items-center gap-1.5 text-[12px] font-bold text-brand-600">
                  Book in {d.code} <ArrowRight size={12} />
                </Link>
              </div>
            )
          })}
          <div className="relative overflow-hidden rounded-2xl">
            <Img src={IMG.clinic} alt="Modern hospital ward" ratio="1/1" className="h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 to-transparent" />
            <div className="absolute bottom-0 p-4">
              <p className="text-[13px] font-bold text-white">7 departments · 8 specialists</p>
              <p className="mt-1 text-[11.5px] text-slate-300">General medicine through emergency &amp; trauma</p>
            </div>
          </div>
        </div>
      </section>

      {/* service groups */}
      {SERVICE_GROUPS.map((g, gi) => (
        <section key={g.id} className={gi % 2 === 0 ? 'border-y border-slate-200 bg-white py-16' : 'py-16'}>
          <div className="container-x">
            <SectionHead eyebrow={g.eyebrow} title={g.title} />
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {g.items.map((s) => (
                <Link key={s.t} to={s.to} className="card card-hover flex flex-col p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><s.icon size={19} /></span>
                  <h3 className="mt-4 text-[14px] font-bold text-slate-900">{s.t}</h3>
                  <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-slate-600">{s.d}</p>
                  <span className="mt-3.5 inline-flex items-center gap-1.5 text-[12px] font-bold text-brand-600">
                    Open <ArrowRight size={12} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* facilities strip */}
      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="container-x grid items-center gap-10 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            <Img src={IMG.labBlood} alt="Laboratory blood analysis" ratio="4/3" className="rounded-2xl" />
            <Img src={IMG.pharmacy} alt="Hospital pharmacy" ratio="4/3" className="rounded-2xl" />
            <Img src={IMG.hospital} alt="Modern hospital exterior" ratio="4/3" className="rounded-2xl" />
            <Img src={IMG.meds} alt="Prescription medication" ratio="4/3" className="rounded-2xl" />
          </div>
          <div>
            <p className="eyebrow">Facilities & support</p>
            <h2 className="mt-3 text-[30px] font-extrabold leading-tight text-slate-900">Diagnostics, pharmacy and monitoring working as one</h2>
            <p className="mt-4 text-[13.5px] leading-relaxed text-slate-600">
              A prescription is only as safe as the information behind it. SmartMed links the laboratory that produced the
              result, the pharmacy that dispensed the medicine, the nurse who administered it and the doctor who prescribed it —
              so a single change propagates everywhere instead of nowhere.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { t: 'Pathology & radiology', d: 'Blood, urine, X-ray, CT and MRI requests with verified report dispatch.', i: Microscope },
                { t: 'In-house pharmacy', d: 'Dispensing records linked to the active prescription and allergy profile.', i: Pill },
                { t: '24/7 emergency', d: 'Resuscitation bays, trauma team activation and ambulance fleet tracking.', i: Ambulance },
                { t: 'Ward monitoring', d: 'Vitals, medication rounds, alerts and escalation handled at the bedside.', i: Activity },
              ].map((x) => (
                <div key={x.t} className="card p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-600"><x.i size={16} /></span>
                    <h3 className="text-[13px] font-bold text-slate-900">{x.t}</h3>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-slate-600">{x.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { t: 'For patients', d: 'Track medications, vitals and reports; talk to an AI assistant before you escalate.', to: '/portal/patient', cta: 'Open patient portal', icon: Heart },
            { t: 'For clinicians', d: 'Consult, prescribe, order tests and review results with decision support.', to: '/portal/doctor', cta: 'Open doctor portal', icon: Stethoscope },
            { t: 'For administrators', d: 'Staff, departments, beds, billing, audit logs and hospital-wide reporting.', to: '/portal/admin', cta: 'Open admin console', icon: Users },
          ].map((x) => (
            <div key={x.t} className="card card-hover p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><x.icon size={20} /></span>
              <h3 className="mt-4 text-[15px] font-bold text-slate-900">{x.t}</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600">{x.d}</p>
              <Link to={x.to} className="btn btn-ghost btn-sm mt-4">{x.cta} <ArrowRight size={13} /></Link>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
