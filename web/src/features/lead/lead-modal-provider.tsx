'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { LeadModal } from './lead-modal'

const LEAD_MODAL_KEY = 'nexsift-lead-modal-shown'
const LEAD_MODAL_DELAY_MS = 8000

interface LeadModalContextValue {
  open: boolean
  openLeadModal: () => void
  closeLeadModal: () => void
}

const LeadModalContext = createContext<LeadModalContextValue | null>(null)

export function LeadModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const firstCheckDone = useRef(false)

  const openLeadModal = useCallback(() => {
    setOpen(true)
  }, [])

  const closeLeadModal = useCallback(() => {
    setOpen(false)
    localStorage.setItem(LEAD_MODAL_KEY, '1')
  }, [])

  useEffect(() => {
    if (firstCheckDone.current) {
      return
    }

    firstCheckDone.current = true

    if (localStorage.getItem(LEAD_MODAL_KEY)) {
      return
    }

    const timeoutId = setTimeout(() => {
      localStorage.setItem(LEAD_MODAL_KEY, '1')
      setOpen(true)
    }, LEAD_MODAL_DELAY_MS)

    return () => clearTimeout(timeoutId)
  }, [])

  const value = useMemo(
    () => ({ open, openLeadModal, closeLeadModal }),
    [open, openLeadModal, closeLeadModal],
  )

  return (
    <LeadModalContext.Provider value={value}>
      {children}
      <LeadModal key={open ? 'open' : 'closed'} />
    </LeadModalContext.Provider>
  )
}

export function useLeadModal() {
  const context = useContext(LeadModalContext)

  if (!context) {
    throw new Error('useLeadModal must be used within LeadModalProvider')
  }

  return context
}