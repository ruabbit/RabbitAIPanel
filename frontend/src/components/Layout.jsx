import React from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout({ children }) {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 min-h-0">
        {children}
      </main>
      <Footer />
    </div>
  )
}
