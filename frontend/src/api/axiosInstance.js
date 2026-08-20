// src/api/axiosInstance.js
import axios from 'axios'
import toast from 'react-hot-toast'

let API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : '')

// Fallback safety check: If VITE_API_URL points to a different vercel.app domain than current browser host,
// default to relative URL so requests hit the current active deployment!
if (typeof window !== 'undefined' && window.location) {
  const currentHost = window.location.hostname
  if (API_BASE && API_BASE.includes('vercel.app')) {
    try {
      const urlHost = new URL(API_BASE).hostname
      if (urlHost !== currentHost) {
        API_BASE = ''
      }
    } catch (e) {
      API_BASE = ''
    }
  }
}

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

const isAuthEndpoint = (url = '') => url.includes('/auth/login') || url.includes('/auth/register')

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smart_expense_tracker_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || ''

    if (error.response?.status === 401 && !isAuthEndpoint(requestUrl)) {
      localStorage.removeItem('smart_expense_tracker_token')
      localStorage.removeItem('smart_expense_tracker_user')
      window.location.href = '/login'
    }
    const message = error.response?.data?.detail || error.message || 'Something went wrong'
    if (error.response?.status !== 401 || isAuthEndpoint(requestUrl)) {
      toast.error(message)
    }
    return Promise.reject(error)
  }
)

export default api
