# app/routes/auth.py
from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.utils.helpers import serialize_doc, now_utc
from fastapi import Depends

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest):
    db = get_db()

    # Check email exists
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    now = now_utc()
    user_doc = {
        "name": body.name.strip(),
        "email": body.email.lower(),
        "password_hash": hash_password(body.password),
        "created_at": now,
        "updated_at": now,
        "preferences": {"theme": "light", "currency": "INR"},
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_access_token({"sub": str(result.inserted_id)})
    user_out = serialize_doc(user_doc)
    user_out.pop("password_hash", None)
    user_out.pop("hashed_password", None)

    return {"access_token": token, "token_type": "bearer", "user": user_out}


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": body.email.lower()})
    
    password_hash = user.get("password_hash") or user.get("hashed_password") if user else None
    
    if not user or not password_hash or not verify_password(body.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user["_id"])})
    user_out = serialize_doc(user)
    user_out.pop("password_hash", None)
    user_out.pop("hashed_password", None)

    return {"access_token": token, "token_type": "bearer", "user": user_out}


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    user_out = serialize_doc(current_user)
    user_out.pop("password_hash", None)
    user_out.pop("hashed_password", None)
    return user_out
