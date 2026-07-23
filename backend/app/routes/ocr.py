# app/routes/ocr.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.core.security import get_current_user_optional
from app.core.database import get_db
from app.services.ocr_service import process_receipt
from app.utils.helpers import serialize_doc, now_utc

router = APIRouter(prefix="/ocr", tags=["OCR"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"}
MAX_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/scan-receipt")
async def scan_receipt(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user_optional),
):
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: JPEG, PNG, WEBP, BMP"
        )

    # Read and validate size
    image_bytes = await file.read()
    if len(image_bytes) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum 10MB allowed.")

    # Process OCR
    result = await process_receipt(image_bytes, file.filename or "receipt.jpg")

    # Save to receipts collection
    db = get_db()
    user_id_str = str(current_user["_id"]) if current_user and "_id" in current_user else "guest"
    receipt_doc = {
        "user_id": user_id_str,
        "filename": file.filename,
        "merchant": result.get("merchant"),
        "amount": result.get("amount"),
        "subtotal": result.get("subtotal"),
        "tax_total": result.get("tax_total"),
        "taxes": result.get("taxes", []),
        "items": result.get("items", []),
        "date": result.get("date"),
        "raw_text": result.get("raw_text", ""),
        "predicted_category": result.get("predicted_category", "Other"),
        "confidence": result.get("confidence", 0.0),
        "created_at": now_utc(),
    }
    await db.receipts.insert_one(receipt_doc)

    return result
