"""
claims_router.py — Claims management endpoints.

Handles both manually filed claims (status='pending', requires admin approval)
and auto-approved parametric claims (filed by trigger_engine.py).

Endpoints:
  POST  /api/claims/file              → Manually file a claim (user-initiated)
  GET   /api/claims/{user_id}         → List all claims for a user with summary stats
  PATCH /api/claims/{claim_id}/status → Admin: update claim status
"""

import sqlite3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

DB_FILE = "surakshapay.db"

router = APIRouter(prefix="/api/claims", tags=["Claims Management"])


# ---------------------------------------------------------------------------
# Pydantic request schemas
# ---------------------------------------------------------------------------

class FileClaimRequest(BaseModel):
    """
    Body for manually filing a claim.
    trigger_type is user-supplied (e.g. "heavy_rain", "manual_disruption").
    description is the worker's free-text explanation of the disruption.
    """
    user_id:      int
    trigger_type: str   # What caused the disruption (informational)
    description:  str   # Worker's description (stored as trigger_type comment)


class UpdateStatusRequest(BaseModel):
    """
    Admin endpoint body for approving or rejecting a claim.
    Valid statuses: 'pending' | 'approved' | 'rejected' | 'auto_approved'
    """
    status: str


# ---------------------------------------------------------------------------
# POST /api/claims/file — Manually file a claim
# ---------------------------------------------------------------------------

@router.post("/file")
def file_claim(req: FileClaimRequest):
    """
    Allows a gig worker to manually file a claim when they experience a
    disruption. The claim starts with status='pending' and requires an
    admin to approve or reject it via PATCH /api/claims/{claim_id}/status.

    Payout amount is calculated from the user's active policy:
        payout = weekly_income × coverage_factor

    If no active policy exists, payout defaults to 0.0.
    """
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # ── Verify user exists ────────────────────────────────────────────────────
    cursor.execute("SELECT * FROM users WHERE id = ?", (req.user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail=f"User {req.user_id} not found")

    # ── Look up active policy for payout calculation ──────────────────────────
    cursor.execute(
        "SELECT * FROM policies WHERE user_id = ? AND (status IS NULL OR status = 'active') ORDER BY id DESC LIMIT 1",
        (req.user_id,),
    )
    policy = cursor.fetchone()

    # Payout = weekly_income × coverage_factor, or 0 if no active policy
    if policy:
        weekly_income  = user["weekly_income"] or 0
        payout_amount  = round(weekly_income * policy["coverage_factor"], 2)
    else:
        payout_amount  = 0.0

    # ── Insert claim with 'pending' status ────────────────────────────────────
    # Manual claims need admin review; auto-approved claims bypass this flow.
    # We store 'unknown' for signal fields since they weren't measured at filing time.
    cursor.execute('''
        INSERT INTO claims (
            user_id, trigger_type, risk_level, risk_probability,
            rain, aqi, demand_drop, curfew,
            payout_amount, status
        ) VALUES (?, ?, 'unknown', 0.0, 0.0, 0, 0, 0, ?, 'pending')
    ''', (req.user_id, req.trigger_type, payout_amount))

    claim_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "message":      "Claim filed successfully — pending admin review",
        "claim_id":     claim_id,
        "user_id":      req.user_id,
        "trigger_type": req.trigger_type,
        "status":       "pending",
        "payout_amount": payout_amount,
    }


# ---------------------------------------------------------------------------
# GET /api/claims/{user_id} — List all claims with summary stats
# ---------------------------------------------------------------------------

@router.get("/{user_id}")
def get_claims(user_id: int):
    """
    Returns all claims for a user, ordered newest-first, along with
    aggregated summary statistics (total counts, total payout disbursed).

    This feeds the frontend "Claims History" tab and the dashboard widget.
    """
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # ── Verify user exists ────────────────────────────────────────────────────
    cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    # ── Fetch all claims ──────────────────────────────────────────────────────
    cursor.execute(
        "SELECT * FROM claims WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,),
    )
    rows   = cursor.fetchall()
    claims = [dict(row) for row in rows]

    # ── Aggregate stats in one query ──────────────────────────────────────────
    cursor.execute('''
        SELECT
            COUNT(*)                                                    AS total,
            SUM(CASE WHEN status = 'auto_approved' THEN 1 ELSE 0 END)  AS auto_approved,
            SUM(CASE WHEN status = 'approved'      THEN 1 ELSE 0 END)  AS approved,
            SUM(CASE WHEN status = 'pending'       THEN 1 ELSE 0 END)  AS pending,
            SUM(CASE WHEN status = 'rejected'      THEN 1 ELSE 0 END)  AS rejected,
            COALESCE(SUM(
                CASE WHEN status IN ('auto_approved', 'approved')
                THEN payout_amount ELSE 0 END
            ), 0) AS total_payout_disbursed
        FROM claims WHERE user_id = ?
    ''', (user_id,))
    s = dict(cursor.fetchone())

    conn.close()

    return {
        "user_id":      user_id,
        "total_claims": len(claims),
        "summary": {
            "total":                 s["total"],
            "auto_approved":         s["auto_approved"],
            "approved":              s["approved"],
            "pending":               s["pending"],
            "rejected":              s["rejected"],
            "total_payout_disbursed": round(s["total_payout_disbursed"], 2),
        },
        "claims": claims,
    }


# ---------------------------------------------------------------------------
# PATCH /api/claims/{claim_id}/status — Admin claim approval/rejection
# ---------------------------------------------------------------------------

@router.patch("/{claim_id}/status")
def update_claim_status(claim_id: int, req: UpdateStatusRequest):
    """
    Admin endpoint to manually approve or reject a pending claim.
    Also allows resetting a claim back to 'pending' or marking 'auto_approved'
    for admin overrides.

    Valid statuses: pending | approved | rejected | auto_approved
    """
    # Validate the status value before touching the DB
    valid_statuses = ("pending", "approved", "rejected", "auto_approved")
    if req.status.lower() not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{req.status}'. Must be one of: {valid_statuses}",
        )

    conn   = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # ── Verify the claim exists ───────────────────────────────────────────────
    cursor.execute("SELECT id, status FROM claims WHERE id = ?", (claim_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")

    old_status = row[1]
    new_status = req.status.lower()

    # ── Update the status ─────────────────────────────────────────────────────
    cursor.execute(
        "UPDATE claims SET status = ? WHERE id = ?",
        (new_status, claim_id),
    )
    conn.commit()
    conn.close()

    return {
        "message":    f"Claim {claim_id} status updated",
        "claim_id":   claim_id,
        "old_status": old_status,
        "new_status": new_status,
    }
