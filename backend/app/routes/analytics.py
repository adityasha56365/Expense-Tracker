# app/routes/analytics.py
from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, timedelta
from app.core.security import get_current_user
from app.core.database import get_db
from app.utils.helpers import serialize_list
from app.utils.constants import CATEGORIES

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _uid(current_user) -> str:
    return str(current_user["_id"])


@router.get("/summary")
async def get_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user=Depends(get_current_user),
):
    db = get_db()
    uid = _uid(current_user)
    now = datetime.utcnow()
    m = month or now.month
    y = year or now.year

    start = datetime(y, m, 1)
    if m == 12:
        end = datetime(y + 1, 1, 1)
    else:
        end = datetime(y, m + 1, 1)

    pipeline = [
        {"$match": {"user_id": uid, "date": {"$gte": start, "$lt": end}}},
        {"$group": {
            "_id": "$type",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1},
        }},
    ]
    result = await db.transactions.aggregate(pipeline).to_list(length=10)

    income = next((r["total"] for r in result if r["_id"] == "income"), 0)
    expense = next((r["total"] for r in result if r["_id"] == "expense"), 0)
    count = sum(r["count"] for r in result)
    balance = income - expense
    savings_rate = (balance / income * 100) if income > 0 else 0

    # Days in month
    days_elapsed = min(now.day, (end - start).days) if m == now.month and y == now.year else (end - start).days
    avg_daily = expense / max(days_elapsed, 1)

    # Top category
    cat_pipeline = [
        {"$match": {"user_id": uid, "type": "expense", "date": {"$gte": start, "$lt": end}}},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}},
        {"$sort": {"total": -1}},
        {"$limit": 1},
    ]
    top_cat = await db.transactions.aggregate(cat_pipeline).to_list(length=1)
    top_category = top_cat[0]["_id"] if top_cat else "N/A"

    return {
        "total_balance": round(balance, 2),
        "total_income": round(income, 2),
        "total_expense": round(expense, 2),
        "savings_rate": round(savings_rate, 1),
        "avg_daily_spend": round(avg_daily, 2),
        "top_category": top_category,
        "transaction_count": count,
        "month": m,
        "year": y,
    }


@router.get("/monthly-trend")
async def get_monthly_trend(
    months: int = Query(default=6, le=24),
    current_user=Depends(get_current_user),
):
    db = get_db()
    uid = _uid(current_user)
    now = datetime.utcnow()

    start = datetime(now.year, now.month, 1) - timedelta(days=months * 31)
    pipeline = [
        {"$match": {"user_id": uid, "date": {"$gte": start}}},
        {"$group": {
            "_id": {
                "year": {"$year": "$date"},
                "month": {"$month": "$date"},
                "type": "$type",
            },
            "total": {"$sum": "$amount"},
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}},
    ]
    result = await db.transactions.aggregate(pipeline).to_list(length=200)

    # Build monthly structure
    monthly: dict = {}
    MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for row in result:
        key = f"{row['_id']['year']}-{row['_id']['month']:02d}"
        if key not in monthly:
            monthly[key] = {
                "month": MONTH_NAMES[row["_id"]["month"] - 1],
                "year": row["_id"]["year"],
                "income": 0,
                "expense": 0,
            }
        monthly[key][row["_id"]["type"]] = round(row["total"], 2)

    return sorted(monthly.values(), key=lambda x: (x["year"], MONTH_NAMES.index(x["month"])))


@router.get("/category-breakdown")
async def get_category_breakdown(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user=Depends(get_current_user),
):
    db = get_db()
    uid = _uid(current_user)
    now = datetime.utcnow()
    m = month or now.month
    y = year or now.year

    start = datetime(y, m, 1)
    end = datetime(y, m + 1, 1) if m < 12 else datetime(y + 1, 1, 1)

    pipeline = [
        {"$match": {"user_id": uid, "type": "expense", "date": {"$gte": start, "$lt": end}}},
        {"$group": {"_id": "$category", "amount": {"$sum": "$amount"}}},
        {"$sort": {"amount": -1}},
    ]
    result = await db.transactions.aggregate(pipeline).to_list(length=20)
    return [{"category": r["_id"], "amount": round(r["amount"], 2)} for r in result]


@router.get("/income-vs-expense")
async def get_income_vs_expense(
    months: int = Query(default=6, le=24),
    current_user=Depends(get_current_user),
):
    return await get_monthly_trend(months=months, current_user=current_user)


@router.get("/yearly-overview")
async def get_yearly_overview(
    year: Optional[int] = None,
    current_user=Depends(get_current_user),
):
    db = get_db()
    uid = _uid(current_user)
    y = year or datetime.utcnow().year

    start = datetime(y, 1, 1)
    end = datetime(y + 1, 1, 1)

    pipeline = [
        {"$match": {"user_id": uid, "date": {"$gte": start, "$lt": end}}},
        {"$group": {
            "_id": {"month": {"$month": "$date"}, "type": "$type"},
            "total": {"$sum": "$amount"},
        }},
    ]
    result = await db.transactions.aggregate(pipeline).to_list(length=50)

    MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly = {i: {"month": MONTH_NAMES[i - 1], "income": 0, "expense": 0} for i in range(1, 13)}

    for row in result:
        m_idx = row["_id"]["month"]
        monthly[m_idx][row["_id"]["type"]] = round(row["total"], 2)

    return list(monthly.values())
