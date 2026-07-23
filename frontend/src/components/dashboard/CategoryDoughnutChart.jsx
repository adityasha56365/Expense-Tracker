// src/components/dashboard/CategoryDoughnutChart.jsx
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { CHART_COLORS, CATEGORY_MAP } from '../../utils/constants'
import { formatCurrency } from '../../utils/formatters'
import { useApp } from '../../context/AppContext'
import { useTheme } from '../../context/ThemeContext'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function CategoryDoughnutChart({ data = [] }) {
  const { currency } = useApp()
  const { isDark } = useTheme()

  const labels = data.map(d => d.category)
  const amounts = data.map(d => d.amount)
  const colors = labels.map(l => CHART_COLORS[l] || '#94a3b8')
  const total = amounts.reduce((a, b) => a + b, 0)

  const chartData = {
    labels,
    datasets: [{
      data: amounts,
      backgroundColor: colors.map(c => c + 'cc'),
      borderColor: colors,
      borderWidth: 2,
      hoverBorderWidth: 3,
      hoverOffset: 8,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#fff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        titleColor: isDark ? '#f1f5f9' : '#0f172a',
        bodyColor: isDark ? '#94a3b8' : '#475569',
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const pct = ((ctx.parsed / total) * 100).toFixed(1)
            return ` ${ctx.label}: ${formatCurrency(ctx.parsed, currency)} (${pct}%)`
          },
        },
      },
    },
  }

  return (
    <div className="card p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Category Breakdown
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
          Spending distribution this month
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Chart */}
        <div className="relative flex-shrink-0" style={{ width: 160, height: 160 }}>
          <Doughnut data={chartData} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Total</p>
            <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
              {formatCurrency(total, currency)}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5 overflow-hidden">
          {data.slice(0, 6).map((item) => {
            const pct = total > 0 ? ((item.amount / total) * 100).toFixed(0) : 0
            const color = CHART_COLORS[item.category] || '#94a3b8'
            return (
              <div key={item.category} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {CATEGORY_MAP[item.category]?.icon} {item.category}
                    </span>
                    <span className="text-xs font-medium tabular-nums ml-2 flex-shrink-0"
                          style={{ color: 'var(--color-text-primary)' }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="progress-bar mt-1">
                    <div
                      className="progress-fill"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
