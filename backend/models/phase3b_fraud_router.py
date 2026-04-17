from fastapi import APIRouter
from pydantic import BaseModel
import uuid
import time
from typing import Literal, List, Dict
from phase3a_fraud_service import ClaimInput, FraudResult, detect_fraud

router = APIRouter()

class ClaimRequest(BaseModel):
    worker_id: str
    gps_lat: float
    gps_lon: float
    cell_tower_lat: float
    cell_tower_lon: float
    location_change_speed_kmph: float = 0.0
    claimed_rain: float = 0.0
    historical_rain_actual: float = 0.0
    claimed_aqi: float = 0.0
    historical_aqi_actual: float = 0.0
    claims_last_30_days: int = 0
    claims_last_7_days: int = 0
    time_between_claims_days: float = 0.0
    claim_hour: int = 0
    days_since_registration: int = 0
    was_active_on_platform: int = 0
    orders_completed_that_day: int = 0
    avg_daily_orders_last_week: float = 0.0
    trigger_type: str = ""
    multiple_triggers_fired: int = 0
    trigger_fired_in_same_area_count: int = 0

class FraudResponse(BaseModel):
    claim_id: str
    worker_id: str
    fraud_score: float
    trust_score: int
    decision: Literal["APPROVED", "HOLD", "BLOCKED"]
    hold_minutes: int
    flags: List[str]
    signal_breakdown: Dict[str, float]
    fraud_type_suspected: str
    gps_cell_distance_km: float
    rain_discrepancy: float
    aqi_discrepancy: float
    timestamp: float

@router.post("/check", response_model=FraudResponse)
def check_fraud(req: ClaimRequest):
    claim_id = str(uuid.uuid4())
    inp = ClaimInput(
        worker_id=req.worker_id, claim_id=claim_id, gps_lat=req.gps_lat, gps_lon=req.gps_lon,
        cell_tower_lat=req.cell_tower_lat, cell_tower_lon=req.cell_tower_lon,
        location_change_speed_kmph=req.location_change_speed_kmph, claimed_rain=req.claimed_rain,
        historical_rain_actual=req.historical_rain_actual, claimed_aqi=req.claimed_aqi,
        historical_aqi_actual=req.historical_aqi_actual, claims_last_30_days=req.claims_last_30_days,
        claims_last_7_days=req.claims_last_7_days, time_between_claims_days=req.time_between_claims_days,
        claim_hour=req.claim_hour, days_since_registration=req.days_since_registration,
        was_active_on_platform=req.was_active_on_platform, orders_completed_that_day=req.orders_completed_that_day,
        avg_daily_orders_last_week=req.avg_daily_orders_last_week, trigger_type=req.trigger_type,
        multiple_triggers_fired=req.multiple_triggers_fired, trigger_fired_in_same_area_count=req.trigger_fired_in_same_area_count
    )
    res = detect_fraud(inp)
    return FraudResponse(**res.__dict__, timestamp=time.time())

@router.get("/flagged")
def get_flagged(limit: int = 50):
    return [
        {
            "fraud_score": 0.87, "trust_score": 13, "decision": "BLOCKED",
            "fraud_type_suspected": "GPS_SPOOFING",
            "flags": ["GPS vs cell tower gap: 180 km (expected <5 km)", "Impossible location speed: 215 km/h"]
        },
        {
            "fraud_score": 0.79, "trust_score": 21, "decision": "BLOCKED",
            "fraud_type_suspected": "FAKE_WEATHER",
            "flags": ["Rain discrepancy: claimed 62.0, actual 0.5", "AQI discrepancy: claimed 320.0, actual 72.0"]
        },
        {
            "fraud_score": 0.71, "trust_score": 29, "decision": "BLOCKED",
            "fraud_type_suspected": "REPEAT_FRAUD",
            "flags": ["High claim frequency", "Excessive monthly claims"]
        }
    ]

