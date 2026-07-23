// src/components/layout/Topbar.jsx
import { Menu, Bell, Sun, Moon, Search, Plus } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'

export default function Topbar({ onMenuClick, title, onAddTransaction }) {
  const { theme, toggleTheme, isDark } = useTheme()
  const { user } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'LF'

  return (
    <header
      className="sticky top-0 z-30 h-16 flex items-center gap-4 px-4 lg:px-6 border-b"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      {/* Mobile menu */}
      <button
        className="btn btn-ghost btn-sm !p-2 rounded-lg lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h1>
      </div>

      {/* Search bar */}
      <div className={clsx(
        'hidden md:flex items-center gap-2 h-9 px-3 rounded-xl border transition-all',
        searchOpen ? 'w-56' : 'w-44',
        'cursor-text'
      )}
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-subtle)' }}
      onClick={() => setSearchOpen(true)}
      >
        <Search size={15} style={{ color: 'var(--color-text-tertiary)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onBlur={() => setSearchOpen(false)}
          placeholder="Search..."
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
          style={{ color: 'var(--color-text-primary)' }}
        />
      </div>

      {/* Quick add */}
      <button
        className="btn btn-primary btn-sm gap-1.5 hidden sm:inline-flex"
        onClick={onAddTransaction}
        aria-label="Add transaction"
      >
        <Plus size={15} />
        Add
      </button>

      {/* Theme toggle */}
      <button
        className="btn btn-ghost btn-sm !p-2 rounded-lg"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Notifications */}
      <button className="btn btn-ghost btn-sm !p-2 rounded-lg relative" aria-label="Notifications">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
      </button>

      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white cursor-pointer"
        style={{ background: 'var(--color-primary)' }}
        onClick={() => navigate('/settings')}
        title="Profile"
      >
        {initials}
      </div>
    </header>
  )
}
