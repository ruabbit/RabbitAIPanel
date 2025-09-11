import React, { useState } from 'react'
import { ensureStripeCustomer, ensureStripeSubscription, ensureStripeSubscriptionByPlan } from '../../utils/api'

export default function StripeEnsure() {
  const [customerId, setCustomerId] = useState('1')
  const [planId, setPlanId] = useState('')
  const [priceId, setPriceId] = useState('')
  const [msg, setMsg] = useState('')
  const ensureCustomer = async () => { setMsg(''); try { const res = await ensureStripeCustomer({ customerId }); setMsg(`customer ok: ${res.stripe_customer_id || 'ok'}`) } catch(e){ setMsg(String(e)) } }
  const ensureSub = async () => { setMsg(''); try { const res = await ensureStripeSubscription({ customerId, planId: Number(planId), stripePriceId: priceId }); setMsg(`subscription: ${res.stripe_subscription_id}`) } catch(e){ setMsg(String(e)) } }
  const ensureByPlan = async () => { setMsg(''); try { const res = await ensureStripeSubscriptionByPlan({ customerId, planId: Number(planId) }); setMsg(`subscription(by plan): ${res.stripe_subscription_id}`) } catch(e){ setMsg(String(e)) } }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input className="border rounded px-3 py-2" value={customerId} onChange={e=>setCustomerId(e.target.value)} placeholder="customer_id" />
        <button onClick={ensureCustomer} className="border px-4 py-2 rounded">Ensure Customer</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input className="border rounded px-3 py-2" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id" />
        <input className="border rounded px-3 py-2" value={priceId} onChange={e=>setPriceId(e.target.value)} placeholder="stripe_price_id（可选）" />
        <button onClick={ensureSub} className="border px-4 py-2 rounded">Ensure Subscription</button>
        <button onClick={ensureByPlan} className="border px-4 py-2 rounded">Ensure by Plan</button>
      </div>
      {msg && <div className="text-sm text-gray-700">{msg}</div>}
    </div>
  )
}

