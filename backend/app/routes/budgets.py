# app/routes/budgets.py
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
from app.core.security import get_current_user
from app.core.database import get_db
from app.schemas.budget import BudgetCreate, BudgetUpdate
from app.utils.helpers import serialize_doc, serialize_list, now_utc, parse_object_id

router = APIRouter(prefix="/budgets", tags=["Budgets"])


ALERT_THRESHOLDS = [
    (50, "info", "halfway"),
    (75, "warning", "three_quarters"),
    (90, "danger", "critical"),
    (100, "danger", "budget_reached"),
]


@router.get("")
async def get_budgets(current_user=Depends(get_current_user)):
    db = get_db()
    cursor = db.budgets.find({"user_id": str(current_user["_id"])}).sort([("year", -1), ("month", -1)])
    docs = await cursor.to_list(length=100)
    return serialize_list(docs)


@router.post("", status_code=201)
async def create_budget(body: BudgetCreate, current_user=Depends(get_current_user)):
    db = get_db()
    uid = str(current_user["_id"])

    # Check if budget for this month/year already exists
    existing = await db.budgets.find_one({"user_id": uid, "month": body.month, "year": body.year})
    if existing:
        raise HTTPException(status_code=400, detail="Budget for this month/year already exists")

    now = now_utc()
    doc = body.model_dump()
    doc["user_id"] = uid
    doc["created_at"] = now
    doc["updated_at"] = now

    result = await db.budgets.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.put("/{budget_id}")
async def update_budget(budget_id: str, body: BudgetUpdate, current_user=Depends(get_current_user)):
    db = get_db()
    oid = parse_object_id(budget_id)
    budget = await db.budgets.find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    update_data = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = now_utc()
    await db.budgets.update_one({"_id": oid}, {"$set": update_data})
    updated = await db.budgets.find_one({"_id": oid})
    return serialize_doc(updated)


@router.delete("/{budget_id}")
async def delete_budget(budget_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    oid = parse_object_id(budget_id)
    result = await db.budgets.delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "Budget deleted"}


@router.get("/alerts")
async def get_budget_alerts(current_user=Depends(get_current_user)):
    """
    Compute smart budget alerts for the current month.
    Returns alerts at 50%, 75%, 90%, 100%, and over-budget thresholds.
    """
    db = get_db()
    uid = str(current_user["_id"])
    now = datetime.utcnow()
    m, y = now.month, now.year

    # Get current month budget
    budget = await db.budgets.find_one({"user_id": uid, "month": m, "year": y})
    if not budget:
        return {"alerts": [], "has_budget": False}

    # Get current month transactions
    start = datetime(y, m, 1)
    end = datetime(y, m + 1, 1) if m < 12 else datetime(y + 1, 1, 1)
    cursor = db.transactions.find({
        "user_id": uid,
        "type": "expense",
        "date": {"$gte": start, "$lt": end},
    })
    txs = await cursor.to_list(length=2000)

    total_spent = sum(t.get("amount", 0) for t in txs)
    total_budget = budget.get("total_budget", 0)
    alerts = []

    # Overall budget alert
    if total_budget > 0:
        pct = (total_spent / total_budget) * 100
        for threshold, level, alert_type in ALERT_THRESHOLDS:
            if pct >= threshold:
                alerts.append({
                    "type": alert_type,
                    "level": level,
                    "title": f"Budget {alert_type.replace('_', ' ').title()}",
                    "message": f"You've spent {pct:.0f}% of your monthly budget ({total_spent:.0f}/{total_budget:.0f})",
                    "pct": round(pct, 1),
                    "spent": round(total_spent, 2),
                    "budget": total_budget,
                    "category": None,
                })
                break  # Only highest threshold

    # Category-level alerts
    category_spent = {}
    for tx in txs:
        cat = tx.get("category", "Other")
        category_spent[cat] = category_spent.get(cat, 0) + tx.get("amount", 0)

    for cb in (budget.get("category_budgets") or []):
        cat = cb.get("category")
        cat_budget = cb.get("budget", 0)
        cat_spent = category_spent.get(cat, 0)
        if cat_budget <= 0:
            continue
        cat_pct = (cat_spent / cat_budget) * 100
        for threshold, level, alert_type in ALERT_THRESHOLDS:
            if cat_pct >= threshold:
                alerts.append({
                    "type": alert_type,
                    "level": level,
                    "title": f"{cat} Budget Alert",
                    "message": f"{cat} spending is at {cat_pct:.0f}% of limit ({cat_spent:.0f}/{cat_budget:.0f})",
                    "pct": round(cat_pct, 1),
                    "spent": round(cat_spent, 2),
                    "budget": cat_budget,
                    "category": cat,
                })
                break

    return {
        "alerts": alerts,
        "has_budget": True,
        "total_spent": round(total_spent, 2),
        "total_budget": total_budget,
        "overall_pct": round((total_spent / total_budget * 100) if total_budget > 0 else 0, 1),
    }
