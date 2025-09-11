import React, { createContext, useContext, useState, useMemo } from 'react'

const UIContext = createContext({ sidebarOpen: false, setSidebarOpen: () => {} })

export function UIProvider({ children }) {
  const getInitialSidebarOpen = () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(min-width: 768px)').matches
    }
    return true
  }
  const [sidebarOpen, setSidebarOpen] = useState(getInitialSidebarOpen)
  const value = useMemo(()=>({ sidebarOpen, setSidebarOpen }), [sidebarOpen])
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() { return useContext(UIContext) }
