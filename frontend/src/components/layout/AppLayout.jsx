// src/components/layout/AppLayout.jsx
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import TransactionForm from '../transactions/TransactionForm'
import { useApp } from '../../context/AppContext'
import clsx from 'clsx'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/budgets': 'Budgets',
  '/analytics': 'Analytics',
  '/receipt': 'Receipt Scanner',
  '/insights': 'Insights & Forecast',
  '/settings': 'Settings',
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const { addTransaction } = useApp()
  const location = useLocation()

  const title = PAGE_TITLES[location.pathname] || 'Smart expense tracker'

  const handleAddTransaction = async (data) => {
    await addTransaction(data)
    setAddModalOpen(false)
  }

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        onClose={() => setSidebarOpen(false)}
      />

      <main className={clsx('main-content', sidebarCollapsed && 'sidebar-collapsed')}>
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
          onAddTransaction={() => setAddModalOpen(true)}
        />

        <div className="page-container">
          <Outlet />
        </div>
      </main>

      {/* Global add transaction modal */}
      <TransactionForm
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddTransaction}
      />
    </div>
  )
}
