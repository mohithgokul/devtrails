from premium_model import calculate_premium

res1 = calculate_premium(0.15, 100.0, 10, 'standard')
print(f"Risk 15% -> Premium = Rs {res1['weekly_premium']} (Expected Loss: {res1['expected_loss']}, Payout: {res1['payout_if_triggered']}, Surcharge: {res1['risk_surcharge']})")

res2 = calculate_premium(0.35, 100.0, 10, 'standard')
print(f"Risk 35% -> Premium = Rs {res2['weekly_premium']} (Expected Loss: {res2['expected_loss']}, Payout: {res2['payout_if_triggered']}, Surcharge: {res2['risk_surcharge']})")

res3 = calculate_premium(0.85, 100.0, 10, 'standard')
print(f"Risk 85% -> Premium = Rs {res3['weekly_premium']} (Expected Loss: {res3['expected_loss']}, Payout: {res3['payout_if_triggered']}, Surcharge: {res3['risk_surcharge']})")
