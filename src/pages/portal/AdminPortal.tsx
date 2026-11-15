import React from 'react'
import {
  LayoutDashboard, Users, Stethoscope, Contact2, Building2, CalendarDays,
  ClipboardList, BedDouble, Receipt, FlaskConical, Ambulance, ShieldCheck,
  ChartPie, Bell, UserPlus, Download, FileText, AlertTriangle, Activity,
  TrendingUp, Hospital, Plus,
} from 'lucide-react'
/* eslint-disable @typescript-eslint/no-unused-vars */
import { PortalLayout, Panel, KpiRow } from '../../components/PortalLayout'
import {
  Card, CardHead, Badge, Btn, Stat, Field, Input, Select, Search, Tabs,
  Table, Modal, statusTone, KV, Bar, Empty,
} from '../../components/ui'
import { OpsTrend, RevenueChart, Donut, MiniRadial } from '../../components/charts'
import { useApp } from '../../context/AppContext'
import {
  STAFF, DOCTORS, DEPARTMENTS, AUDIT_LOGS, REVENUE, APPT_TREND, BEDS,
  LAB_REQUESTS, EMERGENCIES, PATIENT,
} from '../../data/mock'

type View =
  | 'dashboard' | 'users' | 'doctors' | 'patients' | 'departments' | 'schedules'
  | 'appointments' | 'beds' | 'billing' | 'laboratory' | 'emergency'
  | 'audit' | 'reports' | 'notifications'

/* ------------------------------ dashboard ------------------------------ */

