/* =====================================================================
   SmartMed — demo dataset (front-end only, synthetic data).
   Reconstructed to satisfy every import used across the app.
   ===================================================================== */

export type Role = 'patient' | 'doctor' | 'nurse' | 'reception' | 'lab' | 'admin' | 'ambulance'

export type Notif = { id: string; cat: string; title: string; body: string; time: string; read: boolean; tone?: string }
export type Med = {
  id: string; name: string; strength: string; slot: 'Morning' | 'Afternoon' | 'Night';
  time: string; meal: string; dose: string; frequency?: string; freq?: string; purpose?: string;
  prescriber?: string; notes?: string;
  status: 'Active' | 'Completed' | 'Stopped'; adherence: { taken: number; missed: number }
}
export type Appointment = {
  id: string; doctor: string; dept: string; type: string; date: string; time: string;
  token: string; status: string; reason: string; patient?: string; patientId?: string;
  fee?: number; priority?: string
}
export type LabReport = {
  id: string; panel?: string; title?: string; date?: string; doctor?: string; lab?: string;
  type?: string; status?: string; priority?: string; patient?: string; patientId?: string;
  requested?: string; modality?: string; tube?: string;
  /* rows are intentionally open: the lab console writes test/explain/cause/follow
     while the patient view reads name/value/low/high. */
  rows: any[]
}
export type Consultation = {
  id: string; patient: string; patientId: string; doctor: string; date: string;
  complaint?: string; diagnosis?: string; plan?: string; notes?: string;
  vitals?: Record<string, any>;
  status: string;
  prescription?: { id?: string; items: { name: string; dose: string; freq: string; duration: string; meal: string; notes?: string }[]; advice: string; followUp?: string }
}
export type Emergency = {
  id: string; type: string; location: string; note?: string; status: string; priority: string;
  at?: string; patient?: string; reported?: string; reason?: string; dept?: string;
  action?: string; ambulance?: string; eta?: string; hospital?: string
}

/* ------------------------------------------------------------------ images */
export const IMG = {
  heroDoctor: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=1200&q=80',
  heroNurse: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=1200&q=80',
  heroConsult: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80',
  hospital: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=1200&q=80',
  clinic: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80',
  digital: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
  digital2: 'https://images.unsplash.com/photo-1550831107-1553da8c8464?w=1200&q=80',
  labBlood: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1200&q=80',
  labMicro: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1200&q=80',
  meds: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&q=80',
  medList: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=1200&q=80',
  pharmacy: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&q=80',
}

/* ------------------------------------------------------------------ roles */
export const ROLE_META: Record<Role, { label: string; portal: string; home: string }> = {
  patient: { label: 'Patient', portal: 'Patient Portal', home: '/portal/patient' },
  doctor: { label: 'Doctor', portal: 'Doctor Portal', home: '/portal/doctor' },
  nurse: { label: 'Nurse', portal: 'Nursing Station', home: '/portal/nurse' },
  reception: { label: 'Reception', portal: 'Front Desk', home: '/portal/reception' },
  lab: { label: 'Laboratory', portal: 'Lab Console', home: '/portal/lab' },
  admin: { label: 'Administrator', portal: 'Admin Console', home: '/portal/admin' },
  ambulance: { label: 'Ambulance', portal: 'Ambulance Control', home: '/portal/ambulance' },
}

/* ------------------------------------------------------------------ departments & doctors */
export type Doctor = {
  id: string; code: string; name: string; dept: string; deptCode: string; role: string; qual: string;
  exp: string; fee: number; rating: number; slots: string[]; days: any; img: string; room: string;
  lang?: string; about?: string
}

