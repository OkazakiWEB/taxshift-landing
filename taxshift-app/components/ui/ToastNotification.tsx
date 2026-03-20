'use client'

import React, { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastNotificationProps {
  message: string
  type: ToastType
  onDismiss: () => void
  duration?: number
}

export default function ToastNotification({
  message,
  type,
  onDismiss,
  duration = 3500,
}: ToastNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [onDismiss, duration])

  const styles: Record<ToastType, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
    success: {
      bg: '#f0fdf4',
      border: '#bbf7d0',
      text: '#16a34a',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    error: {
      bg: '#fef2f2',
      border: '#fecaca',
      text: '#dc2626',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
    info: {
      bg: '#eff6ff',
      border: '#bfdbfe',
      text: '#2563eb',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
  }

  const s = styles[type]

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        backgroundColor: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        maxWidth: '360px',
        animation: 'slideInToast 0.25s ease',
      }}
    >
      <span style={{ flexShrink: 0 }}>{s.icon}</span>
      <p style={{ fontSize: '14px', fontWeight: 500, color: s.text, margin: 0 }}>{message}</p>
      <button
        onClick={onDismiss}
        style={{
          marginLeft: 'auto',
          flexShrink: 0,
          color: s.text,
          opacity: 0.6,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          lineHeight: 1,
        }}
        aria-label="Fechar"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <style>{`
        @keyframes slideInToast {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
