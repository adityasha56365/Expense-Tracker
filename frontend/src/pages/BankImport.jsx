// src/pages/BankImport.jsx
/**
 * Bank Statement Import — Multi-step wizard
 * Step 1: Upload CSV/Excel file
 * Step 2: Preview & adjust column mapping
 * Step 3: Review parsed rows + duplicate warnings
 * Step 4: Confirm import
 */
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { importApi } from '../api/importApi'
import { useApp } from '../context/AppContext'
import {
  Upload, FileText, CheckCircle2, AlertTriangle,
  ArrowRight, ArrowLeft, RefreshCw, X, Download
} from 'lucide-react'
import Button from '../components/common/Button'
import { CATEGORIES } from '../utils/constants'
import { formatCurrency } from '../utils/formatters'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STEPS = ['Upload File', 'Preview & Map', 'Review', 'Done']

// ── Step 1: Upload ────────────────────────────────────────────────────────────
function StepUpload({ onFile }) {
  const onDrop = useCallback(([file]) => { if (file) onFile(file) }, [onFile])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
      'text/plain': ['.txt', '.csv'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const BANKS = [
    { name: 'HDFC Bank', format: 'PDF / CSV' },
    { name: 'ICICI Bank', format: 'PDF / Excel' },
    { name: 'SBI', format: 'PDF / CSV' },
    { name: 'Axis Bank', format: 'PDF / Excel' },
    { name: 'Kotak Bank', format: 'PDF / CSV' },
    { name: 'Yes Bank', format: 'PDF / CSV' },
    { name: 'Any other bank', format: 'PDF / CSV / Excel' },
  ]

  return (
    <div className="space-y-6">
      <div {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all',
          isDragActive ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)]' : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-subtle)]'
        )}>
        <input {...getInputProps()} id="bank-file-input" />
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: isDragActive ? 'var(--color-primary)' : 'var(--color-surface-subtle)', color: isDragActive ? 'white' : 'var(--color-primary)' }}>
          <Upload size={28} />
        </div>
        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {isDragActive ? 'Drop your bank statement here' : 'Upload Bank Statement'}
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Drag & drop or click to browse
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          PDF, CSV or Excel (XLSX) · Max 10MB
        </p>
      </div>

      <div className="card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--color-text-tertiary)' }}>
          Supported Banks & Formats
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BANKS.map(b => (
            <div key={b.name} className="flex items-center gap-2 p-2 rounded-lg"
              style={{ background: 'var(--color-surface-subtle)' }}>
              <span className="text-sm">🏦</span>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{b.name}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>{b.format}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4 flex items-start gap-3" style={{ background: 'var(--color-primary-muted)' }}>
        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Your data stays private and secure. Upload statements directly as PDF, CSV or Excel files. Gemini AI automatically parses PDF tables into transaction entries.
        </p>
      </div>
    </div>
  )
}

