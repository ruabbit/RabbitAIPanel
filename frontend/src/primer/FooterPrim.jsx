import React from 'react'
import GridPattern from './GridPattern'

export default function FooterPrim() {
  return (
    <footer className="relative pt-5 pb-20 sm:pt-14 sm:pb-32">
      <div className="absolute inset-x-0 top-0 h-32 [mask:linear-gradient(white,transparent)] text-slate-900/10">
        <GridPattern x="50%" />
      </div>
      <div className="relative text-center text-sm text-slate-600">
        <p>Copyright &copy; {new Date().getFullYear()} RabbitRelay</p>
        <p>All rights reserved.</p>
      </div>
    </footer>
  )
}
