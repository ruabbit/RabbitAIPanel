import React, { createContext, useContext, useState, useMemo } from 'react'

const UIContext = createContext({ sidebarOpen: false, setSidebarOpen: () => {} })

export function UIProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const value = useMemo(()=>({ sidebarOpen, setSidebarOpen }), [sidebarOpen])
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() { return useContext(UIContext) }