export const DEPARTMENTS = [
  { id: 'general', code: 'GEN', name: 'General Medicine', icon: 'Stethoscope', color: 'brand', d: 'Primary care, fever, infections and chronic disease follow-up.', desc: 'Primary care, fever, infections and chronic disease follow-up.' },
  { id: 'cardio', code: 'CAR', name: 'Cardiology', icon: 'HeartPulse', color: 'rose', d: 'Heart failure, arrhythmia, hypertension and preventive cardiology.', desc: 'Heart failure, arrhythmia, hypertension and preventive cardiology.' },
  { id: 'neuro', code: 'NEU', name: 'Neurology', icon: 'Brain', color: 'violet', d: 'Stroke, epilepsy, migraine and neuromuscular disorders.', desc: 'Stroke, epilepsy, migraine and neuromuscular disorders.' },
  { id: 'ortho', code: 'ORT', name: 'Orthopedics', icon: 'Bone', color: 'amber', d: 'Fractures, joint replacement and sports injury care.', desc: 'Fractures, joint replacement and sports injury care.' },
  { id: 'peds', code: 'PED', name: 'Pediatrics', icon: 'Baby', color: 'teal', d: 'Newborn to adolescent care, immunisation and growth tracking.', desc: 'Newborn to adolescent care, immunisation and growth tracking.' },
  { id: 'derm', code: 'DER', name: 'Dermatology', icon: 'Sparkles', color: 'pink', d: 'Skin, hair and nail conditions including allergy work-up.', desc: 'Skin, hair and nail conditions including allergy work-up.' },
  { id: 'emergency', code: 'EMR', name: 'Emergency & Trauma', icon: 'Ambulance', color: 'red', d: '24×7 emergency response, triage and ambulance dispatch.', desc: '24×7 emergency response, triage and ambulance dispatch.' },
]

const SLOT_SET = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM']
const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const DOCTORS: Doctor[] = [
  { id: 'DOC-103', code: 'SMN-DOC-103', name: 'Dr. Rajesh Sharma', dept: 'General Medicine', deptCode: 'GEN', role: 'Senior Consultant', qual: 'MBBS, MD (Internal Medicine)', exp: '16 years', fee: 600, rating: 4.8, slots: SLOT_SET, days: WEEK, img: IMG.heroDoctor, room: 'OPD-02', lang: 'English, Hindi, Kannada' },
  { id: 'DOC-104', code: 'SMN-DOC-104', name: 'Dr. Aryan Mehta', dept: 'Cardiology', deptCode: 'CAR', role: 'Consultant Cardiologist', qual: 'MBBS, MD, DM (Cardiology)', exp: '12 years', fee: 900, rating: 4.9, slots: SLOT_SET.slice(0, 6), days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], img: IMG.heroConsult, room: 'OPD-06', lang: 'English, Hindi' },
  { id: 'DOC-105', code: 'SMN-DOC-105', name: 'Dr. Priya Nair', dept: 'Neurology', deptCode: 'NEU', role: 'Consultant Neurologist', qual: 'MBBS, MD, DM (Neurology)', exp: '11 years', fee: 950, rating: 4.7, slots: SLOT_SET.slice(3), days: ['Tue', 'Wed', 'Thu', 'Fri'], img: IMG.heroNurse, room: 'OPD-08', lang: 'English, Malayalam' },
  { id: 'DOC-106', code: 'SMN-DOC-106', name: 'Dr. Vikram Rao', dept: 'Orthopedics', deptCode: 'ORT', role: 'Joint Replacement Surgeon', qual: 'MBBS, MS (Ortho)', exp: '18 years', fee: 800, rating: 4.8, slots: SLOT_SET.slice(0, 5), days: ['Mon', 'Tue', 'Wed', 'Thu'], img: IMG.heroDoctor, room: 'OPD-11', lang: 'English, Telugu, Kannada' },
  { id: 'DOC-107', code: 'SMN-DOC-107', name: 'Dr. Meera Iyer', dept: 'Pediatrics', deptCode: 'PED', role: 'Consultant Pediatrician', qual: 'MBBS, MD (Pediatrics)', exp: '9 years', fee: 550, rating: 4.9, slots: SLOT_SET, days: WEEK, img: IMG.heroNurse, room: 'OPD-14', lang: 'English, Tamil' },
  { id: 'DOC-108', code: 'SMN-DOC-108', name: 'Dr. Farah Khan', dept: 'Dermatology', deptCode: 'DER', role: 'Consultant Dermatologist', qual: 'MBBS, MD (Dermatology)', exp: '8 years', fee: 700, rating: 4.6, slots: SLOT_SET.slice(2, 8), days: ['Mon', 'Tue', 'Wed'], img: IMG.heroConsult, room: 'OPD-16', lang: 'English, Urdu, Hindi' },
  { id: 'DOC-109', code: 'SMN-DOC-109', name: 'Dr. Sanjay Kulkarni', dept: 'Emergency & Trauma', deptCode: 'EMR', role: 'Emergency Physician', qual: 'MBBS, MEM', exp: '14 years', fee: 500, rating: 4.7, slots: ['24 × 7'], days: WEEK, img: IMG.heroDoctor, room: 'ER-01', lang: 'English, Marathi, Hindi' },
]

