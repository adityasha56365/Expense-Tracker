# app/routes/splits.py
"""
Bill Splitting API
Supports: equal split, percentage split, custom amount split.
Tracks payment status per participant.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

from app.core.security import get_current_user
from app.core.database import get_db
from app.utils.helpers import serialize_doc, serialize_list, now_utc, parse_object_id

router = APIRouter(prefix="/splits", tags=["Bill Splits"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class Participant(BaseModel):
    name: str
    email: Optional[str] = None
    share: Optional[float] = None   # Amount or percentage depending on split_type
    paid: bool = False


class SplitCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    total_amount: float = Field(..., gt=0)
    split_type: str = Field(default="equal")   # equal | percentage | custom
    participants: List[Participant] = Field(..., min_length=2)
    note: Optional[str] = None
    category: Optional[str] = "Other"
    date: Optional[str] = None


class SplitUpdate(BaseModel):
    title: Optional[str] = None
    note: Optional[str] = None


class SettleRequest(BaseModel):
    participant_name: str
    paid: bool = True


# ── Helpers ──────────────────────────────────────────────────────────────────

def _compute_shares(total: float, split_type: str, participants: list) -> list:
    """Compute each participant's actual share amount."""
    result = []
    n = len(participants)

    if split_type == "equal":
        share_amount = round(total / n, 2)
        # Fix rounding on last participant
        shares = [share_amount] * n
        shares[-1] = round(total - sum(shares[:-1]), 2)
        for i, p in enumerate(participants):
            result.append({**p, "share": shares[i], "share_pct": round(100 / n, 1)})

    elif split_type == "percentage":
        total_pct = sum(p.get("share", 0) for p in participants)
        if abs(total_pct - 100) > 0.01:
            raise HTTPException(
                status_code=400,
                detail=f"Percentages must sum to 100. Got {total_pct}"
            )
        for p in participants:
            amount = round(total * p.get("share", 0) / 100, 2)
            result.append({**p, "share_amount": amount, "share_pct": p.get("share", 0)})

    elif split_type == "custom":
        total_custom = sum(p.get("share", 0) for p in participants)
        if abs(total_custom - total) > 0.5:
            raise HTTPException(
                status_code=400,
                detail=f"Custom shares must sum to total. Got {total_custom}, expected {total}"
            )
        for p in participants:
            result.append({**p, "share_amount": p.get("share", 0), "share_pct": round(p.get("share", 0) / total * 100, 1)})
    else:
        raise HTTPException(status_code=400, detail="split_type must be: equal | percentage | custom")

    return result


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("")
async def get_splits(current_user=Depends(get_current_user)):
    db = get_db()
    uid = str(current_user["_id"])
    cursor = db.splits.find({"user_id": uid}).sort("created_at", -1)
    docs = await cursor.to_list(length=100)
    return serialize_list(docs)


@router.post("", status_code=201)
async def create_split(body: SplitCreate, current_user=Depends(get_current_user)):
    db = get_db()
    uid = str(current_user["_id"])
    now = now_utc()

    participants_data = [p.model_dump() for p in body.participants]
    computed_participants = _compute_shares(body.total_amount, body.split_type, participants_data)

    doc = {
        "user_id": uid,
        "title": body.title,
        "total_amount": body.total_amount,
        "split_type": body.split_type,
        "participants": computed_participants,
        "note": body.note,
        "category": body.category,
        "date": body.date or datetime.utcnow().isoformat(),
        "status": "pending",  # pending | settled
        "created_at": now,
        "updated_at": now,
    }

    result = await db.splits.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.get("/{split_id}")
async def get_split(split_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    oid = parse_object_id(split_id)
    split = await db.splits.find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not split:
        raise HTTPException(status_code=404, detail="Split not found")
    return serialize_doc(split)


@router.put("/{split_id}/settle")
async def settle_participant(
    split_id: str,
    body: SettleRequest,
    current_user=Depends(get_current_user),
):
    db = get_db()
    oid = parse_object_id(split_id)
    split = await db.splits.find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not split:
        raise HTTPException(status_code=404, detail="Split not found")

    # Update participant paid status
    participants = split.get("participants", [])
    updated = False
    for p in participants:
        if p.get("name", "").lower() == body.participant_name.lower():
            p["paid"] = body.paid
            p["paid_at"] = datetime.utcnow().isoformat() if body.paid else None
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail="Participant not found")

    # Check if fully settled
    all_paid = all(p.get("paid", False) for p in participants)
    status = "settled" if all_paid else "pending"

    await db.splits.update_one(
        {"_id": oid},
        {"$set": {"participants": participants, "status": status, "updated_at": now_utc()}}
    )
    updated_split = await db.splits.find_one({"_id": oid})
    return serialize_doc(updated_split)


@router.delete("/{split_id}")
async def delete_split(split_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    oid = parse_object_id(split_id)
    result = await db.splits.delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Split not found")
    return {"message": "Split deleted"}
