// src/utils/formatters.js
import { CURRENCIES } from './constants'

export function formatCurrency(amount, currency = 'INR') {
  const curr = CURRENCIES.find(c => c.value === currency) || CURRENCIES[0]
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

export function formatCompact(amount, currency = 'INR') {
  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`
  }
  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`
  }
  return formatCurrency(amount, currency)
}

export function formatDate(date) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateShort(date) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(date))
}

export function formatDateInput(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

export function formatPercentage(value, decimals = 1) {
  return `${(value || 0).toFixed(decimals)}%`
}

export function getMonthYear(date = new Date()) {
  const d = new Date(date)
  return {
    month: d.getMonth() + 1,
    year: d.getFullYear(),
    label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    shortLabel: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
  }
}

export function getCurrentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

export function getRelativeTime(date) {
  const now = new Date()
  const d = new Date(date)
  const diff = now - d
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}
