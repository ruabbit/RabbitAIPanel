import React from 'react'
import Container from './Container'
import SectionHeading from './SectionHeading'

export default function TableOfContents() {
  const items = [
    { num: '01', title: 'Overview', desc: 'What Rabbit Panel solves and how it fits your stack.' },
    { num: '02', title: 'Screencasts', desc: 'Short demos: proxy, metering, plans, invoices.' },
    { num: '03', title: 'Resources', desc: 'APIs, SDKs, and integration snippets.' },
    { num: '04', title: 'Pricing', desc: 'Simple plan model with flexible rules.' },
    { num: '05', title: 'Author', desc: 'Team and roadmap.' },
  ]
  return (
    <section id="table-of-contents" className="pt-16 pb-10 sm:pt-20 sm:pb-14 lg:pt-28 lg:pb-16">
      <Container>
        <SectionHeading number="01">Table of contents</SectionHeading>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it) => (
            <a key={it.num} href={`#${it.title.toLowerCase()}`} className="group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow">
              <div className="inline-flex items-center rounded-full px-3 py-1 text-blue-600 ring-1 ring-blue-600/20 ring-inset">
                <span className="font-mono text-sm">{it.num}</span>
                <span className="ml-3 h-3.5 w-px bg-blue-600/20" />
                <span className="ml-3 text-base font-medium tracking-tight group-hover:text-blue-700">{it.title}</span>
              </div>
              <p className="mt-3 text-slate-600">{it.desc}</p>
            </a>
          ))}
        </div>
      </Container>
    </section>
  )
}

