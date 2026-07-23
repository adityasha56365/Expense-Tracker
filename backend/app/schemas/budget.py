# app/schemas/budget.py
from pydantic import BaseModel, Field
from typing import Optional, List


class CategoryBudget(BaseModel):
    category: str
    budget: float = Field(..., gt=0)


class BudgetCreate(BaseModel):
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020, le=2100)
    total_budget: float = Field(..., gt=0)
    category_budgets: List[CategoryBudget] = []


class BudgetUpdate(BaseModel):
    total_budget: Optional[float] = None
    category_budgets: Optional[List[CategoryBudget]] = None


# app/schemas/receipt.py
from pydantic import BaseModel
from typing import Optional


class OcrResponse(BaseModel):
    merchant: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    raw_text: str = ""
    predicted_category: str = "Other"
    confidence: float = 0.0
    extraction_notes: Optional[str] = None
