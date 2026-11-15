import type { Role } from './mock'

/* =====================================================================
   Demo logins. Manasa is the primary patient demo account.
   ===================================================================== */

export const DEMO_USERS: Record<Role, { name: string; email: string; title: string }> = {
  patient: { name: 'Manasa R', email: 'manasa.demo@smartmed.health', title: 'Patient · SMN-2026-000001' },
  doctor: { name: 'Dr. Rajesh Sharma', email: 'rajesh@smartmed.health', title: 'Senior Consultant · General Medicine' },
  nurse: { name: 'Sr. Anjali Verma', email: 'anjali@smartmed.health', title: 'Senior Staff Nurse · Ward A' },
  reception: { name: 'Karthik S', email: 'karthik@smartmed.health', title: 'Front Desk Executive' },
  lab: { name: 'Sneha Pillai', email: 'sneha@smartmed.health', title: 'Lab Technologist · Pathology' },
  admin: { name: 'Ravi Menon', email: 'ravi@smartmed.health', title: 'Hospital Administrator' },
  ambulance: { name: 'Vikram Rao', email: 'dispatch@smartmed.health', title: 'Dispatch Controller · EMS' },
}

/* Additional patient logins — every one lands on the same demo portal,
   each with its own identity shown in the header. */
export type PatientAccount = {
  id: string; name: string; email: string; age: number; gender: string;
  primary: boolean; note: string
}

export const PATIENT_ACCOUNTS: PatientAccount[] = [
  { id: 'SMN-2026-000001', name: 'Manasa R', email: 'manasa.demo@smartmed.health', age: 24, gender: 'Female', primary: true, note: 'Primary demo account' },
  { id: 'SMN-2026-000002', name: 'Ananya Sharma', email: 'ananya@example.com', age: 34, gender: 'Female', primary: false, note: 'Antenatal follow-up' },
  { id: 'SMN-2026-000003', name: 'Rahul Verma', email: 'verma.family@example.com', age: 7, gender: 'Male', primary: false, note: 'Paediatric growth review' },
  { id: 'SMN-2026-000004', name: 'Imran Baig', email: 'imran.b@example.com', age: 52, gender: 'Male', primary: false, note: 'Cardiac rehabilitation' },
  { id: 'SMN-2026-000005', name: 'Kavya Nair', email: 'kavya.n@example.com', age: 29, gender: 'Female', primary: false, note: 'Thyroid monitoring' },
]
