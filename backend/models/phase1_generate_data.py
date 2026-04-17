import pandas as pd
import numpy as np
import random
import math

def generate_data():
    np.random.seed(42)
    random.seed(42)
    
    lat_min, lat_max = 15.5, 19.5
    lon_min, lon_max = 77.5, 84.5
    
    def random_lat_lon():
        return random.uniform(lat_min, lat_max), random.uniform(lon_min, lon_max)
    
    def add_distance(lat, lon, km_distance):
        lat_offset = (km_distance / 111.0) * random.uniform(-1, 1)
        lon_offset = (km_distance / (111.0 * math.cos(math.radians(lat)))) * random.uniform(-1, 1)
        return lat + lat_offset, lon + lon_offset

    triggers = ["heavy_rain", "flood_zone", "curfew", "high_aqi", "cyclone_warning"]
    rows = []
    
    for _ in range(700):
        lat, lon = random_lat_lon()
        cell_lat, cell_lon = add_distance(lat, lon, random.uniform(0, 2))
        hist_rain = random.uniform(35, 120)
        claimed_rain = hist_rain + random.uniform(-5, 5)
        hist_aqi = random.uniform(50, 400)
        claimed_aqi = hist_aqi + random.uniform(-10, 10)
        
        rows.append({
            "gps_lat": lat, "gps_lon": lon,
            "cell_tower_lat": cell_lat, "cell_tower_lon": cell_lon,
            "gps_cell_distance_km": random.uniform(0, 2),
            "location_change_speed_kmph": random.uniform(0, 15),
            "claimed_rain": claimed_rain, "historical_rain_actual": hist_rain,
            "rain_discrepancy": abs(claimed_rain - hist_rain),
            "claimed_aqi": claimed_aqi, "historical_aqi_actual": hist_aqi,
            "aqi_discrepancy": abs(claimed_aqi - hist_aqi),
            "claims_last_30_days": random.randint(0, 4), "claims_last_7_days": random.randint(0, 2),
            "time_between_claims_days": random.uniform(8, 30), "claim_hour": random.randint(7, 22),
            "days_since_registration": random.randint(60, 730), "was_active_on_platform": 1,
            "orders_completed_that_day": random.randint(1, 25), "avg_daily_orders_last_week": random.uniform(1, 20),
            "trigger_type": random.choice(triggers), "multiple_triggers_fired": random.randint(1, 2),
            "trigger_fired_in_same_area_count": random.randint(1, 3), "is_fraud": 0
        })
        
    for _ in range(150):
        lat, lon = random_lat_lon()
        dist_km = random.uniform(30, 130)
        cell_lat, cell_lon = add_distance(lat, lon, dist_km)
        hist_rain = random.uniform(0, 15)
        claimed_rain = random.uniform(40, 80)
        hist_aqi = random.uniform(50, 150)
        claimed_aqi = hist_aqi + random.choice([random.uniform(80, 250), -random.uniform(80, 250)])
        
        rows.append({
            "gps_lat": lat, "gps_lon": lon,
            "cell_tower_lat": cell_lat, "cell_tower_lon": cell_lon,
            "gps_cell_distance_km": dist_km,
            "location_change_speed_kmph": random.uniform(80, 250),
            "claimed_rain": claimed_rain, "historical_rain_actual": hist_rain,
            "rain_discrepancy": abs(claimed_rain - hist_rain),
            "claimed_aqi": claimed_aqi, "historical_aqi_actual": hist_aqi,
            "aqi_discrepancy": abs(claimed_aqi - hist_aqi),
            "claims_last_30_days": random.randint(2, 8), "claims_last_7_days": random.randint(2, 5),
            "time_between_claims_days": random.uniform(1, 10), "claim_hour": random.randint(0, 4),
            "days_since_registration": random.randint(1, 30), "was_active_on_platform": 0,
            "orders_completed_that_day": 0, "avg_daily_orders_last_week": random.uniform(0, 2),
            "trigger_type": random.choice(triggers), "multiple_triggers_fired": random.randint(3, 5),
            "trigger_fired_in_same_area_count": random.randint(1, 3), "is_fraud": 1
        })
        
    for _ in range(120):
        lat, lon = random_lat_lon()
        dist_km = random.uniform(0, 0.5)
        cell_lat, cell_lon = add_distance(lat, lon, dist_km)
        hist_rain = random.uniform(0, 8)
        claimed_rain = random.uniform(50, 100)
        hist_aqi = random.uniform(40, 100)
        claimed_aqi = hist_aqi + random.choice([random.uniform(150, 300), -random.uniform(150, 300)])
        
        rows.append({
            "gps_lat": lat, "gps_lon": lon,
            "cell_tower_lat": cell_lat, "cell_tower_lon": cell_lon,
            "gps_cell_distance_km": dist_km,
            "location_change_speed_kmph": random.uniform(0, 20),
            "claimed_rain": claimed_rain, "historical_rain_actual": hist_rain,
            "rain_discrepancy": abs(claimed_rain - hist_rain),
            "claimed_aqi": claimed_aqi, "historical_aqi_actual": hist_aqi,
            "aqi_discrepancy": abs(claimed_aqi - hist_aqi),
            "claims_last_30_days": random.randint(2, 8), "claims_last_7_days": random.randint(1, 4),
            "time_between_claims_days": random.uniform(2, 10), "claim_hour": random.randint(7, 22),
            "days_since_registration": random.randint(10, 90), "was_active_on_platform": 1,
            "orders_completed_that_day": random.randint(0, 5), "avg_daily_orders_last_week": random.uniform(1, 10),
            "trigger_type": random.choice(triggers), "multiple_triggers_fired": random.randint(1, 2),
            "trigger_fired_in_same_area_count": random.randint(1, 5), "is_fraud": 1
        })
        
    for _ in range(80):
        lat, lon = random_lat_lon()
        cell_lat, cell_lon = add_distance(lat, lon, random.uniform(0, 2))
        hist_rain = random.uniform(35, 120)
        claimed_rain = hist_rain + random.uniform(-2, 2)
        hist_aqi = random.uniform(50, 400)
        claimed_aqi = hist_aqi + random.uniform(-5, 5)
        
        rows.append({
            "gps_lat": lat, "gps_lon": lon,
            "cell_tower_lat": cell_lat, "cell_tower_lon": cell_lon,
            "gps_cell_distance_km": random.uniform(0, 2),
            "location_change_speed_kmph": random.uniform(0, 30),
            "claimed_rain": claimed_rain, "historical_rain_actual": hist_rain,
            "rain_discrepancy": abs(claimed_rain - hist_rain),
            "claimed_aqi": claimed_aqi, "historical_aqi_actual": hist_aqi,
            "aqi_discrepancy": abs(claimed_aqi - hist_aqi),
            "claims_last_30_days": random.randint(8, 20), "claims_last_7_days": random.randint(4, 7),
            "time_between_claims_days": random.uniform(0.5, 3), "claim_hour": random.randint(0, 23),
            "days_since_registration": random.randint(60, 730), "was_active_on_platform": random.choice([0, 1]),
            "orders_completed_that_day": random.randint(0, 10), "avg_daily_orders_last_week": random.uniform(0, 10),
            "trigger_type": random.choice(triggers), "multiple_triggers_fired": random.randint(1, 3),
            "trigger_fired_in_same_area_count": random.randint(5, 20), "is_fraud": 1
        })
        
    df = pd.DataFrame(rows)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    df.to_csv("fraud_training_data.csv", index=False)
    
    print(f"Dataset generated! Summary:")
    print(f"Total Rows: {len(df)}")
    print(f"Genuine Rows: {len(df[df['is_fraud']==0])}")
    print(f"Fraud Rows: {len(df[df['is_fraud']==1])}")
    print(f"Fraud Rate: {len(df[df['is_fraud']==1]) / len(df):.2%}")

if __name__ == "__main__":
    generate_data()
