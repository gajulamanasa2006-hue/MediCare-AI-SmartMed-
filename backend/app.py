"""
MediCare AI — Smart Healthcare. Safer Living.
Flask backend for the upgraded SmartMed project.
SQLite DB, session-token auth, RBAC, consent-based access, real Tesseract OCR,
real RxNav (NIH) drug interactions, real sklearn anomaly detection.
No fabricated medical data: every external integration degrades to an explicit
"integration not active" state when no key/service is configured.
"""
import os, re, json, sqlite3, secrets, hashlib, datetime as dt
from functools import wraps
from flask import Flask, request, jsonify, g, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE, 'backend', 'medicare.db')
MEDIA = os.path.join(BASE, 'media', 'documents')
os.makedirs(MEDIA, exist_ok=True)

ALLOWED_EXT = {'.png', '.jpg', '.jpeg', '.webp', '.pdf'}
MAX_UPLOAD = 10 * 1024 * 1024  # 10 MB

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=['http://localhost:5173', 'http://127.0.0.1:5173'])

# ------------------------------------------------------------------ DB helper
def db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute('PRAGMA foreign_keys = ON')
    return g.db

@app.teardown_appcontext
def _close(e): 
    d = g.pop('db', None)
    if d: d.close()

def q(sql, args=()):
    return db().execute(sql, args).fetchall()

def q1(sql, args=()):
    return db().execute(sql, args).fetchone()

def ex(sql, args=()):
    cur = db().execute(sql, args); db().commit(); return cur

def audit(action, detail=''):
    u = getattr(g, 'user', None)
    ex('INSERT INTO audit_logs(user_id, action, detail, created_at) VALUES (?,?,?,?)',
       (u['id'] if u else None, action, detail, now()))

def now():
    return dt.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

# ------------------------------------------------------------------ schema
SCHEMA = """
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL
    CHECK(role IN ('patient','doctor','family','admin')),
  created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(
  token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT, expires_at TEXT);
CREATE TABLE IF NOT EXISTS reset_tokens(
  token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), created_at TEXT);
CREATE TABLE IF NOT EXISTS patient_profiles(
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE REFERENCES users(id),
  age INTEGER, phone TEXT, emergency_contact TEXT, conditions TEXT, allergies TEXT,
  blood_group TEXT, doctor_id INTEGER REFERENCES users(id), created_at TEXT);
CREATE TABLE IF NOT EXISTS doctors(
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE REFERENCES users(id),
  specialty TEXT, license_no TEXT);
CREATE TABLE IF NOT EXISTS consents(
  id INTEGER PRIMARY KEY AUTOINCREMENT, patient_user_id INTEGER NOT NULL REFERENCES users(id),
  member_user_id INTEGER REFERENCES users(id), member_email TEXT NOT NULL,
  relation TEXT, status TEXT NOT NULL DEFAULT 'granted',
  created_at TEXT, revoked_at TEXT);
CREATE TABLE IF NOT EXISTS readings(
  id INTEGER PRIMARY KEY AUTOINCREMENT, patient_user_id INTEGER NOT NULL REFERENCES users(id),
  reading_date TEXT NOT NULL, glucose REAL, systolic REAL, diastolic REAL,
  heart_rate REAL, spo2 REAL, temperature REAL, weight REAL,
  source TEXT DEFAULT 'manual', note TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS prescriptions(
  id INTEGER PRIMARY KEY AUTOINCREMENT, patient_user_id INTEGER NOT NULL REFERENCES users(id),
  file_path TEXT, raw_text TEXT, ocr_conf REAL, doctor_name TEXT, uploaded_at TEXT);
CREATE TABLE IF NOT EXISTS prescription_meds(
  id INTEGER PRIMARY KEY AUTOINCREMENT, prescription_id INTEGER NOT NULL REFERENCES prescriptions(id),
  name TEXT, dosage TEXT, frequency TEXT, before_food TEXT, duration TEXT,
  instructions TEXT, confidence REAL, confirmed INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS medicine_interactions(
  id INTEGER PRIMARY KEY AUTOINCREMENT, cache_key TEXT UNIQUE, payload TEXT, fetched_at TEXT);
CREATE TABLE IF NOT EXISTS reminders(
  id INTEGER PRIMARY KEY AUTOINCREMENT, patient_user_id INTEGER NOT NULL REFERENCES users(id),
  med_name TEXT NOT NULL, dosage TEXT, times TEXT NOT NULL, frequency TEXT,
  start_date TEXT, end_date TEXT, before_food TEXT, expiry_date TEXT,
  status TEXT DEFAULT 'active', created_at TEXT);
CREATE TABLE IF NOT EXISTS reminder_logs(
  id INTEGER PRIMARY KEY AUTOINCREMENT, reminder_id INTEGER NOT NULL REFERENCES reminders(id),
  sched_date TEXT, sched_time TEXT, status TEXT CHECK(status IN ('taken','skipped','missed')),
  logged_at TEXT,
  UNIQUE(reminder_id, sched_date, sched_time));
CREATE TABLE IF NOT EXISTS lab_reports(
  id INTEGER PRIMARY KEY AUTOINCREMENT, patient_user_id INTEGER NOT NULL REFERENCES users(id),
  file_path TEXT, raw_text TEXT, uploaded_at TEXT);
CREATE TABLE IF NOT EXISTS lab_results(
  id INTEGER PRIMARY KEY AUTOINCREMENT, report_id INTEGER NOT NULL REFERENCES lab_reports(id),
  test_name TEXT, value TEXT, unit TEXT, ref_range TEXT, flag TEXT);
CREATE TABLE IF NOT EXISTS emergency_contacts(
  id INTEGER PRIMARY KEY AUTOINCREMENT, patient_user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL, relation TEXT, phone TEXT, email TEXT);
CREATE TABLE IF NOT EXISTS emergency_events(
  id INTEGER PRIMARY KEY AUTOINCREMENT, patient_user_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT, note TEXT, status TEXT, delivered_via TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS appointments(
  id INTEGER PRIMARY KEY AUTOINCREMENT, patient_user_id INTEGER NOT NULL REFERENCES users(id),
  doctor_user_id INTEGER REFERENCES users(id), date TEXT, time TEXT, reason TEXT,
  status TEXT DEFAULT 'booked', notes TEXT);
CREATE TABLE IF NOT EXISTS notifications(
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT, title TEXT, body TEXT, read INTEGER DEFAULT 0, created_at TEXT);
CREATE TABLE IF NOT EXISTS audit_logs(
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, action TEXT, detail TEXT, created_at TEXT);
"""

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA); conn.commit(); conn.close()