/* ------------------------------------------------------------------ patient (demo identity: Manasa) */
export const PATIENT = {
  id: 'SMN-2026-000001',
  name: 'Manasa R',
  age: 24,
  gender: 'Female',
  blood: 'O+',
  mobile: '+91 98765 40001',
  email: 'manasa.demo@smartmed.health',
  address: '#14, 3rd Cross, Jayanagar 4th Block, Bengaluru 560041',
  lang: 'English, Kannada',
  insurance: 'Star Health — Family Floater',
  policy: 'SH-FF-2026-881401',
  healthScore: 91,
  emergency: { name: 'Ramesh R (Father)', mobile: '+91 98765 40002' },
  allergies: [
    { name: 'Penicillin', severity: 'Severe' },
    { name: 'Peanuts', severity: 'Moderate' },
    { name: 'Ibuprofen', severity: 'Moderate' },
  ],
  history: ['Mild persistent asthma (2019)', 'Iron deficiency anaemia (2024)', 'Polycystic ovary syndrome (2025)'],
  vaccines: ['Tetanus (2022)', 'HPV — 2 doses (2023)', 'Influenza (2026)', 'COVID-19 booster (2025)'],
  vitals: { height: 162, weight: 58, bmi: 22.1, systolic: 118, diastolic: 76, sugar: 96, hr: 72, spo2: 98 },
}

/* ------------------------------------------------------------------ vitals series */
const M = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
export const VITALS = {
  bp: M.map((d, i) => ({ d, sys: [126, 124, 121, 123, 119, 117, 118][i], dia: [82, 81, 79, 80, 78, 76, 76][i] })),
  sugar: M.map((d, i) => ({ d, f: [92, 94, 90, 88, 91, 95, 96][i], p: [138, 142, 131, 129, 134, 141, 143][i] })),
  hr: M.map((d, i) => ({ d, v: [78, 76, 74, 75, 71, 73, 72][i] })),
  weight: M.map((d, i) => ({ d, v: [60.4, 60.1, 59.6, 59.2, 58.7, 58.2, 58][i] })),
  score: M.map((d, i) => ({ d, v: [83, 85, 86, 88, 89, 90, 91][i] })),
  adherence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => ({ d, v: [100, 92, 88, 100, 94, 86, 96][i] })),
  daily: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => ({ d, steps: [6400, 8100, 7300, 9200, 6800, 10400, 7600][i], sleep: [6.8, 7.2, 7.6, 6.9, 7.4, 8.1, 7.0][i], water: [2.1, 2.6, 2.4, 2.8, 2.2, 3.0, 2.4][i], kcal: [1780, 1840, 1790, 1900, 1810, 1980, 1760][i] })),
}

/* ------------------------------------------------------------------ medications */
export const MEDS: Med[] = [
  { id: 'MED-01', name: 'Dolo 650', strength: '650 mg', slot: 'Morning', time: '08:00 AM', meal: 'After Food', dose: '1 tablet', frequency: 'Twice daily', prescriber: 'Dr. Rajesh Sharma', notes: 'SOS if temperature above 100°F', status: 'Active', adherence: { taken: 22, missed: 2 } },
  { id: 'MED-02', name: 'Ferrous Ascorbate', strength: '100 mg', slot: 'Afternoon', time: '02:00 PM', meal: 'After Food', dose: '1 tablet', frequency: 'Once daily', prescriber: 'Dr. Rajesh Sharma', notes: 'Take with vitamin C for absorption', status: 'Active', adherence: { taken: 24, missed: 1 } },
  { id: 'MED-03', name: 'Vitamin D3', strength: '60K IU', slot: 'Night', time: '09:00 PM', meal: 'After Food', dose: '1 sachet', frequency: 'Weekly', prescriber: 'Dr. Rajesh Sharma', status: 'Active', adherence: { taken: 3, missed: 1 } },
  { id: 'MED-04', name: 'Pantoprazole', strength: '40 mg', slot: 'Morning', time: '07:30 AM', meal: 'Before Food', dose: '1 tablet', frequency: 'Once daily', prescriber: 'Dr. Aryan Mehta', status: 'Active', adherence: { taken: 26, missed: 0 } },
  { id: 'MED-05', name: 'Budesonide Inhaler', strength: '200 mcg', slot: 'Night', time: '10:00 PM', meal: '—', dose: '2 puffs', frequency: 'Once daily', prescriber: 'Dr. Priya Nair', status: 'Active', adherence: { taken: 25, missed: 3 } },
  { id: 'MED-06', name: 'Azithromycin', strength: '500 mg', slot: 'Afternoon', time: '01:00 PM', meal: 'After Food', dose: '1 tablet', frequency: '3 day course', prescriber: 'Dr. Rajesh Sharma', status: 'Completed', adherence: { taken: 3, missed: 0 } },
]

