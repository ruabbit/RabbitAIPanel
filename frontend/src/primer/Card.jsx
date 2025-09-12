import React from 'react'

export default function Card({ title, actions, className = '', children }) {
  return (
    <div className={`bg-white rounded-3xl ring-1 ring-slate-200 shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          {title && <div className="text-sm font-semibold text-slate-900">{title}</div>}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}

