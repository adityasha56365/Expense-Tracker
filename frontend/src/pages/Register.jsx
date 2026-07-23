// src/pages/Register.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, TrendingUp, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Input from '../components/common/Input'
import Button from '../components/common/Button'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 6) errs.password = 'At least 6 characters required'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
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
      await register({ name: form.name, email: form.email, password: form.password })
      navigate('/dashboard')
    } catch {
      // handled globally
    } finally {
      setLoading(false)
    }
  }

  const FEATURES = [
    { icon: '📊', text: 'Visual spending analytics' },
    { icon: '🤖', text: 'AI-powered categorization' },
    { icon: '📷', text: 'Receipt OCR scanning' },
    { icon: '🔮', text: 'Spending forecasts' },
    { icon: '🎯', text: 'Smart budget tracking' },
    { icon: '🔒', text: 'Secure & private' },
  ]

  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

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
            Create your account
          </h2>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Start tracking your finances for free
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name"
            type="text"
            placeholder="Aditya Kumar"
            icon={User}
            value={form.name}
            onChange={handleChange('name')}
            error={errors.name}
            autoComplete="name"
          />
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
            placeholder="Min. 6 characters"
            icon={Lock}
            value={form.password}
            onChange={handleChange('password')}
            error={errors.password}
            autoComplete="new-password"
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
          <Input
            label="Confirm password"
            type={showConfirmPass ? 'text' : 'password'}
            placeholder="Repeat your password"
            icon={Lock}
            value={form.confirmPassword}
            onChange={handleChange('confirmPassword')}
            error={errors.confirmPassword}
            autoComplete="new-password"
            rightElement={
              <button
                type="button"
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                onClick={() => setShowConfirmPass(s => !s)}
                tabIndex="-1"
              >
                {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          <Button type="submit" variant="primary" className="w-full h-11 shadow-lg shadow-teal-500/10 mt-4" loading={loading} size="lg">
            Create Account
          </Button>
        </form>

        <p className="text-center text-[10px] mt-4 leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
          By creating an account, you agree to our{' '}
          <span className="underline cursor-pointer font-medium hover:text-slate-600">Terms of Service</span> and{' '}
          <span className="underline cursor-pointer font-medium hover:text-slate-600">Privacy Policy</span>.
        </p>

        <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

        <p className="text-center text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
