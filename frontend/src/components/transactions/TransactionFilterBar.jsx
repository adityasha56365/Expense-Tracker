// src/components/transactions/TransactionFilterBar.jsx
import { Search, SlidersHorizontal, X } from 'lucide-react'
import Select from '../common/Select'
import { CATEGORIES } from '../../utils/constants'
import clsx from 'clsx'

const TYPE_OPTS = [
  { value: '', label: 'All Types' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
]

const CATEGORY_OPTS = [
  { value: '', label: 'All Categories' },
  ...CATEGORIES.map(c => ({ value: c.value, label: `${c.icon} ${c.value}` })),
]

const SORT_OPTS = [
  { value: 'date_desc', label: 'Newest First' },
  { value: 'date_asc', label: 'Oldest First' },
  { value: 'amount_desc', label: 'Highest Amount' },
  { value: 'amount_asc', label: 'Lowest Amount' },
]

export default function TransactionFilterBar({ filters, onChange, onClear }) {
  const hasActiveFilters = filters.search || filters.type || filters.category

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-text-tertiary)' }} />
        <input
          className="form-input pl-9 h-9 text-sm"
          placeholder="Search transactions..."
          value={filters.search || ''}
          onChange={e => onChange({ ...filters, search: e.target.value })}
        />
      </div>

      {/* Type */}
      <select
        className="form-input h-9 text-sm w-36 cursor-pointer"
        value={filters.type || ''}
        onChange={e => onChange({ ...filters, type: e.target.value })}
      >
        {TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Category */}
      <select
        className="form-input h-9 text-sm w-44 cursor-pointer"
        value={filters.category || ''}
        onChange={e => onChange({ ...filters, category: e.target.value })}
      >
        {CATEGORY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Sort */}
      <select
        className="form-input h-9 text-sm w-44 cursor-pointer"
        value={filters.sort || 'date_desc'}
        onChange={e => onChange({ ...filters, sort: e.target.value })}
      >
        {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Date range */}
      <input
        type="date"
        className="form-input h-9 text-sm w-36 cursor-pointer"
        value={filters.dateFrom || ''}
        onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
        title="From date"
      />
      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>to</span>
      <input
        type="date"
        className="form-input h-9 text-sm w-36 cursor-pointer"
        value={filters.dateTo || ''}
        onChange={e => onChange({ ...filters, dateTo: e.target.value })}
        title="To date"
      />

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="btn btn-ghost btn-sm gap-1.5 text-xs"
          aria-label="Clear filters"
        >
          <X size={13} /> Clear
        </button>
      )}
    </div>
  )
}
