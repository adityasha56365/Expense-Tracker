// src/components/common/Button.jsx
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

export default function Button({
  children, variant = 'primary', size = 'md',
  loading = false, icon: Icon, iconRight,
  className = '', ...props
}) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  }[variant]

  const sizeClass = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  }[size]

  return (
    <button
      className={clsx('btn', variantClass, sizeClass, className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : 16} />
      ) : null}
      {children}
      {iconRight && !loading && <iconRight size={15} />}
    </button>
  )
}
