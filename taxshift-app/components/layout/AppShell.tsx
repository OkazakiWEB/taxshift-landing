'use client'

import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface AppShellProps {
  children: React.ReactNode
  user?: {
    id?: string
    email?: string
    user_metadata?: {
      full_name?: string
      name?: string
      avatar_url?: string
    }
  } | null
}

export default function AppShell({ children, user }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#fafaf8] flex">
      {/* Sidebar */}
      <Sidebar
        user={user}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-56">
        {/* Header */}
        <Header
          onMenuToggle={() => setSidebarOpen(true)}
          user={user}
        />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1400px] mx-auto p-5 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
