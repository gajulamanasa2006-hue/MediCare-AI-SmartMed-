/* =====================================================================
   ICU clinical demo logic — NEWS2 (National Early Warning Score 2).
   Scores are computed from the observations entered in the demo.
   This is a demonstration implementation, NOT a certified medical device.
   ===================================================================== */

export type Vitals = { hr: number; sys: number; dia: number; spo2: number; rr: number; temp: number }
export type AlertLevel = 'Normal' | 'Attention Required' | 'High Priority' | 'Critical'

export type ScorePart = { k: string; value: string; pts: number }

/* --- NEWS2 sub-scores (Royal College of Physicians, 2017) --------------- */
function rrPts(rr: number) {
  if (rr <= 8) return 3
  if (rr <= 11) return 1
  if (rr <= 20) return 0
  if (rr <= 24) return 2
  return 3
}
function spo2Pts(s: number) {
  if (s <= 91) return 3
  if (s <= 93) return 2
  if (s <= 95) return 1
  return 0
}
function sysPts(s: number) {
  if (s <= 90) return 3
  if (s <= 100) return 2
  if (s <= 110) return 1
  if (s <= 219) return 0
  return 3
}
function hrPts(h: number) {
  if (h <= 40) return 3
  if (h <= 50) return 1
  if (h <= 90) return 0
  if (h <= 110) return 1
  if (h <= 130) return 2
  return 3
}
function tempPts(t: number) {
  if (t <= 35.0) return 3
  if (t <= 36.0) return 1
  if (t <= 38.0) return 0
  if (t <= 39.0) return 1
  return 2
}

export function levelFromScore(total: number): AlertLevel {
  if (total >= 7) return 'Critical'
  if (total >= 5) return 'High Priority'
  if (total >= 3) return 'Attention Required'
  return 'Normal'
}

/** NEWS2 total (0–20) plus the contributing parameters for explainability. */
export function news2(v: Vitals): { total: number; level: AlertLevel; parts: ScorePart[] } {
  const parts: ScorePart[] = [
    { k: 'Respiratory rate', value: `${v.rr} /min`, pts: rrPts(v.rr) },
    { k: 'SpO₂', value: `${v.spo2} %`, pts: spo2Pts(v.spo2) },
    { k: 'Systolic BP', value: `${v.sys} mmHg`, pts: sysPts(v.sys) },
    { k: 'Heart rate', value: `${v.hr} bpm`, pts: hrPts(v.hr) },
    { k: 'Temperature', value: `${v.temp.toFixed(1)} °C`, pts: tempPts(v.temp) },
  ]
  const total = parts.reduce((s, p) => s + p.pts, 0)
  return { total, level: levelFromScore(total), parts }
}

/* --- severity ordering for escalation -------------------------------- */
export const LEVEL_RANK: Record<AlertLevel, number> = {
  Normal: 0, 'Attention Required': 1, 'High Priority': 2, Critical: 3,
}

/* --- explainable reasons derived from consecutive readings ------------ */
export function trendReasons(hist: Vitals[], v: Vitals): string[] {
  const out: string[] = []
  const prev = hist.length ? hist[hist.length - 1] : v
  const prev2 = hist.length > 1 ? hist[hist.length - 2] : prev

  if (v.spo2 < prev.spo2 && prev.spo2 <= prev2.spo2) out.push(`Oxygen saturation has fallen across consecutive readings (${prev2.spo2}% → ${prev.spo2}% → ${v.spo2}%).`)
  else if (v.spo2 <= 93) out.push(`Oxygen saturation is ${v.spo2}%, below the 94% lower bound configured for this unit.`)

  if (v.hr > prev.hr && prev.hr >= prev2.hr) out.push(`Heart rate has risen across consecutive readings (${prev2.hr} → ${prev.hr} → ${v.hr} bpm).`)
  else if (v.hr >= 111) out.push(`Heart rate is ${v.hr} bpm, above the 110 bpm threshold.`)

  if (v.sys < prev.sys && prev.sys <= prev2.sys) out.push(`Systolic blood pressure is trending downward (${prev2.sys} → ${prev.sys} → ${v.sys} mmHg).`)

  if (v.rr >= 21) out.push(`Respiratory rate is ${v.rr} /min, above the 20 /min threshold.`)
  if (v.temp >= 38.1) out.push(`Temperature is ${v.temp.toFixed(1)} °C, indicating fever.`)
  if (!out.length) out.push('Composite early-warning score crossed the configured escalation threshold.')
  return out
}

