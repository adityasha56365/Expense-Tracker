// src/api/axiosInstance.js
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
