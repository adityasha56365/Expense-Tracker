# app/utils/constants.py

CATEGORIES = [
    "Food", "Transport", "Utilities", "Shopping",
    "Entertainment", "Health", "Education",
    "Salary", "Freelance", "Other"
]

EXPENSE_CATEGORIES = [
    "Food", "Transport", "Utilities", "Shopping",
    "Entertainment", "Health", "Education", "Other"
]

INCOME_CATEGORIES = ["Salary", "Freelance", "Other"]

TRANSACTION_TYPES = ["income", "expense"]

PAYMENT_METHODS = ["UPI", "Card", "Cash", "NetBanking", "Wallet", "Other"]

# Keywords for ML training data
CATEGORY_KEYWORDS = {
    "Food": [
        "swiggy", "zomato", "dominos", "pizza", "restaurant", "food", "dinner",
        "lunch", "breakfast", "cafe", "coffee", "starbucks", "mcdonalds",
        "burger", "biryani", "grocery", "bigbasket", "blinkit", "zepto",
        "vegetable", "fruit", "milk", "bakery", "chai", "snack"
    ],
    "Transport": [
        "uber", "ola", "rapido", "metro", "bus", "auto", "petrol",
        "fuel", "diesel", "cab", "taxi", "train", "irctc", "flight",
        "indigo", "air india", "bike", "parking", "toll", "fastag"
    ],
    "Utilities": [
        "electricity", "water", "gas", "bses", "tata power", "broadband",
        "wifi", "internet", "jio", "airtel", "vi", "bsnl", "mobile", "recharge",
        "phone bill", "postpaid", "prepaid", "maintenance", "society"
    ],
    "Shopping": [
        "amazon", "flipkart", "myntra", "ajio", "meesho", "nykaa",
        "clothes", "shirt", "shoes", "fashion", "accessories", "watch",
        "furniture", "ikea", "decor", "electronics", "mobile", "laptop"
    ],
    "Entertainment": [
        "netflix", "spotify", "prime", "hotstar", "zee5", "youtube",
        "movie", "cinema", "pvr", "inox", "concert", "event", "gaming",
        "playstation", "steam", "game", "subscription"
    ],
    "Health": [
        "hospital", "clinic", "doctor", "pharmacy", "medicine", "chemist",
        "apollo", "medplus", "health", "gym", "fitness", "cult", "yoga",
        "dental", "eye", "lab", "test", "insurance", "premium"
    ],
    "Education": [
        "udemy", "coursera", "edx", "unacademy", "byju", "vedantu",
        "course", "tutorial", "book", "textbook", "college", "university",
        "school", "fee", "tuition", "library", "stationery"
    ],
    "Salary": [
        "salary", "stipend", "payroll", "ctc", "wages", "monthly pay",
        "income", "paycheck"
    ],
    "Freelance": [
        "freelance", "project", "client", "invoice", "fiverr", "upwork",
        "design", "development", "consulting", "service", "payment received"
    ],
}
