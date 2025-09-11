import React from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout({ children }) {
  const location = useLocation()
  const hideChrome = location.pathname === '/' || location.pathname.startsWith('/primer')
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {!hideChrome && <Navbar />}
      <main className="flex-1 min-h-0">
        {children}
      </main>
      {!hideChrome && <Footer />}
    </div>
  )
}
