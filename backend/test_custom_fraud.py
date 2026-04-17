from models.phase3a_fraud_service import ClaimInput, detect_fraud
import uuid

print("=== RUNNING CUSTOM FRAUD TEST ===\n")

custom_input = ClaimInput(
    worker_id="FAKE_JOHN_DOE_123",
    claim_id=str(uuid.uuid4()),
    gps_lat=12.9716,          # Bangalore center
    gps_lon=77.5946,
    cell_tower_lat=13.0827,   # Chennai center (~346km away)
    cell_tower_lon=80.2707,
    location_change_speed_kmph=300.0,  # Impossible on a bike/delivery vehicle
    claimed_rain=40.0,
    historical_rain_actual=40.0,       # Smart fraudster: exact weather match
    claimed_aqi=150.0,
    historical_aqi_actual=150.0,       # Exactly matched
    claims_last_30_days=1,
    claims_last_7_days=0,
    time_between_claims_days=15.0,
    claim_hour=14,
    days_since_registration=400,
    was_active_on_platform=0,          # Suspicious: wasn't even driving
    orders_completed_that_day=0,
    avg_daily_orders_last_week=0.0,
    trigger_type="heavy_rain",
    multiple_triggers_fired=1,
    trigger_fired_in_same_area_count=2
)

res = detect_fraud(custom_input)

print(f"Worker ID: {res.worker_id}")
print(f"Claim ID: {res.claim_id}")
print(f"Fraud Score: {res.fraud_score:.3f}")
print(f"Trust Score: {res.trust_score} / 100")
print(f"Decision: {res.decision}")
print(f"Fraud Suspected: {res.fraud_type_suspected}")

if res.flags:
    print("Flags Raised:")
    for flag in res.flags:
        print(f"  - {flag}")
else:
    print("Flags Raised: None")

print("\nSignal Breakdown:")
for k, v in res.signal_breakdown.items():
    print(f"  {k}: {v:.2f}")
