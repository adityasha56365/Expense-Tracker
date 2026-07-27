# app/services/gemini_service.py
"""
Gemini AI Service Module
Interfaces asynchronously with Google Gemini API via REST endpoints using httpx.
Provides AI capabilities: Vision Receipt OCR, PDF Bank Statement Parsing,
Smart Category Classification, and Financial Insights.
"""

import base64
import json
import re
from typing import Optional, List, Dict, Any, Tuple
import httpx

from app.core.config import get_settings

settings = get_settings()

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"


def is_gemini_configured() -> bool:
    """Check if GEMINI_API_KEY is available and configured."""
    return bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 10)


def _get_api_key() -> str:
    return settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""


def _extract_json_from_text(text: str) -> Optional[Any]:
    """Helper to locate and parse JSON object or array in model markdown response."""
    if not text:
        return None
    text_clean = text.strip()
    
    # Try direct parse
    try:
        return json.loads(text_clean)
    except Exception:
        pass

    # Try extracting markdown json code block ```json ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text_clean, re.IGNORECASE)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except Exception:
            pass

    # Try searching for outermost { ... } or [ ... ]
    match_obj = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", text_clean)
    if match_obj:
        try:
            return json.loads(match_obj.group(1).strip())
        except Exception:
            pass

    return None


