# app/services/ml_service.py
"""
ML Categorization Service
Uses TF-IDF + Logistic Regression trained on labeled keyword data.
Model is trained on startup if no serialized model exists.
"""

import os
import re
import joblib
import numpy as np
from pathlib import Path
from typing import Tuple
from app.utils.constants import CATEGORY_KEYWORDS

MODEL_PATH = Path(__file__).parent.parent / "models" / "categorizer.joblib"
MODEL_PATH.parent.mkdir(exist_ok=True)

_model = None
_vectorizer = None


def _build_training_data():
    """Generate training corpus from keyword mappings."""
    texts, labels = [], []
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            texts.append(kw)
            labels.append(category)
            # Add variations
            texts.append(f"paid for {kw}")
            labels.append(category)
            texts.append(f"{kw} order")
            labels.append(category)
            texts.append(f"monthly {kw}")
            labels.append(category)

    # Augment with combined phrases
    augmented = [
        ("swiggy food delivery", "Food"),
        ("zomato restaurant order", "Food"),
        ("uber cab booking", "Transport"),
        ("electricity bill payment", "Utilities"),
        ("amazon shopping online", "Shopping"),
        ("netflix streaming subscription", "Entertainment"),
        ("hospital doctor consultation", "Health"),
        ("udemy online course", "Education"),
        ("monthly salary credited", "Salary"),
        ("freelance project payment", "Freelance"),
        ("dominos pizza delivery", "Food"),
        ("petrol fuel bike", "Transport"),
        ("airtel mobile recharge", "Utilities"),
        ("myntra fashion clothes", "Shopping"),
        ("spotify music subscription", "Entertainment"),
        ("gym fitness membership", "Health"),
        ("book textbook purchase", "Education"),
        ("stipend scholarship received", "Salary"),
        ("logo design client work", "Freelance"),
    ]
    for text, label in augmented:
        texts.append(text)
        labels.append(label)

    return texts, labels


def train_model():
    """Train and persist the TF-IDF + LogReg model."""
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import Pipeline

    texts, labels = _build_training_data()

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=5000,
            min_df=1,
            analyzer="word",
            lowercase=True,
        )),
        ("clf", LogisticRegression(
            max_iter=1000,
            C=5.0,
            multi_class="multinomial",
            solver="lbfgs",
        )),
    ])
    pipeline.fit(texts, labels)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"ML model trained and saved to {MODEL_PATH}")
    return pipeline


def load_model():
    """Load model from disk, train if not found."""
    global _model
    if _model is not None:
        return _model

    if MODEL_PATH.exists():
        try:
            _model = joblib.load(MODEL_PATH)
            print(f"ML model loaded from {MODEL_PATH}")
        except Exception:
            _model = train_model()
    else:
        _model = train_model()

    return _model


def keyword_categorize(text: str) -> Tuple[str, float]:
    """Lightweight keyword categorization fallback."""
    text_lower = text.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text_lower:
                return category, 0.95
    if any(term in text_lower for term in ["plate", "vada", "pizza", "food", "dine", "restaurant", "cafe"]):
        return "Food", 0.90
    return "Other", 0.70


def predict_category(text: str) -> Tuple[str, float]:
    """
    Predict transaction category from text.
    Returns (category, confidence) tuple.
    """
    if not text or not text.strip():
        return "Other", 0.0

    try:
        model = load_model()
        clean_text = re.sub(r"[^\w\s]", " ", text.lower()).strip()
        proba = model.predict_proba([clean_text])[0]
        classes = model.classes_
        idx = np.argmax(proba)
        return str(classes[idx]), float(proba[idx])
    except Exception as e:
        return keyword_categorize(text)


def get_all_predictions(text: str) -> list:
    """Get top-3 category predictions with confidences."""
    if not text:
        return [{"category": "Other", "confidence": 1.0}]

    try:
        model = load_model()
        clean_text = re.sub(r"[^\w\s]", " ", text.lower()).strip()
        proba = model.predict_proba([clean_text])[0]
        classes = model.classes_
        top_indices = np.argsort(proba)[::-1][:3]
        return [
            {"category": str(classes[i]), "confidence": round(float(proba[i]), 3)}
            for i in top_indices
        ]
    except Exception:
        return [{"category": "Other", "confidence": 1.0}]
