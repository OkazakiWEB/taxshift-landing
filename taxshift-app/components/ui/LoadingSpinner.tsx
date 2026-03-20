import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
}

export default function LoadingSpinner({
  size = 'md',
  color = '#0d0e11',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div
      className={`${sizes[size]} rounded-full animate-spin ${className}`}
      style={{
        borderColor: `${color}30`,
        borderTopColor: color,
      }}
    />
  )
}
