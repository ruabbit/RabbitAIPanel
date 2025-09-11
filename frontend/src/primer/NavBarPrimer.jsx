import React, { useState } from 'react'

const sections = [
  { id: 'table-of-contents', title: 'Contents' },
  { id: 'screencasts', title: 'Screencasts' },
  { id: 'resources', title: 'Resources' },
  { id: 'pricing', title: 'Pricing' },
  { id: 'author', title: 'Author' },
]

export default function NavBarPrimer() {
  const [open, setOpen] = useState(false)
  return (
    <div className="sticky top-0 z-50">
      {/* Mobile */}
      <div className="sm:hidden relative flex items-center px-4 py-3 bg-white/95 shadow-sm [@supports(backdrop-filter:blur(0))]:bg-white/80 [@supports(backdrop-filter:blur(0))]:backdrop-blur-sm">
        <button className="ml-auto h-8 w-8 inline-flex items-center justify-center" aria-label="Toggle navigation menu" onClick={()=>setOpen(v=>!v)}>
          <svg aria-hidden="true" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="h-6 w-6 stroke-slate-700">
            <path d={open ? 'M17 7 7 17M7 7l10 10' : 'm15 16-3 3-3-3M15 8l-3-3-3 3'} />
          </svg>
        </button>
        {open && (
          <div className="absolute inset-x-0 top-full bg-white/95 py-3.5 shadow-sm [@supports(backdrop-filter:blur(0))]:bg-white/80 [@supports(backdrop-filter:blur(0))]:backdrop-blur-sm">
            {sections.map((s)=> (
              <a key={s.id} href={`#${s.id}`} className="flex items-center px-4 py-1.5" onClick={()=>setOpen(false)}>
                <span className="font-mono text-sm text-blue-600 mr-4">{String(sections.indexOf(s)+1).padStart(2,'0')}</span>
                <span className="text-base font-medium text-slate-900">{s.title}</span>
              </a>
            ))}
          </div>
        )}
      </div>
      {/* Desktop */}
      <div className="hidden sm:flex sm:h-32 sm:justify-center sm:border-b sm:border-slate-200 sm:bg-white/95 sm:[@supports(backdrop-filter:blur(0))]:bg-white/80 sm:[@supports(backdrop-filter:blur(0))]:backdrop-blur-sm">
        <ol role="list" className="mb-[-2px] grid auto-cols-[minmax(0,15rem)] grid-flow-col text-base font-medium text-slate-900 [counter-reset:section]">
          {sections.map((s, i) => (
            <li key={s.id} className="flex [counter-increment:section]">
              <a href={`#${s.id}`} className="flex w-full flex-col items-center justify-center border-b-2 before:mb-2 before:font-mono before:text-sm before:content-[counter(section,decimal-leading-zero)] border-transparent hover:bg-blue-50/40 before:text-slate-500 hover:before:text-slate-900">
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

