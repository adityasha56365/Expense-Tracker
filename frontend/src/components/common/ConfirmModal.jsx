// src/components/common/ConfirmModal.jsx
import Modal from './Modal'
import Button from './Button'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Confirm Action'} size="sm">
      <div className="space-y-5">
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}>
            <AlertTriangle size={20} />
          </div>
          <p className="text-sm pt-2" style={{ color: 'var(--color-text-secondary)' }}>
            {message || 'Are you sure you want to proceed? This action cannot be undone.'}
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>Delete</Button>
        </div>
      </div>
    </Modal>
  )
}
