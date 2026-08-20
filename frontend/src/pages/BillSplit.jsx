// src/pages/BillSplit.jsx
import { useState, useEffect, useRef } from 'react'
import { splitsApi } from '../api/splitsApi'
import { useApp } from '../context/AppContext'
import {
  Plus, Users, CheckCircle2, X, Copy, Share2,
  Trash2, QrCode, ChevronDown, ChevronUp
} from 'lucide-react'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Input from '../components/common/Input'
import { formatCurrency, formatDate } from '../utils/formatters'
import { CATEGORIES } from '../utils/constants'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const DEMO_SPLITS = [
  {
    _id: 'd1', title: 'Dinner at Barbeque Nation', total_amount: 3600, split_type: 'equal',
    status: 'pending', date: new Date().toISOString(), category: 'Food',
    participants: [
      { name: 'You', share: 900, share_pct: 25, paid: true, paid_at: new Date().toISOString() },
      { name: 'Rahul', share: 900, share_pct: 25, paid: false },
      { name: 'Priya', share: 900, share_pct: 25, paid: true },
      { name: 'Amit', share: 900, share_pct: 25, paid: false },
    ],
  },
  {
    _id: 'd2', title: 'Goa Trip Expenses', total_amount: 15000, split_type: 'percentage',
    status: 'settled', date: new Date(Date.now() - 7 * 86400000).toISOString(), category: 'Transport',
    participants: [
      { name: 'You', share: 5000, share_pct: 33.3, paid: true },
      { name: 'Sneha', share: 5000, share_pct: 33.3, paid: true },
      { name: 'Dev', share: 5000, share_pct: 33.4, paid: true },
    ],
  },
]

