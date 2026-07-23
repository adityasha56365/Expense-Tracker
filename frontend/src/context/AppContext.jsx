// src/context/AppContext.jsx
import { createContext, useContext, useState, useCallback } from 'react'
import { transactionsApi } from '../api/transactionsApi'
import { budgetsApi } from '../api/budgetsApi'
import { analyticsApi } from '../api/analyticsApi'
import { forecastApi } from '../api/forecastApi'
import {
  DEMO_TRANSACTIONS, DEMO_BUDGETS, DEMO_MONTHLY_TREND,
  DEMO_CATEGORY_BREAKDOWN, DEMO_SUMMARY, DEMO_FORECAST
} from '../utils/demoData'
import { useAuth } from './AuthContext'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { isAuthenticated } = useAuth()

  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [summary, setSummary] = useState(null)
  const [monthlyTrend, setMonthlyTrend] = useState([])
  const [categoryBreakdown, setCategoryBreakdown] = useState([])
  const [forecast, setForecast] = useState(null)
  const [currency, setCurrency] = useState(localStorage.getItem('smart_expense_tracker_currency') || 'INR')

  const [loading, setLoading] = useState({
    transactions: false, budgets: false, analytics: false, forecast: false,
  })

  // Helper: set loading for a key
  const setLoad = (key, val) => setLoading(l => ({ ...l, [key]: val }))

  // Fetch transactions
  const fetchTransactions = useCallback(async (params = {}) => {
    if (!isAuthenticated) {
      setTransactions(DEMO_TRANSACTIONS)
      return
    }
    setLoad('transactions', true)
    try {
      const { data } = await transactionsApi.getAll(params)
      setTransactions(data)
    } catch {
      setTransactions(DEMO_TRANSACTIONS)
    } finally {
      setLoad('transactions', false)
    }
  }, [isAuthenticated])

  // Fetch budgets
  const fetchBudgets = useCallback(async () => {
    if (!isAuthenticated) {
      setBudgets(DEMO_BUDGETS)
      return
    }
    setLoad('budgets', true)
    try {
      const { data } = await budgetsApi.getAll()
      setBudgets(data)
    } catch {
      setBudgets(DEMO_BUDGETS)
    } finally {
      setLoad('budgets', false)
    }
  }, [isAuthenticated])

  // Fetch analytics
  const fetchAnalytics = useCallback(async (params = {}) => {
    if (!isAuthenticated) {
      setSummary(DEMO_SUMMARY)
      setMonthlyTrend(DEMO_MONTHLY_TREND)
      setCategoryBreakdown(DEMO_CATEGORY_BREAKDOWN)
      return
    }
    setLoad('analytics', true)
    try {
      const [summaryRes, trendRes, catRes] = await Promise.all([
        analyticsApi.getSummary(params),
        analyticsApi.getMonthlyTrend(params),
        analyticsApi.getCategoryBreakdown(params),
      ])
      setSummary(summaryRes.data)
      setMonthlyTrend(trendRes.data)
      setCategoryBreakdown(catRes.data)
    } catch {
      setSummary(DEMO_SUMMARY)
      setMonthlyTrend(DEMO_MONTHLY_TREND)
      setCategoryBreakdown(DEMO_CATEGORY_BREAKDOWN)
    } finally {
      setLoad('analytics', false)
    }
  }, [isAuthenticated])

  // Fetch forecast
  const fetchForecast = useCallback(async () => {
    if (!isAuthenticated) {
      setForecast(DEMO_FORECAST)
      return
    }
    setLoad('forecast', true)
    try {
      const { data } = await forecastApi.getNextMonth()
      setForecast(data)
    } catch {
      setForecast(DEMO_FORECAST)
    } finally {
      setLoad('forecast', false)
    }
  }, [isAuthenticated])

  // Transaction mutations
  const addTransaction = async (data) => {
    if (!isAuthenticated) {
      const newT = { ...data, _id: `t${Date.now()}`, source: 'manual', created_at: new Date().toISOString() }
      setTransactions(prev => [newT, ...prev])
      return newT
    }
    const { data: created } = await transactionsApi.create(data)
    setTransactions(prev => [created, ...prev])
    return created
  }

  const updateTransaction = async (id, data) => {
    if (!isAuthenticated) {
      setTransactions(prev => prev.map(t => t._id === id ? { ...t, ...data } : t))
      return
    }
    const { data: updated } = await transactionsApi.update(id, data)
    setTransactions(prev => prev.map(t => t._id === id ? updated : t))
    return updated
  }

  const deleteTransaction = async (id) => {
    if (!isAuthenticated) {
      setTransactions(prev => prev.filter(t => t._id !== id))
      return
    }
    await transactionsApi.delete(id)
    setTransactions(prev => prev.filter(t => t._id !== id))
  }

  // Budget mutations
  const saveBudget = async (data, id = null) => {
    if (!isAuthenticated) {
      if (id) {
        setBudgets(prev => prev.map(b => b._id === id ? { ...b, ...data } : b))
      } else {
        setBudgets(prev => [{ ...data, _id: `b${Date.now()}` }, ...prev])
      }
      return
    }
    if (id) {
      const { data: updated } = await budgetsApi.update(id, data)
      setBudgets(prev => prev.map(b => b._id === id ? updated : b))
    } else {
      const { data: created } = await budgetsApi.create(data)
      setBudgets(prev => [created, ...prev])
    }
  }

  const deleteBudget = async (id) => {
    if (!isAuthenticated) {
      setBudgets(prev => prev.filter(b => b._id !== id))
      return
    }
    await budgetsApi.delete(id)
    setBudgets(prev => prev.filter(b => b._id !== id))
  }

  const changeCurrency = (cur) => {
    setCurrency(cur)
    localStorage.setItem('smart_expense_tracker_currency', cur)
  }

  return (
    <AppContext.Provider value={{
      transactions, budgets, summary, monthlyTrend, categoryBreakdown, forecast,
      currency, loading,
      fetchTransactions, fetchBudgets, fetchAnalytics, fetchForecast,
      addTransaction, updateTransaction, deleteTransaction,
      saveBudget, deleteBudget, changeCurrency,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