/* ------------------------------------------------------------------ appointments */
export const APPOINTMENTS: Appointment[] = [
  { id: 'APT-2026-0001', doctor: 'Dr. Rajesh Sharma', dept: 'General Medicine', type: 'Video', date: '04 Oct 2026', time: '09:30 AM', token: 'T-04', status: 'COMPLETED', reason: 'Fever and body ache for 2 days', patient: 'Manasa R' },
  { id: 'APT-2026-0002', doctor: 'Dr. Rajesh Sharma', dept: 'General Medicine', type: 'In-Person', date: '04 Oct 2026', time: '06:00 PM', token: 'T-11', status: 'BOOKED', reason: 'Knee pain after activity', patient: 'Manasa R' },
  { id: 'APT-2026-0003', doctor: 'Dr. Aryan Mehta', dept: 'Cardiology', type: 'In-Person', date: '12 Oct 2026', time: '10:30 AM', token: 'T-07', status: 'BOOKED', reason: 'Palpitations and breathlessness', patient: 'Manasa R' },
  { id: 'APT-2026-0004', doctor: 'Dr. Meera Iyer', dept: 'Pediatrics', type: 'In-Person', date: '29 Sep 2026', time: '11:15 AM', token: 'T-07', status: 'CHECKED-IN', reason: 'Routine growth check', patient: 'Ananya Sharma' },
  { id: 'APT-2026-0005', doctor: 'Dr. Vikram Rao', dept: 'Orthopedics', type: 'Emergency', date: '29 Sep 2026', time: '02:15 AM', token: 'T-EMG', status: 'COMPLETED', reason: 'Road traffic accident — laceration', patient: 'Mahesh Gupta' },
  { id: 'APT-2026-0006', doctor: 'Dr. Farah Khan', dept: 'Dermatology', type: 'In-Person', date: '21 Sep 2026', time: '04:30 PM', token: 'T-12', status: 'COMPLETED', reason: 'Persistent facial rash', patient: 'Manasa R' },
  { id: 'APT-2026-0007', doctor: 'Dr. Rajesh Sharma', dept: 'General Medicine', type: 'Follow-up', date: '18 Sep 2026', time: '09:00 AM', token: 'T-02', status: 'CANCELLED', reason: 'Anaemia review', patient: 'Manasa R' },
]

/* ------------------------------------------------------------------ lab reports */
export const LAB_REPORTS: LabReport[] = [
  {
    id: 'LAB-2026-0941', panel: 'Complete Blood Count (CBC)', date: '02 Oct 2026', doctor: 'Dr. Rajesh Sharma', status: 'Verified',
    rows: [
      { name: 'Haemoglobin', value: 11.2, unit: 'g/dL', low: 12, high: 15 },
      { name: 'Total WBC', value: 7400, unit: '/µL', low: 4000, high: 11000 },
      { name: 'Platelet count', value: 245000, unit: '/µL', low: 150000, high: 410000 },
      { name: 'RBC count', value: 4.1, unit: 'million/µL', low: 4.2, high: 5.4 },
      { name: 'Haematocrit', value: 35.8, unit: '%', low: 36, high: 46 },
    ],
  },
  {
    id: 'LAB-2026-0877', panel: 'Thyroid Profile (TSH, T3, T4)', date: '24 Sep 2026', doctor: 'Dr. Priya Nair', status: 'Verified',
    rows: [
      { name: 'TSH', value: 3.1, unit: 'µIU/mL', low: 0.4, high: 4.2 },
      { name: 'T3', value: 118, unit: 'ng/dL', low: 80, high: 200 },
      { name: 'T4', value: 8.4, unit: 'µg/dL', low: 5.1, high: 14.1 },
    ],
  },
  {
    id: 'LAB-2026-0812', panel: 'Lipid Profile', date: '12 Sep 2026', doctor: 'Dr. Aryan Mehta', status: 'Processing',
    rows: [
      { name: 'Total cholesterol', value: 196, unit: 'mg/dL', low: 0, high: 200 },
      { name: 'LDL', value: 128, unit: 'mg/dL', low: 0, high: 100 },
      { name: 'HDL', value: 48, unit: 'mg/dL', low: 40, high: 60 },
      { name: 'Triglycerides', value: 142, unit: 'mg/dL', low: 0, high: 150 },
    ],
  },
]

