import React from 'react'
import Hero from '../primer/Hero'
import Introduction from '../primer/Introduction'
import NavBarPrimer from '../primer/NavBarPrimer'
import TableOfContents from '../primer/TableOfContents'
import Screencasts from '../primer/Screencasts'
import Resources from '../primer/Resources'
import Pricing from '../primer/Pricing'
import Testimonials from '../primer/Testimonials'
import Author from '../primer/Author'
import FreeChapters from '../primer/FreeChapters'
import FooterPrim from '../primer/FooterPrim'

export default function PrimerHome() {
  return (
    <>
      <Hero />
      <NavBarPrimer />
      <Introduction />
      <TableOfContents />
      <Screencasts />
      <Resources />
      <Pricing />
      <Testimonials />
      <Author />
      <FreeChapters />
      <FooterPrim />
    </>
  )
}