function Dashboard({ go }: { go: (v: View) => void }) {
  const { newPatients, emergencies, appts } = useApp()
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-teal-50 p-4 text-[13px] font-semibold text-brand-800">
        Welcome back, System Administrator — signed in to the SmartMed governance console. Tuesday, 04 October 2026.
      </div>

      <KpiRow
        items={[
          { label: 'Total Patients', value: 1264 + newPatients.length, sub: 'Registered UHIDs', icon: Contact2, tone: 'brand' },
          { label: 'Doctors', value: DOCTORS.length, sub: 'Across 7 departments', icon: Stethoscope, tone: 'teal' },
          { label: 'Appointments Today', value: 74, sub: 'OPD + video', icon: CalendarDays, tone: 'purple' },
          { label: 'Emergency Requests', value: emergencies.length, sub: 'Active cases', icon: Ambulance, tone: 'red' },
          { label: 'Lab Reports', value: LAB_REQUESTS.length + 36, sub: 'This week', icon: FlaskConical, tone: 'amber' },
          { label: 'Active Prescriptions', value: 418, sub: 'Across patients', icon: FileText, tone: 'green' },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHead icon={Activity} title="Appointments Overview" sub="OPD and emergency visits — this week" tone="blue" right={<Btn size="sm" variant="ghost" onClick={() => go('appointments')}>Open</Btn>} />
          <OpsTrend data={APPT_TREND} height={260} />
        </Card>
        <Card>
          <CardHead icon={BedDouble} title="Bed Occupancy" sub="Live census" tone="purple" />
          <Donut value={BEDS.occupied} total={BEDS.total} label="Occupied" sub={`${BEDS.available} beds available`} color="#7c3aed" height={200} />
          <div className="mt-3 space-y-2 text-[12px]">
            {[['ICU', `${BEDS.icuUsed} / ${BEDS.icu}`, 'red'], ['Maintenance', String(BEDS.maintenance), 'amber'], ['Available', String(BEDS.available), 'green']].map(([l, v, t]) => (
              <div key={l} className="flex items-center justify-between">
                <span className="text-slate-600">{l}</span>
                <Badge tone={t as any}>{v}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHead icon={Receipt} title="Revenue Overview" sub="OPD / IPD / laboratory — last 5 months (₹)" tone="green" right={<Btn size="sm" variant="ghost" onClick={() => go('billing')}>Billing</Btn>} />
          <RevenueChart data={REVENUE} height={250} />
        </Card>
        <Card>
          <CardHead icon={AlertTriangle} title="Second Alerts" sub="Operational attention" tone="red" />
          <ul className="space-y-2.5 text-[12px]">
            {[
              { t: 'All critical ICU and isolation beds currently under review', tone: 'red' },
              { t: '3 emergency walk-ins awaiting bed allocation', tone: 'amber' },
              { t: '2 lab reports pending dispatch to clinicians', tone: 'blue' },
              { t: 'Backup completed 09:31 AM — MongoDB primary healthy', tone: 'green' },
            ].map((a, i) => (
              <li key={i} className="flex items-start gap-2">
                <Badge tone={a.tone as any}>•</Badge>
                <span className="text-slate-600">{a.t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Btn size="sm" variant="soft" onClick={() => go('audit')}><ShieldCheck size={13} /> Audit Logs</Btn>
            <Btn size="sm" variant="ghost" onClick={() => go('notifications')}><Bell size={13} /> Notifications</Btn>
          </div>
        </Card>
      </div>

      <Card>
        <CardHead icon={FileText} title="Today's Operations" sub="Snapshot of live hospital activity" tone="teal" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: 'OPD Appointments', v: 74, i: CalendarDays, t: 'brand' },
            { l: 'Emergency Requests', v: emergencies.length, i: Ambulance, t: 'red' },
            { l: 'Lab Reports', v: 48, i: FlaskConical, t: 'amber' },
            { l: 'Discharges', v: 12, i: Hospital, t: 'green' },
          ].map((s) => <Stat key={s.l} label={s.l} value={s.v} icon={s.i as any} tone={s.t as any} />)}
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------ users ------------------------------ */

function StaffUsers() {
  const { toast } = useApp()
  const [tab, setTab] = React.useState('All')
  const [q, setQ] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [f, setF] = React.useState({ name: '', email: '', role: 'Doctor', spec: 'General Physician' })

  const rows = STAFF.filter((s) => (tab === 'All' || s.role === tab) && (!q || `${s.name} ${s.email} ${s.code}`.toLowerCase().includes(q.toLowerCase())))

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { l: 'Total Users', v: STAFF.length, i: Users, t: 'brand' },
          { l: 'Admins', v: 1, i: ShieldCheck, t: 'purple' },
          { l: 'Doctors', v: 5, i: Stethoscope, t: 'teal' },
          { l: 'Nurses', v: 2, i: Activity, t: 'green' },
          { l: 'Active Accounts', v: STAFF.length, i: TrendingUp, t: 'amber' },
        ].map((s) => <Stat key={s.l} label={s.l} value={s.v} icon={s.i as any} tone={s.t as any} />)}
      </div>

      <Card>
        <CardHead
          icon={Users}
          title="Staff & Users"
          sub="Role-based access control directory"
          tone="blue"
          right={<Btn size="sm" onClick={() => setOpen(true)}><UserPlus size={14} /> Register New Staff</Btn>}
        />
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Tabs value={tab} onChange={setTab} tabs={['All', 'Admin', 'Doctor', 'Nurse', 'Receptionist', 'Lab Staff', 'Patient'].map((t) => ({ id: t, label: t, count: t === 'All' ? STAFF.length : STAFF.filter((s) => s.role === t).length }))} />
        </div>
        <div className="mb-4 max-w-md"><Search placeholder="Search by name, email or staff code" value={q} onChange={setQ} /></div>
        <Table head={['Staff ID', 'Full Name', 'Email Address', 'System Role', 'Specialisation / Unit', 'Status', 'Action']}>
          {rows.map((s) => (
            <tr key={s.code} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pl-4 font-mono text-[11px] font-semibold text-slate-500">{s.code}</td>
              <td className="py-3 text-[13px] font-semibold">{s.name}</td>
              <td className="py-3 text-[12px] text-slate-600">{s.email}</td>
              <td className="py-3"><Badge tone={s.role === 'Doctor' ? 'teal' : s.role === 'Nurse' ? 'green' : s.role === 'Admin' ? 'purple' : s.role === 'Lab Staff' ? 'amber' : 'blue'}>{s.role}</Badge></td>
              <td className="py-3 text-[12px] text-slate-600">{s.spec}</td>
              <td className="py-3"><Badge tone="green">{s.status}</Badge></td>
              <td className="py-3 pr-4"><Btn size="sm" variant="ghost" onClick={() => toast(`Editing ${s.name} — demo only`, 'info')}>Edit</Btn></td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Register New Staff" sub="Creates a demo staff account with role-scoped access">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full Name"><Input value={f.name} onChange={(e: any) => setF((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. Dr. Neha Bhatia" /></Field>
          <Field label="Email"><Input value={f.email} onChange={(e: any) => setF((s) => ({ ...s, email: e.target.value }))} placeholder="name@smartmed.health" /></Field>
          <Field label="System Role"><Select value={f.role} onChange={(e: any) => setF((s) => ({ ...s, role: e.target.value }))}>{['Doctor', 'Nurse', 'Receptionist', 'Lab Staff', 'Admin'].map((r) => <option key={r}>{r}</option>)}</Select></Field>
          <Field label="Specialisation / Unit"><Input value={f.spec} onChange={(e: any) => setF((s) => ({ ...s, spec: e.target.value }))} /></Field>
        </div>
        <div className="mt-5 flex gap-3">
          <Btn onClick={() => { setOpen(false); toast(`${f.name || 'New staff'} added — activation email queued`, 'success') }}>Create Account</Btn>
          <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
        </div>
      </Modal>
    </div>
  )
}

/* ------------------------------ doctors ------------------------------ */

function Doctors() {
  const { toast } = useApp()
  return (
    <Card>
      <CardHead icon={Stethoscope} title={`Doctor Management (${DOCTORS.length})`} sub="Credentials, fees, OPD schedule and status" tone="teal" right={<Btn size="sm" variant="soft" onClick={() => toast('Roster export queued (demo)', 'info')}><Download size={14} /> Export Roster</Btn>} />
      <Table head={['Doctor', 'Speciality', 'Qualification', 'Exp.', 'Fee', 'Rating', 'OPD Days', 'Room', 'Status']}>
        {DOCTORS.map((d) => (
          <tr key={d.id} className="border-b border-slate-100 last:border-0">
            <td className="py-3 pl-4 text-[13px] font-semibold">{d.name}</td>
            <td className="py-3 text-[12px] text-slate-600">{d.dept}</td>
            <td className="py-3 text-[12px] text-slate-600">{d.qual}</td>
            <td className="py-3 text-[12px] text-slate-600">{d.exp} yrs</td>
            <td className="py-3 text-[12px] font-semibold">₹{d.fee}</td>
            <td className="py-3"><Badge tone="amber">★ {d.rating}</Badge></td>
            <td className="py-3 text-[12px] text-slate-600">{d.days.join(', ')}</td>
            <td className="py-3 text-[12px] text-slate-600">{d.room}</td>
            <td className="py-3 pr-4"><Badge tone="green">Active</Badge></td>
          </tr>
        ))}
      </Table>
    </Card>
  )
}

/* ------------------------------ patients ------------------------------ */

function Patients() {
  const { newPatients } = useApp()
  const seed = [
    { id: PATIENT.id, name: PATIENT.name, age: PATIENT.age, gender: PATIENT.gender, blood: PATIENT.blood, dept: 'General Medicine', condition: 'Out-Patient' },
    { id: 'SMN-2026-000002', name: 'Ananya Sharma', age: 34, gender: 'Female', blood: 'B+', dept: 'Cardiology', condition: 'Under Observation' },
    { id: 'SMN-2026-000003', name: 'Rahul Verma', age: 7, gender: 'Male', blood: 'A+', dept: 'Pediatrics', condition: 'Out-Patient' },
    { id: 'SMN-2026-000004', name: 'Imran Baig', age: 52, gender: 'Male', blood: 'AB+', dept: 'General Medicine', condition: 'In-Patient' },
  ]
  const all = [...seed, ...newPatients]
  return (
    <Card>
      <CardHead icon={Contact2} title={`Patient Management (${all.length})`} sub="Master patient index and clinical status" tone="brand" />
      <div className="mb-4 max-w-md"><Search placeholder="Search UHID, name or mobile" /></div>
      <Table head={['UHID', 'Patient', 'Age / Gender', 'Blood', 'Department', 'Status', 'Action']}>
        {all.map((p: any) => (
          <tr key={p.id} className="border-b border-slate-100 last:border-0">
            <td className="py-3 pl-4 font-mono text-[11px] font-semibold text-slate-500">{p.id}</td>
            <td className="py-3 text-[13px] font-semibold">{p.name}</td>
            <td className="py-3 text-[12px] text-slate-600">{p.age}y / {p.gender}</td>
            <td className="py-3"><Badge tone="red">{p.blood}</Badge></td>
            <td className="py-3 text-[12px] text-slate-600">{p.dept}</td>
            <td className="py-3"><Badge tone="green">{p.condition}</Badge></td>
            <td className="py-3 pr-4"><Btn size="sm" variant="ghost">View</Btn></td>
          </tr>
        ))}
      </Table>
    </Card>
  )
}

/* ------------------------------ departments ------------------------------ */

function Departments() {
  return (
    <Card>
      <CardHead icon={Building2} title="Departments & Units" sub="Active clinical departments under this facility" tone="purple" right={<Btn size="sm" variant="soft"><Plus size={14} /> Add Department</Btn>} />
      <Table head={['Code', 'Department Name', 'Category', 'Head of Department (HOD)', 'OPD Room', 'Doctors', 'Status']}>
        {DEPARTMENTS.map((d, i) => (
          <tr key={d.code} className="border-b border-slate-100 last:border-0">
            <td className="py-3 pl-4 font-mono text-[11px] font-semibold text-slate-500">{d.code}</td>
            <td className="py-3 text-[13px] font-semibold">{d.name}</td>
            <td className="py-3"><Badge tone={d.code === 'EMR' ? 'red' : 'blue'}>{d.code === 'EMR' ? 'Emergency' : d.code === 'GEN' ? 'Out-Patient' : 'Speciality'}</Badge></td>
            <td className="py-3 text-[12px] text-slate-600">{DOCTORS[i % DOCTORS.length].name}</td>
            <td className="py-3 text-[12px] text-slate-600">Room {d.code}-{100 + i}</td>
            <td className="py-3 text-[12px] text-slate-600">{DOCTORS.filter((x) => x.deptCode === d.code).length || 1}</td>
            <td className="py-3 pr-4"><Badge tone="green">Active</Badge></td>
          </tr>
        ))}
      </Table>
    </Card>
  )
}

/* ------------------------------ schedules ------------------------------ */

function Schedules() {
  const [q, setQ] = React.useState('')
  return (
    <Card>
      <CardHead icon={CalendarDays} title="Doctor Schedules" sub="Consultation days, slots and OPD rooms" tone="blue" />
      <div className="mb-4 max-w-md"><Search placeholder="Search doctor or department" value={q} onChange={setQ} /></div>
      <Table head={['Doctor', 'Department', 'OPD Days', 'Slots Available', 'Room', 'Fee', 'Actions']}>
        {DOCTORS.filter((d) => !q || `${d.name} ${d.dept}`.toLowerCase().includes(q.toLowerCase())).map((d) => (
          <tr key={d.id} className="border-b border-slate-100 last:border-0">
            <td className="py-3 pl-4 text-[13px] font-semibold">{d.name}</td>
            <td className="py-3 text-[12px] text-slate-600">{d.dept}</td>
            <td className="py-3 text-[12px] text-slate-600">{d.days.join(', ')}</td>
            <td className="py-3 text-[12px] text-slate-600">{d.slots.length} slots/day</td>
            <td className="py-3 text-[12px] text-slate-600">{d.room}</td>
            <td className="py-3 text-[12px] font-semibold">₹{d.fee}</td>
            <td className="py-3 pr-4"><Btn size="sm" variant="ghost">Edit Schedule</Btn></td>
          </tr>
        ))}
      </Table>
    </Card>
  )
}

/* ------------------------------ appointments ------------------------------ */

function Appointments() {
  const { appts, updateAppt, toast } = useApp()
  return (
    <Card>
      <CardHead icon={ClipboardList} title={`Appointment Management (${appts.length})`} sub="All bookings across departments" tone="amber" />
      <Table head={['Appointment', 'Patient', 'Doctor', 'Department', 'Date', 'Time', 'Type', 'Status', 'Action']}>
        {appts.map((a: any) => (
          <tr key={a.id} className="border-b border-slate-100 last:border-0">
            <td className="py-3 pl-4 font-mono text-[11px] font-semibold text-slate-500">{a.id}</td>
            <td className="py-3 text-[13px] font-semibold">{a.patient}</td>
            <td className="py-3 text-[12px] text-slate-600">{a.doctor}</td>
            <td className="py-3 text-[12px] text-slate-600">{a.dept}</td>
            <td className="py-3 text-[12px] text-slate-600">{a.date}</td>
            <td className="py-3 text-[12px] text-slate-600">{a.time}</td>
            <td className="py-3"><Badge tone={a.type === 'Emergency' ? 'red' : a.type === 'Video Consultation' ? 'teal' : 'blue'}>{a.type}</Badge></td>
            <td className="py-3"><Badge tone={statusTone(a.status)}>{a.status}</Badge></td>
            <td className="py-3 pr-4"><Btn size="sm" variant="ghost" onClick={() => { updateAppt(a.id, { status: 'CANCELLED' }); toast(`${a.id} cancelled by administrator`, 'warn') }}>Cancel</Btn></td>
          </tr>
        ))}
      </Table>
    </Card>
  )
}

/* ------------------------------ beds ------------------------------ */

function Beds() {
  const wards = [
    { w: 'General Ward A', total: 40, used: 31, type: 'General' },
    { w: 'General Ward B', total: 32, used: 26, type: 'General' },
    { w: 'ICU', total: 18, used: 13, type: 'Critical Care' },
    { w: 'Pediatric Ward', total: 14, used: 8, type: 'Pediatrics' },
    { w: 'Maternity', total: 10, used: 4, type: 'Obstetrics' },
    { w: 'Isolation', total: 6, used: 2, type: 'Infection Control' },
  ]
  return (
    <div className="space-y-5">
      <KpiRow items={[
        { label: 'Total Beds', value: BEDS.total, sub: 'Across 6 wards', icon: BedDouble, tone: 'brand' },
        { label: 'Occupied', value: BEDS.occupied, sub: `${Math.round((BEDS.occupied / BEDS.total) * 100)}% utilisation`, icon: BedDouble, tone: 'amber' },
        { label: 'Available', value: BEDS.available, sub: 'Ready for admission', icon: BedDouble, tone: 'green' },
        { label: 'ICU Used', value: `${BEDS.icuUsed}/${BEDS.icu}`, sub: 'Critical care', icon: Activity, tone: 'red' },
      ]} />
      <Card>
        <CardHead icon={BedDouble} title="Ward-wise Occupancy" sub="Live bed census" tone="purple" />
        <div className="space-y-4">
          {wards.map((w) => (
            <div key={w.w}>
              <div className="mb-1.5 flex items-center justify-between text-[12px]">
                <span className="font-semibold text-slate-700">{w.w} <span className="font-normal text-slate-400">· {w.type}</span></span>
                <span className="text-slate-500">{w.used}/{w.total} beds</span>
              </div>
              <Bar value={Math.round((w.used / w.total) * 100)} tone={w.used / w.total > 0.85 ? 'brand' : w.used / w.total > 0.6 ? 'teal' : 'green'} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------ billing ------------------------------ */

function Billing() {
  return (
    <div className="space-y-5">
      <KpiRow items={[
        { label: 'September Revenue', value: '₹1,91,500', sub: 'OPD + IPD + Laboratory', icon: Receipt, tone: 'green' },
        { label: 'OPD Collections', value: '₹63,000', sub: 'Consultation fees', icon: Receipt, tone: 'brand' },
        { label: 'IPD Collections', value: '₹94,000', sub: 'Ward and ICU billing', icon: Receipt, tone: 'purple' },
        { label: 'Lab Collections', value: '₹34,500', sub: 'Diagnostics', icon: FlaskConical, tone: 'amber' },
      ]} />
      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHead icon={Receipt} title="Monthly Revenue Trend" sub="OPD, IPD and laboratory (₹)" tone="green" />
          <RevenueChart data={REVENUE} height={280} />
        </Card>
        <Card>
          <CardHead icon={ChartPie} title="Revenue Mix" sub="Share of September collections" tone="teal" />
          <MiniRadial data={[{ name: 'IPD', value: 94 }, { name: 'OPD', value: 63 }, { name: 'Lab', value: 34.5 }]} height={240} />
        </Card>
      </div>
    </div>
  )
}

/* ------------------------------ laboratory ------------------------------ */

function Laboratory() {
  return (
    <Card>
      <CardHead icon={FlaskConical} title="Laboratory Overview" sub="Order volume, turnaround and dispatch status" tone="amber" />
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: 'Orders This Week', v: 258, t: 'brand' },
          { l: 'Reports Released', v: 36, t: 'green' },
          { l: 'Critical Flags', v: 2, t: 'red' },
          { l: 'Avg. Turnaround', v: '5.4 hrs', t: 'teal' },
        ].map((s) => <Stat key={s.l} label={s.l} value={s.v} tone={s.t as any} icon={FlaskConical} />)}
      </div>
      <Table head={['Request', 'Patient', 'Panel', 'Modality', 'Doctor', 'Priority', 'Status']}>
        {LAB_REQUESTS.map((r) => (
          <tr key={r.id} className="border-b border-slate-100 last:border-0">
            <td className="py-3 pl-4 font-mono text-[11px] font-semibold text-slate-500">{r.id}</td>
            <td className="py-3 text-[13px] font-semibold">{r.patient}</td>
            <td className="py-3 text-[12px] text-slate-600">{r.panel}</td>
            <td className="py-3"><Badge tone={r.type === 'Blood Test' ? 'red' : r.type === 'Urine Test' ? 'amber' : 'purple'}>{r.type}</Badge></td>
            <td className="py-3 text-[12px] text-slate-600">{r.doctor}</td>
            <td className="py-3"><Badge tone={r.priority === 'Critical' ? 'red' : r.priority === 'Urgent' ? 'amber' : 'slate'}>{r.priority}</Badge></td>
            <td className="py-3 pr-4"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
          </tr>
        ))}
      </Table>
    </Card>
  )
}

/* ------------------------------ emergency ------------------------------ */

function Emergency() {
  const { emergencies } = useApp()
  return (
    <div className="space-y-5">
      <KpiRow items={[
        { label: 'Active Cases', value: emergencies.length, sub: 'Live emergency board', icon: Ambulance, tone: 'red' },
        { label: 'Ambulances Dispatched', value: 2, sub: 'En route / transporting', icon: Ambulance, tone: 'amber' },
        { label: 'Avg. Response', value: '8.4 min', sub: 'Dispatch to scene', icon: Activity, tone: 'teal' },
        { label: 'Cases Today', value: 9, sub: 'All priorities', icon: ClipboardList, tone: 'brand' },
      ]} />
      <Card>
        <CardHead icon={Ambulance} title="Emergency Case Board" sub="Shared with emergency desk and ambulance control" tone="red" />
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

/* ------------------------------ audit ------------------------------ */

function Audit() {
  const [q, setQ] = React.useState('')
  const [sev, setSev] = React.useState('All')
  const rows = AUDIT_LOGS.filter((l) => (sev === 'All' || l.severity === sev) && (!q || `${l.actor} ${l.action} ${l.entity}`.toLowerCase().includes(q.toLowerCase())))
  return (
    <div className="space-y-5">
      <KpiRow items={[
        { label: 'Total Audit Events', value: 21, sub: 'Today', icon: ShieldCheck, tone: 'brand' },
        { label: 'Unique Actors', value: 11, sub: 'Staff and system', icon: Users, tone: 'teal' },
        { label: 'Failed Logins', value: 3, sub: 'Flagged for review', icon: AlertTriangle, tone: 'red' },
        { label: 'Total Logins', value: 21, sub: 'Successful sessions', icon: Activity, tone: 'green' },
      ]} />
      <Card>
        <CardHead
          icon={ShieldCheck}
          title="Security Access Control — Full Audit Trail"
          sub="Every privileged action is written with actor, entity, IP and severity"
          tone="purple"
          right={<Btn size="sm" variant="soft"><Download size={14} /> Export Log</Btn>}
        />
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Tabs value={sev} onChange={setSev} tabs={['All', 'Info', 'Warn', 'Critical'].map((s) => ({ id: s, label: s, count: s === 'All' ? AUDIT_LOGS.length : AUDIT_LOGS.filter((l) => l.severity === s).length }))} />
        </div>
        <div className="mb-4 max-w-md"><Search placeholder="Search actor, action or entity" value={q} onChange={setQ} /></div>
        {rows.length === 0 ? <Empty title="No audit events match" icon={ShieldCheck} /> : (
          <Table head={['Timestamp', 'Action Type', 'Operator / Actor', 'Entities', 'IP Address', 'Severity']}>
            {rows.map((l) => (
              <tr key={l.id} className="border-b border-slate-100 last:border-0">
                <td className="py-3 pl-4 text-[12px] text-slate-600">{l.time}</td>
                <td className="py-3"><span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">{l.action}</span></td>
                <td className="py-3 text-[13px] font-semibold">{l.actor}</td>
                <td className="py-3 font-mono text-[11px] text-slate-600">{l.entity}</td>
                <td className="py-3 font-mono text-[11px] text-slate-500">{l.ip}</td>
                <td className="py-3 pr-4"><Badge tone={l.severity === 'Critical' ? 'red' : l.severity === 'Warn' ? 'amber' : 'green'}>{l.severity}</Badge></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  )
}

/* ------------------------------ reports ------------------------------ */

function Reports() {
  const { toast } = useApp()
  const cards = [
    { t: 'Patient Registry Report', d: 'Full patient directory with contact details, blood groups and registration dates.', i: Contact2, tone: 'brand' },
    { t: 'Financial Revenue Ledger', d: 'Month-wise inpatient, outpatient and laboratory collections with reconciliation.', i: Receipt, tone: 'green' },
    { t: 'Appointments & OPD Census', d: 'Consultation volumes, doctor utilisation and no-show statistics.', i: CalendarDays, tone: 'teal' },
    { t: 'Physicians & Staff Roster', d: 'Complete staff register with specialisation, contact and status.', i: Stethoscope, tone: 'purple' },
    { t: 'Laboratory Diagnostics Log', d: 'Diagnostic order volume, turnaround times and critical-result flags.', i: FlaskConical, tone: 'amber' },
    { t: 'Database Backup Snapshot', d: 'Scheduled MongoDB snapshot with integrity and size checks.', i: ShieldCheck, tone: 'red' },
  ]
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <Card key={c.t} hover>
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><c.i size={18} /></div>
          <h3 className="text-[14px] font-bold text-slate-800">{c.t}</h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">{c.d}</p>
          <div className="mt-4 flex gap-2">
            <Btn size="sm" variant="soft" onClick={() => toast(`${c.t} exported as CSV (demo)`, 'success')}>CSV</Btn>
            <Btn size="sm" variant="ghost" onClick={() => toast(`${c.t} exported as PDF (demo)`, 'success')}>PDF</Btn>
          </div>
        </Card>
      ))}
    </div>
  )
}

/* ------------------------------ notifications ------------------------------ */

function Notifications() {
  const { notif, pushNotif, markRead, readAll } = useApp()
  const [f, setF] = React.useState({ title: '', body: '', tone: 'blue' })
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHead
          icon={Bell}
          title={`Notification Centre (${notif.length})`}
          sub="Broadcasts, clinical alerts and system messages"
          tone="brand"
          right={<Btn size="sm" variant="ghost" onClick={readAll}>Mark all read</Btn>}
        />
        <ul className="space-y-2.5">
          {notif.map((n: any) => (
            <li key={n.id} className={`flex items-start gap-3 rounded-xl border p-3 transition ${n.read ? 'border-slate-200 bg-white' : 'border-brand-200 bg-brand-50/60'}`}>
              <Badge tone={n.tone}>{n.cat}</Badge>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-slate-800">{n.title}</p>
                <p className="mt-0.5 text-[12px] text-slate-500">{n.body}</p>
                <p className="mt-1 text-[11px] text-slate-400">{n.time}</p>
              </div>
              {!n.read && <Btn size="sm" variant="ghost" onClick={() => markRead(n.id)}>Read</Btn>}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHead icon={Plus} title="Broadcast Notification" sub="Push a message to a role group" tone="teal" />
        <div className="space-y-4">
          <Field label="Title"><Input value={f.title} onChange={(e: any) => setF((s) => ({ ...s, title: e.target.value }))} placeholder="e.g. ICU capacity advisory" /></Field>
          <Field label="Message"><Input value={f.body} onChange={(e: any) => setF((s) => ({ ...s, body: e.target.value }))} placeholder="Short body copy" /></Field>
          <Field label="Category Tone"><Select value={f.tone} onChange={(e: any) => setF((s) => ({ ...s, tone: e.target.value }))}><option value="blue">Information</option><option value="amber">Warning</option><option value="red">Critical</option><option value="green">Resolved</option></Select></Field>
          <Btn onClick={() => { pushNotif({ cat: 'Message', title: f.title || 'Administrator broadcast', body: f.body || 'No detail provided.', tone: f.tone, time: 'Just now' }); setF({ title: '', body: '', tone: 'blue' }) }}><Plus size={14} /> Publish</Btn>
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------ shell ------------------------------ */

const TITLES: Record<View, { t: string; s: string }> = {
  dashboard: { t: 'Administrator Dashboard', s: 'Hospital operations at a glance' },
  users: { t: 'Staff & Users', s: 'Role-based access control directory' },
  doctors: { t: 'Doctor Management', s: 'Roster, credentials and fees' },
  patients: { t: 'Patient Management', s: 'Master patient index' },
  departments: { t: 'Departments & Units', s: 'Clinical department structure' },
  schedules: { t: 'Doctor Schedules', s: 'Availability and OPD rooms' },
  appointments: { t: 'Appointment Management', s: 'All bookings across departments' },
  beds: { t: 'Bed Management', s: 'Ward-wise occupancy' },
  billing: { t: 'Billing & Finance', s: 'Revenue and collections' },
  laboratory: { t: 'Laboratory', s: 'Diagnostics oversight' },
  emergency: { t: 'Emergency', s: 'Case board and ambulance control' },
  audit: { t: 'Security Access Control', s: 'Full audit trail' },
  reports: { t: 'Reports & Export Center', s: 'Operational and statutory reports' },
  notifications: { t: 'Notifications', s: 'Broadcast and system messages' },
}

export default function AdminPortal() {
  const [view, setView] = React.useState<View>('dashboard')
  return (
    <PortalLayout
      role="admin"
      view={view}
      setView={(v: string) => setView(v as View)}
      title={TITLES[view].t}
      sub={TITLES[view].s}
      searchPlaceholder="Search staff, patients, departments…"
    >
      {view === 'dashboard' && <Dashboard go={setView} />}
      {view === 'users' && <StaffUsers />}
      {view === 'doctors' && <Doctors />}
      {view === 'patients' && <Patients />}
      {view === 'departments' && <Departments />}
      {view === 'schedules' && <Schedules />}
      {view === 'appointments' && <Appointments />}
      {view === 'beds' && <Beds />}
      {view === 'billing' && <Billing />}
      {view === 'laboratory' && <Laboratory />}
      {view === 'emergency' && <Emergency />}
      {view === 'audit' && <Audit />}
      {view === 'reports' && <Reports />}
      {view === 'notifications' && <Notifications />}
    </PortalLayout>
  )
}
