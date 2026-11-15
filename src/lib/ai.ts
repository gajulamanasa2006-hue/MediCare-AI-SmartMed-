/* =====================================================================
   SmartMed — deterministic demo "AI" helpers.
   Rule-based on purpose: no network calls, no keys, reproducible output.
   ===================================================================== */

export type MedSafety = {
  level: 'Low' | 'Moderate' | 'High'
  riskScore: number
  summary: string[]
  flags: { level: 'Severe' | 'Moderate' | 'Info'; title: string; detail: string; a: string; b: string; note: string }[]
  duplicates: string[]
  allergyHits: { med: string; allergen: string; severity: string }[]
  info: { name: string; cls: string; uses: string; cautions: string; caution?: string; food?: string }[]
}

const PAIRS: { a: string; b: string; level: 'Severe' | 'Moderate'; detail: string }[] = [
  { a: 'ibuprofen', b: 'aspirin', level: 'Severe', detail: 'Both are NSAIDs — combined use raises gastrointestinal bleeding risk.' },
  { a: 'ibuprofen', b: 'warfarin', level: 'Severe', detail: 'NSAIDs potentiate anticoagulation and can cause major bleeding.' },
  { a: 'paracetamol', b: 'dolo', level: 'Moderate', detail: 'Same active ingredient — this is a duplication, not a new medicine.' },
  { a: 'pantoprazole', b: 'omeprazole', level: 'Moderate', detail: 'Two proton-pump inhibitors together give no extra benefit.' },
  { a: 'ferrous', b: 'calcium', level: 'Moderate', detail: 'Calcium reduces iron absorption — separate the doses by 2 hours.' },
  { a: 'budesonide', b: 'prednisolone', level: 'Moderate', detail: 'Overlapping corticosteroids increase systemic exposure.' },
  { a: 'azithromycin', b: 'ondansetron', level: 'Severe', detail: 'Both prolong the QT interval — ECG monitoring advised.' },
]

const norm = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, '').trim()

export function analyseMeds({ meds = [], allergies = [], conditions = '' }: { meds?: string[]; allergies?: string[]; conditions?: string }): MedSafety {
  const list = meds.map(norm).filter(Boolean)
  const flags: MedSafety['flags'] = []
  const duplicates: string[] = []
  const allergyHits: MedSafety['allergyHits'] = []

  const seen = new Map<string, number>()
  list.forEach((m) => seen.set(m.split(' ')[0], (seen.get(m.split(' ')[0]) || 0) + 1))
  seen.forEach((n, k) => { if (n > 1) duplicates.push(k) })

  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const hit = PAIRS.find((p) => (list[i].includes(p.a) && list[j].includes(p.b)) || (list[i].includes(p.b) && list[j].includes(p.a)))
      if (hit) flags.push({ level: hit.level, title: `${meds[i]} + ${meds[j]}`, detail: hit.detail, a: meds[i], b: meds[j], note: hit.detail })
    }
  }

  list.forEach((m, i) => {
    allergies.forEach((a) => {
      const key = norm(a)
      if (key && (m.includes(key) || key.includes(m.split(' ')[0]))) {
        allergyHits.push({ med: meds[i], allergen: a, severity: `Recorded allergy: ${a}. Do not dispense without prescriber review.` })
        flags.push({ level: 'Severe', title: `Allergy conflict — ${meds[i]}`, detail: `Recorded allergy to ${a}. Do not dispense without prescriber review.`, a: meds[i], b: a, note: `Recorded allergy to ${a}.` })
      }
    })
  })

  if (duplicates.length) {
    flags.push({ level: 'Moderate', title: 'Therapeutic duplication', detail: `Repeated ingredient(s): ${duplicates.join(', ')}. Confirm this is intentional.`, a: duplicates.join(', '), b: 'duplicate', note: 'The same active ingredient appears more than once in this list.' })
  }
  if (/asthma/i.test(conditions)) {
    flags.push({ level: 'Info', title: 'Asthma on record', detail: 'Beta-blockers and NSAIDs may trigger bronchospasm — screen before prescribing.', a: 'Asthma', b: 'NSAIDs / beta-blockers', note: 'Beta-blockers and NSAIDs may trigger bronchospasm — screen before prescribing.' })
  }
  if (/anaemia/i.test(conditions) && !list.some((m) => m.includes('ferrous') || m.includes('iron'))) {
    flags.push({ level: 'Info', title: 'Anaemia on record', detail: 'No iron supplement on the active list. Consider reviewing supplementation.', a: 'Anaemia', b: 'Iron', note: 'No iron supplement on the active list. Consider reviewing supplementation.' })
  }

  const severe = flags.filter((f) => f.level === 'Severe').length
  const moderate = flags.filter((f) => f.level === 'Moderate').length
  const riskScore = Math.min(98, severe * 34 + moderate * 16 + duplicates.length * 8)
  const level: MedSafety['level'] = severe || riskScore >= 60 ? 'High' : moderate || riskScore >= 25 ? 'Moderate' : 'Low'

  const summary = [
    `${list.length} medicine${list.length === 1 ? '' : 's'} screened against ${allergies.length} recorded allerg${allergies.length === 1 ? 'y' : 'ies'} and the patient's documented conditions.`,
    severe ? `${severe} severe interaction${severe === 1 ? '' : 's'} found — resolve before dispensing or administering.` : 'No severe drug–drug interaction found in this combination.',
    moderate ? `${moderate} moderate issue${moderate === 1 ? '' : 's'} worth reviewing with the prescriber.` : 'No therapeutic duplication or moderate interaction detected.',
    'This is a decision-support aid. Always confirm against the prescription, the patient and current clinical guidelines.',
  ]

  return { level, riskScore, summary, flags, duplicates, allergyHits, info: buildInfo(meds) }
}

