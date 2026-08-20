// src/pages/Analytics.jsx
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { analyticsApi } from '../api/analyticsApi'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import { CHART_COLORS, MONTHS } from '../utils/constants'
import { formatCurrency } from '../utils/formatters'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { DEMO_MONTHLY_TREND, DEMO_CATEGORY_BREAKDOWN } from '../utils/demoData'
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react'
import { ChartSkeleton } from '../components/common/LoadingSkeleton'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler)

function StatBadge({ label, value, color, icon: Icon }) {
  return (
    <div className="card p-4 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>{label}</p>
        {Icon && <Icon size={15} className="flex-shrink-0" style={{ color }} />}
      </div>
      <p className="text-base sm:text-lg font-bold tabular-nums truncate" style={{ color: color || 'var(--color-text-primary)' }}>
        {value}
      </p>
    </div>
  )
}

export default function Analytics() {
  const { isAuthenticated } = useAuth()
  const { currency, transactions } = useApp()
  const { isDark } = useTheme()

  const [view, setView] = useState('monthly')
  const [monthlyData, setMonthlyData] = useState(DEMO_MONTHLY_TREND)
  const [categoryData, setCategoryData] = useState(DEMO_CATEGORY_BREAKDOWN)
  const [yearlyData, setYearlyData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated) {
        setMonthlyData(DEMO_MONTHLY_TREND)
        setCategoryData(DEMO_CATEGORY_BREAKDOWN)
        return
      }
      setLoading(true)
      try {
        const [t, c, y] = await Promise.all([
          analyticsApi.getMonthlyTrend(),
          analyticsApi.getCategoryBreakdown(),
          analyticsApi.getYearlyOverview(),
        ])
        setMonthlyData(t.data)
        setCategoryData(c.data)
        setYearlyData(y.data)
      } catch {
        setMonthlyData(DEMO_MONTHLY_TREND)
        setCategoryData(DEMO_CATEGORY_BREAKDOWN)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAuthenticated])

  const textColor = isDark ? '#64748b' : '#94a3b8'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const tooltipStyle = {
    backgroundColor: isDark ? '#1e293b' : '#fff',
    borderColor: isDark ? '#334155' : '#e2e8f0',
    borderWidth: 1,
    titleColor: isDark ? '#f1f5f9' : '#0f172a',
    bodyColor: isDark ? '#94a3b8' : '#475569',
    padding: 12,
  }
  const baseScales = {
    x: { grid: { display: false }, border: { display: false }, ticks: { color: textColor, font: { family: 'Inter', size: 11 } } },
    y: { grid: { color: gridColor }, border: { display: false }, ticks: { color: textColor, font: { family: 'Inter', size: 11 }, callback: v => `₹${(v/1000).toFixed(0)}K` } }
  }

  // Income vs Expense bar chart
  const barData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      { label: 'Income', data: monthlyData.map(d => d.income), backgroundColor: 'rgba(16,185,129,0.8)', borderRadius: 6 },
      { label: 'Expense', data: monthlyData.map(d => d.expense), backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 6 },
    ],
  }

  // Net savings line chart
  const savingsData = {
    labels: monthlyData.map(d => d.month),
    datasets: [{
      label: 'Net Savings',
      data: monthlyData.map(d => d.income - d.expense),
      borderColor: '#0d9488',
      backgroundColor: 'rgba(13,148,136,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 5,
      pointBackgroundColor: '#0d9488',
      pointBorderColor: isDark ? '#111827' : '#fff',
      pointBorderWidth: 2,
    }],
  }

  // Category doughnut
  const catData = {
    labels: categoryData.map(d => d.category),
    datasets: [{
      data: categoryData.map(d => d.amount),
      backgroundColor: categoryData.map(d => (CHART_COLORS[d.category] || '#94a3b8') + 'cc'),
      borderColor: categoryData.map(d => CHART_COLORS[d.category] || '#94a3b8'),
      borderWidth: 2,
      hoverOffset: 8,
    }],
  }

  const chartOptions = (extraOptions = {}) => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { color: textColor, font: { family: 'Inter', size: 11 }, boxWidth: 10, boxHeight: 10, padding: 12 } },
      tooltip: { ...tooltipStyle, callbacks: { label: ctx => ` ₹${ctx.parsed.y?.toLocaleString('en-IN') || ctx.parsed}` } },
    },
    scales: baseScales,
    ...extraOptions,
  })

  // Key metrics
  const totalIncome = monthlyData.reduce((a, d) => a + d.income, 0)
  const totalExpense = monthlyData.reduce((a, d) => a + d.expense, 0)
  const avgMonthlyExpense = monthlyData.length ? (totalExpense / monthlyData.length).toFixed(0) : 0
  const topCategory = categoryData.reduce((max, d) => d.amount > (max?.amount || 0) ? d : max, null)

  return (
    <div className="space-y-6 animate-fade-in max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Analytics</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Deep dive into your financial patterns
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl self-start sm:self-auto" style={{ background: 'var(--color-surface-subtle)' }}>
          {['monthly', 'yearly'].map(v => (
            <button key={v}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all capitalize ${view === v ? 'text-white shadow-sm' : ''}`}
              style={view === v ? { background: 'var(--color-primary)' } : { color: 'var(--color-text-secondary)' }}
              onClick={() => setView(v)}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatBadge label="Total Income (6M)" value={formatCurrency(totalIncome, currency)} color="var(--color-success)" icon={TrendingUp} />
        <StatBadge label="Total Expenses (6M)" value={formatCurrency(totalExpense, currency)} color="var(--color-danger)" icon={TrendingDown} />
        <StatBadge label="Avg Monthly Expense" value={formatCurrency(Number(avgMonthlyExpense), currency)} icon={Activity} />
        <StatBadge label="Top Category" value={topCategory?.category || '-'} icon={BarChart3} />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Income vs Expense Bar */}
        <div className="card p-4 sm:p-6 overflow-hidden">
          <div className="mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Income vs Expenses</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>Monthly comparison</p>
          </div>
          <div className="relative w-full h-[220px] sm:h-[260px]">
            {loading ? <div className="skeleton rounded-xl h-full" /> : <Bar data={barData} options={chartOptions({ scales: { ...baseScales, x: { ...baseScales.x, stacked: false } } })} />}
          </div>
        </div>

        {/* Net Savings Line */}
        <div className="card p-4 sm:p-6 overflow-hidden">
          <div className="mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Net Savings Trend</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>Monthly net (income − expense)</p>
          </div>
          <div className="relative w-full h-[220px] sm:h-[260px]">
            {loading ? <div className="skeleton rounded-xl h-full" /> : <Line data={savingsData} options={chartOptions()} />}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1 card p-4 sm:p-6 overflow-hidden">
          <div className="mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Spending by Category</h3>
          </div>
          <div className="relative w-full h-[200px] sm:h-[240px]">
            <Doughnut data={catData} options={{
              responsive: true, maintainAspectRatio: false, cutout: '65%',
              plugins: { legend: { display: false }, tooltip: { ...tooltipStyle } },
            }} />
          </div>
        </div>

        <div className="xl:col-span-2 card p-4 sm:p-6 overflow-hidden">
          <div className="mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Category Breakdown</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>Detailed spending by category</p>
          </div>
          <div className="space-y-3">
            {categoryData.map((item) => {
              const total = categoryData.reduce((a, d) => a + d.amount, 0)
              const pct = total > 0 ? (item.amount / total * 100).toFixed(1) : 0
              const color = CHART_COLORS[item.category] || '#94a3b8'
              return (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-1.5 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
                      <span className="truncate" style={{ color: 'var(--color-text-secondary)' }}>
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <span className="tabular-nums font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {formatCurrency(item.amount, currency)}
                      </span>
                      <span className="text-xs w-9 text-right" style={{ color: 'var(--color-text-tertiary)' }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
