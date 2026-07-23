// src/components/layout/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, Target, BarChart3,
  ScanLine, Lightbulb, Settings, ChevronLeft, ChevronRight,
  TrendingUp, LogOut, PiggyBank, RefreshCw, CreditCard,
  Users, Upload, Download, Crown, FileText
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { usePremium } from '../../context/PremiumContext'
import { useState } from 'react'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/insights', icon: Lightbulb, label: 'Insights' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { to: '/budgets', icon: Target, label: 'Budgets' },
      { to: '/goals', icon: PiggyBank, label: 'Savings Goals' },
      { to: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
      { to: '/recurring', icon: RefreshCw, label: 'Recurring' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/receipt', icon: ScanLine, label: 'Receipt Scanner' },
      { to: '/bank-import', icon: Upload, label: 'Bank Import' },
      { to: '/reports', icon: FileText, label: 'Export Reports' },
      { to: '/bill-split', icon: Users, label: 'Bill Splitting' },
    ],
  },
]

const bottomItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ isOpen, collapsed, onToggleCollapse, onClose }) {
  const { user, logout } = useAuth()
  const { isPremium } = usePremium()
  const location = useLocation()

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'LF'

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}

      <aside className={clsx('sidebar', collapsed && 'collapsed', isOpen && 'open')}>
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b flex-shrink-0"
             style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 gradient-teal">
              <TrendingUp size={16} className="text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-base tracking-tight"
                    style={{ color: 'var(--color-text-primary)' }}>
                Smart expense tracker
              </span>
            )}
          </div>
          {/* Collapse toggle — desktop only */}
          <button
            onClick={onToggleCollapse}
            className="ml-auto hidden lg:flex btn btn-ghost btn-sm !p-1.5 rounded-lg flex-shrink-0"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
          {navGroups.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-wider px-3 mb-1"
                  style={{ color: 'var(--color-text-tertiary)' }}>
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) => clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                      isActive
                        ? 'text-white shadow-sm'
                        : 'hover:bg-[var(--color-surface-subtle)]',
                    )}
                    style={({ isActive }) => ({
                      background: isActive ? 'var(--color-primary)' : undefined,
                      color: isActive ? 'white' : 'var(--color-text-secondary)',
                    })}
                    title={collapsed ? label : undefined}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t px-3 py-4 space-y-0.5 flex-shrink-0"
             style={{ borderColor: 'var(--color-border)' }}>
          {bottomItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'text-white'
                  : 'hover:bg-[var(--color-surface-subtle)]'
              )}
              style={({ isActive }) => ({
                background: isActive ? 'var(--color-primary)' : undefined,
                color: isActive ? 'white' : 'var(--color-text-secondary)',
              })}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}

          {/* Premium nav link */}
          <NavLink
            to="/premium"
            onClick={onClose}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive ? 'text-white' : 'hover:bg-[var(--color-surface-subtle)]'
            )}
            style={({ isActive }) => ({
              background: isActive ? 'var(--color-primary)' : undefined,
              color: isPremium ? '#f59e0b' : 'var(--color-text-secondary)',
            })}
            title={collapsed ? 'Premium' : undefined}
          >
            <Crown size={18} className="flex-shrink-0" />
            {!collapsed && (
              <span className="flex items-center gap-1.5">
                Premium
                {isPremium && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: '#f59e0b20', color: '#f59e0b' }}>
                    ACTIVE
                  </span>
                )}
              </span>
            )}
          </NavLink>

          {/* User section */}
          <div className={clsx(
            'flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl',
            'hover:bg-[var(--color-surface-subtle)] cursor-pointer transition-all',
            collapsed && 'justify-center'
          )}>
            <div className="relative w-7 h-7 flex-shrink-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                   style={{ background: 'var(--color-primary)' }}>
                {initials}
              </div>
              {isPremium && (
                <Crown size={10} className="absolute -top-1 -right-1"
                  style={{ color: '#f59e0b', filter: 'drop-shadow(0 0 3px #f59e0b)' }} />
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {user?.name || 'Guest User'}
                </p>
                <p className="text-[10px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                  {user?.email || 'demo@smartexpensetracker.in'}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                className="btn btn-ghost btn-sm !p-1 rounded-lg"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
