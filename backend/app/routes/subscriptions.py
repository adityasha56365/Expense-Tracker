# app/routes/subscriptions.py
"""
Subscription Management API (Demo — no real payment gateway)
Tracks user subscriptions locally with renewal reminders and invoice generation.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
from bson import ObjectId
import json

from app.core.security import get_current_user
from app.core.database import get_db
from app.utils.helpers import serialize_doc, serialize_list, now_utc, parse_object_id

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class SubscriptionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)
    billing_cycle: str = Field(default="monthly")  # monthly | yearly | weekly
    category: Optional[str] = "Entertainment"
    next_billing_date: str  # YYYY-MM-DD
    description: Optional[str] = None
    icon: Optional[str] = "📱"
    color: Optional[str] = "#6366f1"
    is_active: bool = True
    website: Optional[str] = None


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    billing_cycle: Optional[str] = None
    next_billing_date: Optional[str] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None


# ── Helpers ──────────────────────────────────────────────────────────────────

CYCLE_DAYS = {"monthly": 30, "yearly": 365, "weekly": 7}


def _enrich_subscription(sub: dict) -> dict:
    """Add computed fields to subscription."""
    billing_cycle = sub.get("billing_cycle", "monthly")
    cycle_days = CYCLE_DAYS.get(billing_cycle, 30)
    amount = sub.get("amount", 0)

    # Monthly equivalent cost
    if billing_cycle == "yearly":
        monthly_cost = round(amount / 12, 2)
        yearly_cost = amount
    elif billing_cycle == "weekly":
        monthly_cost = round(amount * 4.33, 2)
        yearly_cost = round(amount * 52, 2)
    else:
        monthly_cost = amount
        yearly_cost = round(amount * 12, 2)

    # Days until next billing
    next_billing = sub.get("next_billing_date")
    days_until = None
    is_due_soon = False
    if next_billing:
        try:
            next_dt = datetime.fromisoformat(next_billing)
            days_until = max((next_dt - datetime.utcnow()).days, 0)
            is_due_soon = days_until <= 7
        except Exception:
            pass

    return {
        **sub,
        "monthly_cost": monthly_cost,
        "yearly_cost": yearly_cost,
        "days_until_billing": days_until,
        "is_due_soon": is_due_soon,
    }


def _generate_invoice(sub: dict, user_name: str) -> dict:
    """Generate a simple invoice for a subscription."""
    now = datetime.utcnow()
    return {
        "invoice_number": f"SUB-{now.strftime('%Y%m%d')}-{str(sub.get('_id', ''))[-6:].upper()}",
        "date": now.strftime("%d %b %Y"),
        "due_date": sub.get("next_billing_date", now.strftime("%Y-%m-%d")),
        "billed_to": user_name,
        "service_name": sub.get("name"),
        "billing_cycle": sub.get("billing_cycle", "monthly").title(),
        "amount": sub.get("amount"),
        "currency": "INR",
        "status": "pending",
        "line_items": [
            {
                "description": f"{sub.get('name')} — {sub.get('billing_cycle', 'Monthly').title()} Subscription",
                "quantity": 1,
                "unit_price": sub.get("amount"),
                "total": sub.get("amount"),
            }
        ],
        "subtotal": sub.get("amount"),
        "tax": 0,
        "total": sub.get("amount"),
        "note": "This is a demo invoice for tracking purposes only.",
    }


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("")
async def get_subscriptions(current_user=Depends(get_current_user)):
    db = get_db()
    uid = str(current_user["_id"])
    cursor = db.subscriptions.find({"user_id": uid}).sort("next_billing_date", 1)
    docs = await cursor.to_list(length=200)
    serialized = serialize_list(docs)
    return [_enrich_subscription(s) for s in serialized]


@router.post("", status_code=201)
async def create_subscription(body: SubscriptionCreate, current_user=Depends(get_current_user)):
    db = get_db()
    uid = str(current_user["_id"])
    now = now_utc()

    # Validate billing cycle
    if body.billing_cycle not in CYCLE_DAYS:
        raise HTTPException(status_code=400, detail=f"billing_cycle must be: {list(CYCLE_DAYS.keys())}")

    # Validate date
    try:
        datetime.fromisoformat(body.next_billing_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid next_billing_date. Use YYYY-MM-DD")

    doc = body.model_dump()
    doc["user_id"] = uid
    doc["payment_history"] = []
    doc["created_at"] = now
    doc["updated_at"] = now

    result = await db.subscriptions.insert_one(doc)
    doc["_id"] = result.inserted_id
    serialized = serialize_doc(doc)
    return _enrich_subscription(serialized)


@router.get("/upcoming")
async def get_upcoming_subscriptions(current_user=Depends(get_current_user)):
    """Subscriptions due in the next 30 days."""
    db = get_db()
    uid = str(current_user["_id"])
    now = datetime.utcnow()
    cutoff = (now + timedelta(days=30)).isoformat()

    cursor = db.subscriptions.find({
        "user_id": uid,
        "is_active": True,
        "next_billing_date": {"$lte": cutoff},
    }).sort("next_billing_date", 1)
    docs = await cursor.to_list(length=100)
    serialized = serialize_list(docs)
    enriched = [_enrich_subscription(s) for s in serialized]
    total = sum(s.get("amount", 0) for s in enriched)
    return {"subscriptions": enriched, "total_due": round(total, 2)}


@router.put("/{sub_id}")
async def update_subscription(
    sub_id: str,
    body: SubscriptionUpdate,
    current_user=Depends(get_current_user),
):
    db = get_db()
    oid = parse_object_id(sub_id)
    sub = await db.subscriptions.find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    update_data = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = now_utc()
    await db.subscriptions.update_one({"_id": oid}, {"$set": update_data})
    updated = await db.subscriptions.find_one({"_id": oid})
    return _enrich_subscription(serialize_doc(updated))


@router.delete("/{sub_id}")
async def delete_subscription(sub_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    oid = parse_object_id(sub_id)
    result = await db.subscriptions.delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {"message": "Subscription deleted"}


@router.post("/{sub_id}/mark-paid")
async def mark_subscription_paid(sub_id: str, current_user=Depends(get_current_user)):
    """Mark current billing cycle as paid and advance next_billing_date."""
    db = get_db()
    oid = parse_object_id(sub_id)
    sub = await db.subscriptions.find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    cycle_days = CYCLE_DAYS.get(sub.get("billing_cycle", "monthly"), 30)
    try:
        current_due = datetime.fromisoformat(sub["next_billing_date"])
    except Exception:
        current_due = datetime.utcnow()

    next_due = (current_due + timedelta(days=cycle_days)).strftime("%Y-%m-%d")

    payment_record = {
        "amount": sub["amount"],
        "paid_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "billing_period": sub["next_billing_date"],
    }

    await db.subscriptions.update_one(
        {"_id": oid},
        {
            "$set": {"next_billing_date": next_due, "updated_at": now_utc()},
            "$push": {"payment_history": payment_record},
        }
    )
    updated = await db.subscriptions.find_one({"_id": oid})
    return _enrich_subscription(serialize_doc(updated))


@router.get("/{sub_id}/invoice")
async def get_invoice(sub_id: str, current_user=Depends(get_current_user)):
    """Generate a demo invoice for the subscription."""
    db = get_db()
    oid = parse_object_id(sub_id)
    sub = await db.subscriptions.find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    user_name = current_user.get("name", "User")
    serialized_sub = serialize_doc(sub)
    return _generate_invoice(serialized_sub, user_name)


@router.get("/summary")
async def get_subscription_summary(current_user=Depends(get_current_user)):
    """Monthly and yearly cost summary."""
    db = get_db()
    uid = str(current_user["_id"])
    cursor = db.subscriptions.find({"user_id": uid, "is_active": True})
    docs = await cursor.to_list(length=200)
    serialized = serialize_list(docs)
    enriched = [_enrich_subscription(s) for s in serialized]

    total_monthly = sum(s.get("monthly_cost", 0) for s in enriched)
    total_yearly = sum(s.get("yearly_cost", 0) for s in enriched)
    by_category = {}
    for s in enriched:
        cat = s.get("category", "Other")
        by_category[cat] = by_category.get(cat, 0) + s.get("monthly_cost", 0)

    return {
        "total_monthly": round(total_monthly, 2),
        "total_yearly": round(total_yearly, 2),
        "count": len(enriched),
        "by_category": by_category,
    }
