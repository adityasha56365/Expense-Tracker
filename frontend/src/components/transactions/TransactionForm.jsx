// src/components/transactions/TransactionForm.jsx
import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Input from '../common/Input'
import Select from '../common/Select'
import { CATEGORIES, PAYMENT_METHODS } from '../../utils/constants'
import { formatDateInput } from '../../utils/formatters'
import toast from 'react-hot-toast'

const TYPE_OPTIONS = [
  { value: 'expense', label: '💸 Expense' },
  { value: 'income', label: '💰 Income' },
]

const CATEGORY_OPTIONS = CATEGORIES.map(c => ({ value: c.value, label: `${c.icon} ${c.label}` }))

export default function TransactionForm({ isOpen, onClose, onSubmit, initialData = null }) {
  const isEdit = !!initialData

  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: 'Food',
    date: formatDateInput(new Date()),
    payment_method: 'UPI',
    merchant: '',
    note: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        amount: initialData.amount?.toString() || '',
        type: initialData.type || 'expense',
        category: initialData.category || 'Food',
        date: formatDateInput(initialData.date) || formatDateInput(new Date()),
        payment_method: initialData.payment_method || 'UPI',
        merchant: initialData.merchant || '',
        note: initialData.note || '',
      })
    } else {
      setForm({
        title: '',
        amount: '',
        type: 'expense',
        category: 'Food',
        date: formatDateInput(new Date()),
        payment_method: 'UPI',
        merchant: '',
        note: '',
      })
    }
    setErrors({})
  }, [initialData, isOpen])

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      errs.amount = 'Enter a valid amount'
    if (!form.date) errs.date = 'Date is required'
    return errs
  }

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        amount: Number(form.amount),
        date: new Date(form.date).toISOString(),
      })
      toast.success(isEdit ? 'Transaction updated' : 'Transaction added')
      onClose()
    } catch (err) {
      // error handled globally
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Transaction' : 'Add Transaction'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl"
             style={{ background: 'var(--color-surface-subtle)' }}>
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, type: opt.value }))}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                form.type === opt.value
                  ? 'text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              style={form.type === opt.value ? { background: opt.value === 'income' ? 'var(--color-success)' : 'var(--color-danger)' } : {}}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Input
          label="Title"
          placeholder="e.g. Swiggy Order, Netflix..."
          value={form.title}
          onChange={handleChange('title')}
          error={errors.title}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount (₹)"
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={handleChange('amount')}
            error={errors.amount}
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={handleChange('date')}
            error={errors.date}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Category"
            value={form.category}
            onChange={handleChange('category')}
            options={CATEGORY_OPTIONS}
          />
          <Select
            label="Payment Method"
            value={form.payment_method}
            onChange={handleChange('payment_method')}
            options={PAYMENT_METHODS}
          />
        </div>

        <Input
          label="Merchant (optional)"
          placeholder="e.g. Amazon, Zomato..."
          value={form.merchant}
          onChange={handleChange('merchant')}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Note (optional)
          </label>
          <textarea
            className="form-input resize-none"
            rows={2}
            placeholder="Add any notes..."
            value={form.note}
            onChange={handleChange('note')}
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEdit ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
