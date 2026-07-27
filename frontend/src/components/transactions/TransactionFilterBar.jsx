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
  const hasActiveFilters = Boolean(
    filters.search || filters.type || filters.category ||
    filters.dateFrom || filters.dateTo || (filters.sort && filters.sort !== 'date_desc')
  )

  return (
    <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-text-tertiary)' }} />
        <input
          className="form-input pl-9 h-10 text-sm w-full"
          placeholder="Search transactions..."
          value={filters.search || ''}
          onChange={e => onChange({ ...filters, search: e.target.value })}
        />
      </div>

      {/* Type */}
      <select
        className="form-input form-select h-10 py-1.5 pl-3 text-sm !w-full md:!w-36 cursor-pointer"
        value={filters.type || ''}
        onChange={e => onChange({ ...filters, type: e.target.value })}
      >
        {TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Category */}
      <select
        className="form-input form-select h-10 py-1.5 pl-3 text-sm !w-full md:!w-48 cursor-pointer"
        value={filters.category || ''}
        onChange={e => onChange({ ...filters, category: e.target.value })}
      >
        {CATEGORY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Sort */}
      <select
        className="form-input form-select h-10 py-1.5 pl-3 text-sm !w-full md:!w-44 cursor-pointer"
        value={filters.sort || 'date_desc'}
        onChange={e => onChange({ ...filters, sort: e.target.value })}
      >
        {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Date range */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          className="form-input h-10 py-1.5 px-3 text-sm !w-38 cursor-pointer"
          value={filters.dateFrom || ''}
          onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
          title="From date"
        />
        <span className="text-xs shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>to</span>
        <input
          type="date"
          className="form-input h-10 py-1.5 px-3 text-sm !w-38 cursor-pointer"
          value={filters.dateTo || ''}
          onChange={e => onChange({ ...filters, dateTo: e.target.value })}
          title="To date"
        />
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="btn btn-ghost btn-sm gap-1.5 text-xs shrink-0"
          aria-label="Clear filters"
        >
          <X size={13} /> Clear
        </button>
      )}
    </div>
  )
}