/* ------------------------------------------------------------------ consultations */
export const CONSULTATIONS: Consultation[] = [
  {
    id: 'CNS-2026-000001', patient: 'Manasa R', patientId: 'SMN-2026-000001', doctor: 'Dr. Rajesh Sharma', date: '04 Oct 2026',
    complaint: 'Fever with chills and body ache for 2 days', diagnosis: 'Acute viral febrile illness (suspected)',
    plan: 'Antipyretic with proton-pump cover, oral hydration, review in 72 hours',
    notes: 'Advised tepid sponging and ORS. NSAIDs avoided due to documented allergy.',
    vitals: { sys: 118, dia: 76, temp: 100.6, pulse: 92, spo2: 98 }, status: 'Completed',
    prescription: {
      items: [
        { name: 'Dolo 650 (Paracetamol)', dose: '650 mg', freq: '1-0-1 (Twice daily)', duration: '5 Days', meal: 'After Food', notes: 'SOS if temperature > 100°F' },
        { name: 'Pantoprazole', dose: '40 mg', freq: '1-0-0', duration: '5 Days', meal: 'Before Food' },
      ],
      advice: 'Rest, 3 L oral fluids per day. Avoid Ibuprofen and peanuts (documented allergies). Return immediately if breathing difficulty or rash appears.',
      followUp: '11 Oct 2026',
    },
  },
  {
    id: 'CNS-2026-000002', patient: 'Manasa R', patientId: 'SMN-2026-000001', doctor: 'Dr. Farah Khan', date: '21 Sep 2026',
    complaint: 'Itchy rash over both cheeks for 1 week', diagnosis: 'Contact dermatitis — cosmetic trigger',
    plan: 'Topical steroid, fragrance-free moisturiser, avoid new cosmetics for 4 weeks',
    notes: 'Patch test advised if recurrence.', vitals: { sys: 116, dia: 74, temp: 98.4, pulse: 78, spo2: 99 }, status: 'Completed',
  },
  {
    id: 'CNS-2026-000003', patient: 'Manasa R', patientId: 'SMN-2026-000001', doctor: 'Dr. Priya Nair', date: '09 Sep 2026',
    complaint: 'Episodic wheeze at night, twice weekly', diagnosis: 'Mild persistent asthma',
    plan: 'Continue inhaled budesonide, spacer technique reviewed', notes: 'Peak flow diary started.',
    vitals: { sys: 120, dia: 78, temp: 98.6, pulse: 82, spo2: 97 }, status: 'Completed',
  },
]

/* ------------------------------------------------------------------ notifications */
export const NOTIFICATIONS: Notif[] = [
  { id: 'N-01', cat: 'Lab Report', title: 'CBC report published', body: 'Your Complete Blood Count is ready. Haemoglobin is slightly below range.', time: '2 h ago', read: false, tone: 'teal' },
  { id: 'N-02', cat: 'Medication', title: 'Dose reminder — Ferrous Ascorbate', body: 'Scheduled for 02:00 PM after food. Take with a source of vitamin C.', time: '5 h ago', read: false, tone: 'blue' },
  { id: 'N-03', cat: 'Appointment', title: 'Appointment confirmed', body: 'Dr. Rajesh Sharma · 04 Oct 2026 at 06:00 PM · Token T-11.', time: 'Yesterday', read: false, tone: 'blue' },
  { id: 'N-04', cat: 'AI Safety', title: 'Medication screening completed', body: 'No severe interactions found across your 5 active medicines.', time: '2 d ago', read: true, tone: 'green' },
  { id: 'N-05', cat: 'Prescription', title: 'New prescription issued', body: 'Dolo 650 and Pantoprazole added by Dr. Rajesh Sharma.', time: '3 d ago', read: true, tone: 'amber' },
  { id: 'N-06', cat: 'Emergency', title: 'Emergency drill completed', body: 'Campus ambulance drill finished with a 7-minute response time.', time: '1 w ago', read: true, tone: 'red' },
]

