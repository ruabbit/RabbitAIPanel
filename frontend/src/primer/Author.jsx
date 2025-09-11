import React from 'react'
import Container from './Container'
import SectionHeading from './SectionHeading'

export default function Author() {
  return (
    <section id="author" className="pt-16 pb-10 sm:pt-20 sm:pb-14 lg:pt-32 lg:pb-16">
      <Container>
        <SectionHeading number="05">Author</SectionHeading>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 items-start">
          <div className="rounded-3xl bg-blue-50 aspect-square" />
          <div>
            <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">Rabbit Panel Team</h3>
            <p className="mt-3 text-slate-600">
              We build an opinionated billing layer for AI workloads — proxy, metering, and pricing in one place. Our goal is to ship reliable infrastructure that product teams can adopt in hours, not weeks.
            </p>
            <div className="mt-5 flex gap-3 text-sm">
              <a className="text-blue-600 hover:text-blue-800" href="/dashboard">User Console →</a>
              <a className="text-slate-700 hover:text-slate-900" href="/admin">Admin Console →</a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

