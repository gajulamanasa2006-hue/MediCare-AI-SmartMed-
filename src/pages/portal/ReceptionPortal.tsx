import React from 'react'
import {
  LayoutDashboard, Users, UserPlus, CalendarDays, ClipboardList, Ambulance,
  ListOrdered, Clock, Search as SearchIcon, Ticket, Phone, CheckCircle2,
  BedDouble, AlertTriangle, ArrowRight, UserCheck, RefreshCw, XCircle, Plus,
} from 'lucide-react'
import { PortalLayout, Panel, KpiRow } from '../../components/PortalLayout'
import {
  Card, CardHead, Badge, Btn, Stat, Field, Input, Textarea, Select, Search,
  Tabs, Table, Modal, Empty, statusTone, KV,
} from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { DEPARTMENTS, DOCTORS, QUEUE, BEDS, APPOINTMENTS, PATIENT } from '../../data/mock'

type View = 'dashboard' | 'directory' | 'register' | 'appointments' | 'checkin' | 'emergency' | 'queue' | 'schedules'

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, '0')

function useNow() {
  const [now, setNow] = React.useState(() => new Date(2026, 9, 4, 9, 12, 0))
  React.useEffect(() => {
    const t = window.setInterval(() => setNow((d) => new Date(d.getTime() + 1000)), 1000)
    return () => window.clearInterval(t)
  }, [])
  return now
}

const clock = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

/* ------------------------------------------------------------------ */
/* dashboard                                                           */
/* ------------------------------------------------------------------ */

