import React from 'react'

interface KPICardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: number
  subtitle?: string
  accentColor?: string
  className?: string
}

export default function KPICard({
  icon,
  label,
  value,
  trend,
  subtitle,
  accentColor,
  className = '',
}: KPICardProps) {
  const trendPositive = trend !== undefined && trend > 0
  const trendNegative = trend !== undefined && trend < 0

  return (
    <div
      className={`bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
          style={{ backgroundColor: accentColor ? `${accentColor}15` : '#f3f4f6' }}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trendPositive
                ? 'text-green-700 bg-green-50'
                : trendNegative
                ? 'text-red-700 bg-red-50'
                : 'text-[#6b7280] bg-[#f3f4f6]'
            }`}
          >
            {trendPositive ? '+' : ''}{trend}%
          </span>
        )}
      </div>

      <div className="space-y-0.5">
        <p className="text-[#6b7280] text-xs font-medium uppercase tracking-wide">{label}</p>
        <p
          className="text-2xl font-semibold font-mono tracking-tight"
          style={{ color: accentColor || '#0d0e11' }}
        >
          {value}
        </p>
        {subtitle && (
          <p className="text-[#9ca3af] text-xs">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
