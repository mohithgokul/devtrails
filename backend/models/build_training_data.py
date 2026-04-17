"""
build_training_data.py — Fixed version
Uses weather dataset for rain/temp (2023-present)
Uses AQI station files for city-level AQI baseline (2016-2023 average)
No date join needed — avoids the overlap problem
"""

import os
import glob
import pandas as pd
import numpy as np

DATA_DIR  = "data/"
MODEL_DIR = "models/"

os.makedirs(MODEL_DIR, exist_ok=True)

# ── STEP 1: Load weather dataset ──────────────────────────────────────────────
print("Loading weather dataset...")
weather = pd.read_csv(DATA_DIR + "india_weather_repository.csv", low_memory=False)

weather = weather.rename(columns={
    "location_name":       "city",
    "last_updated":        "date",
    "temperature_celsius": "temp",
    "precip_mm":           "rain",
})

weather["city"] = weather["city"].str.strip().str.title()
weather["city"] = weather["city"].replace({
    "Bengaluru":   "Bangalore",
    "New Delhi":   "Delhi",
})

TARGET_CITIES = [
    "Guntur", "Vijayawada", "Visakhapatnam", "Tirupati",
    "Kakinada", "Nellore", "Kurnool", "Rajahmundry",
    "Hyderabad", "Warangal", "Karimnagar", "Nizamabad",
    "Bangalore", "Mysore", "Hubli", "Mangalore",
    "Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli",
    "Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad",
    "Delhi", "Gurgaon", "Noida", "Faridabad",
    "Lucknow", "Kanpur", "Agra", "Varanasi",
    "Kolkata", "Jaipur", "Jodhpur", "Udaipur",
    "Ahmedabad", "Surat", "Vadodara", "Rajkot",
    "Bhopal", "Indore", "Jabalpur", "Gwalior",
    "Chandigarh", "Ludhiana", "Amritsar",
    "Kochi", "Thiruvananthapuram", "Kozhikode",
    "Bhubaneswar", "Patna", "Guwahati",
]

weather = weather[weather["city"].isin(TARGET_CITIES)]
weather["date"] = pd.to_datetime(weather["date"]).dt.date

weather = weather.groupby(["city", "date"]).agg(
    rain=("rain", "max"),
    temp=("temp", "mean")
).reset_index()

print(f"Weather rows: {len(weather)}")
print(f"Cities found: {sorted(weather['city'].unique().tolist())}")


# ── STEP 2: Load ALL station AQI files → compute city-level AQI baseline ──────
print("\nLoading AQI station files...")

all_files = glob.glob(DATA_DIR + "*.csv")
aqi_files = [
    f for f in all_files
    if "india_weather" not in f and "training_data" not in f
]
print(f"Found {len(aqi_files)} station files")

def compute_aqi_from_pm25(pm25):
    if pd.isna(pm25) or pm25 < 0:
        return np.nan
    if pm25 <= 30:   return pm25 * (50/30)
    elif pm25 <= 60: return 50  + (pm25 - 30)  * (50/30)
    elif pm25 <= 90: return 100 + (pm25 - 60)  * (50/30)
    elif pm25 <= 120:return 150 + (pm25 - 90)  * (50/30)
    elif pm25 <= 250:return 200 + (pm25 - 120) * (100/130)
    else:            return min(400 + (pm25 - 250) * (100/130), 500)

# Map state code prefix → representative city
STATE_TO_CITY = {
    "AP": "Guntur",
    "AS": "Guwahati",
    "BR": "Patna",
    "HR": "Gurgaon",
    "JH": "Patna",
    "JK": "Delhi",
    "KA": "Bangalore",
    "KL": "Kochi",
    "MH": "Mumbai",
    "MP": "Bhopal",
    "OR": "Bhubaneswar",
    "PB": "Ludhiana",
    "RJ": "Jaipur",
    "TN": "Chennai",
    "TS": "Hyderabad",
    "UP": "Lucknow",
    "WB": "Kolkata",
    "DL": "Delhi",
    "GJ": "Ahmedabad",
    "TG": "Hyderabad",
}

