import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BadgeCheck, CalendarDays, Clock, Filter, GraduationCap, Languages, MapPin,
  Search, Star, Stethoscope, Video, Wallet,
} from 'lucide-react'
import { PageHero } from '../components/PublicShell'
import { Badge, Btn, Empty, Img, SectionHead, Select, Tabs } from '../components/ui'
import { DEPARTMENTS, DOCTORS, IMG, type Doctor } from '../data/mock'
import { cn } from '../components/ui'

export default function Doctors() {
  const [dept, setDept] = useState('All')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('rating')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [active, setActive] = useState<Doctor | null>(null)

  const list = useMemo(() => {
    let l = DOCTORS.filter((d) => (dept === 'All' || d.dept === dept))
    if (q.trim()) {
      const s = q.toLowerCase()
      l = l.filter((d) => (d.name + d.dept + d.role + d.qual).toLowerCase().includes(s))
    }
    if (sort === 'rating') l = [...l].sort((a, b) => b.rating - a.rating)
    if (sort === 'fee') l = [...l].sort((a, b) => a.fee - b.fee)
    if (sort === 'exp') l = [...l].sort((a, b) => parseInt(b.exp) - parseInt(a.exp))
    if (sort === 'name') l = [...l].sort((a, b) => a.name.localeCompare(b.name))
    return l
  }, [dept, q, sort])

  return (
    <>
      <PageHero
        eyebrow="Our specialists"
        title={<>Meet the clinicians behind <span className="text-teal-600">SmartMed</span></>}
        sub="Board-certified specialists across seven departments. Filter by department, compare experience and fees, then book an in-person or video consultation."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/appointments" className="btn btn-primary btn-lg"><CalendarDays size={15} /> Book an appointment</Link>
          <span className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-600">
            <BadgeCheck size={15} className="text-teal-600" /> {DOCTORS.length} specialists available this week
          </span>
        </div>
      </PageHero>

      {/* filter bar */}
      <section className="sticky top-[62px] z-30 border-b border-slate-200 bg-white/95 py-3.5 backdrop-blur">
        <div className="container-x flex flex-wrap items-center gap-3">
          <div className="relative min-w-[210px] flex-1">
            <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by doctor name, speciality or qualification"
              className="input input-icon" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <Select value={sort} onChange={(e: any) => setSort(e.target.value)} className="input w-[168px]">
              <option value="rating">Highest rated</option>
              <option value="exp">Most experienced</option>
              <option value="fee">Lowest consultation fee</option>
              <option value="name">Name (A–Z)</option>
            </Select>
          </div>
          <div className="hidden gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 sm:flex">
            {(['grid', 'list'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={cn('rounded-md px-3 py-1.5 text-[11.5px] font-semibold capitalize transition', view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="container-x mt-3 flex flex-wrap gap-1.5">
          {['All', ...DEPARTMENTS.map((d) => d.name)].map((d) => (
            <button key={d} onClick={() => setDept(d)}
              className={cn('rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition',
                dept === d ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700')}>
              {d}
            </button>
          ))}
        </div>
      </section>

      {/* results */}
      <section className="container-x py-12">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-slate-600">
            Showing <strong className="text-slate-900">{list.length}</strong> of {DOCTORS.length} specialists
            {dept !== 'All' && <> in <strong className="text-slate-900">{dept}</strong></>}
          </p>
          {(dept !== 'All' || q) && (
            <button onClick={() => { setDept('All'); setQ('') }} className="text-[12px] font-semibold text-brand-600 hover:underline">Clear filters</button>
          )}
        </div>

        {list.length === 0 ? (
          <div className="mt-8"><Empty title="No specialists match those filters" sub="Try a different department or clear the search." icon={Stethoscope} /></div>
        ) : view === 'grid' ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((d) => (
              <article key={d.id} className="card card-hover overflow-hidden">
                <div className="relative">
                  <Img src={d.img} alt={d.name} ratio="16/11" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-bold text-slate-700 shadow-sm">{d.id}</span>
                  <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[10.5px] font-bold text-amber-950 shadow-sm">
                    <Star size={11} fill="currentColor" /> {d.rating}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-[15px] font-bold text-slate-900">{d.name}</h3>
                  <p className="mt-1 text-[12.5px] font-semibold text-brand-600">{d.role}</p>
                  <p className="mt-2.5 flex items-center gap-2 text-[11.5px] text-slate-500">
                    <GraduationCap size={13} /> {d.qual}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px]">
                    <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-slate-600"><Clock size={12} /> {d.exp}</span>
                    <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-slate-600"><Wallet size={12} /> ₹{d.fee}</span>
                  </div>
                  <p className="mt-2.5 flex items-center gap-2 text-[11.5px] text-slate-500"><MapPin size={13} /> {d.dept} · {d.room}</p>
                  <p className="mt-1.5 flex items-center gap-2 text-[11.5px] text-slate-500"><Languages size={13} /> {d.lang}</p>
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {d.days.split(', ').map((day) => <span key={day} className="chip chip-sm">{day}</span>)}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link to={`/appointments?doctor=${encodeURIComponent(d.name)}`} className="btn btn-primary btn-sm flex-1">Book appointment</Link>
                    <button onClick={() => setActive(d)} className="btn btn-ghost btn-sm">Profile</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-7 card overflow-hidden" style={{ padding: 0 }}>
            {list.map((d, i) => (
              <div key={d.id} className={cn('flex flex-wrap items-center gap-4 p-4', i > 0 && 'border-t border-slate-100')}>
                <Img src={d.img} alt={d.name} className="h-14 w-14 shrink-0 rounded-xl" ratio="1/1" />
                <div className="min-w-[170px] flex-1">
                  <p className="text-[13.5px] font-bold text-slate-900">{d.name}</p>
                  <p className="text-[11.5px] text-slate-500">{d.role} · {d.dept}</p>
                </div>
                <div className="min-w-[140px]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Availability</p>
                  <p className="text-[12px] text-slate-700">{d.days}</p>
                </div>
                <div className="min-w-[90px]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fee</p>
                  <p className="text-[12px] font-semibold text-slate-900">₹{d.fee}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star size={13} className="text-amber-500" fill="currentColor" />
                  <span className="text-[12px] font-semibold text-slate-700">{d.rating}</span>
                </div>
                <div className="flex gap-2">
                  <Link to={`/appointments?doctor=${encodeURIComponent(d.name)}`} className="btn btn-primary btn-sm">Book</Link>
                  <button onClick={() => setActive(d)} className="btn btn-ghost btn-sm">View</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* speciality banner */}
      <section className="border-y border-slate-200 bg-slate-50 py-14">
        <div className="container-x grid items-center gap-8 lg:grid-cols-2">
          <Img src={IMG.heroDoctor} alt="Specialist consulting with a patient" ratio="16/10" className="rounded-2xl" />
          <div>
            <p className="eyebrow">Second opinions & referrals</p>
            <h2 className="mt-3 text-[27px] font-extrabold leading-tight text-slate-900">Not sure which department you need?</h2>
            <p className="mt-3.5 text-[13.5px] leading-relaxed text-slate-600">
              Describe your symptoms to the AI Symptom Assistant. It will suggest the most relevant department and an urgency
              level so your booking reaches the right specialist first time — with a clear note that it is guidance, not a diagnosis.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/ai-tools" className="btn btn-teal">Open AI Symptom Assistant <ArrowRight size={14} /></Link>
              <Link to="/appointments" className="btn btn-ghost">See all slots</Link>
            </div>
          </div>
        </div>
      </section>

      {/* doctor modal */}
      {active && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setActive(null)}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl anim-up sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <Img src={active.img} alt={active.name} ratio="16/7" />
              <button onClick={() => setActive(null)} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-slate-600 shadow-sm">✕</button>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[19px] font-extrabold text-slate-900">{active.name}</h3>
                  <p className="mt-1 text-[13px] font-semibold text-brand-600">{active.role} · {active.dept}</p>
                  <p className="mt-1.5 text-[12px] text-slate-500">{active.qual} · {active.exp} experience</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2">
                  <Star size={14} className="text-amber-500" fill="currentColor" />
                  <span className="text-[13px] font-bold text-amber-900">{active.rating}</span>
                  <span className="text-[11px] text-amber-700">rating</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { l: 'Consultation fee', v: `₹${active.fee}` },
                  { l: 'Consulting room', v: active.room },
                  { l: 'Languages', v: active.lang },
                ].map((x) => (
                  <div key={x.l} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{x.l}</p>
                    <p className="mt-1 text-[12.5px] font-semibold text-slate-800">{x.v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <p className="text-[12.5px] font-bold text-slate-900">Consulting days</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {active.days.split(', ').map((d) => <Badge key={d} tone="brand">{d}</Badge>)}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-[12.5px] font-bold text-slate-900">Available slots</p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {active.slots.map((s) => (
                    <Link key={s} to={`/appointments?doctor=${encodeURIComponent(active.name)}&time=${encodeURIComponent(s)}`}
                      className="rounded-lg border border-slate-200 px-3 py-2.5 text-center text-[12px] font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">
                      {s}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-[12px] leading-relaxed text-slate-600">
                  Consultation includes clinical examination, diagnosis, a digital prescription if required, and lab test
                  recommendations. Follow-up within 7 days is included at no extra cost.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link to={`/appointments?doctor=${encodeURIComponent(active.name)}`} className="btn btn-primary flex-1"><CalendarDays size={14} /> Book in-person</Link>
                <Link to={`/appointments?doctor=${encodeURIComponent(active.name)}&type=Video Consultation`} className="btn btn-teal flex-1"><Video size={14} /> Video consult</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
