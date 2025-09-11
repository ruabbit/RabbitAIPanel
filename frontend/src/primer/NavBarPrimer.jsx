import React, { useEffect, useRef, useState } from 'react'

const sections = [
  { id: 'table-of-contents', title: 'Contents' },
  { id: 'screencasts', title: 'Screencasts' },
  { id: 'resources', title: 'Resources' },
  { id: 'pricing', title: 'Pricing' },
  { id: 'author', title: 'Author' },
]

export default function NavBarPrimer() {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const navRef = useRef(null)

  useEffect(() => {
    const ids = sections.map((s) => s.id)
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el) => el != null)

    function onScroll() {
      if (!navRef.current) return
      const barH = navRef.current.offsetHeight || 0
      const fromTop = window.scrollY + barH + 1
      let idx = 0
      for (let i = 0; i < els.length; i++) {
        const rectTop = els[i].getBoundingClientRect().top + window.scrollY
        if (fromTop >= rectTop) idx = i
      }
      setActiveIndex(idx)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const current = sections[activeIndex] || sections[0]

  return (
    <div ref={navRef} className="fixed inset-x-0 top-0 z-50">
      {/* Mobile */}
      <div className="sm:hidden relative flex items-center px-4 py-3 bg-white/95 shadow-sm [@supports(backdrop-filter:blur(0))]:bg-white/80 [@supports(backdrop-filter:blur(0))]:backdrop-blur-sm">
        <span aria-hidden className="font-mono text-sm text-blue-600">
          {String(activeIndex + 1).padStart(2, '0')}
        </span>
        <span className="ml-4 text-base font-medium text-slate-900">{current.title}</span>
        <button className="ml-auto h-8 w-8 inline-flex items-center justify-center" aria-label="Toggle navigation menu" onClick={() => setOpen((v) => !v)}>
          <svg aria-hidden="true" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="h-6 w-6 stroke-slate-700">
            <path d={open ? 'M17 7 7 17M7 7l10 10' : 'm15 16-3 3-3-3M15 8l-3-3-3 3'} />
          </svg>
        </button>
        {open && (
          <div className="absolute inset-x-0 top-full bg-white/95 py-3.5 shadow-sm [@supports(backdrop-filter:blur(0))]:bg-white/80 [@supports(backdrop-filter:blur(0))]:backdrop-blur-sm">
            {sections.map((s, i) => (
              <a key={s.id} href={`#${s.id}`} className="flex items-center px-4 py-1.5" onClick={() => setOpen(false)}>
                <span className={`font-mono text-sm mr-4 ${i === activeIndex ? 'text-blue-700' : 'text-blue-600'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
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
              <a
                href={`#${s.id}`}
                className={
                  'flex w-full flex-col items-center justify-center border-b-2 before:mb-2 before:font-mono before:text-sm before:content-[counter(section,decimal-leading-zero)] ' +
                  (i === activeIndex
                    ? 'border-blue-600 bg-blue-50 text-blue-600 before:text-blue-600'
                    : 'border-transparent before:text-slate-500 hover:bg-blue-50/40 hover:before:text-slate-900')
                }
              >
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
