import React from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  subtitle?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon = '📭', title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-[#0d0e11] mb-1">{title}</h3>
      {subtitle && (
        <p className="text-sm text-[#6b7280] max-w-[280px] leading-relaxed mb-5">{subtitle}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
