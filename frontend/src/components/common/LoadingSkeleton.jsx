// src/components/common/LoadingSkeleton.jsx
import clsx from 'clsx'

export function Skeleton({ className = '', style = {} }) {
  return <div className={clsx('skeleton', className)} style={style} />
}

export function CardSkeleton({ rows = 3 }) {
  return (
    <div className="card p-6 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function ChartSkeleton({ height = 280 }) {
  return (
    <div className="card p-6">
      <Skeleton className="h-4 w-40 mb-6" />
      <Skeleton style={{ height: `${height}px` }} className="rounded-xl" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <Skeleton className="h-3.5" style={{ width: j === 0 ? '60%' : j === cols - 1 ? '40%' : '70%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
