# app/routes/users.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.core.security import get_current_user
from app.core.database import get_db
from app.utils.helpers import serialize_doc, now_utc

router = APIRouter(prefix="/users", tags=["Users"])


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    preferences: Optional[dict] = None


@router.get("/profile")
async def get_profile(current_user=Depends(get_current_user)):
    user_out = serialize_doc(current_user)
    user_out.pop("password_hash", None)
    user_out.pop("hashed_password", None)
    return user_out


@router.put("/profile")
async def update_profile(body: ProfileUpdate, current_user=Depends(get_current_user)):
    db = get_db()
    from bson import ObjectId

    update_data = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # In sync with old schema
    if "name" in update_data:
        update_data["full_name"] = update_data["name"]

    update_data["updated_at"] = now_utc()
    await db.users.update_one({"_id": current_user["_id"]}, {"$set": update_data})
    updated = await db.users.find_one({"_id": current_user["_id"]})
    user_out = serialize_doc(updated)
    user_out.pop("password_hash", None)
    user_out.pop("hashed_password", None)
    return user_out
