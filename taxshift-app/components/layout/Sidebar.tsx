'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { mockAlerts } from '@/lib/mock-data'

const unreadCount = mockAlerts.filter((a) => !a.read).length

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/clientes',
    label: 'Clientes',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: '/documentos',
    label: 'Documentos',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    href: '/alertas',
    label: 'Alertas',
    badge: unreadCount,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
  {
    href: '/perfil',
    label: 'Perfil',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
]

interface SidebarProps {
  user?: {
    email?: string
    user_metadata?: {
      full_name?: string
      name?: string
      avatar_url?: string
    }
  } | null
  mobileOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ user, mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Usuário'

  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-56 bg-[#0d0e11] flex flex-col z-50 transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#c49a2a] flex items-center justify-center flex-shrink-0">
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15.5 5.75V12.25L9 16L2.5 12.25V5.75L9 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M9 7V11M7 9H11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">TaxShift</p>
            <p className="text-[#c49a2a] text-xs font-medium">PRO</p>
          </div>
          {/* Mobile close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="ml-auto lg:hidden text-white/50 hover:text-white transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto sidebar-scroll">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group
                  ${isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#c49a2a] rounded-r-full" />
                )}
                <span className={isActive ? 'text-[#c49a2a]' : 'text-white/40 group-hover:text-white/70 transition-colors'}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-[#dc2626] text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Admin link */}
        <div className="px-3 pb-2 border-t border-white/10 pt-2">
          <Link
            href="/admin"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
              ${pathname === '/admin'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Admin
          </Link>
        </div>

        {/* User info at bottom */}
        <div className="px-3 pb-4 border-t border-white/10 pt-3">
          <div className="flex items-center gap-2.5 mb-2 px-1">
            <div className="w-8 h-8 rounded-full bg-[#c49a2a] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{displayName}</p>
              <p className="text-white/40 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair da conta
          </button>
        </div>
      </aside>
    </>
  )
}
