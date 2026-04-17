import risk_model

def evaluate_cases():
    """Run handcrafted test cases to verify the model logic and correctness."""
    
    # Feature vector: [rain, temp, aqi, demand_drop, curfew, hourly_income, daily_hours]
    test_cases = [
        ("Normal day", [0, 30, 60, 5, 0, 80, 9], (0.00, 0.20)),
        ("Heavy rain", [55, 30, 60, 50, 0, 80, 9], (0.30, 1.00)),
        ("Curfew day", [0, 30, 60, 70, 1, 80, 9], (0.40, 1.00)),
        ("Monsoon+pollution", [35, 30, 210, 10, 0, 80, 9], (0.20, 1.00)),
        ("Extreme heat+crash", [0, 44, 80, 60, 0, 80, 9], (0.30, 1.00)),
        ("All red worst case", [80, 45, 350, 90, 1, 80, 9], (0.70, 1.00)),
        ("All green best case", [0, 28, 40, 0, 0, 80, 9], (0.00, 0.15)),
        ("Moderate partial", [25, 33, 120, 30, 0, 80, 9], (0.25, 0.55)),
    ]
    
    print(f"{'Test Case':<20} | {'Expected':<9} | {'Actual':<6} | {'Level':<10} | {'Result'}")
    print("-" * 65)
    
    all_passed = True
    for name, vector, (min_val, max_val) in test_cases:
        res = risk_model.assess_risk(vector)
        prob = res["risk_probability"]
        level = res["risk_level"]
        
        passed = min_val <= prob <= max_val
        if not passed:
            all_passed = False
            
        pass_str = "PASS" if passed else "FAIL"
        exp_str = f"{min_val:.2f}-{max_val:.2f}"
        print(f"{name:<20} | {exp_str:<9} | {prob:.4f} | {level:<10} | {pass_str}")
        
    print("-" * 65)
    if all_passed:
        print("OVERALL RESULT: ALL PASSED")
    else:
        print("OVERALL RESULT: SOME TESTS FAILED")

if __name__ == "__main__":
    evaluate_cases()