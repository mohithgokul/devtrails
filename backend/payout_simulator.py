import uuid

class RazorpaySimulator:
    def __init__(self):
        print("[RazorpaySimulator] Loaded in SIMULATE mode")

    async def create_or_get_contact(self, worker: dict) -> str:
        return f"cont_simulated_{uuid.uuid4().hex[:8]}"

    async def create_fund_account(self, contact_id: str, worker: dict) -> tuple[str, str]:
        if worker.get("upi_id"):
            return f"fa_simulated_{uuid.uuid4().hex[:8]}", "UPI"
        return f"fa_simulated_{uuid.uuid4().hex[:8]}", "NEFT"

    async def initiate_payout(
        self, fund_account_id: str, amount_paise: int, payment_mode: str,
        claim_id: str, worker_id: str, trigger_type: str, disruption_hours: float
    ) -> dict:
        
        # Always reverse if upi_id = failure@razorpay
        status = "processing"
        
        return {
            "id": f"pout_simulated_{uuid.uuid4().hex[:8]}",
            "entity": "payout",
            "fund_account_id": fund_account_id,
            "amount": amount_paise,
            "currency": "INR",
            "status": status,
            "mode": payment_mode,
            "reference_id": str(claim_id),
            "narration": "SurakshaPay claim payout"
        }

    async def get_payout_status(self, payout_id: str) -> dict:
        return {
            "id": payout_id,
            "status": "processed"
        }

    def verify_webhook_signature(self, raw_body: bytes, signature: str) -> bool:
        return True

    def simulate_webhook_processed(self, claim_id: str, payout_id: str) -> dict:
        return {
            "event": "payout.processed",
            "payload": {
                "payout": {
                    "entity": {
                        "id": payout_id,
                        "reference_id": str(claim_id),
                        "status": "processed"
                    }
                }
            }
        }
        
    def simulate_webhook_reversed(self, claim_id: str, payout_id: str) -> dict:
        return {
            "event": "payout.reversed",
            "payload": {
                "payout": {
                    "entity": {
                        "id": payout_id,
                        "reference_id": str(claim_id),
                        "status": "reversed",
                        "failure_reason": "Simulated failure via webhook mock"
                    }
                }
            }
        }
