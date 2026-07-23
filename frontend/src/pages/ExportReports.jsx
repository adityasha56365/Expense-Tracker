// src/pages/ExportReports.jsx
/**
 * Export Reports — PDF, CSV, Excel
 * Charts are included in PDF via html2canvas.
 */
import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { Download, FileText, FileSpreadsheet, Calendar, Filter } from 'lucide-react'
import Button from '../components/common/Button'
import { formatCurrency, formatDate } from '../utils/formatters'
import { CATEGORIES, CATEGORY_MAP } from '../utils/constants'
import toast from 'react-hot-toast'

const REPORT_TYPES = [
  { key: 'monthly', label: 'Monthly Report' },
  { key: 'yearly', label: 'Yearly Report' },
  { key: 'custom', label: 'Custom Date Range' },
  { key: 'tax', label: 'Tax Report' },
]

function StatBox({ label, value, color }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: 'var(--color-surface-subtle)' }}>
      <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{label}</p>
      <p className="text-lg font-bold mt-1" style={{ color: color || 'var(--color-text-primary)' }}>{value}</p>
    </div>
  )
}

export default function ExportReports() {
  const { transactions, summary, currency } = useApp()
  const reportRef = useRef(null)

  const now = new Date()
  const [reportType, setReportType] = useState('monthly')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [exporting, setExporting] = useState(null)

  // Filter transactions based on report type
  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      const date = new Date(t.date)
      if (reportType === 'monthly') {
        return date.getMonth() + 1 === month && date.getFullYear() === year
      }
      if (reportType === 'yearly') {
        return date.getFullYear() === year
      }
      if (reportType === 'tax') {
        // Indian financial year: April to March
        const fyStart = new Date(`${year}-04-01`)
        const fyEnd = new Date(`${year + 1}-03-31`)
        return date >= fyStart && date <= fyEnd
      }
      if (reportType === 'custom' && dateFrom && dateTo) {
        return date >= new Date(dateFrom) && date <= new Date(dateTo)
      }
      return true
    })
  }

  const filteredTxs = getFilteredTransactions()
  const totalIncome = filteredTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filteredTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const savings = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? (savings / totalIncome * 100).toFixed(1) : 0

  // Category breakdown for report
  const categoryBreakdown = {}
  filteredTxs.filter(t => t.type === 'expense').forEach(t => {
    categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount
  })
  const topCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)

  // ── CSV Export ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    setExporting('csv')
    try {
      const rows = [
        ['Date', 'Title', 'Type', 'Category', 'Amount', 'Payment Method', 'Merchant', 'Note'],
        ...filteredTxs.map(t => [
          formatDate(t.date), t.title, t.type, t.category, t.amount,
          t.payment_method || '', t.merchant || '', t.note || '',
        ]),
      ]
      const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `expense_report_${reportType}_${year}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported successfully!')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(null)
    }
  }

  // ── Excel Export ────────────────────────────────────────────────────────────
  const exportExcel = async () => {
    setExporting('excel')
    try {
      const XLSX = await import('xlsx')
      const ws_data = [
        ['Date', 'Title', 'Type', 'Category', 'Amount', 'Payment Method', 'Merchant'],
        ...filteredTxs.map(t => [
          formatDate(t.date), t.title, t.type, t.category, t.amount,
          t.payment_method || '', t.merchant || '',
        ]),
      ]
      const ws = XLSX.utils.aoa_to_sheet(ws_data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions')

      // Summary sheet
      const sum_data = [
        ['Report Summary', ''],
        ['Report Type', REPORT_TYPES.find(r => r.key === reportType)?.label],
        ['Period', reportType === 'monthly' ? `${month}/${year}` : year.toString()],
        ['', ''],
        ['Total Income', totalIncome],
        ['Total Expense', totalExpense],
        ['Savings', savings],
        ['Savings Rate', `${savingsRate}%`],
        ['Transactions', filteredTxs.length],
        ['', ''],
        ['Category Breakdown', ''],
        ...topCategories.map(([cat, amt]) => [cat, amt]),
      ]
      const ws2 = XLSX.utils.aoa_to_sheet(sum_data)
      XLSX.utils.book_append_sheet(wb, ws2, 'Summary')

      XLSX.writeFile(wb, `expense_report_${reportType}_${year}.xlsx`)
      toast.success('Excel exported successfully!')
    } catch {
      toast.error('Excel export failed. Falling back to CSV.')
      exportCSV()
    } finally {
      setExporting(null)
    }
  }

  // ── PDF Export ──────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    setExporting('pdf')
    try {
      const [jsPDFModule, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])
      const jsPDF = jsPDFModule.default
      const html2canvas = html2canvasModule.default

      const element = reportRef.current
      if (!element) throw new Error('Report element not found')

      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false })
      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`expense_report_${reportType}_${year}.pdf`)
      toast.success('PDF exported successfully!')
    } catch (err) {
      console.error('PDF error:', err)
      toast.error('PDF export failed. Try CSV instead.')
    } finally {
      setExporting(null)
    }
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Export Reports</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          Generate and download professional financial reports
        </p>
      </div>

      {/* Controls */}
      <div className="card p-5 space-y-4">
        {/* Report type */}
        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
            Report Type
          </label>
          <div className="flex flex-wrap gap-2">
            {REPORT_TYPES.map(r => (
              <button key={r.key} onClick={() => setReportType(r.key)}
                className="px-3 py-1.5 rounded-lg text-sm border transition-all"
                style={{
                  borderColor: reportType === r.key ? 'var(--color-primary)' : 'var(--color-border)',
                  background: reportType === r.key ? 'var(--color-primary-muted)' : 'var(--color-surface-subtle)',
                  color: reportType === r.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: reportType === r.key ? '600' : '400',
                }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Period controls */}
        {(reportType === 'monthly' || reportType === 'yearly' || reportType === 'tax') && (
          <div className="flex gap-3">
            {reportType === 'monthly' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Month</label>
                <select className="form-input w-32" value={month} onChange={e => setMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Year</label>
              <input className="form-input w-28" type="number" value={year}
                onChange={e => setYear(Number(e.target.value))} min="2020" max="2030" />
            </div>
          </div>
        )}

        {reportType === 'custom' && (
          <div className="flex gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>From</label>
              <input className="form-input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>To</label>
              <input className="form-input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        )}

        {/* Export buttons */}
        <div className="flex flex-wrap gap-3 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <Button variant="secondary" size="sm" icon={Download}
            loading={exporting === 'csv'} onClick={exportCSV}>
            Export CSV
          </Button>
          <Button variant="secondary" size="sm" icon={FileSpreadsheet}
            loading={exporting === 'excel'} onClick={exportExcel}>
            Export Excel
          </Button>
          <Button variant="primary" size="sm" icon={FileText}
            loading={exporting === 'pdf'} onClick={exportPDF}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report Preview (this is what gets captured for PDF) */}
      <div ref={reportRef} className="card p-6 space-y-5"
        style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
        {/* Report header */}
        <div className="border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {REPORT_TYPES.find(r => r.key === reportType)?.label}
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            {reportType === 'monthly' ? `${MONTHS[month - 1]} ${year}` :
             reportType === 'yearly' ? `Year ${year}` :
             reportType === 'tax' ? `FY ${year}–${year + 1}` :
             `${dateFrom} to ${dateTo}`}
            · {filteredTxs.length} transactions
          </p>
        </div>

        {/* Summary grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox label="Total Income" value={formatCurrency(totalIncome, currency)} color="var(--color-success)" />
          <StatBox label="Total Expense" value={formatCurrency(totalExpense, currency)} color="var(--color-danger)" />
          <StatBox label="Net Savings" value={formatCurrency(savings, currency)} color="var(--color-primary)" />
          <StatBox label="Savings Rate" value={`${savingsRate}%`} />
        </div>

        {/* Category breakdown */}
        {topCategories.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--color-text-tertiary)' }}>Top Categories</p>
            <div className="space-y-2">
              {topCategories.map(([cat, amt]) => {
                const pct = totalExpense > 0 ? (amt / totalExpense * 100) : 0
                const catInfo = CATEGORY_MAP[cat]
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span>{catInfo?.icon}</span>
                        <span style={{ color: 'var(--color-text-primary)' }}>{cat}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{ color: 'var(--color-text-tertiary)' }}>{pct.toFixed(1)}%</span>
                        <span className="font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                          {formatCurrency(amt, currency)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: 'var(--color-border)' }}>
                      <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: 'var(--color-primary)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Transactions table */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--color-text-tertiary)' }}>
            Transactions ({filteredTxs.length})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'var(--color-surface-subtle)' }}>
                  {['Date', 'Title', 'Category', 'Type', 'Amount'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold"
                      style={{ color: 'var(--color-text-tertiary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTxs.slice(0, 50).map((t, i) => (
                  <tr key={t._id || i} className="border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    <td className="px-3 py-2" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(t.date)}</td>
                    <td className="px-3 py-2 max-w-xs truncate" style={{ color: 'var(--color-text-primary)' }}>{t.title}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--color-text-secondary)' }}>{t.category}</td>
                    <td className="px-3 py-2">
                      <span className={`badge ${t.type === 'income' ? 'badge-income' : 'badge-expense'}`}>{t.type}</span>
                    </td>
                    <td className="px-3 py-2 tabular-nums font-medium"
                      style={{ color: t.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTxs.length > 50 && (
              <p className="text-xs text-center mt-2 py-2" style={{ color: 'var(--color-text-tertiary)' }}>
                Showing first 50 of {filteredTxs.length} transactions. Export CSV/Excel for full data.
              </p>
            )}
          </div>
        </div>

        {filteredTxs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              No transactions found for the selected period.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
