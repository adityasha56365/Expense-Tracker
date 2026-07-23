# app/routes/premium.py
"""
Premium Subscription System (Demo/Modular)
- Free Plan: Basic features
- Premium Plan: All features unlocked
- Payment module is a stub — plug in Stripe/Razorpay without changing app architecture.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

from app.core.security import get_current_user
from app.core.database import get_db
from app.utils.helpers import serialize_doc, now_utc

router = APIRouter(prefix="/premium", tags=["Premium"])


# ── Premium feature definitions ──────────────────────────────────────────────

FREE_FEATURES = [
    "Up to 50 transactions/month",
    "Basic analytics",
    "Single budget",
    "Receipt scanner (5/month)",
    "1 savings goal",
    "CSV export",
]

PREMIUM_FEATURES = [
    "Unlimited transactions",
    "Advanced AI analytics & forecasting",
    "Unlimited budgets",
    "Unlimited receipt scanning",
    "Unlimited savings goals",
    "PDF/Excel export with charts",
    "Recurring expense detection",
    "Bill splitting",
    "Bank statement import",
    "Priority support",
    "Premium badge",
]

PLANS = {
    "monthly": {"price": 299, "currency": "INR", "label": "Monthly", "duration_days": 30},
    "yearly": {"price": 2499, "currency": "INR", "label": "Yearly", "duration_days": 365, "savings": "30%"},
}


# ── Schemas ──────────────────────────────────────────────────────────────────

class ActivateRequest(BaseModel):
    plan: str = "monthly"  # monthly | yearly
    # Payment fields (stub — replace with Stripe PaymentIntent, etc.)
    payment_method: Optional[str] = "demo"
    payment_id: Optional[str] = None


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/status")
async def get_premium_status(current_user=Depends(get_current_user)):
    """Get current premium status for the authenticated user."""
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})
    premium_info = user.get("premium", {})

    is_premium = premium_info.get("is_active", False)
    expires_at = premium_info.get("expires_at")
    plan = premium_info.get("plan", "free")

    # Auto-expire
    if is_premium and expires_at:
        try:
            exp_dt = datetime.fromisoformat(expires_at)
            if exp_dt < datetime.utcnow():
                is_premium = False
                plan = "free"
                await db.users.update_one(
                    {"_id": current_user["_id"]},
                    {"$set": {"premium.is_active": False, "premium.plan": "free"}}
                )
        except Exception:
            pass

    return {
        "is_premium": is_premium,
        "plan": plan,
        "expires_at": expires_at,
        "free_features": FREE_FEATURES,
        "premium_features": PREMIUM_FEATURES,
        "plans": PLANS,
        "subscription_history": premium_info.get("history", []),
    }


@router.post("/activate")
async def activate_premium(body: ActivateRequest, current_user=Depends(get_current_user)):
    """
    Activate premium plan.
    In demo/dev mode: activates immediately with fake payment.
    In production: validate Stripe/Razorpay payment_id before activating.
    """
    db = get_db()

    if body.plan not in PLANS:
        raise HTTPException(status_code=400, detail=f"Invalid plan. Choose: {list(PLANS.keys())}")

    plan_info = PLANS[body.plan]
    now = datetime.utcnow()
    expires_at = (now + timedelta(days=plan_info["duration_days"])).isoformat()

    # ── PAYMENT STUB ──────────────────────────────────────────────────────────
    # TODO: Replace this block with real payment verification:
    #   import stripe
    #   payment_intent = stripe.PaymentIntent.retrieve(body.payment_id)
    #   if payment_intent.status != "succeeded": raise HTTPException(402, "Payment failed")
    # ─────────────────────────────────────────────────────────────────────────
    payment_verified = True  # Demo: always succeeds

    if not payment_verified:
        raise HTTPException(status_code=402, detail="Payment verification failed")

    history_entry = {
        "plan": body.plan,
        "amount": plan_info["price"],
        "currency": plan_info["currency"],
        "activated_at": now.isoformat(),
        "expires_at": expires_at,
        "payment_id": body.payment_id or f"DEMO_{now.strftime('%Y%m%d%H%M%S')}",
        "payment_method": body.payment_method,
    }

    await db.users.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "premium.is_active": True,
                "premium.plan": body.plan,
                "premium.expires_at": expires_at,
                "premium.activated_at": now.isoformat(),
                "updated_at": now_utc(),
            },
            "$push": {"premium.history": history_entry},
        }
    )

    return {
        "success": True,
        "message": f"Premium {body.plan} plan activated!",
        "plan": body.plan,
        "expires_at": expires_at,
        "invoice": {
            "invoice_number": f"INV-{now.strftime('%Y%m%d%H%M%S')}",
            "amount": plan_info["price"],
            "currency": plan_info["currency"],
            "plan": plan_info["label"],
            "date": now.strftime("%d %b %Y"),
        }
    }


@router.post("/deactivate")
async def deactivate_premium(current_user=Depends(get_current_user)):
    """Cancel premium subscription (downgrade to free)."""
    db = get_db()
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "premium.is_active": False,
                "premium.plan": "free",
                "premium.cancelled_at": datetime.utcnow().isoformat(),
                "updated_at": now_utc(),
            }
        }
    )
    return {"success": True, "message": "Premium cancelled. You're now on the free plan."}