function buildInfo(meds: string[]) {
  return meds.map((m) => {
    const key = Object.keys(DRUGS).find((d) => norm(d).split(' ')[0] === norm(m).split(' ')[0]) || ''
    const d = DRUGS[key]
    return d
      ? { name: m, cls: d.cls, uses: d.used, cautions: d.cautions.join(' '), caution: d.cautions[0], food: d.food || 'As directed by your prescriber' }
      : { name: m, cls: 'Unrecognised — check spelling', uses: 'No catalogue entry for this medicine in the demo dataset.', cautions: 'Confirm the exact brand and strength with your pharmacist.', caution: 'Confirm the exact brand and strength with your pharmacist.', food: 'As directed' }
  })
}

/* ------------------------------------------------------------------ health score */
export function healthScore({ adherence = 90, bpSys = 118, bpDia = 76, sugar = 96, bmi = 22, hr = 72, spo2 = 98, abnormalLabs = 0 }: {
  adherence?: number; bpSys?: number; bpDia?: number; sugar?: number; bmi?: number; hr?: number; spo2?: number; abnormalLabs?: number
}) {
  const clamp = (v: number) => Math.max(0, Math.min(100, v))
  const bpPenalty = Math.max(0, (bpSys - 120)) * 1.6 + Math.max(0, (bpDia - 80)) * 2.2
  const parts = [
    { k: 'Medication adherence', v: clamp(adherence), w: 0.22, note: 'Doses logged on time over the last 30 days' },
    { k: 'Body composition', v: clamp(100 - Math.abs(bmi - 22) * 9), w: 0.14, note: 'BMI distance from the healthy midpoint' },
    { k: 'Glycaemic control', v: clamp(100 - Math.max(0, sugar - 95) * 1.5), w: 0.16, note: 'Fasting glucose against the 95 mg/dL target' },
    { k: 'Heart rhythm', v: clamp(100 - Math.abs(hr - 72) * 2.2), w: 0.12, note: 'Resting heart rate consistency at 72 bpm' },
    { k: 'Oxygenation', v: clamp(60 + (spo2 - 94) * 13), w: 0.12, note: 'SpO₂ from the latest recorded reading' },
    { k: 'Blood pressure', v: clamp(100 - bpPenalty), w: 0.14, note: 'Systolic and diastolic distance from 120/80' },
    { k: 'Report safety', v: clamp(100 - abnormalLabs * 12), w: 0.10, note: 'Markers outside the printed reference range' },
  ]
  const total = Math.round(parts.reduce((s, p) => s + p.v * p.w, 0) / parts.reduce((s, p) => s + p.w, 0))
  const band = total >= 85 ? 'Excellent' : total >= 70 ? 'Good' : total >= 55 ? 'Fair' : 'Needs attention'
  const advice = total >= 85
    ? 'Your weighted indicators are strong. Keep logging doses and vitals so the trend stays reliable.'
    : total >= 70 ? 'Most indicators are healthy; the weakest factor is worth discussing at your next visit.'
    : 'Several indicators need attention. Book a review and bring your medicine list with you.'
  return { total, band, advice, parts }
}

