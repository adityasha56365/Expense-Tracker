# app/routes/goals.py
"""
Savings Goals API
Supports: CRUD, contributions, progress tracking, AI completion estimate.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
from bson import ObjectId

from app.core.security import get_current_user
from app.core.database import get_db
from app.utils.helpers import serialize_doc, serialize_list, now_utc, parse_object_id

router = APIRouter(prefix="/goals", tags=["Goals"])


# ── Schemas ─────────────────────────────────────────────────────────────────

class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    target_amount: float = Field(..., gt=0)
    current_amount: float = Field(default=0.0, ge=0)
    target_date: Optional[str] = None  # ISO date string YYYY-MM-DD
    icon: Optional[str] = "🎯"
    color: Optional[str] = "#6366f1"
    description: Optional[str] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    target_date: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None


class ContributeRequest(BaseModel):
    amount: float = Field(..., gt=0)
    note: Optional[str] = None


# ── Helpers ──────────────────────────────────────────────────────────────────

def _compute_goal_meta(goal: dict) -> dict:
    """Compute derived fields: progress%, estimated completion date, monthly needed."""
    current = goal.get("current_amount", 0)
    target = goal.get("target_amount", 1)
    progress_pct = min(round((current / target) * 100, 1), 100)
    remaining = max(target - current, 0)
    is_completed = current >= target

    estimated_completion = None
    monthly_needed = None

    # Use contribution history to estimate velocity
    contributions = goal.get("contributions", [])
    if contributions and len(contributions) >= 2:
        # Calculate average monthly contribution
        sorted_contribs = sorted(contributions, key=lambda c: c["date"])
        first = datetime.fromisoformat(sorted_contribs[0]["date"])
        last = datetime.fromisoformat(sorted_contribs[-1]["date"])
        months_elapsed = max((last - first).days / 30, 1)
        total_contributed = sum(c["amount"] for c in contributions)
        monthly_rate = total_contributed / months_elapsed

        if monthly_rate > 0 and remaining > 0:
            months_to_go = remaining / monthly_rate
            estimated_completion = (datetime.utcnow() + timedelta(days=months_to_go * 30)).strftime("%Y-%m-%d")
        monthly_needed = round(monthly_rate, 2)
    elif goal.get("target_date"):
        target_date = datetime.fromisoformat(goal["target_date"])
        months_left = max((target_date - datetime.utcnow()).days / 30, 1)
        monthly_needed = round(remaining / months_left, 2) if months_left > 0 else remaining
        estimated_completion = goal["target_date"]

    return {
        **goal,
        "progress_pct": progress_pct,
        "remaining_amount": round(remaining, 2),
        "is_completed": is_completed,
        "estimated_completion": estimated_completion,
        "monthly_needed": monthly_needed,
    }


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("")
async def get_goals(current_user=Depends(get_current_user)):
    db = get_db()
    uid = str(current_user["_id"])
    cursor = db.goals.find({"user_id": uid}).sort("created_at", -1)
    docs = await cursor.to_list(length=100)
    serialized = serialize_list(docs)
    return [_compute_goal_meta(g) for g in serialized]


@router.post("", status_code=201)
async def create_goal(body: GoalCreate, current_user=Depends(get_current_user)):
    db = get_db()
    uid = str(current_user["_id"])
    now = now_utc()

    doc = body.model_dump()
    doc["user_id"] = uid
    doc["contributions"] = []
    doc["is_completed"] = False
    doc["created_at"] = now
    doc["updated_at"] = now

    # Validate target_date if provided
    if doc.get("target_date"):
        try:
            datetime.fromisoformat(doc["target_date"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid target_date format. Use YYYY-MM-DD")

    result = await db.goals.insert_one(doc)
    doc["_id"] = result.inserted_id
    serialized = serialize_doc(doc)
    return _compute_goal_meta(serialized)


@router.get("/{goal_id}")
async def get_goal(goal_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    oid = parse_object_id(goal_id)
    goal = await db.goals.find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    serialized = serialize_doc(goal)
    return _compute_goal_meta(serialized)


@router.put("/{goal_id}")
async def update_goal(goal_id: str, body: GoalUpdate, current_user=Depends(get_current_user)):
    db = get_db()
    oid = parse_object_id(goal_id)
    goal = await db.goals.find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    update_data = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = now_utc()

    await db.goals.update_one({"_id": oid}, {"$set": update_data})
    updated = await db.goals.find_one({"_id": oid})
    serialized = serialize_doc(updated)
    return _compute_goal_meta(serialized)


@router.post("/{goal_id}/contribute")
async def contribute_to_goal(
    goal_id: str,
    body: ContributeRequest,
    current_user=Depends(get_current_user),
):
    db = get_db()
    oid = parse_object_id(goal_id)
    goal = await db.goals.find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    contribution = {
        "amount": body.amount,
        "note": body.note,
        "date": datetime.utcnow().isoformat(),
    }

    new_current = goal.get("current_amount", 0) + body.amount
    is_completed = new_current >= goal["target_amount"]

    await db.goals.update_one(
        {"_id": oid},
        {
            "$set": {
                "current_amount": new_current,
                "is_completed": is_completed,
                "updated_at": now_utc(),
            },
            "$push": {"contributions": contribution},
        }
    )
    updated = await db.goals.find_one({"_id": oid})
    serialized = serialize_doc(updated)
    return {
        **_compute_goal_meta(serialized),
        "just_completed": is_completed and not goal.get("is_completed"),
    }


@router.delete("/{goal_id}")
async def delete_goal(goal_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    oid = parse_object_id(goal_id)
    result = await db.goals.delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted"}


@router.get("/{goal_id}/suggestions")
async def get_goal_suggestions(goal_id: str, current_user=Depends(get_current_user)):
    """AI-style suggestions for reaching the goal faster."""
    db = get_db()
    oid = parse_object_id(goal_id)
    goal = await db.goals.find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    remaining = max(goal["target_amount"] - goal.get("current_amount", 0), 0)
    target_date = goal.get("target_date")

    suggestions = []
    if target_date:
        months_left = max((datetime.fromisoformat(target_date) - datetime.utcnow()).days / 30, 1)
        monthly_needed = remaining / months_left
        suggestions.append({
            "icon": "💰",
            "title": f"Save ₹{monthly_needed:,.0f}/month",
            "body": f"To reach your goal by {target_date}, set aside this amount every month."
        })

    suggestions += [
        {
            "icon": "🤖",
            "title": "Automate your savings",
            "body": "Set up a standing instruction to transfer money on salary day before you spend it."
        },
        {
            "icon": "✂️",
            "title": "Cut one subscription",
            "body": "Cancelling one unused streaming service can free up ₹200–₹800/month toward your goal."
        },
        {
            "icon": "📊",
            "title": "Round-up spare change",
            "body": "Round up every UPI transaction to the nearest ₹100 and save the difference."
        },
    ]
    return suggestions[:4]