city_aqi_records = []

for filepath in aqi_files:
    try:
        df = pd.read_csv(filepath, low_memory=False)
        if "PM2.5 (ug/m3)" not in df.columns:
            continue

        df["aqi"] = pd.to_numeric(
            df["PM2.5 (ug/m3)"], errors="coerce"
        ).apply(compute_aqi_from_pm25)

        mean_aqi = df["aqi"].dropna().mean()
        if pd.isna(mean_aqi):
            continue

        # Get state code from filename (e.g. AP001 → AP)
        fname     = os.path.basename(filepath)
        state_code = fname[:2].upper()
        city      = STATE_TO_CITY.get(state_code, None)

        if city:
            city_aqi_records.append({
                "city": city,
                "aqi":  round(mean_aqi, 0)
            })

    except Exception as e:
        print(f"  Skipping {filepath}: {e}")

# Average AQI per city across all its stations
city_aqi_df = pd.DataFrame(city_aqi_records)
city_aqi_baseline = city_aqi_df.groupby("city")["aqi"].mean().round(0).astype(int)
city_aqi_baseline = city_aqi_baseline.to_dict()
print(f"City AQI baselines computed: {city_aqi_baseline}")


# ── STEP 3: AQI offsets for cities not in station files ──────────────────────
# These are relative adjustments based on known pollution levels
CITY_AQI_OVERRIDE = {
    "Guntur":            city_aqi_baseline.get("Guntur", 85),
    "Vijayawada":        city_aqi_baseline.get("Guntur", 85) + 5,
    "Visakhapatnam":     city_aqi_baseline.get("Guntur", 85) - 5,
    "Tirupati":          city_aqi_baseline.get("Guntur", 85) - 10,
    "Kakinada":          city_aqi_baseline.get("Guntur", 85) - 3,
    "Nellore":           city_aqi_baseline.get("Guntur", 85) - 5,
    "Kurnool":           city_aqi_baseline.get("Guntur", 85) + 3,
    "Rajahmundry":       city_aqi_baseline.get("Guntur", 85) - 2,
    "Hyderabad":         city_aqi_baseline.get("Hyderabad", 95),
    "Warangal":          city_aqi_baseline.get("Hyderabad", 95) - 8,
    "Karimnagar":        city_aqi_baseline.get("Hyderabad", 95) - 10,
    "Nizamabad":         city_aqi_baseline.get("Hyderabad", 95) - 10,
    "Bangalore":         city_aqi_baseline.get("Bangalore", 75),
    "Mysore":            city_aqi_baseline.get("Bangalore", 75) - 15,
    "Hubli":             city_aqi_baseline.get("Bangalore", 75) - 10,
    "Mangalore":         city_aqi_baseline.get("Bangalore", 75) - 18,
    "Chennai":           city_aqi_baseline.get("Chennai", 90),
    "Coimbatore":        city_aqi_baseline.get("Chennai", 90) - 15,
    "Madurai":           city_aqi_baseline.get("Chennai", 90) - 8,
    "Salem":             city_aqi_baseline.get("Chennai", 90) - 12,
    "Tiruchirappalli":   city_aqi_baseline.get("Chennai", 90) - 10,
    "Mumbai":            city_aqi_baseline.get("Mumbai", 110),
    "Pune":              city_aqi_baseline.get("Mumbai", 110) - 15,
    "Nagpur":            city_aqi_baseline.get("Mumbai", 110) - 5,
    "Nashik":            city_aqi_baseline.get("Mumbai", 110) - 20,
    "Aurangabad":        city_aqi_baseline.get("Mumbai", 110) - 12,
    "Delhi":             city_aqi_baseline.get("Delhi", 180),
    "Gurgaon":           city_aqi_baseline.get("Gurgaon", 160),
    "Noida":             city_aqi_baseline.get("Delhi", 180) - 10,
    "Faridabad":         city_aqi_baseline.get("Gurgaon", 160) + 5,
    "Lucknow":           city_aqi_baseline.get("Lucknow", 140),
    "Kanpur":            city_aqi_baseline.get("Lucknow", 140) + 20,
    "Agra":              city_aqi_baseline.get("Lucknow", 140) + 10,
    "Varanasi":          city_aqi_baseline.get("Lucknow", 140) + 5,
    "Kolkata":           city_aqi_baseline.get("Kolkata", 120),
    "Jaipur":            city_aqi_baseline.get("Jaipur", 110),
    "Jodhpur":           city_aqi_baseline.get("Jaipur", 110) - 10,
    "Udaipur":           city_aqi_baseline.get("Jaipur", 110) - 20,
    "Ahmedabad":         city_aqi_baseline.get("Ahmedabad", 105),
    "Surat":             city_aqi_baseline.get("Ahmedabad", 105) - 10,
    "Vadodara":          city_aqi_baseline.get("Ahmedabad", 105) - 15,
    "Rajkot":            city_aqi_baseline.get("Ahmedabad", 105) - 20,
    "Bhopal":            city_aqi_baseline.get("Bhopal", 95),
    "Indore":            city_aqi_baseline.get("Bhopal", 95) - 5,
    "Jabalpur":          city_aqi_baseline.get("Bhopal", 95) - 10,
    "Gwalior":           city_aqi_baseline.get("Bhopal", 95) + 10,
    "Chandigarh":        city_aqi_baseline.get("Gurgaon", 160) - 40,
    "Ludhiana":          city_aqi_baseline.get("Ludhiana", 130),
    "Amritsar":          city_aqi_baseline.get("Ludhiana", 130) - 5,
    "Kochi":             city_aqi_baseline.get("Kochi", 65),
    "Thiruvananthapuram":city_aqi_baseline.get("Kochi", 65) - 10,
    "Kozhikode":         city_aqi_baseline.get("Kochi", 65) - 8,
    "Bhubaneswar":       city_aqi_baseline.get("Bhubaneswar", 88),
    "Patna":             city_aqi_baseline.get("Patna", 145),
    "Guwahati":          city_aqi_baseline.get("Guwahati", 90),
}


