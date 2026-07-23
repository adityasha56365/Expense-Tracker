// src/components/dashboard/SummaryCard.jsx
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatCompact } from '../../utils/formatters'
import { useApp } from '../../context/AppContext'
import clsx from 'clsx'

export default function SummaryCard({
  title, value, icon: Icon, trend, trendLabel,
  variant = 'default', compact = false, currency: currencyProp
}) {
  const { currency } = useApp()
  const cur = currencyProp || currency

  const variantStyle = {
    default: { bg: 'var(--color-surface)', iconBg: 'var(--color-primary-muted)', iconColor: 'var(--color-primary)' },
    income: { bg: 'var(--color-surface)', iconBg: 'var(--color-success-muted)', iconColor: 'var(--color-success)' },
    expense: { bg: 'var(--color-surface)', iconBg: 'var(--color-danger-muted)', iconColor: 'var(--color-danger)' },
    warning: { bg: 'var(--color-surface)', iconBg: 'var(--color-warning-muted)', iconColor: 'var(--color-warning)' },
    primary: { bg: 'linear-gradient(135deg, #0d9488, #0891b2)', iconBg: 'rgba(255,255,255,0.2)', iconColor: 'white' },
  }[variant]

  const isWhite = variant === 'primary'
  const textPrimary = isWhite ? 'white' : 'var(--color-text-primary)'
  const textSecondary = isWhite ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)'
  const textTertiary = isWhite ? 'rgba(255,255,255,0.6)' : 'var(--color-text-tertiary)'

  const isPositiveTrend = trend > 0
  const trendColor = isPositiveTrend ? 'var(--color-success)' : 'var(--color-danger)'

  const displayValue = typeof value === 'number'
    ? (compact ? formatCompact(value, cur) : formatCurrency(value, cur))
    : value

  return (
    <div className="card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
         style={{ background: variantStyle.bg }}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium" style={{ color: textSecondary }}>{title}</p>
        {Icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: variantStyle.iconBg, color: variantStyle.iconColor }}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: textPrimary }}>
          {displayValue}
        </p>
        {(trend !== undefined || trendLabel) && (
          <div className="flex items-center gap-1 mt-2">
            {trend !== undefined && (
              <>
                {isPositiveTrend
                  ? <TrendingUp size={13} style={{ color: isWhite ? 'rgba(255,255,255,0.8)' : trendColor }} />
                  : <TrendingDown size={13} style={{ color: isWhite ? 'rgba(255,255,255,0.8)' : trendColor }} />}
                <span className="text-xs font-medium" style={{ color: isWhite ? 'rgba(255,255,255,0.8)' : trendColor }}>
                  {isPositiveTrend ? '+' : ''}{trend}%
                </span>
              </>
            )}
            {trendLabel && (
              <span className="text-xs" style={{ color: textTertiary }}>{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
