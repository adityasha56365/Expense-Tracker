// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { AppProvider } from './context/AppContext'
import { PremiumProvider } from './context/PremiumContext'

import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './router/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Budgets from './pages/Budgets'
import Analytics from './pages/Analytics'
import ReceiptScanner from './pages/ReceiptScanner'
import Insights from './pages/Insights'
import Settings from './pages/Settings'
// ── New Feature Pages ────────────────────────────────────────────────────────
import SavingsGoals from './pages/SavingsGoals'
import RecurringExpenses from './pages/RecurringExpenses'
import BankImport from './pages/BankImport'
import Premium from './pages/Premium'
import BillSplit from './pages/BillSplit'
import Subscriptions from './pages/Subscriptions'
import ExportReports from './pages/ExportReports'
import PWAInstallBanner from './components/common/PWAInstallBanner'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <PremiumProvider>
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected app routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="budgets" element={<Budgets />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="receipt" element={<ReceiptScanner />} />
                  <Route path="insights" element={<Insights />} />
                  <Route path="settings" element={<Settings />} />
                  {/* ── New Feature Routes ─────────────────────────────────── */}
                  <Route path="goals" element={<SavingsGoals />} />
                  <Route path="recurring" element={<RecurringExpenses />} />
                  <Route path="bank-import" element={<BankImport />} />
                  <Route path="premium" element={<Premium />} />
                  <Route path="bill-split" element={<BillSplit />} />
                  <Route path="subscriptions" element={<Subscriptions />} />
                  <Route path="reports" element={<ExportReports />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.875rem',
                  borderRadius: '12px',
                  padding: '12px 16px',
                },
              }}
            />
            <PWAInstallBanner />
          </PremiumProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

