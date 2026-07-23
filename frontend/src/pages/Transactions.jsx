// src/pages/Transactions.jsx
import { useEffect, useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { Plus, Download } from 'lucide-react'
import TransactionTable from '../components/transactions/TransactionTable'
import TransactionFilterBar from '../components/transactions/TransactionFilterBar'
import TransactionForm from '../components/transactions/TransactionForm'
import Button from '../components/common/Button'
import { TableRowSkeleton } from '../components/common/LoadingSkeleton'
import toast from 'react-hot-toast'

const DEFAULT_FILTERS = { search: '', type: '', category: '', sort: 'date_desc', dateFrom: '', dateTo: '' }

export default function Transactions() {
  const { transactions, loading, fetchTransactions, addTransaction } = useApp()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const filtered = useMemo(() => {
    let result = [...transactions]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.merchant?.toLowerCase().includes(q) ||
        t.note?.toLowerCase().includes(q)
      )
    }
    if (filters.type) result = result.filter(t => t.type === filters.type)
    if (filters.category) result = result.filter(t => t.category === filters.category)
    if (filters.dateFrom) result = result.filter(t => new Date(t.date) >= new Date(filters.dateFrom))
    if (filters.dateTo) result = result.filter(t => new Date(t.date) <= new Date(filters.dateTo + 'T23:59:59'))

    // Sort
    result.sort((a, b) => {
      switch (filters.sort) {
        case 'date_asc': return new Date(a.date) - new Date(b.date)
        case 'amount_desc': return b.amount - a.amount
        case 'amount_asc': return a.amount - b.amount
        default: return new Date(b.date) - new Date(a.date) // date_desc
      }
    })

    return result
  }, [transactions, filters])

  // Summary stats
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0)
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0)

  const handleAdd = async (data) => {
    await addTransaction(data)
    toast.success('Transaction added successfully')
    setAddOpen(false)
  }

  const handleExport = () => {
    const csv = [
      ['Date', 'Title', 'Type', 'Category', 'Amount', 'Payment Method', 'Merchant', 'Note'],
      ...filtered.map(t => [
        new Date(t.date).toLocaleDateString('en-IN'),
        t.title, t.type, t.category, t.amount,
        t.payment_method, t.merchant || '', t.note || '',
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `smart_expense_tracker_transactions_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported to CSV')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Transactions
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {filtered.length} transactions found
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>
            Export
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setAddOpen(true)}>
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Transactions', value: filtered.length, color: 'var(--color-text-primary)' },
          { label: 'Total Income', value: `+₹${totalIncome.toLocaleString('en-IN')}`, color: 'var(--color-success)' },
          { label: 'Total Expenses', value: `-₹${totalExpense.toLocaleString('en-IN')}`, color: 'var(--color-danger)' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{s.label}</p>
            <p className="text-lg font-bold tabular-nums mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <TransactionFilterBar
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(DEFAULT_FILTERS)}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading.transactions ? (
          <div className="p-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction</th><th>Category</th><th>Date</th>
                  <th>Method</th><th className="text-right">Amount</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody><TableRowSkeleton cols={6} rows={6} /></tbody>
            </table>
          </div>
        ) : (
          <TransactionTable transactions={filtered} />
        )}
      </div>

      {/* Add modal */}
      <TransactionForm
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
      />
    </div>
  )
}
