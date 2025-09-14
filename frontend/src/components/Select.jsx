import React, { useEffect, useRef, useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'

export default function Select({ id, value, onChange, options = [], placeholder = '请选择', className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const normalized = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o))
  const current = normalized.find(o => String(o.value) === String(value))

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div className={className} ref={ref}>
      <div className="relative">
        <button
          id={id}
          type="button"
          className="rr-input text-left pr-8"
          onClick={() => setOpen(o => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {current ? current.label : <span className="text-gray-400">{placeholder}</span>}
        </button>
        <FiChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />

        {open && (
          <ul
            role="listbox"
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 sm:text-sm"
          >
            {normalized.map((opt, idx) => (
              <li
                role="option"
                aria-selected={String(opt.value) === String(value)}
                key={idx}
                className={(String(opt.value) === String(value) ? 'bg-sky-50 text-sky-700 ' : 'text-gray-900 ') + 'cursor-pointer px-3 py-2 hover:bg-sky-100'}
                onClick={() => { onChange?.(opt.value); setOpen(false) }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

