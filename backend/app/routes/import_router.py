# app/routes/import_router.py
"""
Bank Statement Import API
Supports: CSV and Excel (XLSX) upload with auto column detection.
Duplicate detection: same date + amount + similar description within 3 days.
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import io
import csv

from app.core.security import get_current_user
from app.core.database import get_db
from app.utils.helpers import serialize_list, now_utc
from app.services.ml_service import predict_category

router = APIRouter(prefix="/import", tags=["Bank Import"])

ALLOWED_TYPES = {
    "text/csv", "application/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/plain",
}
MAX_SIZE = 10 * 1024 * 1024  # 10MB

# ── Common date formats to try ────────────────────────────────────────────────
DATE_FORMATS = [
    "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%m/%d/%Y",
    "%d %b %Y", "%d %B %Y", "%Y/%m/%d", "%d.%m.%Y",
    "%m-%d-%Y", "%d/%m/%y", "%m/%d/%y",
]


def _parse_date(raw: str) -> Optional[datetime]:
    raw = str(raw).strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
    return None


def _parse_amount(raw: str) -> Optional[float]:
    if raw is None:
        return None
    raw = str(raw).replace(",", "").replace("₹", "").replace("$", "").replace("€", "").strip()
    raw = raw.lstrip("(").rstrip(")")
    try:
        val = float(raw)
        return abs(val)
    except ValueError:
        return None


def _detect_columns(headers: List[str]) -> Dict[str, str]:
    """
    Auto-detect which column maps to date, description, debit, credit, amount.
    Returns a dict: { "date": col, "description": col, "amount": col, "type": "debit_credit"|"signed" }
    """
    headers_lower = [h.lower().strip() for h in headers]
    mapping = {}

    # Date column
    for kw in ["date", "txn date", "transaction date", "value date", "posting date"]:
        for i, h in enumerate(headers_lower):
            if kw in h:
                mapping["date"] = headers[i]
                break
        if "date" in mapping:
            break

    # Description column
    for kw in ["description", "narration", "particulars", "details", "remarks", "merchant", "transaction", "payee"]:
        for i, h in enumerate(headers_lower):
            if kw in h:
                mapping["description"] = headers[i]
                break
        if "description" in mapping:
            break

    # Amount columns
    has_debit = False
    has_credit = False
    for i, h in enumerate(headers_lower):
        if any(kw in h for kw in ["debit", "withdrawal", "dr"]):
            mapping["debit"] = headers[i]
            has_debit = True
        elif any(kw in h for kw in ["credit", "deposit", "cr"]):
            mapping["credit"] = headers[i]
            has_credit = True
        elif any(kw in h for kw in ["amount", "sum", "total"]) and "amount" not in mapping:
            mapping["amount"] = headers[i]

    if has_debit and has_credit:
        mapping["split_type"] = "debit_credit"
    elif "amount" in mapping:
        mapping["split_type"] = "single"
    else:
        # Use first numeric-looking column as amount
        mapping["split_type"] = "unknown"

    return mapping


def _parse_csv_bytes(content: bytes) -> tuple:
    """Parse CSV bytes into headers + rows."""
    text = content.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    headers = reader.fieldnames or []
    rows = list(reader)
    return list(headers), rows


def _parse_xlsx_bytes(content: bytes) -> tuple:
    """Parse XLSX bytes into headers + rows."""
    try:
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
        ws = wb.active
        rows_iter = ws.iter_rows(values_only=True)
        headers = [str(h).strip() if h is not None else "" for h in next(rows_iter, [])]
        rows = []
        for row in rows_iter:
            if any(v is not None for v in row):
                row_dict = {headers[i]: (str(v).strip() if v is not None else "") for i, v in enumerate(row) if i < len(headers)}
                rows.append(row_dict)
        return headers, rows
    except ImportError:
        raise HTTPException(status_code=400, detail="Excel parsing requires openpyxl. Install with: pip install openpyxl")


def _rows_to_transactions(rows: list, col_map: dict, user_id: str) -> list:
    """Convert raw rows to transaction-like dicts with ML category prediction."""
    transactions = []
    for row in rows:
        date_raw = row.get(col_map.get("date", ""), "")
        desc_raw = row.get(col_map.get("description", ""), "")
        date = _parse_date(date_raw)

        if not date or not desc_raw:
            continue

        # Determine amount and type
        split_type = col_map.get("split_type", "single")
        amount = None
        tx_type = "expense"

        if split_type == "debit_credit":
            debit_raw = row.get(col_map.get("debit", ""), "")
            credit_raw = row.get(col_map.get("credit", ""), "")
            debit = _parse_amount(debit_raw)
            credit = _parse_amount(credit_raw)
            if debit and debit > 0:
                amount = debit
                tx_type = "expense"
            elif credit and credit > 0:
                amount = credit
                tx_type = "income"
        else:
            amount_raw = row.get(col_map.get("amount", ""), "")
            amount = _parse_amount(amount_raw)
            # Try to detect type from sign or other fields
            if str(amount_raw).strip().startswith("-"):
                tx_type = "expense"
            elif str(amount_raw).strip().startswith("+"):
                tx_type = "income"

        if not amount or amount <= 0:
            continue

        # ML category prediction
        category, confidence = predict_category(desc_raw)

        transactions.append({
            "title": desc_raw[:100],
            "merchant": desc_raw[:80],
            "amount": round(amount, 2),
            "type": tx_type,
            "category": category,
            "category_confidence": round(confidence, 3),
            "date": date.isoformat(),
            "payment_method": "NetBanking",
            "note": f"Imported from bank statement",
            "source": "import",
            "user_id": user_id,
        })

    return transactions


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/preview")
async def preview_import(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """
    Step 1: Upload file, detect columns, return preview rows.
    The frontend can adjust column mapping and re-call this endpoint.
    """
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum 10MB")

    filename = (file.filename or "").lower()
    content_type = (file.content_type or "").lower()

    try:
        if filename.endswith(".xlsx") or "openxmlformats" in content_type or "excel" in content_type:
            headers, rows = _parse_xlsx_bytes(content)
        else:
            headers, rows = _parse_csv_bytes(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    if not headers:
        raise HTTPException(status_code=400, detail="No headers found in file")

    auto_map = _detect_columns(headers)
    uid = str(current_user["_id"])

    # Generate preview (first 10 rows parsed)
    preview_rows = _rows_to_transactions(rows[:10], auto_map, uid)

    return {
        "headers": headers,
        "total_rows": len(rows),
        "auto_column_map": auto_map,
        "preview": preview_rows,
        "sample_raw_rows": [dict(r) for r in rows[:5]],
    }


class ConfirmImportRequest(BaseModel):
    rows: List[Dict[str, Any]]  # Already-processed rows from preview
    skip_duplicates: bool = True


@router.post("/confirm")
async def confirm_import(
    body: ConfirmImportRequest,
    current_user=Depends(get_current_user),
):
    """
    Step 2: Bulk insert transactions with duplicate detection.
    Duplicates: same date ± 3 days + same amount + similar description.
    """
    db = get_db()
    uid = str(current_user["_id"])
    now = now_utc()

    imported = 0
    skipped = 0
    errors = 0

    for row in body.rows:
        try:
            tx_date_str = row.get("date")
            if not tx_date_str:
                errors += 1
                continue

            try:
                tx_date = datetime.fromisoformat(tx_date_str)
            except ValueError:
                errors += 1
                continue

            amount = float(row.get("amount", 0))
            if amount <= 0:
                errors += 1
                continue

            # Duplicate check
            if body.skip_duplicates:
                date_window_start = tx_date - timedelta(days=3)
                date_window_end = tx_date + timedelta(days=3)
                existing = await db.transactions.find_one({
                    "user_id": uid,
                    "amount": amount,
                    "date": {"$gte": date_window_start, "$lte": date_window_end},
                    "title": {"$regex": row.get("title", "")[:20], "$options": "i"},
                })
                if existing:
                    skipped += 1
                    continue

            doc = {
                **row,
                "user_id": uid,
                "date": tx_date,
                "created_at": now,
                "updated_at": now,
            }
            await db.transactions.insert_one(doc)
            imported += 1
        except Exception:
            errors += 1

    return {
        "imported": imported,
        "skipped_duplicates": skipped,
        "errors": errors,
        "total_processed": len(body.rows),
    }