# ── STEP 4: Assign AQI to weather rows ───────────────────────────────────────
print("\nAssigning AQI to weather rows...")

weather["aqi"] = weather["city"].map(CITY_AQI_OVERRIDE)

# Add daily variation: ±20% random noise so AQI varies day to day
np.random.seed(42)
noise = np.random.uniform(0.80, 1.20, size=len(weather))
weather["aqi"] = (weather["aqi"] * noise).round(0).astype(int).clip(20, 500)

print(f"Rows with AQI assigned: {len(weather)}")


# ── STEP 5: Add curfew labels ─────────────────────────────────────────────────
CURFEW_EVENTS = [
    # Andhra Pradesh
    ("Guntur",        "2022-08-10"), ("Vijayawada",    "2022-08-10"),
    ("Vijayawada",    "2022-10-12"), ("Guntur",        "2023-06-02"),
    ("Vijayawada",    "2023-06-02"), ("Guntur",        "2023-07-18"),
    ("Guntur",        "2023-09-29"), ("Vijayawada",    "2023-09-29"),
    ("Visakhapatnam", "2023-11-03"), ("Guntur",        "2024-06-04"),
    ("Vijayawada",    "2024-06-04"), ("Vijayawada",    "2024-07-17"),
    ("Vijayawada",    "2024-09-01"), ("Vijayawada",    "2024-09-02"),
    ("Vijayawada",    "2024-09-03"), ("Guntur",        "2024-09-01"),
    ("Guntur",        "2024-09-02"),

    # Telangana
    ("Hyderabad",     "2022-09-23"), ("Hyderabad",     "2023-01-26"),
    ("Hyderabad",     "2023-08-15"), ("Hyderabad",     "2023-12-06"),
    ("Hyderabad",     "2024-04-14"), ("Warangal",      "2023-08-15"),
    ("Warangal",      "2024-04-14"),

    # Delhi
    ("Delhi",         "2023-01-26"), ("Delhi",         "2023-08-15"),
    ("Delhi",         "2023-11-01"), ("Delhi",         "2023-11-14"),
    ("Delhi",         "2024-01-26"), ("Delhi",         "2024-03-25"),
    ("Delhi",         "2024-06-04"), ("Delhi",         "2024-08-15"),
    ("Gurgaon",       "2023-11-01"), ("Noida",         "2023-11-01"),
    ("Faridabad",     "2023-11-01"),

    # Maharashtra
    ("Mumbai",        "2023-08-15"), ("Mumbai",        "2023-09-28"),
    ("Mumbai",        "2024-01-26"), ("Mumbai",        "2024-07-20"),
    ("Pune",          "2023-08-15"), ("Pune",          "2024-01-26"),
    ("Nagpur",        "2023-08-15"),

    # Tamil Nadu
    ("Chennai",       "2023-09-18"), ("Chennai",       "2023-12-04"),
    ("Chennai",       "2024-01-26"), ("Chennai",       "2024-08-15"),
    ("Coimbatore",    "2023-09-18"), ("Madurai",       "2023-09-18"),

    # Karnataka
    ("Bangalore",     "2023-09-29"), ("Bangalore",     "2024-01-26"),
    ("Bangalore",     "2024-04-14"), ("Bangalore",     "2024-08-15"),
    ("Mysore",        "2024-04-14"),

    # West Bengal
    ("Kolkata",       "2023-08-15"), ("Kolkata",       "2024-01-26"),
    ("Kolkata",       "2023-10-24"),

    # Uttar Pradesh
    ("Lucknow",       "2023-08-15"), ("Lucknow",       "2024-01-26"),
    ("Kanpur",        "2023-08-15"), ("Varanasi",      "2023-08-15"),
    ("Agra",          "2023-08-15"),

    # Rajasthan
    ("Jaipur",        "2023-08-15"), ("Jaipur",        "2024-01-26"),

    # Gujarat
    ("Ahmedabad",     "2023-08-15"), ("Surat",         "2023-08-15"),

    # Punjab
    ("Ludhiana",      "2023-08-15"), ("Amritsar",      "2023-08-15"),
    ("Chandigarh",    "2023-08-15"),

    # Kerala
    ("Kochi",         "2023-08-15"), ("Thiruvananthapuram", "2023-08-15"),

    # Bihar / Odisha / Assam
    ("Patna",         "2023-08-15"), ("Bhubaneswar",   "2023-08-15"),
    ("Guwahati",      "2023-08-15"),
]