function Dashboard({ go }: { go: (v: View) => void }) {
  const { queue } = useApp()
  const now = useNow()
  const waiting = queue.filter((q: any) => q.status === 'WAITING')
  const checked = queue.filter((q: any) => q.status === 'CHECKED-IN')
  const done = queue.filter((q: any) => q.status === 'COMPLETED')

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 text-[13px] font-semibold text-emerald-800">
        Welcome back, Karthik S — Receptionist. Front desk is open. Today is Tuesday, 04 October 2026.
      </div>

      <KpiRow
        items={[
          { label: "Today's Appointments", value: 12, sub: '4 video · 8 in-person', icon: CalendarDays, tone: 'brand' },
          { label: 'Checked-In', value: checked.length + 6, sub: 'Awaiting consultation', icon: UserCheck, tone: 'teal' },
          { label: 'Waiting', value: waiting.length, sub: 'Live token queue', icon: ListOrdered, tone: 'amber' },
          { label: 'Completed', value: done.length + 3, sub: 'Consultations closed', icon: CheckCircle2, tone: 'green' },
          { label: 'New Registrations', value: 4, sub: 'Today at front desk', icon: UserPlus, tone: 'purple' },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHead icon={Ticket} title="Quick Actions" sub="Front-desk shortcuts" tone="blue" />
          <div className="space-y-2.5">
            {[
              { l: 'Register New Patient', i: UserPlus, t: 'green', v: 'register' as View, d: 'Create a new UHID record' },
              { l: 'Book Appointment', i: CalendarDays, t: 'blue', v: 'appointments' as View, d: 'Slot a doctor for a patient' },
              { l: 'Check-In Patient', i: UserCheck, t: 'teal', v: 'checkin' as View, d: 'Issue a token and queue' },
              { l: 'Emergency Walk-In', i: Ambulance, t: 'red', v: 'emergency' as View, d: 'Register an unscheduled case' },
            ].map((a) => (
              <button
                key={a.l}
                onClick={() => go(a.v)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <a.i size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-slate-800">{a.l}</span>
                  <span className="block truncate text-[11px] text-slate-500">{a.d}</span>
                </span>
                <ArrowRight size={14} className="shrink-0 text-slate-400" />
              </button>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHead
            icon={ListOrdered}
            title="Waiting Queue"
            sub="Live token board — demo data"
            tone="amber"
            right={<Btn size="sm" variant="ghost" onClick={() => go('queue')}>Open Queue</Btn>}
          />
          {waiting.length === 0 ? (
            <Empty title="Queue is clear" sub="No patients are currently waiting." icon={CheckCircle2} />
          ) : (
            <Table head={['Token', 'Patient', 'Department', 'Doctor', 'Waited', 'Priority', 'Status']}>
              {queue.map((q: any) => (
                <tr key={q.token} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pl-4 font-mono text-[12px] font-bold text-brand-700">{q.token}</td>
                  <td className="py-3 text-[13px] font-semibold">{q.patient}</td>
                  <td className="py-3 text-[12px] text-slate-600">{q.dept}</td>
                  <td className="py-3 text-[12px] text-slate-600">{q.doctor}</td>
                  <td className="py-3 text-[12px] text-slate-500">{q.waited}</td>
                  <td className="py-3"><Badge tone={q.priority === 'Urgent' ? 'amber' : 'slate'}>{q.priority}</Badge></td>
                  <td className="py-3 pr-4"><Badge tone={statusTone(q.status)}>{q.status}</Badge></td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHead icon={Clock} title="Front Desk Clock" sub="Live session time" tone="teal" />
          <p className="font-mono text-3xl font-extrabold tracking-tight text-slate-800">{clock(now)}</p>
          <p className="mt-1 text-[12px] text-slate-500">Tuesday, 04 October 2026 · Shift 08:00–16:00</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-500">Counters Open</p>
              <p className="text-lg font-extrabold text-slate-800">3 / 4</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-500">Avg. Wait</p>
              <p className="text-lg font-extrabold text-slate-800">7 min</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHead icon={BedDouble} title="Bed Availability" sub="Real-time hospital census" tone="purple" />
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 p-3"><p className="text-[11px] font-semibold text-slate-500">Total</p><p className="text-xl font-extrabold">{BEDS.total}</p></div>
            <div className="rounded-xl border border-slate-200 p-3"><p className="text-[11px] font-semibold text-slate-500">Available</p><p className="text-xl font-extrabold text-emerald-600">{BEDS.available}</p></div>
            <div className="rounded-xl border border-slate-200 p-3"><p className="text-[11px] font-semibold text-slate-500">Occupied</p><p className="text-xl font-extrabold text-amber-600">{BEDS.occupied}</p></div>
            <div className="rounded-xl border border-slate-200 p-3"><p className="text-[11px] font-semibold text-slate-500">ICU</p><p className="text-xl font-extrabold text-rose-600">{BEDS.icuUsed}/{BEDS.icu}</p></div>
          </div>
        </Card>

        <Card>
          <CardHead icon={AlertTriangle} title="Front-Desk Alerts" sub="Needs attention" tone="red" />
          <ul className="space-y-2.5 text-[12px]">
            {[
              { t: 'Cardiology queue above threshold (4 waiting)', tone: 'amber' },
              { t: '2 lab reports pending dispatch to patients', tone: 'blue' },
              { t: 'Emergency walk-in registered at 11:20 AM', tone: 'red' },
              { t: 'Dr. Kavya Rao running 10 min late — notify parents', tone: 'purple' },
            ].map((a) => (
              <li key={a.t} className="flex items-start gap-2">
                <Badge tone={a.tone as any}>•</Badge>
                <span className="text-slate-600">{a.t}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* patient directory                                                   */
/* ------------------------------------------------------------------ */

function Directory() {
  const { newPatients } = useApp()
  const [q, setQ] = React.useState('')
  const [sel, setSel] = React.useState<any>(null)

  const seed = [
    { id: 'SMN-2026-000001', name: 'Radhika D C', age: 20, gender: 'Female', blood: 'O+', dept: 'General Medicine', mobile: '+91 99999 00001', condition: 'Out-Patient', allergies: 'Peanuts, Brufen, Penicillin' },
    { id: 'SMN-2026-000002', name: 'Ananya Sharma', age: 34, gender: 'Female', blood: 'B+', dept: 'Cardiology', mobile: '+91 99999 00002', condition: 'Under Observation', allergies: 'None recorded' },
    { id: 'SMN-2026-000003', name: 'Rahul Verma', age: 7, gender: 'Male', blood: 'A+', dept: 'Pediatrics', mobile: '+91 99999 00003', condition: 'Out-Patient', allergies: 'Sulfa drugs' },
    { id: 'SMN-2026-000004', name: 'Imran Baig', age: 52, gender: 'Male', blood: 'AB+', dept: 'General Medicine', mobile: '+91 99999 00004', condition: 'In-Patient', allergies: 'None recorded' },
  ]
  const all = [...seed, ...newPatients]
  const rows = all.filter((p: any) =>
    !q || `${p.name} ${p.id} ${p.mobile} ${p.dept}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-5">
      <Card>
        <CardHead
          icon={Users}
          title={`Patients Directory (${rows.length})`}
          sub="Search by name, UHID or mobile number"
          tone="blue"
          right={<Btn size="sm" variant="soft">Export CSV</Btn>}
        />
        <div className="mb-4 max-w-md"><Search placeholder="e.g. Radhika, SMN-2026-000001, 99999" value={q} onChange={setQ} /></div>
        <Table head={['UHID', 'Patient', 'Age / Gender', 'Blood', 'Department', 'Mobile', 'Status', 'Action']}>
          {rows.map((p: any) => (
            <tr key={p.id} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pl-4 font-mono text-[11px] font-semibold text-slate-500">{p.id}</td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">
                    {String(p.name).split(' ').map((x: string) => x[0]).slice(0, 2).join('')}
                  </span>
                  <span className="text-[13px] font-semibold">{p.name}</span>
                </div>
              </td>
              <td className="py-3 text-[12px] text-slate-600">{p.age}y / {p.gender}</td>
              <td className="py-3"><Badge tone="red">{p.blood}</Badge></td>
              <td className="py-3 text-[12px] text-slate-600">{p.dept}</td>
              <td className="py-3 text-[12px] text-slate-600">{p.mobile}</td>
              <td className="py-3"><Badge tone="green">{p.condition}</Badge></td>
              <td className="py-3 pr-4">
                <Btn size="sm" variant="ghost" onClick={() => setSel(p)}>View Record</Btn>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={!!sel} onClose={() => setSel(null)} title="Patient Record" sub={sel ? `${sel.name} · ${sel.id}` : ''} wide>
        {sel && (
          <div className="space-y-4">
            <KV
              items={[
                { k: 'UHID', v: sel.id },
                { k: 'Age / Gender', v: `${sel.age} / ${sel.gender}` },
                { k: 'Blood Group', v: sel.blood },
                { k: 'Mobile', v: sel.mobile },
                { k: 'Department', v: sel.dept },
                { k: 'Status', v: sel.condition },
              ]}
              cols={3}
            />
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-rose-700">Known Allergies</p>
              <p className="mt-1 text-[13px] font-semibold text-rose-800">{sel.allergies}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-600">
              Reception staff can view demographics and appointment history. Clinical notes, prescriptions and lab
              results follow role-based access control and open only inside the respective clinical portal.
            </div>
            <div className="flex flex-wrap gap-2">
              <Btn size="sm">Book Appointment</Btn>
              <Btn size="sm" variant="soft">Check-In</Btn>
              <Btn size="sm" variant="ghost">Print Registration Slip</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* register patient                                                    */
/* ------------------------------------------------------------------ */

function Register() {
  const { addPatient, toast } = useApp()
  const [f, setF] = React.useState({
    first: '', last: '', dob: '2006-04-11', gender: 'Female', blood: 'O+', lang: 'English',
    mobile: '+91-', email: '', aadhaar: '', address: '',
    height: '152', weight: '47', contact: '', contactMobile: '+91-', insurer: 'Star Health Assure', policy: 'POL-99887766A',
    allergies: '', chronic: '', vaccines: 'COVID-19, Hepatitis B, Influenza',
  })
  const [created, setCreated] = React.useState<any>(null)
  const set = (k: string) => (e: any) => setF((s) => ({ ...s, [k]: e.target.value }))
  const bmi = f.height && f.weight ? (Number(f.weight) / Math.pow(Number(f.height) / 100, 2)).toFixed(1) : '—'

  const submit = () => {
    if (!f.first.trim() || !f.last.trim()) { toast('First and last name are required', 'error'); return }
    const id = `SMN-2026-${pad(1000 + Math.floor(Math.random() * 8999))}`
    const rec = {
      id, name: `${f.first} ${f.last}`.trim(), age: new Date(2026, 9, 4).getFullYear() - new Date(f.dob).getFullYear(),
      gender: f.gender, mobile: f.mobile.replace(/^\+91-?$/, '+91 98765 43210'), email: f.email || 'not.provided@smartmed.health',
      blood: f.blood, dept: 'General Medicine', allergies: f.allergies || 'None recorded',
      condition: 'Out-Patient', at: '04 Oct 2026 · Front Desk',
    }
    addPatient(rec)
    setCreated(rec)
    toast(`${rec.name} registered successfully`, 'success')
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHead icon={UserPlus} title="Register New Patient" sub="Front-desk intake — creates a permanent UHID in this demo" tone="green" />
        <div className="space-y-6">
          <section>
            <p className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-slate-500">
              <span className="grid h-5 w-5 place-items-center rounded bg-brand-600 text-[10px] text-white">1</span> Personal Details
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="First Name" required><Input value={f.first} onChange={set('first')} placeholder="e.g. Radhika" /></Field>
              <Field label="Last Name" required><Input value={f.last} onChange={set('last')} placeholder="e.g. D C" /></Field>
              <Field label="Date of Birth" required><Input type="date" value={f.dob} onChange={set('dob')} /></Field>
              <Field label="Gender" required>
                <Select value={f.gender} onChange={set('gender')}><option>Female</option><option>Male</option><option>Other</option></Select>
              </Field>
              <Field label="Blood Group">
                <Select value={f.blood} onChange={set('blood')}>{['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((b) => <option key={b}>{b}</option>)}</Select>
              </Field>
              <Field label="Preferred Language">
                <Select value={f.lang} onChange={set('lang')}>{['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam'].map((l) => <option key={l}>{l}</option>)}</Select>
              </Field>
              <Field label="Mobile Number" required hint="Used for OTP and appointment alerts">
                <Input value={f.mobile} onChange={set('mobile')} placeholder="+91-9876543210" />
              </Field>
              <Field label="Email Address" hint="Patient portal invitations are sent here">
                <Input value={f.email} onChange={set('email')} placeholder="patient@example.com" />
              </Field>
              <Field label="Aadhaar Number (optional)" hint="Demo only — encrypted at rest in production">
                <Input value={f.aadhaar} onChange={set('aadhaar')} placeholder="XXXX-XXXX-XXXX" />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Residential Address"><Textarea rows={2} value={f.address} onChange={set('address')} placeholder="House / Street / Locality / City / PIN" /></Field>
            </div>
          </section>

          <section>
            <p className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-slate-500">
              <span className="grid h-5 w-5 place-items-center rounded bg-emerald-600 text-[10px] text-white">2</span> Vitals Baseline
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Height (cm)"><Input value={f.height} onChange={set('height')} /></Field>
              <Field label="Weight (kg)"><Input value={f.weight} onChange={set('weight')} /></Field>
              <Field label="Calculated BMI">
                <div className="flex items-center gap-2">
                  <Input readOnly value={bmi} />
                  <Badge tone={Number(bmi) > 24.9 ? 'amber' : Number(bmi) < 18.5 ? 'blue' : 'green'}>
                    {Number(bmi) > 24.9 ? 'Above range' : Number(bmi) < 18.5 ? 'Below range' : 'Normal range'}
                  </Badge>
                </div>
              </Field>
            </div>
          </section>

          <section>
            <p className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-slate-500">
              <span className="grid h-5 w-5 place-items-center rounded bg-rose-600 text-[10px] text-white">3</span> Emergency Contacts &amp; Insurance
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Emergency Contact Name"><Input value={f.contact} onChange={set('contact')} placeholder="e.g. Deepak D C" /></Field>
              <Field label="Emergency Contact Mobile"><Input value={f.contactMobile} onChange={set('contactMobile')} /></Field>
              <Field label="Insurance Provider"><Input value={f.insurer} onChange={set('insurer')} /></Field>
              <Field label="Policy / TPA Card Number"><Input value={f.policy} onChange={set('policy')} /></Field>
            </div>
          </section>

          <section>
            <p className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-slate-500">
              <span className="grid h-5 w-5 place-items-center rounded bg-amber-500 text-[10px] text-white">4</span> Allergies &amp; Medical History
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Known Allergies" hint="Comma separated"><Input value={f.allergies} onChange={set('allergies')} placeholder="e.g. PENICILLIN, BRUFEN" /></Field>
              <Field label="Chronic Diseases / Medical History"><Input value={f.chronic} onChange={set('chronic')} placeholder="e.g. Iron-deficiency anaemia" /></Field>
              <Field label="Vaccination Records"><Input value={f.vaccines} onChange={set('vaccines')} /></Field>
            </div>
          </section>

          <div className="rounded-xl border border-brand-100 bg-brand-50/70 p-3 text-[12px] text-brand-800">
            <b>Patient Portal Access:</b> the account will be created in a <i>Not Activated</i> state. Send an activation
            link to the patient's email or mobile to let them set their own portal password. Front-desk staff never see
            the patient's password.
          </div>

          <div className="flex flex-wrap gap-3">
            <Btn onClick={submit}><UserPlus size={15} /> Register Patient</Btn>
            <Btn variant="ghost">Cancel</Btn>
          </div>
        </div>
      </Card>

      {created && (
        <Card className="border-emerald-200">
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[13px] font-semibold text-emerald-800">
            ✓ Patient record created successfully — {created.id} is now live in the demo register.
          </div>
          <CardHead icon={UserCheck} title="Patient Summary" sub="Confirm with the patient before they leave the desk" tone="teal" />
          <KV
            items={[
              { k: 'Patient', v: created.name },
              { k: 'UHID', v: created.id },
              { k: 'Mobile', v: created.mobile },
              { k: 'Blood Group', v: created.blood },
              { k: 'Age / Gender', v: `${created.age} / ${created.gender}` },
              { k: 'Department', v: created.dept },
            ]}
            cols={3}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn size="sm" variant="soft"><Phone size={14} /> Send Activation Link</Btn>
            <Btn size="sm" variant="ghost" onClick={() => setCreated(null)}>Register Another</Btn>
          </div>
        </Card>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* appointments                                                        */
/* ------------------------------------------------------------------ */

function Appointments() {
  const { appts, addAppt, updateAppt, toast } = useApp()
  const [tab, setTab] = React.useState('all')
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    patient: 'Radhika D C', dept: DEPARTMENTS[0].name, doctor: DOCTORS[0].name,
    date: '2026-10-06', time: DOCTORS[0].slots[0], type: 'In-Person', reason: '',
  })
  const set = (k: string) => (e: any) => setForm((s) => ({ ...s, [k]: e.target.value }))
  const docs = DOCTORS.filter((d) => d.dept === form.dept)
  const list = appts.filter((a: any) => tab === 'all' || a.status === tab)

  const book = () => {
    const id = `APT-2026-${pad(1000 + Math.floor(Math.random() * 8999))}`
    addAppt({
      id, patient: form.patient, doctor: form.doctor, dept: form.dept, date: form.date, time: form.time,
      type: form.type, status: 'BOOKED', reason: form.reason || 'Consultation', token: `T-${pad(10 + Math.floor(Math.random() * 80))}`,
    })
    toast(`Appointment ${id} booked and confirmation sent`, 'success')
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHead
          icon={CalendarDays}
          title="Appointment Bookings"
          sub={`${appts.length} appointments in the system`}
          tone="blue"
          right={<Btn size="sm" onClick={() => setOpen(true)}><Plus size={14} /> New Appointment</Btn>}
        />
        <div className="mb-4">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'all', label: 'All', count: appts.length },
              { id: 'BOOKED', label: 'Booked', count: appts.filter((a: any) => a.status === 'BOOKED').length },
              { id: 'CHECKED-IN', label: 'Checked-In', count: appts.filter((a: any) => a.status === 'CHECKED-IN').length },
              { id: 'COMPLETED', label: 'Completed', count: appts.filter((a: any) => a.status === 'COMPLETED').length },
              { id: 'CANCELLED', label: 'Cancelled', count: appts.filter((a: any) => a.status === 'CANCELLED').length },
            ]}
          />
        </div>
        <Table head={['Appointment', 'Patient', 'Doctor', 'Department', 'Date', 'Time', 'Type', 'Status', 'Action']}>
          {list.map((a: any) => (
            <tr key={a.id} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pl-4 font-mono text-[11px] font-semibold text-slate-500">{a.id}</td>
              <td className="py-3 text-[13px] font-semibold">{a.patient}</td>
              <td className="py-3 text-[12px] text-slate-600">{a.doctor}</td>
              <td className="py-3 text-[12px] text-slate-600">{a.dept}</td>
              <td className="py-3 text-[12px] text-slate-600">{a.date}</td>
              <td className="py-3 text-[12px] text-slate-600">{a.time}</td>
              <td className="py-3"><Badge tone={a.type === 'Emergency' ? 'red' : a.type === 'Video Consultation' ? 'teal' : 'blue'}>{a.type}</Badge></td>
              <td className="py-3"><Badge tone={statusTone(a.status)}>{a.status}</Badge></td>
              <td className="py-3 pr-4">
                <div className="flex gap-1.5">
                  {a.status === 'BOOKED' && (
                    <>
                      <Btn size="sm" variant="ghost" onClick={() => { updateAppt(a.id, { status: 'CHECKED-IN' }); toast(`${a.patient} checked in — token issued`, 'info') }}>Check-In</Btn>
                      <Btn size="sm" variant="danger-soft" onClick={() => { updateAppt(a.id, { status: 'CANCELLED' }); toast(`${a.id} cancelled`, 'warn') }}>Cancel</Btn>
                    </>
                  )}
                  {a.status !== 'BOOKED' && (
                    <Btn size="sm" variant="ghost" onClick={() => { updateAppt(a.id, { time: '05:30 PM' }); toast(`${a.id} rescheduled to 05:30 PM`, 'info') }}><RefreshCw size={13} /> Reschedule</Btn>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Book Appointment" sub="Department → doctor → slot → confirm" wide>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Patient"><Select value={form.patient} onChange={set('patient')}><option>Radhika D C</option><option>Ananya Sharma</option><option>Rahul Verma</option><option>Imran Baig</option></Select></Field>
          <Field label="Department"><Select value={form.dept} onChange={(e: any) => setForm((s) => ({ ...s, dept: e.target.value, doctor: (DOCTORS.find((d) => d.dept === e.target.value) || DOCTORS[0]).name }))}>{DEPARTMENTS.map((d) => <option key={d.code}>{d.name}</option>)}</Select></Field>
          <Field label="Doctor"><Select value={form.doctor} onChange={set('doctor')}>{docs.map((d) => <option key={d.id}>{d.name}</option>)}</Select></Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={set('date')} /></Field>
          <Field label="Available Slot"><Select value={form.time} onChange={set('time')}>{((docs[0]?.slots) || ['09:00 AM']).map((s) => <option key={s}>{s}</option>)}</Select></Field>
          <Field label="Appointment Type"><Select value={form.type} onChange={set('type')}><option>In-Person</option><option>Video Consultation</option><option>Emergency</option></Select></Field>
        </div>
        <div className="mt-4">
          <Field label="Reason for Visit"><Textarea rows={2} value={form.reason} onChange={set('reason')} placeholder="e.g. Persistent fever for 3 days" /></Field>
        </div>
        <div className="mt-5 flex gap-3">
          <Btn onClick={book}><CalendarDays size={15} /> Confirm Booking</Btn>
          <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
        </div>
      </Modal>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* check-in / intake                                                   */
/* ------------------------------------------------------------------ */

function CheckIn() {
  const { queue, addQueue, setQueueStatus, toast } = useApp()
  const [token, setToken] = React.useState('')
  const [sel, setSel] = React.useState<any>(null)

  const seedQueue = [
    { token: 'T-02', patient: 'Ananya Sharma', dept: 'Cardiology', doctor: 'Dr. Imran Qureshi', waited: '12 min', priority: 'Urgent' },
    { token: 'T-07', patient: 'Rahul Verma', dept: 'Pediatrics', doctor: 'Dr. Kavya Rao', waited: '6 min', priority: 'Routine' },
  ]
  const all = queue.length ? queue : seedQueue

  const issue = () => {
    const t = token.trim() || `T-${pad(20 + Math.floor(Math.random() * 70))}`
    addQueue({ token: t, patient: sel?.patient || 'Walk-in Patient', dept: sel?.dept || 'General Medicine', doctor: sel?.doctor || 'Dr. Priya Nair', waited: '0 min', priority: 'Routine' })
    toast(`Token ${t} issued — patient added to the waiting queue`, 'success')
    setToken('')
    setSel(null)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHead icon={UserCheck} title="Patient Check-In" sub="Mark arrival and issue a queue token" tone="teal" />
        <div className="space-y-4">
          <Field label="Scan / Enter UHID or Appointment ID"><Input placeholder="e.g. APT-2026-0001" /></Field>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Selected Appointment</p>
            <p className="mt-1 text-[13px] font-semibold text-slate-800">{sel ? `${sel.patient} · ${sel.dept}` : 'None selected — pick one from the list'}</p>
          </div>
          <Field label="Token Number (auto if blank)"><Input value={token} onChange={(e: any) => setToken(e.target.value)} placeholder="T-24" /></Field>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={issue}><Ticket size={15} /> Check-In &amp; Issue Token</Btn>
            <Btn variant="ghost">Print Slip</Btn>
          </div>
        </div>
      </Card>

      <Card>
        <CardHead icon={ListOrdered} title="Today's Sessions" sub="Tap a row to load it into check-in" tone="amber" />
        <Table head={['Token', 'Patient', 'Doctor', 'Status', 'Action']}>
          {all.map((q: any) => (
            <tr key={q.token} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pl-4 font-mono text-[12px] font-bold text-brand-700">{q.token}</td>
              <td className="py-3 text-[13px] font-semibold">{q.patient}</td>
              <td className="py-3 text-[12px] text-slate-600">{q.doctor}</td>
              <td className="py-3"><Badge tone={statusTone(q.status || 'WAITING')}>{q.status || 'WAITING'}</Badge></td>
              <td className="py-3 pr-4">
                <div className="flex gap-1.5">
                  <Btn size="sm" variant="ghost" onClick={() => setSel(q)}>Select</Btn>
                  <Btn size="sm" variant="teal-soft" onClick={() => { setQueueStatus(q.token, 'CHECKED-IN'); toast(`${q.patient} marked as checked-in`, 'success') }}>Check-In</Btn>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* emergency walk-in                                                   */
/* ------------------------------------------------------------------ */

function EmergencyWalkIn() {
  const { emergencies, addEmergency, toast } = useApp()
  const [f, setF] = React.useState({ patient: '', type: 'Road Traffic Accident', location: '', priority: 'HIGH', dept: 'Emergency & Trauma', action: 'Trauma team paged, resuscitation bay on standby' })
  const set = (k: string) => (e: any) => setF((s) => ({ ...s, [k]: e.target.value }))

  const create = () => {
    if (!f.patient.trim()) { toast('Patient name is required', 'error'); return }
    const id = `EMG-2026-${pad(1000 + Math.floor(Math.random() * 8999))}`
    addEmergency({ ...f, id, reported: 'Just now', ambulance: 'To be assigned', eta: '—', status: 'On Scene', hospital: 'SmartMed — Main Campus', priority: f.priority })
    toast(`${id} logged — emergency desk notified`, 'success')
    setF((s) => ({ ...s, patient: '', location: '' }))
  }

  return (
    <div className="space-y-5">
      <Card className="border-rose-200">
        <CardHead icon={Ambulance} title="🚨 Emergency Walk-In Registration" sub="Unscheduled arrivals — flag the case for triage immediately" tone="red" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Patient Name" required><Input value={f.patient} onChange={set('patient')} placeholder="e.g. Mahesh Gupta" /></Field>
          <Field label="Emergency Type">
            <Select value={f.type} onChange={set('type')}>
              {['Road Traffic Accident', 'Cardiac — Chest Pain', 'Respiratory Distress', 'Stroke Symptoms', 'Acute Abdominal Pain', 'Minor Laceration', 'Fever / Infection', 'Other'].map((x) => <option key={x}>{x}</option>)}
            </Select>
          </Field>
          <Field label="Location / How they arrived"><Input value={f.location} onChange={set('location')} placeholder="e.g. Brought by family from Indiranagar" /></Field>
          <Field label="Triage Priority"><Select value={f.priority} onChange={set('priority')}>{['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => <option key={p}>{p}</option>)}</Select></Field>
          <Field label="Target Department"><Select value={f.dept} onChange={set('dept')}>{DEPARTMENTS.map((d) => <option key={d.code}>{d.name}</option>)}</Select></Field>
          <Field label="Immediate Action"><Input value={f.action} onChange={set('action')} /></Field>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Btn variant="danger" onClick={create}><Ambulance size={15} /> Log Emergency Case</Btn>
          <Btn variant="ghost">Call Ambulance Desk</Btn>
        </div>
      </Card>

      <Card>
        <CardHead icon={ClipboardList} title={`Active Emergency Cases (${emergencies.length})`} sub="Live board shared with the emergency desk" tone="amber" />
        <Table head={['Case', 'Patient', 'Type', 'Priority', 'Department', 'Ambulance', 'ETA', 'Status']}>
          {emergencies.map((e: any) => (
            <tr key={e.id} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pl-4 font-mono text-[11px] font-semibold text-slate-500">{e.id}</td>
              <td className="py-3 text-[13px] font-semibold">{e.patient}</td>
              <td className="py-3 text-[12px] text-slate-600">{e.type}</td>
              <td className="py-3"><Badge tone={e.priority === 'CRITICAL' ? 'red' : e.priority === 'HIGH' ? 'amber' : e.priority === 'MEDIUM' ? 'blue' : 'slate'}>{e.priority}</Badge></td>
              <td className="py-3 text-[12px] text-slate-600">{e.dept}</td>
              <td className="py-3 text-[12px] text-slate-600">{e.ambulance}</td>
              <td className="py-3 text-[12px] text-slate-600">{e.eta}</td>
              <td className="py-3 pr-4"><Badge tone={statusTone(e.status)}>{e.status}</Badge></td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* waiting queue                                                       */
/* ------------------------------------------------------------------ */

function Queue() {
  const { queue, setQueueStatus, toast } = useApp()
  const seedQueue = [
    { token: 'T-02', patient: 'Ananya Sharma', dept: 'Cardiology', doctor: 'Dr. Imran Qureshi', waited: '12 min', priority: 'Urgent' },
    { token: 'T-07', patient: 'Rahul Verma', dept: 'Pediatrics', doctor: 'Dr. Kavya Rao', waited: '6 min', priority: 'Routine' },
    { token: 'T-11', patient: 'Radhika D C', dept: 'Orthopedics', doctor: 'Dr. Aryan Mehta', waited: '3 min', priority: 'Routine' },
  ]
  const rows = queue.length ? queue : seedQueue
  const [tv, setTv] = React.useState(false)

  return (
    <div className="space-y-5">
      <Card>
        <CardHead
          icon={ListOrdered}
          title="Waiting Queue Management"
          sub="Move patients through Checked-In → In Consultation → Completed"
          tone="amber"
          right={<Btn size="sm" variant="soft" onClick={() => setTv(true)}>TV Display Mode</Btn>}
        />
        <Table head={['Token', 'Patient', 'Department', 'Doctor', 'Waited', 'Priority', 'Status', 'Action']}>
          {rows.map((q: any) => (
            <tr key={q.token} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pl-4 font-mono text-[13px] font-extrabold text-brand-700">{q.token}</td>
              <td className="py-3 text-[13px] font-semibold">{q.patient}</td>
              <td className="py-3 text-[12px] text-slate-600">{q.dept}</td>
              <td className="py-3 text-[12px] text-slate-600">{q.doctor}</td>
              <td className="py-3 text-[12px] text-slate-500">{q.waited}</td>
              <td className="py-3"><Badge tone={q.priority === 'Urgent' ? 'amber' : 'slate'}>{q.priority}</Badge></td>
              <td className="py-3"><Badge tone={statusTone(q.status || 'WAITING')}>{q.status || 'WAITING'}</Badge></td>
              <td className="py-3 pr-4">
                <div className="flex gap-1.5">
                  <Btn size="sm" variant="ghost" onClick={() => { setQueueStatus(q.token, 'CHECKED-IN'); toast(`${q.token} → Checked-In`, 'info') }}>Check-In</Btn>
                  <Btn size="sm" variant="teal-soft" onClick={() => { setQueueStatus(q.token, 'COMPLETED'); toast(`${q.token} → Completed`, 'success') }}>Complete</Btn>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {[
          { l: 'Waiting', v: rows.filter((r: any) => (r.status || 'WAITING') === 'WAITING').length, t: 'amber' },
          { l: 'In Consultation', v: rows.filter((r: any) => r.status === 'CHECKED-IN').length, t: 'teal' },
          { l: 'Completed Today', v: rows.filter((r: any) => r.status === 'COMPLETED').length + 5, t: 'green' },
        ].map((s) => <Stat key={s.l} label={s.l} value={s.v} icon={ListOrdered} tone={s.t as any} />)}
      </div>

      <Modal open={tv} onClose={() => setTv(false)} title="TV Display — Waiting Hall" sub="Full-screen token board for the lobby" wide>
        <div className="rounded-2xl bg-slate-900 p-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-teal-300">Now Serving</p>
          <p className="mt-2 font-mono text-6xl font-extrabold text-white">{rows[0]?.token || '—'}</p>
          <p className="mt-1 text-lg font-semibold text-slate-200">{rows[0]?.patient || 'No patient'}</p>
          <p className="mt-1 text-[13px] text-slate-400">{rows[0]?.doctor || ''} · {rows[0]?.dept || ''}</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {rows.slice(1, 4).map((r: any) => (
              <div key={r.token} className="rounded-xl border border-slate-700 bg-slate-800/70 p-3">
                <p className="font-mono text-2xl font-bold text-teal-300">{r.token}</p>
                <p className="truncate text-[12px] text-slate-300">{r.patient}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[11px] text-slate-500">SmartMed · Demo token board · Please keep your token slip with you</p>
        </div>
      </Modal>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* doctor schedules                                                    */
/* ------------------------------------------------------------------ */

function Schedules() {
  const [q, setQ] = React.useState('')
  const docs = DOCTORS.filter((d) => !q || `${d.name} ${d.dept}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <Card>
      <CardHead icon={Clock} title="Doctor Schedules & Availability" sub="Consultation days, slots and OPD rooms" tone="purple" />
      <div className="mb-4 max-w-md"><Search placeholder="Search doctor or department" value={q} onChange={setQ} /></div>
      <Table head={['Doctor', 'Speciality', 'OPD Days', 'Slots', 'Room', 'Fee', 'Status']}>
        {docs.map((d) => (
          <tr key={d.id} className="border-b border-slate-100 last:border-0">
            <td className="py-3 pl-4 text-[13px] font-semibold">{d.name}</td>
            <td className="py-3 text-[12px] text-slate-600">{d.dept}</td>
            <td className="py-3 text-[12px] text-slate-600">{d.days.join(', ')}</td>
            <td className="py-3 text-[12px] text-slate-600">{d.slots.slice(0, 3).join(' · ')}{d.slots.length > 3 ? ` +${d.slots.length - 3}` : ''}</td>
            <td className="py-3 text-[12px] text-slate-600">{d.room}</td>
            <td className="py-3 text-[12px] font-semibold text-slate-700">₹{d.fee}</td>
            <td className="py-3 pr-4"><Badge tone="green">Available</Badge></td>
          </tr>
        ))}
      </Table>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* shell                                                               */
/* ------------------------------------------------------------------ */

const TITLES: Record<View, { t: string; s: string }> = {
  dashboard: { t: 'Front Desk Dashboard', s: 'Receptionist console — SmartMed ' },
  directory: { t: 'Patients Directory', s: 'Registered patients and demographics' },
  register: { t: 'Register Patient', s: 'Create a new UHID record' },
  appointments: { t: 'Appointments', s: 'Book, reschedule and cancel visits' },
  checkin: { t: 'Check-In / Intake', s: 'Arrival marking and token issue' },
  emergency: { t: 'Emergency Walk-In', s: 'Unscheduled and critical arrivals' },
  queue: { t: 'Waiting Queue', s: 'Live token board and patient flow' },
  schedules: { t: 'Doctor Schedules', s: 'Availability, slots and rooms' },
}

export default function ReceptionPortal() {
  const [view, setView] = React.useState<View>('dashboard')
  return (
    <PortalLayout
      role="reception"
      view={view}
      setView={(v: string) => setView(v as View)}
      title={TITLES[view].t}
      sub={TITLES[view].s}
      searchPlaceholder="Search patients, appointments, doctors…"
    >
      {view === 'dashboard' && <Dashboard go={setView} />}
      {view === 'directory' && <Directory />}
      {view === 'register' && <Register />}
      {view === 'appointments' && <Appointments />}
      {view === 'checkin' && <CheckIn />}
      {view === 'emergency' && <EmergencyWalkIn />}
      {view === 'queue' && <Queue />}
      {view === 'schedules' && <Schedules />}
    </PortalLayout>
  )
}
