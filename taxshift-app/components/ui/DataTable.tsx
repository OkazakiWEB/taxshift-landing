import React from 'react'

interface Column {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps {
  columns: Column[]
  rows: React.ReactNode[][]
  loading?: boolean
  emptyState?: React.ReactNode
  className?: string
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 rounded" style={{ width: i === 0 ? '80%' : i === cols - 1 ? '60%' : '70%' }} />
        </td>
      ))}
    </tr>
  )
}

export default function DataTable({
  columns,
  rows,
  loading = false,
  emptyState,
  className = '',
}: DataTableProps) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-[#e5e7eb] bg-white ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e5e7eb] bg-[#fafaf8]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide whitespace-nowrap ${
                  col.width ? `w-[${col.width}]` : ''
                } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f3f4f6]">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} cols={columns.length} />
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                {emptyState || (
                  <div className="text-[#9ca3af] text-sm">Nenhum registro encontrado</div>
                )}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-[#fafaf8] transition-colors group"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`px-4 py-3 text-sm text-[#23252c] ${
                      columns[cellIndex]?.align === 'right'
                        ? 'text-right'
                        : columns[cellIndex]?.align === 'center'
                        ? 'text-center'
                        : ''
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