/* ------------------------------------------------------------------ emergency / front desk / lab / admin */
export const EMERGENCIES: Emergency[] = [
  { id: 'EMG-2026-0012', type: 'Road traffic accident', location: 'Hosur Road, Bengaluru', status: 'Closed', priority: 'CRITICAL', at: '29 Sep 2026 02:10', note: 'Two-wheeler skid, laceration to forearm.' },
]

export const QUEUE: { token: string; patient: string; dept: string; doctor: string; waited: string; priority: string; status?: string }[] = [
  { token: 'T-02', patient: 'Ananya Sharma', dept: 'Pediatrics', doctor: 'Dr. Meera Iyer', waited: '12 min', priority: 'Urgent', status: 'CHECKED-IN' },
  { token: 'T-07', patient: 'Rahul Verma', dept: 'Pediatrics', doctor: 'Dr. Meera Iyer', waited: '6 min', priority: 'Routine', status: 'WAITING' },
  { token: 'T-11', patient: 'Manasa R', dept: 'General Medicine', doctor: 'Dr. Rajesh Sharma', waited: '0 min', priority: 'Routine', status: 'BOOKED' },
  { token: 'T-14', patient: 'Imran Baig', dept: 'Cardiology', doctor: 'Dr. Aryan Mehta', waited: '20 min', priority: 'Routine', status: 'WAITING' },
]

export const BEDS = { total: 120, occupied: 78, available: 42, maintenance: 4, icu: 20, icuUsed: 14 }

export const LAB_REQUESTS = [
  { id: 'LR-2041', patient: 'Manasa R', doctor: 'Dr. Rajesh Sharma', panel: 'Complete Blood Count (CBC)', type: 'Blood Test', priority: 'Urgent', requested: '02 Oct 2026', status: 'Verified' },
  { id: 'LR-2042', patient: 'Ananya Sharma', doctor: 'Dr. Meera Iyer', panel: 'Urine Routine', type: 'Urine Test', priority: 'Routine', requested: '04 Oct 2026', status: 'Processing' },
  { id: 'LR-2043', patient: 'Rahul Verma', doctor: 'Dr. Meera Iyer', panel: 'Chest X-Ray', type: 'X-Ray', priority: 'Routine', requested: '04 Oct 2026', status: 'Pending' },
  { id: 'LR-2044', patient: 'Imran Baig', doctor: 'Dr. Aryan Mehta', panel: 'Lipid Profile', type: 'Blood Test', priority: 'Routine', requested: '03 Oct 2026', status: 'Processing' },
  { id: 'LR-2045', patient: 'Mahesh Gupta', doctor: 'Dr. Sanjay Kulkarni', panel: 'CT — Head', type: 'CT', priority: 'Urgent', requested: '29 Sep 2026', status: 'Verified' },
]

export const AUDIT_LOGS = [
  { id: 'AUD-9001', actor: 'Dr. Rajesh Sharma', action: 'Viewed patient record', entity: 'SMN-2026-000001', time: '04 Oct 2026 09:31', severity: 'Info', ip: '10.2.1.14' },
  { id: 'AUD-9002', actor: 'Sneha Pillai', action: 'Uploaded lab report', entity: 'LAB-2026-0941', time: '04 Oct 2026 08:12', severity: 'Info', ip: '10.2.3.51' },
  { id: 'AUD-9003', actor: 'System', action: 'Failed sign-in attempt', entity: 'USR-REC301', time: '03 Oct 2026 22:44', severity: 'Warning', ip: '103.21.44.9' },
  { id: 'AUD-9004', actor: 'Karthik S', action: 'Registered new patient', entity: 'SMN-2026-000004', time: '03 Oct 2026 16:02', severity: 'Info', ip: '10.2.1.9' },
  { id: 'AUD-9005', actor: 'Admin', action: 'Changed role permissions', entity: 'USR-LAB401', time: '02 Oct 2026 11:20', severity: 'Critical', ip: '10.2.0.2' },
]

export const REVENUE = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((m, i) => ({
  m, opd: [820000, 910000, 880000, 960000, 1020000, 1100000][i],
  ipd: [1240000, 1310000, 1280000, 1420000, 1460000, 1520000][i],
  lab: [310000, 340000, 360000, 390000, 420000, 450000][i],
}))

