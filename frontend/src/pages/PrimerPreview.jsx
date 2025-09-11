import React from 'react'
import Container from '../primer/Container'
import Button from '../primer/Button'
import SectionHeading from '../primer/SectionHeading'
import GridPattern from '../primer/GridPattern'
import CheckIcon from '../primer/CheckIcon'
import StarRating from '../primer/StarRating'

export default function PrimerPreview() {
  return (
    <div className="py-12">
      <Container size="lg">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Primer Components Preview</h1>

        <SectionHeading number="01" className="mb-6">Section Heading</SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="space-x-3">
            <Button>Solid Slate</Button>
            <Button color="blue">Solid Blue</Button>
            <Button color="white">Solid White</Button>
          </div>
          <div className="space-x-3">
            <Button variant="outline">Outline Slate</Button>
            <Button variant="outline" color="blue">Outline Blue</Button>
          </div>
        </div>

        <div className="relative h-40 mb-10 rounded-xl bg-blue-50 overflow-hidden text-blue-600">
          <GridPattern x="50%" />
          <div className="absolute inset-0 flex items-center justify-center">GridPattern</div>
        </div>

        <div className="flex items-center gap-4 mb-10">
          <CheckIcon className="h-8 w-8 text-blue-600" />
          <StarRating />
        </div>

        <p className="text-slate-600">More components from the Primer template can be ported similarly (Resources, Screencasts, Testimonials, Author, etc.).</p>
      </Container>
    </div>
  )
}

