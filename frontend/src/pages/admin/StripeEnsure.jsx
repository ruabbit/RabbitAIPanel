import React, { useState } from 'react'
import { ensureStripeCustomer, ensureStripeSubscription, ensureStripeSubscriptionByPlan } from '../../utils/api'
import Container from '../../primer/Container'
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
      {/* 标题移除 */}
      <div className="mt-6 space-y-4">
        <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="rr-label" htmlFor="se-customer">customer_id</label>
            <input id="se-customer" className="rr-input" value={customerId} onChange={e=>setCustomerId(e.target.value)} placeholder="customer_id" />
          </div>
          <div className="flex items-end">
            <Button onClick={ensureCustomer} variant="outline" color="blue" className="w-full">Ensure Customer</Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="rr-label" htmlFor="se-plan">plan_id</label>
            <input id="se-plan" className="rr-input" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id" />
          </div>
          <div>
            <label className="rr-label" htmlFor="se-price">stripe_price_id（可选）</label>
            <input id="se-price" className="rr-input" value={priceId} onChange={e=>setPriceId(e.target.value)} placeholder="price_xxx（可选）" />
          </div>
          <div className="flex items-end">
            <Button onClick={ensureSub} variant="outline" color="blue" className="w-full">Ensure Subscription</Button>
          </div>
          <div className="flex items-end">
            <Button onClick={ensureByPlan} variant="outline" color="blue" className="w-full">Ensure by Plan</Button>
          </div>
        </div>
        {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
        </Card>
      </div>
    </Container>
  )
}
// 弃用说明：
// 本页面属于旧版“Stripe Ensure”入口，已由新版计划详情页的 Danger 选项卡整合（/admin/plans/:planId）。
// 该文件仅在过渡期间保留以便回退，请优先在新版页面操作。
