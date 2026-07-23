# app/utils/helpers.py
from bson import ObjectId
from datetime import datetime


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable dict and normalize user fields."""
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if key == "_id":
            result["_id"] = str(value)
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, list):
            result[key] = [serialize_doc(v) if isinstance(v, dict) else v for v in value]
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
        else:
            result[key] = value
            
    # Normalize user schema key names
    if "hashed_password" in result and "password_hash" not in result:
        result["password_hash"] = result["hashed_password"]
    if "full_name" in result and "name" not in result:
        result["name"] = result["full_name"]
        
    return result


def serialize_list(docs: list) -> list:
    return [serialize_doc(doc) for doc in docs]


def now_utc() -> datetime:
    return datetime.utcnow()


def parse_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Invalid ID: {id_str}")
