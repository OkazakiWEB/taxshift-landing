'use client'
import { useApp } from '@/context/AppContext'

export default function Toast() {
  const { toast } = useApp()

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] transition-all duration-300 ${
        toast ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      {toast && (
        <div className="flex items-center gap-3 bg-ink text-white px-5 py-3.5 rounded-xl shadow-2xl max-w-sm">
          <span className="text-lg leading-none">{toast.icon}</span>
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}
    </div>
  )
}
