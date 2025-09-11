import React from 'react'
import Container from './Container'
import Testimonial from './Testimonial'

const items = [
  { name: 'Platform Lead, SaaS', role: 'Fintech', q: 'Rabbit Panel let us centralize AI spend and ship usage-based pricing in a week.' },
  { name: 'CTO', role: 'GenAI Startup', q: 'Switching providers without touching product code saved us weeks every quarter.' },
]

export default function Testimonials() {
  return (
    <section className="pt-16 pb-10 sm:pt-20 sm:pb-14 lg:pt-32 lg:pb-16">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {items.map((t, i) => (
            <Testimonial key={i} author={{ name: t.name, role: t.role }}>
              <p>“{t.q}”</p>
            </Testimonial>
          ))}
        </div>
      </Container>
    </section>
  )
}

