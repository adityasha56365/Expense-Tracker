// src/pages/SavingsGoals.jsx
import { useState, useEffect, useCallback } from 'react'
import { goalsApi } from '../api/goalsApi'
import { useApp } from '../context/AppContext'
import {
  Plus, Target, TrendingUp, Trash2, Edit2, DollarSign,
  Gift, CheckCircle2, Lightbulb, X, Sparkles
} from 'lucide-react'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Input from '../components/common/Input'
import { formatCurrency, formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const GOAL_ICONS = ['🎯', '🏖️', '💻', '🚗', '🏠', '📱', '✈️', '🎓', '🏋️', '💍', '🎪', '🛡️']
const GOAL_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

// ── Celebration Confetti ────────────────────────────────────────────────────
function Confetti({ show }) {
  if (!show) return null
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1}s`,
    duration: `${1 + Math.random() * 2}s`,
  }))
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute w-2 h-3 rounded-sm"
          style={{
            background: p.color,
            left: p.left,
            top: '-20px',
            animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          to { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ── Goal Progress Ring ──────────────────────────────────────────────────────
function ProgressRing({ pct, color, size = 80, strokeWidth = 8 }) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none"
        stroke="var(--color-border)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
      />
      <text x={size/2} y={size/2 + 4} textAnchor="middle"
        fontSize={size < 60 ? 10 : 14} fontWeight="700" fill={color} fontFamily="Inter">
        {Math.min(pct, 100).toFixed(0)}%
      </text>
    </svg>
  )
}

// ── Goal Form Modal ─────────────────────────────────────────────────────────
function GoalFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const defaultForm = {
    title: '', target_amount: '', current_amount: '0',
    target_date: '', icon: '🎯', color: '#6366f1', description: '',
  }
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        target_amount: initialData.target_amount?.toString() || '',
        current_amount: initialData.current_amount?.toString() || '0',
        target_date: initialData.target_date || '',
        icon: initialData.icon || '🎯',
        color: initialData.color || '#6366f1',
        description: initialData.description || '',
      })
    } else {
      setForm(defaultForm)
    }
  }, [initialData, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.target_amount) {
      toast.error('Title and target amount are required')
      return
    }
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        target_amount: parseFloat(form.target_amount),
        current_amount: parseFloat(form.current_amount) || 0,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Goal' : 'New Savings Goal'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Icon + Color pickers */}
        <div className="space-y-3">
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Icon
          </label>
          <div className="flex flex-wrap gap-2">
            {GOAL_ICONS.map(icon => (
              <button key={icon} type="button"
                onClick={() => setForm(f => ({ ...f, icon }))}
                className={clsx('w-10 h-10 text-xl rounded-xl border-2 transition-all', form.icon === icon ? 'scale-110' : 'border-transparent hover:border-[var(--color-border)]')}
                style={{ borderColor: form.icon === icon ? form.color : undefined, background: form.icon === icon ? `${form.color}20` : 'var(--color-surface-subtle)' }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Color</label>
          <div className="flex gap-2">
            {GOAL_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                className="w-7 h-7 rounded-full border-2 transition-all"
                style={{ background: c, borderColor: form.color === c ? 'var(--color-text-primary)' : 'transparent', transform: form.color === c ? 'scale(1.2)' : 'scale(1)' }}
              />
            ))}
          </div>
        </div>

        <Input label="Goal Title" placeholder="e.g. MacBook Pro, Vacation in Goa" required
          value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Target Amount (₹)" type="number" placeholder="50000" required
            value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} />
          <Input label="Already Saved (₹)" type="number" placeholder="0"
            value={form.current_amount} onChange={e => setForm(f => ({ ...f, current_amount: e.target.value }))} />
        </div>

        <Input label="Target Date (optional)" type="date"
          value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} />

        <Input label="Description (optional)" placeholder="What this goal means to you..."
          value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading}>
            {initialData ? 'Save Changes' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Contribute Modal ─────────────────────────────────────────────────────────
function ContributeModal({ isOpen, onClose, goal, onContribute }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const remaining = goal ? goal.target_amount - goal.current_amount : 0
  const suggestions = goal ? [
    Math.round(remaining * 0.1),
    Math.round(remaining * 0.25),
    Math.round(remaining * 0.5),
  ].filter(v => v > 0 && v <= remaining) : []

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    setLoading(true)
    try {
      await onContribute({ amount: parseFloat(amount), note })
      setAmount('')
      setNote('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add to "${goal?.title || ''}"`} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {suggestions.map(s => (
            <button key={s} type="button"
              onClick={() => setAmount(s.toString())}
              className="px-3 py-1.5 rounded-lg text-sm border transition-colors"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-subtle)', color: 'var(--color-text-secondary)' }}
            >
              ₹{s.toLocaleString()}
            </button>
          ))}
        </div>
        <Input label="Amount (₹)" type="number" required placeholder="Enter amount"
          value={amount} onChange={e => setAmount(e.target.value)} />
        <Input label="Note (optional)" placeholder="Reason for contribution"
          value={note} onChange={e => setNote(e.target.value)} />
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading}>Add Contribution</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Goal Card ────────────────────────────────────────────────────────────────
function GoalCard({ goal, onEdit, onDelete, onContribute }) {
  const { currency } = useApp()
  const color = goal.color || '#6366f1'
  const isCompleted = goal.is_completed
  const pct = goal.progress_pct || 0

  return (
    <div className="card overflow-hidden transition-all hover:shadow-lg group"
      style={{ borderTop: `3px solid ${color}` }}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: `${color}20` }}>
              {goal.icon || '🎯'}
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {goal.title}
              </h3>
              {goal.target_date && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  Target: {formatDate(goal.target_date)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isCompleted && (
              <button onClick={onEdit} className="btn btn-ghost btn-sm !p-1.5 rounded-lg">
                <Edit2 size={13} />
              </button>
            )}
            <button onClick={onDelete} className="btn btn-ghost btn-sm !p-1.5 rounded-lg hover:!text-red-500">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ProgressRing pct={pct} color={isCompleted ? '#10b981' : color} />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--color-text-tertiary)' }}>Saved</span>
              <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {formatCurrency(goal.current_amount, currency)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--color-text-tertiary)' }}>Target</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {formatCurrency(goal.target_amount, currency)}
              </span>
            </div>
            {goal.remaining_amount > 0 && (
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--color-text-tertiary)' }}>Remaining</span>
                <span style={{ color }}>{formatCurrency(goal.remaining_amount, currency)}</span>
              </div>
            )}
          </div>
        </div>

        {isCompleted ? (
          <div className="mt-4 flex items-center gap-2 justify-center p-3 rounded-xl"
            style={{ background: '#10b98120' }}>
            <CheckCircle2 size={16} style={{ color: '#10b981' }} />
            <span className="text-sm font-semibold" style={{ color: '#10b981' }}>Goal Achieved! 🎉</span>
          </div>
        ) : (
          <Button variant="primary" size="sm" className="w-full mt-4"
            icon={DollarSign} onClick={onContribute}
            style={{ background: color, borderColor: color }}>
            Add Contribution
          </Button>
        )}

        {goal.monthly_needed && !isCompleted && (
          <p className="text-xs text-center mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
            Save {formatCurrency(goal.monthly_needed, currency)}/month to reach goal on time
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function SavingsGoals() {
  const { currency } = useApp()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [contributeTarget, setContributeTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await goalsApi.getAll()
      setGoals(data)
    } catch {
      // Demo goals
      setGoals([
        { _id: 'd1', title: 'MacBook Pro', icon: '💻', color: '#6366f1', target_amount: 150000, current_amount: 45000, progress_pct: 30, remaining_amount: 105000, target_date: '2025-12-31', monthly_needed: 8750, is_completed: false },
        { _id: 'd2', title: 'Goa Vacation', icon: '🏖️', color: '#10b981', target_amount: 30000, current_amount: 30000, progress_pct: 100, remaining_amount: 0, target_date: '2025-06-01', monthly_needed: null, is_completed: true },
        { _id: 'd3', title: 'Emergency Fund', icon: '🛡️', color: '#f59e0b', target_amount: 100000, current_amount: 62000, progress_pct: 62, remaining_amount: 38000, target_date: null, monthly_needed: 5000, is_completed: false },
      ])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  const handleCreate = async (data) => {
    try {
      const { data: created } = await goalsApi.create(data)
      setGoals(prev => [created, ...prev])
      setFormOpen(false)
      toast.success('Goal created!')
    } catch {
      const demo = { ...data, _id: `d${Date.now()}`, progress_pct: (data.current_amount / data.target_amount) * 100, remaining_amount: data.target_amount - data.current_amount, is_completed: data.current_amount >= data.target_amount }
      setGoals(prev => [demo, ...prev])
      setFormOpen(false)
      toast.success('Goal created!')
    }
  }

  const handleEdit = async (data) => {
    try {
      const { data: updated } = await goalsApi.update(editTarget._id, data)
      setGoals(prev => prev.map(g => g._id === editTarget._id ? updated : g))
    } catch {
      setGoals(prev => prev.map(g => g._id === editTarget._id ? { ...g, ...data } : g))
    }
    setEditTarget(null)
    setFormOpen(false)
    toast.success('Goal updated!')
  }

  const handleDelete = async (id) => {
    setDeleteLoading(true)
    try {
      await goalsApi.delete(id).catch(() => {})
      setGoals(prev => prev.filter(g => g._id !== id))
      toast.success('Goal deleted')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleContribute = async ({ amount, note }) => {
    if (!contributeTarget) return
    try {
      const { data } = await goalsApi.contribute(contributeTarget._id, { amount, note })
      setGoals(prev => prev.map(g => g._id === contributeTarget._id ? data : g))
      if (data.just_completed) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
        toast.success('🎉 Goal completed! Congratulations!')
      } else {
        toast.success(`₹${amount.toLocaleString()} added!`)
      }
    } catch {
      // Demo fallback
      setGoals(prev => prev.map(g => {
        if (g._id !== contributeTarget._id) return g
        const newCurrent = (g.current_amount || 0) + amount
        return { ...g, current_amount: newCurrent, progress_pct: Math.min(newCurrent / g.target_amount * 100, 100), remaining_amount: Math.max(g.target_amount - newCurrent, 0), is_completed: newCurrent >= g.target_amount }
      }))
      toast.success(`₹${amount.toLocaleString()} added!`)
    }
    setContributeTarget(null)
  }

  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0)
  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0)
  const completedGoals = goals.filter(g => g.is_completed).length

  return (
    <div className="space-y-6 animate-fade-in">
      <Confetti show={showConfetti} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Savings Goals</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Track your financial targets and celebrate milestones
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus}
          onClick={() => { setEditTarget(null); setFormOpen(true) }}>
          New Goal
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Goals', value: goals.length, icon: '🎯', color: '#6366f1' },
          { label: 'Total Saved', value: formatCurrency(totalSaved, currency), icon: '💰', color: '#10b981' },
          { label: 'Goals Completed', value: completedGoals, icon: '🏆', color: '#f59e0b' },
        ].map(item => (
          <div key={item.label} className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `${item.color}20` }}>{item.icon}</div>
            <div>
              <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Goals grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="card p-5 space-y-3 animate-pulse">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-2xl" style={{ background: 'var(--color-border)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded" style={{ background: 'var(--color-border)', width: '60%' }} />
                  <div className="h-3 rounded" style={{ background: 'var(--color-border)', width: '40%' }} />
                </div>
              </div>
              <div className="h-20 rounded-xl" style={{ background: 'var(--color-border)' }} />
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="card p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: 'var(--color-primary-muted)' }}>🎯</div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>No goals yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Create your first savings goal and start tracking your financial dreams
            </p>
          </div>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setFormOpen(true)}>
            Create First Goal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map(goal => (
            <GoalCard
              key={goal._id}
              goal={goal}
              onEdit={() => { setEditTarget(goal); setFormOpen(true) }}
              onDelete={() => handleDelete(goal._id)}
              onContribute={() => setContributeTarget(goal)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <GoalFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSubmit={editTarget ? handleEdit : handleCreate}
        initialData={editTarget}
      />
      <ContributeModal
        isOpen={!!contributeTarget}
        onClose={() => setContributeTarget(null)}
        goal={contributeTarget}
        onContribute={handleContribute}
      />
    </div>
  )
}
