"""
trigger_engine.py — Automated parametric trigger evaluation.

Parametric insurance means payouts fire automatically when observable
real-world conditions cross predefined thresholds — no manual claim
investigation needed. This module implements that core logic.

The 5 trigger conditions (defined in SurakshaPay actuarial spec):
  1. Heavy Rain          → rain > 20mm/hr       → trigger: "heavy_rain"
  2. Hazardous AQI       → aqi > 200             → trigger: "hazardous_aqi"
  3. Curfew Active       → curfew == 1           → trigger: "curfew_shutdown"
  4. Major Demand Drop   → demand_drop > 50%     → trigger: "demand_crash"
  5. Critical Risk Score → risk_probability > 0.75 → trigger: "critical_risk_composite"

When a trigger fires:
  - A claim row is auto-inserted into the claims table with status='auto_approved'
  - The claim carries the full signal snapshot for audit purposes
  - Duplicate suppression prevents re-filing the same trigger within 1 hour
"""

import os
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/surakshapay")

# How long to suppress duplicate triggers for the same user (in hours)
# Prevents a single assessment loop from filing dozens of identical claims
DUPLICATE_WINDOW_HOURS = 1


def _is_duplicate_trigger(cursor, user_id: int, trigger_type: str) -> bool:
    """
    Checks if this exact trigger_type has already been auto-filed for this
    user within the DUPLICATE_WINDOW_HOURS window.

    Why: If someone calls /api/assess/from_user/{id} every 5 minutes,
    without this guard each call would create a new auto_approved claim
    even though the underlying conditions haven't changed.

    Returns True if a duplicate exists (suppress), False if safe to file.
    """
    window_start = (datetime.utcnow() - timedelta(hours=DUPLICATE_WINDOW_HOURS)).isoformat()
    cursor.execute(
        '''
        SELECT id FROM claims
        WHERE user_id = %s
          AND trigger_type = %s
          AND status = 'auto_approved'
          AND created_at >= %s
        LIMIT 1
        ''',
        (user_id, trigger_type, window_start),
    )
    return cursor.fetchone() is not None


def evaluate_triggers(
    user_id:      int,
    raw_signals:  dict,
    risk:         dict,
    payout_amount: float,
) -> list:
    """
    Evaluates all 5 parametric trigger conditions against live signal data
    and auto-files claims for any that fire.

    Args:
        user_id:       Registered user's DB id
        raw_signals:   Signal dict {rain, temp, aqi, demand_drop, curfew, ...}
        risk:          Risk dict   {risk_probability, risk_level, ...}
        payout_amount: payout_if_triggered value from the premium model (₹)

    Returns:
        List of fired trigger dicts, each with:
        {
            "trigger_type": str,
            "description":  str,
            "claim_id":     int | None   ← None when suppressed as duplicate
        }
    """
    fired_triggers = []

    # Unpack signal values with safe defaults
    rain             = raw_signals.get("rain",             0)
    aqi              = raw_signals.get("aqi",              0)
    curfew           = raw_signals.get("curfew",           0)
    demand_drop      = raw_signals.get("demand_drop",      0)
    risk_probability = risk.get("risk_probability",        0)
    risk_level       = risk.get("risk_level",          "low")

    # ── Trigger 1: Heavy Rain ─────────────────────────────────────────────────
    # 20mm/hr threshold: consistent with IMD (India Meteorological Department)
    # "heavy rain" classification that grounds two-wheelers in Indian cities
    if rain > 20:
        fired_triggers.append({
            "trigger_type": "heavy_rain",
            "description":  f"Heavy rainfall detected: {rain}mm/hr (threshold: >20mm/hr)",
        })

    # ── Trigger 2: Hazardous AQI ──────────────────────────────────────────────
    # AQI > 200 = "Very Unhealthy" per US EPA / CPCB standards.
    # At this level, Delhi/NCR authorities issue gig-worker activity advisories.
    if aqi > 200:
        fired_triggers.append({
            "trigger_type": "hazardous_aqi",
            "description":  f"Hazardous air quality: AQI {aqi} (threshold: >200)",
        })

    # ── Trigger 3: Curfew/Shutdown Active ────────────────────────────────────
    # Derived from news NLP — if any headline mentions "curfew" or "shutdown"
    # in this city, all deliveries are legally halted.
    if curfew == 1:
        fired_triggers.append({
            "trigger_type": "curfew_shutdown",
            "description":  "Active curfew or civic shutdown detected from news sources",
        })

    # ── Trigger 4: Major Demand Drop ─────────────────────────────────────────
    # >50% demand drop means the worker cannot earn a minimum viable income.
    # Demand score is aggregated across news keyword hits (15% per keyword, max 100%).
    if demand_drop > 50:
        fired_triggers.append({
            "trigger_type": "demand_crash",
            "description":  f"Major platform demand drop: {demand_drop}% (threshold: >50%)",
        })

    # ── Trigger 5: Critical Composite Risk ───────────────────────────────────
    # When the overall risk probability exceeds the critical threshold (0.75),
    # it means multiple disruption signals are simultaneously elevated.
    # This acts as a catch-all for multi-factor extreme conditions.
    if risk_probability > 0.75:
        fired_triggers.append({
            "trigger_type": "critical_risk_composite",
            "description":  f"Critical composite risk score: {risk_probability:.3f} (threshold: >0.75)",
        })

    # ── Auto-file claims for each fired trigger ───────────────────────────────
    if fired_triggers:
        conn   = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        for trigger in fired_triggers:
            trigger_type = trigger["trigger_type"]

            # Duplicate suppression: skip if identical trigger already filed within window
            if _is_duplicate_trigger(cursor, user_id, trigger_type):
                print(
                    f"[trigger] SKIPPED duplicate {trigger_type} for user {user_id} "
                    f"(within {DUPLICATE_WINDOW_HOURS}h window)"
                )
                trigger["claim_id"] = None  # Signal to caller: not filed this time
                continue

            # Insert auto-approved claim with full signal snapshot
            cursor.execute('''
                INSERT INTO claims (
                    user_id, trigger_type, risk_level, risk_probability,
                    rain, aqi, demand_drop, curfew,
                    payout_amount, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'auto_approved') RETURNING id
            ''', (
                user_id,
                trigger_type,
                risk_level,
                risk_probability,
                rain,
                aqi,
                demand_drop,
                curfew,
                payout_amount,
            ))

            trigger["claim_id"] = cursor.fetchone()[0]
            print(
                f"[trigger] AUTO-APPROVED claim #{trigger['claim_id']} "
                f"for user {user_id}: {trigger_type} | payout=₹{payout_amount}"
            )

        conn.commit()
        conn.close()

    return fired_triggers
