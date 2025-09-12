import React, { useState } from 'react'
import { ensureStripeCustomer, ensureStripeSubscription, ensureStripeSubscriptionByPlan } from '../../utils/api'
import Container from '../../primer/Container'
import SectionHeading from '../../primer/SectionHeading'
import Button from '../../primer/Button'
import Card from '../../primer/Card'

export default function StripeEnsure() {
  const [customerId, setCustomerId] = useState('1')
  const [planId, setPlanId] = useState('')
  const [priceId, setPriceId] = useState('')
  const [msg, setMsg] = useState('')
  const ensureCustomer = async () => { setMsg(''); try { const res = await ensureStripeCustomer({ customerId }); setMsg(`customer ok: ${res.stripe_customer_id || 'ok'}`) } catch(e){ setMsg(String(e)) } }
  const ensureSub = async () => { setMsg(''); try { const res = await ensureStripeSubscription({ customerId, planId: Number(planId), stripePriceId: priceId }); setMsg(`subscription: ${res.stripe_subscription_id}`) } catch(e){ setMsg(String(e)) } }
  const ensureByPlan = async () => { setMsg(''); try { const res = await ensureStripeSubscriptionByPlan({ customerId, planId: Number(planId) }); setMsg(`subscription(by plan): ${res.stripe_subscription_id}`) } catch(e){ setMsg(String(e)) } }
  return (
    <Container size="lg">
      <SectionHeading number="B4">Stripe Ensure</SectionHeading>
      <div className="mt-6 space-y-4">
        <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input className="border rounded px-3 py-2" value={customerId} onChange={e=>setCustomerId(e.target.value)} placeholder="customer_id" />
          <Button onClick={ensureCustomer} variant="outline" color="blue">Ensure Customer</Button>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <input className="border rounded px-3 py-2" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id" />
          <input className="border rounded px-3 py-2" value={priceId} onChange={e=>setPriceId(e.target.value)} placeholder="stripe_price_id（可选）" />
          <Button onClick={ensureSub} variant="outline" color="blue">Ensure Subscription</Button>
          <Button onClick={ensureByPlan} variant="outline" color="blue">Ensure by Plan</Button>
        </div>
        {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
        </Card>
      </div>
    </Container>
  )
}