/* --- demo deterioration: deterministic drift so the scenario is repeatable */
export function driftVitals(v: Vitals, tick: number, aggressiveness = 1): Vitals {
  const n = (base: number, amp: number) => base + Math.round((Math.random() - 0.5) * amp)
  return {
    hr: Math.max(48, Math.min(168, n(v.hr + Math.round(0.8 * aggressiveness), 4))),
    sys: Math.max(74, Math.min(190, n(v.sys - Math.round(0.7 * aggressiveness), 4))),
    dia: Math.max(40, Math.min(112, n(v.dia - Math.round(0.4 * aggressiveness), 3))),
    spo2: Math.max(80, Math.min(100, n(v.spo2 - Math.round(0.45 * aggressiveness), 2))),
    rr: Math.max(9, Math.min(38, n(v.rr + Math.round(0.35 * aggressiveness), 2))),
    temp: Math.max(35.2, Math.min(40.4, Number((v.temp + 0.05 * aggressiveness + (Math.random() - 0.5) * 0.12).toFixed(1)))),
  }
}

export function stableVitals(v: Vitals): Vitals {
  const n = (base: number, amp: number) => base + Math.round((Math.random() - 0.5) * amp)
  return {
    hr: Math.max(56, Math.min(104, n(v.hr, 5))),
    sys: Math.max(104, Math.min(148, n(v.sys, 6))),
    dia: Math.max(62, Math.min(94, n(v.dia, 4))),
    spo2: Math.max(95, Math.min(100, n(v.spo2, 2))),
    rr: Math.max(12, Math.min(20, n(v.rr, 2))),
    temp: Number(Math.max(36.2, Math.min(37.6, v.temp + (Math.random() - 0.5) * 0.16)).toFixed(1)),
  }
}

/* --- lab critical thresholds (configurable, lab-specific) ------------- */
export type LabParam = { key: string; name: string; unit: string; low: number; high: number; criticalLow?: number; criticalHigh?: number }
export const LAB_PARAMS: LabParam[] = [
  { key: 'hb', name: 'Haemoglobin', unit: 'g/dL', low: 12, high: 15.5, criticalLow: 7, criticalHigh: 20 },
  { key: 'glu', name: 'Blood glucose', unit: 'mg/dL', low: 70, high: 140, criticalLow: 45, criticalHigh: 400 },
  { key: 'wbc', name: 'White cell count', unit: '10³/µL', low: 4, high: 11, criticalLow: 1.5, criticalHigh: 30 },
  { key: 'plt', name: 'Platelet count', unit: '10³/µL', low: 150, high: 450, criticalLow: 50, criticalHigh: 1000 },
  { key: 'creat', name: 'Creatinine', unit: 'mg/dL', low: 0.6, high: 1.3, criticalLow: 0.2, criticalHigh: 4 },
  { key: 'k', name: 'Potassium', unit: 'mmol/L', low: 3.5, high: 5.1, criticalLow: 2.8, criticalHigh: 6.2 },
]

export function criticalFlags(values: { key: string; value: number }[]) {
  const out: { key: string; name: string; value: number; unit: string; reason: string }[] = []
  values.forEach((v) => {
    const p = LAB_PARAMS.find((x) => x.key === v.key)
    if (!p) return
    if (p.criticalLow !== undefined && v.value <= p.criticalLow) out.push({ key: p.key, name: p.name, value: v.value, unit: p.unit, reason: `at or below the critical low threshold of ${p.criticalLow} ${p.unit}` })
    else if (p.criticalHigh !== undefined && v.value >= p.criticalHigh) out.push({ key: p.key, name: p.name, value: v.value, unit: p.unit, reason: `at or above the critical high threshold of ${p.criticalHigh} ${p.unit}` })
  })
  return out
}

/* --- demo ICU cohort --------------------------------------------------- */
export type IcuPatient = {
  id: string; name: string; age: number; sex: string; bed: string; ward: string;
  diagnosis: string; doctor: string; nurse: string; admittedAt: string;
  vitals: Vitals; history: { t: number; v: Vitals }[];
  /** links this ICU record to the patient portal identity */
  portalPatient?: boolean;
  decline: number;
}

