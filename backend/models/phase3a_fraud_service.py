import math
import joblib
import os
import numpy as np
from dataclasses import dataclass
from typing import Literal

try:
    _MODEL = joblib.load(os.path.join("models", "fraud_model.pkl"))
    _SCALER = joblib.load(os.path.join("models", "fraud_scaler.pkl"))
    _FEATURES = joblib.load(os.path.join("models", "fraud_features.pkl"))
    _MODEL_LOADED = True
except Exception:
    _MODEL_LOADED = False

@dataclass
class ClaimInput:
    worker_id: str = ""
    claim_id: str = ""
    gps_lat: float = 0.0
    gps_lon: float = 0.0
    cell_tower_lat: float = 0.0
    cell_tower_lon: float = 0.0
    gps_cell_distance_km: float = 0.0
    location_change_speed_kmph: float = 0.0
    claimed_rain: float = 0.0
    historical_rain_actual: float = 0.0
    rain_discrepancy: float = 0.0
    claimed_aqi: float = 0.0
    historical_aqi_actual: float = 0.0
    aqi_discrepancy: float = 0.0
    claims_last_30_days: int = 0
    claims_last_7_days: int = 0
    time_between_claims_days: float = 30.0
    claim_hour: int = 12
    days_since_registration: int = 365
    was_active_on_platform: int = 1
    orders_completed_that_day: int = 0
    avg_daily_orders_last_week: float = 5.0
    trigger_type: str = "heavy_rain"
    multiple_triggers_fired: int = 1
    trigger_fired_in_same_area_count: int = 1

@dataclass
class FraudResult:
    claim_id: str
    worker_id: str
    fraud_score: float
    trust_score: int
    decision: Literal["APPROVED", "HOLD", "BLOCKED"]
    hold_minutes: int
    flags: list[str]
    signal_breakdown: dict
    fraud_type_suspected: str
    gps_cell_distance_km: float
    rain_discrepancy: float
    aqi_discrepancy: float

def haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2.0)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2.0)**2
    return R * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def gps_rule_score(claim: ClaimInput) -> tuple[float, list[str], float]:
    score = 0.0
    flags = []
    dist = claim.gps_cell_distance_km
    if dist > 50:
        score += 0.6
        flags.append(f"GPS vs cell tower gap: {dist:.1f} km (expected <5 km)")
    elif dist > 20:
        score += 0.3
        flags.append(f"GPS vs cell tower gap: {dist:.1f} km (moderate suspicion)")
    elif dist > 5:
        score += 0.1
        
    speed = claim.location_change_speed_kmph
    if speed > 200:
        score += 0.4
        flags.append(f"Impossible location speed: {speed:.1f} km/h")
    elif speed > 80:
        score += 0.2
        flags.append(f"Suspicious location speed: {speed:.1f} km/h")
        
    return min(score, 1.0), flags, dist

def weather_rule_score(claim: ClaimInput) -> tuple[float, list[str], float, float]:
    score = 0.0
    flags = []
    rain_disc = claim.rain_discrepancy
    aqi_disc = claim.aqi_discrepancy
    
    if rain_disc > 40:
        score += 0.5
        flags.append(f"Rain discrepancy: claimed {claim.claimed_rain}, actual {claim.historical_rain_actual}")
    elif rain_disc > 20:
        score += 0.25
        
    if aqi_disc > 150:
        score += 0.4
        flags.append(f"AQI discrepancy: claimed {claim.claimed_aqi}, actual {claim.historical_aqi_actual}")
    elif aqi_disc > 80:
        score += 0.2
        
    return min(score, 1.0), flags, rain_disc, aqi_disc

def behaviour_rule_score(claim: ClaimInput) -> tuple[float, list[str]]:
    score = 0.0
    flags = []
    if claim.claims_last_7_days >= 4:
        score += 0.4
    elif claim.claims_last_7_days >= 2:
        score += 0.15
        
    if claim.claims_last_30_days >= 10:
        score += 0.3
        
    if claim.claim_hour in [0, 1, 2, 3, 4]:
        score += 0.2
        
    if claim.days_since_registration < 15:
        score += 0.2
        
    if claim.time_between_claims_days < 2:
        score += 0.2
        
    return min(score, 1.0), flags

def trigger_rule_score(claim: ClaimInput) -> tuple[float, list[str]]:
    score = 0.0
    flags = []
    if claim.multiple_triggers_fired >= 4:
        score += 0.3
        
    if claim.trigger_fired_in_same_area_count >= 10:
        score += 0.3
        
    return min(score, 1.0), flags

