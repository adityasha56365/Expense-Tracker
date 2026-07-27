# Smart expense tracker - Premium Personal Finance Dashboard

Smart expense tracker is a modern, responsive, and secure personal finance dashboard and expense tracker built with a FastAPI backend, React (Vite) + Tailwind CSS frontend, and MongoDB Atlas. 

It features an AI/ML-based transaction categorizer, OCR-based receipt scanner, and forecasting tools for prediction and monthly budgeting.

---

## 🌟 Key Features

*   **Fintech Dashboard Layout**: Compact, data-first desktop/tablet/mobile design with modern typography and dark mode.
*   **OCR Receipt Scanner**: Upload receipt images, automatically extract merchant, date, and amount, and review fields before saving. Includes local Tesseract OCR processing with a clean abstraction for cloud API swap-outs.
*   **ML Category Predictor**: Scikit-Learn Logistic Regression model that automatically suggests standard categories (e.g., Food, Transport, Utilities, etc.) based on title or merchant text.
*   **Intelligent Forecasting & Insights**: Monthly spending forecasting using weighted moving averages and linear trend detection, flag overrun risks, and generate savings recommendations.
*   **Flexible Budgets**: Set category-level and total budgets with visual indicators for safe, warning (80%), and exceeded limits.
*   **Search & Multi-Filter**: Filter transactions by type, category, merchant, note, and custom date range. Sort by date and amount.
*   **Data Portability**: Export transactions directly to CSV files from the settings page.
*   **Demo & Online Modes**: Fully functional out of the box with realistic seed/demo content, or wire up to Atlas for JWT-based secure sync.

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite), Tailwind CSS, Chart.js, Lucide Icons, React Dropzone, Context API
*   **Backend**: FastAPI, Uvicorn, Motor (Async MongoDB), Pydantic v2
*   **Database**: MongoDB Atlas (with automatic index creation)
*   **AI/ML**: Scikit-Learn (TF-IDF + Logistic Regression), Pytesseract (OCR)

---

## 📁 Project Folder Structure

```
d:/Expense/
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios API instances & routing modules
│   │   ├── assets/         # Project SVGs / logo assets
│   │   ├── components/
│   │   │   ├── common/     # Buttons, Modals, Loaders, Empty States, Skeletons
│   │   │   ├── layout/     # Collapsible Sidebar, Topbar, AppLayout
│   │   │   ├── dashboard/  # Metric Cards, Spending trend, Category breakdown
│   │   │   ├── transactions/# Transaction table, search/filter bars, Forms
│   │   │   ├── budgets/    # Budget progress indicators, limits editor
│   │   │   ├── ocr/        # OCR fields review & image upload
│   │   │   └── insights/   # Forecast indicators, savings recommendation list
│   │   ├── context/        # AuthContext, AppContext, ThemeContext
│   │   ├── pages/          # Dashboard, Transactions, Budgets, Analytics, OCR, Insights, Settings
│   │   ├── router/         # Protected routes & client side router
│   │   └── utils/          # Date & currency formatters, constants, demo data
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── backend/
    ├── app/
    │   ├── core/           # Config settings, Security, Database client
    │   ├── routes/         # Auth, Transactions, Budgets, Analytics, OCR, Forecast endpoints
    │   ├── schemas/        # Pydantic validation request/response schemas
    │   ├── services/       # ML categorizer, Tesseract OCR, Forecast generator
    │   ├── utils/          # Global constants, formatting helpers
    │   ├── seed/           # MongoDB Atlas seeding scripts
    │   └── main.py         # App entrypoint and lifecycle events
    ├── requirements.txt
    └── .env
```

---

## 🚀 Local Setup Instructions

### Prerequisites
*   Python 3.10+
*   Node.js 18+
*   MongoDB Atlas Account or local MongoDB server
*   *(Optional)* Tesseract OCR installed on your system (adds local image OCR parsing capability; a fallback mock system is included if not found).

---

### Step 1: Run the Backend

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

3.  *(Optional)* Seed MongoDB Atlas with initial demo data:
    ```bash
    python -m app.seed.seed_data
    ```
4.  Start the FastAPI backend:
    ```bash
    uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
    ```

The API docs will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

### Step 2: Run the Frontend

1.  Open a new terminal and navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite dev server:
    ```bash
    npm run dev -- --host 127.0.0.1
    ```
4.  Open your browser and navigate to [http://127.0.0.1:5173](http://127.0.0.1:5173).

---

## 🔑 Demo Account Credentials

You can log in immediately using the seed account credentials:
*   **Email**: `demo@smartexpensetracker.in`
*   **Password**: `demo1234`
*   *Alternatively, you can register a new account on the signup screen, which will create a secure, isolated profile in MongoDB Atlas.*
