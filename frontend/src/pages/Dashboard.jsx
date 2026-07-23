// src/pages/Dashboard.jsx
import { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, Activity, Plus, ScanLine, Target
} from 'lucide-react'
import SummaryCard from '../components/dashboard/SummaryCard'
import SpendingTrendChart from '../components/dashboard/SpendingTrendChart'
import CategoryDoughnutChart from '../components/dashboard/CategoryDoughnutChart'
import RecentTransactions from '../components/dashboard/RecentTransactions'
import BudgetOverview from '../components/dashboard/BudgetOverview'
import InsightPanel from '../components/dashboard/InsightPanel'
import { MetricCardSkeleton, ChartSkeleton, CardSkeleton } from '../components/common/LoadingSkeleton'
import { formatPercentage } from '../utils/formatters'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button'

export default function Dashboard() {
  const { user } = useAuth()
  const {
    transactions, summary, monthlyTrend, categoryBreakdown, forecast,
    loading, fetchTransactions, fetchAnalytics, fetchForecast, fetchBudgets,
  } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    fetchTransactions()
    fetchAnalytics()
    fetchForecast()
    fetchBudgets()
  }, [])

  const isLoading = loading.analytics

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {greeting}, {user?.name?.split(' ')[0] || 'there'} 👋
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Here's your financial overview for {now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={ScanLine} onClick={() => navigate('/receipt')}>
            Scan Receipt
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => navigate('/transactions')}>
            Add
          </Button>
        </div>
      </div>

      {/* Summary cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <SummaryCard
              title="Total Balance"
              value={summary?.total_balance || 0}
              icon={Wallet}
              variant="primary"
              trendLabel="This month"
            />
            <SummaryCard
              title="Total Income"
              value={summary?.total_income || 0}
              icon={TrendingUp}
              variant="income"
              trend={5.2}
              trendLabel="vs last month"
            />
            <SummaryCard
              title="Total Expenses"
              value={summary?.total_expense || 0}
              icon={TrendingDown}
              variant="expense"
              trend={-3.1}
              trendLabel="vs last month"
            />
            <SummaryCard
              title="Savings Rate"
              value={`${(summary?.savings_rate || 0).toFixed(1)}%`}
              icon={PiggyBank}
              variant="default"
              trendLabel="of income saved"
            />
            <SummaryCard
              title="Avg Daily Spend"
              value={summary?.avg_daily_spend || 0}
              icon={Activity}
              variant="warning"
              trendLabel="per day"
              compact
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          {isLoading ? (
            <ChartSkeleton height={240} />
          ) : (
            <SpendingTrendChart data={monthlyTrend} />
          )}
        </div>
        <div>
          {isLoading ? (
            <ChartSkeleton height={240} />
          ) : (
            <CategoryDoughnutChart data={categoryBreakdown} />
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent transactions */}
        <div className="xl:col-span-2">
          {loading.transactions ? (
            <CardSkeleton rows={6} />
          ) : (
            <RecentTransactions transactions={transactions} />
          )}
        </div>

        {/* Budget + Insights */}
        <div className="space-y-4">
          <BudgetOverview />
          <InsightPanel forecast={forecast} />
        </div>
      </div>

      {/* Quick action shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Plus, label: 'Add Transaction', to: '/transactions', color: 'var(--color-primary-muted)', iconColor: 'var(--color-primary)' },
          { icon: ScanLine, label: 'Scan Receipt', to: '/receipt', color: 'var(--color-info-muted)', iconColor: 'var(--color-info)' },
          { icon: Target, label: 'Set Budget', to: '/budgets', color: 'var(--color-warning-muted)', iconColor: 'var(--color-warning)' },
          { icon: Activity, label: 'View Analytics', to: '/analytics', color: 'var(--color-success-muted)', iconColor: 'var(--color-success)' },
        ].map(({ icon: Icon, label, to, color, iconColor }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className="card p-4 flex items-center gap-3 hover:shadow-md transition-all group cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                 style={{ background: color, color: iconColor }}>
              <Icon size={18} />
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
