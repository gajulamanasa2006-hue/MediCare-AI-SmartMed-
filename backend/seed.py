"""MediCare AI — SYNTHETIC demo data seeder.
All data created here is clearly labeled synthetic and is for testing only.
Creates: admin@ / doctor@ / patient@ / family@demo.local  (password: Medicare@123)
30 days of synthetic health readings, a synthetic prescription row, reminders.
Run:  python3 backend/seed.py
"""
import os, sys, sqlite3, secrets, datetime as dt, random
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE)
sys.path.insert(0, os.path.join(BASE, 'backend'))
from werkzeug.security import generate_password_hash
from app import init_db, DB_PATH as DB
init_db()
conn = sqlite3.connect(DB); cur = conn.cursor()

def one(sql, a=()):
    return cur.execute(sql, a).fetchone()

def run(sql, a=()):
    cur.execute(sql, a); return cur.lastrowid

now = dt.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
pw = generate_password_hash('Medicare@123')

users = {}
for email, name, role in [
    ('admin@demo.local', 'System Admin', 'admin'),
    ('doctor@demo.local', 'Dr. Anjali Rao', 'doctor'),
    ('patient@demo.local', 'Ravi Kumar', 'patient'),
    ('family@demo.local', 'Meena Kumar', 'family'),
]:
    row = one('SELECT id FROM users WHERE email=?', (email,))
    if row:
        users[role] = row[0]
    else:
        users[role] = run('INSERT INTO users(email,password_hash,name,role,created_at) VALUES (?,?,?,?,?)',
                          (email, pw, name, role, now))

if not one('SELECT 1 FROM patient_profiles WHERE user_id=?', (users['patient'],)):
    run("""INSERT INTO patient_profiles(user_id,age,phone,emergency_contact,conditions,allergies,blood_group,doctor_id,created_at)
           VALUES (?,?,?,?,?,?,?,?,?)""",
        (users['patient'], 58, '+91 90000 11111', '+91 90000 22222',
         'Type 2 diabetes, mild hypertension', 'Penicillin', 'B+', users['doctor'], now))
if not one('SELECT 1 FROM doctors WHERE user_id=?', (users['doctor'],)):
    run('INSERT INTO doctors(user_id,specialty,license_no) VALUES (?,?,?)', (users['doctor'], 'General Medicine', 'SYNTH-12345'))
if not one('SELECT 1 FROM consents WHERE patient_user_id=? AND member_user_id=?', (users['patient'], users['family'])):
    run("""INSERT INTO consents(patient_user_id,member_user_id,member_email,relation,status,created_at)
           VALUES (?,?,?,?, 'granted', ?)""",
        (users['patient'], users['family'], 'family@demo.local', 'Daughter', now))
if not one('SELECT 1 FROM emergency_contacts WHERE patient_user_id=?', (users['patient'],)):
    run('INSERT INTO emergency_contacts(patient_user_id,name,relation,phone,email) VALUES (?,?,?,?,?)',
        (users['patient'], 'Meena Kumar', 'Daughter', '+91 90000 22222', 'family@demo.local'))

if cur.execute('SELECT COUNT(*) FROM readings WHERE patient_user_id=?', (users['patient'],)).fetchone()[0] == 0:
    rnd = random.Random(42)
    today = dt.date.today()
    for i in range(29, -1, -1):
        d = (today - dt.timedelta(days=i)).isoformat()
        drift = (29 - i) * 0.08
        run("""INSERT INTO readings(patient_user_id,reading_date,glucose,systolic,diastolic,heart_rate,
              spo2,temperature,weight,source,note,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (users['patient'], d,
             round(128 + drift + rnd.uniform(-14, 14), 1),
             round(132 + drift + rnd.uniform(-10, 12)), round(84 + rnd.uniform(-7, 7)),
             round(74 + rnd.uniform(-8, 9)), round(97 + rnd.uniform(-1.5, 2), 1),
             round(36.7 + rnd.uniform(-0.3, 0.4), 1), round(78.5 - drift * 0.4 + rnd.uniform(-0.8, 0.8), 1),
             'manual', 'SYNTHETIC demo reading', now))
    # two obvious outliers so the anomaly model has something to flag
    for d in ((today - dt.timedelta(days=3)).isoformat(), (today - dt.timedelta(days=9)).isoformat()):
        run("""INSERT INTO readings(patient_user_id,reading_date,glucose,systolic,diastolic,heart_rate,spo2,
              temperature,weight,source,note,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (users['patient'], d, 241, 168, 104, 112, 91.0, 38.4, 78.0, 'manual', 'SYNTHETIC demo outlier', now))

if cur.execute('SELECT COUNT(*) FROM reminders WHERE patient_user_id=?', (users['patient'],)).fetchone()[0] == 0:
    run("""INSERT INTO reminders(patient_user_id,med_name,dosage,times,frequency,start_date,end_date,before_food,
          expiry_date,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (users['patient'], 'Metformin (SYNTHETIC demo)', '500 mg', '["08:00","20:00"]', 'daily',
         dt.date.today().isoformat(), None, 'after food',
         (dt.date.today() + dt.timedelta(days=90)).isoformat(), now))
    run("""INSERT INTO reminders(patient_user_id,med_name,dosage,times,frequency,start_date,end_date,before_food,
          expiry_date,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (users['patient'], 'Amlodipine (SYNTHETIC demo)', '5 mg', '["09:00"]', 'daily',
         dt.date.today().isoformat(), None, 'after food',
         (dt.date.today() + dt.timedelta(days=60)).isoformat(), now))

if cur.execute('SELECT COUNT(*) FROM appointments').fetchone()[0] == 0:
    run("""INSERT INTO appointments(patient_user_id,doctor_user_id,date,time,reason,status) VALUES (?,?,?,?,?,?)""",
        (users['patient'], users['doctor'], (dt.date.today() + dt.timedelta(days=7)).isoformat(), '10:30',
         'SYNTHETIC demo: routine diabetes review', 'booked'))

conn.commit(); conn.close()
print('SYNTHETIC demo data seeded (all rows labeled synthetic).')
print('Logins (password Medicare@123): admin@demo.local / doctor@demo.local / patient@demo.local / family@demo.local')