/* ------------------------------------------------------------------ symptom triage */
const RED = [/chest pain/i, /crushing/i, /unconscious/i, /not breathing/i, /breathless/i, /bleeding heavily/i, /stroke/i, /seizure/i, /overdose/i]
const AMBER = [/fever/i, /vomit/i, /diarrh/i, /abdominal/i, /rash/i, /dizzy/i, /wheez/i, /palpitation/i]

export function triageSymptoms(text: string, age = 30, known: string[] = []) {
  const t = text || ''
  const critical = RED.some((r) => r.test(t))
  const high = !critical && AMBER.filter((r) => r.test(t)).length >= 2
  const medium = !critical && !high && AMBER.some((r) => r.test(t))
  const level = critical ? 'CRITICAL' : high ? 'HIGH' : medium ? 'MEDIUM' : 'LOW'

  const dept = /chest|palpitation|heart/i.test(t) ? 'Cardiology'
    : /breath|wheez|asthma/i.test(t) ? 'General Medicine'
    : /rash|skin|itch/i.test(t) ? 'Dermatology'
    : /knee|joint|fracture|back pain/i.test(t) ? 'Orthopedics'
    : /headache|dizzy|numb|seizure/i.test(t) ? 'Neurology'
    : age < 14 ? 'Pediatrics' : 'General Medicine'

  const urgency = critical ? 'Emergency now' : high ? 'Same-day review' : medium ? 'Within 48 hours' : 'Routine appointment'
  const nextStep = critical ? 'Call emergency services or use Emergency Assistance now.'
    : high ? 'Book a same-day consultation; monitor symptoms every few hours.'
    : medium ? 'Book an appointment in the next 48 hours and log your vitals.'
    : 'Book a routine appointment at your convenience.'

  return {
    level, urgency, dept, nextStep,
    confidence: critical ? 0.94 : high ? 0.86 : medium ? 0.78 : 0.72,
    matched: [...known],
    next: nextStep,
    concerns: critical ? ['Red-flag symptom pattern detected'] : high ? ['Multiple moderate symptoms reported'] : medium ? ['Single moderate symptom'] : [],
    summary: `You described: "${t.slice(0, 140)}". Based on that wording alone, the suggested urgency is ${level.toLowerCase()} (${urgency.toLowerCase()}). ${known.length ? `Your record notes ${known.join(', ')}.` : ''} This is pattern-matching guidance, not a diagnosis.`,
  }
}

/* ------------------------------------------------------------------ emergency pre-triage */
export function emergencyPriority({ type = '', note = '', age = 30, symptoms = '', conscious = true, bleeding = false, breathing = false }: {
  type?: string; note?: string; age?: number; symptoms?: string; conscious?: boolean; bleeding?: boolean; breathing?: boolean
}) {
  const t = (type + ' ' + note + ' ' + symptoms).toLowerCase()
  const critical = !conscious || /cardiac|chest|stroke|unconscious|not breathing|severe bleeding|overdose|seizure/.test(t)
  const high = breathing || bleeding || /breath|fracture|burns|trauma|abdominal/.test(t)
  const priority = critical ? 'CRITICAL' : high ? 'HIGH' : 'MEDIUM'
  const dept = /chest|cardiac|palpitation/.test(t) ? 'Cardiology'
    : /stroke|seizure|unconscious|head/.test(t) ? 'Neurology'
    : /fracture|trauma|accident|bone/.test(t) ? 'Orthopedics'
    : /burn/.test(t) ? 'Emergency & Trauma'
    : 'Emergency & Trauma'
  return {
    level: priority,
    priority,
    dept,
    action: priority === 'CRITICAL'
      ? 'Dispatch the nearest advanced life support unit immediately; keep the caller on the line and prepare the resuscitation bay.'
      : priority === 'HIGH'
        ? 'Dispatch the nearest unit, advise first-aid measures and alert the on-call emergency physician.'
        : `Assign the next available unit for a ${age}-year-old and offer a nurse call-back.`,
    reason: priority === 'CRITICAL'
      ? 'Time-critical pattern: dispatch the nearest advanced life support unit and keep the caller on the line.'
      : priority === 'HIGH'
        ? 'Urgent but stable pattern: dispatch the nearest unit and advise first-aid measures.'
        : `Non-critical pattern for a ${age}-year-old: assign the next available unit and offer nurse call-back.`,
  }
}

