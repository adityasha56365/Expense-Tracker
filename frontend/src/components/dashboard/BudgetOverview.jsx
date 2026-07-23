// src/components/dashboard/BudgetOverview.jsx
import { useApp } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatPercentage } from '../../utils/formatters'
import { CATEGORY_MAP } from '../../utils/constants'
import clsx from 'clsx'

export default function BudgetOverview() {
  const { budgets, transactions, currency } = useApp()
  const navigate = useNavigate()

  const now = new Date()
  const currentBudget = budgets.find(
    b => b.month === now.getMonth() + 1 && b.year === now.getFullYear()
  ) || budgets[0]

  if (!currentBudget) return null

  // Calculate spending per category
  const thisMonthTxs = transactions.filter(tx => {
    const d = new Date(tx.date)
    return tx.type === 'expense' &&
      d.getMonth() + 1 === (currentBudget.month) &&
      d.getFullYear() === currentBudget.year
  })

  const spentByCategory = thisMonthTxs.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount
    return acc
  }, {})

  const catBudgets = currentBudget.category_budgets || []

  return (
    <div className="card">
      <div className="flex items-center justify-between px-6 py-4 border-b"
           style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Budget Overview
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            This month's category limits
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm gap-1 text-xs"
          style={{ color: 'var(--color-primary)' }}
          onClick={() => navigate('/budgets')}
        >
          Manage <ArrowRight size={13} />
        </button>
      </div>

      <div className="p-6 space-y-4">
        {catBudgets.slice(0, 6).map(({ category, budget }) => {
          const spent = spentByCategory[category] || 0
          const pct = Math.min((spent / budget) * 100, 100)
          const isOver = spent > budget
          const isWarning = pct >= 80 && !isOver
          const cat = CATEGORY_MAP[category]

          return (
            <div key={category}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{cat?.icon}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {category}
                  </span>
                  {isOver && <AlertTriangle size={13} style={{ color: 'var(--color-danger)' }} />}
                </div>
                <div className="flex items-center gap-2">
                  <span className={clsx('text-xs tabular-nums font-medium',
                    isOver ? 'amount-negative' : isWarning ? 'text-amber-500' : 'amount-positive'
                  )}>
                    {formatCurrency(spent, currency)}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    / {formatCurrency(budget, currency)}
                  </span>
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${pct}%`,
                    background: isOver ? 'var(--color-danger)' : isWarning ? 'var(--color-warning)' : 'var(--color-success)',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
