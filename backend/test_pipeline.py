"""
test_pipeline.py — End-to-end integration test for the full SurakshaPay Phase 2 pipeline.

Run this script while the FastAPI server is running:
    uvicorn main:app --reload  (in one terminal)
    python test_pipeline.py    (in another terminal)

Tests covered:
  1. POST /api/register           — User registration with city + location
  2. GET  /api/user/{id}          — Fetch user record
  3. POST /api/assess             — Full pipeline (city-only path)
  4. POST /api/assess             — Full pipeline (lat/lon coords path)
  5. POST /api/assess/from_user   — Zero-touch pipeline from stored DB location
  6. GET  /api/assess/signals     — Raw signals debug endpoint
  7. POST /api/claims/file        — Manually file a claim
  8. GET  /api/claims/{user_id}   — List claims with summary stats
  9. PATCH /api/claims/{id}/status — Admin status update
 10. GET  /api/policies/{user_id} — Fetch active policy
 11. PATCH /api/policies/{id}/upgrade — Plan upgrade
 12. DELETE /api/policies/{id}   — Cancel policy
 13. GET  /api/dashboard/{id}    — Aggregated dashboard payload
"""

import requests
import json
import sys

BASE = "http://localhost:8000"

# ANSI colour helpers for readable test output
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

pass_count = 0
fail_count = 0


def section(title: str):
    print(f"\n{CYAN}{BOLD}{'='*60}{RESET}")
    print(f"{CYAN}{BOLD}  {title}{RESET}")
    print(f"{CYAN}{'='*60}{RESET}")


def check(name: str, resp, expected_status: int = 200, key_checks: dict = None):
    """Print a test result row; count pass/fail globally."""
    global pass_count, fail_count

    status_ok   = resp.status_code == expected_status
    body        = {}
    body_ok     = True
    missing_keys = []

    try:
        body = resp.json()
    except Exception:
        pass

    if key_checks and status_ok:
        for key, expected_val in key_checks.items():
            actual = body
            for part in key.split("."):
                if isinstance(actual, dict):
                    actual = actual.get(part)
                else:
                    actual = None
                    break
            if expected_val is not None and actual != expected_val:
                body_ok = False
                missing_keys.append(f"{key}={actual!r} (expected {expected_val!r})")

    ok = status_ok and body_ok
    icon = f"{GREEN}✓ PASS{RESET}" if ok else f"{RED}✗ FAIL{RESET}"
    print(f"  {icon}  [{resp.status_code}]  {name}")

    if not status_ok:
        print(f"         {RED}Expected HTTP {expected_status}, got {resp.status_code}{RESET}")
        try:
            print(f"         {RED}Body: {json.dumps(body, indent=2)[:300]}{RESET}")
        except Exception:
            pass
    if missing_keys:
        for mk in missing_keys:
            print(f"         {YELLOW}Key mismatch: {mk}{RESET}")

    if ok:
        pass_count += 1
    else:
        fail_count += 1

    return body


# ===========================================================================
# 1. Register a test user
# ===========================================================================
section("1. User Registration")

reg_payload = {
    "fullName":      "Ravi Kumar",
    "phone":         "9876543210",
    "workHours":     8,
    "dailyEarnings": 800.0,
    "selectedPlan":  "standard",
    "city":          "Bangalore",
    "latitude":      12.9716,
    "longitude":     77.5946,
}

r = requests.post(f"{BASE}/api/register", json=reg_payload)
reg = check("POST /api/register — with city + lat/lon", r, 200)
USER_ID = reg.get("user_id", 1)
print(f"         {YELLOW}→ user_id = {USER_ID}{RESET}")


# ===========================================================================
# 2. Fetch user record
# ===========================================================================
section("2. Fetch User Record")

r = requests.get(f"{BASE}/api/user/{USER_ID}")
user_data = check("GET /api/user/{id} — basic fetch", r, 200)
check("GET /api/user/9999 — non-existent user", requests.get(f"{BASE}/api/user/9999"), 404)


# ===========================================================================
# 3. Assessment — city-only path
# ===========================================================================
section("3. Assessment Pipeline — City String")

assess_city = {
    "user_id":      USER_ID,
    "city":         "Bangalore",
    "hourly_income": 100.0,
    "daily_hours":  8,
    "plan":         "standard",
}

r = requests.post(f"{BASE}/api/assess", json=assess_city)
assess_data = check("POST /api/assess — city='Bangalore'", r, 200)

