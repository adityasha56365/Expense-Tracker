# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.core.database import connect_db, close_db
from app.services.ml_service import load_model

from app.routes import (
    auth, transactions, budgets, analytics, ocr, forecast, users,
    goals, recurring, premium, splits, subscriptions, import_router,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    print("Starting Smart expense tracker API...")
    try:
        await connect_db()
    except Exception as e:
        print(f"Database connection warning on startup: {e}")
    try:
        load_model()
    except Exception as e:
        print(f"ML model load warning: {e}")
    yield
    print("Shutting down Smart expense tracker API...")
    try:
        await close_db()
    except Exception as e:
        print(f"Database close warning: {e}")



app = FastAPI(
    title="Smart expense tracker API",
    description="Personal Finance Dashboard Backend — FastAPI + MongoDB",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(budgets.router)
app.include_router(analytics.router)
app.include_router(ocr.router)
app.include_router(forecast.router)
app.include_router(users.router)
# ── New Feature Routers ───────────────────────────────────────────────────
app.include_router(goals.router)
app.include_router(recurring.router)
app.include_router(premium.router)
app.include_router(splits.router)
app.include_router(subscriptions.router)
app.include_router(import_router.router)


# ── Health check ──────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "Smart expense tracker API", "version": "1.0.0"}


@app.get("/")
async def root():
    return {
        "message": "Welcome to Smart expense tracker API",
        "docs": "/docs",
        "redoc": "/redoc",
    }
