from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
import os
import psycopg2.extras
from db import get_connection, get_dict_connection

from payout_calculator import calculate_payout, get_disruption_hours
from razorpay_service import RazorpayService, RazorpayError
from payout_simulator import RazorpaySimulator

router = APIRouter()

def get_payout_service():
    if os.getenv("RAZORPAY_SIMULATE", "true").lower() == "true" or not os.getenv("RAZORPAY_ACCOUNT_NUMBER"):
        print("[System] Falling back to offline Razorpay Simulator: No RazorpayX Account Number configuration found.")
        return RazorpaySimulator()
    return RazorpayService()

class InitiatePayoutRequest(BaseModel):
    claim_id: str
    worker_id: str
    trigger_type: str
    disruption_hours: float = None
    trigger_data: dict = {}

async def initiate_payout_for_claim(
    claim_id: str,
    worker_id: str,
    trigger_type: str,
    disruption_hours: float = None,
    trigger_data: dict = None
) -> dict:
    if trigger_data is None:
        trigger_data = {}
        
    if disruption_hours is None:
        disruption_hours = get_disruption_hours(trigger_type, trigger_data)

    conn = get_dict_connection()
    cursor = conn.cursor()
    
    # Fetch worker details
    cursor.execute('''
        SELECT id, full_name, email, phone, razorpay_contact_id, 
               razorpay_fund_acct_id, upi_id, bank_account_number, bank_ifsc,
               COALESCE(daily_rate_inr, 700.0) as daily_rate_inr
        FROM users WHERE id = %s
    ''', (worker_id,))
    worker = cursor.fetchone()
    
    if not worker:
        conn.close()
        raise HTTPException(status_code=404, detail="Worker not found")

    payout_info = calculate_payout(worker["daily_rate_inr"], disruption_hours)
    service = get_payout_service()

    try:
        worker_dict = {
            "worker_id": worker["id"],
            "name": worker["full_name"],
            "email": worker["email"],
            "phone": worker["phone"],
            "razorpay_contact_id": worker["razorpay_contact_id"],
            "upi_id": worker["upi_id"],
            "bank_account_number": worker["bank_account_number"],
            "bank_ifsc": worker["bank_ifsc"]
        }

        contact_id = await service.create_or_get_contact(worker_dict)
        
        if not worker["razorpay_fund_acct_id"]:
            fund_acct_id, payment_mode = await service.create_fund_account(contact_id, worker_dict)
        else:
            fund_acct_id = worker["razorpay_fund_acct_id"]
            payment_mode = "UPI" if worker["upi_id"] else "NEFT"

        payout_res = await service.initiate_payout(
            fund_account_id=fund_acct_id,
            amount_paise=payout_info["amount_paise"],
            payment_mode=payment_mode,
            claim_id=claim_id,
            worker_id=worker_id,
            trigger_type=trigger_type,
            disruption_hours=payout_info["disruption_hours"]
        )

        payout_id = payout_res["id"]
        status = payout_res["status"]

        cursor.execute('''
            UPDATE users 
            SET razorpay_contact_id = %s, razorpay_fund_acct_id = %s
            WHERE id = %s
        ''', (contact_id, fund_acct_id, worker_id))

        cursor.execute('''
            UPDATE claims
            SET payout_amount_inr = %s, payout_amount_paise = %s,
                disruption_hours = %s, razorpay_payout_id = %s,
                payout_status = %s, payment_mode = %s,
                payout_initiated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        ''', (payout_info["amount_inr"], payout_info["amount_paise"],
              payout_info["disruption_hours"], payout_id,
              status, payment_mode, claim_id))
              
        conn.commit()
        conn.close()

        estimated_arrival = "Instant" if payment_mode == "UPI" else "1–2 hours"
        
        return {
            "claim_id": claim_id,
            "payout_id": payout_id,
            "amount_inr": payout_info["amount_inr"],
            "amount_paise": payout_info["amount_paise"],
            "payment_mode": payment_mode,
            "status": status,
            "calculation": payout_info["calculation"],
            "estimated_arrival": estimated_arrival,
            "message": f"₹{payout_info['amount_inr']} is on its way to your {payment_mode} account"
        }

    except Exception as e:
        conn.close()
        print(f"[initiate_payout_for_claim] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/initiate")
async def initiate_payout_api(req: InitiatePayoutRequest):
    return await initiate_payout_for_claim(
        claim_id=req.claim_id,
        worker_id=req.worker_id,
        trigger_type=req.trigger_type,
        disruption_hours=req.disruption_hours,
        trigger_data=req.trigger_data
    )

@router.post("/webhook")
async def razorpay_webhook(request: Request):
    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    
    service = get_payout_service()
    if not service.verify_webhook_signature(raw_body, signature):
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    data = await request.json()
    event = data.get("event")
    
    if event not in ["payout.processed", "payout.reversed", "payout.queued"]:
        return {"status": "ignored"}
        
    payout = data["payload"]["payout"]["entity"]
    payout_id = payout["id"]
    claim_id = payout.get("reference_id")
    status = payout["status"]
    
    conn = get_connection()
    cursor = conn.cursor()
    
    if status == "processed":
        cursor.execute('''
            UPDATE claims
            SET status = 'paid', payout_status = 'processed', payout_completed_at = CURRENT_TIMESTAMP
            WHERE razorpay_payout_id = %s
        ''', (payout_id,))
        print(f"[Webhook] Payout {payout_id} for claim {claim_id} PROCESSED successfully.")
        
    elif status == "reversed":
        cursor.execute('''
            UPDATE claims
            SET status = 'payout_failed', payout_status = 'reversed'
            WHERE razorpay_payout_id = %s
        ''', (payout_id,))
        error_desc = payout.get("failure_reason", "Unknown")
        print(f"[Webhook] Payout {payout_id} REVERSED. Reason: {error_desc}. Initiating retry logic...")
        cursor.execute('''
            UPDATE claims SET status = 'manual_review_required' WHERE razorpay_payout_id = %s
        ''', (payout_id,))
        
    elif status == "queued":
        cursor.execute('''
            UPDATE claims SET payout_status = 'queued' WHERE razorpay_payout_id = %s
        ''', (payout_id,))
        print(f"[Webhook] Payout {payout_id} is QUEUED.")
        
    conn.commit()
    conn.close()
    
    return {"status": "ok"}

@router.get("/status/{claim_id}")
async def get_payout_status(claim_id: str):
    conn = get_dict_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, status, payout_status, payout_amount_inr, payment_mode, razorpay_payout_id 
        FROM claims WHERE id = %s
    ''', (claim_id,))
    claim = cursor.fetchone()
    conn.close()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    return {
        "claim_id": claim["id"],
        "status": claim["status"],
        "payout_status": claim["payout_status"],
        "amount_inr": claim["payout_amount_inr"],
        "payment_mode": claim["payment_mode"]
    }

@router.get("/history/{worker_id}")
async def get_payout_history(worker_id: str):
    conn = get_dict_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id as claim_id, payout_amount_inr as amount_inr, trigger_type, 
               payout_status, payout_completed_at
        FROM claims
        WHERE user_id = %s AND payout_amount_inr IS NOT NULL
        ORDER BY created_at DESC
    ''', (worker_id,))
    rows = cursor.fetchall()
    conn.close()
    return list(rows)
