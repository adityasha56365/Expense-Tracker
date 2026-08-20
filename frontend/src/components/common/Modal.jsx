// src/components/common/Modal.jsx
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import clsx from 'clsx'

export default function Modal({ isOpen, onClose, title, children, size = 'md', className = '' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
  }[size]

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-3 sm:p-4">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />
      <div
        className={clsx(
          'card card-elevated relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden animate-fade-in sm:max-h-[calc(100dvh-2rem)]',
          sizeClass, className
        )}
        style={{ background: 'var(--color-surface)' }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b px-5 py-4 sm:px-6"
             style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm !p-1.5 rounded-lg"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
