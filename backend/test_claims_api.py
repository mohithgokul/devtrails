import sys
sys.path.append(r"c:\Users\mohit\devtrails\backend")
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

res = client.post("/api/claims/file", json={
    "user_id": 1,
    "trigger_type": "heavy_rain",
    "description": "test",
    "gps_lat": 12.9716,          
    "gps_lon": 77.5946,
    "cell_tower_lat": 13.0827,   
    "cell_tower_lon": 80.2707,
    "location_change_speed_kmph": 300.0,
    "claimed_rain": 40.0
})
print("Claim filed:")
print(res.json())

res2 = client.get("/api/dashboard/1")
print("\nDashboard:")
print(res2.json())