# ------------------------------------------------------------------ auth
def make_session(uid):
    token = secrets.token_hex(32)
    exp = (dt.datetime.utcnow() + dt.timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S')
    ex('INSERT INTO sessions(token,user_id,created_at,expires_at) VALUES (?,?,?,?)', (token, uid, now(), exp))
    return token

def current_user():
    tok = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not tok: return None
    row = q1("""SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id
                WHERE s.token=? AND s.expires_at > ?""", (tok, now()))
    return row

@app.before_request
def load_user():
    g.user = current_user()

def require_auth(fn):
    @wraps(fn)
    def w(*a, **kw):
        if not g.user: return jsonify(error='Authentication required'), 401
        return fn(*a, **kw)
    return w

def require_role(*roles):
    def d(fn):
        @wraps(fn)
        def w(*a, **kw):
            if not g.user: return jsonify(error='Authentication required'), 401
            if roles and g.user['role'] not in roles:
                return jsonify(error='Not authorized for this role'), 403
            return fn(*a, **kw)
        return w
    return d

def own_patient_or_authorized(patient_id):
    """RBAC + consent: admins see all; patients only self; doctor/family need consent or assignment."""
    u = g.user
    if u['role'] == 'admin': return True
    if u['id'] == patient_id: return True
    if u['role'] == 'doctor':
        if q1("SELECT 1 FROM consents WHERE patient_user_id=? AND member_user_id=? AND status='granted'", (patient_id, u['id'])):
            return True
        if q1("SELECT 1 FROM patient_profiles WHERE user_id=? AND doctor_id=?", (patient_id, u['id'])):
            return True
        return False
    if u['role'] == 'family':
        return bool(q1("SELECT 1 FROM consents WHERE patient_user_id=? AND member_user_id=? AND status='granted'", (patient_id, u['id'])))
    return False

def save_upload(file, user_id):
    fn = secure_filename(file.filename or 'upload')
    ext = os.path.splitext(fn)[1].lower()
    if ext not in ALLOWED_EXT: return None, 'File type not allowed. Use PNG, JPG, WEBP or PDF.'
    file.seek(0, 2); size = file.tell(); file.seek(0)
    if size > MAX_UPLOAD: return None, 'File exceeds the 10 MB limit.'
    folder = os.path.join(MEDIA, str(user_id)); os.makedirs(folder, exist_ok=True)
    stored = f"{secrets.token_hex(8)}_{fn}"
    path = os.path.join(folder, stored)
    file.save(path)
    return path, None

# ================================================================ AUTH API
@app.post('/api/auth/register')
def register():
    d = request.get_json(force=True)
    email = (d.get('email') or '').strip().lower()
    if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email): return jsonify(error='Valid email required'), 400
    if len(d.get('password') or '') < 8: return jsonify(error='Password must be at least 8 characters'), 400
    if q1('SELECT 1 FROM users WHERE email=?', (email,)): return jsonify(error='Email already registered'), 409
    role = d.get('role', 'patient')
    if role not in ('patient', 'doctor', 'family'): role = 'patient'
    cur = ex('INSERT INTO users(email,password_hash,name,role,created_at) VALUES (?,?,?,?,?)',
             (email, generate_password_hash(d['password']), d.get('name') or 'New User', role, now()))
    uid = cur.lastrowid
    if role == 'patient':
        ex("""INSERT INTO patient_profiles(user_id,age,phone,emergency_contact,conditions,allergies,
              blood_group,created_at) VALUES (?,?,?,?,?,?,?,?)""",
           (uid, d.get('age'), d.get('phone'), d.get('emergency_contact'), d.get('conditions'),
            d.get('allergies'), d.get('blood_group'), now()))
    if role == 'doctor':
        ex('INSERT INTO doctors(user_id,specialty,license_no) VALUES (?,?,?)',
           (uid, d.get('specialty', ''), d.get('license_no', '')))
    audit('register', email)
    token = make_session(uid)
    return jsonify(token=token, user={'id': uid, 'name': d.get('name'), 'role': role, 'email': email})

@app.post('/api/auth/login')
def login():
    d = request.get_json(force=True)
    u = q1('SELECT * FROM users WHERE email=?', ((d.get('email') or '').strip().lower(),))
    if not u or not check_password_hash(u['password_hash'], d.get('password') or ''):
        return jsonify(error='Invalid email or password'), 401
    token = make_session(u['id'])
    audit('login', u['email'])
    return jsonify(token=token, user={'id': u['id'], 'name': u['name'], 'role': u['role'], 'email': u['email']})

@app.post('/api/auth/logout')
@require_auth
def logout():
    tok = request.headers.get('Authorization', '').replace('Bearer ', '')
    ex('DELETE FROM sessions WHERE token=?', (tok,)); audit('logout')
    return jsonify(ok=True)

@app.post('/api/auth/forgot-password')
def forgot_password():
    d = request.get_json(force=True)
    u = q1('SELECT * FROM users WHERE email=?', ((d.get('email') or '').strip().lower(),))
    if not u: return jsonify(error='If the email exists, a reset link has been sent'), 200  # no user enumeration
    token = secrets.token_urlsafe(24)
    ex('INSERT INTO reset_tokens(token,user_id,created_at) VALUES (?,?,?)', (token, u['id'], now()))
    # Email delivery requires SMTP_* env config; in dev the token is returned directly.
    if not os.environ.get('SMTP_HOST'):
        return jsonify(ok=True, dev_note='Email delivery not configured (SMTP_HOST unset). Dev reset token:', token=token)
    return jsonify(ok=True)

@app.post('/api/auth/reset-password')
def reset_password():
    d = request.get_json(force=True)
    row = q1('SELECT * FROM reset_tokens WHERE token=?', (d.get('token') or '',))
    if not row: return jsonify(error='Invalid or expired reset token'), 400
    pw = d.get('password') or ''
    if len(pw) < 8: return jsonify(error='Password must be at least 8 characters'), 400
    ex('UPDATE users SET password_hash=? WHERE id=?', (generate_password_hash(pw), row['user_id']))
    ex('DELETE FROM reset_tokens WHERE token=?', (row['token'],))
    return jsonify(ok=True)

@app.get('/api/auth/me')
@require_auth
def me():
    u = g.user
    prof = q1('SELECT * FROM patient_profiles WHERE user_id=?', (u['id'],))
    return jsonify(user={'id': u['id'], 'name': u['name'], 'role': u['role'], 'email': u['email'],
                        'profile': dict(prof) if prof else None})

# ================================================================ PROFILE
@app.get('/api/profile')
@require_auth
def get_profile():
    p = q1('SELECT * FROM patient_profiles WHERE user_id=?', (g.user['id'],))
    return jsonify(profile=dict(p) if p else None)

@app.put('/api/profile')
@require_role('patient')
def put_profile():
    d = request.get_json(force=True)
    fields = ['age', 'phone', 'emergency_contact', 'conditions', 'allergies', 'blood_group', 'doctor_id']
    vals = {k: d.get(k) for k in fields}
    if q1('SELECT 1 FROM patient_profiles WHERE user_id=?', (g.user['id'],)):
        ex("""UPDATE patient_profiles SET age=?,phone=?,emergency_contact=?,conditions=?,allergies=?,
              blood_group=?,doctor_id=? WHERE user_id=?""",
           (vals['age'], vals['phone'], vals['emergency_contact'], vals['conditions'], vals['allergies'],
            vals['blood_group'], vals['doctor_id'], g.user['id']))
    else:
        ex("""INSERT INTO patient_profiles(user_id,age,phone,emergency_contact,conditions,allergies,
              blood_group,created_at) VALUES (?,?,?,?,?,?,?,?,?)""",
           (g.user['id'], vals['age'], vals['phone'], vals['emergency_contact'], vals['conditions'],
            vals['allergies'], vals['blood_group'], now()))
    audit('profile_update')
    return jsonify(ok=True)

