// src/components/common/Input.jsx
import clsx from 'clsx'

export default function Input({
  label, error, hint, icon: Icon, rightElement,
  className = '', wrapperClass = '', style, ...props
}) {
  return (
    <div className={clsx('flex flex-col gap-1.5', wrapperClass)}>
      {label && (
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
               style={{ color: 'var(--color-text-tertiary)' }}>
            <Icon size={16} />
          </div>
        )}
        <input
          className={clsx(
            'form-input w-full',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-100',
            className
          )}
          style={{
            paddingLeft: Icon ? '2.5rem' : undefined,
            paddingRight: rightElement ? '2.5rem' : undefined,
            ...style
          }}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>{hint}</p>}
    </div>
  )
}
