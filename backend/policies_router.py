"""
policies_router.py — Policy management endpoints.

A policy represents a user's insurance contract: plan tier, coverage factor,
and the resulting weekly premium. Users start with one 'active' policy created
at registration. Upgrades soft-cancel the old policy and create a new one.

Endpoints:
  GET    /api/policies/{user_id}          → Fetch active policy with full plan details
  PATCH  /api/policies/{user_id}/upgrade  → Upgrade tier, recalculate premium
  DELETE /api/policies/{user_id}          → Cancel policy (soft delete, status='cancelled')
"""

import os
import psycopg2
import psycopg2.extras
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/surakshapay")

# Plan definitions — single source of truth for this router
# alpha = coverage factor (fraction of loss that is covered by the plan)
PLAN_DETAILS = {
    "basic": {
        "alpha":             0.6,
        "label":             "Basic",
        "coverage_pct":      "60%",
        "description":       "Essential coverage for occasional disruptions",
    },
    "standard": {
        "alpha":             0.7,
        "label":             "Standard",
        "coverage_pct":      "70%",
        "description":       "Balanced coverage for daily commuters",
    },
    "pro": {
        "alpha":             0.85,
        "label":             "Pro",
        "coverage_pct":      "85%",
        "description":       "Maximum coverage for full-time gig workers",
    },
}

# Actuarial constants (must match premium_model.py to stay consistent)
SIGMA  = 269.0   # Income volatility constant
BETA   = 0.2     # Risk sensitivity weight
MARGIN = 10.0    # Platform operational margin (₹)
P_BASE = 0.3     # Baseline disruption probability for static recalculations

router = APIRouter(prefix="/api/policies", tags=["Policy Management"])


# ---------------------------------------------------------------------------
# Pydantic request schemas
# ---------------------------------------------------------------------------

class UpgradePlanRequest(BaseModel):
    """Body for the plan upgrade endpoint."""
    new_plan: str  # "basic" | "standard" | "pro"


# ---------------------------------------------------------------------------
# GET /api/policies/{user_id} — Fetch active policy
# ---------------------------------------------------------------------------

@router.get("/{user_id}")
def get_policy(user_id: int):
    """
    Returns the user's currently active policy enriched with:
    - Plan label and description (human-readable strings for the UI)
    - Coverage percentage string (e.g. "70%")
    - Max weekly payout (weekly_income × alpha)
    - Status (always 'active' for a current policy)
    """
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # ── Verify user exists ────────────────────────────────────────────────────
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    # ── Fetch the most recent active policy ───────────────────────────────────
    cursor.execute('''
        SELECT * FROM policies
        WHERE user_id = %s AND (status IS NULL OR status = 'active')
        ORDER BY id DESC LIMIT 1
    ''', (user_id,))
    policy = cursor.fetchone()
    conn.close()

    if not policy:
        raise HTTPException(status_code=404, detail="No active policy found for this user")

    # Enrich with plan metadata from PLAN_DETAILS
    plan_key  = (policy["plan_name"] or "standard").lower()
    plan_meta = PLAN_DETAILS.get(plan_key, PLAN_DETAILS["standard"])

    weekly_income   = user["weekly_income"] or 0
    max_payout      = round(weekly_income * policy["coverage_factor"], 2)

    return {
        "user_id":   user_id,
        "user_name": user["full_name"],
        "policy": {
            "id":               policy["id"],
            "plan_name":        policy["plan_name"],
            "plan_label":       plan_meta["label"],
            "plan_description": plan_meta["description"],
            "coverage_factor":  policy["coverage_factor"],
            "coverage_percentage": plan_meta["coverage_pct"],
            "weekly_premium":   policy["weekly_premium"],
            "max_weekly_payout": max_payout,
            "status":           policy["status"] or "active",
        },
    }


# ---------------------------------------------------------------------------
# PATCH /api/policies/{user_id}/upgrade — Upgrade (or change) plan
# ---------------------------------------------------------------------------

