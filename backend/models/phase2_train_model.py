import pandas as pd
import numpy as np
import joblib
import os
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score, f1_score, classification_report, confusion_matrix

def train_model():
    df = pd.read_csv("fraud_training_data.csv")
    
    triggers = ["heavy_rain", "flood_zone", "curfew", "high_aqi", "cyclone_warning"]
    for t in triggers:
        df[f"trigger_{t}"] = (df["trigger_type"] == t).astype(int)
        
    FEATURE_COLS = [
        "gps_lat", "gps_lon", "cell_tower_lat", "cell_tower_lon", 
        "gps_cell_distance_km", "location_change_speed_kmph",
        "claimed_rain", "historical_rain_actual", "rain_discrepancy",
        "claimed_aqi", "historical_aqi_actual", "aqi_discrepancy",
        "claims_last_30_days", "claims_last_7_days", "time_between_claims_days",
        "claim_hour", "days_since_registration",
        "was_active_on_platform", "orders_completed_that_day", "avg_daily_orders_last_week",
        "multiple_triggers_fired", "trigger_fired_in_same_area_count"
    ] + [f"trigger_{t}" for t in triggers]
    
    X = df[FEATURE_COLS]
    y = df["is_fraud"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    model = RandomForestClassifier(
        n_estimators=200, 
        max_depth=12, 
        min_samples_leaf=4, 
        class_weight="balanced", 
        random_state=42, 
        n_jobs=-1
    )
    
    model.fit(X_train_scaled, y_train)
    
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]
    
    print("ROC-AUC score:", roc_auc_score(y_test, y_prob))
    print("F1 score:", f1_score(y_test, y_pred))
    print("Classification Report:\n", classification_report(y_test, y_pred))
    print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))
    
    cv_scores = cross_val_score(model, scaler.transform(X), y, cv=5, scoring="roc_auc")
    print(f"5-fold CV AUC: {cv_scores.mean():.4f} \u00b1 {cv_scores.std():.4f}")
    
    importances = model.feature_importances_
    indices = np.argsort(importances)[-15:]
    top_features = [FEATURE_COLS[i] for i in indices]
    top_importances = importances[indices]
    
    plt.figure(figsize=(10, 6))
    plt.barh(range(len(indices)), top_importances, color="#6366f1", align="center")
    plt.yticks(range(len(indices)), top_features)
    plt.title("Top 15 Fraud Detection Features (SurakshaPay)")
    plt.xlabel("Importance")
    plt.tight_layout()
    plt.savefig("feature_importance.png", dpi=150)
    plt.close()
    
    os.makedirs("models", exist_ok=True)
    joblib.dump(model, "models/fraud_model.pkl")
    joblib.dump(scaler, "models/fraud_scaler.pkl")
    joblib.dump(FEATURE_COLS, "models/fraud_features.pkl")

if __name__ == "__main__":
    train_model()
