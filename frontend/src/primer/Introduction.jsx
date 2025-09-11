import React from 'react'
import CheckIcon from './CheckIcon'
import Container from './Container'

export default function Introduction() {
  return (
    <section id="introduction" aria-label="Introduction" className="pt-20 pb-16 sm:pb-20 md:pt-36 lg:py-32">
      <Container className="text-lg tracking-tight text-slate-700">
        <p className="font-display text-4xl font-bold tracking-tight text-slate-900">
          “Everything Starts as a Square” is a book and video course that teaches you a simple method to designing icons that anyone can learn.
        </p>
        <p className="mt-4">
          Before I learned how to design icons myself, I always imagined that they were drawn by hand using the pen tool.
        </p>
        <p className="mt-4">But it turns out this isn’t how great icon designers work at all.</p>
        <p className="mt-4">You’ll learn the systems experts use to create pixel perfect icons, without relying on a steady hand.</p>
        <ul role="list" className="mt-8 space-y-3">
          {[
            'Using boolean operations to combine basic shapes into complex icons',
            'How to adapt icons to different sizes',
            'Translating icons from an outline style to a solid style',
            'Identifying the characteristics that make an icon set cohesive',
            'Figma features and keyboard shortcuts to speed up your workflow',
          ].map((feature) => (
            <li key={feature} className="flex">
              <CheckIcon className="h-8 w-8 flex-none text-blue-500" />
              <span className="ml-4">{feature}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