/* ------------------------------------------------------------------ report OCR */
export function simulateOCR(fileName = 'report.jpg', kind = '') {
  const k = kind || (/x-?ray/i.test(fileName) ? 'X-Ray' : /cbc|blood/i.test(fileName) ? 'Blood Test' : 'Blood Test')
  return {
    kind: k,
    pages: 1,
    confidence: 0.93,
    extractedAt: new Date(2026, 9, 4).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    fields: [
      { field: 'Haemoglobin', name: 'Haemoglobin', value: '11.2 g/dL', flag: 'Low' },
      { field: 'Total WBC', name: 'Total WBC', value: '7400 /µL', flag: '' },
      { field: 'Platelet count', name: 'Platelet count', value: '2.45 lakh/µL', flag: '' },
      { field: 'Patient', name: 'Patient', value: 'Manasa R', flag: '' },
    ],
    nextStep: 'Share this report with your treating doctor before changing any medicine. Bring the printed copy to your next appointment.',
    summary: 'Five markers extracted from the uploaded report; one value sits below the printed reference range.',
    plainEnglish: 'Your haemoglobin is a little below the reference range, which can happen with iron deficiency. White cells and platelets look normal. Share this with your doctor before changing any medicine.',
  }
}

/* ------------------------------------------------------------------ drug lookup */
export function lookupDrug(name = '') {
  const key = Object.keys(DRUGS).find((d) => d.toLowerCase().includes(name.toLowerCase().split(' ')[0])) || ''
  const d = DRUGS[key]
  return {
    name: key || name || 'Unknown medicine',
    found: !!d,
    cls: d?.cls || 'Not in the demo catalogue',
    used: d?.used || 'No entry for this medicine in the demo dataset.',
    uses: d?.used || 'No entry for this medicine in the demo dataset.',
    cautions: d?.cautions || ['Ask your pharmacist for the printed leaflet.'],
    info: d?.used || 'No information available.',
  }
}

const DRUGS: Record<string, { cls: string; used: string; cautions: string[]; food?: string }> = {
  'Dolo 650': { cls: 'Analgesic / antipyretic', used: 'Fever and mild to moderate pain', cautions: ['Do not exceed 3 g in 24 hours', 'Avoid with active liver disease', 'Check cold remedies for hidden paracetamol'] },
  'Paracetamol': { cls: 'Analgesic / antipyretic', used: 'Fever and pain', cautions: ['Liver risk in overdose', 'Avoid combining with combination cold products'] },
  'Ferrous Ascorbate': { cls: 'Iron supplement', used: 'Iron deficiency anaemia', cautions: ['Take with vitamin C', 'Separate from calcium and tea by 2 hours'] },
  'Pantoprazole': { cls: 'Proton-pump inhibitor', used: 'Acid suppression', cautions: ['Take 30 minutes before food', 'Long-term use may lower B12'] },
  'Budesonide Inhaler': { cls: 'Inhaled corticosteroid', used: 'Asthma preventer', cautions: ['Rinse mouth after use', 'Not a reliever for acute attacks'] },
  'Azithromycin': { cls: 'Macrolide antibiotic', used: 'Respiratory and skin infections', cautions: ['Complete the full course', 'QT prolongation risk'] },
  'Ibuprofen': { cls: 'NSAID', used: 'Pain and inflammation', cautions: ['Avoid in asthma and kidney disease', 'Take after food'] },
}
