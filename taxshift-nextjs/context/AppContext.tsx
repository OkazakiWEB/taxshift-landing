'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ModalType = 'login' | 'cadastro' | 'enterprise' | 'demo' | 'contato' | 'termos' | 'privacidade' | null
type BillingType = 'mensal' | 'anual'
type PlanType = 'free' | 'basico' | 'pro' | null

interface AppContextType {
  modal: ModalType
  selectedPlan: PlanType
  billing: BillingType
  toast: { msg: string; icon: string } | null
  openModal: (type: ModalType, plan?: PlanType) => void
  closeModal: () => void
  switchModal: (to: ModalType) => void
  setBilling: (type: BillingType) => void
  showToast: (msg: string, icon?: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalType>(null)
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(null)
  const [billing, setBillingState] = useState<BillingType>('mensal')
  const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null)

  const openModal = useCallback((type: ModalType, plan?: PlanType) => {
    if (plan) setSelectedPlan(plan)
    setModal(type)
    if (type) document.documentElement.classList.add('modal-open')
  }, [])

  const closeModal = useCallback(() => {
    setModal(null)
    setSelectedPlan(null)
    document.documentElement.classList.remove('modal-open')
  }, [])

  const switchModal = useCallback((to: ModalType) => {
    setModal(null)
    setTimeout(() => {
      setModal(to)
      if (to) document.documentElement.classList.add('modal-open')
      else document.documentElement.classList.remove('modal-open')
    }, 200)
  }, [])

  const setBilling = useCallback((type: BillingType) => {
    setBillingState(type)
  }, [])

  const showToast = useCallback((msg: string, icon = '✓') => {
    setToast({ msg, icon })
    setTimeout(() => setToast(null), 3500)
  }, [])

  return (
    <AppContext.Provider value={{ modal, selectedPlan, billing, toast, openModal, closeModal, switchModal, setBilling, showToast }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
