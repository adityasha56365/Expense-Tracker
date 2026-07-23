// src/components/dashboard/SpendingTrendChart.jsx
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useTheme } from '../../context/ThemeContext'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function SpendingTrendChart({ data = [] }) {
  const { isDark } = useTheme()

  const labels = data.map(d => d.month)
  const incomeData = data.map(d => d.income)
  const expenseData = data.map(d => d.expense)

  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const textColor = isDark ? '#64748b' : '#94a3b8'

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: isDark ? '#111827' : '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      },
      {
        label: 'Expense',
        data: expenseData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.07)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: isDark ? '#111827' : '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          borderRadius: 3,
          color: textColor,
          font: { family: 'Inter', size: 12 },
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#fff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        titleColor: isDark ? '#f1f5f9' : '#0f172a',
        bodyColor: isDark ? '#94a3b8' : '#475569',
        padding: 12,
        callbacks: {
          label: (ctx) => ` ₹${ctx.parsed.y.toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: textColor, font: { family: 'Inter', size: 12 } },
      },
      y: {
        grid: { color: gridColor, drawBorder: false },
        border: { display: false, dash: [4, 4] },
        ticks: {
          color: textColor,
          font: { family: 'Inter', size: 12 },
          callback: (v) => `₹${(v / 1000).toFixed(0)}K`,
          maxTicksLimit: 5,
        },
      },
    },
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Monthly Trend
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            Income vs Expense (last 6 months)
          </p>
        </div>
      </div>
      <div style={{ height: 240 }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