// ── QR Code Generator ─────────────────────────────────────────────────────────
function QRModal({ isOpen, onClose, split }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!isOpen || !split) return
    const text = `Pay ₹${split.total_amount} for "${split.title}"`
    import('qrcode').then(QRCode => {
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, text, { width: 200, margin: 2 })
      }
    }).catch(() => {})
  }, [isOpen, split])

  const handleCopy = () => {
    const link = `${window.location.origin}/split/${split?._id}`
    navigator.clipboard.writeText(link).then(() => toast.success('Link copied!')).catch(() => toast.error('Copy failed'))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Bill" size="sm">
      <div className="text-center space-y-4">
        <canvas ref={canvasRef} className="mx-auto rounded-xl max-w-[200px]" />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Scan this QR or copy the link to share
        </p>
        <div className="flex gap-2">
          <button
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            onClick={handleCopy}
          >
            <Copy size={14} />
            Copy Link
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Create Split Modal ────────────────────────────────────────────────────────
function CreateSplitModal({ isOpen, onClose, onSubmit }) {
  const defaultParticipant = { name: '', email: '', share: '' }
  const [form, setForm] = useState({
    title: '', total_amount: '', split_type: 'equal',
    category: 'Food', note: '',
  })
  const [participants, setParticipants] = useState([
    { name: 'You', email: '', share: '' },
    { name: '', email: '', share: '' },
  ])
  const [loading, setLoading] = useState(false)

  const addParticipant = () => setParticipants(p => [...p, { ...defaultParticipant }])
  const removeParticipant = (i) => {
    if (participants.length <= 2) return
    setParticipants(p => p.filter((_, idx) => idx !== i))
  }
  const updateParticipant = (i, field, val) => {
    setParticipants(p => p.map((x, idx) => idx === i ? { ...x, [field]: val } : x))
  }

  const getShareLabel = () => {
    if (form.split_type === 'equal') return null
    if (form.split_type === 'percentage') return '% share'
    return '₹ amount'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validParticipants = participants.filter(p => p.name.trim())
    if (validParticipants.length < 2) { toast.error('Add at least 2 participants'); return }
    if (!form.title || !form.total_amount) { toast.error('Fill in required fields'); return }
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        total_amount: parseFloat(form.total_amount),
        participants: validParticipants.map(p => ({
          ...p,
          share: p.share ? parseFloat(p.share) : undefined,
        })),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Split a Bill" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Bill Title" placeholder="e.g. Dinner at Tao" required
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Input label="Total Amount (₹)" type="number" required
            value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
            Split Type
          </label>
          <div className="flex gap-2">
            {[
              { key: 'equal', label: '⚖️ Equal' },
              { key: 'percentage', label: '📊 Percentage' },
              { key: 'custom', label: '✏️ Custom' },
            ].map(t => (
              <button key={t.key} type="button"
                onClick={() => setForm(f => ({ ...f, split_type: t.key }))}
                className="flex-1 py-2 rounded-xl text-xs sm:text-sm border transition-all"
                style={{
                  borderColor: form.split_type === t.key ? 'var(--color-primary)' : 'var(--color-border)',
                  background: form.split_type === t.key ? 'var(--color-primary-muted)' : 'var(--color-surface-subtle)',
                  color: form.split_type === t.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: form.split_type === t.key ? '600' : '400',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Participants */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Participants ({participants.length})
            </label>
            <button type="button" onClick={addParticipant}
              className="text-xs flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
              <Plus size={12} /> Add Person
            </button>
          </div>
          {participants.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className="form-input flex-1 min-w-0" placeholder={`Person ${i + 1} name`}
                value={p.name} onChange={e => updateParticipant(i, 'name', e.target.value)} />
              {form.split_type !== 'equal' && (
                <input className="form-input w-20 sm:w-24 flex-shrink-0" placeholder={getShareLabel()} type="number"
                  value={p.share} onChange={e => updateParticipant(i, 'share', e.target.value)} />
              )}
              {i >= 2 && (
                <button type="button" onClick={() => removeParticipant(i)}
                  className="btn btn-ghost btn-sm !p-1.5 rounded-lg hover:!text-red-500 flex-shrink-0" aria-label="Remove person">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading} icon={Users}>Create Split</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Split Card ────────────────────────────────────────────────────────────────
function SplitCard({ split, onSettle, onDelete, onShare }) {
  const { currency } = useApp()
  const [expanded, setExpanded] = useState(false)
  const isSettled = split.status === 'settled'
  const paidCount = split.participants.filter(p => p.paid).length
  const totalParticipants = split.participants.length

  return (
    <div className="card overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                {split.title}
              </h3>
              <span className={clsx('badge', isSettled ? 'badge-income' : 'badge-expense')}>
                {isSettled ? 'Settled' : 'Pending'}
              </span>
            </div>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-tertiary)' }}>
              {formatDate(split.date)} · {split.split_type} split · {paidCount}/{totalParticipants} paid
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-base sm:text-lg font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
              {formatCurrency(split.total_amount, currency)}
            </p>
          </div>
        </div>

        {/* Participants mini view */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {split.participants.map((p, i) => (
            <div key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all cursor-pointer"
              style={{
                borderColor: p.paid ? 'var(--color-success)' : 'var(--color-border)',
                background: p.paid ? 'var(--color-success-muted)' : 'var(--color-surface-subtle)',
                color: p.paid ? 'var(--color-success)' : 'var(--color-text-secondary)',
              }}
              onClick={() => !isSettled && onSettle(split._id, p.name, !p.paid)}
            >
              {p.paid ? <CheckCircle2 size={10} /> : <div className="w-2 h-2 rounded-full bg-current opacity-40" />}
              <span className="font-medium truncate max-w-[80px]">{p.name}</span>
              <span className="tabular-nums">₹{p.share?.toFixed(0) || p.share_amount?.toFixed(0)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--color-text-tertiary)' }}>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Hide' : 'Details'}
          </button>
          <div className="flex-1" />
          <button onClick={() => onShare(split)}
            className="btn btn-ghost btn-sm !p-1.5 rounded-lg" title="Share / QR" aria-label="Share QR">
            <QrCode size={14} />
          </button>
          <button onClick={() => onDelete(split._id)}
            className="btn btn-ghost btn-sm !p-1.5 rounded-lg hover:!text-red-500" title="Delete" aria-label="Delete split">
            <Trash2 size={14} />
          </button>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--color-border-subtle)' }}>
            {split.participants.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: p.paid ? 'var(--color-success)' : 'var(--color-border)' }}>
                    {p.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{p.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="tabular-nums text-xs sm:text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {formatCurrency(p.share || p.share_amount || 0, currency)}
                  </span>
                  {!isSettled && (
                    <button
                      onClick={() => onSettle(split._id, p.name, !p.paid)}
                      className="text-xs px-2 py-1 rounded-lg border"
                      style={{
                        borderColor: p.paid ? 'var(--color-success)' : 'var(--color-border)',
                        color: p.paid ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                      }}>
                      {p.paid ? 'Paid ✓' : 'Mark Paid'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function BillSplit() {
  const { currency } = useApp()
  const [splits, setSplits] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [qrTarget, setQrTarget] = useState(null)

  useEffect(() => {
    setLoading(true)
    splitsApi.getAll()
      .then(({ data }) => setSplits(data))
      .catch(() => setSplits(DEMO_SPLITS))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async (data) => {
    try {
      const { data: created } = await splitsApi.create(data)
      setSplits(prev => [created, ...prev])
    } catch {
      const demo = { ...data, _id: `d${Date.now()}`, status: 'pending',
        participants: data.participants.map((p, i) => ({
          ...p,
          share: data.total_amount / data.participants.length,
          share_pct: 100 / data.participants.length,
          paid: false,
        }))
      }
      setSplits(prev => [demo, ...prev])
    }
    setFormOpen(false)
    toast.success('Bill split created!')
  }

  const handleSettle = async (splitId, participantName, paid) => {
    try {
      const { data } = await splitsApi.settle(splitId, { participant_name: participantName, paid })
      setSplits(prev => prev.map(s => s._id === splitId ? data : s))
    } catch {
      setSplits(prev => prev.map(s => {
        if (s._id !== splitId) return s
        const updatedParticipants = s.participants.map(p =>
          p.name === participantName ? { ...p, paid, paid_at: paid ? new Date().toISOString() : null } : p
        )
        const allPaid = updatedParticipants.every(p => p.paid)
        return { ...s, participants: updatedParticipants, status: allPaid ? 'settled' : 'pending' }
      }))
    }
    toast.success(paid ? 'Marked as paid ✓' : 'Marked as unpaid')
  }

  const handleDelete = async (id) => {
    await splitsApi.delete(id).catch(() => {})
    setSplits(prev => prev.filter(s => s._id !== id))
    toast.success('Split deleted')
  }

  const totalPending = splits.filter(s => s.status === 'pending')
    .reduce((sum, s) => {
      const myShare = s.participants.find(p => p.name === 'You')
      return sum + (myShare && !myShare.paid ? (myShare.share || 0) : 0)
    }, 0)

  return (
    <div className="space-y-6 animate-fade-in max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Bill Splitting</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Split expenses with friends and track payments
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setFormOpen(true)}>
          New Split
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="card p-4 min-w-0">
          <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>Total Splits</p>
          <p className="text-xl sm:text-2xl font-bold mt-1 truncate" style={{ color: 'var(--color-text-primary)' }}>{splits.length}</p>
        </div>
        <div className="card p-4 min-w-0">
          <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>Pending from You</p>
          <p className="text-xl sm:text-2xl font-bold mt-1 truncate" style={{ color: 'var(--color-danger)' }}>
            {formatCurrency(totalPending, currency)}
          </p>
        </div>
        <div className="card p-4 min-w-0">
          <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>Settled</p>
          <p className="text-xl sm:text-2xl font-bold mt-1 truncate" style={{ color: 'var(--color-success)' }}>
            {splits.filter(s => s.status === 'settled').length}
          </p>
        </div>
      </div>

      {/* Splits list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => (
            <div key={i} className="card p-4 animate-pulse space-y-3">
              <div className="h-4 rounded" style={{ background: 'var(--color-border)', width: '40%' }} />
              <div className="flex gap-2">
                {[1,2,3].map(j => <div key={j} className="h-7 w-20 rounded-full" style={{ background: 'var(--color-border)' }} />)}
              </div>
            </div>
          ))}
        </div>
      ) : splits.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center">
          <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-tertiary)' }} />
          <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>No splits yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Create your first bill split to start tracking shared expenses
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {splits.map(split => (
            <SplitCard key={split._id} split={split}
              onSettle={handleSettle} onDelete={handleDelete} onShare={setQrTarget} />
          ))}
        </div>
      )}

      <CreateSplitModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreate} />
      <QRModal isOpen={!!qrTarget} onClose={() => setQrTarget(null)} split={qrTarget} />
    </div>
  )
}
