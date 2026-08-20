// src/pages/Subscriptions.jsx
import { useState, useEffect, useCallback } from 'react'
import { subscriptionsApi } from '../api/subscriptionsApi'
import { useApp } from '../context/AppContext'
import {
  Plus, Bell, Calendar, CreditCard, ToggleLeft, ToggleRight,
  Trash2, Edit2, FileText, CheckCircle2, Clock
} from 'lucide-react'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Input from '../components/common/Input'
import { formatCurrency, formatDate } from '../utils/formatters'
import { CATEGORIES } from '../utils/constants'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const DEMO_SUBS = [
  { _id: 'd1', name: 'Netflix', amount: 499, billing_cycle: 'monthly', category: 'Entertainment', next_billing_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], icon: '📺', color: '#ef4444', is_active: true, monthly_cost: 499, yearly_cost: 5988, days_until_billing: 5, is_due_soon: true },
  { _id: 'd2', name: 'Spotify', amount: 119, billing_cycle: 'monthly', category: 'Entertainment', next_billing_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0], icon: '🎵', color: '#10b981', is_active: true, monthly_cost: 119, yearly_cost: 1428, days_until_billing: 10, is_due_soon: false },
  { _id: 'd3', name: 'Amazon Prime', amount: 1499, billing_cycle: 'yearly', category: 'Shopping', next_billing_date: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0], icon: '📦', color: '#f59e0b', is_active: true, monthly_cost: 124.9, yearly_cost: 1499, days_until_billing: 120, is_due_soon: false },
  { _id: 'd4', name: 'Gym Membership', amount: 1500, billing_cycle: 'monthly', category: 'Health', next_billing_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], icon: '💪', color: '#6366f1', is_active: false, monthly_cost: 1500, yearly_cost: 18000, days_until_billing: 2, is_due_soon: true },
]

