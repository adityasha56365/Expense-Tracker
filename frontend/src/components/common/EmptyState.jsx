// src/components/common/EmptyState.jsx
import { Inbox } from 'lucide-react'
import Button from './Button'

export default function EmptyState({ icon: Icon = Inbox, title, description, action, actionLabel }) {
  return (
    <div className="empty-state">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
           style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text-tertiary)' }}>
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
        {description && (
          <p className="text-sm max-w-xs" style={{ color: 'var(--color-text-tertiary)' }}>{description}</p>
        )}
      </div>
      {action && actionLabel && (
        <Button variant="primary" size="sm" onClick={action}>{actionLabel}</Button>
      )}
    </div>
  )
}
