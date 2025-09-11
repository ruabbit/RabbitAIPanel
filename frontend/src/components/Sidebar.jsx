import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Sidebar({ items = [], title = '', open = false, onClose = () => {} }) {
  const location = useLocation()
  const Nav = (
    <aside className="w-64 bg-white border-r h-full">
      {title && <div className="px-4 py-3 font-semibold text-gray-700 border-b">{title}</div>}
      <nav className="p-2 space-y-1">
        {items.map((it, idx) => (
          <Link
            key={idx}
            to={it.to}
            onClick={onClose}
            className={`block px-3 py-2 rounded text-sm ${location.pathname === it.to ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            {it.label}
          </Link>
        ))}
      </nav>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar: toggle visibility using `open` */}
      {open && <div className="hidden md:block h-full">{Nav}</div>}
      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-lg">
            {Nav}
          </div>
        </div>
      )}
    </>
  )
}
