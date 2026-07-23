// src/components/transactions/TransactionTable.jsx
import { useState } from 'react'
import { Edit2, Trash2, ArrowUpRight, ArrowDownLeft, Receipt } from 'lucide-react'
import { CategoryBadge } from '../common/Badge'
import { formatCurrency, formatDate, getRelativeTime } from '../../utils/formatters'
import { useApp } from '../../context/AppContext'
import EmptyState from '../common/EmptyState'
import ConfirmModal from '../common/ConfirmModal'
import TransactionForm from './TransactionForm'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function TransactionTable({ transactions, loading }) {
  const { updateTransaction, deleteTransaction, currency } = useApp()
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteTransaction(deleteTarget._id)
      toast.success('Transaction deleted')
      setDeleteTarget(null)
    } catch {
      // handled globally
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleUpdate = async (data) => {
    await updateTransaction(editTarget._id, data)
    toast.success('Transaction updated')
    setEditTarget(null)
  }

  if (!loading && transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions found"
        description="Try adjusting your filters or add a new transaction."
      />
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Category</th>
              <th>Date</th>
              <th>Method</th>
              <th className="text-right">Amount</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx._id} className="group">
                <td>
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                      tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                    )}
                    style={tx.type === 'income'
                      ? { background: 'var(--color-success-muted)', color: 'var(--color-success)' }
                      : { background: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}>
                      {tx.type === 'income'
                        ? <ArrowDownLeft size={16} />
                        : <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {tx.title}
                      </p>
                      {tx.merchant && (
                        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{tx.merchant}</p>
                      )}
                    </div>
                    {tx.source === 'ocr' && (
                      <span title="Added via OCR">
                        <Receipt size={13} style={{ color: 'var(--color-text-tertiary)' }} />
                      </span>
                    )}
                  </div>
                </td>
                <td><CategoryBadge category={tx.category} /></td>
                <td>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {formatDate(tx.date)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {getRelativeTime(tx.date)}
                    </p>
                  </div>
                </td>
                <td>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {tx.payment_method}
                  </span>
                </td>
                <td className="text-right">
                  <span className={clsx(
                    'tabular-nums font-semibold text-sm',
                    tx.type === 'income' ? 'amount-positive' : 'amount-negative'
                  )}>
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount, currency)}
                  </span>
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="btn btn-ghost btn-sm !p-1.5 rounded-lg"
                      onClick={() => setEditTarget(tx)}
                      aria-label="Edit transaction"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm !p-1.5 rounded-lg hover:!text-red-500"
                      onClick={() => setDeleteTarget(tx)}
                      aria-label="Delete transaction"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="md:hidden divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
        {transactions.map((tx) => (
          <div key={tx._id} className="flex items-center gap-3 py-3 px-1">
            <div className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0'
            )}
            style={tx.type === 'income'
              ? { background: 'var(--color-success-muted)', color: 'var(--color-success)' }
              : { background: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}>
              {tx.type === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
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
            <div className="flex flex-col items-end gap-1">
              <span className={clsx(
                'tabular-nums font-semibold text-sm',
                tx.type === 'income' ? 'amount-positive' : 'amount-negative'
              )}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
              </span>
              <div className="flex gap-1">
                <button className="btn btn-ghost btn-sm !p-1 rounded-md" onClick={() => setEditTarget(tx)}>
                  <Edit2 size={12} />
                </button>
                <button className="btn btn-ghost btn-sm !p-1 rounded-md" onClick={() => setDeleteTarget(tx)}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      <TransactionForm
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleUpdate}
        initialData={editTarget}
      />

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Transaction"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
      />
    </>
  )
}
