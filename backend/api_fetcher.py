"""
api_fetcher.py — Fetches all external signals for a given city or coordinates.
Returns the raw feature vector dict consumed by the risk and premium models.

Data sources:
  1. OpenWeatherMap → rain (mm/hr), temperature (°C)  [by city name OR lat/lon]
  2. WAQI           → Air Quality Index (0–500)        [by city name]
  3. GNews          → curfew flag, demand_drop %       [primary news source]
  4. NewsAPI        → curfew flag, demand_drop %       [fallback news source]

Phase 2 additions:
  - fetch_weather_by_coords(lat, lon)  — weather from GPS coordinates
  - reverse_geocode(lat, lon)          — coordinates → city name (for AQI & news)
  - fetch_all_signals() now accepts optional lat/lon params
    ├── If lat/lon provided → weather from coords, city derived via reverse geocode
    └── If only city provided → original behaviour (city name for all API calls)
"""

import os
import requests
from dotenv import load_dotenv
from typing import Optional

load_dotenv()  # Load API keys from .env file

# Disruption keywords scanned in news headlines to estimate demand drop and curfews
KEYWORDS = ["curfew", "shutdown", "protest", "flood", "strike", "ban", "restriction"]

# Safe fallback values returned when an API call fails.
# This keeps the pipeline alive even when external APIs are unavailable.
DEFAULTS = {
    "rain":        0.0,
    "temp":        30.0,
    "aqi":         50,
    "demand_drop": 0,
    "curfew":      0,
}


# ---------------------------------------------------------------------------
# 1a. OpenWeatherMap — Weather by city name (original Phase 1 behaviour)
# ---------------------------------------------------------------------------

def fetch_weather(city: str) -> dict:
    """
    Queries OpenWeatherMap Current Weather API using a city name string.
    Endpoint: GET /data/2.5/weather?q={city}&appid={key}&units=metric

    Returns:
        {"rain": float (mm/hr), "temp": float (°C)}
    Falls back to DEFAULTS on any network or API error.
    """
    api_key = os.getenv("OPENWEATHER_API_KEY", "")
    if not api_key:
        print("[weather] OPENWEATHER_API_KEY not set — using defaults")
        return {"rain": DEFAULTS["rain"], "temp": DEFAULTS["temp"]}

    url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?q={city}&appid={api_key}&units=metric"
    )
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        # The "rain" key is absent when it is not raining — default to 0.0
        rain = data.get("rain", {}).get("1h", 0.0)
        temp = data.get("main", {}).get("temp", DEFAULTS["temp"])

        print(f"[weather/city] {city}: rain={rain}mm/hr, temp={temp}°C")
        return {"rain": float(rain), "temp": float(temp)}

    except Exception as e:
        print(f"[weather/city] API error for '{city}': {e} — using defaults")
        return {"rain": DEFAULTS["rain"], "temp": DEFAULTS["temp"]}


# ---------------------------------------------------------------------------
# 1b. OpenWeatherMap — Weather by GPS coordinates (Phase 2)
# ---------------------------------------------------------------------------

def fetch_weather_by_coords(lat: float, lon: float) -> dict:
    """
    Queries OpenWeatherMap Current Weather API using latitude/longitude.
    Endpoint: GET /data/2.5/weather?lat={lat}&lon={lon}&appid={key}&units=metric

    Used when the user's GPS coordinates are available (more precise than city).

    Returns:
        {"rain": float (mm/hr), "temp": float (°C)}
    Falls back to DEFAULTS on any failure.
    """
    api_key = os.getenv("OPENWEATHER_API_KEY", "")
    if not api_key:
        print("[weather] OPENWEATHER_API_KEY not set — using defaults")
        return {"rain": DEFAULTS["rain"], "temp": DEFAULTS["temp"]}

    url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    )
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        rain = data.get("rain", {}).get("1h", 0.0)
        temp = data.get("main", {}).get("temp", DEFAULTS["temp"])

        print(f"[weather/coords] ({lat},{lon}): rain={rain}mm/hr, temp={temp}°C")
        return {"rain": float(rain), "temp": float(temp)}

    except Exception as e:
        print(f"[weather/coords] API error for ({lat},{lon}): {e} — using defaults")
        return {"rain": DEFAULTS["rain"], "temp": DEFAULTS["temp"]}


# ---------------------------------------------------------------------------
# 1c. OpenWeatherMap Geocoding — Reverse geocode coordinates → city name (Phase 2)
# ---------------------------------------------------------------------------

