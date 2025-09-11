import React from 'react'

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Button({
  variant = 'solid',
  color = 'slate',
  className = '',
  href,
  children,
  ...props
}) {
  const base =
    variant === 'outline'
      ? 'inline-flex justify-center rounded-md border py-[calc(theme(spacing.1)-1px)] px-[calc(theme(spacing.4)-1px)] text-base font-semibold tracking-tight'
      : 'inline-flex justify-center rounded-md py-1 px-4 text-base font-semibold tracking-tight shadow-sm'

  const variants = {
    solid: {
      slate:
        'bg-slate-900 text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 active:bg-slate-700 active:text-white/80 disabled:opacity-30',
      blue:
        'bg-blue-600 text-white hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-blue-700 active:text-white/80 disabled:opacity-30',
      white:
        'bg-white text-blue-600 hover:text-blue-700 focus-visible:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:bg-blue-50 active:text-blue-900/80 disabled:opacity-40',
    },
    outline: {
      slate:
        'border-slate-200 text-slate-900 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 active:border-slate-200 active:bg-slate-50 active:text-slate-900/70 disabled:opacity-40',
      blue:
        'border-blue-300 text-blue-600 hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:text-blue-600/70 disabled:opacity-40',
    },
  }

  const colorClass =
    variant === 'outline' ? variants.outline[color] : variants.solid[color]

  const cls = cx(base, colorClass, className)

  if (href) {
    return (
      <a href={href} className={cls} {...props}>
        {children}
      </a>
    )
  }
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  )
}

