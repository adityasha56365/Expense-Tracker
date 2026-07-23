// src/pages/RecurringExpenses.jsx
import { useState, useEffect, useCallback } from 'react'
import { recurringApi } from '../api/recurringApi'
import { useApp } from '../context/AppContext'
import { RefreshCw, Calendar, TrendingUp, Bell, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '../utils/formatters'
import { CATEGORY_MAP } from '../utils/constants'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const DEMO_PATTERNS = [
  { merchant: 'Netflix', avg_amount: 499, category: 'Entertainment', billing_cycle: 'monthly', last_payment: '2025-06-15', next_payment: '2025-07-15', occurrences: 5, total_spent: 2495, merchant_key: 'netflix', days_away: 5 },
  { merchant: 'Spotify', avg_amount: 119, category: 'Entertainment', billing_cycle: 'monthly', last_payment: '2025-06-20', next_payment: '2025-07-20', occurrences: 4, total_spent: 476, merchant_key: 'spotify', days_away: 10 },
  { merchant: 'Amazon Prime', avg_amount: 299, category: 'Entertainment', billing_cycle: 'monthly', last_payment: '2025-06-01', next_payment: '2025-07-01', occurrences: 6, total_spent: 1794, merchant_key: 'amazon prime', days_away: null },
  { merchant: 'Gym Membership', avg_amount: 1500, category: 'Health', billing_cycle: 'monthly', last_payment: '2025-06-01', next_payment: '2025-07-01', occurrences: 3, total_spent: 4500, merchant_key: 'gym', days_away: null },
  { merchant: 'Electricity Bill', avg_amount: 2200, category: 'Utilities', billing_cycle: 'monthly', last_payment: '2025-06-25', next_payment: '2025-07-25', occurrences: 4, total_spent: 8800, merchant_key: 'electricity', days_away: 15 },
]

function UpcomingBadge({ daysAway }) {
  if (daysAway === null || daysAway === undefined) return null
  const isUrgent = daysAway <= 3
  const isSoon = daysAway <= 7
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{
        background: isUrgent ? 'var(--color-danger-muted)' : isSoon ? 'var(--color-warning-muted)' : 'var(--color-success-muted)',
        color: isUrgent ? 'var(--color-danger)' : isSoon ? 'var(--color-warning)' : 'var(--color-success)',
      }}>
      {daysAway === 0 ? 'Due today' : `In ${daysAway}d`}
    </span>
  )
}

function PatternCard({ pattern }) {
  const { currency } = useApp()
  const cat = CATEGORY_MAP[pattern.category]
  const isUpcoming = pattern.days_away !== null && pattern.days_away <= 30

  return (
    <div className="card p-4 hover:shadow-md transition-all group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'var(--color-surface-subtle)' }}>
            {cat?.icon || '📦'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {pattern.merchant}
              </p>
              <UpcomingBadge daysAway={pattern.days_away} />
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {pattern.category} · {pattern.billing_cycle} · {pattern.occurrences}× detected
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
            {formatCurrency(pattern.avg_amount, currency)}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Next: {pattern.next_payment}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2"
        style={{ borderColor: 'var(--color-border-subtle)' }}>
        <div className="text-xs">
          <span style={{ color: 'var(--color-text-tertiary)' }}>Last payment: </span>
          <span style={{ color: 'var(--color-text-secondary)' }}>{pattern.last_payment}</span>
        </div>
        <div className="text-xs text-right">
          <span style={{ color: 'var(--color-text-tertiary)' }}>Total spent: </span>
          <span style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(pattern.total_spent, currency)}</span>
        </div>
      </div>
    </div>
  )
}

export default function RecurringExpenses() {
  const { currency } = useApp()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const { data: result } = await recurringApi.getSubscriptions()
      setData(result)
    } catch {
      setData({
        patterns: DEMO_PATTERNS,
        upcoming: DEMO_PATTERNS.filter(p => p.days_away !== null),
        total_monthly: DEMO_PATTERNS.reduce((s, p) => s + p.avg_amount, 0),
      })
      if (isRefresh) toast('Demo mode — showing sample data', { icon: '💡' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const patterns = data?.patterns || []
  const upcoming = data?.upcoming || []
  const totalMonthly = data?.total_monthly || 0
  const totalYearly = totalMonthly * 12

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Recurring Expenses
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            AI-detected subscription and recurring payment patterns
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="btn btn-secondary btn-sm flex items-center gap-2"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Monthly Recurring</p>
            <TrendingUp size={14} style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {formatCurrency(totalMonthly, currency)}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            {patterns.length} subscriptions detected
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Yearly Cost</p>
            <Calendar size={14} style={{ color: 'var(--color-warning)' }} />
          </div>
          <p className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {formatCurrency(totalYearly, currency)}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Projected annual spend
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Due Soon</p>
            <Bell size={14} style={{ color: 'var(--color-danger)' }} />
          </div>
          <p className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {upcoming.length}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Payments in next 30 days
          </p>
        </div>
      </div>

      {/* Upcoming payments */}
      {upcoming.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b"
            style={{ borderColor: 'var(--color-border)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--color-warning-muted)', color: 'var(--color-warning)' }}>
              <Bell size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Upcoming Payments
              </h3>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Due in the next 30 days
              </p>
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
            {upcoming.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{CATEGORY_MAP[p.category]?.icon || '📦'}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {p.merchant}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {p.next_payment}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UpcomingBadge daysAway={p.days_away} />
                  <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                    {formatCurrency(p.avg_amount, currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All patterns */}
      <div>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          All Detected Patterns
        </h3>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-xl" style={{ background: 'var(--color-border)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 rounded" style={{ background: 'var(--color-border)', width: '40%' }} />
                    <div className="h-3 rounded" style={{ background: 'var(--color-border)', width: '60%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : patterns.length === 0 ? (
          <div className="card p-12 text-center">
            <AlertCircle size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-tertiary)' }} />
            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>No patterns detected yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Add more transactions over multiple months for AI to detect recurring payments.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {patterns.map((p, i) => (
              <PatternCard key={`${p.merchant_key}-${i}`} pattern={p} />
            ))}
          </div>
        )}
      </div>

      {/* Info tip */}
      <div className="card p-4 flex items-start gap-3"
        style={{ background: 'var(--color-primary-muted)' }}>
        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Patterns are detected automatically from your last 6 months of transactions. 
          Merchants with similar amounts appearing in 2+ different months are flagged as recurring.
          Add transactions via the Transactions page or Bank Import for better detection.
        </p>
      </div>
    </div>
  )
}
