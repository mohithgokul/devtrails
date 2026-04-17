from api_fetcher import fetch_all_signals
import json

print("\n--- Testing Live API Integrations ---\n")

try:
    print("Fetching live data for Bangalore...")
    # This directly triggers OpenWeatherMap, GNews/NewsAPI, and WAQI
    result = fetch_all_signals(
        city="Bangalore",
        hourly_income=100.0,
        daily_hours=8
    )

    print("\n✅ API Integrations Successful!\n")
    print("Sources Used:")
    print(json.dumps(result["sources"], indent=2))
    
    print("\nLive Raw Signals Extracted:")
    print(json.dumps(result["raw"], indent=2))
    
except Exception as e:
    print(f"\n❌ Error fetching data: {e}")
