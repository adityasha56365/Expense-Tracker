// src/pages/Settings.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useApp } from '../context/AppContext'
import { User, Moon, Sun, Globe, Download, Shield, Bell, Trash2, Save } from 'lucide-react'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import { CURRENCIES } from '../utils/constants'
import api from '../api/axiosInstance'
import toast from 'react-hot-toast'

function SettingsSection({ title, desc, icon: Icon, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b"
           style={{ borderColor: 'var(--color-border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
             style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-primary)' }}>
          <Icon size={16} />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
          {desc && <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{desc}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
        style={{ background: checked ? 'var(--color-primary)' : 'var(--color-border)' }}
      >
        <span
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? '24px' : '4px' }}
        />
      </button>
    </div>
  )
}

export default function Settings() {
  const { user, updateUser, logout } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const { currency, changeCurrency, transactions } = useApp()

  const [profile, setProfile] = useState({ name: '', email: '' })
  const [profileLoading, setProfileLoading] = useState(false)

  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    weeklyReport: false,
    monthlyReport: true,
  })

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || '', email: user.email || '' })
    }
  }, [user])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    try {
      const { data } = await api.put('/users/profile', profile)
      updateUser(data)
      toast.success('Profile updated successfully')
    } catch {
      // If API fails, still update locally for demo
      updateUser({ ...user, ...profile })
      toast.success('Profile updated (demo mode)')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleExportData = () => {
    const csv = [
      ['Date', 'Title', 'Type', 'Category', 'Amount', 'Payment Method', 'Merchant'],
      ...transactions.map(t => [
        new Date(t.date).toLocaleDateString('en-IN'),
        t.title, t.type, t.category, t.amount, t.payment_method, t.merchant || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `smart_expense_tracker_export_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data exported successfully')
  }

  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'LF'

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Settings</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          Manage your account preferences
        </p>
      </div>

      {/* Profile */}
      <SettingsSection title="Profile" desc="Update your personal information" icon={User}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
               style={{ background: 'var(--color-primary)' }}>
            {initials}
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{profile.name || 'User'}</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{profile.email}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Member since {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                : 'July 2024'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Full Name"
            value={profile.name}
            onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
            placeholder="Your name"
          />
          <Input
            label="Email Address"
            type="email"
            value={profile.email}
            onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
            placeholder="your@email.com"
          />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" icon={Save} loading={profileLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection title="Appearance" desc="Customize the look and feel" icon={isDark ? Moon : Sun}>
        <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Dark Mode</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                Switch between light and dark theme
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {isDark ? 'Dark' : 'Light'}
              </span>
              <button
                role="switch"
                aria-checked={isDark}
                onClick={toggleTheme}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ background: isDark ? 'var(--color-primary)' : 'var(--color-border)' }}
              >
                <span
                  className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all"
                  style={{ left: isDark ? '24px' : '4px' }}
                />
              </button>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Currency */}
      <SettingsSection title="Currency & Region" desc="Set your preferred currency" icon={Globe}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {CURRENCIES.map(cur => (
              <button
                key={cur.value}
                onClick={() => { changeCurrency(cur.value); toast.success(`Currency set to ${cur.label}`) }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  currency === cur.value ? 'border-[var(--color-primary)]' : 'hover:border-[var(--color-primary)]'
                }`}
                style={{
                  borderColor: currency === cur.value ? 'var(--color-primary)' : 'var(--color-border)',
                  background: currency === cur.value ? 'var(--color-primary-muted)' : 'var(--color-surface-subtle)',
                }}
              >
                <p className="text-lg font-bold" style={{ color: currency === cur.value ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                  {cur.symbol}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{cur.label}</p>
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection title="Notifications" desc="Control your notification preferences" icon={Bell}>
        <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <Toggle
            label="Budget Alerts"
            description="Get notified when you're nearing a budget limit"
            checked={notifications.budgetAlerts}
            onChange={v => setNotifications(n => ({ ...n, budgetAlerts: v }))}
          />
          <Toggle
            label="Weekly Report"
            description="Receive a spending summary every Monday"
            checked={notifications.weeklyReport}
            onChange={v => setNotifications(n => ({ ...n, weeklyReport: v }))}
          />
          <Toggle
            label="Monthly Report"
            description="Get a detailed monthly financial report"
            checked={notifications.monthlyReport}
            onChange={v => setNotifications(n => ({ ...n, monthlyReport: v }))}
          />
        </div>
      </SettingsSection>

      {/* Data & Privacy */}
      <SettingsSection title="Data & Privacy" desc="Manage your data" icon={Shield}>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl"
               style={{ background: 'var(--color-surface-subtle)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Export Data</p>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Download all your transactions as CSV
              </p>
            </div>
            <Button variant="secondary" size="sm" icon={Download} onClick={handleExportData}>
              Export CSV
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border"
               style={{ background: 'var(--color-danger-muted)', borderColor: '#fca5a5' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>Sign Out</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                You'll need to log in again to access your data
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>
      </SettingsSection>

      <p className="text-center text-xs pb-4" style={{ color: 'var(--color-text-tertiary)' }}>
        Smart expense tracker v1.0.0 · Built with ❤️ · Your data is encrypted and private
      </p>
    </div>
  )
}
