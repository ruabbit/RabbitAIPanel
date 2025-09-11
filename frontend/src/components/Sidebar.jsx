import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Sidebar({ items = [], title = '' }) {
  const location = useLocation()
  return (
    <aside className="w-64 bg-white border-r h-full">
      {title && <div className="px-4 py-3 font-semibold text-gray-700 border-b">{title}</div>}
      <nav className="p-2 space-y-1">
        {items.map((it, idx) => (
          <Link
            key={idx}
            to={it.to}
            className={`block px-3 py-2 rounded text-sm ${location.pathname === it.to ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            {it.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