def reverse_geocode(lat: float, lon: float) -> str:
    """
    Converts GPS coordinates to a city name using the OpenWeatherMap
    Geocoding API (reverse endpoint).
    Endpoint: GET /geo/1.0/reverse?lat={lat}&lon={lon}&limit=1&appid={key}

    Why: AQI (WAQI) and News APIs require a city name, not coordinates.
    This bridges the gap when the user only provides GPS coords.

    Returns:
        City name string (e.g. "Bangalore"), or "Unknown" on failure.
    """
    api_key = os.getenv("OPENWEATHER_API_KEY", "")
    if not api_key:
        print("[geocode] OPENWEATHER_API_KEY not set — returning 'Unknown'")
        return "Unknown"

    url = (
        f"https://api.openweathermap.org/geo/1.0/reverse"
        f"?lat={lat}&lon={lon}&limit=1&appid={api_key}"
    )
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        if data and len(data) > 0:
            city = data[0].get("name", "Unknown")
            print(f"[geocode] ({lat},{lon}) → {city}")
            return city
        else:
            print(f"[geocode] No results for ({lat},{lon})")
            return "Unknown"

    except Exception as e:
        print(f"[geocode] API error for ({lat},{lon}): {e} — returning 'Unknown'")
        return "Unknown"


# ---------------------------------------------------------------------------
# 2. WAQI — World Air Quality Index (city-based)
# ---------------------------------------------------------------------------

def fetch_aqi(city: str) -> dict:
    """
    Queries the WAQI (World Air Quality Index) feed API for a city.
    Endpoint: GET https://api.waqi.info/feed/{city}/?token={key}

    AQI scale interpretation (used by risk model):
        0–50    → Good
        51–100  → Moderate
        101–150 → Unhealthy for Sensitive Groups
        151–200 → Unhealthy
        201–300 → Very Unhealthy (triggers hazardous_aqi)
        300+    → Hazardous

    Returns:
        {"aqi": int (0–500)}
    Falls back to DEFAULTS["aqi"] on failure.
    """
    api_key = os.getenv("WAQI_API_KEY", "")
    if not api_key:
        print("[aqi] WAQI_API_KEY not set — using defaults")
        return {"aqi": DEFAULTS["aqi"]}

    url = f"https://api.waqi.info/feed/{city}/?token={api_key}"
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        if data.get("status") != "ok":
            raise ValueError(f"WAQI returned non-ok status: {data.get('status')}")

        aqi_val = data.get("data", {}).get("aqi", DEFAULTS["aqi"])
        # WAQI sometimes returns "-" for stations with unknown data — treat as default
        if not isinstance(aqi_val, (int, float)):
            print(f"[aqi] Unexpected AQI value '{aqi_val}' for {city} — using default")
            aqi_val = DEFAULTS["aqi"]

        print(f"[aqi] {city}: aqi={aqi_val}")
        return {"aqi": int(aqi_val)}

    except Exception as e:
        print(f"[aqi] API error for '{city}': {e} — using defaults")
        return {"aqi": DEFAULTS["aqi"]}


# ---------------------------------------------------------------------------
# 3. News parsing helpers — shared between GNews and NewsAPI
# ---------------------------------------------------------------------------

def _scan_headlines(articles: list) -> dict:
    """
    Scans a list of article dicts (title + description) for disruption keywords.
    Each keyword hit contributes 15% demand drop (capped at 100%).
    "curfew" or "shutdown" keywords also set the curfew flag to 1.

    Returns:
        {"curfew": 0|1, "demand_drop": 0–100}
    """
    curfew       = 0
    keyword_hits = 0

    for article in articles:
        title       = (article.get("title")       or "").lower()
        description = (article.get("description") or "").lower()
        text        = f"{title} {description}"

        for kw in KEYWORDS:
            if kw in text:
                keyword_hits += 1
                if kw in ("curfew", "shutdown"):
                    curfew = 1  # Any curfew/shutdown mention is a hard flag

    # Each keyword hit adds 15% demand drop, capped at 100%
    demand_drop = min(keyword_hits * 15, 100)
    return {"curfew": curfew, "demand_drop": demand_drop}


# ---------------------------------------------------------------------------
# 3a. GNews — Primary news source
# ---------------------------------------------------------------------------

def fetch_news_gnews(city: str) -> dict:
    """
    Queries GNews search API for disruption-related headlines for the city.
    Endpoint: GET https://gnews.io/api/v4/search?q={city}+disruption&token={key}

    Raises on failure so the caller can fall back to NewsAPI.
    Returns:
        {"curfew": 0|1, "demand_drop": 0–100, "source": "gnews"}
    """
    api_key = os.getenv("GNEWS_API_KEY", "")
    if not api_key:
        raise ValueError("GNEWS_API_KEY not set")

    url = (
        f"https://gnews.io/api/v4/search"
        f"?q={city}+disruption&token={api_key}&lang=en&max=5"
    )
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    data     = resp.json()
    articles = data.get("articles", [])

    result           = _scan_headlines(articles)
    result["source"] = "gnews"
    print(f"[news/gnews] {city}: curfew={result['curfew']}, demand_drop={result['demand_drop']}%")
    return result


