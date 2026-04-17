import os
import base64
import hmac
import hashlib
import httpx

class RazorpayError(Exception):
    def __init__(self, message, status_code, razorpay_error_code=None):
        super().__init__(message)
        self.status_code = status_code
        self.razorpay_error_code = razorpay_error_code

class RazorpayService:
    def __init__(self):
        self.key_id = os.getenv("RAZORPAY_KEY_ID")
        self.key_secret = os.getenv("RAZORPAY_KEY_SECRET")
        self.account_number = os.getenv("RAZORPAY_ACCOUNT_NUMBER")
        self.webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET")

        if not all([self.key_id, self.key_secret, self.account_number]):
            raise ValueError("Razorpay credentials missing in environment variables")

        self.base_url = "https://api.razorpay.com/v1"
        self.timeout = 10.0

        auth_str = f"{self.key_id}:{self.key_secret}"
        self.auth_header = "Basic " + base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
        
        print(f"[RazorpayService] Init with Key ID: {self.key_id[:8]}...")

    async def _request(self, method: str, endpoint: str, **kwargs) -> dict:
        url = f"{self.base_url}{endpoint}"
        headers = kwargs.get("headers", {})
        headers["Authorization"] = self.auth_header
        kwargs["headers"] = headers
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.request(method, url, **kwargs)
            
            request_id = response.headers.get("x-request-id", "unknown")
            print(f"[Razorpay API] {method} {url} - Status: {response.status_code} - ReqID: {request_id}")
            
            if response.status_code >= 400:
                error_data = {}
                try:
                    error_data = response.json().get("error", {})
                except Exception:
                    pass
                msg = error_data.get("description", "Unknown Razorpay Error")
                code = error_data.get("code", "UNKNOWN")
                print(f"[Razorpay API Error] {msg} ({code})")
                raise RazorpayError(msg, response.status_code, code)
                
            return response.json()

    async def create_or_get_contact(self, worker: dict) -> str:
        if worker.get("razorpay_contact_id"):
            return worker["razorpay_contact_id"]

        payload = {
            "name": worker.get("name", "Unknown"),
            "email": worker.get("email", ""),
            "contact": worker.get("phone", ""),
            "type": "employee",
            "reference_id": str(worker.get("worker_id", "")),
            "notes": {
                "platform": "SurakshaPay"
            }
        }
        
        try:
            res = await self._request("POST", "/contacts", json=payload)
            return res["id"]
        except RazorpayError as e:
            if e.status_code == 400 and "exist" in str(e).lower():
                search_res = await self._request("GET", f"/contacts?reference_id={payload['reference_id']}")
                items = search_res.get("items", [])
                if items:
                    return items[0]["id"]
            raise e

    async def create_fund_account(self, contact_id: str, worker: dict) -> tuple[str, str]:
        if worker.get("upi_id"):
            payload = {
                "contact_id": contact_id,
                "account_type": "vpa",
                "vpa": {
                    "address": worker["upi_id"]
                }
            }
            payment_mode = "UPI"
        elif worker.get("bank_account_number"):
            payload = {
                "contact_id": contact_id,
                "account_type": "bank_account",
                "bank_account": {
                    "name": worker.get("name"),
                    "ifsc": worker.get("bank_ifsc"),
                    "account_number": worker.get("bank_account_number")
                }
            }
            payment_mode = "NEFT"
        else:
            raise ValueError("Worker has no UPI ID or Bank Account configured")
            
        res = await self._request("POST", "/fund_accounts", json=payload)
        return res["id"], payment_mode

    async def initiate_payout(
        self, fund_account_id: str, amount_paise: int, payment_mode: str,
        claim_id: str, worker_id: str, trigger_type: str, disruption_hours: float
    ) -> dict:
        payload = {
            "account_number": self.account_number,
            "fund_account_id": fund_account_id,
            "amount": amount_paise,
            "currency": "INR",
            "mode": payment_mode,
            "purpose": "payout",
            "queue_if_low_balance": True,
            "reference_id": str(claim_id),
            "narration": "SurakshaPay claim payout",
            "notes": {
                "claim_id": str(claim_id),
                "trigger_type": trigger_type,
                "worker_id": str(worker_id),
                "disruption_hours": str(disruption_hours)
            }
        }
        return await self._request("POST", "/payouts", json=payload)

    async def get_payout_status(self, payout_id: str) -> dict:
        return await self._request("GET", f"/payouts/{payout_id}")

    def verify_webhook_signature(self, raw_body: bytes, signature: str) -> bool:
        if not self.webhook_secret:
            print("[RazorpayService] Webhook secret not configured")
            return False
            
        expected_sig = hmac.new(
            self.webhook_secret.encode('utf-8'),
            raw_body,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_sig, signature)