async def call_gemini_text(prompt: str, system_instruction: str = "") -> Optional[str]:
    """Base method to send text prompt to Gemini API."""
    if not is_gemini_configured():
        return None

    api_key = _get_api_key()
    url = f"{GEMINI_API_URL}?key={api_key}"

    contents = []
    if system_instruction:
        contents.append({"role": "user", "parts": [{"text": system_instruction}]})
        contents.append({"role": "model", "parts": [{"text": "Understood. I will follow your instructions strictly."}]})

    contents.append({"role": "user", "parts": [{"text": prompt}]})

    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2048,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                res_data = resp.json()
                candidates = res_data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
            else:
                print(f"Gemini API Text error {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"Gemini API call failed: {e}")

    return None


async def call_gemini_vision(image_bytes: bytes, prompt: str, mime_type: str = "image/jpeg") -> Optional[str]:
    """Send image bytes + prompt to Gemini Vision."""
    if not is_gemini_configured():
        return None

    api_key = _get_api_key()
    url = f"{GEMINI_API_URL}?key={api_key}"

    b64_data = base64.b64encode(image_bytes).decode("utf-8")

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": b64_data
                        }
                    },
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 2048,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=35.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                res_data = resp.json()
                candidates = res_data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
            else:
                print(f"Gemini Vision API error {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"Gemini Vision API call failed: {e}")

    return None


# ── Feature Implementations ───────────────────────────────────────────────────

async def analyze_receipt_with_gemini(image_bytes: bytes, filename: str = "receipt.jpg") -> Optional[Dict[str, Any]]:
    """
    Extract structured receipt info using Gemini Vision.
    Returns dict matching OCR service contract.
    """
    mime_type = "image/jpeg"
    fn_lower = filename.lower()
    if fn_lower.endswith(".png"):
        mime_type = "image/png"
    elif fn_lower.endswith(".webp"):
        mime_type = "image/webp"

    prompt = (
        "Analyze this receipt image carefully and return a JSON object with EXACTLY the following format:\n"
        "{\n"
        '  "merchant": "Store or Restaurant Name",\n'
        '  "amount": 125.50,\n'
        '  "subtotal": 120.00,\n'
        '  "tax_total": 5.50,\n'
        '  "taxes": [{"name": "CGST", "rate": "2.5%", "amount": 2.75}, {"name": "SGST", "rate": "2.5%", "amount": 2.75}],\n'
        '  "date": "2025-02-27T00:00:00",\n'
        '  "predicted_category": "Food|Transport|Utilities|Shopping|Entertainment|Health|Education|Other",\n'
        '  "items": [{"name": "Item Name", "qty": 1, "price": 60.00, "total": 60.00}],\n'
        '  "raw_text": "Extracted text content from receipt"\n'
        "}\n"
        "Return ONLY the JSON object. Do not add any markdown formatting or extra text outside JSON."
    )

    raw_resp = await call_gemini_vision(image_bytes, prompt, mime_type=mime_type)
    if not raw_resp:
        return None

    parsed = _extract_json_from_text(raw_resp)
    if isinstance(parsed, dict) and "amount" in parsed:
        parsed["confidence"] = 0.98
        parsed["extraction_notes"] = "Powered by Google Gemini AI Vision"
        return parsed

    return None


async def parse_bank_statement_with_gemini(text_content: str, filename: str = "") -> Optional[List[Dict[str, Any]]]:
    """
    Parse extracted text from bank statements (PDF, CSV, text) into structured transaction list using Gemini.
    """
    prompt = f"""
Below is text content extracted from a bank statement file ({filename}):

--- START STATEMENT TEXT ---
{text_content[:15000]}
--- END STATEMENT TEXT ---

Extract all individual transactions from this bank statement into a JSON array of objects.
Each transaction object MUST have:
- "date": Date formatted as ISO YYYY-MM-DD (e.g. "2025-06-15")
- "title": Clear description/merchant name (string)
- "amount": Transaction amount as a positive float number (e.g. 450.00)
- "type": "income" (for credits/deposits) or "expense" (for debits/withdrawals)
- "category": One of ["Food", "Transport", "Utilities", "Shopping", "Entertainment", "Health", "Education", "Salary", "Freelance", "Other"]

Return ONLY the JSON array `[ { ... }, { ... } ]`. No explanations, no markdown code blocks outside JSON.
"""

    raw_resp = await call_gemini_text(prompt)
    if not raw_resp:
        return None

    parsed = _extract_json_from_text(raw_resp)
    if isinstance(parsed, list):
        # Validate elements
        valid_rows = []
        for item in parsed:
            if isinstance(item, dict) and "title" in item and "amount" in item:
                try:
                    amount = abs(float(item["amount"]))
                    if amount > 0:
                        valid_rows.append({
                            "title": str(item.get("title", "Bank Transaction"))[:100],
                            "merchant": str(item.get("title", "Bank Transaction"))[:80],
                            "amount": round(amount, 2),
                            "type": "income" if item.get("type") == "income" else "expense",
                            "category": item.get("category", "Other"),
                            "category_confidence": 0.95,
                            "date": item.get("date", "2025-06-01") + "T00:00:00",
                            "payment_method": "NetBanking",
                            "note": f"Imported via Gemini AI from {filename or 'bank statement'}",
                            "source": "import",
                        })
                except Exception:
                    continue
        return valid_rows

    return None


async def generate_ai_insights_with_gemini(monthly_totals: dict, category_monthly: dict, total_budget: float) -> Optional[dict]:
    """
    Generate personalized financial recommendations and insights using Gemini AI.
    """
    prompt = f"""
You are an expert personal financial advisor. Analyze this user's spending data:
Monthly total spending trend: {json.dumps(monthly_totals)}
Category breakdown: {json.dumps(category_monthly)}
Total monthly budget: {total_budget}

Generate a JSON object with:
{{
  "recommendations": [
    {{
      "category": "Category Name",
      "icon": "Emoji Icon",
      "message": "Specific actionable recommendation with percentage or amount details"
    }}
  ],
  "financial_advice": "A short summary paragraph with overall advice for improving savings",
  "health_score_commentary": "Short assessment of financial health score"
}}
Return ONLY the JSON object.
"""

    raw_resp = await call_gemini_text(prompt)
    if not raw_resp:
        return None

    return _extract_json_from_text(raw_resp)


async def predict_category_with_gemini(transaction_text: str) -> Optional[Tuple[str, float]]:
    """Predict transaction category using Gemini AI."""
    prompt = f"""
Categorize the following transaction into EXACTLY ONE of these categories:
["Food", "Transport", "Utilities", "Shopping", "Entertainment", "Health", "Education", "Salary", "Freelance", "Other"]

Transaction: "{transaction_text}"

Return JSON: {{"category": "CategoryName", "confidence": 0.95}}
"""
    raw_resp = await call_gemini_text(prompt)
    if not raw_resp:
        return None

    parsed = _extract_json_from_text(raw_resp)
    if isinstance(parsed, dict) and "category" in parsed:
        return (parsed["category"], float(parsed.get("confidence", 0.95)))

    return None
