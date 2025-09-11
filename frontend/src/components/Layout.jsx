import React from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout({ children }) {
  const location = useLocation()
  const p = location.pathname
  const hideChrome = p === '/' || p.startsWith('/primer') || p.startsWith('/dashboard') || p.startsWith('/admin')
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {!hideChrome && <Navbar />}
      <main className="flex-1 min-h-0 overflow-visible">
        {children}
      </main>
      {!hideChrome && <Footer />}
    </div>
  )
}
