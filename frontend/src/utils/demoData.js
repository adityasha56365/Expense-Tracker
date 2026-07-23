// src/utils/demoData.js
// Realistic demo data for a freelancer/student persona

const today = new Date()
const thisMonth = today.getMonth()
const thisYear = today.getFullYear()

function daysAgo(n) {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function monthDate(month, year, day) {
  return new Date(year, month - 1, day).toISOString()
}

export const DEMO_TRANSACTIONS = [
  // This month
  { _id: 't1', title: 'Swiggy Order', amount: 480, type: 'expense', category: 'Food', date: daysAgo(1), payment_method: 'UPI', merchant: 'Swiggy', note: 'Dinner', source: 'manual' },
  { _id: 't2', title: 'Freelance Project - UI Design', amount: 15000, type: 'income', category: 'Freelance', date: daysAgo(2), payment_method: 'NetBanking', merchant: null, note: 'Figma design for client', source: 'manual' },
  { _id: 't3', title: 'Metro Card Recharge', amount: 500, type: 'expense', category: 'Transport', date: daysAgo(3), payment_method: 'UPI', merchant: 'Delhi Metro', note: '', source: 'manual' },
  { _id: 't4', title: 'Zomato Lunch', amount: 320, type: 'expense', category: 'Food', date: daysAgo(3), payment_method: 'UPI', merchant: 'Zomato', note: '', source: 'ocr' },
  { _id: 't5', title: 'Electricity Bill', amount: 1850, type: 'expense', category: 'Utilities', date: daysAgo(5), payment_method: 'NetBanking', merchant: 'BSES Delhi', note: 'July bill', source: 'manual' },
  { _id: 't6', title: 'Amazon Order - Books', amount: 1200, type: 'expense', category: 'Shopping', date: daysAgo(6), payment_method: 'Card', merchant: 'Amazon', note: 'Design books', source: 'manual' },
  { _id: 't7', title: 'Netflix Subscription', amount: 649, type: 'expense', category: 'Entertainment', date: daysAgo(7), payment_method: 'Card', merchant: 'Netflix', note: '', source: 'manual' },
  { _id: 't8', title: 'Gym Membership', amount: 1500, type: 'expense', category: 'Health', date: daysAgo(8), payment_method: 'UPI', merchant: 'Cult.fit', note: 'Monthly', source: 'manual' },
  { _id: 't9', title: 'Udemy Course - React', amount: 499, type: 'expense', category: 'Education', date: daysAgo(10), payment_method: 'Card', merchant: 'Udemy', note: '', source: 'manual' },
  { _id: 't10', title: 'Salary - Part Time', amount: 25000, type: 'income', category: 'Salary', date: daysAgo(10), payment_method: 'NetBanking', merchant: null, note: 'Monthly stipend', source: 'manual' },
  { _id: 't11', title: 'Petrol - Bike', amount: 800, type: 'expense', category: 'Transport', date: daysAgo(12), payment_method: 'Cash', merchant: 'HP Petrol Pump', note: '', source: 'manual' },
  { _id: 't12', title: 'Dominos Pizza', amount: 580, type: 'expense', category: 'Food', date: daysAgo(13), payment_method: 'UPI', merchant: 'Dominos', note: 'Weekend treat', source: 'ocr' },
  { _id: 't13', title: 'Mobile Recharge', amount: 299, type: 'expense', category: 'Utilities', date: daysAgo(14), payment_method: 'UPI', merchant: 'Airtel', note: '28 day plan', source: 'manual' },
  { _id: 't14', title: 'Myntra Shopping', amount: 2200, type: 'expense', category: 'Shopping', date: daysAgo(15), payment_method: 'Card', merchant: 'Myntra', note: 'Summer sale', source: 'manual' },
  { _id: 't15', title: 'Freelance - Logo Design', amount: 8000, type: 'income', category: 'Freelance', date: daysAgo(16), payment_method: 'UPI', merchant: null, note: 'Logo for startup', source: 'manual' },
  // Older
  { _id: 't16', title: 'Grocery - BigBasket', amount: 1650, type: 'expense', category: 'Food', date: daysAgo(20), payment_method: 'UPI', merchant: 'BigBasket', note: '', source: 'manual' },
  { _id: 't17', title: 'Doctor Consultation', amount: 700, type: 'expense', category: 'Health', date: daysAgo(22), payment_method: 'Cash', merchant: 'City Clinic', note: '', source: 'manual' },
  { _id: 't18', title: 'Spotify Premium', amount: 119, type: 'expense', category: 'Entertainment', date: daysAgo(25), payment_method: 'Card', merchant: 'Spotify', note: '', source: 'manual' },
  { _id: 't19', title: 'Ola Ride', amount: 220, type: 'expense', category: 'Transport', date: daysAgo(27), payment_method: 'Wallet', merchant: 'Ola', note: '', source: 'manual' },
  { _id: 't20', title: 'Scholarship Disbursement', amount: 5000, type: 'income', category: 'Other', date: daysAgo(30), payment_method: 'NetBanking', merchant: null, note: 'Quarterly scholarship', source: 'manual' },
]

export const DEMO_BUDGETS = [
  { _id: 'b1', month: thisMonth + 1, year: thisYear, total_budget: 35000, category_budgets: [
    { category: 'Food', budget: 8000 },
    { category: 'Transport', budget: 3000 },
    { category: 'Utilities', budget: 3500 },
    { category: 'Shopping', budget: 5000 },
    { category: 'Entertainment', budget: 2000 },
    { category: 'Health', budget: 3000 },
    { category: 'Education', budget: 2000 },
  ]},
]

export const DEMO_MONTHLY_TREND = [
  { month: 'Feb', income: 32000, expense: 18500 },
  { month: 'Mar', income: 30000, expense: 22000 },
  { month: 'Apr', income: 45000, expense: 28000 },
  { month: 'May', income: 38000, expense: 24500 },
  { month: 'Jun', income: 42000, expense: 31000 },
  { month: 'Jul', income: 53000, expense: 22096 },
]

export const DEMO_CATEGORY_BREAKDOWN = [
  { category: 'Food', amount: 3030 },
  { category: 'Transport', amount: 1520 },
  { category: 'Utilities', amount: 2149 },
  { category: 'Shopping', amount: 3400 },
  { category: 'Entertainment', amount: 768 },
  { category: 'Health', amount: 2200 },
  { category: 'Education', amount: 499 },
]

export const DEMO_SUMMARY = {
  total_balance: 43904,
  total_income: 53000,
  total_expense: 22096,
  savings_rate: 58.3,
  avg_daily_spend: 1473,
  top_category: 'Shopping',
  transaction_count: 20,
  forecasted_next_month: 24800,
  budget_utilization: 63.1,
}

export const DEMO_FORECAST = {
  predicted_spend: 24800,
  expected_vs_budget: 70.9,
  risk_level: 'low',
  trend: 'stable',
  top_overspending: ['Shopping', 'Food'],
  recommendations: [
    { category: 'Food', message: 'Food delivery spending is 12% above your 3-month average. Consider cooking at home more often.', icon: '🍽️' },
    { category: 'Shopping', message: 'Shopping spiked this month due to Myntra sale. Next month should normalize.', icon: '🛍️' },
    { category: 'Entertainment', message: 'Entertainment is well within budget. Netflix and Spotify total ₹768.', icon: '🎬' },
    { category: 'Utilities', message: 'Utilities are stable and tracking as expected.', icon: '💡' },
  ],
  health_score: 78,
}