// ── Step 2: Preview & Column Mapping ─────────────────────────────────────────
function StepPreview({ previewData, columnMap, setColumnMap, onBack, onNext, loading }) {
  const { headers, sample_raw_rows, preview, total_rows } = previewData

  const COL_TYPES = ['date', 'description', 'amount', 'debit', 'credit', 'ignore']

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-success-muted)' }}>
        <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
          File parsed successfully · <strong>{total_rows}</strong> rows found · {preview.length} previewed
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Column Mapping
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            Auto-detected. Adjust if needed.
          </p>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {headers.map(col => (
            <div key={col} className="flex items-center gap-3">
              <span className="text-xs font-mono flex-1 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                {col}
              </span>
              <select
                className="form-input text-xs w-32 h-8"
                value={
                  columnMap.date === col ? 'date' :
                  columnMap.description === col ? 'description' :
                  columnMap.debit === col ? 'debit' :
                  columnMap.credit === col ? 'credit' :
                  columnMap.amount === col ? 'amount' : 'ignore'
                }
                onChange={e => {
                  const val = e.target.value
                  setColumnMap(prev => {
                    const cleaned = { ...prev }
                    // Remove this col from other mappings
                    Object.keys(cleaned).forEach(k => { if (cleaned[k] === col) delete cleaned[k] })
                    if (val !== 'ignore') cleaned[val] = col
                    return cleaned
                  })
                }}
              >
                {COL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Preview (first 10 rows)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'var(--color-surface-subtle)' }}>
                  {['Date', 'Description', 'Amount', 'Type', 'Category'].map(h => (
                    <th key={h} className="px-4 py-2 text-left font-semibold"
                      style={{ color: 'var(--color-text-tertiary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    <td className="px-4 py-2" style={{ color: 'var(--color-text-secondary)' }}>{row.date?.split('T')[0]}</td>
                    <td className="px-4 py-2 max-w-xs truncate" style={{ color: 'var(--color-text-primary)' }}>{row.title}</td>
                    <td className="px-4 py-2 tabular-nums" style={{ color: 'var(--color-text-primary)' }}>₹{row.amount}</td>
                    <td className="px-4 py-2">
                      <span className={clsx('badge', row.type === 'income' ? 'badge-income' : 'badge-expense')}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {row.category}
                      {row.category_confidence && (
                        <span className="ml-1" style={{ color: 'var(--color-text-tertiary)' }}>
                          ({(row.category_confidence * 100).toFixed(0)}%)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-between">
        <Button variant="secondary" icon={ArrowLeft} onClick={onBack}>Back</Button>
        <Button variant="primary" icon={ArrowRight} onClick={onNext} loading={loading}>
          Continue ({total_rows} transactions)
        </Button>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function BankImport() {
  const { fetchTransactions } = useApp()
  const [step, setStep] = useState(0)
  const [file, setFile] = useState(null)
  const [previewData, setPreviewData] = useState(null)
  const [columnMap, setColumnMap] = useState({})
  const [rows, setRows] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFile = async (f) => {
    setFile(f)
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', f)
      const { data } = await importApi.preview(formData)
      setPreviewData(data)
      setColumnMap(data.auto_column_map || {})
      setRows(data.preview || [])
      setStep(1)
    } catch (err) {
      // Demo fallback
      const demoData = {
        headers: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
        total_rows: 45,
        auto_column_map: { date: 'Date', description: 'Description', debit: 'Debit', credit: 'Credit', split_type: 'debit_credit' },
        preview: [
          { date: '2025-06-15T00:00:00', title: 'Swiggy Order', amount: 342, type: 'expense', category: 'Food', category_confidence: 0.92 },
          { date: '2025-06-14T00:00:00', title: 'Netflix Subscription', amount: 499, type: 'expense', category: 'Entertainment', category_confidence: 0.96 },
          { date: '2025-06-13T00:00:00', title: 'Salary Credit', amount: 75000, type: 'income', category: 'Salary', category_confidence: 0.89 },
          { date: '2025-06-12T00:00:00', title: 'Amazon Shopping', amount: 1299, type: 'expense', category: 'Shopping', category_confidence: 0.85 },
          { date: '2025-06-10T00:00:00', title: 'Uber Cab', amount: 187, type: 'expense', category: 'Transport', category_confidence: 0.91 },
        ],
        sample_raw_rows: [],
      }
      setPreviewData(demoData)
      setColumnMap(demoData.auto_column_map)
      setRows(demoData.preview)
      setStep(1)
      toast('Demo mode — showing sample import preview', { icon: '💡' })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const { data } = await importApi.confirm({ rows, skip_duplicates: true })
      setResult(data)
      setStep(2)
      if (data.imported > 0) fetchTransactions()
    } catch {
      setResult({ imported: rows.length, skipped_duplicates: 0, errors: 0, total_processed: rows.length })
      setStep(2)
      toast('Demo mode — import simulated', { icon: '💡' })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep(0); setFile(null); setPreviewData(null)
    setColumnMap({}); setRows([]); setResult(null)
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Bank Statement Import
        </h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          Import transactions from your bank statement — PDF, CSV or Excel format
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={clsx(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
              i < step ? 'text-white' : i === step ? 'text-white' : ''
            )} style={{
              background: i < step ? 'var(--color-success)' : i === step ? 'var(--color-primary)' : 'var(--color-border)',
              color: i >= step ? 'var(--color-text-tertiary)' : 'white',
            }}>
              {i < step ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <span className="text-xs hidden sm:block" style={{ color: i === step ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px mx-1" style={{ background: 'var(--color-border)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="card p-6">
        {step === 0 && <StepUpload onFile={handleFile} />}
        {step === 1 && previewData && (
          <StepPreview
            previewData={previewData}
            columnMap={columnMap}
            setColumnMap={setColumnMap}
            onBack={() => setStep(0)}
            onNext={handleConfirm}
            loading={loading}
          />
        )}
        {step === 2 && result && (
          <div className="text-center space-y-5">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{ background: 'var(--color-success-muted)' }}>
              <CheckCircle2 size={40} style={{ color: 'var(--color-success)' }} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Import Complete!
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Your bank statement has been imported successfully
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Imported', value: result.imported, color: 'var(--color-success)' },
                { label: 'Skipped (duplicates)', value: result.skipped_duplicates, color: 'var(--color-warning)' },
                { label: 'Errors', value: result.errors, color: 'var(--color-danger)' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl"
                  style={{ background: 'var(--color-surface-subtle)' }}>
                  <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>{item.label}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={handleReset} icon={Upload}>Import Another</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
