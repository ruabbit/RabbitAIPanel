import React from 'react'
import Container from './Container'
import SectionHeading from './SectionHeading'
import { FiZap, FiTrendingDown, FiActivity, FiCreditCard, FiDatabase } from 'react-icons/fi'

const cards = [
  { icon: FiZap, title: 'Proxy & Protocols', desc: 'Compatible with OpenAI/Anthropic style Chat Completions and streaming.' },
  { icon: FiDatabase, title: 'Usage Metering', desc: 'Token/Request/Image/Minute units with multipliers and min-charge.' },
  { icon: FiCreditCard, title: 'Billing & Stripe', desc: 'Price mappings, invoices, subscriptions, and Stripe sync.' },
  { icon: FiTrendingDown, title: 'Cost Controls', desc: 'Daily limits, overflow policies (block/grace/degrade) and thresholds.' },
  { icon: FiActivity, title: 'Reliability', desc: 'Idempotent events, retries, and transparent ledger/wallets.' },
]

export default function Resources() {
  return (
    <section id="resources" className="pt-16 pb-10 sm:pt-20 sm:pb-14 lg:pt-32 lg:pb-16">
      <Container>
        <SectionHeading number="03">Resources</SectionHeading>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c) => (
            <div key={c.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-blue-600 text-2xl">
                {React.createElement(c.icon, { className: 'h-7 w-7' })}
              </div>
              <div className="mt-3 font-semibold text-slate-900">{c.title}</div>
              <div className="mt-2 text-slate-600 text-sm">{c.desc}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

