# app/seed/seed_data.py
"""
Seed Script — populates MongoDB with realistic demo data.
Run: python -m app.seed.seed_data
"""

import asyncio
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os
import certifi

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.core.config import get_settings
from app.core.security import hash_password

settings = get_settings()


def days_ago(n: int) -> datetime:
    return datetime.utcnow() - timedelta(days=n)


TRANSACTIONS = [
    {"title": "Swiggy Order", "amount": 480, "type": "expense", "category": "Food", "days_ago": 1, "merchant": "Swiggy", "payment_method": "UPI"},
    {"title": "Freelance Project - UI Design", "amount": 15000, "type": "income", "category": "Freelance", "days_ago": 2, "merchant": None, "payment_method": "NetBanking"},
    {"title": "Metro Card Recharge", "amount": 500, "type": "expense", "category": "Transport", "days_ago": 3, "merchant": "Delhi Metro", "payment_method": "UPI"},
    {"title": "Zomato Lunch", "amount": 320, "type": "expense", "category": "Food", "days_ago": 3, "merchant": "Zomato", "payment_method": "UPI"},
    {"title": "Electricity Bill", "amount": 1850, "type": "expense", "category": "Utilities", "days_ago": 5, "merchant": "BSES Delhi", "payment_method": "NetBanking"},
    {"title": "Amazon Books", "amount": 1200, "type": "expense", "category": "Shopping", "days_ago": 6, "merchant": "Amazon", "payment_method": "Card"},
    {"title": "Netflix Subscription", "amount": 649, "type": "expense", "category": "Entertainment", "days_ago": 7, "merchant": "Netflix", "payment_method": "Card"},
    {"title": "Gym Membership", "amount": 1500, "type": "expense", "category": "Health", "days_ago": 8, "merchant": "Cult.fit", "payment_method": "UPI"},
    {"title": "Udemy Course - React", "amount": 499, "type": "expense", "category": "Education", "days_ago": 10, "merchant": "Udemy", "payment_method": "Card"},
    {"title": "Salary - Part Time", "amount": 25000, "type": "income", "category": "Salary", "days_ago": 10, "merchant": None, "payment_method": "NetBanking"},
    {"title": "Petrol - Bike", "amount": 800, "type": "expense", "category": "Transport", "days_ago": 12, "merchant": "HP Petrol Pump", "payment_method": "Cash"},
    {"title": "Dominos Pizza", "amount": 580, "type": "expense", "category": "Food", "days_ago": 13, "merchant": "Dominos", "payment_method": "UPI"},
    {"title": "Mobile Recharge", "amount": 299, "type": "expense", "category": "Utilities", "days_ago": 14, "merchant": "Airtel", "payment_method": "UPI"},
    {"title": "Myntra Shopping", "amount": 2200, "type": "expense", "category": "Shopping", "days_ago": 15, "merchant": "Myntra", "payment_method": "Card"},
    {"title": "Freelance - Logo Design", "amount": 8000, "type": "income", "category": "Freelance", "days_ago": 16, "merchant": None, "payment_method": "UPI"},
    {"title": "Grocery - BigBasket", "amount": 1650, "type": "expense", "category": "Food", "days_ago": 20, "merchant": "BigBasket", "payment_method": "UPI"},
    {"title": "Doctor Consultation", "amount": 700, "type": "expense", "category": "Health", "days_ago": 22, "merchant": "City Clinic", "payment_method": "Cash"},
    {"title": "Spotify Premium", "amount": 119, "type": "expense", "category": "Entertainment", "days_ago": 25, "merchant": "Spotify", "payment_method": "Card"},
    {"title": "Ola Ride", "amount": 220, "type": "expense", "category": "Transport", "days_ago": 27, "merchant": "Ola", "payment_method": "Wallet"},
    {"title": "Scholarship Disbursement", "amount": 5000, "type": "income", "category": "Other", "days_ago": 30, "merchant": None, "payment_method": "NetBanking"},
]

BUDGET = {
    "month": datetime.utcnow().month,
    "year": datetime.utcnow().year,
    "total_budget": 35000,
    "category_budgets": [
        {"category": "Food", "budget": 8000},
        {"category": "Transport", "budget": 3000},
        {"category": "Utilities", "budget": 3500},
        {"category": "Shopping", "budget": 5000},
        {"category": "Entertainment", "budget": 2000},
        {"category": "Health", "budget": 3000},
        {"category": "Education", "budget": 2000},
    ],
}


async def seed():
    client = AsyncIOMotorClient(settings.MONGODB_URL, tlsCAFile=certifi.where())
    db = client[settings.DATABASE_NAME]

    print("Starting seed process...")

    # Create demo user
    existing = await db.users.find_one({"email": "demo@smartexpensetracker.in"})
    if existing:
        user_id = str(existing["_id"])
        print(f"Demo user already exists: {user_id}")
    else:
        now = datetime.utcnow()
        user_doc = {
            "name": "Aditya Kumar",
            "email": "demo@smartexpensetracker.in",
            "password_hash": hash_password("demo1234"),
            "created_at": now,
            "updated_at": now,
            "preferences": {"theme": "light", "currency": "INR"},
        }
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        print(f"Demo user created: {user_id}")

    # Clear existing data for this user
    await db.transactions.delete_many({"user_id": user_id})
    await db.budgets.delete_many({"user_id": user_id})
    print("Cleared existing demo data")

    # Insert transactions
    now = datetime.utcnow()
    tx_docs = []
    for tx in TRANSACTIONS:
        doc = {
            "user_id": user_id,
            "title": tx["title"],
            "amount": tx["amount"],
            "type": tx["type"],
            "category": tx["category"],
            "date": days_ago(tx["days_ago"]),
            "payment_method": tx["payment_method"],
            "merchant": tx.get("merchant"),
            "note": "",
            "source": "manual",
            "created_at": now,
            "updated_at": now,
        }
        tx_docs.append(doc)

    await db.transactions.insert_many(tx_docs)
    print(f"Inserted {len(tx_docs)} demo transactions")

    # Insert budget
    budget_doc = {
        "user_id": user_id,
        **BUDGET,
        "created_at": now,
        "updated_at": now,
    }
    await db.budgets.insert_one(budget_doc)
    print("Inserted demo budget")

    client.close()
    print("\nSeed complete!")
    print(f"   Login: demo@smartexpensetracker.in / demo1234")


if __name__ == "__main__":
    asyncio.run(seed())
