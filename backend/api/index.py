# backend/api/index.py — Vercel Serverless Function Entry Point for FastAPI
import sys
import os

# Add parent directory (backend root) to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