if r.status_code == 200:
    d = r.json()
    fv = d.get("feature_vector", [])
    print(f"\n  {BOLD}Feature Vector:{RESET} {fv}")
    print(f"  {BOLD}[rain, temp, aqi, demand_drop, curfew, hourly_income, daily_hours]{RESET}")

    risk = d.get("risk", {})
    print(f"\n  {BOLD}Risk:{RESET}  probability={risk.get('risk_probability')}  "
          f"level={risk.get('risk_level', '').upper()}")
    for f in risk.get("contributing_factors", []):
        print(f"          • {f}")

    prem = d.get("premium", {})
    print(f"\n  {BOLD}Premium:{RESET} ₹{prem.get('weekly_premium')} /week  "
          f"| payout=₹{prem.get('payout_if_triggered')}  "
          f"| surcharge=₹{prem.get('risk_surcharge')}")

    triggers = d.get("triggers_fired", [])
    if triggers:
        print(f"\n  {YELLOW}{BOLD}Auto-fired triggers ({len(triggers)}):{RESET}")
        for t in triggers:
            print(f"    → [{t['trigger_type']}] claim_id={t.get('claim_id')} — {t['description']}")
    else:
        print(f"\n  No triggers fired (all signals below thresholds)")


# ===========================================================================
# 4. Assessment — lat/lon coordinates path
# ===========================================================================
section("4. Assessment Pipeline — GPS Coordinates")

assess_coords = {
    "user_id":      USER_ID,
    "city":         "",            # intentionally blank — will be resolved via geocode
    "hourly_income": 120.0,
    "daily_hours":  9,
    "plan":         "pro",
    "latitude":     12.9716,
    "longitude":    77.5946,
}

r = requests.post(f"{BASE}/api/assess", json=assess_coords)
check("POST /api/assess — lat=12.9716, lon=77.5946 (Bangalore)", r, 200)
if r.status_code == 200:
    print(f"         {YELLOW}→ resolved_city = {r.json().get('city')}{RESET}")
    print(f"         → source.weather = {r.json().get('sources', {}).get('weather')}")


# ===========================================================================
# 5. Zero-touch assessment from stored user location
# ===========================================================================
section("5. Zero-Touch Assessment — from_user")

r = requests.post(f"{BASE}/api/assess/from_user/{USER_ID}")
check(f"POST /api/assess/from_user/{USER_ID} — uses stored location", r, 200)

r_404 = requests.post(f"{BASE}/api/assess/from_user/9999")
check("POST /api/assess/from_user/9999 — non-existent user", r_404, 404)


# ===========================================================================
# 6. Raw signals debug endpoint
# ===========================================================================
section("6. Raw Signals Debug Endpoint")

r = requests.get(f"{BASE}/api/assess/signals?city=Chennai&hourly_income=90&daily_hours=7")
check("GET /api/assess/signals?city=Chennai", r, 200)

r = requests.get(f"{BASE}/api/assess/signals?lat=13.0827&lon=80.2707&hourly_income=90&daily_hours=7")
check("GET /api/assess/signals?lat=13.0827&lon=80.2707 (Chennai coords)", r, 200)


# ===========================================================================
# 7. Manual claim filing
# ===========================================================================
section("7. Manual Claim Filing")

claim_payload = {
    "user_id":      USER_ID,
    "trigger_type": "manual_heavy_rain",
    "description":  "Road flooded, could not complete deliveries for 4 hours",
}

r = requests.post(f"{BASE}/api/claims/file", json=claim_payload)
claim_data = check("POST /api/claims/file — manual claim", r, 200)
CLAIM_ID   = claim_data.get("claim_id", 1)
print(f"         {YELLOW}→ claim_id = {CLAIM_ID}  status='pending'{RESET}")

# Test filing for non-existent user
r = requests.post(f"{BASE}/api/claims/file", json={"user_id": 9999, "trigger_type": "x", "description": "y"})
check("POST /api/claims/file — non-existent user", r, 404)


# ===========================================================================
# 8. List claims with summary
# ===========================================================================
section("8. List Claims + Summary Stats")

r = requests.get(f"{BASE}/api/claims/{USER_ID}")
claims_data = check(f"GET /api/claims/{USER_ID} — list all claims", r, 200)

if r.status_code == 200:
    body = r.json()
    s    = body.get("summary", {})
    print(f"         total={s.get('total')}  auto_approved={s.get('auto_approved')}  "
          f"pending={s.get('pending')}  payout=₹{s.get('total_payout_disbursed')}")


