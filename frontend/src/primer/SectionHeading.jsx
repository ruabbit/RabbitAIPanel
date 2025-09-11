import React from 'react'

export default function SectionHeading({ number = '01', children, className = '', ...props }) {
  return (
    <h2
      className={`inline-flex items-center rounded-full px-4 py-1 text-blue-600 ring-1 ring-blue-600 ring-inset ${className}`}
      {...props}
    >
      <span className="font-mono text-sm" aria-hidden="true">
        {String(number).padStart(2, '0')}
      </span>
      <span className="ml-3 h-3.5 w-px bg-blue-600/20" />
      <span className="ml-3 text-base font-medium tracking-tight">{children}</span>
    </h2>
  )
}

