#!/usr/bin/env bash
# MediCare AI — one-shot setup + run
#   Frontend : Vite + React (upgraded existing SmartMed project)
#   Backend  : Flask + SQLite (real Tesseract OCR, RxNav, sklearn)
set -e
echo "==> 1/4 Installing frontend dependencies"
npm install

echo "==> 2/4 Installing backend dependencies"
pip install -r backend/requirements.txt
# System packages needed for OCR (install once):
#   sudo apt-get install -y tesseract-ocr poppler-utils

echo "==> 3/4 Creating DB + seeding SYNTHETIC demo data"
python3 backend/seed.py

echo "==> 4/4 Starting servers"
# Terminal A (backend):  python3 backend/app.py        -> http://localhost:5000
# Terminal B (frontend): npm run dev                   -> http://localhost:5173
# Open http://localhost:5173  ->  sidebar entry "MediCare AI App"  (or http://localhost:5173/#/app)
echo "Run the two commands above in separate terminals. Demo logins (password Medicare@123):"
echo "  patient@demo.local · doctor@demo.local · family@demo.local · admin@demo.local"