curfew_df = pd.DataFrame(CURFEW_EVENTS, columns=["city", "date"])
curfew_df["date"] = pd.to_datetime(curfew_df["date"]).dt.date
curfew_df["curfew"] = 1

df = pd.merge(weather, curfew_df, on=["city", "date"], how="left")
df["curfew"] = df["curfew"].fillna(0).astype(int)
print(f"Total rows: {len(df)}, Curfew days: {df['curfew'].sum()}")


# ── STEP 6: Demand drop proxy ─────────────────────────────────────────────────
def compute_demand_drop(row):
    rng = np.random.default_rng(
        seed=int(abs(row["rain"] * 100 + row["aqi"])) % (2**31)
    )
    if row["curfew"] == 1:   return int(rng.integers(70, 100))
    elif row["rain"] > 40:   return int(rng.integers(50, 80))
    elif row["rain"] > 20:   return int(rng.integers(25, 50))
    elif row["aqi"] > 200:   return int(rng.integers(20, 40))
    else:                    return int(rng.integers(0, 15))

df["demand_drop"] = df.apply(compute_demand_drop, axis=1)


# ── STEP 7: Income + hours ────────────────────────────────────────────────────
CITY_INCOME = {
    "Guntur": (60,83), "Vijayawada": (65,90), "Visakhapatnam": (65,90),
    "Tirupati": (60,80), "Kakinada": (55,78), "Nellore": (55,78),
    "Kurnool": (55,75), "Rajahmundry": (58,80), "Warangal": (60,82),
    "Karimnagar": (55,75), "Nizamabad": (55,75), "Hyderabad": (83,116),
    "Bangalore": (90,130), "Mysore": (65,90), "Hubli": (60,82),
    "Mangalore": (62,85), "Chennai": (80,115), "Coimbatore": (68,95),
    "Madurai": (62,88), "Salem": (60,82), "Tiruchirappalli": (60,82),
    "Mumbai": (95,140), "Pune": (85,120), "Nagpur": (70,100),
    "Nashik": (65,92), "Aurangabad": (62,88), "Delhi": (90,130),
    "Gurgaon": (95,135), "Noida": (88,125), "Faridabad": (80,115),
    "Lucknow": (72,100), "Kanpur": (65,92), "Agra": (62,88),
    "Varanasi": (60,85), "Kolkata": (80,115), "Jaipur": (72,102),
    "Jodhpur": (62,88), "Udaipur": (60,85), "Ahmedabad": (78,110),
    "Surat": (75,105), "Vadodara": (70,98), "Rajkot": (65,92),
    "Bhopal": (68,95), "Indore": (72,100), "Jabalpur": (62,88),
    "Gwalior": (60,85), "Chandigarh": (80,112), "Ludhiana": (72,100),
    "Amritsar": (68,95), "Kochi": (78,108), "Thiruvananthapuram": (72,100),
    "Kozhikode": (68,95), "Bhubaneswar": (68,95), "Patna": (62,88),
    "Guwahati": (65,90),
}

