import React, { useState } from 'react'
import { createSubscription, listSubscriptions, getSubscription, getSubscriptionByStripe } from '../../utils/api'
import Container from '../../primer/Container'
import Button from '../../primer/Button'
import Card from '../../primer/Card'

export default function Subscriptions() {
  const [customerId, setCustomerId] = useState('1')
  const [planId, setPlanId] = useState('')
  const [stripeSubId, setStripeSubId] = useState('')
  const [subs, setSubs] = useState([])
  const [qId, setQId] = useState('')
  const [qStripe, setQStripe] = useState('')
  const [qRes, setQRes] = useState(null)
  const [msg, setMsg] = useState('')

  const onCreate = async () => {
    setMsg('')
    try { await createSubscription({ customerId: Number(customerId), planId: Number(planId), stripeSubscriptionId: stripeSubId || undefined }); setMsg('订阅已创建') } catch (e) { setMsg(String(e)) }
  }
  const onList = async () => {
    setMsg('')
    try { const res = await listSubscriptions({ customerId }); setSubs(res.subscriptions || []) } catch (e) { setMsg(String(e)) }
  }
  const onQuery = async () => { setMsg(''); try { const res = await getSubscription(Number(qId)); setQRes(res.subscription || null) } catch (e) { setMsg(String(e)) } }
  const onQueryStripe = async () => { setMsg(''); try { const res = await getSubscriptionByStripe(qStripe); setQRes(res.subscription || null) } catch (e) { setMsg(String(e)) } }

  return (
    <Container size="lg">
      {/* 标题移除 */}
      <div className="mt-6 space-y-4">
        <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="rr-label" htmlFor="sub-customer-id">customer_id</label>
            <input id="sub-customer-id" className="rr-input" value={customerId} onChange={e=>setCustomerId(e.target.value)} placeholder="customer_id" />
          </div>
          <div>
            <label className="rr-label" htmlFor="sub-plan-id">plan_id</label>
            <input id="sub-plan-id" className="rr-input" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id" />
          </div>
          <div>
            <label className="rr-label" htmlFor="sub-stripe-id">stripe_subscription_id（可选）</label>
            <input id="sub-stripe-id" className="rr-input" value={stripeSubId} onChange={e=>setStripeSubId(e.target.value)} placeholder="price_xxx" />
          </div>
          <div className="flex items-end">
            <Button onClick={onCreate} color="blue" className="w-full">创建订阅</Button>
          </div>
          <div className="flex items-end">
            <Button onClick={onList} variant="outline" color="blue" className="w-full">加载订阅</Button>
          </div>
        </div>
        {subs && subs.length > 0 && (
          <div className="rr-table-flow">
            <div className="rr-table-scroll">
              <div className="rr-table-inner">
                <table className="rr-table">
                  <thead>
                    <tr>
                      <th scope="col">id</th>
                      <th scope="col">customer_id</th>
                      <th scope="col">plan_id</th>
                      <th scope="col">status</th>
                      <th scope="col">stripe_subscription_id</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map(s=> (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td>{s.customer_id}</td>
                        <td>{s.plan_id}</td>
                        <td>{s.status}</td>
                        <td>{s.stripe_subscription_id || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="rr-label" htmlFor="sub-query-id">subscription_id</label>
            <input id="sub-query-id" className="rr-input" value={qId} onChange={e=>setQId(e.target.value)} placeholder="subscription_id" />
          </div>
          <div className="flex items-end">
            <Button onClick={onQuery} variant="outline" color="blue" className="w-full">查询</Button>
          </div>
          <div>
            <label className="rr-label" htmlFor="sub-query-stripe">stripe_subscription_id</label>
            <input id="sub-query-stripe" className="rr-input" value={qStripe} onChange={e=>setQStripe(e.target.value)} placeholder="stripe_subscription_id" />
          </div>
          <div className="flex items-end">
            <Button onClick={onQueryStripe} variant="outline" color="blue" className="w-full">按 Stripe ID 查询</Button>
          </div>
        </div>
        {qRes && (<pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto">{JSON.stringify(qRes, null, 2)}</pre>)}
        {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
        </Card>
      </div>
    </Container>
  )
}
// 弃用说明：
// 本页面为旧版“订阅”入口，已由新版订阅列表/详情页替代：
// - 列表：/admin/subscriptions
// - 详情：/admin/subscriptions/:subscriptionId
// 保留以便过渡，建议优先在新版页面管理订阅。
