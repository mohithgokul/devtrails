"""
main.py — SurakshaPay Backend Entry Point

Phase 2 complete implementation:
  - city, latitude, longitude columns on users table
  - status column on policies table (soft-delete)
  - claims table with full trigger metadata
  - Includes claims_router, policies_router, assessment_router
  - Registration stores location data (reverse geocoded if only lat/lon given)
  - GET /api/dashboard/{user_id} — aggregated dashboard data for frontend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
load_dotenv()  # Load DATABASE_URL and SECRET_KEY from .env file
import psycopg2
import psycopg2.extras
import bcrypt
import math
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends

# Import all feature routers
from assessment_router import router as assessment_router
from claims_router import router as claims_router
from policies_router import router as policies_router
from admin_router import router as admin_router
from payout_router import router as payout_router

app = FastAPI(
    title="SurakshaPay Backend",
    description="Micro-insurance platform for gig workers — full pipeline API",
    version="2.0.0",
)

# Allow all origins for local development; restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from db import get_connection, get_dict_connection, DATABASE_URL

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey_for_surakshapay_fastapi_001")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        role: str = payload.get("role")
        if user_id is None:
            raise credentials_exception
        return {"user_id": user_id, "role": role}
    except JWTError:
        raise credentials_exception


# ---------------------------------------------------------------------------
# Database Initialization — Phase 2 schema with safe ALTER TABLE migrations
# ---------------------------------------------------------------------------

def init_db():
    """
    Creates all required tables if they don't exist.
    Also runs ALTER TABLE migrations so an existing Phase 1 DB is upgraded
    seamlessly without data loss.

    Retries up to 5 times with exponential backoff — Railway's DB proxy
    sometimes needs a few seconds to warm up before accepting connections.
    """
    import time
    last_err = None
    for attempt in range(1, 6):
        try:
            conn = get_connection()
            break
        except Exception as e:
            last_err = e
            print(f"[init_db] DB connection attempt {attempt}/5 failed: {e}")
            time.sleep(2 ** attempt)  # 2, 4, 8, 16, 32 seconds
    else:
        raise RuntimeError(f"[init_db] Could not connect to database after 5 attempts: {last_err}")

    cursor = conn.cursor()

    # ── Users table ──────────────────────────────────────────────────────────
    # Phase 2 adds: city (derived from reverse geocode or user input),
    # latitude, longitude (GPS coordinates for coordinate-based API calls)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id                SERIAL PRIMARY KEY,
            full_name         TEXT    NOT NULL,
            phone             TEXT    NOT NULL,
            work_hours        INTEGER,
            daily_earnings    REAL,
            weekly_income     REAL,
            selected_plan     TEXT,
            calculated_premium REAL,
            city              TEXT,
            latitude          REAL,
            longitude         REAL,
            email             TEXT UNIQUE,
            password_hash     TEXT,
            role              TEXT DEFAULT 'worker',
            created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            razorpay_contact_id VARCHAR DEFAULT NULL,
            razorpay_fund_acct_id VARCHAR DEFAULT NULL,
            upi_id VARCHAR DEFAULT NULL,
            bank_account_number VARCHAR DEFAULT NULL,
            bank_ifsc VARCHAR DEFAULT NULL,
            daily_rate_inr FLOAT DEFAULT 700.0
        )
    ''')

    # ── Policies table ───────────────────────────────────────────────────────
    # Phase 2 adds: status column ('active' | 'cancelled') for soft-delete
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS policies (
            id              SERIAL PRIMARY KEY,
            user_id         INTEGER,
            plan_name       TEXT,
            coverage_factor REAL,
            weekly_premium  REAL,
            status          TEXT DEFAULT 'active',
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # ── Claims table ─────────────────────────────────────────────────────────
    # Stores both auto-approved parametric claims and manual pending claims.
    # trigger_type: identifies which parametric rule fired (or 'manual')
    # status: 'pending' | 'approved' | 'rejected' | 'auto_approved'
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS claims (
            id               SERIAL PRIMARY KEY,
            user_id          INTEGER,
            trigger_type     TEXT,
            risk_level       TEXT,
            risk_probability REAL,
            rain             REAL,
            aqi              INTEGER,
            demand_drop      INTEGER,
            curfew           INTEGER,
            payout_amount    REAL,
            status           TEXT DEFAULT 'pending',
            fraud_score      REAL,
            trust_score      INTEGER,
            fraud_decision   TEXT,
            fraud_type_suspected TEXT,
            fraud_flags      TEXT,
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            payout_amount_inr FLOAT DEFAULT NULL,
            payout_amount_paise INTEGER DEFAULT NULL,
            disruption_hours FLOAT DEFAULT NULL,
            razorpay_payout_id VARCHAR DEFAULT NULL,
            payout_status VARCHAR DEFAULT NULL,
            payout_initiated_at TIMESTAMP DEFAULT NULL,
            payout_completed_at TIMESTAMP DEFAULT NULL,
            payment_mode VARCHAR DEFAULT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # ── Notifications table ──────────────────────────────────────────────────
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id                SERIAL PRIMARY KEY,
            message           TEXT,
            type              TEXT,
            is_read           BOOLEAN DEFAULT FALSE,
            created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # ── Safe migrations — upgrade existing Phase 1 DB without dropping data ──
    # Each ALTER TABLE is wrapped in try/except; OperationalError means the
    # column already exists (SQLite doesn't support IF NOT EXISTS for columns).
    migration_columns = [
        ("users",    "ALTER TABLE users    ADD COLUMN IF NOT EXISTS city      TEXT"),
        ("users",    "ALTER TABLE users    ADD COLUMN IF NOT EXISTS latitude  REAL"),
        ("users",    "ALTER TABLE users    ADD COLUMN IF NOT EXISTS longitude REAL"),
        ("users",    "ALTER TABLE users    ADD COLUMN IF NOT EXISTS email     TEXT UNIQUE"),
        ("users",    "ALTER TABLE users    ADD COLUMN IF NOT EXISTS password_hash TEXT"),
        ("users",    "ALTER TABLE users    ADD COLUMN IF NOT EXISTS role      TEXT DEFAULT 'worker'"),
        ("users",    "ALTER TABLE users    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ("policies", "ALTER TABLE policies ADD COLUMN IF NOT EXISTS status    TEXT DEFAULT 'active'"),
        ("claims",   "ALTER TABLE claims   ADD COLUMN IF NOT EXISTS fraud_score REAL"),
        ("claims",   "ALTER TABLE claims   ADD COLUMN IF NOT EXISTS trust_score INTEGER"),
        ("claims",   "ALTER TABLE claims   ADD COLUMN IF NOT EXISTS fraud_decision TEXT"),
        ("claims",   "ALTER TABLE claims   ADD COLUMN IF NOT EXISTS fraud_type_suspected TEXT"),
        ("claims",   "ALTER TABLE claims   ADD COLUMN IF NOT EXISTS fraud_flags TEXT"),
        # Payouts additions
        ("users",    "ALTER TABLE users    ADD COLUMN IF NOT EXISTS razorpay_contact_id VARCHAR DEFAULT NULL"),
        ("users",    "ALTER TABLE users    ADD COLUMN IF NOT EXISTS razorpay_fund_acct_id VARCHAR DEFAULT NULL"),
        ("users",    "ALTER TABLE users    ADD COLUMN IF NOT EXISTS upi_id VARCHAR DEFAULT NULL"),
        ("users",    "ALTER TABLE users    ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR DEFAULT NULL"),
        ("users",    "ALTER TABLE users    ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR DEFAULT NULL"),
        ("users",    "ALTER TABLE users    ADD COLUMN IF NOT EXISTS daily_rate_inr FLOAT DEFAULT 700.0"),
        ("claims",   "ALTER TABLE claims   ADD COLUMN IF NOT EXISTS payout_amount_inr FLOAT DEFAULT NULL"),
        ("claims",   "ALTER TABLE claims   ADD COLUMN IF NOT EXISTS payout_amount_paise INTEGER DEFAULT NULL"),
        ("claims",   "ALTER TABLE claims   ADD COLUMN IF NOT EXISTS disruption_hours FLOAT DEFAULT NULL"),
        ("claims",   "ALTER TABLE claims   ADD COLUMN IF NOT EXISTS razorpay_payout_id VARCHAR DEFAULT NULL"),
        ("claims",   "ALTER TABLE claims   ADD COLUMN IF NOT EXISTS payout_status VARCHAR DEFAULT NULL"),
        ("claims",   "ALTER TABLE claims   ADD COLUMN IF NOT EXISTS payout_initiated_at TIMESTAMP DEFAULT NULL"),
        ("claims",   "ALTER TABLE claims   ADD COLUMN IF NOT EXISTS payout_completed_at TIMESTAMP DEFAULT NULL"),
        ("claims",   "ALTER TABLE claims   ADD COLUMN IF NOT EXISTS payment_mode VARCHAR DEFAULT NULL"),
    ]
    for _, sql in migration_columns:
        try:
            cursor.execute(sql)
            conn.commit()
        except Exception:
            conn.rollback()

    # Seed an admin user if not exists
    cursor.execute("SELECT id FROM users WHERE email = 'admin@surakshapay.com'")
    if not cursor.fetchone():
        admin_pwd = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute('''
            INSERT INTO users (full_name, phone, work_hours, daily_earnings, weekly_income, email, password_hash, role)
            VALUES ('System Admin', '0000000000', 0, 0, 0, 'admin@surakshapay.com', %s, 'admin')
        ''', (admin_pwd,))
        conn.commit()

    conn.commit()
    conn.close()


# Run DB initialization immediately on startup
init_db()

# Register all routers (each has its own prefix: /api/assess, /api/claims, /api/policies)
app.include_router(assessment_router)
app.include_router(claims_router)
app.include_router(policies_router)
app.include_router(admin_router)


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class UserRegistration(BaseModel):
    """
    Registration request body. Location fields are optional:
    - If latitude + longitude supplied → weather fetched by coords, city
      derived via reverse geocoding (OpenWeatherMap /geo/1.0/reverse).
    - If only city supplied → used as-is for all API lookups.
    - If neither → APIs use defaults / city left NULL.
    """
    fullName:       str
    phone:          str
    email:          str
    password:       str
    workHours:      int
    dailyEarnings:  float
    selectedPlan:   str
    city:           Optional[str]   = None  # User's city (typed or resolved)
    latitude:       Optional[float] = None  # GPS latitude
    longitude:      Optional[float] = None  # GPS longitude


class UserLogin(BaseModel):
    email: str
    password: str

class CalculationResult(BaseModel):
    premium:           float
    expectedLoss:      float
    payoutIfTriggered: float

class PremiumBaseRequest(BaseModel):
    workHours:      int
    dailyEarnings:  float
    selectedPlan:   str
    riskLevel:      Optional[int] = 30  # Default to 30% if not provided


# ---------------------------------------------------------------------------
# Root / health check
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
def read_root():
    """Health check — confirms the API is running."""
    return {
        "message":   "SurakshaPay API is running. Access /docs for Swagger UI.",
        "version":   "2.0.0",
        "endpoints": ["/api/register", "/api/assess", "/api/claims", "/api/policies", "/api/dashboard/{user_id}", "/api/analytics/{user_id}"],
    }

# ---------------------------------------------------------------------------
# GET /api/analytics/{user_id} — Analytics history for the frontend
# ---------------------------------------------------------------------------

@app.get("/api/analytics/{user_id}", tags=["Analytics"])
def get_analytics(user_id: int):
    """
    Returns dynamically generated past 6 months of data, incorporating
    the user's real base premium and any actual approved claims.
    """
    conn = get_dict_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cursor.execute("SELECT calculated_premium FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
        
    base_premium = user["calculated_premium"] or 150

    import calendar
    from datetime import datetime
    import random
    
    # Fetch real claims grouped by year-month
    cursor.execute('''
        SELECT EXTRACT(MONTH FROM created_at) as month_num, 
               EXTRACT(YEAR FROM created_at) as year_num,
               COALESCE(SUM(payout_amount), 0) as total_payout
        FROM claims
        WHERE user_id = %s AND status IN ('approved', 'auto_approved')
        GROUP BY year_num, month_num
    ''', (user_id,))
    
    claims_by_month = {}
    for row in cursor.fetchall():
        key = f"{int(row['year_num'])}-{int(row['month_num']):02d}"
        claims_by_month[key] = row["total_payout"]

    conn.close()

    now = datetime.now()
    random.seed(user_id) # deterministic using user id
    
    premium_history = []
    risk_trend = []
    total_premium = 0
    total_payout = 0
    
    for i in range(5, -1, -1):
        m = now.month - i
        y = now.year
        if m <= 0:
            m += 12
            y -= 1
            
        month_name = calendar.month_abbr[m]
        key = f"{y}-{m:02d}"
        
        # Monthly premium is roughly 4 weeks of weekly premium + slight variance for realism
        variance = random.uniform(0.9, 1.1) if i > 0 else 1.0
        monthly_premium = round(base_premium * 4 * variance) 
        
        real_payout = claims_by_month.get(key, 0.0)
        # Synthesize past payouts if no real ones exist for the demo aesthetics
        synth_payout = 0
        if i > 0 and real_payout == 0 and random.random() > 0.8:
             synth_payout = round(base_premium * random.uniform(2, 6))
        
        payout = real_payout or synth_payout
        score = random.randint(25, 45)
        
        total_premium += monthly_premium
        total_payout += payout
        
        premium_history.append({
            "month": month_name,
            "premium": monthly_premium,
            "payout": payout
        })
        risk_trend.append({
            "month": month_name,
            "score": score
        })
        
    return {
        "premiumHistory": premium_history,
        "riskTrend": risk_trend,
        "totalPremium": total_premium,
        "totalPayout": total_payout
    }



# ---------------------------------------------------------------------------
# POST /api/calculate_premium — Static premium calculation (no external APIs)
# ---------------------------------------------------------------------------

@app.post("/api/calculate_premium", response_model=CalculationResult, tags=["Premium"])
def calculate_premium_endpoint(req: PremiumBaseRequest):
    """
    Static premium calculation. Uses the core actuarial formula from premium_model.py.
    Provides instant response for pre-registration previews or the Premium Calculator.
    """
    from premium_model import calculate_premium
    
    # Derived hourly income, guard against zero work hours
    avg_hourly_income = req.dailyEarnings / max(req.workHours, 1)

    risk_prob = req.riskLevel / 100.0

    res = calculate_premium(
        risk_probability=risk_prob,
        hourly_income=avg_hourly_income,
        daily_hours=req.workHours,
        plan=req.selectedPlan
    )

    return CalculationResult(
        premium           = res["weekly_premium"],
        expectedLoss      = res["expected_loss"],
        payoutIfTriggered = res["payout_if_triggered"],
    )


# ---------------------------------------------------------------------------
# POST /api/register — User registration with location storage (Phase 2)
# ---------------------------------------------------------------------------

@app.post("/api/register", tags=["Users"])
def register_user(req: UserRegistration):
    """
    Registers a new gig worker and creates their initial policy.

    Phase 2 behaviour:
    - If lat/lon provided but city not set → reverse geocodes coordinates to city name.
    - Stores city, latitude, longitude in the users table.
    - Creates an initial 'active' policy in the policies table.
    """
    # Calculate static premium for initial policy record
    calc_req = PremiumBaseRequest(
        workHours=req.workHours,
        dailyEarnings=req.dailyEarnings,
        selectedPlan=req.selectedPlan,
        riskLevel=30
    )
    calc    = calculate_premium_endpoint(calc_req)
    premium = calc.premium

    # Resolve city: prefer explicit city, fall back to reverse geocode from coords
    city = req.city
    if not city and req.latitude is not None and req.longitude is not None:
        from api_fetcher import reverse_geocode
        city = reverse_geocode(req.latitude, req.longitude)

    # Hash password securely using bcrypt
    pwd_bytes = req.password.encode('utf-8')
    hashed_password = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')

    conn   = get_connection()
    cursor = conn.cursor()

    try:
        # Insert the user record with all location fields
        cursor.execute('''
            INSERT INTO users (
                full_name, phone, email, password_hash, work_hours, daily_earnings,
                weekly_income, selected_plan, calculated_premium,
                city, latitude, longitude
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        ''', (
            req.fullName, req.phone, req.email, hashed_password, req.workHours, req.dailyEarnings,
            req.dailyEarnings * 6,          # weekly_income = dailyEarnings × 6-day week
            req.selectedPlan, premium,
            city, req.latitude, req.longitude,
        ))
        
        user_id = cursor.fetchone()[0]
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    # Derive coverage factor for the selected plan
    alpha_map = {"basic": 0.6, "standard": 0.7, "pro": 0.85}
    alpha     = alpha_map.get(req.selectedPlan.lower(), 0.7)

    # Insert the initial active policy
    cursor.execute('''
        INSERT INTO policies (user_id, plan_name, coverage_factor, weekly_premium, status)
        VALUES (%s, %s, %s, %s, 'active')
    ''', (user_id, req.selectedPlan, alpha, premium))

    # Insert notification for admin
    cursor.execute('''
        INSERT INTO notifications (message, type)
        VALUES (%s, 'registration')
    ''', (f"New worker registered: {req.fullName} from {city}",))

    conn.commit()
    conn.close()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"user_id": user_id, "role": "worker"}, expires_delta=access_token_expires
    )

    return {
        "message": "User and policy registered successfully",
        "user_id": user_id,
        "role":    "worker",
        "premium": premium,
        "city":    city,
        "token":   access_token
    }


# ---------------------------------------------------------------------------
# POST /api/login — User login flow
# ---------------------------------------------------------------------------

@app.post("/api/login", tags=["Users"])
def login_user(req: UserLogin):
    """
    Simulates a secure login endpoint using email and bcrypt password verification.
    """
    conn = get_dict_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute('''
        SELECT id, full_name, selected_plan, calculated_premium, password_hash, role
        FROM users
        WHERE email = %s
        ORDER BY id DESC LIMIT 1
    ''', (req.email,))
    user = cursor.fetchone()
    conn.close()

    # Verify user exists and password hash matches
    if not user or not bcrypt.checkpw(req.password.encode('utf-8'), user["password_hash"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"user_id": user["id"], "role": user.get("role", "worker")}, expires_delta=access_token_expires
    )

    return {
        "user_id": user["id"],
        "name":    user["full_name"],
        "plan":    user["selected_plan"],
        "premium": user["calculated_premium"],
        "role":    user.get("role", "worker"),
        "token":   access_token
    }


# ---------------------------------------------------------------------------
# GET /api/user/{user_id} — Fetch raw user record
# ---------------------------------------------------------------------------

@app.get("/api/user/{user_id}", tags=["Users"])
def get_user(user_id: int):
    """Returns the full user record from the DB."""
    conn = get_dict_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(row)


# ---------------------------------------------------------------------------
# GET /api/dashboard/{user_id} — Aggregated dashboard view for the frontend
# ---------------------------------------------------------------------------

@app.get("/api/dashboard/{user_id}", tags=["Dashboard"])
def get_dashboard(user_id: int):
    """
    Returns a single aggregated payload for the frontend dashboard, combining:
    - User profile & location
    - Active policy details
    - Latest assessment result (if any, from claims history)
    - Claims summary: total, auto_approved, pending, total_payout
    - Recent 5 claims (for the activity feed)

    This avoids the frontend needing to make 4 separate API calls.
    """
    conn = get_dict_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # ── 1. Fetch user ────────────────────────────────────────────────────────
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    # ── 2. Fetch active policy ───────────────────────────────────────────────
    cursor.execute('''
        SELECT * FROM policies
        WHERE user_id = %s AND (status IS NULL OR status = 'active')
        ORDER BY id DESC LIMIT 1
    ''', (user_id,))
    policy = cursor.fetchone()

    # ── 3. Claims summary stats ──────────────────────────────────────────────
    cursor.execute('''
        SELECT
            COUNT(*)                                           AS total_claims,
            SUM(CASE WHEN status = 'auto_approved' THEN 1 ELSE 0 END) AS auto_approved,
            SUM(CASE WHEN status = 'approved'      THEN 1 ELSE 0 END) AS approved,
            SUM(CASE WHEN status = 'pending'       THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status = 'rejected'      THEN 1 ELSE 0 END) AS rejected,
            COALESCE(SUM(
                CASE WHEN status IN ('auto_approved', 'approved')
                THEN payout_amount ELSE 0 END
            ), 0)                                              AS total_payout
        FROM claims WHERE user_id = %s
    ''', (user_id,))
    stats_row = cursor.fetchone()

    # ── 4. Recent 5 claims (activity feed) ───────────────────────────────────
    cursor.execute('''
        SELECT id, trigger_type, status, payout_amount, risk_level, created_at,
               fraud_score, trust_score, fraud_decision, fraud_type_suspected, fraud_flags
        FROM claims
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 5
    ''', (user_id,))
    recent_claims = [dict(r) for r in cursor.fetchall()]

    conn.close()

    # ── Assemble response ────────────────────────────────────────────────────
    user_dict = dict(user)

    # Coverage percentage and max payout derived from policy + weekly_income
    policy_dict = None
    if policy:
        weekly_income = user_dict.get("weekly_income") or 0
        policy_dict = {
            "id":                 policy["id"],
            "plan_name":          policy["plan_name"],
            "coverage_factor":    policy["coverage_factor"],
            "weekly_premium":     policy["weekly_premium"],
            "status":             policy["status"] or "active",
            "coverage_percentage": f"{int(policy['coverage_factor'] * 100)}%",
            "max_weekly_payout":   round(weekly_income * policy["coverage_factor"], 2),
        }

    stats = dict(stats_row) if stats_row else {}

    return {
        "user": {
            "id":                user_dict["id"],
            "full_name":         user_dict["full_name"],
            "phone":             user_dict["phone"],
            "city":              user_dict.get("city"),
            "latitude":          user_dict.get("latitude"),
            "longitude":         user_dict.get("longitude"),
            "work_hours":        user_dict["work_hours"],
            "daily_earnings":    user_dict["daily_earnings"],
            "weekly_income":     user_dict["weekly_income"],
            "selected_plan":     user_dict["selected_plan"],
            "calculated_premium": user_dict["calculated_premium"],
        },
        "policy":        policy_dict,
        "claims_summary": {
            "total":         stats.get("total_claims", 0),
            "auto_approved": stats.get("auto_approved", 0),
            "approved":      stats.get("approved",      0),
            "pending":       stats.get("pending",       0),
            "rejected":      stats.get("rejected",      0),
            "total_payout":  round(stats.get("total_payout", 0), 2),
        },
        "recent_claims": recent_claims,
    }
