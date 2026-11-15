# MediCare AI — Smart Healthcare. Safer Living.

An in-place upgrade of the existing **SmartMed** project into a complete AI-powered healthcare & medical-safety platform. All original pages, portals, charts and demo flows are preserved; MediCare AI adds a real backend (Flask + SQLite) and a full suite of health modules wired to live, verified data sources.

## What the existing project was (before upgrade)

- **Stack:** React 18 + TypeScript + Vite + Tailwind (SPA, hash router), no backend (empty `backend/` folder, all data in localStorage via `AppContext`).
- **Existing features (all preserved):** public site (Home/About/Services/Doctors/Emergency/Contact), AI Tools page, login page, 7 role portals (patient, doctor, nurse, reception, lab, admin, ambulance) with ICU command center, clinical intelligence, ambulance tracking, Leaflet maps, Recharts charts.
- **Reuse map:** every original file kept. New modules plug in alongside (`#/app`); branding updated to MediCare AI; original portals still work.

## New in MediCare AI

| Module | Backend | Data source (no fabrication) |
|---|---|---|
| Auth, RBAC, consent | `backend/app.py` — Flask + SQLite, hashed passwords (werkzeug), bearer sessions, forgot/reset password | local DB |
| Health monitoring (7 vitals, voice entry, charts) | `/api/readings*` | patient's own DB rows |
| AI risk analysis | `/api/risk/analyze` — Isolation Forest anomalies + linear trends + transparent rule engine; **returns "insufficient data" below 10 readings** | scikit-learn on logged readings |
| Prescription scanner | `/api/ocr/prescription` — **real Tesseract OCR** (server), uncertainty highlighting, read-aloud (te/hi/en) | Tesseract on uploaded files |
| Lab report analyzer | `/api/ocr/lab` — PDF (pdftotext) / image OCR, flags vs the report's own reference range | Tesseract/pdftotext |
| Medicine safety checker | `/api/medicines/interactions` — live NIH **RxNav/RxNorm** interactions, duplicate ingredients, personal allergy cross-check | RxNav (NIH), free, keyless |
| Generic medicine finder | `/api/medicines/generic` — live RxNorm equivalents; **prices gated behind `MEDICINE_PRICE_API_KEY`** (never fabricated) | RxNav (NIH) |
| Reminders & missed doses | `/api/reminders*` — taken/not-taken, missed tracking, expiry alerts, browser + in-app + TTS notifications; **no "take an extra dose" advice ever** | local DB |
| Emergency SOS | `/api/emergency/alert` — in-app always; **SMS via Twilio only when `TWILIO_*` env vars set**; 112 banner everywhere | Twilio (optional) |
| Voice assistant | client Web Speech API + TTS, te/hi/en, reads your real readings/reminders | browser speech |
| Doctor / family / admin dashboards | consent-gated patient views, audit logs, stats | local DB |
| Security | role-based access, consent revocation, upload validation (type + 10 MB), private per-user document storage, full audit trail | local DB |

## Run it

```bash
# 1. system deps for OCR (once):  sudo apt-get install -y tesseract-ocr poppler-utils
npm install
pip install -r backend/requirements.txt

# 2. create DB + SYNTHETIC demo data
python3 backend/seed.py

# 3. run (two terminals)
python3 backend/app.py     # backend → http://localhost:5000
npm run dev                # frontend → http://localhost:5173
```

Open **http://localhost:5173/#/app** (or the "MediCare AI App" sidebar link on the public site).

**Demo logins** (password `Medicare@123`, all data labeled SYNTHETIC):
`patient@demo.local` · `doctor@demo.local` · `family@demo.local` · `admin@demo.local`

Production: `npm run build` then `python3 backend/app.py` — Flask serves the built SPA from `dist/`.

## Configuration (all optional — see `.env.example`)

- `SMTP_*` — email for password reset/notifications (unset → dev reset token shown in-app)
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM` — real SMS on SOS (unset → in-app alerts + explicit "integration not active" message)
- `MEDICINE_PRICE_API_KEY` — licensed Indian price data (unset → RxNav equivalents shown, **no prices displayed**)

## Known gaps

- Price comparison requires a licensed provider key — deliberately shows "integration not active" rather than fake prices.
- Risk screening is rule-based + Isolation Forest on logged readings; it is **not clinically validated** and never diagnoses or predicts emergencies.
- OCR accuracy depends on prescription handwriting quality; uncertain words are flagged and pharmacist verification is always required.
- Voice input needs a Chromium browser; read-aloud works elsewhere.

## Safety notices baked into the product

- Not an emergency medical service — call **112 (India)** for emergencies.
- All AI output is informational; pharmacist/doctor verification is required for prescriptions and lab interpretation.
- Missed dose → never "take an extra dose"; ask a professional.
- Patient consent controls all family/doctor access and is revocable; every access is audit-logged.