@router.patch("/{user_id}/upgrade")
def upgrade_plan(user_id: int, req: UpgradePlanRequest):
    """
    Changes the user's plan tier and recalculates their weekly premium.

    Process:
      1. Validate new_plan is one of: basic, standard, pro
      2. Soft-cancel all existing active policies (status='cancelled')
      3. Insert a new active policy with the new plan's alpha and recalculated premium
      4. Update the users table (selected_plan, calculated_premium) to stay in sync

    Premium is recalculated using the base static formula (p=0.3) since we
    don't re-fetch live signals during an upgrade. Use /api/assess to get a
    fully dynamic premium reflecting current conditions.
    """
    new_plan = req.new_plan.lower()
    if new_plan not in PLAN_DETAILS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid plan '{req.new_plan}'. Must be one of: {list(PLAN_DETAILS.keys())}",
        )

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # ── Fetch and validate user ───────────────────────────────────────────────
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    # ── Recalculate premium using the base static formula ─────────────────────
    # Formula: P_w = (expected_loss × alpha) + (sigma × beta) + margin
    hourly_income = user["daily_earnings"] / max(user["work_hours"], 1)
    base_loss     = hourly_income * user["work_hours"] * 6   # 6-day work week
    expected_loss = base_loss * P_BASE                        # p = 0.3 static

    alpha       = PLAN_DETAILS[new_plan]["alpha"]
    new_premium = round((expected_loss * alpha) + (SIGMA * BETA) + MARGIN, 2)

    old_plan = user["selected_plan"]

    # ── Soft-cancel all current active policies ───────────────────────────────
    cursor.execute('''
        UPDATE policies SET status = 'cancelled'
        WHERE user_id = %s AND (status IS NULL OR status = 'active')
    ''', (user_id,))

    # ── Insert new active policy ──────────────────────────────────────────────
    cursor.execute('''
        INSERT INTO policies (user_id, plan_name, coverage_factor, weekly_premium, status)
        VALUES (%s, %s, %s, %s, 'active') RETURNING id
    ''', (user_id, new_plan, alpha, new_premium))

    new_policy_id = cursor.fetchone()[0]

    # ── Sync users table ──────────────────────────────────────────────────────
    cursor.execute('''
        UPDATE users SET selected_plan = %s, calculated_premium = %s
        WHERE id = %s
    ''', (new_plan, new_premium, user_id))

    conn.commit()
    conn.close()

    plan_meta = PLAN_DETAILS[new_plan]

    return {
        "message":          f"Plan upgraded from '{old_plan}' to '{new_plan}'",
        "user_id":          user_id,
        "new_policy_id":    new_policy_id,
        "old_plan":         old_plan,
        "new_plan":         new_plan,
        "new_plan_label":   plan_meta["label"],
        "new_coverage":     plan_meta["coverage_pct"],
        "new_weekly_premium": new_premium,
    }


# ---------------------------------------------------------------------------
# DELETE /api/policies/{user_id} — Cancel policy (soft delete)
# ---------------------------------------------------------------------------

@router.delete("/{user_id}")
def cancel_policy(user_id: int):
    """
    Cancels a user's active policy by setting status to 'cancelled'.
    This is a soft delete — the record is retained for audit and historical claims.
    The user can re-register or upgrade to get a new active policy.
    """
    conn   = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    # ── Verify there is an active policy to cancel ────────────────────────────
    cursor.execute('''
        SELECT id FROM policies
        WHERE user_id = %s AND (status IS NULL OR status = 'active')
    ''', (user_id,))
    policy = cursor.fetchone()

    if not policy:
        conn.close()
        raise HTTPException(
            status_code=404,
            detail=f"No active policy found for user {user_id}",
        )

    cursor.execute('''
        UPDATE policies SET status = 'cancelled'
        WHERE user_id = %s AND (status IS NULL OR status = 'active')
    ''', (user_id,))

    conn.commit()
    conn.close()

    return {
        "message":       "Policy cancelled successfully",
        "user_id":       user_id,
        "policy_id":     policy[0],
        "status":        "cancelled",
        "note":          "Historical claims and records are preserved for audit purposes",
    }
