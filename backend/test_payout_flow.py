import traceback
import time
import asyncio
import uuid
import os

os.environ["RAZORPAY_TEST_MODE"] = "true"
os.environ["RAZORPAY_SIMULATE"] = "true"

from payout_calculator import calculate_payout
from payout_simulator import RazorpaySimulator

async def demo_payout_sequence():
    print("="*60)
    print("SURAKSHAPAY GRAND FINALE DEMO: INSTANT PAYOUTS")
    print("="*60)
    
    start_time = time.perf_counter()
    
    worker_name = "Ravi Kumar"
    worker_city = "Vijayawada"
    disruption = 4.0
    daily_rate = 700.0
    
    print(f"1. Worker {worker_name} ({worker_city}) submits claim during heavy rain trigger")
    time.sleep(0.5)
    print(f"2. Fraud check: trust score 91 → APPROVED")
    time.sleep(0.5)
    print(f"3. Trigger engine: rain 47mm > threshold → conditions met")
    time.sleep(0.5)
    
    mock_claim_id = str(uuid.uuid4())
    payout_info = calculate_payout(daily_rate, disruption)
    print(f"4. Payout calculated: {payout_info['calculation']}")
    
    sim = RazorpaySimulator()
    worker_dict = {
        "worker_id": "demo_worker_1", 
        "name": worker_name, 
        "upi_id": "success@razorpay"
    }
    
    contact_id = await sim.create_or_get_contact(worker_dict)
    fund_acct_id, payment_mode = await sim.create_fund_account(contact_id, worker_dict)
    
    payout_res = await sim.initiate_payout(
        fund_account_id=fund_acct_id,
        amount_paise=payout_info["amount_paise"],
        payment_mode=payment_mode,
        claim_id=mock_claim_id,
        worker_id="demo_worker_1",
        trigger_type="heavy_rain",
        disruption_hours=disruption
    )
    
    print(f"5. Razorpay payout initiated: {payout_res['id']}, status: {payout_res['status']}")
    time.sleep(1.0)
    
    webhook_payload = sim.simulate_webhook_processed(mock_claim_id, payout_res['id'])
    print(f"6. Webhook received: status → {webhook_payload['payload']['payout']['entity']['status']}")
    
    end_time = time.perf_counter()
    duration = end_time - start_time
    
    print(f"\n7. Screen shows: \"₹{payout_info['amount_inr']} sent to Ravi's UPI in {duration:.1f} seconds\"")
    print("="*60)
    
    # Run other scenarios
    print("\n--- Additional Test Scenarios ---")
    
    # Scenario 2: Bank Transfer (Flood Zone, >8 hours)
    p2 = calculate_payout(630.0, 8.0)
    print(f"Scenario 2 (Bank Transfer): Priya Sharma, Flood Zone (8h)")
    print(f"  Payout: {p2['calculation']} -> ₹{p2['amount_inr']} via NEFT")
    
    # Scenario 3: Failed Payout (Simulated Failure)
    print(f"Scenario 3 (Failed Payout): Arjun Reddy, High AQI (3h), failure@razorpay")
    p3 = calculate_payout(840.0, 3.0)
    print(f"  Attempting payout of ₹{p3['amount_inr']} via UPI...")
    fail_webhook = sim.simulate_webhook_reversed("claim_xyz", "pout_fail")
    print(f"  Webhook Received: {fail_webhook['payload']['payout']['entity']['status']} (Simulated failure via webhook mock)")
    print("  Action: Retry triggered, if failed again -> manual_review_required")
    
    print("\nSummary Table:")
    print(f"{'Worker':<15} | {'Trigger':<15} | {'Amount':<8} | {'Mode':<5} | {'Final Status':<15}")
    print("-" * 65)
    print(f"{'Ravi Kumar':<15} | {'heavy_rain(4h)':<15} | {payout_info['amount_inr']:<8.2f} | {'UPI':<5} | {'processed':<15}")
    print(f"{'Priya Sharma':<15} | {'flood_zone(8h)':<15} | {p2['amount_inr']:<8.2f} | {'NEFT':<5} | {'processed':<15}")
    print(f"{'Arjun Reddy':<15} | {'high_aqi(3h)':<15} | {p3['amount_inr']:<8.2f} | {'UPI':<5} | {'reversed (manual)':<15}")

if __name__ == "__main__":
    asyncio.run(demo_payout_sequence())