const SUB_ICONS = ['📺', '🎵', '📦', '💪', '📱', '☁️', '🎮', '📚', '🎬', '🛡️', '✉️', '🔧']
const SUB_COLORS = ['#ef4444', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#06b6d4', '#ec4899']

// ── Subscription Form Modal ────────────────────────────────────────────────────
function SubFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const defaultForm = {
    name: '', amount: '', billing_cycle: 'monthly',
    category: 'Entertainment', next_billing_date: '',
    icon: '📱', color: '#6366f1', description: '', website: '',
  }
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        amount: initialData.amount?.toString() || '',
        billing_cycle: initialData.billing_cycle || 'monthly',
        category: initialData.category || 'Entertainment',
        next_billing_date: initialData.next_billing_date || '',
        icon: initialData.icon || '📱',
        color: initialData.color || '#6366f1',
        description: initialData.description || '',
        website: initialData.website || '',
      })
    } else {
      setForm(defaultForm)
    }
  }, [initialData, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.amount || !form.next_billing_date) {
      toast.error('Name, amount and next billing date are required')
      return
    }
    setLoading(true)
    try {
      await onSubmit({ ...form, amount: parseFloat(form.amount) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Subscription' : 'Add Subscription'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {SUB_ICONS.map(ic => (
            <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
              className="w-9 h-9 text-lg rounded-xl border-2 transition-all"
              style={{ borderColor: form.icon === ic ? form.color : 'transparent', background: form.icon === ic ? `${form.color}20` : 'var(--color-surface-subtle)' }}>
              {ic}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {SUB_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
              className="w-6 h-6 rounded-full border-2 transition-all"
              style={{ background: c, borderColor: form.color === c ? 'var(--color-text-primary)' : 'transparent', transform: form.color === c ? 'scale(1.2)' : 'scale(1)' }} />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Service Name" placeholder="Netflix" required
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Amount (₹)" type="number" required
            value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              Billing Cycle
            </label>
            <select className="form-input" value={form.billing_cycle}
              onChange={e => setForm(f => ({ ...f, billing_cycle: e.target.value }))}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              Category
            </label>
            <select className="form-input" value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <Input label="Next Billing Date" type="date" required
          value={form.next_billing_date} onChange={e => setForm(f => ({ ...f, next_billing_date: e.target.value }))} />

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading}>
            {initialData ? 'Save Changes' : 'Add Subscription'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Invoice Modal ─────────────────────────────────────────────────────────────
function InvoiceModal({ isOpen, onClose, invoice }) {
  if (!invoice) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice" size="sm">
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 rounded-xl"
          style={{ background: 'var(--color-surface-subtle)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
            Invoice #{invoice.invoice_number}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{invoice.date}</span>
        </div>
        <div className="space-y-2">
          {invoice.line_items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>{item.description}</span>
              <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>₹{item.total}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm border-t pt-2 font-bold"
            style={{ borderColor: 'var(--color-border)' }}>
            <span style={{ color: 'var(--color-text-primary)' }}>Total</span>
            <span style={{ color: 'var(--color-primary)' }}>₹{invoice.total}</span>
          </div>
        </div>
        <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
          {invoice.note}
        </p>
        <Button variant="secondary" className="w-full" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  )
}

// ── Subscription Card ──────────────────────────────────────────────────────────
function SubCard({ sub, onToggle, onEdit, onDelete, onViewInvoice }) {
  const { currency } = useApp()
  const isDueSoon = sub.is_due_soon
  const isActive = sub.is_active

  return (
    <div className={clsx('card p-4 transition-all', !isActive && 'opacity-60')}
      style={{ borderLeft: `3px solid ${sub.color || 'var(--color-primary)'}` }}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: `${sub.color || '#6366f1'}20` }}>
          {sub.icon || '📱'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
              {sub.name}
            </p>
            {isDueSoon && isActive && (
              <span className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}>
                Due soon
              </span>
            )}
          </div>
          <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
            {sub.billing_cycle} · {sub.category}
            {sub.days_until_billing !== null && ` · ${sub.days_until_billing}d away`}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
            {formatCurrency(sub.amount, currency)}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            ₹{sub.monthly_cost?.toFixed(0)}/mo
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t"
        style={{ borderColor: 'var(--color-border-subtle)' }}>
        <div className="flex items-center gap-1 text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
          <Calendar size={11} className="flex-shrink-0" />
          <span className="truncate">{sub.next_billing_date}</span>
        </div>
        <div className="flex-1 min-w-0" />
        <button onClick={() => onViewInvoice(sub._id)}
          className="btn btn-ghost btn-sm !p-1.5 rounded-lg" title="View Invoice" aria-label="View invoice">
          <FileText size={13} />
        </button>
        <button onClick={() => onEdit(sub)} className="btn btn-ghost btn-sm !p-1.5 rounded-lg" title="Edit" aria-label="Edit">
          <Edit2 size={13} />
        </button>
        <button onClick={() => onToggle(sub._id, !sub.is_active)}
          className="btn btn-ghost btn-sm !p-1.5 rounded-lg" title={sub.is_active ? 'Pause' : 'Activate'} aria-label="Toggle active">
          {sub.is_active ? <ToggleRight size={16} style={{ color: 'var(--color-success)' }} /> : <ToggleLeft size={16} style={{ color: 'var(--color-text-tertiary)' }} />}
        </button>
        <button onClick={() => onDelete(sub._id)}
          className="btn btn-ghost btn-sm !p-1.5 rounded-lg hover:!text-red-500" title="Delete" aria-label="Delete">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Subscriptions() {
  const { currency } = useApp()
  const [subs, setSubs] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [invoiceOpen, setInvoiceOpen] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [subsRes, sumRes] = await Promise.all([
        subscriptionsApi.getAll(),
        subscriptionsApi.getSummary(),
      ])
      setSubs(subsRes.data)
      setSummary(sumRes.data)
    } catch {
      setSubs(DEMO_SUBS)
      const totalMonthly = DEMO_SUBS.filter(s => s.is_active).reduce((s, sub) => s + (sub.monthly_cost || 0), 0)
      setSummary({ total_monthly: totalMonthly, total_yearly: totalMonthly * 12, count: DEMO_SUBS.filter(s => s.is_active).length })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleCreate = async (data) => {
    try {
      const { data: created } = await subscriptionsApi.create(data)
      setSubs(prev => [created, ...prev])
    } catch {
      const demo = { ...data, _id: `d${Date.now()}`, monthly_cost: data.amount, yearly_cost: data.amount * 12, is_active: true, days_until_billing: 30, is_due_soon: false }
      setSubs(prev => [demo, ...prev])
    }
    setFormOpen(false)
    toast.success('Subscription added!')
  }

  const handleEdit = async (data) => {
    try {
      const { data: updated } = await subscriptionsApi.update(editTarget._id, data)
      setSubs(prev => prev.map(s => s._id === editTarget._id ? updated : s))
    } catch {
      setSubs(prev => prev.map(s => s._id === editTarget._id ? { ...s, ...data } : s))
    }
    setEditTarget(null)
    setFormOpen(false)
    toast.success('Subscription updated!')
  }

  const handleToggle = async (id, isActive) => {
    await subscriptionsApi.update(id, { is_active: isActive }).catch(() => {})
    setSubs(prev => prev.map(s => s._id === id ? { ...s, is_active: isActive } : s))
    toast.success(isActive ? 'Subscription activated' : 'Subscription paused')
  }

  const handleDelete = async (id) => {
    await subscriptionsApi.delete(id).catch(() => {})
    setSubs(prev => prev.filter(s => s._id !== id))
    toast.success('Subscription removed')
  }

  const handleViewInvoice = async (id) => {
    try {
      const { data } = await subscriptionsApi.getInvoice(id)
      setInvoice(data)
    } catch {
      const sub = subs.find(s => s._id === id)
      setInvoice({
        invoice_number: `DEMO-${id.slice(-6).toUpperCase()}`,
        date: new Date().toLocaleDateString('en-IN'),
        service_name: sub?.name,
        line_items: [{ description: `${sub?.name} Subscription`, total: sub?.amount }],
        total: sub?.amount,
        note: 'This is a demo invoice for tracking purposes only.',
      })
    }
    setInvoiceOpen(true)
  }

  const activeSubs = subs.filter(s => s.is_active)
  const dueSoon = subs.filter(s => s.is_due_soon && s.is_active)

  return (
    <div className="space-y-6 animate-fade-in max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Subscriptions
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Track and manage all your recurring subscriptions
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus}
          onClick={() => { setEditTarget(null); setFormOpen(true) }}>
          Add Subscription
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="card p-4 min-w-0">
          <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>Monthly Total</p>
          <p className="text-xl font-bold mt-1 truncate" style={{ color: 'var(--color-primary)' }}>
            {formatCurrency(summary?.total_monthly || 0, currency)}
          </p>
        </div>
        <div className="card p-4 min-w-0">
          <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>Yearly Cost</p>
          <p className="text-xl font-bold mt-1 truncate" style={{ color: 'var(--color-warning)' }}>
            {formatCurrency(summary?.total_yearly || 0, currency)}
          </p>
        </div>
        <div className="card p-4 min-w-0">
          <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>Due Soon</p>
          <p className="text-xl font-bold mt-1 truncate" style={{ color: 'var(--color-danger)' }}>
            {dueSoon.length}
          </p>
        </div>
      </div>

      {/* Due soon reminder */}
      {dueSoon.length > 0 && (
        <div className="card p-4 flex items-start gap-3" style={{ background: 'var(--color-warning-muted)' }}>
          <Bell size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {dueSoon.length} subscription{dueSoon.length > 1 ? 's' : ''} due soon
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {dueSoon.map(s => `${s.name} (${s.days_until_billing}d)`).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Subscriptions list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card p-4 animate-pulse flex gap-3">
              <div className="w-11 h-11 rounded-xl flex-shrink-0" style={{ background: 'var(--color-border)' }} />
              <div className="flex-1 space-y-2">
                <div className="h-4 rounded" style={{ background: 'var(--color-border)', width: '30%' }} />
                <div className="h-3 rounded" style={{ background: 'var(--color-border)', width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : subs.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center">
          <CreditCard size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-tertiary)' }} />
          <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>No subscriptions yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Add your Netflix, Spotify, gym membership and other recurring services
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {subs.map(sub => (
            <SubCard key={sub._id} sub={sub}
              onToggle={handleToggle} onEdit={s => { setEditTarget(s); setFormOpen(true) }}
              onDelete={handleDelete} onViewInvoice={handleViewInvoice} />
          ))}
        </div>
      )}

      <SubFormModal isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSubmit={editTarget ? handleEdit : handleCreate}
        initialData={editTarget} />
      <InvoiceModal isOpen={invoiceOpen} onClose={() => setInvoiceOpen(false)} invoice={invoice} />
    </div>
  )
}
