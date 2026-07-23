// src/utils/constants.js

export const CATEGORIES = [
  { value: 'Food', label: 'Food & Dining', icon: '🍽️', class: 'cat-food' },
  { value: 'Transport', label: 'Transport', icon: '🚗', class: 'cat-transport' },
  { value: 'Utilities', label: 'Utilities', icon: '💡', class: 'cat-utilities' },
  { value: 'Shopping', label: 'Shopping', icon: '🛍️', class: 'cat-shopping' },
  { value: 'Entertainment', label: 'Entertainment', icon: '🎬', class: 'cat-entertainment' },
  { value: 'Health', label: 'Health & Medical', icon: '🏥', class: 'cat-health' },
  { value: 'Education', label: 'Education', icon: '📚', class: 'cat-education' },
  { value: 'Salary', label: 'Salary', icon: '💼', class: 'cat-salary' },
  { value: 'Freelance', label: 'Freelance', icon: '💻', class: 'cat-freelance' },
  { value: 'Other', label: 'Other', icon: '📦', class: 'cat-other' },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]))

export const PAYMENT_METHODS = [
  { value: 'UPI', label: 'UPI' },
  { value: 'Card', label: 'Debit/Credit Card' },
  { value: 'Cash', label: 'Cash' },
  { value: 'NetBanking', label: 'Net Banking' },
  { value: 'Wallet', label: 'Wallet' },
  { value: 'Other', label: 'Other' },
]

export const CURRENCIES = [
  { value: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
  { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
  { value: 'JPY', label: 'Japanese Yen (¥)', symbol: '¥' },
  { value: 'AUD', label: 'Australian Dollar (A$)', symbol: 'A$' },
  { value: 'CAD', label: 'Canadian Dollar (C$)', symbol: 'C$' },
  { value: 'CHF', label: 'Swiss Franc (Fr)', symbol: 'Fr' },
  { value: 'CNY', label: 'Chinese Yuan (¥)', symbol: '¥' },
  { value: 'SGD', label: 'Singapore Dollar (S$)', symbol: 'S$' },
  { value: 'AED', label: 'UAE Dirham (د.إ)', symbol: 'د.إ' },
  { value: 'SAR', label: 'Saudi Riyal (ر.س)', symbol: 'ر.س' },
  { value: 'HKD', label: 'Hong Kong Dollar (HK$)', symbol: 'HK$' },
  { value: 'NZD', label: 'New Zealand Dollar (NZ$)', symbol: 'NZ$' },
  { value: 'SEK', label: 'Swedish Krona (kr)', symbol: 'kr' },
  { value: 'NOK', label: 'Norwegian Krone (kr)', symbol: 'kr' },
  { value: 'MXN', label: 'Mexican Peso ($)', symbol: '$' },
  { value: 'BRL', label: 'Brazilian Real (R$)', symbol: 'R$' },
  { value: 'KRW', label: 'South Korean Won (₩)', symbol: '₩' },
  { value: 'THB', label: 'Thai Baht (฿)', symbol: '฿' },
  { value: 'MYR', label: 'Malaysian Ringgit (RM)', symbol: 'RM' },
  { value: 'IDR', label: 'Indonesian Rupiah (Rp)', symbol: 'Rp' },
  { value: 'PKR', label: 'Pakistani Rupee (₨)', symbol: '₨' },
  { value: 'BDT', label: 'Bangladeshi Taka (৳)', symbol: '৳' },
]


export const CHART_COLORS = {
  Food: '#f59e0b',
  Transport: '#3b82f6',
  Utilities: '#8b5cf6',
  Shopping: '#ec4899',
  Entertainment: '#10b981',
  Health: '#ef4444',
  Education: '#06b6d4',
  Salary: '#22c55e',
  Freelance: '#84cc16',
  Other: '#94a3b8',
}

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

export const RISK_LEVELS = {
  low: { label: 'Low Risk', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  medium: { label: 'Moderate Risk', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
  high: { label: 'High Risk', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' },
}
