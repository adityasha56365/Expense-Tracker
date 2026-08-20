# backend/api/index.py — Vercel Serverless Function Entry Point for FastAPI
import sys
import os

# Add backend directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
