"""
premium_model.py — Mock premium calculation model.

Implements the SurakshaPay weekly premium formula from the README:

  P_w = (expected_loss × α) + (σ × β) + M + risk_surcharge

Where:
  base_loss      = hourly_income × daily_hours × 6   (6-day work week)
  expected_loss  = base_loss × risk_probability
  α (alpha)      = plan coverage factor {basic: 0.6, standard: 0.7, pro: 0.85}
  σ (sigma)      = 269.0   (income volatility constant — from historical data)
  β (beta)       = 0.2     (risk sensitivity weight)
  M              = 10.0    (platform operational margin ₹)

  risk_surcharge:
    risk_probability > 0.75  → +₹15  (critical zone)
    risk_probability > 0.50  → +₹8   (high zone)
    risk_probability < 0.25  → -₹5   (safe zone discount)
    else                     → ₹0
"""

# Plan coverage factors — defines what % of loss is covered
PLAN_ALPHA = {
    "basic":    0.6,
    "standard": 0.7,
    "pro":      0.85,
}

# Constants from the actuarial model (README Section 6)
SIGMA = 269.0   # Income volatility (standard deviation of historical weekly losses)
BETA  = 0.2     # Risk sensitivity weight
MARGIN = 10.0   # Platform operational margin (₹)


def calculate_premium(
    risk_probability: float,
    hourly_income: float,
    daily_hours: int,
    plan: str,
) -> dict:
    """
    Computes the weekly premium and related outputs.

    Returns:
    {
        "weekly_premium":      float,   # Final premium in ₹
        "payout_if_triggered": float,   # Max payout the user gets on a valid claim
        "expected_loss":       float,   # Estimated weekly income loss
        "risk_surcharge":      float,   # Extra charge / discount based on risk zone
    }
    """

    # --- Step 1: Look up plan coverage factor ---
    alpha = PLAN_ALPHA.get(plan.lower(), PLAN_ALPHA["standard"])

    # --- Step 2: Compute base weekly income and expected loss ---
    # Gig workers work ~6 days/week
    base_loss = hourly_income * daily_hours * 6
    expected_loss = base_loss * risk_probability

    # --- Step 3: Core premium formula ---
    # P_w = (expected_loss × α) + (σ × β) + M
    core_premium = (expected_loss * alpha) + (SIGMA * BETA) + MARGIN

    # --- Step 4: Risk surcharge / discount ---
    if risk_probability > 0.75:
        risk_surcharge = 15.0   # Critical risk zone — higher buffer
    elif risk_probability > 0.50:
        risk_surcharge = 8.0    # High risk zone
    elif risk_probability < 0.25:
        risk_surcharge = -5.0   # Safe zone — reward low-risk workers
    else:
        risk_surcharge = 0.0    # Medium risk — no adjustment

    # --- Step 5: Final premium ---
    weekly_premium = round(core_premium + risk_surcharge, 2)

    # --- Step 6: Payout calculation ---
    # If a trigger fires, payout = actual loss × coverage factor
    # We estimate max payout as base_loss × alpha (full-week disruption)
    payout_if_triggered = round(base_loss * alpha, 2)

    return {
        "weekly_premium": weekly_premium,
        "payout_if_triggered": payout_if_triggered,
        "expected_loss": round(expected_loss, 2),
        "risk_surcharge": risk_surcharge,
    }
