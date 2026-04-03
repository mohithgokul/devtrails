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
import sqlite3
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

DB_FILE = "surakshapay.db"


# ---------------------------------------------------------------------------
# Database Initialization — Phase 2 schema with safe ALTER TABLE migrations
# ---------------------------------------------------------------------------

def init_db():
    """
    Creates all required tables if they don't exist.
    Also runs ALTER TABLE migrations so an existing Phase 1 DB is upgraded
    seamlessly without data loss.
    """
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # ── Users table ──────────────────────────────────────────────────────────
    # Phase 2 adds: city (derived from reverse geocode or user input),
    # latitude, longitude (GPS coordinates for coordinate-based API calls)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name         TEXT    NOT NULL,
            phone             TEXT    NOT NULL,
            work_hours        INTEGER,
            daily_earnings    REAL,
            weekly_income     REAL,
            selected_plan     TEXT,
            calculated_premium REAL,
            city              TEXT,
            latitude          REAL,
            longitude         REAL
        )
    ''')

    # ── Policies table ───────────────────────────────────────────────────────
    # Phase 2 adds: status column ('active' | 'cancelled') for soft-delete
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS policies (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
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
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
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
        ("users",    "ALTER TABLE users    ADD COLUMN city      TEXT"),
        ("users",    "ALTER TABLE users    ADD COLUMN latitude  REAL"),
        ("users",    "ALTER TABLE users    ADD COLUMN longitude REAL"),
        ("policies", "ALTER TABLE policies ADD COLUMN status    TEXT DEFAULT 'active'"),
    ]
    for _, sql in migration_columns:
        try:
            cursor.execute(sql)
        except sqlite3.OperationalError:
            pass  # Column already exists — this is expected on subsequent starts

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
    workHours:      int
    dailyEarnings:  float
    selectedPlan:   str
    city:           Optional[str]   = None  # User's city (typed or resolved)
    latitude:       Optional[float] = None  # GPS latitude
    longitude:      Optional[float] = None  # GPS longitude


class CalculationResult(BaseModel):
    premium:           float
    expectedLoss:      float
    payoutIfTriggered: float


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
def calculate_premium_endpoint(req: UserRegistration):
    """
    Quick static premium calculation using a fixed disruption probability (p=0.3).
    Does NOT call any external APIs — instant response for pre-registration preview.
    For real-time, data-driven assessment use POST /api/assess instead.
    """
    # Derived hourly income, guard against zero work hours
    avg_hourly_income = req.dailyEarnings / max(req.workHours, 1)

    # Expected weekly loss: avg_hourly_income × hours_lost_per_event × events_per_week
    hours_lost_per_event = 4.0
    events_per_week      = 1.5
    L_w = avg_hourly_income * hours_lost_per_event * events_per_week

    p = 0.3  # Fixed probability for static (non-real-time) estimate

    # Coverage factors by plan
    alpha_map = {"basic": 0.6, "standard": 0.7, "pro": 0.85}
    alpha = alpha_map.get(req.selectedPlan.lower(), 0.7)

    # Actuarial constants (see premium_model.py for full documentation)
    sigma = 269.0
    beta  = 0.2
    M     = 10.0

    P_w = round((L_w * p * alpha) + (sigma * beta) + M, 2)

    return CalculationResult(
        premium           = P_w,
        expectedLoss      = round(L_w, 2),
        payoutIfTriggered = round(L_w * alpha, 2),
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
    calc    = calculate_premium_endpoint(req)
    premium = calc.premium

    # Resolve city: prefer explicit city, fall back to reverse geocode from coords
    city = req.city
    if not city and req.latitude is not None and req.longitude is not None:
        from api_fetcher import reverse_geocode
        city = reverse_geocode(req.latitude, req.longitude)

    conn   = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Insert the user record with all location fields
    cursor.execute('''
        INSERT INTO users (
            full_name, phone, work_hours, daily_earnings,
            weekly_income, selected_plan, calculated_premium,
            city, latitude, longitude
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        req.fullName, req.phone, req.workHours, req.dailyEarnings,
        req.dailyEarnings * 6,          # weekly_income = dailyEarnings × 6-day week
        req.selectedPlan, premium,
        city, req.latitude, req.longitude,
    ))

    user_id = cursor.lastrowid

    # Derive coverage factor for the selected plan
    alpha_map = {"basic": 0.6, "standard": 0.7, "pro": 0.85}
    alpha     = alpha_map.get(req.selectedPlan.lower(), 0.7)

    # Insert the initial active policy
    cursor.execute('''
        INSERT INTO policies (user_id, plan_name, coverage_factor, weekly_premium, status)
        VALUES (?, ?, ?, ?, 'active')
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
# GET /api/user/{user_id} — Fetch raw user record
# ---------------------------------------------------------------------------

@app.get("/api/user/{user_id}", tags=["Users"])
def get_user(user_id: int):
    """Returns the full user record from the DB."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
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
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # ── 1. Fetch user ────────────────────────────────────────────────────────
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    # ── 2. Fetch active policy ───────────────────────────────────────────────
    cursor.execute('''
        SELECT * FROM policies
        WHERE user_id = ? AND (status IS NULL OR status = 'active')
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
        FROM claims WHERE user_id = ?
    ''', (user_id,))
    stats_row = cursor.fetchone()

    # ── 4. Recent 5 claims (activity feed) ───────────────────────────────────
    cursor.execute('''
        SELECT id, trigger_type, status, payout_amount, risk_level, created_at
        FROM claims
        WHERE user_id = ?
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
