// src/pages/Insights.jsx
import { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Lightbulb, Target, Activity, Award
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '../utils/formatters'
import { DEMO_FORECAST } from '../utils/demoData'
import clsx from 'clsx'

function HealthScoreRing({ score }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Attention'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* Track */}
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="10" />
        {/* Fill */}
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        {/* Center text */}
        <text x="70" y="66" textAnchor="middle" fontSize="28" fontWeight="700" fill={color} fontFamily="Inter">
          {score}
        </text>
        <text x="70" y="84" textAnchor="middle" fontSize="11" fill="var(--color-text-tertiary)" fontFamily="Inter">
          / 100
        </text>
      </svg>
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color }}>Financial Health: {label}</p>
      </div>
    </div>
  )
}

function ForecastCard({ label, value, sub, icon: Icon, color, bgColor }) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
             style={{ background: bgColor, color }}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-xl font-bold tabular-nums" style={{ color: color || 'var(--color-text-primary)' }}>
        {value}
      </p>
      {sub && <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{sub}</p>}
    </div>
  )
}

const RISK_CONFIG = {
  low: { label: 'Low Risk', color: '#10b981', bg: 'var(--color-success-muted)', icon: CheckCircle2 },
  medium: { label: 'Moderate Risk', color: '#f59e0b', bg: 'var(--color-warning-muted)', icon: AlertTriangle },
  high: { label: 'High Risk', color: '#ef4444', bg: 'var(--color-danger-muted)', icon: AlertTriangle },
}

const TIPS = [
  { icon: '💳', title: 'Use UPI for daily expenses', body: 'UPI transactions are easier to track and categorize automatically, giving you better visibility.' },
  { icon: '📊', title: 'Review your budget weekly', body: 'Checking your budget mid-month helps you course-correct before you overspend.' },
  { icon: '🎯', title: 'Set category-level limits', body: 'Broad budgets are easy to exceed. Granular category limits keep you disciplined.' },
  { icon: '📸', title: 'Scan all paper receipts', body: 'Don\'t let cash transactions go unrecorded. Use the receipt scanner to stay accurate.' },
]

export default function Insights() {
  const { forecast, currency, fetchForecast, loading } = useApp()

  useEffect(() => {
    fetchForecast()
  }, [])

  const data = forecast || DEMO_FORECAST
  const risk = RISK_CONFIG[data.risk_level] || RISK_CONFIG.low
  const RiskIcon = risk.icon

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Insights & Forecast
        </h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          AI-powered predictions and personalized recommendations
        </p>
      </div>

      {/* Top row: Health score + forecast cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Health Score */}
        <div className="card p-6 flex flex-col items-center justify-center lg:col-span-1">
          <HealthScoreRing score={data.health_score || 78} />
          <p className="text-xs text-center mt-3" style={{ color: 'var(--color-text-tertiary)' }}>
            Based on spending patterns,<br />budget adherence, and savings rate
          </p>
        </div>

        {/* Forecast metrics */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ForecastCard
            label="Predicted Next Month"
            value={formatCurrency(data.predicted_spend, currency)}
            sub="Based on last 3 months trend"
            icon={TrendingUp}
            color="var(--color-primary)"
            bgColor="var(--color-primary-muted)"
          />
          <ForecastCard
            label="Budget Utilization"
            value={`${data.expected_vs_budget?.toFixed(1) || 70.9}%`}
            sub="of monthly budget expected"
            icon={Target}
            color="var(--color-warning)"
            bgColor="var(--color-warning-muted)"
          />
          <div className="card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                Spending Risk
              </p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ background: risk.bg, color: risk.color }}>
                <RiskIcon size={16} />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: risk.color }}>{risk.label}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {data.risk_level === 'low' ? 'On track for this month' :
                 data.risk_level === 'medium' ? 'Watch categories below' :
                 'Overrun likely — act now'}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {(data.top_overspending || []).map(cat => (
                <span key={cat} className="badge"
                      style={{ background: risk.bg, color: risk.color, fontSize: '0.7rem' }}>
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 px-6 py-4 border-b"
               style={{ borderColor: 'var(--color-border)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
              <Lightbulb size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Smart Recommendations
              </h3>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Based on your spending patterns
              </p>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {(data.recommendations || []).map((rec, i) => (
              <div key={i}
                className="flex gap-3 p-4 rounded-xl hover:bg-[var(--color-surface-subtle)] transition-colors"
              >
                <span className="text-xl flex-shrink-0">{rec.icon || '💡'}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {rec.category}
                  </p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {rec.message}
                  </p>
                </div>
              </div>
            ))}
            {(!data.recommendations || data.recommendations.length === 0) && (
              <div className="flex items-center gap-3 p-4 rounded-xl"
                   style={{ background: 'var(--color-success-muted)' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  All categories are performing well. Keep it up!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Money-saving tips */}
        <div className="card">
          <div className="flex items-center gap-3 px-6 py-4 border-b"
               style={{ borderColor: 'var(--color-border)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'var(--color-warning-muted)', color: 'var(--color-warning)' }}>
              <Award size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Financial Tips
              </h3>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                General best practices
              </p>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {TIPS.map((tip, i) => (
              <div key={i} className="flex gap-3 p-4 rounded-xl hover:bg-[var(--color-surface-subtle)] transition-colors">
                <span className="text-xl flex-shrink-0">{tip.icon}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {tip.title}
                  </p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {tip.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend summary */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Monthly Trend Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Trend', value: data.trend === 'stable' ? '📊 Stable' : data.trend === 'increasing' ? '📈 Increasing' : '📉 Decreasing', desc: 'Spending direction' },
            { label: 'Next Month Risk', value: risk.label, desc: 'Budget overrun probability' },
            { label: 'Top Concern', value: data.top_overspending?.[0] || 'None', desc: 'Highest risk category' },
            { label: 'Health Score', value: `${data.health_score || 78}/100`, desc: 'Overall financial health' },
          ].map(item => (
            <div key={item.label} className="p-4 rounded-xl" style={{ background: 'var(--color-surface-subtle)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{item.label}</p>
              <p className="text-sm font-bold mt-1.5" style={{ color: 'var(--color-text-primary)' }}>{item.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
