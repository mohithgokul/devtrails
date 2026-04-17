"""
assessment_router.py — FastAPI router that wires the full data pipeline.

Full pipeline (Steps 1–4):
  1. Fetch all external signals (weather, AQI, news) via api_fetcher.py
  2. Run rule-based risk model  →  risk_probability, risk_level, factors
  3. Calculate personalized weekly premium via premium_model.py
  4. Evaluate parametric triggers → auto-file claims if conditions are met

Phase 2 additions:
  - Optional latitude/longitude fields in AssessRequest
  - POST /api/assess/from_user/{user_id} — zero-touch flow using stored DB location
  - Shared _run_pipeline() helper to avoid code duplication across endpoints

Endpoints:
  POST /api/assess                      → Full pipeline with optional lat/lon
  POST /api/assess/from_user/{user_id}  → Zero-touch: location loaded from DB
  GET  /api/assess/signals              → Raw signals only (debug / testing)
"""

import os
import psycopg2
import psycopg2.extras
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from api_fetcher import fetch_all_signals
from risk_model import assess_risk
from premium_model import calculate_premium
from trigger_engine import evaluate_triggers

from db import get_dict_connection

router = APIRouter(prefix="/api/assess", tags=["Assessment Pipeline"])


# ---------------------------------------------------------------------------
# Pydantic request schema
# ---------------------------------------------------------------------------

class AssessRequest(BaseModel):
    """
    Assessment request body.

    Location resolution priority:
        1. If latitude + longitude provided → coordinate-based weather,
           reverse geocode for city (used by AQI + news).
        2. If only city provided → city-name APIs for all data sources.
        3. If neither → APIs use DEFAULTS (pipeline still runs).

    city is left as empty string default so the frontend can omit it when
    providing coordinates instead.
    """
    user_id:       int
    city:          str            = ""     # Optional when lat/lon are provided
    hourly_income: float
    daily_hours:   int
    plan:          str                     # "basic" | "standard" | "pro"
    latitude:      Optional[float] = None  # Phase 2: GPS latitude
    longitude:     Optional[float] = None  # Phase 2: GPS longitude


# ---------------------------------------------------------------------------
# Shared pipeline runner — powers both POST endpoints
# ---------------------------------------------------------------------------

def _run_pipeline(
    user_id:       int,
    city:          str,
    hourly_income: float,
    daily_hours:   int,
    plan:          str,
    lat:           Optional[float] = None,
    lon:           Optional[float] = None,
) -> dict:
    """
    Core pipeline logic extracted into a shared function so both
    POST /api/assess and POST /api/assess/from_user/{user_id} produce
    identical structured output without duplicating code.

    Steps:
        1. fetch_all_signals   → raw feature vector + metadata
        2. assess_risk         → risk_probability, risk_level, contributing_factors
        3. calculate_premium   → weekly_premium, payout_if_triggered, expected_loss
        4. evaluate_triggers   → check 5 parametric conditions, auto-file claims
        5. Assemble response   → combined dict returned to the client
    """

    # ── Validate plan name upfront ────────────────────────────────────────────
    if plan.lower() not in ("basic", "standard", "pro"):
        raise HTTPException(status_code=400, detail="plan must be one of: basic, standard, pro")

    # ── Step 1: External API signals ─────────────────────────────────────────
    # fetch_all_signals decides whether to use city or coordinate-based APIs
    signals = fetch_all_signals(
        city          = city,
        hourly_income = hourly_income,
        daily_hours   = daily_hours,
        lat           = lat,
        lon           = lon,
    )

    # ── Step 2: Risk model ────────────────────────────────────────────────────
    # assess_risk takes the ordered feature vector and returns a risk dict
    risk = assess_risk(signals["feature_vector"])

    # ── Step 3: Premium calculation ───────────────────────────────────────────
    # calculate_premium uses risk_probability + user earnings to compute premium
    premium = calculate_premium(
        risk_probability = risk["risk_probability"],
        hourly_income    = hourly_income,
        daily_hours      = daily_hours,
        plan             = plan,
    )

    # ── Step 4: Parametric trigger evaluation ─────────────────────────────────
    # evaluate_triggers checks 5 conditions; auto-files claims to DB if triggered
    fired_triggers = evaluate_triggers(
        user_id      = user_id,
        raw_signals  = signals["raw"],
        risk         = risk,
        payout_amount = premium["payout_if_triggered"],
    )

    # ── Step 5: Assemble response ─────────────────────────────────────────────
    resolved_city = signals.get("resolved_city", city)

    return {
        "user_id":        user_id,
        "city":           resolved_city,
        "plan":           plan.lower(),
        "feature_vector": signals["feature_vector"],
        "sources":        signals["sources"],
        "raw_signals":    signals["raw"],
        "risk": {
            "risk_probability":    risk["risk_probability"],
            "risk_level":          risk["risk_level"],
            "contributing_factors": risk["contributing_factors"],
        },
        "premium": {
            "weekly_premium":     premium["weekly_premium"],
            "payout_if_triggered": premium["payout_if_triggered"],
            "expected_loss":      premium["expected_loss"],
            "risk_surcharge":     premium["risk_surcharge"],
        },
        # Each fired trigger produced an auto-approved claim; include IDs for traceability
        "triggers_fired": [
            {
                "trigger_type": t["trigger_type"],
                "description":  t["description"],
                "claim_id":     t.get("claim_id"),
                "status":       "auto_approved",
            }
            for t in fired_triggers
        ],
        "triggers_count": len(fired_triggers),
    }