def detect_fraud(claim: ClaimInput) -> FraudResult:
    if claim.gps_cell_distance_km == 0.0:
        claim.gps_cell_distance_km = haversine(claim.gps_lat, claim.gps_lon, claim.cell_tower_lat, claim.cell_tower_lon)
    if claim.rain_discrepancy == 0.0:
        claim.rain_discrepancy = abs(claim.claimed_rain - claim.historical_rain_actual)
    if claim.aqi_discrepancy == 0.0:
        claim.aqi_discrepancy = abs(claim.claimed_aqi - claim.historical_aqi_actual)

    gps_score, gps_flags, dist_km = gps_rule_score(claim)
    weather_score, weather_flags, rain_disc, aqi_disc = weather_rule_score(claim)
    behav_score, behav_flags = behaviour_rule_score(claim)
    trigger_score, trigger_flags = trigger_rule_score(claim)
    
    all_flags = gps_flags + weather_flags + behav_flags + trigger_flags
    
    if _MODEL_LOADED:
        feat_dict = {
            "gps_lat": claim.gps_lat, "gps_lon": claim.gps_lon,
            "cell_tower_lat": claim.cell_tower_lat, "cell_tower_lon": claim.cell_tower_lon,
            "gps_cell_distance_km": claim.gps_cell_distance_km,
            "location_change_speed_kmph": claim.location_change_speed_kmph,
            "claimed_rain": claim.claimed_rain, "historical_rain_actual": claim.historical_rain_actual,
            "rain_discrepancy": claim.rain_discrepancy,
            "claimed_aqi": claim.claimed_aqi, "historical_aqi_actual": claim.historical_aqi_actual,
            "aqi_discrepancy": claim.aqi_discrepancy,
            "claims_last_30_days": claim.claims_last_30_days, "claims_last_7_days": claim.claims_last_7_days,
            "time_between_claims_days": claim.time_between_claims_days, "claim_hour": claim.claim_hour,
            "days_since_registration": claim.days_since_registration, "was_active_on_platform": claim.was_active_on_platform,
            "orders_completed_that_day": claim.orders_completed_that_day, "avg_daily_orders_last_week": claim.avg_daily_orders_last_week,
            "multiple_triggers_fired": claim.multiple_triggers_fired,
            "trigger_fired_in_same_area_count": claim.trigger_fired_in_same_area_count
        }
        for t in ["heavy_rain", "flood_zone", "curfew", "high_aqi", "cyclone_warning"]:
            feat_dict[f"trigger_{t}"] = 1 if claim.trigger_type == t else 0
            
        feat_vector = np.array([[feat_dict.get(f, 0) for f in _FEATURES]])
        feat_scaled = _SCALER.transform(feat_vector)
        ml_score = float(_MODEL.predict_proba(feat_scaled)[0, 1])
    else:
        ml_score = gps_score * 0.35 + weather_score * 0.35 + behav_score * 0.2 + trigger_score * 0.1
        
    rule_score = gps_score * 0.35 + weather_score * 0.35 + behav_score * 0.2 + trigger_score * 0.1
    fraud_score = ml_score * 0.65 + rule_score * 0.35
    
    trust_score = max(0, min(100, int((1 - fraud_score) * 100)))
    
    if trust_score >= 70:
        decision = "APPROVED"
        hold_minutes = 0
    elif trust_score >= 40:
        decision = "HOLD"
        hold_minutes = 15
    else:
        decision = "BLOCKED"
        hold_minutes = 0
        
    if dist_km > 20:
        fraud_type_suspected = "GPS_SPOOFING"
    elif rain_disc > 30 or aqi_disc > 100:
        fraud_type_suspected = "FAKE_WEATHER"
    elif claim.claims_last_7_days >= 4:
        fraud_type_suspected = "REPEAT_FRAUD"
    else:
        fraud_type_suspected = "CLEAN"
        
    return FraudResult(
        claim_id=claim.claim_id,
        worker_id=claim.worker_id,
        fraud_score=fraud_score,
        trust_score=trust_score,
        decision=decision,
        hold_minutes=hold_minutes,
        flags=all_flags,
        signal_breakdown={
            "location": gps_score, "weather": weather_score, 
            "behaviour": behav_score, "trigger": trigger_score, "ml_score": ml_score
        },
        fraud_type_suspected=fraud_type_suspected,
        gps_cell_distance_km=dist_km,
        rain_discrepancy=rain_disc,
        aqi_discrepancy=aqi_disc
    )
