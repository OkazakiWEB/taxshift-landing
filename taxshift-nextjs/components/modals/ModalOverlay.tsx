'use client'
import { useEffect, ReactNode } from 'react'
import { useApp } from '@/context/AppContext'

interface ModalOverlayProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: string
  fullMobile?: boolean
}

export default function ModalOverlay({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-lg',
  fullMobile = false,
}: ModalOverlayProps) {
  const { closeModal } = useApp()

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-[800] flex items-end sm:items-center justify-center transition-all duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Box */}
      <div
        className={`relative z-10 bg-white shadow-2xl overflow-hidden transition-all duration-300 w-full ${maxWidth} ${
          fullMobile
            ? 'rounded-none sm:rounded-2xl h-full sm:h-auto sm:max-h-[90vh]'
            : 'rounded-t-2xl sm:rounded-2xl max-h-[90vh]'
        } ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >
        <div className="overflow-y-auto max-h-[90vh] custom-scroll">
          {children}
        </div>
      </div>
    </div>
  )
}
