import React from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useApp } from './context/AppContext'
import { PublicShell } from './components/PublicShell'
import { Toaster } from './components/ui'
import { ROLE_META } from './data/mock'
import { DEMO_USERS } from './data/users'
import type { Role } from './data/mock'

import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import Doctors from './pages/Doctors'
import Appointments from './pages/Appointments'
import Emergency from './pages/Emergency'
import Contact from './pages/Contact'
import AiTools from './pages/AiTools'
import Auth from './pages/Auth'
import MediCareApp from './pages/portal/MediCareApp'

import PatientPortal from './pages/portal/PatientPortal'
import DoctorPortal from './pages/portal/DoctorPortal'
import NursePortal from './pages/portal/NursePortal'
import ReceptionPortal from './pages/portal/ReceptionPortal'
import LabPortal from './pages/portal/LabPortal'
import AdminPortal from './pages/portal/AdminPortal'
import AmbulancePortal from './pages/portal/AmbulancePortal'
import { ClinicalProvider } from './context/ClinicalContext'

const ROLES: Role[] = ['patient', 'doctor', 'nurse', 'reception', 'lab', 'admin', 'ambulance']
const PORTALS: Record<Role, React.ComponentType> = {
  patient: PatientPortal, doctor: DoctorPortal, nurse: NursePortal,
  reception: ReceptionPortal, lab: LabPortal, admin: AdminPortal, ambulance: AmbulancePortal,
}

/* Portals are always enterable in this demo: opening one without a session
   establishes a demo session for that role so every screen stays navigable. */
function Portal({ role }: { role: Role }) {
  const { session, login } = useApp()
  const done = React.useRef(false)
  React.useEffect(() => {
    if (!session && !done.current) {
      done.current = true
      login(role, role === 'patient' ? 'Manasa R' : DEMO_USERS[role].name, role === 'patient' ? DEMO_USERS.patient.email : 'demo@smartmed.health')
    }
  }, [session, role, login])

  const P = PORTALS[role]
  return <P />
}

function NotFound() {
  return (
    <section className="container-x py-24 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-3 text-4xl font-extrabold">This page is not part of the demo</h1>
      <p className="mx-auto mt-4 max-w-lg text-[14px] text-slate-600">
        The page you tried to reach does not exist. Use the navigation above, or jump straight into a portal.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <a href="#/" className="btn btn-primary btn-lg">Back to home</a>
        <a href="#/ai-tools" className="btn btn-ghost btn-lg">Open AI Health Tools</a>
      </div>
    </section>
  )
}

export default function App() {
  const { toasts, dismissToast } = useApp()
  return (
    <ClinicalProvider>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/app/*" element={<MediCareApp />} />
        {ROLES.map((r) => <Route key={r} path={ROLE_META[r].home} element={<Portal role={r} />} />)}
        <Route path="*" element={
          <PublicShell>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/ai-tools" element={<AiTools />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PublicShell>
        } />
      </Routes>
      <Toaster toasts={toasts} dismiss={dismissToast} />
    </ClinicalProvider>
  )
}
