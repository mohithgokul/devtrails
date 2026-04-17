import os
import json
import logging
from datetime import datetime
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
import joblib

DATA_PATH = "data/training_data.csv"
MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURE_NAMES = ["rain", "temp", "aqi", "demand_drop", "curfew", "hourly_income", "daily_hours"]

def train_and_evaluate():
    """Load data, train RF and XGB models, compare them, and save the best one."""
    print("Loading data...")
    df = pd.read_csv(DATA_PATH)
    
    X = df[FEATURE_NAMES]
    y = df["risk_probability"]
    
    # 80/20 train/test split, random_state=42
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Fit StandardScaler on train only, transform both
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Initialize models
    rf_model = RandomForestRegressor(
        n_estimators=300, max_depth=12, min_samples_leaf=5, random_state=42
    )
    xgb_model = XGBRegressor(
        n_estimators=400, max_depth=8, learning_rate=0.05, 
        subsample=0.8, colsample_bytree=0.8, random_state=42
    )
    
    models = [
        ("RandomForest", rf_model, "risk_model_rf.joblib"),
        ("XGBoost", xgb_model, "risk_model_xgb.joblib")
    ]
    
    results = []
    
    print("\nTraining models...")
    for name, model, filename in models:
        model.fit(X_train_scaled, y_train)
        preds = model.predict(X_test_scaled)
        
        mae = mean_absolute_error(y_test, preds)
        rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
        r2 = r2_score(y_test, preds)
        
        results.append({
            "name": name,
            "model": model,
            "filename": filename,
            "mae": mae,
            "rmse": rmse,
            "r2": r2
        })
    
    # Print comparison table
    print("\n── Model Comparison ──────────────")
    print(f"{'Model':<15} | {'MAE':<7} | {'RMSE':<7} | {'R²':<7}")
    print("-" * 45)
    for res in results:
        print(f"{res['name']:<15} | {res['mae']:.4f} | {res['rmse']:.4f} | {res['r2']:.4f}")
    
    # Pick winner by lower RMSE
    winner = min(results, key=lambda x: x["rmse"])
    print(f"\nWinning Model: {winner['name']} (RMSE: {winner['rmse']:.4f})")
    
    # Save winner model
    model_path = os.path.join(MODEL_DIR, winner['filename'])
    joblib.dump(winner['model'], model_path)
    print(f"Saved winning model to {model_path}")
    
    # Save scaler
    scaler_path = os.path.join(MODEL_DIR, "risk_scaler.joblib")
    joblib.dump(scaler, scaler_path)
    print(f"Saved scaler to {scaler_path}")
    
    # Save metadata
    metadata = {
        "model_type": winner['name'],
        "feature_names": FEATURE_NAMES,
        "training_date": datetime.now().isoformat(),
        "mae": winner["mae"],
        "rmse": winner["rmse"],
        "r2": winner["r2"],
        "training_samples": len(X_train),
        "test_samples": len(X_test)
    }
    with open(os.path.join(MODEL_DIR, "model_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=4)
        
    # Print feature importances
    importances = winner["model"].feature_importances_
    feat_imps = list(zip(FEATURE_NAMES, importances))
    feat_imps.sort(key=lambda x: x[1], reverse=True)
    
    print("\n── Feature Importances ───────────")
    max_imp = max([imp for name, imp in feat_imps])
    for name, imp in feat_imps:
        bar_len = int((imp / max_imp) * 30)
        bar = "█" * bar_len
        print(f"{name:<15} | {imp:.4f} | {bar}")
    print("\nTraining complete.")

if __name__ == "__main__":
    train_and_evaluate()