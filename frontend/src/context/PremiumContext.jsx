// src/context/PremiumContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { premiumApi } from '../api/premiumApi'

const PremiumContext = createContext(null)

const DEMO_STATUS = {
  is_premium: false,
  plan: 'free',
  expires_at: null,
  free_features: [
    'Up to 50 transactions/month',
    'Basic analytics',
    'Single budget',
    'Receipt scanner (5/month)',
    '1 savings goal',
    'CSV export',
  ],
  premium_features: [
    'Unlimited transactions',
    'Advanced AI analytics & forecasting',
    'Unlimited budgets',
    'Unlimited receipt scanning',
    'Unlimited savings goals',
    'PDF/Excel export with charts',
    'Recurring expense detection',
    'Bill splitting',
    'Bank statement import',
    'Priority support',
    'Premium badge',
  ],
  plans: {
    monthly: { price: 299, currency: 'INR', label: 'Monthly', duration_days: 30 },
    yearly: { price: 2499, currency: 'INR', label: 'Yearly', duration_days: 365, savings: '30%' },
  },
}

/** Check if user has a valid token in localStorage — avoids useAuth dependency */
function getIsLoggedIn() {
  return !!localStorage.getItem('smart_expense_tracker_token')
}

export function PremiumProvider({ children }) {
  const [status, setStatus] = useState(() => {
    // Rehydrate premium state from localStorage on first render
    try {
      const stored = localStorage.getItem('smart_expense_tracker_premium')
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...DEMO_STATUS, ...parsed }
      }
    } catch { /* ignore */ }
    return DEMO_STATUS
  })
  const [loading, setLoading] = useState(false)

  const isPremium = status.is_premium
  const plan = status.plan

  const fetchStatus = useCallback(async () => {
    if (!getIsLoggedIn()) return  // Not logged in — keep localStorage/demo state
    setLoading(true)
    try {
      const { data } = await premiumApi.getStatus()
      setStatus(data)
    } catch {
      // API unavailable — keep current state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const activatePremium = async (planType = 'monthly') => {
    if (!getIsLoggedIn()) {
      // Demo / offline activation — persist to localStorage
      const now = new Date()
      const demoStatus = {
        is_premium: true,
        plan: planType,
        expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
      setStatus(prev => ({ ...prev, ...demoStatus }))
      localStorage.setItem('smart_expense_tracker_premium', JSON.stringify(demoStatus))
      return {
        success: true,
        invoice: {
          invoice_number: `DEMO-${now.getTime()}`,
          amount: planType === 'yearly' ? 2499 : 299,
          currency: 'INR',
          plan: planType,
          date: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        },
      }
    }
    setLoading(true)
    try {
      const { data } = await premiumApi.activate({ plan: planType })
      await fetchStatus()
      return data
    } finally {
      setLoading(false)
    }
  }

  const cancelPremium = async () => {
    if (!getIsLoggedIn()) {
      const cancelled = { is_premium: false, plan: 'free', expires_at: null }
      setStatus(prev => ({ ...prev, ...cancelled }))
      localStorage.removeItem('smart_expense_tracker_premium')
      return
    }
    setLoading(true)
    try {
      await premiumApi.deactivate()
      await fetchStatus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <PremiumContext.Provider value={{
      isPremium, plan, status, loading,
      fetchStatus, activatePremium, cancelPremium,
    }}>
      {children}
    </PremiumContext.Provider>
  )
}

export function usePremium() {
  const context = useContext(PremiumContext)
  if (!context) throw new Error('usePremium must be used within PremiumProvider')
  return context
}
