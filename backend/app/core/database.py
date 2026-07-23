# app/core/database.py
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings

settings = get_settings()

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        tls=True,
        tlsAllowInvalidCertificates=True,
        serverSelectionTimeoutMS=20000,
        connectTimeoutMS=20000,
    )
    db = client[settings.DATABASE_NAME]
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.transactions.create_index("user_id")
    await db.transactions.create_index([("user_id", 1), ("date", -1)])
    await db.transactions.create_index([("user_id", 1), ("category", 1)])
    await db.budgets.create_index([("user_id", 1), ("month", 1), ("year", 1)])
    await db.receipts.create_index("user_id")
    await db.goals.create_index("user_id")
    await db.splits.create_index("user_id")
    await db.subscriptions.create_index("user_id")
    await db.recurring_patterns.create_index("user_id")
    print("Connected to MongoDB Atlas")


async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


def get_db():
    return db
