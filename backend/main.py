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
import psycopg2
import psycopg2.extras
import bcrypt
import math
from typing import List, Optional

# Import all feature routers
from assessment_router import router as assessment_router
from claims_router import router as claims_router
from policies_router import router as policies_router

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

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/surakshapay")


# ---------------------------------------------------------------------------
# Database Initialization — Phase 2 schema with safe ALTER TABLE migrations
# ---------------------------------------------------------------------------

def init_db():
    """
    Creates all required tables if they don't exist.
    Also runs ALTER TABLE migrations so an existing Phase 1 DB is upgraded
    seamlessly without data loss.
    """
    conn = psycopg2.connect(DATABASE_URL)
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
            password_hash     TEXT
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
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
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
        ("policies", "ALTER TABLE policies ADD COLUMN IF NOT EXISTS status    TEXT DEFAULT 'active'"),
    ]
    for _, sql in migration_columns:
        try:
            cursor.execute(sql)
            conn.commit()
        except Exception:
            conn.rollback()

    conn.commit()
    conn.close()


# Run DB initialization immediately on startup
init_db()

# Register all routers (each has its own prefix: /api/assess, /api/claims, /api/policies)
app.include_router(assessment_router)
app.include_router(claims_router)
app.include_router(policies_router)


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
        "endpoints": ["/api/register", "/api/assess", "/api/claims", "/api/policies", "/api/dashboard/{user_id}"],
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

    conn   = psycopg2.connect(DATABASE_URL)
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

    conn.commit()
    conn.close()

    return {
        "message": "User and policy registered successfully",
        "user_id": user_id,
        "premium": premium,
        "city":    city,
    }


# ---------------------------------------------------------------------------
# POST /api/login — User login flow
# ---------------------------------------------------------------------------

@app.post("/api/login", tags=["Users"])
def login_user(req: UserLogin):
    """
    Simulates a secure login endpoint using email and bcrypt password verification.
    """
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute('''
        SELECT id, full_name, selected_plan, calculated_premium, password_hash 
        FROM users 
        WHERE email = %s 
        ORDER BY id DESC LIMIT 1
    ''', (req.email,))
    user = cursor.fetchone()
    conn.close()

    # Verify user exists and password hash matches
    if not user or not bcrypt.checkpw(req.password.encode('utf-8'), user["password_hash"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "user_id": user["id"],
        "name":    user["full_name"],
        "plan":    user["selected_plan"],
        "premium": user["calculated_premium"],
    }


# ---------------------------------------------------------------------------
# GET /api/user/{user_id} — Fetch raw user record
# ---------------------------------------------------------------------------

@app.get("/api/user/{user_id}", tags=["Users"])
def get_user(user_id: int):
    """Returns the full user record from the DB."""
    conn = psycopg2.connect(DATABASE_URL)
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
    conn = psycopg2.connect(DATABASE_URL)
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
        SELECT id, trigger_type, status, payout_amount, risk_level, created_at
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
