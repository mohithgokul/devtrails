"""
risk_model.py — ML-Driven Risk Assessment with Rule-Based Fallback

Uses a pre-trained Scikit-Learn RandomForestRegressor and StandardScaler for
precise risk probability prediction. Falls back to rule-based scoring if
ML artifacts fail to load, ensuring 100% uptime.

Input:  feature_vector = [rain, temp, aqi, demand_drop, curfew, hourly_income, daily_hours]
Output: { risk_probability, risk_level, contributing_factors }
"""

import os
import json
import numpy as np
import joblib

FEATURE_NAMES = ["rain", "temp", "aqi", "demand_drop", "curfew", "hourly_income", "daily_hours"]

# Formatting for human-readable features
FEATURE_FORMATTING = {
    "rain": ("Rainfall", "mm/hr"),
    "temp": ("Temperature", "°C"),
    "aqi": ("AQI", ""),
    "demand_drop": ("Demand drop", "%"),
    "curfew": ("Curfew", ""),
    "hourly_income": ("Hourly income", "₹"),
    "daily_hours": ("Daily hours", "h"),
}

# Global variables to hold model state
_model = None
_scaler = None
_metadata = None
_is_fallback = False

def _load_model_artifacts():
    """Load model, scaler, and metadata on module start. If any fail, fallback is used."""
    global _model, _scaler, _metadata, _is_fallback
    
    model_dir = os.path.join(os.path.dirname(__file__), "models")
    metadata_path = os.path.join(model_dir, "model_metadata.json")
    scaler_path = os.path.join(model_dir, "risk_scaler.joblib")
    
    try:
        with open(metadata_path, 'r') as f:
            _metadata = json.load(f)
            
        model_type = _metadata.get("model_type")
        if model_type == "RandomForest":
            model_filename = "risk_model_rf.joblib"
        else:
            model_filename = "risk_model_xgb.joblib"
            
        model_path = os.path.join(model_dir, model_filename)
        
        _model = joblib.load(model_path)
        _scaler = joblib.load(scaler_path)
        _is_fallback = False
    except Exception as e:
        print(f"WARNING: Failed to load ML model artifacts ({e}). Falling back to rule-based logic.")
        _is_fallback = True

# Call it upon import
_load_model_artifacts()


def get_risk_level(prob: float) -> str:
    """Determine risk level bucket from probability."""
    if prob < 0.30:
        return "low"
    elif prob <= 0.50:
        return "medium"
    elif prob <= 0.75:
        return "high"
    else:
        return "critical"


def _rule_based_fallback(vector: list) -> float:
    """Old rule-based fallback logic to ensure server reliability."""
    rain, temp, aqi, demand_drop, curfew, income, hours = vector
    score = 0.10
    if rain > 50:          score += 0.25
    elif rain > 20:        score += 0.15
    if aqi > 200:          score += 0.20
    elif aqi > 100:        score += 0.10
    if curfew == 1:        score += 0.25
    if demand_drop > 50:   score += 0.15
    elif demand_drop > 25: score += 0.08
    if temp > 42:          score += 0.05
    if rain > 30 and aqi > 150:       score += 0.08
    if temp > 40 and demand_drop > 30: score += 0.05
    return float(np.clip(score, 0.0, 1.0))


def assess_risk(feature_vector: list) -> dict:
    """
    Assess prediction output for a given worker based on environmental and economic signals.
    
    Args:
        feature_vector: list containing exactly 7 features:
            [rain, temp, aqi, demand_drop, curfew, hourly_income, daily_hours]
            
    Returns:
        dict: Exact schema for production FastAPI server matching: 
            risk_probability, risk_level, and contributing_factors.
    """
    if len(feature_vector) != len(FEATURE_NAMES):
        print(f"WARNING: Feature vector length mismatch. Expected {len(FEATURE_NAMES)}.")
        prob = 0.5 # Safe default
        return {
            "risk_probability": prob,
            "risk_level": get_risk_level(prob),
            "contributing_factors": ["Feature vector error - fallback applied"]
        }

    if _is_fallback:
        prob = _rule_based_fallback(feature_vector)
        return {
            "risk_probability": round(prob, 4),
            "risk_level": get_risk_level(prob),
            "contributing_factors": ["Using rule-based fallback model"]
        }
        
    try:
        import pandas as pd
        X = pd.DataFrame([feature_vector], columns=FEATURE_NAMES)
        X_scaled = _scaler.transform(X)
        
        # 2. Predict probability
        raw_prob = float(_model.predict(X_scaled)[0])
        prob = round(float(np.clip(raw_prob, 0.0, 1.0)), 4)
        level = get_risk_level(prob)
        
        # 3. Derive contributing factors dynamically
        importances = getattr(_model, "feature_importances_", None)
        factors = []
        
        if importances is not None:
            # importance * standardized value gives contribution for this sample
            contribution_scores = importances * np.abs(X_scaled[0])
            top_indices = np.argsort(contribution_scores)[::-1]
            
            descriptions = ["major contributor", "secondary contributor", "contributing factor"]
            
            for rank, i in enumerate(top_indices[:3]):
                idx = int(i)
                f_name = FEATURE_NAMES[idx]
                f_val = feature_vector[idx]
                display_name, unit = FEATURE_FORMATTING.get(f_name, (f_name, ""))
                
                if f_name == "rain" and f_val > 40:
                    display_name = "Heavy rainfall"
                    
                if f_name == "curfew":
                    if f_val == 1:
                        factors.append(f"Curfew active — {descriptions[rank]}")
                    continue
                    
                factor_str = f"{display_name} ({f_val}{unit}) — {descriptions[rank]}"
                factors.append(factor_str)
                
            if not factors:
                factors = ["No extreme anomalous signals detected"]
        else:
            factors = ["Model does not expose feature importances"]
            
        return {
            "risk_probability": prob,
            "risk_level": level,
            "contributing_factors": factors
        }
        
    except Exception as e:
        # Silent fallback to ensure uptime
        print(f"WARNING: Exception during ML prediction ({e}). Falling back.")
        prob = _rule_based_fallback(feature_vector)
        return {
            "risk_probability": round(prob, 4),
            "risk_level": get_risk_level(prob),
            "contributing_factors": ["Using rule-based framework (ML failure)"]
        }


def assess_risk_batch(feature_matrix: list[list]) -> list[dict]:
    """Score multiple workers at once. Returns a list of result dicts."""
    return [assess_risk(vector) for vector in feature_matrix]
