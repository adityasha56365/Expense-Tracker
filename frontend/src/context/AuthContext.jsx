// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/authApi'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('smart_expense_tracker_token')
    if (!token) {
      setLoading(false)
      return
    }
    if (token === 'demo_mock_token') {
      setUser({
        name: 'Demo User',
        email: 'demo@smartexpensetracker.in',
        preferences: { theme: 'light', currency: 'INR' }
      })
      setIsAuthenticated(true)
      setLoading(false)
      return
    }
    try {
      const { data } = await authApi.me()
      setUser(data)
      setIsAuthenticated(true)
    } catch {
      localStorage.removeItem('smart_expense_tracker_token')
      localStorage.removeItem('smart_expense_tracker_user')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = async (credentials) => {
    try {
      const { data } = await authApi.login(credentials)
      localStorage.setItem('smart_expense_tracker_token', data.access_token)
      setUser(data.user)
      setIsAuthenticated(true)
      toast.success(`Welcome back, ${data.user.name}!`)
      return data
    } catch (error) {
      if (credentials.email === 'demo@smartexpensetracker.in' && credentials.password === 'demo1234') {
        localStorage.setItem('smart_expense_tracker_token', 'demo_mock_token')
        const mockUser = {
          name: 'Demo User',
          email: 'demo@smartexpensetracker.in',
          preferences: { theme: 'light', currency: 'INR' }
        }
        setUser(mockUser)
        setIsAuthenticated(true)
        toast.success('Welcome! Running in offline demo mode.', { icon: '💡' })
        return { user: mockUser, access_token: 'demo_mock_token' }
      }
      throw error
    }
  }

  const register = async (userData) => {
    const { data } = await authApi.register(userData)
    localStorage.setItem('smart_expense_tracker_token', data.access_token)
    setUser(data.user)
    setIsAuthenticated(true)
    toast.success(`Welcome to Smart expense tracker, ${data.user.name}!`)
    return data
  }

  const logout = () => {
    localStorage.removeItem('smart_expense_tracker_token')
    localStorage.removeItem('smart_expense_tracker_user')
    setUser(null)
    setIsAuthenticated(false)
    toast.success('Logged out successfully')
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
