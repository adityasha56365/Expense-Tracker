// src/components/dashboard/RecentTransactions.jsx
import { ArrowRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { CategoryBadge } from '../common/Badge'
import { formatCurrency, getRelativeTime } from '../../utils/formatters'
import { useApp } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../common/EmptyState'
import clsx from 'clsx'

export default function RecentTransactions({ transactions = [] }) {
  const { currency } = useApp()
  const navigate = useNavigate()
  const recent = transactions.slice(0, 8)

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b"
           style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Recent Transactions
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            Last {recent.length} entries
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm gap-1 text-xs"
          style={{ color: 'var(--color-primary)' }}
          onClick={() => navigate('/transactions')}
        >
          View all <ArrowRight size={13} />
        </button>
      </div>

      {/* List */}
      {recent.length === 0 ? (
        <EmptyState title="No transactions yet" description="Add your first transaction to get started." />
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
          {recent.map((tx) => (
            <div key={tx._id} className="flex items-center gap-3 px-6 py-3 hover:bg-[var(--color-surface-subtle)] transition-colors">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={tx.type === 'income'
                  ? { background: 'var(--color-success-muted)', color: 'var(--color-success)' }
                  : { background: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}
              >
                {tx.type === 'income'
                  ? <ArrowDownLeft size={16} />
                  : <ArrowUpRight size={16} />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {tx.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <CategoryBadge category={tx.category} size="xs" />
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {getRelativeTime(tx.date)}
                  </span>
                </div>
              </div>

              <span className={clsx(
                'tabular-nums text-sm font-semibold flex-shrink-0',
                tx.type === 'income' ? 'amount-positive' : 'amount-negative'
              )}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
