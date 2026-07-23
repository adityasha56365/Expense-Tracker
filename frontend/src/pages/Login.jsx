// src/pages/Login.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, TrendingUp, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Input from '../components/common/Input'
import Button from '../components/common/Button'

const STATS = [
  { label: 'Active Users', value: '12,400+' },
  { label: 'Transactions Tracked', value: '2.8M+' },
  { label: 'Avg. Monthly Savings', value: '₹8,200' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const validate = () => {
    const errs = {}
    if (!form.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
    if (!form.password) errs.password = 'Password is required'
    return errs
  }

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    try {
      await login(form)
      navigate('/dashboard')
    } catch {
      // handled globally
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = async () => {
    setLoading(true)
    try {
      // Use demo credentials
      await login({ email: 'demo@smartexpensetracker.in', password: 'demo1234' })
      navigate('/dashboard')
    } catch {
      // Fallback: just navigate with demo data
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Ambient background glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[420px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl p-8 sm:p-10 space-y-8 animate-fade-in relative z-10">
        {/* Brand Logo & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl gradient-teal flex items-center justify-center shadow-lg shadow-teal-500/20 mb-3">
            <TrendingUp size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Smart expense tracker</h1>
          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mt-1">Personal Finance Dashboard</p>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Welcome back
          </h2>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={form.email}
            onChange={handleChange('email')}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            label="Password"
            type={showPass ? 'text' : 'password'}
            placeholder="••••••••"
            icon={Lock}
            value={form.password}
            onChange={handleChange('password')}
            error={errors.password}
            autoComplete="current-password"
            rightElement={
              <button
                type="button"
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                onClick={() => setShowPass(s => !s)}
                tabIndex="-1"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              <input type="checkbox" className="rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer" />
              Remember me
            </label>
            <Link to="/forgot" className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" className="w-full h-11 shadow-lg shadow-teal-500/10 mt-2" loading={loading} size="lg">
            Sign In
          </Button>
        </form>

        <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

        <p className="text-center text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