# ===========================================================================
# 9. Admin: update claim status
# ===========================================================================
section("9. Admin Claim Status Update")

r = requests.patch(f"{BASE}/api/claims/{CLAIM_ID}/status", json={"status": "approved"})
check(f"PATCH /api/claims/{CLAIM_ID}/status → 'approved'", r, 200)

r = requests.patch(f"{BASE}/api/claims/{CLAIM_ID}/status", json={"status": "rejected"})
check(f"PATCH /api/claims/{CLAIM_ID}/status → 'rejected'", r, 200)

r = requests.patch(f"{BASE}/api/claims/{CLAIM_ID}/status", json={"status": "invalid_status"})
check("PATCH status → invalid value (expect 400)", r, 400)


# ===========================================================================
# 10. Fetch active policy
# ===========================================================================
section("10. Fetch Active Policy")

r = requests.get(f"{BASE}/api/policies/{USER_ID}")
policy_data = check(f"GET /api/policies/{USER_ID} — active policy", r, 200)
if r.status_code == 200:
    p = r.json().get("policy", {})
    print(f"         plan={p.get('plan_name')}  coverage={p.get('coverage_percentage')}  "
          f"premium=₹{p.get('weekly_premium')}  payout=₹{p.get('max_weekly_payout')}")


# ===========================================================================
# 11. Plan upgrade
# ===========================================================================
section("11. Plan Upgrade")

r = requests.patch(f"{BASE}/api/policies/{USER_ID}/upgrade", json={"new_plan": "pro"})
upgrade_data = check(f"PATCH /api/policies/{USER_ID}/upgrade → 'pro'", r, 200)
if r.status_code == 200:
    print(f"         {YELLOW}→ {upgrade_data.get('old_plan')} → {upgrade_data.get('new_plan')}  "
          f"new_premium=₹{upgrade_data.get('new_weekly_premium')}{RESET}")

r = requests.patch(f"{BASE}/api/policies/{USER_ID}/upgrade", json={"new_plan": "diamond"})
check("PATCH upgrade → invalid plan (expect 400)", r, 400)


# ===========================================================================
# 12. Cancel policy
# ===========================================================================
section("12. Policy Cancellation")

# Register a second throw-away user to cancel without breaking test user's policy
r2 = requests.post(f"{BASE}/api/register", json={
    "fullName":      "Test Cancel",
    "phone":         "0000000000",
    "workHours":     6,
    "dailyEarnings": 500.0,
    "selectedPlan":  "basic",
})
tmp_id = r2.json().get("user_id", 99)

r = requests.delete(f"{BASE}/api/policies/{tmp_id}")
check(f"DELETE /api/policies/{tmp_id} — cancel policy", r, 200)

r = requests.delete(f"{BASE}/api/policies/{tmp_id}")
check(f"DELETE /api/policies/{tmp_id} — already cancelled (expect 404)", r, 404)


# ===========================================================================
# 13. Dashboard aggregation endpoint
# ===========================================================================
section("13. Dashboard Aggregation")

r = requests.get(f"{BASE}/api/dashboard/{USER_ID}")
dash = check(f"GET /api/dashboard/{USER_ID} — full aggregated view", r, 200)

if r.status_code == 200:
    body = r.json()
    u    = body.get("user", {})
    p    = body.get("policy") or {}
    cs   = body.get("claims_summary", {})
    rc   = body.get("recent_claims", [])
    print(f"         user={u.get('full_name')}  city={u.get('city')}")
    print(f"         policy={p.get('plan_name')}  premium=₹{p.get('weekly_premium')}")
    print(f"         claims: total={cs.get('total')}  auto_approved={cs.get('auto_approved')}  "
          f"payout=₹{cs.get('total_payout')}")
    print(f"         recent_claims_shown={len(rc)}")


# ===========================================================================
# Final summary
# ===========================================================================
section("FINAL RESULTS")
total = pass_count + fail_count
print(f"\n  Total:  {total}")
print(f"  {GREEN}{BOLD}Passed: {pass_count}{RESET}")
if fail_count:
    print(f"  {RED}{BOLD}Failed: {fail_count}{RESET}")
    print(f"\n  {RED}Some tests failed — check output above for details.{RESET}")
else:
    print(f"  {GREEN}{BOLD}All {total} tests passed! Pipeline fully operational.{RESET}")
print()

sys.exit(0 if fail_count == 0 else 1)
