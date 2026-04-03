"""
risk_model.py — Mock risk assessment model.

This file will be replaced by a trained ML model (sklearn/joblib) later.
For now it uses rule-based scoring that mimics what a model would output.

Input:  feature_vector = [rain, temp, aqi, demand_drop, curfew, hourly_income, daily_hours]
Output: {
    risk_probability: float (0.0 – 1.0),
    risk_level:       str   ("low" | "medium" | "high" | "critical"),
    contributing_factors: list[str]
}
"""


def assess_risk(feature_vector: list) -> dict:
    """
    Rule-based risk scoring.

    Scoring rules (additive):
      Base score           = 0.10
      rain > 50mm          → +0.25   (severe flooding / waterlogging)
      rain 20–50mm         → +0.15   (heavy rain, reduced orders)
      aqi  > 200           → +0.20   (hazardous air, unsafe to work)
      aqi  100–200         → +0.10   (poor air, some risk)
      curfew == 1          → +0.25   (movement restricted, no deliveries)
      demand_drop > 50%    → +0.15   (major order volume crash)
      demand_drop 25–50%   → +0.08   (moderate demand dip)
      temp > 42°C          → +0.05   (extreme heat advisory)

    Risk levels:
      < 0.30  → low
      0.30–0.50 → medium
      0.50–0.75 → high
      > 0.75  → critical
    """

    # Unpack feature vector
    rain, temp, aqi, demand_drop, curfew, hourly_income, daily_hours = feature_vector

    score = 0.10  # base risk — every worker has some residual exposure
    factors = []

    # --- Rain assessment ---
    if rain > 50:
        score += 0.25
        factors.append(f"Severe rainfall ({rain}mm/hr)")
    elif rain > 20:
        score += 0.15
        factors.append(f"Heavy rainfall ({rain}mm/hr)")

    # --- Air quality assessment ---
    if aqi > 200:
        score += 0.20
        factors.append(f"Hazardous air quality (AQI {aqi})")
    elif aqi > 100:
        score += 0.10
        factors.append(f"Poor air quality (AQI {aqi})")

    # --- Curfew / shutdown ---
    if curfew == 1:
        score += 0.25
        factors.append("Active curfew or shutdown detected")

    # --- Demand drop ---
    if demand_drop > 50:
        score += 0.15
        factors.append(f"Major demand drop ({demand_drop}%)")
    elif demand_drop > 25:
        score += 0.08
        factors.append(f"Moderate demand drop ({demand_drop}%)")

    # --- Extreme heat ---
    if temp > 42:
        score += 0.05
        factors.append(f"Extreme heat ({temp}°C)")

    # Clamp score to [0.0, 1.0]
    score = round(max(0.0, min(1.0, score)), 4)

    # Determine risk level
    if score >= 0.75:
        level = "critical"
    elif score >= 0.50:
        level = "high"
    elif score >= 0.30:
        level = "medium"
    else:
        level = "low"

    # If no specific factor triggered, note that conditions are normal
    if not factors:
        factors.append("No significant disruption detected")

    return {
        "risk_probability": score,
        "risk_level": level,
        "contributing_factors": factors,
    }
