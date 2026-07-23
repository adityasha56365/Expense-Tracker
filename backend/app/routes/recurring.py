# app/routes/recurring.py
"""
Recurring Expense Detection API
Detects subscription-like patterns from transaction history.
Uses: merchant name similarity + amount within ±10% + different months.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from collections import defaultdict
import re

from app.core.security import get_current_user
from app.core.database import get_db
from app.utils.helpers import serialize_list, now_utc, parse_object_id

router = APIRouter(prefix="/recurring", tags=["Recurring"])


def _normalize_merchant(name: str) -> str:
    """Normalize merchant name for grouping."""
    if not name:
        return ""
    name = name.lower().strip()
    # Remove common suffixes
    name = re.sub(r'\s+(pvt|ltd|llp|inc|corp|co)\.?\s*$', '', name)
    # Remove special chars
    name = re.sub(r'[^a-z0-9\s]', '', name)
    return name.strip()


def _months_between(d1: datetime, d2: datetime) -> int:
    return abs((d2.year - d1.year) * 12 + d2.month - d1.month)


async def _detect_patterns(db, user_id: str) -> list:
    """
    Detect recurring patterns from the last 6 months of transactions.
    A pattern = same normalized merchant, amount within ±15%, appearing in 2+ distinct months.
    """
    six_months_ago = datetime.utcnow() - timedelta(days=185)

    cursor = db.transactions.find({
        "user_id": user_id,
        "type": "expense",
        "date": {"$gte": six_months_ago},
        "amount": {"$gt": 0},
    }).sort("date", -1)

    transactions = await cursor.to_list(length=1000)

    # Group by normalized merchant
    merchant_groups = defaultdict(list)
    for tx in transactions:
        merchant = tx.get("merchant") or tx.get("title") or ""
        key = _normalize_merchant(merchant)
        if key and len(key) >= 3:
            merchant_groups[key].append(tx)

    patterns = []
    for merchant_key, txs in merchant_groups.items():
        if len(txs) < 2:
            continue

        # Check if they appear in different months
        months_seen = set()
        for tx in txs:
            date = tx.get("date")
            if date:
                if isinstance(date, datetime):
                    months_seen.add((date.year, date.month))
                else:
                    try:
                        d = datetime.fromisoformat(str(date))
                        months_seen.add((d.year, d.month))
                    except Exception:
                        pass

        if len(months_seen) < 2:
            continue

        # Check amount consistency (within ±15%)
        amounts = [tx.get("amount", 0) for tx in txs if tx.get("amount")]
        if not amounts:
            continue
        avg_amount = sum(amounts) / len(amounts)
        consistent = all(abs(a - avg_amount) / max(avg_amount, 1) <= 0.15 for a in amounts)

        if not consistent and len(amounts) > 2:
            # Check if at least 60% are consistent
            consistent_count = sum(1 for a in amounts if abs(a - avg_amount) / max(avg_amount, 1) <= 0.15)
            consistent = consistent_count / len(amounts) >= 0.6

        if not consistent:
            continue

        # Compute next payment estimate
        sorted_txs = sorted(txs, key=lambda t: t.get("date", ""), reverse=True)
        last_tx = sorted_txs[0]
        last_date = last_tx.get("date")
        if isinstance(last_date, datetime):
            last_dt = last_date
        else:
            try:
                last_dt = datetime.fromisoformat(str(last_date))
            except Exception:
                last_dt = datetime.utcnow()

        # Estimate billing cycle (monthly = 30d, weekly = 7d, annual = 365d)
        if len(months_seen) >= 2:
            billing_cycle = "monthly"
            next_payment = (last_dt + timedelta(days=30)).strftime("%Y-%m-%d")
        else:
            billing_cycle = "monthly"
            next_payment = (last_dt + timedelta(days=30)).strftime("%Y-%m-%d")

        # Get display name from most recent transaction
        display_name = last_tx.get("merchant") or last_tx.get("title") or merchant_key.title()
        category = last_tx.get("category", "Entertainment")

        patterns.append({
            "merchant": display_name,
            "merchant_key": merchant_key,
            "avg_amount": round(avg_amount, 2),
            "category": category,
            "occurrences": len(months_seen),
            "billing_cycle": billing_cycle,
            "last_payment": last_dt.strftime("%Y-%m-%d"),
            "next_payment": next_payment,
            "months_detected": sorted(list(months_seen)),
            "total_spent": round(sum(amounts), 2),
            "transaction_ids": [str(t.get("_id", "")) for t in sorted_txs[:5]],
        })

    # Sort by avg_amount desc
    patterns.sort(key=lambda p: p["avg_amount"], reverse=True)
    return patterns[:20]


@router.get("/detect")
async def detect_recurring(current_user=Depends(get_current_user)):
    """Detect recurring expense patterns from transaction history."""
    db = get_db()
    uid = str(current_user["_id"])
    patterns = await _detect_patterns(db, uid)
    return {
        "patterns": patterns,
        "total_monthly_recurring": round(sum(p["avg_amount"] for p in patterns), 2),
        "count": len(patterns),
    }


@router.get("/subscriptions")
async def get_subscriptions_summary(current_user=Depends(get_current_user)):
    """Return upcoming payments (next 30 days) from detected patterns."""
    db = get_db()
    uid = str(current_user["_id"])
    patterns = await _detect_patterns(db, uid)

    now = datetime.utcnow()
    upcoming = []
    for p in patterns:
        try:
            next_dt = datetime.fromisoformat(p["next_payment"])
            days_away = (next_dt - now).days
            if 0 <= days_away <= 30:
                upcoming.append({**p, "days_away": days_away})
        except Exception:
            pass

    upcoming.sort(key=lambda x: x["days_away"])
    return {
        "upcoming": upcoming,
        "patterns": patterns,
        "total_monthly": round(sum(p["avg_amount"] for p in patterns), 2),
    }
