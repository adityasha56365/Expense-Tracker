// src/components/common/Badge.jsx
import { CATEGORY_MAP } from '../../utils/constants'
import clsx from 'clsx'

export function CategoryBadge({ category, size = 'sm' }) {
  const cat = CATEGORY_MAP[category]
  return (
    <span className={clsx('badge', cat?.class || 'cat-other', size === 'xs' && 'text-[10px] px-2')}>
      {cat?.icon && <span>{cat.icon}</span>}
      {category}
    </span>
  )
}

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    danger: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    primary: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  }
  return (
    <span className={clsx('badge', variants[variant], className)}>
      {children}
    </span>
  )
}
