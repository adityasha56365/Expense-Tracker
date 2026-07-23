# app/schemas/transaction.py
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class TransactionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., gt=0)
    type: Literal["income", "expense"]
    category: str = Field(default="Other")
    date: datetime
    payment_method: str = Field(default="UPI")
    merchant: Optional[str] = None
    note: Optional[str] = None
    source: Literal["manual", "ocr"] = "manual"


class TransactionUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[Literal["income", "expense"]] = None
    category: Optional[str] = None
    date: Optional[datetime] = None
    payment_method: Optional[str] = None
    merchant: Optional[str] = None
    note: Optional[str] = None


class TransactionOut(BaseModel):
    _id: str
    user_id: str
    title: str
    amount: float
    type: str
    category: str
    date: str
    payment_method: str
    merchant: Optional[str] = None
    note: Optional[str] = None
    source: str
    created_at: str
    updated_at: str
