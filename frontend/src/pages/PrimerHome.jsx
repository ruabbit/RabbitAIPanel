import React from 'react'
import Hero from '../primer/Hero'
import Introduction from '../primer/Introduction'
import NavBarPrimer from '../primer/NavBarPrimer'
import Pricing from '../primer/Pricing'
import FooterPrim from '../primer/FooterPrim'

export default function PrimerHome() {
  return (
    <>
      <Hero />
      <Introduction />
      <NavBarPrimer />
      {/* Placeholder sections for anchors */}
      <section id="table-of-contents" className="py-20"><div className="mx-auto max-w-4xl px-4 text-slate-600">Table of contents placeholder…</div></section>
      <section id="screencasts" className="py-20"><div className="mx-auto max-w-4xl px-4 text-slate-600">Screencasts placeholder…</div></section>
      <section id="resources" className="py-20"><div className="mx-auto max-w-4xl px-4 text-slate-600">Resources placeholder…</div></section>
      <Pricing />
      <section id="author" className="py-20"><div className="mx-auto max-w-4xl px-4 text-slate-600">Author placeholder…</div></section>
      <FooterPrim />
    </>
  )
}

