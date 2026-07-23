# app/routes/transactions.py
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from bson import ObjectId
from app.core.security import get_current_user
from app.core.database import get_db
from app.schemas.transaction import TransactionCreate, TransactionUpdate
from app.utils.helpers import serialize_doc, serialize_list, now_utc, parse_object_id
from app.services.ml_service import predict_category

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("")
async def get_transactions(
    type: Optional[str] = None,
    category: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = Query(default=200, le=500),
    skip: int = 0,
    current_user=Depends(get_current_user),
):
    db = get_db()
    query = {"user_id": str(current_user["_id"])}

    if type: query["type"] = type
    if category: query["category"] = category
    if date_from or date_to:
        query["date"] = {}
        if date_from:
            from datetime import datetime
            query["date"]["$gte"] = datetime.fromisoformat(date_from)
        if date_to:
            from datetime import datetime
            query["date"]["$lte"] = datetime.fromisoformat(date_to)

    cursor = db.transactions.find(query).sort("date", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return serialize_list(docs)


@router.post("", status_code=201)
async def create_transaction(body: TransactionCreate, current_user=Depends(get_current_user)):
    db = get_db()
    now = now_utc()
    doc = body.model_dump()
    doc["user_id"] = str(current_user["_id"])
    doc["created_at"] = now
    doc["updated_at"] = now

    # Auto-predict category if not specified or is default
    if doc.get("category") == "Other" and doc.get("title"):
        text = f"{doc['title']} {doc.get('merchant', '')} {doc.get('note', '')}"
        predicted, confidence = predict_category(text)
        if confidence > 0.3:
            doc["category"] = predicted

    result = await db.transactions.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.put("/{transaction_id}")
async def update_transaction(
    transaction_id: str,
    body: TransactionUpdate,
    current_user=Depends(get_current_user),
):
    db = get_db()
    oid = parse_object_id(transaction_id)
    tx = await db.transactions.find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    update_data = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = now_utc()
    await db.transactions.update_one({"_id": oid}, {"$set": update_data})
    updated = await db.transactions.find_one({"_id": oid})
    return serialize_doc(updated)


@router.delete("/{transaction_id}")
async def delete_transaction(transaction_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    oid = parse_object_id(transaction_id)
    result = await db.transactions.delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted"}


@router.get("/search")
async def search_transactions(
    q: str = Query(..., min_length=1),
    current_user=Depends(get_current_user),
):
    db = get_db()
    query = {
        "user_id": str(current_user["_id"]),
        "$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"merchant": {"$regex": q, "$options": "i"}},
            {"note": {"$regex": q, "$options": "i"}},
        ],
    }
    cursor = db.transactions.find(query).sort("date", -1).limit(50)
    docs = await cursor.to_list(length=50)
    return serialize_list(docs)
