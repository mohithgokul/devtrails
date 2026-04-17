def calculate_payout(daily_rate_inr: float, disruption_hours: float) -> dict:
    """
    Computes payout amount.
    disruption_hours * (daily_rate_inr / 7)
    Min Rs. 50, Max Rs. 500
    """
    amount = disruption_hours * (daily_rate_inr / 7.0)
    
    # Clamping
    amount = max(50.0, min(500.0, amount))
    amount_inr = round(amount, 2)
    amount_paise = int(amount_inr * 100)
    
    if disruption_hours.is_integer():
        dh_str = str(int(disruption_hours))
    else:
        dh_str = str(disruption_hours)
    
    calculation = f"{dh_str}h × (₹{daily_rate_inr} ÷ 7) = ₹{amount_inr}"

    return {
        "amount_inr": amount_inr,
        "amount_paise": amount_paise,
        "disruption_hours": disruption_hours,
        "daily_rate_inr": daily_rate_inr,
        "calculation": calculation
    }

def get_disruption_hours(trigger_type: str, trigger_data: dict) -> float:
    """
    Look up default or actual disruption duration in hours based on trigger type.
    """
    if trigger_type == "heavy_rain":
        return float(trigger_data.get("rain_duration_hours", 4.0))
    elif trigger_type == "flood_zone":
        return 8.0
    elif trigger_type == "curfew":
        return float(trigger_data.get("curfew_duration_hours", 6.0))
    elif trigger_type == "high_aqi":
        return float(trigger_data.get("aqi_duration_hours", 3.0))
    elif trigger_type == "cyclone_warning":
        return 8.0
    return 4.0