# ---------------------------------------------------------------------------
# 3b. NewsAPI — Fallback news source
# ---------------------------------------------------------------------------

def fetch_news_newsapi(city: str) -> dict:
    """
    Fallback news source — called only when GNews fails.
    Endpoint: GET https://newsapi.org/v2/everything?q={city}+gig+workers

    Raises on failure (so the caller can apply hard defaults).
    Returns:
        {"curfew": 0|1, "demand_drop": 0–100, "source": "newsapi_fallback"}
    """
    api_key = os.getenv("NEWSAPI_KEY", "")
    if not api_key:
        raise ValueError("NEWSAPI_KEY not set")

    url = (
        f"https://newsapi.org/v2/everything"
        f"?q={city}+gig+workers&apiKey={api_key}&pageSize=5"
    )
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    data     = resp.json()
    articles = data.get("articles", [])

    result           = _scan_headlines(articles)
    result["source"] = "newsapi_fallback"
    print(f"[news/newsapi] {city}: curfew={result['curfew']}, demand_drop={result['demand_drop']}%")
    return result


# ---------------------------------------------------------------------------
# Master signal fetcher — assembles the full feature vector (Phase 2)
# ---------------------------------------------------------------------------

def fetch_all_signals(
    city: str,
    hourly_income: float,
    daily_hours: int,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
) -> dict:
    """
    Orchestrates all external API calls and assembles the complete feature vector.

    Phase 2 routing logic:
        If lat AND lon provided:
            → Weather fetched by GPS coordinates (more accurate)
            → City derived via reverse_geocode() for AQI and news APIs
        Else (city-only or no location):
            → Weather fetched by city name (original Phase 1 behaviour)
            → City used directly for AQI and news

    Returns:
    {
        "feature_vector": [rain, temp, aqi, demand_drop, curfew, hourly_income, daily_hours],
        "sources":        {"weather": str, "aqi": str, "news": str},
        "raw":            {rain, temp, aqi, demand_drop, curfew, hourly_income, daily_hours},
        "resolved_city":  str   ← the city string actually used for AQI/news lookups
    }
    """

    # ── Weather signal ───────────────────────────────────────────────────────
    if lat is not None and lon is not None:
        # Coordinate-based path: more precise, used when GPS available
        weather        = fetch_weather_by_coords(lat, lon)
        resolved_city  = reverse_geocode(lat, lon)   # derive city for AQI/news
        weather_source = "openweathermap_coords"
    else:
        # City-name path: original fallback / explicit city input
        weather        = fetch_weather(city)
        resolved_city  = city if city else "Unknown"
        weather_source = "openweathermap"

    # ── AQI signal (always city-based) ───────────────────────────────────────
    air = fetch_aqi(resolved_city)

    # ── News signals (GNews primary, NewsAPI fallback) ────────────────────────
    try:
        news = fetch_news_gnews(resolved_city)
    except Exception as e:
        print(f"[news] GNews failed ({e}), trying NewsAPI fallback...")
        try:
            news = fetch_news_newsapi(resolved_city)
        except Exception as e2:
            print(f"[news] NewsAPI also failed ({e2}) — using hard defaults")
            news = {
                "curfew":      DEFAULTS["curfew"],
                "demand_drop": DEFAULTS["demand_drop"],
                "source":      "defaults",
            }

    # ── Assemble raw signal dict ──────────────────────────────────────────────
    raw = {
        "rain":         weather["rain"],
        "temp":         weather["temp"],
        "aqi":          air["aqi"],
        "demand_drop":  news["demand_drop"],
        "curfew":       news["curfew"],
        "hourly_income": hourly_income,
        "daily_hours":  daily_hours,
    }

    # ── Ordered feature vector (order matters — matches risk model input) ─────
    # [rain, temp, aqi, demand_drop, curfew, hourly_income, daily_hours]
    feature_vector = [
        raw["rain"],
        raw["temp"],
        raw["aqi"],
        raw["demand_drop"],
        raw["curfew"],
        raw["hourly_income"],
        raw["daily_hours"],
    ]

    sources = {
        "weather": weather_source,
        "aqi":     "waqi",
        "news":    news["source"],
    }

    return {
        "feature_vector": feature_vector,
        "sources":        sources,
        "raw":            raw,
        "resolved_city":  resolved_city,
    }