# ---------------------------------------------------------------------------
# POST /api/assess — Full pipeline with optional lat/lon
# ---------------------------------------------------------------------------

@router.post("")
def run_assessment(req: AssessRequest):
    """
    Runs the complete 4-step pipeline using the request body.

    Use this endpoint when:
    - You have user income/hours/plan details in hand.
    - You may optionally supply GPS coordinates for more accurate weather data.

    Parametric triggers are evaluated automatically; any conditions that fire
    will insert auto-approved claims into the DB and appear in triggers_fired.
    """
    return _run_pipeline(
        user_id       = req.user_id,
        city          = req.city,
        hourly_income = req.hourly_income,
        daily_hours   = req.daily_hours,
        plan          = req.plan,
        lat           = req.latitude,
        lon           = req.longitude,
    )


# ---------------------------------------------------------------------------
# POST /api/assess/from_user/{user_id} — Zero-touch flow (Phase 2)
# ---------------------------------------------------------------------------

@router.post("/from_user/{user_id}")
def assess_from_user(user_id: int):
    """
    Zero-touch assessment: loads ALL data from the user's DB record.
    No request body required — the pipeline uses the stored city, coordinates,
    work hours, daily earnings, and selected plan.

    When to use this endpoint:
    - Scheduled night-time re-assessments (cron/background tasks)
    - "Refresh my risk score" button on the frontend dashboard
    - Any flow where the user doesn't need to re-enter their data
    """
    conn = get_dict_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    # Pull stored location and work data from the users table
    city          = user["city"] or ""          # May be empty for legacy records
    lat           = user["latitude"]            # None if not provided at registration
    lon           = user["longitude"]           # None if not provided at registration
    hourly_income = user["daily_earnings"] / max(user["work_hours"], 1)
    daily_hours   = user["work_hours"]
    plan          = user["selected_plan"] or "standard"  # Default if somehow missing

    return _run_pipeline(
        user_id       = user_id,
        city          = city,
        hourly_income = hourly_income,
        daily_hours   = daily_hours,
        plan          = plan,
        lat           = lat,
        lon           = lon,
    )


# ---------------------------------------------------------------------------
# GET /api/assess/signals — Raw signals only (debug / integration testing)
# ---------------------------------------------------------------------------

@router.get("/signals")
def get_signals(
    city:          str            = "Bangalore",
    hourly_income: float          = 100.0,
    daily_hours:   int            = 8,
    lat:           Optional[float] = None,
    lon:           Optional[float] = None,
):
    """
    Returns only the raw feature vector and API source metadata.
    The risk and premium models are NOT run — useful for:
    - Verifying API key connectivity
    - Debugging signal values before a full assessment
    - Integration tests that need to isolate the data-fetching layer
    """
    signals = fetch_all_signals(
        city          = city,
        hourly_income = hourly_income,
        daily_hours   = daily_hours,
        lat           = lat,
        lon           = lon,
    )
    return {
        "city":           signals.get("resolved_city", city),
        "feature_vector": signals["feature_vector"],
        "sources":        signals["sources"],
        "raw_signals":    signals["raw"],
    }