def assign_income_hours(row):
    rng = np.random.default_rng(
        seed=abs(hash(str(row["city"]) + str(row["date"]))) % (2**31)
    )
    low, high = CITY_INCOME.get(row["city"], (70, 100))
    hourly_income = round(float(rng.uniform(low, high)), 2)
    daily_hours   = int(np.clip(rng.normal(loc=8, scale=2), 4, 12))
    return pd.Series([hourly_income, daily_hours])

df[["hourly_income", "daily_hours"]] = df.apply(assign_income_hours, axis=1)


# ── STEP 8: Risk probability label ───────────────────────────────────────────
def compute_risk(row):
    score = 0.10
    if row["rain"] > 50:          score += 0.25
    elif row["rain"] > 20:        score += 0.15
    if row["aqi"] > 200:          score += 0.20
    elif row["aqi"] > 100:        score += 0.10
    if row["curfew"] == 1:        score += 0.25
    if row["demand_drop"] > 50:   score += 0.15
    elif row["demand_drop"] > 25: score += 0.08
    if row["temp"] > 42:          score += 0.05
    if row["rain"] > 30 and row["aqi"] > 150:       score += 0.08
    if row["temp"] > 40 and row["demand_drop"] > 30: score += 0.05
    noise = np.random.normal(0, 0.02)
    return round(float(np.clip(score + noise, 0.0, 1.0)), 4)

df["risk_probability"] = df.apply(compute_risk, axis=1)


# ── STEP 9: Save ──────────────────────────────────────────────────────────────
FINAL_COLUMNS = [
    "rain", "temp", "aqi", "demand_drop",
    "curfew", "hourly_income", "daily_hours", "risk_probability"
]

df_final = df[FINAL_COLUMNS].dropna().reset_index(drop=True)
df_final.to_csv(DATA_DIR + "training_data.csv", index=False)

print(f"\nSaved training_data.csv — {len(df_final)} rows")
print("\n── Statistics ──────────────────────────────────────")
print(df_final.describe().round(2))

bins   = [0, 0.30, 0.50, 0.75, 1.0]
labels = ["low", "medium", "high", "critical"]
df_final["risk_level"] = pd.cut(
    df_final["risk_probability"], bins=bins, labels=labels
)
print("\n── Risk distribution ───────────────────────────────")
print(df_final["risk_level"].value_counts())
print("\nDone. Run train_risk_model.py next.")