@app.get('/api/doctors')
@require_auth
def list_doctors():
    rows = q("""SELECT d.user_id, u.name, d.specialty FROM doctors d JOIN users u ON u.id=d.user_id""")
    return jsonify(doctors=[dict(r) for r in rows])

# ================================================================ CONSENTS
@app.get('/api/consents')
@require_auth
def consents():
    if g.user['role'] == 'patient':
        rows = q("SELECT * FROM consents WHERE patient_user_id=? ORDER BY id DESC", (g.user['id'],))
    else:
        rows = q("SELECT * FROM consents WHERE member_user_id=? OR member_email=? ORDER BY id DESC",
                 (g.user['id'], g.user['email']))
    out = []
    for r in rows:
        d = dict(r)
        p = q1('SELECT name FROM users WHERE id=?', (r['patient_user_id'],))
        d['patient_name'] = p['name'] if p else None
        out.append(d)
    return jsonify(consents=out)

@app.post('/api/consents')
@require_role('patient')
def grant_consent():
    d = request.get_json(force=True)
    email = (d.get('member_email') or '').strip().lower()
    if not email: return jsonify(error='member_email required'), 400
    if email == g.user['email']: return jsonify(error='You cannot grant consent to yourself'), 400
    member = q1('SELECT * FROM users WHERE email=?', (email,))
    ex("""INSERT INTO consents(patient_user_id,member_user_id,member_email,relation,status,created_at)
          VALUES (?,?,?,?, 'granted', ?)""",
       (g.user['id'], member['id'] if member else None, email, d.get('relation', 'family'), now()))
    if member:
        ex('INSERT INTO notifications(user_id,kind,title,body,created_at) VALUES (?,?,?,?,?)',
           (member['id'], 'consent', 'Health access granted',
            f"{g.user['name']} granted you access to their MediCare AI health summary.", now()))
    audit('consent_granted', email)
    return jsonify(ok=True)

@app.post('/api/consents/revoke')
@require_role('patient')
def revoke_consent():
    d = request.get_json(force=True)
    ex("""UPDATE consents SET status='revoked', revoked_at=? WHERE id=? AND patient_user_id=?""",
       (now(), d.get('consent_id'), g.user['id']))
    audit('consent_revoked', str(d.get('consent_id')))
    return jsonify(ok=True)

# ================================================================ READINGS
READABLE = ['glucose', 'systolic', 'diastolic', 'heart_rate', 'spo2', 'temperature', 'weight']

@app.get('/api/readings')
@require_auth
def get_readings():
    pid = int(request.args.get('patient_id', g.user['id']))
    if not own_patient_or_authorized(pid): return jsonify(error='Access denied'), 403
    days = min(int(request.args.get('days', 30)), 365)
    since = (dt.date.today() - dt.timedelta(days=days)).isoformat()
    rows = q("""SELECT * FROM readings WHERE patient_user_id=? AND reading_date>=?
                ORDER BY reading_date, id""", (pid, since))
    return jsonify(readings=[dict(r) for r in rows])

