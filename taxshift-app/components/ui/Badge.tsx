import React from 'react'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default' | 'gold'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  dot?: boolean
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  default: 'bg-[#f3f4f6] text-[#6b7280] border-[#e5e7eb]',
  gold: 'bg-[#fefce8] text-[#c49a2a] border-[#c49a2a]/30',
}

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  default: 'bg-[#9ca3af]',
  gold: 'bg-[#c49a2a]',
}

export default function Badge({ variant = 'default', children, dot = false, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  )
}