class DemoRequest(BaseModel):
    scenario: Literal["genuine", "fraud_gps", "fraud_weather", "fraud_repeat"]

@router.post("/demo")
def demo_scenario(req: DemoRequest):
    if req.scenario == "genuine":
        inp = ClaimInput(
            worker_id="W_DEMO_GENUINE", claim_id=str(uuid.uuid4()),
            gps_lat=16.5062, gps_lon=80.6480, cell_tower_lat=16.5065, cell_tower_lon=80.6483,
            location_change_speed_kmph=8.0, claimed_rain=45.0, historical_rain_actual=47.0,
            claimed_aqi=210.0, historical_aqi_actual=208.0, claims_last_30_days=1, claims_last_7_days=0,
            time_between_claims_days=22.0, claim_hour=14, days_since_registration=210,
            was_active_on_platform=1, orders_completed_that_day=0, avg_daily_orders_last_week=7.2,
            trigger_type="heavy_rain", multiple_triggers_fired=1, trigger_fired_in_same_area_count=4
        )
    elif req.scenario == "fraud_gps":
        inp = ClaimInput(
            worker_id="W_DEMO_FRAUD_GPS", claim_id=str(uuid.uuid4()),
            gps_lat=16.5062, gps_lon=80.6480, cell_tower_lat=17.3850, cell_tower_lon=78.4867,
            location_change_speed_kmph=215.0, claimed_rain=55.0, historical_rain_actual=0.0,
            claimed_aqi=280.0, historical_aqi_actual=65.0, claims_last_30_days=9, claims_last_7_days=4,
            time_between_claims_days=1.8, claim_hour=3, days_since_registration=12,
            was_active_on_platform=0, orders_completed_that_day=0, avg_daily_orders_last_week=1.2,
            trigger_type="flood_zone", multiple_triggers_fired=4, trigger_fired_in_same_area_count=1
        )
    elif req.scenario == "fraud_weather":
        inp = ClaimInput(
            worker_id="W_DEMO_FRAUD_WX", claim_id=str(uuid.uuid4()),
            gps_lat=17.6868, gps_lon=83.2185, cell_tower_lat=17.6870, cell_tower_lon=83.2188,
            location_change_speed_kmph=5.0, claimed_rain=62.0, historical_rain_actual=0.5,
            claimed_aqi=320.0, historical_aqi_actual=72.0, claims_last_30_days=5, claims_last_7_days=2,
            time_between_claims_days=5.0, claim_hour=10, days_since_registration=45,
            was_active_on_platform=1, orders_completed_that_day=1, avg_daily_orders_last_week=4.5,
            trigger_type="heavy_rain", multiple_triggers_fired=1, trigger_fired_in_same_area_count=1
        )
    else:
        inp = ClaimInput(
            worker_id="W_DEMO_REPEAT", claim_id=str(uuid.uuid4()),
            gps_lat=16.3067, gps_lon=80.4365, cell_tower_lat=16.3070, cell_tower_lon=80.4368,
            location_change_speed_kmph=11.0, claimed_rain=38.0, historical_rain_actual=35.0,
             claimed_aqi=165.0, historical_aqi_actual=158.0, claims_last_30_days=14, claims_last_7_days=6,
            time_between_claims_days=1.1, claim_hour=19, days_since_registration=88,
            was_active_on_platform=0, orders_completed_that_day=0, avg_daily_orders_last_week=2.1,
            trigger_type="heavy_rain", multiple_triggers_fired=2, trigger_fired_in_same_area_count=12
        )
    return detect_fraud(inp)

@router.get("/stats")
def get_stats():
    return {
        "total_claims_today": 47, "fraud_blocked_today": 6, "fraud_held_today": 9,
        "genuine_approved_today": 32, "fraud_rate_today": 0.128, "fraud_rate_7d": 0.094,
        "total_saved_inr": 18400, "model_accuracy": 0.967
    }
