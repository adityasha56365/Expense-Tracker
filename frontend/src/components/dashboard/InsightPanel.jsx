// src/components/dashboard/InsightPanel.jsx
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { useApp } from '../../context/AppContext'

export default function InsightPanel({ forecast }) {
  const { currency } = useApp()

  if (!forecast) return null

  const { recommendations = [], health_score, risk_level, predicted_spend } = forecast

  const scoreColor = health_score >= 75 ? 'var(--color-success)'
    : health_score >= 50 ? 'var(--color-warning)'
    : 'var(--color-danger)'

  return (
    <div className="card">
      <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
             style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
          <Lightbulb size={16} />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Smart Insights
          </h3>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            AI-powered recommendations
          </p>
        </div>

        {/* Health score */}
        {health_score !== undefined && (
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold tabular-nums" style={{ color: scoreColor }}>
              {health_score}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Health Score</p>
          </div>
        )}
      </div>

      {/* Forecast banner */}
      {predicted_spend && (
        <div className="mx-6 mt-4 mb-2 p-3 rounded-xl flex items-center gap-3"
             style={{ background: 'var(--color-info-muted)' }}>
          <TrendingUp size={16} style={{ color: 'var(--color-info)' }} />
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Next month forecast:{' '}
            <strong className="tabular-nums">{formatCurrency(predicted_spend, currency)}</strong>
            {risk_level === 'high' && ' — Budget overrun risk!'}
            {risk_level === 'medium' && ' — Watch your spending'}
            {risk_level === 'low' && ' — You\'re on track!'}
          </p>
        </div>
      )}

      {/* Recommendations */}
      <div className="p-6 pt-3 space-y-3">
        {recommendations.slice(0, 4).map((rec, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-xl hover:bg-[var(--color-surface-subtle)] transition-colors">
            <div className="text-xl flex-shrink-0 mt-0.5">{rec.icon || '💡'}</div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {rec.message}
            </p>
          </div>
        ))}
        {recommendations.length === 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl"
               style={{ background: 'var(--color-success-muted)' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              All categories are within budget. Great financial discipline!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