const now = Date.now()
const seedHist = (base: Vitals): { t: number; v: Vitals }[] =>
  Array.from({ length: 12 }, (_, i) => ({ t: now - (11 - i) * 5000, v: { ...base } }))

export const ICU_SEED: IcuPatient[] = [
  {
    id: 'ICU-001', name: 'Ananya Sharma', age: 34, sex: 'Female', bed: 'ICU-01', ward: 'ICU · Bay A',
    diagnosis: 'Post-operative recovery — laparotomy', doctor: 'Dr. Rajesh Sharma', nurse: 'Sr. Anjali Verma',
    admittedAt: '26 Oct 2026 14:20', decline: 0.15,
    vitals: { hr: 96, sys: 112, dia: 68, spo2: 94, rr: 19, temp: 37.6 },
    history: seedHist({ hr: 96, sys: 112, dia: 68, spo2: 94, rr: 19, temp: 37.6 }),
  },
  {
    id: 'ICU-002', name: 'Rahul Verma', age: 61, sex: 'Male', bed: 'ICU-02', ward: 'ICU · Bay A',
    diagnosis: 'Community-acquired pneumonia', doctor: 'Dr. Aryan Mehta', nurse: 'Sr. Anjali Verma',
    admittedAt: '27 Oct 2026 03:05', decline: 0.45,
    vitals: { hr: 104, sys: 104, dia: 62, spo2: 92, rr: 22, temp: 38.4 },
    history: seedHist({ hr: 104, sys: 104, dia: 62, spo2: 92, rr: 22, temp: 38.4 }),
  },
  {
    id: 'ICU-003', name: 'Manasa R', age: 24, sex: 'Female', bed: 'ICU-03', ward: 'ICU · Bay B',
    diagnosis: 'Severe asthma exacerbation — admitted from ED', doctor: 'Dr. Priya Nair', nurse: 'Sr. Anjali Verma',
    admittedAt: '27 Oct 2026 08:40', portalPatient: true, decline: 1,
    vitals: { hr: 98, sys: 116, dia: 72, spo2: 95, rr: 20, temp: 37.4 },
    history: seedHist({ hr: 98, sys: 116, dia: 72, spo2: 95, rr: 20, temp: 37.4 }),
  },
  {
    id: 'ICU-004', name: 'Mahesh Gupta', age: 47, sex: 'Male', bed: 'ICU-04', ward: 'ICU · Bay B',
    diagnosis: 'Polytrauma — road traffic accident', doctor: 'Dr. Vikram Rao', nurse: 'Sr. Meena Das',
    admittedAt: '26 Oct 2026 22:10', decline: 0.25,
    vitals: { hr: 88, sys: 124, dia: 78, spo2: 97, rr: 17, temp: 37.1 },
    history: seedHist({ hr: 88, sys: 124, dia: 78, spo2: 97, rr: 17, temp: 37.1 }),
  },
  {
    id: 'ICU-005', name: 'Imran Baig', age: 52, sex: 'Male', bed: 'ICU-05', ward: 'ICU · Bay C',
    diagnosis: 'Acute decompensated heart failure', doctor: 'Dr. Aryan Mehta', nurse: 'Sr. Meena Das',
    admittedAt: '27 Oct 2026 01:55', decline: 0.55,
    vitals: { hr: 112, sys: 96, dia: 58, spo2: 91, rr: 24, temp: 37.9 },
    history: seedHist({ hr: 112, sys: 96, dia: 58, spo2: 91, rr: 24, temp: 37.9 }),
  },
  {
    id: 'ICU-006', name: 'Kavya Nair', age: 29, sex: 'Female', bed: 'ICU-06', ward: 'ICU · Bay C',
    diagnosis: 'Diabetic ketoacidosis — resolving', doctor: 'Dr. Rajesh Sharma', nurse: 'Sr. Anjali Verma',
    admittedAt: '26 Oct 2026 19:30', decline: 0.1,
    vitals: { hr: 84, sys: 118, dia: 74, spo2: 98, rr: 16, temp: 36.9 },
    history: seedHist({ hr: 84, sys: 118, dia: 74, spo2: 98, rr: 16, temp: 36.9 }),
  },
]
