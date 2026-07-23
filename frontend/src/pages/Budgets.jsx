// src/pages/Budgets.jsx
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Plus, Edit2, Trash2, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Input from '../components/common/Input'
import ConfirmModal from '../components/common/ConfirmModal'
import { CATEGORIES, CATEGORY_MAP } from '../utils/constants'
import { formatCurrency } from '../utils/formatters'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const CATEGORY_OPTIONS = CATEGORIES.filter(c => !['Salary', 'Freelance', 'Other'].includes(c.value))

function BudgetFormModal({ isOpen, onClose, onSubmit, initialData, transactions }) {
  const now = new Date()
  const [form, setForm] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    total_budget: '',
    category_budgets: CATEGORY_OPTIONS.map(c => ({ category: c.value, budget: '' })),
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setForm({
        month: initialData.month,
        year: initialData.year,
        total_budget: initialData.total_budget?.toString() || '',
        category_budgets: CATEGORY_OPTIONS.map(c => {
          const existing = initialData.category_budgets?.find(b => b.category === c.value)
          return { category: c.value, budget: existing?.budget?.toString() || '' }
        }),
      })
    }
  }, [initialData, isOpen])

  const handleCatChange = (idx, val) => {
    setForm(f => {
      const cb = [...f.category_budgets]
      cb[idx] = { ...cb[idx], budget: val }
      return { ...f, category_budgets: cb }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        month: Number(form.month),
        year: Number(form.year),
        total_budget: Number(form.total_budget),
        category_budgets: form.category_budgets
          .filter(cb => cb.budget)
          .map(cb => ({ category: cb.category, budget: Number(cb.budget) })),
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Budget' : 'Create Budget'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Month</label>
            <select className="form-input" value={form.month} onChange={e => setForm(f => ({...f, month: e.target.value}))}>
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Year</label>
            <input className="form-input" type="number" value={form.year}
              onChange={e => setForm(f => ({...f, year: e.target.value}))} />
          </div>
          <Input label="Total Budget (₹)" type="number" placeholder="35000"
            value={form.total_budget}
            onChange={e => setForm(f => ({...f, total_budget: e.target.value}))} />
        </div>

        <div>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Category Limits (optional)
          </p>
          <div className="grid grid-cols-2 gap-3">
            {form.category_budgets.map((cb, idx) => {
              const cat = CATEGORY_MAP[cb.category]
              return (
                <div key={cb.category} className="flex items-center gap-2">
                  <span className="text-base w-6 text-center">{cat?.icon}</span>
                  <input
                    className="form-input flex-1 h-9 text-sm"
                    placeholder={`${cb.category} limit...`}
                    type="number"
                    value={cb.budget}
                    onChange={e => handleCatChange(idx, e.target.value)}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading}>
            {initialData ? 'Save Changes' : 'Create Budget'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function Budgets() {
  const { budgets, transactions, loading, fetchBudgets, saveBudget, deleteBudget, currency } = useApp()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchBudgets()
  }, [])

  const handleSave = async (data) => {
    await saveBudget(data, editTarget?._id)
    toast.success(editTarget ? 'Budget updated' : 'Budget created')
    setFormOpen(false)
    setEditTarget(null)
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteBudget(deleteTarget._id)
      toast.success('Budget deleted')
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const getSpending = (budget) => {
    return transactions.filter(t =>
      t.type === 'expense' &&
      new Date(t.date).getMonth() + 1 === budget.month &&
      new Date(t.date).getFullYear() === budget.year
    ).reduce((sum, t) => sum + t.amount, 0)
  }

  const getSpendingByCategory = (budget) => {
    const result = {}
    transactions.filter(t =>
      t.type === 'expense' &&
      new Date(t.date).getMonth() + 1 === budget.month &&
      new Date(t.date).getFullYear() === budget.year
    ).forEach(t => { result[t.category] = (result[t.category] || 0) + t.amount })
    return result
  }

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Budgets</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Set and track your monthly spending limits
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => { setEditTarget(null); setFormOpen(true) }}>
          New Budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <div className="card p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
               style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
            <TrendingUp size={32} strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>No budgets yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Create your first budget to start tracking your limits
            </p>
          </div>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setFormOpen(true)}>
            Create Budget
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {budgets.map(budget => {
            const totalSpent = getSpending(budget)
            const spentByCategory = getSpendingByCategory(budget)
            const totalPct = Math.min((totalSpent / budget.total_budget) * 100, 100)
            const isOverall = totalSpent > budget.total_budget

            return (
              <div key={budget._id} className="card overflow-hidden">
                {/* Budget header */}
                <div className="flex items-center justify-between px-6 py-4 border-b"
                     style={{ borderColor: 'var(--color-border)' }}>
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {MONTH_NAMES[budget.month - 1]} {budget.year}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                      Total budget: {formatCurrency(budget.total_budget, currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={clsx('tabular-nums font-bold', isOverall ? 'amount-negative' : 'amount-positive')}>
                        {formatCurrency(totalSpent, currency)}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        spent of {formatCurrency(budget.total_budget, currency)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-sm !p-1.5 rounded-lg"
                              onClick={() => { setEditTarget(budget); setFormOpen(true) }}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm !p-1.5 rounded-lg hover:!text-red-500"
                              onClick={() => setDeleteTarget(budget)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Overall progress */}
                <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      Overall Budget
                    </span>
                    <span className="text-sm tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                      {totalPct.toFixed(0)}% used
                      {isOverall && <span className="ml-2" style={{ color: 'var(--color-danger)' }}>⚠ Over budget</span>}
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: '8px' }}>
                    <div className="progress-fill" style={{
                      width: `${totalPct}%`,
                      background: isOverall ? 'var(--color-danger)'
                        : totalPct >= 80 ? 'var(--color-warning)'
                        : 'var(--color-success)'
                    }} />
                  </div>
                </div>

                {/* Category budgets */}
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-4"
                     style={{ color: 'var(--color-text-tertiary)' }}>
                    Category Limits
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {budget.category_budgets?.map(({ category, budget: limit }) => {
                      const spent = spentByCategory[category] || 0
                      const pct = Math.min((spent / limit) * 100, 100)
                      const isOver = spent > limit
                      const isWarn = pct >= 80 && !isOver
                      const cat = CATEGORY_MAP[category]
                      const remaining = Math.max(limit - spent, 0)

                      return (
                        <div key={category} className="p-4 rounded-xl border"
                             style={{ borderColor: isOver ? 'var(--color-danger)' : 'var(--color-border)', background: 'var(--color-surface-subtle)' }}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span>{cat?.icon}</span>
                              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                {category}
                              </span>
                            </div>
                            {isOver ? (
                              <AlertTriangle size={14} style={{ color: 'var(--color-danger)' }} />
                            ) : pct >= 80 ? (
                              <AlertTriangle size={14} style={{ color: 'var(--color-warning)' }} />
                            ) : (
                              <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} />
                            )}
                          </div>
                          <div className="progress-bar mb-2">
                            <div className="progress-fill" style={{
                              width: `${pct}%`,
                              background: isOver ? 'var(--color-danger)' : isWarn ? 'var(--color-warning)' : 'var(--color-success)',
                            }} />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className={isOver ? 'amount-negative font-medium' : ''} style={{ color: isOver ? undefined : 'var(--color-text-secondary)' }}>
                              {formatCurrency(spent, currency)} spent
                            </span>
                            <span style={{ color: 'var(--color-text-tertiary)' }}>
                              {isOver ? 'Over by ' + formatCurrency(spent - limit, currency) : formatCurrency(remaining, currency) + ' left'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <BudgetFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSubmit={handleSave}
        initialData={editTarget}
        transactions={transactions}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Budget"
        message={`Delete budget for ${MONTH_NAMES[(deleteTarget?.month || 1) - 1]} ${deleteTarget?.year}?`}
      />
    </div>
  )
}
