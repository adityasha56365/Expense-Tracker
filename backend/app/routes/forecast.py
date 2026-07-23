# app/routes/forecast.py
from fastapi import APIRouter, Depends
from datetime import datetime
from app.core.security import get_current_user
from app.core.database import get_db
from app.services.forecast_service import compute_forecast

router = APIRouter(prefix="/forecast", tags=["Forecast"])


@router.get("/next-month")
async def get_next_month_forecast(current_user=Depends(get_current_user)):
    db = get_db()
    uid = str(current_user["_id"])
    now = datetime.utcnow()

    # Get current month's budget for comparison
    budget = await db.budgets.find_one(
        {"user_id": uid, "month": now.month, "year": now.year},
        sort=[("created_at", -1)],
    )

    result = await compute_forecast(uid, db, budget_data=budget)
    return result


@router.get("/recommendations")
async def get_recommendations(current_user=Depends(get_current_user)):
    db = get_db()
    uid = str(current_user["_id"])
    now = datetime.utcnow()

    budget = await db.budgets.find_one(
        {"user_id": uid, "month": now.month, "year": now.year}
    )

    result = await compute_forecast(uid, db, budget_data=budget)
    return {
        "recommendations": result.get("recommendations", []),
        "health_score": result.get("health_score", 70),
        "risk_level": result.get("risk_level", "low"),
    }
