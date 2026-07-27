# app/services/forecast_service.py
"""
Spending Forecast Service
Uses weighted moving average + simple linear regression on historical data.
Generates category-level recommendations.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any


def _weighted_average(values: List[float], weights: List[float] = None) -> float:
    """Compute weighted moving average. Recent values have higher weight."""
    if not values:
        return 0.0
    if weights is None:
        # Exponentially increasing weights (most recent = highest)
        n = len(values)
        weights = [2 ** i for i in range(n)]
    total_weight = sum(weights)
    return sum(v * w for v, w in zip(values, weights)) / total_weight


def _linear_trend(values: List[float]) -> float:
    """Simple linear regression slope for trend detection."""
    if len(values) < 2:
        return 0.0
    n = len(values)
    x = list(range(n))
    x_mean = sum(x) / n
    y_mean = sum(values) / n
    numerator = sum((x[i] - x_mean) * (values[i] - y_mean) for i in range(n))
    denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
    if denominator == 0:
        return 0.0
    return numerator / denominator


def _assess_risk(predicted: float, budget: float) -> str:
    if budget <= 0:
        return "medium"
    ratio = predicted / budget
    if ratio >= 1.0:
        return "high"
    elif ratio >= 0.8:
        return "medium"
    return "low"


def _generate_recommendations(
    category_trends: Dict[str, List[float]],
    category_budgets: Dict[str, float],
) -> List[Dict[str, str]]:
    """Generate natural-language spending recommendations per category."""
    CATEGORY_ICONS = {
        "Food": "🍽️", "Transport": "🚗", "Utilities": "💡",
        "Shopping": "🛍️", "Entertainment": "🎬", "Health": "🏥",
        "Education": "📚", "Other": "📦",
    }

    recommendations = []

    for category, spends in category_trends.items():
        if not spends:
            continue
        avg = sum(spends) / len(spends)
        latest = spends[-1] if spends else 0
        slope = _linear_trend(spends)
        budget = category_budgets.get(category, 0)
        icon = CATEGORY_ICONS.get(category, "💡")

        if len(spends) >= 2 and slope > avg * 0.1:
            recommendations.append({
                "category": category,
                "icon": icon,
                "message": (
                    f"{category} spending is trending upward — {slope/avg*100:.0f}% "
                    f"growth over last {len(spends)} months. Consider reviewing."
                ),
            })
        elif budget > 0 and latest > budget:
            over_by = ((latest - budget) / budget * 100)
            recommendations.append({
                "category": category,
                "icon": icon,
                "message": (
                    f"{category} exceeded budget by {over_by:.0f}% last month. "
                    f"Setting a stricter limit may help."
                ),
            })
        elif budget > 0 and latest < budget * 0.5:
            recommendations.append({
                "category": category,
                "icon": icon,
                "message": (
                    f"{category} is well under budget at {latest/budget*100:.0f}% utilization. "
                    f"Great discipline!"
                ),
            })

    # Limit to top 4 most relevant recommendations
    return recommendations[:4]


async def compute_forecast(user_id: str, db, budget_data: dict = None) -> dict:
    """
    Main forecast computation:
    1. Pull last 3-6 months of expense data
    2. Compute weighted moving average per category
    3. Predict next month's total
    4. Compare to budget
    5. Generate recommendations
    """
    now = datetime.utcnow()
    six_months_ago = now - timedelta(days=180)

    # Fetch monthly expense data
    pipeline = [
        {
            "$match": {
                "user_id": user_id,
                "type": "expense",
                "date": {"$gte": six_months_ago},
            }
        },
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$date"},
                    "month": {"$month": "$date"},
                    "category": "$category",
                },
                "total": {"$sum": "$amount"},
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}},
    ]

    result = await db.transactions.aggregate(pipeline).to_list(length=500)

    # Structure data by month
    monthly_totals: Dict[str, float] = {}
    category_monthly: Dict[str, List[float]] = {}

    for row in result:
        key = f"{row['_id']['year']}-{row['_id']['month']:02d}"
        cat = row["_id"]["category"]
        val = row["total"]

        monthly_totals[key] = monthly_totals.get(key, 0) + val

        if cat not in category_monthly:
            category_monthly[cat] = []
        category_monthly[cat].append(val)

    # Monthly totals list (sorted by time)
    sorted_totals = [v for _, v in sorted(monthly_totals.items())]

    # Exclude current incomplete month
    if len(sorted_totals) > 1:
        sorted_totals = sorted_totals[:-1]

    if not sorted_totals:
        return {
            "predicted_spend": 0,
            "expected_vs_budget": 0,
            "risk_level": "low",
            "trend": "stable",
            "top_overspending": [],
            "recommendations": [],
            "health_score": 80,
        }

    # Predict next month
    predicted_spend = _weighted_average(sorted_totals[-6:] if len(sorted_totals) >= 6 else sorted_totals)
    slope = _linear_trend(sorted_totals)

    # Apply trend adjustment (max ±15%)
    adjustment = min(max(slope / max(predicted_spend, 1), -0.15), 0.15)
    predicted_spend = predicted_spend * (1 + adjustment)
    predicted_spend = round(max(predicted_spend, 0), 2)

    # Trend classification
    pct_change = slope / max(sum(sorted_totals) / len(sorted_totals), 1) * 100
    if pct_change > 5:
        trend = "increasing"
    elif pct_change < -5:
        trend = "decreasing"
    else:
        trend = "stable"

    # Budget comparison
    total_budget = budget_data.get("total_budget", 0) if budget_data else 0
    expected_vs_budget = (predicted_spend / total_budget * 100) if total_budget > 0 else 70.0
    risk_level = _assess_risk(predicted_spend, total_budget)

    # Category-level analysis
    cat_budgets = {}
    if budget_data and "category_budgets" in budget_data:
        for cb in budget_data["category_budgets"]:
            cat_budgets[cb["category"]] = cb["budget"]

    top_overspending = [
        cat for cat, spends in category_monthly.items()
        if spends and cat_budgets.get(cat, 0) > 0 and spends[-1] > cat_budgets[cat]
    ][:3]

    recommendations = _generate_recommendations(category_monthly, cat_budgets)

    # Try Gemini AI for dynamic insights if configured
    try:
        from app.services.gemini_service import is_gemini_configured, generate_ai_insights_with_gemini
        if is_gemini_configured():
            ai_data = await generate_ai_insights_with_gemini(monthly_totals, category_monthly, total_budget)
            if ai_data and isinstance(ai_data, dict) and "recommendations" in ai_data:
                ai_recs = ai_data.get("recommendations", [])
                if ai_recs:
                    recommendations = ai_recs
    except Exception as gem_err:
        print(f"Gemini forecast insights notice: {gem_err}")

    # Health score (0–100)
    savings_score = min((1 - predicted_spend / max(total_budget, predicted_spend * 1.2)) * 50, 50)
    trend_score = 30 if trend == "stable" else 20 if trend == "decreasing" else 15
    consistency_score = 20 if len(sorted_totals) >= 3 else 10
    health_score = int(max(0, min(100, savings_score + trend_score + consistency_score)))

    return {
        "predicted_spend": predicted_spend,
        "expected_vs_budget": round(expected_vs_budget, 1),
        "risk_level": risk_level,
        "trend": trend,
        "top_overspending": top_overspending,
        "recommendations": recommendations,
        "health_score": health_score,
        "months_analyzed": len(sorted_totals),
    }
