import React from 'react'
import Container from './Container'
import Button from './Button'
import GridPattern from './GridPattern'

export default function FreeChapters() {
  return (
    <section id="free-chapters" className="py-20">
      <div className="relative">
        <div className="absolute inset-0 mask-[linear-gradient(white,transparent)] text-blue-600/10">
          <GridPattern x="50%" />
        </div>
        <Container className="relative">
          <div className="rounded-3xl bg-white/80 backdrop-blur supports-[backdrop-filter:blur(0)]:bg-white/70 p-8 ring-1 ring-slate-200">
            <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">Try it now</h3>
            <p className="mt-2 text-slate-600">Start with the user console or explore the admin surface. No external keys needed in local dev.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/dashboard" color="blue">Open User Console</Button>
              <Button href="/admin" variant="outline" color="blue">Open Admin Console</Button>
            </div>
          </div>
        </Container>
      </div>
    </section>
  )
}