export const APPT_TREND = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => ({
  d, opd: [126, 142, 138, 151, 147, 98, 64][i], emg: [12, 15, 11, 18, 14, 9, 7][i],
}))

export const STAFF = [
  { id: 'USR-DOC103', code: 'SMN-DOC-103', name: 'Dr. Rajesh Sharma', role: 'Doctor', status: 'Active', spec: ['General Medicine'], email: 'rajesh@smartmed.health', i: 'RS', l: 'General Medicine', t: 'Senior Consultant', v: 'OPD-02' },
  { id: 'USR-DOC104', code: 'SMN-DOC-104', name: 'Dr. Aryan Mehta', role: 'Doctor', status: 'Active', spec: ['Cardiology'], email: 'aryan@smartmed.health', i: 'AM', l: 'Cardiology', t: 'Consultant', v: 'OPD-06' },
  { id: 'USR-DOC105', code: 'SMN-DOC-105', name: 'Dr. Priya Nair', role: 'Doctor', status: 'On Leave', spec: ['Neurology'], email: 'priya@smartmed.health', i: 'PN', l: 'Neurology', t: 'Consultant', v: 'OPD-08' },
  { id: 'USR-NUR201', code: 'SMN-NUR-201', name: 'Sr. Anjali Verma', role: 'Nurse', status: 'Active', spec: ['Ward A'], email: 'anjali@smartmed.health', i: 'AV', l: 'Nursing', t: 'Senior Staff Nurse', v: 'Ward A' },
  { id: 'USR-REC301', code: 'SMN-REC-301', name: 'Karthik S', role: 'Reception', status: 'Active', spec: ['Front Desk'], email: 'karthik@smartmed.health', i: 'KS', l: 'Front Desk', t: 'Front Desk Executive', v: 'Lobby' },
  { id: 'USR-LAB401', code: 'SMN-LAB-401', name: 'Sneha Pillai', role: 'Laboratory', status: 'Active', spec: ['Pathology'], email: 'sneha@smartmed.health', i: 'SP', l: 'Laboratory', t: 'Lab Technologist', v: 'Lab 1' },
  { id: 'USR-ADM501', code: 'SMN-ADM-501', name: 'Ravi Menon', role: 'Administrator', status: 'Active', spec: ['Operations'], email: 'ravi@smartmed.health', i: 'RM', l: 'Administration', t: 'Hospital Administrator', v: 'Block C' },
]

export const HEALTH_TIPS = [
  { t: 'Never mix paracetamol with a cold combination product', d: 'Many cold and flu remedies already contain paracetamol. Adding Dolo 650 on top can push your daily intake past the safe limit and strain your liver.' },
  { t: 'Iron tablets work better with vitamin C', d: 'Taking ferrous ascorbate with citrus juice or amla improves absorption. Avoid tea, coffee and calcium within one hour of the dose.' },
  { t: 'Inhalers are not habit-forming', d: 'A preventer inhaler reduces airway inflammation over time. Using it daily — even when you feel well — is what keeps night-time wheeze away.' },
  { t: 'Bring every medicine box to your appointment', d: 'Prescription, over-the-counter, ayurvedic and supplements all count. A full list is the only reliable way to screen for interactions.' },
]

export const MED_INFO: Record<string, { name: string; cls: string; used: string; cautions: string[] }> = {
  'Dolo 650': { name: 'Dolo 650 (Paracetamol)', cls: 'Analgesic / antipyretic', used: 'Fever and mild to moderate pain', cautions: ['Do not exceed 3 g in 24 hours', 'Avoid with active liver disease', 'Check combination cold remedies for hidden paracetamol'] },
  'Ferrous Ascorbate': { name: 'Ferrous Ascorbate', cls: 'Iron supplement', used: 'Iron deficiency anaemia', cautions: ['Take with vitamin C', 'May darken stools', 'Keep away from children — iron overdose is serious'] },
  'Pantoprazole': { name: 'Pantoprazole', cls: 'Proton-pump inhibitor', used: 'Acid suppression and gastric protection', cautions: ['Take 30 minutes before breakfast', 'Long-term use may lower B12 and magnesium'] },
  'Budesonide Inhaler': { name: 'Budesonide Inhaler', cls: 'Inhaled corticosteroid', used: 'Asthma control and prevention of exacerbations', cautions: ['Rinse mouth after each use', 'Not a reliever — use salbutamol for acute symptoms'] },
}
