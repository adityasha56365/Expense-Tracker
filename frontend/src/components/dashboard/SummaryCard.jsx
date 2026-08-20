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
    <div className="card p-4 sm:p-5 flex flex-col justify-between gap-3 sm:gap-4 hover:shadow-md transition-shadow min-w-0 w-full"
         style={{ background: variantStyle.bg }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs sm:text-sm font-medium truncate" style={{ color: textSecondary }}>{title}</p>
        {Icon && (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: variantStyle.iconBg, color: variantStyle.iconColor }}>
            <Icon size={16} />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-bold tabular-nums leading-tight truncate" style={{ color: textPrimary }}>
          {displayValue}
        </p>
        {(trend !== undefined || trendLabel) && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {trend !== undefined && (
              <div className="flex items-center gap-0.5">
                {isPositiveTrend
                  ? <TrendingUp size={13} style={{ color: isWhite ? 'rgba(255,255,255,0.8)' : trendColor }} />
                  : <TrendingDown size={13} style={{ color: isWhite ? 'rgba(255,255,255,0.8)' : trendColor }} />}
                <span className="text-xs font-medium" style={{ color: isWhite ? 'rgba(255,255,255,0.8)' : trendColor }}>
                  {isPositiveTrend ? '+' : ''}{trend}%
                </span>
              </div>
            )}
            {trendLabel && (
              <span className="text-[11px] sm:text-xs truncate" style={{ color: textTertiary }}>{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
