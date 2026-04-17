import os
import psycopg2
import psycopg2.extras
from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/admin", tags=["Admin"])

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/surakshapay")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey_for_surakshapay_fastapi_001")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

# Import ML risk model (gracefully handle missing artifacts)
try:
    from risk_model import assess_risk
    ML_AVAILABLE = True
except Exception:
    ML_AVAILABLE = False
    def assess_risk(vector):
        return {"risk_probability": 0.1, "risk_level": "low", "contributing_factors": ["ML unavailable"]}

def get_current_admin(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role: str = payload.get("role")
        if role != "admin":
            raise HTTPException(status_code=403, detail="Admin privileges required")
        return payload
    except JWTError:
        raise credentials_exception

@router.get("/stats")
def get_admin_stats(admin_user: dict = Depends(get_current_admin)):
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Policies count & total premiums
    cursor.execute("SELECT COUNT(*) as count, COALESCE(SUM(weekly_premium), 0) as total_premium FROM policies WHERE status = 'active'")
    policies_row = cursor.fetchone()
    total_policies = policies_row["count"]
    total_premiums = float(policies_row["total_premium"])
    
    # Claims paid
    cursor.execute("SELECT COALESCE(SUM(payout_amount), 0) as total_paid FROM claims WHERE status IN ('approved', 'auto_approved')")
    claims_row = cursor.fetchone()
    claims_paid = float(claims_row["total_paid"])

    loss_ratio = (claims_paid / total_premiums * 100) if total_premiums > 0 else 0
    
    # For Premium vs Claims area chart mock history (you can add real monthly aggregates later, defaulting to static shape combined with real total)
    conn.close()

    return {
        "totalActivePolicies": total_policies,
        "totalPremiums": total_premiums,
        "totalClaimsPaid": claims_paid,
        "overallLossRatio": round(loss_ratio, 1),
        "policyChange": 12.5,
        "premiumChange": 8.2,
        "claimsChange": -2.4
    }

@router.get("/workers")
def get_admin_workers(admin_user: dict = Depends(get_current_admin)):
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute('''
        SELECT u.id, u.full_name, u.phone, u.city, p.plan_name, p.status,
               (SELECT COUNT(*) FROM claims WHERE user_id = u.id) as claims_filed
        FROM users u
        LEFT JOIN policies p ON p.user_id = u.id
        WHERE u.role = 'worker'
        ORDER BY u.id DESC
    ''')
    workers = cursor.fetchall()
    conn.close()
    return {"workers": workers}

@router.get("/claims")
def get_admin_claims(admin_user: dict = Depends(get_current_admin)):
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute('''
        SELECT c.id, c.trigger_type, c.payout_amount, c.status, c.created_at, u.full_name, u.city
        FROM claims c
        JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
    ''')
    claims = cursor.fetchall()
    conn.close()
    return {"claims": claims}

@router.get("/policies")
def get_admin_policies(admin_user: dict = Depends(get_current_admin)):
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute('''
        SELECT p.id, p.plan_name, p.coverage_factor, p.weekly_premium, p.status, u.full_name, u.city 
        FROM policies p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.id DESC
    ''')
    policies = cursor.fetchall()
    conn.close()
    return {"policies": policies}


# ---------------------------------------------------------------------------
# GET /api/admin/notifications — Fetch all notifications newest-first
# ---------------------------------------------------------------------------

@router.get("/notifications")
def get_notifications(admin_user: dict = Depends(get_current_admin)):
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute('''
        SELECT id, message, type, is_read, created_at
        FROM notifications
        ORDER BY created_at DESC
        LIMIT 30
    ''')
    notifications = cursor.fetchall()
    
    # Count unread
    cursor.execute("SELECT COUNT(*) as count FROM notifications WHERE is_read = FALSE")
    unread_row = cursor.fetchone()
    unread_count = unread_row["count"] if unread_row else 0
    
    conn.close()
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }


# ---------------------------------------------------------------------------
# PATCH /api/admin/notifications/{id}/read — Mark a single notification read
# ---------------------------------------------------------------------------

@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, admin_user: dict = Depends(get_current_admin)):
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE notifications SET is_read = TRUE WHERE id = %s",
        (notification_id,)
    )
    conn.commit()
    conn.close()
    return {"message": f"Notification {notification_id} marked as read"}


# ---------------------------------------------------------------------------
# PATCH /api/admin/notifications/mark-all-read — Mark all notifications read
# ---------------------------------------------------------------------------

@router.patch("/notifications/mark-all-read")
def mark_all_notifications_read(admin_user: dict = Depends(get_current_admin)):
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE")
    conn.commit()
    conn.close()
    return {"message": "All notifications marked as read"}


# ---------------------------------------------------------------------------
# POST /api/admin/risk/score — Score a single worker against the ML model
# ---------------------------------------------------------------------------

class RiskScoreRequest(BaseModel):
    rain: float = 0.0
    temp: float = 30.0
    aqi: float = 80.0
    demand_drop: float = 0.0
    curfew: int = 0
    hourly_income: float = 100.0
    daily_hours: float = 8.0

@router.post("/risk/score")
def score_risk(req: RiskScoreRequest, admin_user: dict = Depends(get_current_admin)):
    """Score environmental conditions through the ML risk model."""
    vector = [req.rain, req.temp, req.aqi, req.demand_drop, req.curfew, req.hourly_income, req.daily_hours]
    result = assess_risk(vector)
    return {
        "ml_available": ML_AVAILABLE,
        **result
    }


# ---------------------------------------------------------------------------
# GET /api/admin/risk/workers — Batch-score all workers using their real data
# ---------------------------------------------------------------------------

@router.get("/risk/workers")
def get_worker_risk_scores(admin_user: dict = Depends(get_current_admin)):
    """
    Fetch all workers and score each using their stored income/hours as
    the economic signals, and neutral weather (no active disaster assumed).
    Returns workers sorted by risk_probability descending.
    """
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute('''
        SELECT u.id, u.full_name, u.city, u.work_hours, u.daily_earnings,
               p.plan_name, p.status,
               (SELECT COUNT(*) FROM claims WHERE user_id = u.id) as claims_filed
        FROM users u
        LEFT JOIN policies p ON p.user_id = u.id
        WHERE u.role = 'worker'
        ORDER BY u.id DESC
    ''')
    workers = cursor.fetchall()
    conn.close()

    scored = []
    for w in workers:
        hourly_income = float(w.get("daily_earnings") or 0) / max(float(w.get("work_hours") or 8), 1)
        daily_hours   = float(w.get("work_hours") or 8)
        # Use neutral weather — admin can override via /risk/score
        vector = [0.0, 32.0, 90.0, 0.0, 0, hourly_income, daily_hours]
        risk = assess_risk(vector)
        scored.append({
            "id":          w["id"],
            "full_name":   w["full_name"],
            "city":        w["city"],
            "plan_name":   w["plan_name"],
            "status":      w["status"],
            "claims_filed": w["claims_filed"],
            "risk_probability": risk["risk_probability"],
            "risk_level":       risk["risk_level"],
            "contributing_factors": risk["contributing_factors"],
        })

    # Sort highest risk first
    scored.sort(key=lambda x: x["risk_probability"], reverse=True)
    return {"workers": scored, "ml_available": ML_AVAILABLE}
