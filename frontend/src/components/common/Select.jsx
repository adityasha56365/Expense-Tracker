// src/components/common/Select.jsx
import clsx from 'clsx'

export default function Select({ label, error, options = [], wrapperClass = '', className = '', ...props }) {
  return (
    <div className={clsx('flex flex-col gap-1.5', wrapperClass)}>
      {label && (
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </label>
      )}
      <select
        className={clsx('form-input form-select py-2 pl-3 cursor-pointer', error && 'border-red-400', className)}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
