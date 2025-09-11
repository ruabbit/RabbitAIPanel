import React from 'react'
import Container from './Container'
import SectionHeading from './SectionHeading'

const topics = [
  { t: 'Set up proxy', d: 'Local dev keys, social login, and API calls.' },
  { t: 'Plans & pricing', d: 'Daily limits vs usage plans, price rules.' },
  { t: 'Stripe sync', d: 'Ensure customer/subscription, push invoices.' },
  { t: 'Wallets & ledger', d: 'Top-ups, refunds, overdraft and audit trails.' },
]

export default function Screencasts() {
  return (
    <section id="screencasts" className="pt-16 pb-10 sm:pt-20 sm:pb-14 lg:pt-32 lg:pb-16">
      <Container>
        <SectionHeading number="02">Screencasts</SectionHeading>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {topics.map((v) => (
            <div key={v.t} className="rounded-2xl overflow-hidden border border-slate-200 bg-white">
              <div className="aspect-video bg-slate-100 grid place-items-center text-slate-400">Coming soon</div>
              <div className="p-5">
                <div className="font-semibold text-slate-900">{v.t}</div>
                <div className="mt-1 text-sm text-slate-600">{v.d}</div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