@app.post('/api/readings')
@require_role('patient', 'family')
def add_reading():
    d = request.get_json(force=True)
    pid = g.user['id'] if g.user['role'] == 'patient' else int(d.get('patient_id', 0))
    if not pid or not own_patient_or_authorized(pid): return jsonify(error='Access denied'), 403
    vals = {}
    for k in READABLE:
        v = d.get(k)
        try: vals[k] = float(v) if v not in (None, '', '—') else None
        except (TypeError, ValueError): vals[k] = None
    if all(vals[k] is None for k in READABLE):
        return jsonify(error='Provide at least one health value'), 400
    # soft range validation (unit errors), never blocks: marks a note instead
    warns = []
    limits = {'glucose': (10, 900), 'systolic': (50, 300), 'diastolic': (30, 200),
              'heart_rate': (25, 250), 'spo2': (50, 100), 'temperature': (30, 45), 'weight': (2, 500)}
    for k, (lo, hi) in limits.items():
        if vals[k] is not None and not (lo <= vals[k] <= hi):
            warns.append(f'{k} value {vals[k]} looks outside a plausible range — please double-check units.')
            vals[k] = None
    rdate = d.get('reading_date') or dt.date.today().isoformat()
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', rdate): return jsonify(error('Bad date')), 400
    ex("""INSERT INTO readings(patient_user_id,reading_date,glucose,systolic,diastolic,heart_rate,
          spo2,temperature,weight,source,note,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
       (pid, rdate, vals['glucose'], vals['systolic'], vals['diastolic'], vals['heart_rate'],
        vals['spo2'], vals['temperature'], vals['weight'], d.get('source', 'manual'),
        d.get('note'), now()))
    audit('reading_added', f'patient={pid}')
    return jsonify(ok=True, warnings=warns)

# ================================================================ AI RISK ANALYSIS
@app.post('/api/risk/analyze')
@require_auth
def risk_analyze():
    pid = int((request.get_json(silent=True) or {}).get('patient_id', g.user['id']))
    if not own_patient_or_authorized(pid): return jsonify(error='Access denied'), 403
    rows = q("""SELECT reading_date,glucose,systolic,diastolic,heart_rate,spo2,temperature,weight
                FROM readings WHERE patient_user_id=? ORDER BY reading_date""", (pid,))
    if len(rows) < 10:
        return jsonify(status='insufficient_data', readings=len(rows),
                       message=f'Only {len(rows)} reading(s) available. At least 10 readings are required '
                               'before the screening models can run. MediCare AI does not fabricate predictions '
                               'from insufficient data.')
    import numpy as np
    from sklearn.ensemble import IsolationForest
    data = np.array([[r[k] if r[k] is not None else np.nan for k in READABLE] for r in rows], dtype=float)
    # fill missing with per-metric median (column-wise)
    med = np.nanmedian(data, axis=0)
    med = np.where(np.isnan(med), 0, med)
    X = np.where(np.isnan(data), med, data)

    iso = IsolationForest(contamination=0.12, random_state=42)
    labels = iso.fit_predict(X)          # -1 = anomaly
    anomaly_idx = [int(i) for i in np.where(labels == -1)[0]]

    # linear trend per metric (per 30 days)
    dates = [dt.date.fromisoformat(r['reading_date']) for r in rows]
    t = np.array([(d - dates[0]).days for d in dates], dtype=float)
    trends = {}
    for j, k in enumerate(READABLE):
        y = data[:, j]; m = ~np.isnan(y)
        if m.sum() >= 5 and np.ptp(t[m]) > 0:
            slope = float(np.polyfit(t[m], y[m], 1)[0])  # per day
            trends[k] = {'slope_per_30d': round(slope * 30, 3), 'n': int(m.sum())}

    # simple out-of-range screening (common adult reference bands; not a diagnosis)
    bands = {'glucose': (70, 180), 'systolic': (90, 140), 'diastolic': (60, 90),
             'heart_rate': (60, 100), 'spo2': (92, 100), 'temperature': (36.1, 37.8)}
    out_of_range = []
    for i, r in enumerate(rows):
        for k, (lo, hi) in bands.items():
            v = r[k]
            if v is None: continue
            if v < lo: out_of_range.append({'metric': k, 'value': v, 'date': r['reading_date'], 'band': [lo, hi], 'kind': 'below'})
            elif v > hi: out_of_range.append({'metric': k, 'value': v, 'date': r['reading_date'], 'band': [lo, hi], 'kind': 'above'})

    # risk level: transparent rule engine
    recent = [i for i in range(len(rows)) if (dates[-1] - dates[i]).days <= 14]
    recent_anom = [i for i in anomaly_idx if i in recent]
    recent_oor = [o for o in out_of_range if o['date'] >= (dates[-1] - dt.timedelta(days=14)).isoformat()]
    risk_score = 2 * len(recent_anom) + len(recent_oor)
    if risk_score >= 8: level = 'High'
    elif risk_score >= 3: level = 'Medium'
    else: level = 'Low'

    patterns = []
    for i in anomaly_idx[-5:]:
        d0 = rows[i]
        diffs = {k: d0[k] for k in READABLE if d0[k] is not None}
        patterns.append({'date': d0['reading_date'], 'values': diffs,
                         'explanation': 'Statistical outlier compared with this patient’s usual pattern (Isolation Forest). '
                                        'An outlier is not a diagnosis — recheck the reading and, if it repeats, contact a healthcare professional.'})
    abnormal_trends = [{'metric': k, **v,
                        'explanation': f'{k.replace("_", " ").title()} is trending '
                                       f'{"upward" if v["slope_per_30d"] > 0 else "downward"} by about '
                                       f'{abs(v["slope_per_30d"])} units per 30 days over {v["n"]} readings.'}
                       for k, v in trends.items() if k in bands and abs(v['slope_per_30d']) > (bands[k][1] - bands[k][0]) / 12]

    nxt = []
    if level == 'High': nxt.append('Contact your doctor or healthcare professional and share these trends.')
    elif level == 'Medium': nxt.append('Recheck the flagged readings with your monitor and log them again.')
    else: nxt.append('Keep logging readings daily to strengthen the trend analysis.')
    return jsonify(status='ok', risk_level=level, readings=len(rows), readings_used=int(len(rows)),
                   anomalies=patterns, trends=abnormal_trends,
                   out_of_range_count=len(out_of_range),
                   out_of_range=out_of_range[-10:],
                   suggested_next_steps=nxt,
                   disclaimer='This is an algorithmic screening of logged readings, not a medical diagnosis. '
                              'It cannot reliably predict medical emergencies and is not clinically validated. '
                              'Never delay professional care because of this result.')

# ================================================================ OCR
def ocr_image(path):
    import pytesseract
    from PIL import Image
    data = pytesseract.image_to_data(Image.open(path), output_type=pytesseract.Output.DICT)
    words, confs = [], []
    for w, c in zip(data['text'], data['conf']):
        if w.strip():
            words.append(w); confs.append(int(c))
    text = pytesseract.image_to_string(Image.open(path))
    conf = (sum(confs) / len(confs)) if confs else 0
    uncertain = [w for w, c in zip(words, confs) if c > 0 and c < 60]
    return text, round(conf, 1), uncertain

def doc_text(path):
    """PDF via pdftotext, images via Tesseract."""
    if path.lower().endswith('.pdf'):
        out = os.popen(f'pdftotext -layout "{path}" - ').read()
        return out, None, []
    return ocr_image(path)

FREQ_PATTERNS = [(r'(\d+)\s*times?\s*(a|per)\s*day', r'x/day'), (r'\bTDS\b|\bthrice\b', '3x/day'),
                 (r'\bBD\b|\bBID\b|\btwice\b', '2x/day'), (r'\bOD\b|\bQD\b|\bonce\b', '1x/day'),
                 (r'\bQID\b|\bQDS\b', '4x/day'), (r'\bat\s*night\b|\bHS\b', 'at night')]

def parse_prescription(text):
    meds, cur = [], None
    med_rx = re.compile(r'^\s*(?:\d+[\).]\s*)?([A-Z][A-Za-z\-]{3,}(?:\s+[A-Z][A-Za-z\-]+)?)\s*'
                        r'(\d+(?:\.\d+)?)\s*(mg|ml|mcg|g|IU)?\b(.*)$')
    for raw in text.splitlines():
        line = raw.strip()
        if not line or len(line) < 6: continue
        m = med_rx.match(line)
        if m and m.group(1).lower() not in ('patient', 'name', 'date', 'doctor', 'dr', 'age', 'address'):
            if cur: meds.append(cur)
            freq, before, dur = '', '', ''
            rest = m.group(4) or ''
            joined = (line + ' ' + rest).lower()
            for pat, norm in FREQ_PATTERNS:
                if re.search(pat, joined, re.I): freq = norm; break
            if re.search(r'before\s*(food|meal)|\bAC\b', joined, re.I): before = 'before food'
            elif re.search(r'after\s*(food|meal)|\bPC\b', joined, re.I): before = 'after food'
            dm = re.search(r'(\d+)\s*(day|days|week|weeks|month|months)', joined)
            if dm: dur = dm.group(0)
            cur = {'name': m.group(1).strip(), 'dosage': f'{m.group(2)}{m.group(3) or ""}'.strip(),
                   'frequency': freq, 'before_food': before, 'duration': dur,
                   'instructions': rest.strip()[:120], 'confidence': None}
        elif cur and line and not re.search(r'doctor|patient|date|address|license', line, re.I):
            cur['instructions'] = (cur['instructions'] + ' ' + line).strip()[:160]
    if cur: meds.append(cur)
    return meds

@app.post('/api/ocr/prescription')
@require_auth
def ocr_prescription():
    f = request.files.get('file')
    if not f: return jsonify(error='No file uploaded'), 400
    path, err = save_upload(f, g.user['id'])
    if err: return jsonify(error=err), 400
    try:
        text, conf, uncertain = doc_text(path)
    except Exception as e:
        return jsonify(error=f'OCR engine failed: {e}'), 500
    meds = parse_prescription(text)
    if not meds and not text.strip():
        return jsonify(error='No text could be extracted. Use a sharper photo or a PDF.'), 422
    ex('INSERT INTO prescriptions(patient_user_id,file_path,raw_text,ocr_conf,uploaded_at) VALUES (?,?,?,?,?)',
       (g.user['id'], path, text, conf, now()))
    pid = q1('SELECT id FROM prescriptions WHERE file_path=?', (path,))['id']
    for m in meds:
        ex("""INSERT INTO prescription_meds(prescription_id,name,dosage,frequency,before_food,duration,
              instructions,confidence) VALUES (?,?,?,?,?,?,?,?)""",
           (pid, m['name'], m['dosage'], m['frequency'], m['before_food'], m['duration'],
            m['instructions'], m['confidence']))
    audit('prescription_ocr', f'prescription={pid}')
    return jsonify(prescription_id=pid, raw_text=text, ocr_conf=conf, uncertain_words=uncertain[:25],
                   meds=meds,
                   notice='OCR output is a first pass only. A pharmacist or doctor must verify every extracted '
                          'medicine, dose and duration before you rely on it. Uncertain words are highlighted — '
                          'never accept a guessed medicine name or dosage.')

@app.post('/api/ocr/prescription/confirm')
@require_auth
def confirm_meds():
    d = request.get_json(force=True)
    pid = d.get('prescription_id')
    row = q1('SELECT * FROM prescriptions WHERE id=?', (pid,))
    if not row: return jsonify(error='Not found'), 404
    if not own_patient_or_authorized(row['patient_user_id']): return jsonify(error='Access denied'), 403
    for m in d.get('meds', []):
        ex("""UPDATE prescription_meds SET name=?,dosage=?,frequency=?,before_food=?,duration=?,
              instructions=?,confirmed=1 WHERE id=? AND prescription_id=?""",
           (m.get('name'), m.get('dosage'), m.get('frequency'), m.get('before_food'), m.get('duration'),
            m.get('instructions'), m.get('id'), pid))
    audit('prescription_confirmed', f'prescription={pid}')
    return jsonify(ok=True)

# ================================================================ LAB REPORTS
LAB_EXPLAIN = {
    'hemoglobin': 'Protein in red blood cells that carries oxygen.',
    'glucose': 'Sugar level in the blood; used in diabetes screening.',
    'cholesterol': 'Blood fat; high levels raise heart-disease risk.',
    'creatinine': 'Kidney filtration indicator.',
    'tsh': 'Thyroid-stimulating hormone; reflects thyroid activity.',
    'platelet': 'Cells that help blood clot.',
    'alt': 'Liver enzyme; rises with liver irritation.',
    'urea': 'Waste product filtered by kidneys.',
    'wbc': 'White blood cells; part of immune defence.',
    'rbc': 'Red blood cells; carry oxygen.',
}
LINE_RX = re.compile(r'^\s*([A-Za-z][A-Za-z ()/]{2,40}?)\s+(-?\d+(?:\.\d+)?)\s*([A-Za-z/%µ°]+)?\s*'
                     r'(\d+(?:\.\d+)?\s*[-–—to]+\s*\d+(?:\.\d+)?)?\s*$')

@app.post('/api/ocr/lab')
@require_auth
def ocr_lab():
    f = request.files.get('file')
    if not f: return jsonify(error='No file uploaded'), 400
    path, err = save_upload(f, g.user['id'])
    if err: return jsonify(error=err), 400
    try: text, conf, uncertain = doc_text(path)
    except Exception as e: return jsonify(error=f'OCR engine failed: {e}'), 500
    results = []
    for raw in text.splitlines():
        m = LINE_RX.match(raw.strip())
        if not m: continue
        name = re.sub(r'\s+', ' ', m.group(1)).strip().lower()
        if name in ('total', 'report', 'page'): continue
        rng = re.split(r'\s*[-–—to]+\s*', m.group(4)) if m.group(4) else None
        val = float(m.group(2)); flag = 'unknown'
        if rng:
            try:
                lo, hi = float(rng[0]), float(rng[1])
                flag = 'normal' if lo <= val <= hi else ('above' if val > hi else 'below')
            except ValueError: pass
        explanation = next((v for k, v in LAB_EXPLAIN.items() if k in name), None)
        results.append({'test_name': name.title(), 'value': m.group(2), 'unit': m.group(3) or '',
                        'ref_range': m.group(4) or '', 'flag': flag, 'explanation': explanation})
    if not results:
        return jsonify(error='No lab values could be extracted from this document.'), 422
    ex('INSERT INTO lab_reports(patient_user_id,file_path,raw_text,uploaded_at) VALUES (?,?,?,?)',
       (g.user['id'], path, text, now()))
    rid = q1('SELECT id FROM lab_reports WHERE file_path=?', (path,))['id']
    for r in results:
        ex('INSERT INTO lab_results(report_id,test_name,value,unit,ref_range,flag) VALUES (?,?,?,?,?,?)',
           (rid, r['test_name'], r['value'], r['unit'], r['ref_range'], r['flag']))
    audit('lab_ocr', f'report={rid}')
    return jsonify(report_id=rid, results=results, ocr_conf=conf, uncertain_words=uncertain[:25],
                   notice='Laboratory interpretation requires review by a medical professional. '
                          'MediCare AI compares values only against the reference range printed on the '
                          'uploaded report and never diagnoses a disease from lab results alone.')

@app.get('/api/reports/my')
@require_auth
def my_reports():
    p = q('SELECT id,uploaded_at,file_path FROM prescriptions WHERE patient_user_id=? ORDER BY id DESC', (g.user['id'],))
    l = q('SELECT id,uploaded_at,file_path FROM lab_reports WHERE patient_user_id=? ORDER BY id DESC', (g.user['id'],))
    def wrap(rows, kind):
        return [{'id': r['id'], 'kind': kind, 'date': r['uploaded_at'],
                 'file': r['file_path'].split('/')[-1] if r['file_path'] else None} for r in rows]
    return jsonify(prescriptions=wrap(p, 'prescription'), labs=wrap(l, 'lab_report'))

@app.get('/api/reports/health-summary')
@require_auth
def health_summary():
    pid = int(request.args.get('patient_id', g.user['id']))
    if not own_patient_or_authorized(pid): return jsonify(error='Access denied'), 403
    u = q1('SELECT name FROM users WHERE id=?', (pid,))
    prof = q1('SELECT * FROM patient_profiles WHERE user_id=?', (pid,))
    rows = q('SELECT * FROM readings WHERE patient_user_id=? ORDER BY reading_date DESC LIMIT 30', (pid,))
    return jsonify(patient=u['name'], generated_at=now(), label='SYNTHETIC DEMO DATA — not real medical records',
                   profile=dict(prof) if prof else None,
                   recent_readings=[dict(r) for r in rows],
                   disclaimer='Health summary generated by MediCare AI for information only. '
                              'Review by a healthcare professional is required.')

# ================================================================ MEDICINE SAFETY (RxNav)
RXNAV = 'https://rxnav.nlm.nih.gov/REST'
import urllib.request, urllib.parse

def rxnav_json(path, params=''):
    url = f'{RXNAV}{path}' + (f'?{urllib.parse.urlencode(params)}' if params else '')
    with urllib.request.urlopen(url, timeout=10) as r:
        return json.loads(r.read().decode())

def resolve_rxcui(name):
    try:
        d = rxnav_json('/rxcui.json', {'name': name, 'search': '2'})
        ids = (d.get('idGroup') or {}).get('rxnormId') or []
        return ids[0] if ids else None
    except Exception:
        return None

def ingredients_of(rxcui):
    try:
        d = rxnav_json(f'/rxcui/{rxcui}/related.json', {'tty': 'IN'})
        cs = (((d.get('relatedGroup') or {}).get('conceptGroup')) or [])
        for g_ in cs:
            if g_.get('tty') == 'IN':
                return [c['name'] for c in (g_.get('conceptProperties') or [])]
    except Exception:
        pass
    return []

@app.post('/api/medicines/interactions')
@require_auth
def interactions():
    d = request.get_json(force=True)
    names = [n.strip() for n in d.get('medicines', []) if n.strip()]
    if len(names) < 2: return jsonify(error='Provide at least two medicines'), 400
    key = hashlib.sha1('|'.join(sorted(n.lower() for n in names)).encode()).hexdigest()
    cached = q1('SELECT payload FROM medicine_interactions WHERE cache_key=?', (key,))
    if cached: return jsonify(**json.loads(cached['payload']))

    profiles = {}   # name -> {rxcui, ingredients}
    for n in names:
        rxcui = resolve_rxcui(n)
        profiles[n] = {'rxcui': rxcui, 'ingredients': ingredients_of(rxcui) if rxcui else []}

    pairs, dupes = [], []
    api_ok, service_unavailable = set(), set()
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            a, b = names[i], names[j]
            ia, ib = profiles[a], profiles[b]
            # duplicate active ingredient
            common = set(x.lower() for x in ia['ingredients']) & set(x.lower() for x in ib['ingredients'])
            if common:
                dupes.append({'medicines': [a, b], 'shared_ingredient': ', '.join(common),
                              'reason': 'Both products contain the same active ingredient. Taking both can '
                                        'double the dose without adding benefit.',
                              'source': 'RxNav (NIH) RxNorm ingredient mapping',
                              'recommended_action': 'Ask your pharmacist or doctor whether both are needed.'})
            if not (ia['rxcui'] and ib['rxcui']): continue
            try:
                # NIH DrugInteraction API: all known interactions of one rxcui; filter for the partner
                inter = rxnav_json('/interaction/interaction.json', {'rxcui': ia['rxcui']})
                api_ok.add(key)
                ftype = (((inter.get('fullInteractionTypeGroup') or [{}])[0]
                          .get('fullInteractionType')) or [])
                for ft in ftype:
                    partner = ((ft.get('minConcept') or {}).get('name') or '').lower()
                    if partner and partner not in (b.lower(), *[x.lower() for x in ib['ingredients']]):
                        continue
                    desc = ' '.join((p.get('sourceDesc') or '') for p in ft.get('interactionPair', [])[:1]) \
                           or json.dumps(ft)[:200]
                    pairs_txt = ' '.join(p.get('description', '') for p in ft.get('interactionPair', []))
                    sev = 'note'
                    tl = (pairs_txt + desc).lower()
                    if any(w in tl for w in ('contraindicated', 'avoid', 'severe')): sev = 'major'
                    elif any(w in tl for w in ('moderate', 'caution', 'monitor')): sev = 'moderate'
                    pairs.append({'medicines': [a, b],
                                  'severity': sev,
                                  'reason': pairs_txt[:400] or desc[:400],
                                  'source': 'RxNav (NIH) DrugInteraction API',
                                  'recommended_action': 'Discuss with your pharmacist or doctor. MediCare AI never '
                                                        'recommends stopping, changing or combining prescribed '
                                                        'medicines without professional guidance.'})
            except Exception:
                service_unavailable.add(key)
    # allergy check
    prof = q1('SELECT allergies FROM patient_profiles WHERE user_id=?', (g.user['id'],))
    allergies = [a.strip().lower() for a in ((prof['allergies'] if prof and prof['allergies'] else '')).split(',') if a.strip()]
    allergy_hits = []
    if allergies:
        for n, info in profiles.items():
            blob = (n + ' ' + ' '.join(info['ingredients'])).lower()
            for al in allergies:
                if al in blob:
                    allergy_hits.append({'medicine': n, 'allergy': al,
                                         'recommended_action': 'Do not start this medicine without asking your '
                                                               'doctor or pharmacist about this allergy.'})
    interaction_service = 'active' if key in api_ok else         ('unavailable' if key in service_unavailable else 'no-pairs-found')
    payload = {'checked_with': 'RxNav (NIH) RxNorm — live integration',
               'interaction_service': interaction_service,
               'service_notice': None if interaction_service == 'active' else
               'The NIH DrugInteraction endpoint is not reachable right now, so NO interaction results are '
               'shown. MediCare AI does not invent interaction data — please run this check again later and '
               'always confirm with a pharmacist.',
               'pairs': pairs, 'duplicates': dupes,
               'allergies': allergy_hits, 'unresolved': [n for n, v in profiles.items() if not v['rxcui']],
               'notice': 'Interaction data comes from the NIH RxNav database and may not be complete. '
                         'Always confirm with a pharmacist or doctor. MediCare AI never invents interaction '
                         'results and never recommends stopping or changing prescribed medicines without '
                         'professional guidance.'}
    ex('INSERT OR REPLACE INTO medicine_interactions(cache_key,payload,fetched_at) VALUES (?,?,?)',
       (key, json.dumps(payload), now()))
    audit('interaction_check', ','.join(names))
    return jsonify(**payload)

@app.get('/api/medicines/generic')
@require_auth
def generic_finder():
    name = request.args.get('name', '').strip()
    if not name: return jsonify(error='Provide a brand or ingredient name'), 400
    rxcui = resolve_rxcui(name)
    if not rxcui:
        return jsonify(found=False, name=name,
                       notice='Medicine not found in RxNav (NIH) RxNorm. No fabricated alternatives are shown.')
    try:
        equivalents, seen = [], set()
        for tty in ('SCD', 'SBD', 'GPCK', 'BPCK'):
            try:
                rel = rxnav_json(f'/rxcui/{rxcui}/related.json', {'tty': tty})
            except Exception:
                continue
            groups = (rel.get('relatedGroup') or {}).get('conceptGroup') or []
            for grp in groups:
                for c in (grp.get('conceptProperties') or []):
                    if c['rxcui'] not in seen:
                        seen.add(c['rxcui'])
                        equivalents.append({'name': c['name'], 'rxcui': c['rxcui'], 'tty': grp.get('tty')})
    except Exception as e:
        return jsonify(found=False, error=f'RxNav lookup failed: {e}',
                       notice='Integration not active right now. No fabricated alternatives are shown.')
    ingredients = ingredients_of(rxcui)
    return jsonify(found=True, name=name, rxcui=rxcui, ingredients=ingredients,
                   equivalents=equivalents[:30],
                   pricing={'status': 'integration not active',
                            'detail': 'Verified Indian price comparison requires a licensed data provider '
                                      '(e.g. an 1mg/IQVIA partner API) configured with MEDICINE_PRICE_API_KEY. '
                                      'MediCare AI does not display fabricated prices.'},
                   notice='Only alternatives with a matching active ingredient are listed. A pharmacist or '
                          'doctor must approve any substitution, and strengths/dosage forms must match exactly.')

# ================================================================ REMINDERS
@app.get('/api/reminders')
@require_auth
def reminders():
    pid = int(request.args.get('patient_id', g.user['id']))
    if not own_patient_or_authorized(pid): return jsonify(error='Access denied'), 403
    _mark_missed(pid)
    rows = q("SELECT * FROM reminders WHERE patient_user_id=? AND status='active' ORDER BY id DESC", (pid,))
    today = dt.date.today().isoformat()
    out = []
    for r in rows:
        d = dict(r)
        logs = q("""SELECT * FROM reminder_logs WHERE reminder_id=? AND sched_date=?""", (r['id'], today))
        d['today_logs'] = [dict(l) for l in logs]
        out.append(d)
    missed = q("""SELECT rl.*, rm.med_name FROM reminder_logs rl JOIN reminders rm ON rm.id=rl.reminder_id
                  WHERE rm.patient_user_id=? AND rl.status='missed'
                  ORDER BY rl.sched_date DESC LIMIT 20""", (pid,))
    return jsonify(reminders=out, missed=[dict(m) for m in missed])

def _mark_missed(pid):
    rows = q("""SELECT rl.id FROM reminder_logs rl JOIN reminders rm ON rm.id=rl.reminder_id
                WHERE rm.patient_user_id=? AND rl.status IS NULL
                AND rl.sched_date || ' ' || rl.sched_time < ?""", (pid, now()))
    for r in rows:
        ex("UPDATE reminder_logs SET status='missed', logged_at=? WHERE id=?", (now(), r['id']))

@app.post('/api/reminders')
@require_role('patient')
def add_reminder():
    d = request.get_json(force=True)
    if not d.get('med_name') or not d.get('times'):
        return jsonify(error='Medicine name and at least one reminder time are required'), 400
    times = json.dumps(d['times'] if isinstance(d['times'], list) else [d['times']])
    cur = ex("""INSERT INTO reminders(patient_user_id,med_name,dosage,times,frequency,start_date,end_date,
          before_food,expiry_date,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)""",
       (g.user['id'], d['med_name'], d.get('dosage'), times, d.get('frequency', 'daily'),
        d.get('start_date') or dt.date.today().isoformat(), d.get('end_date'), d.get('before_food', ''),
        d.get('expiry_date'), now()))
    audit('reminder_added', d['med_name'])
    return jsonify(ok=True, id=cur.lastrowid)

@app.post('/api/reminders/log')
@require_role('patient', 'family')
def log_reminder():
    d = request.get_json(force=True)
    rm = q1('SELECT * FROM reminders WHERE id=?', (d.get('reminder_id'),))
    if not rm: return jsonify(error='Reminder not found'), 404
    if not own_patient_or_authorized(rm['patient_user_id']): return jsonify(error='Access denied'), 403
    status = d.get('status')
    if status not in ('taken', 'skipped'): return jsonify(error='status must be taken or skipped'), 400
    date = d.get('sched_date') or dt.date.today().isoformat()
    time_ = d.get('sched_time') or dt.datetime.now().strftime('%H:%M')
    ex("""INSERT INTO reminder_logs(reminder_id,sched_date,sched_time,status,logged_at) VALUES (?,?,?,?,?)
          ON CONFLICT(reminder_id,sched_date,sched_time) DO UPDATE SET status=excluded.status, logged_at=excluded.logged_at""",
       (rm['id'], date, time_, status, now()))
    if status == 'skipped':
        ex('INSERT INTO notifications(user_id,kind,title,body,created_at) VALUES (?,?,?,?,?)',
           (rm['patient_user_id'], 'reminder', 'Dose not taken',
            f"{rm['med_name']} was marked not taken. Do NOT take an extra dose to catch up — "
            'ask your doctor or pharmacist what to do.', now()))
    return jsonify(ok=True)

@app.post('/api/reminders/generate-today')
@require_role('patient', 'family')
def generate_today():
    pid = g.user['id'] if g.user['role'] == 'patient' else int((request.get_json(silent=True) or {}).get('patient_id', 0))
    if not pid or not own_patient_or_authorized(pid): return jsonify(error='Access denied'), 403
    today = dt.date.today().isoformat()
    rows = q("SELECT * FROM reminders WHERE patient_user_id=? AND status='active'", (pid,))
    n = 0
    for r in rows:
        if r['start_date'] and r['start_date'] > today: continue
        if r['end_date'] and r['end_date'] < today: continue
        for t in json.loads(r['times']):
            try:
                ex("INSERT OR IGNORE INTO reminder_logs(reminder_id,sched_date,sched_time) VALUES (?,?,?)",
                   (r['id'], today, t)); n += 1
            except Exception: pass
    return jsonify(ok=True, created=n)

# ================================================================ EMERGENCY
@app.get('/api/emergency/contacts')
@require_auth
def em_contacts():
    pid = int(request.args.get('patient_id', g.user['id']))
    if not own_patient_or_authorized(pid): return jsonify(error='Access denied'), 403
    rows = q('SELECT * FROM emergency_contacts WHERE patient_user_id=?', (pid,))
    return jsonify(contacts=[dict(r) for r in rows])

@app.post('/api/emergency/contacts')
@require_role('patient')
def add_em_contact():
    d = request.get_json(force=True)
    if not d.get('name') or not d.get('phone'): return jsonify(error='Name and phone are required'), 400
    ex('INSERT INTO emergency_contacts(patient_user_id,name,relation,phone,email) VALUES (?,?,?,?,?)',
       (g.user['id'], d['name'], d.get('relation', ''), d['phone'], d.get('email', '')))
    return jsonify(ok=True)

@app.post('/api/emergency/alert')
@require_auth
def em_alert():
    d = request.get_json(force=True)
    pid = int(d.get('patient_id', g.user['id']))
    if not own_patient_or_authorized(pid): return jsonify(error='Access denied'), 403
    kind = d.get('kind', 'sos'); note = d.get('note', '')
    delivered = []
    # recipients: consented members/doctor + emergency contacts with emails
    recipients = q("""SELECT DISTINCT u.id, u.email FROM consents c JOIN users u
                      ON u.id=c.member_user_id WHERE c.patient_user_id=? AND c.status='granted'""", (pid,))
    ec = q('SELECT name,email,phone FROM emergency_contacts WHERE patient_user_id=? AND (email IS NOT NULL AND email<>"")', (pid,))
    latest = q1('SELECT * FROM readings WHERE patient_user_id=? ORDER BY id DESC', (pid,))
    body = f'EMERGENCY ALERT ({kind}) for patient #{pid}. Note: {note}. ' \
           f'Latest reading: glucose={latest["glucose"] if latest else "n/a"}, ' \
           f'BP={latest["systolic"] if latest else "n/a"}/{latest["diastolic"] if latest else "n/a"}.'
    sent_real = False
    # SMS via Twilio only if configured
    if os.environ.get('TWILIO_ACCOUNT_SID') and os.environ.get('TWILIO_AUTH_TOKEN') and os.environ.get('TWILIO_FROM'):
        try:
            from twilio.rest import Client
            cli = Client(os.environ['TWILIO_ACCOUNT_SID'], os.environ['TWILIO_AUTH_TOKEN'])
            for c in ec:
                if c['phone']:
                    cli.messages.create(to=c['phone'], from_=os.environ['TWILIO_FROM'], body=body)
                    delivered.append(f'SMS→{c["phone"]}'); sent_real = True
        except Exception as e:
            delivered.append(f'SMS failed: {e}')
    if not sent_real:
        delivered.append('SMS/email: integration not active (configure TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/'
                         'TWILIO_FROM or SMTP_* in .env). In-app notifications were sent.')
    for r in recipients:
        ex('INSERT INTO notifications(user_id,kind,title,body,created_at) VALUES (?,?,?,?,?)',
           (r['id'], 'emergency', f'EMERGENCY: {kind}', body, now()))
    ex('INSERT INTO emergency_events(patient_user_id,kind,note,status,delivered_via,created_at) VALUES (?,?,?,?,?,?)',
       (pid, kind, note, 'notified', '; '.join(delivered), now()))
    audit('emergency_alert', kind)
    return jsonify(ok=True, delivered=delivered, event_note=body,
                   emergency_banner='MediCare AI is NOT an emergency medical service. For severe symptoms or '
                                    'any suspected emergency, call local emergency services immediately — '
                                    'in India call 112. Do not delay emergency care while waiting for AI '
                                    'analysis or family responses.')

@app.get('/api/emergency/events')
@require_auth
def em_events():
    pid = int(request.args.get('patient_id', g.user['id']))
    if not own_patient_or_authorized(pid): return jsonify(error='Access denied'), 403
    rows = q('SELECT * FROM emergency_events WHERE patient_user_id=? ORDER BY id DESC LIMIT 30', (pid,))
    return jsonify(events=[dict(r) for r in rows])

# ================================================================ APPOINTMENTS
@app.get('/api/appointments')
@require_auth
def appts():
    if g.user['role'] == 'doctor':
        rows = q("""SELECT a.*, u.name AS patient_name FROM appointments a JOIN users u ON u.id=a.patient_user_id
                    WHERE a.doctor_user_id=? ORDER BY a.date DESC""", (g.user['id'],))
    elif g.user['role'] == 'admin':
        rows = q("""SELECT a.*, u.name AS patient_name FROM appointments a JOIN users u ON u.id=a.patient_user_id
                    ORDER BY a.date DESC LIMIT 100""")
    else:
        rows = q("""SELECT a.*, u.name AS patient_name FROM appointments a JOIN users u ON u.id=a.patient_user_id
                    WHERE a.patient_user_id=? ORDER BY a.date DESC""", (g.user['id'],))
    return jsonify(appointments=[dict(r) for r in rows])

@app.post('/api/appointments')
@require_role('patient', 'family')
def add_appt():
    d = request.get_json(force=True)
    pid = g.user['id'] if g.user['role'] == 'patient' else int(d.get('patient_id', 0))
    cur = ex('INSERT INTO appointments(patient_user_id,doctor_user_id,date,time,reason) VALUES (?,?,?,?,?)',
             (pid, d.get('doctor_user_id'), d.get('date'), d.get('time'), d.get('reason', '')))
    return jsonify(ok=True, id=cur.lastrowid)

@app.put('/api/appointments/<int:aid>')
@require_role('doctor', 'patient')
def upd_appt(aid):
    d = request.get_json(force=True)
    row = q1('SELECT * FROM appointments WHERE id=?', (aid,))
    if not row: return jsonify(error='Not found'), 404
    if g.user['role'] == 'patient' and row['patient_user_id'] != g.user['id']:
        return jsonify(error='Access denied'), 403
    ex('UPDATE appointments SET status=?, notes=? WHERE id=?',
       (d.get('status', row['status']), d.get('notes', row['notes']), aid))
    return jsonify(ok=True)

# ================================================================ FAMILY / DOCTOR VIEWS
@app.get('/api/family/patients')
@require_role('family', 'doctor')
def shared_patients():
    rows = q("""SELECT c.patient_user_id, u.name, c.relation, c.created_at FROM consents c
                JOIN users u ON u.id=c.patient_user_id
                WHERE c.member_user_id=? AND c.status='granted'""", (g.user['id'],))
    extra = []
    if g.user['role'] == 'doctor':
        extra = q("""SELECT p.user_id AS patient_user_id, u.name, 'primary doctor' AS relation, p.created_at
                     FROM patient_profiles p JOIN users u ON u.id=p.user_id
                     WHERE p.doctor_id=?""", (g.user['id'],))
    return jsonify(patients=[dict(r) for r in list(rows) + extra])

@app.get('/api/family/patient/<int:pid>/overview')
@require_role('family', 'doctor')
def patient_overview(pid):
    if not own_patient_or_authorized(pid): return jsonify(error='Access denied — the patient has not authorized you'), 403
    prof = q1('SELECT * FROM patient_profiles WHERE user_id=?', (pid,))
    latest = q('SELECT * FROM readings WHERE patient_user_id=? ORDER BY reading_date DESC LIMIT 7', (pid,))
    rems = q("SELECT * FROM reminders WHERE patient_user_id=? AND status='active'", (pid,))
    missed = q("""SELECT rl.*, rm.med_name FROM reminder_logs rl JOIN reminders rm ON rm.id=rl.reminder_id
                  WHERE rm.patient_user_id=? AND rl.status='missed' ORDER BY rl.id DESC LIMIT 10""", (pid,))
    evs = q('SELECT * FROM emergency_events WHERE patient_user_id=? ORDER BY id DESC LIMIT 5', (pid,))
    name = q1('SELECT name FROM users WHERE id=?', (pid,))['name']
    return jsonify(patient=name, profile=dict(prof) if prof else None,
                   latest_readings=[dict(r) for r in latest],
                   reminders=[dict(r) for r in rems], missed_doses=[dict(m) for m in missed],
                   emergency_events=[dict(e) for e in evs])

# ================================================================ NOTIFICATIONS
@app.get('/api/notifications')
@require_auth
def notifs():
    rows = q('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 30', (g.user['id'],))
    return jsonify(notifications=[dict(r) for r in rows])

@app.post('/api/notifications/read')
@require_auth
def notifs_read():
    ex('UPDATE notifications SET read=1 WHERE user_id=?', (g.user['id'],))
    return jsonify(ok=True)

# ================================================================ ADMIN
@app.get('/api/admin/stats')
@require_role('admin')
def admin_stats():
    def c(sql): return q1(sql)[0]
    return jsonify(
        patients=c('SELECT COUNT(*) FROM users WHERE role="patient"'),
        doctors=c('SELECT COUNT(*) FROM users WHERE role="doctor"'),
        family=c('SELECT COUNT(*) FROM users WHERE role="family"'),
        active_sessions=c('SELECT COUNT(*) FROM sessions WHERE expires_at>?') or 0 if False else
            c(f"SELECT COUNT(*) FROM sessions WHERE expires_at > '{now()}'"),
        emergency_events=c('SELECT COUNT(*) FROM emergency_events'),
        prescriptions=c('SELECT COUNT(*) FROM prescriptions'),
        lab_reports=c('SELECT COUNT(*) FROM lab_reports'),
        readings=c('SELECT COUNT(*) FROM readings'),
        reminders=c('SELECT COUNT(*) FROM reminders'),
        appointments=c('SELECT COUNT(*) FROM appointments'))

@app.get('/api/admin/users')
@require_role('admin')
def admin_users():
    rows = q('SELECT id,email,name,role,created_at FROM users ORDER BY id')
    return jsonify(users=[dict(r) for r in rows])

@app.get('/api/admin/audit')
@require_role('admin')
def admin_audit():
    rows = q('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100')
    return jsonify(logs=[dict(r) for r in rows])

# ================================================================ static / SPA
@app.get('/api/health')
def health():
    return jsonify(app='MediCare AI', status='ok', time=now())

if os.path.isdir(os.path.join(BASE, 'dist')):
    @app.get('/')
    @app.get('/<path:p>')
    def spa(p='index.html'):
        full = os.path.join(BASE, 'dist', p)
        if os.path.isfile(full): return send_from_directory(os.path.join(BASE, 'dist'), p)
        return send_from_directory(os.path.join(BASE, 'dist'), 'index.html')

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=False)
