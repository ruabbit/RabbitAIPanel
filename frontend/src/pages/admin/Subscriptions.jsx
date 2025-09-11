import React, { useState } from 'react'
import { createSubscription, listSubscriptions, getSubscription, getSubscriptionByStripe } from '../../utils/api'

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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input className="border rounded px-3 py-2" value={customerId} onChange={e=>setCustomerId(e.target.value)} placeholder="customer_id" />
        <input className="border rounded px-3 py-2" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id" />
        <input className="border rounded px-3 py-2" value={stripeSubId} onChange={e=>setStripeSubId(e.target.value)} placeholder="stripe_subscription_id 可选" />
        <button onClick={onCreate} className="bg-primary text-white px-4 py-2 rounded">创建订阅</button>
        <button onClick={onList} className="border px-4 py-2 rounded">加载订阅</button>
      </div>
      {subs && subs.length > 0 && (
        <div className="overflow-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100"><tr><th className="p-2 border">id</th><th className="p-2 border">customer_id</th><th className="p-2 border">plan_id</th><th className="p-2 border">status</th><th className="p-2 border">stripe_subscription_id</th></tr></thead>
            <tbody>
              {subs.map(s=> (
                <tr key={s.id} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border">{s.id}</td>
                  <td className="p-2 border">{s.customer_id}</td>
                  <td className="p-2 border">{s.plan_id}</td>
                  <td className="p-2 border">{s.status}</td>
                  <td className="p-2 border">{s.stripe_subscription_id || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input className="border rounded px-3 py-2" value={qId} onChange={e=>setQId(e.target.value)} placeholder="subscription_id" />
        <button onClick={onQuery} className="border px-4 py-2 rounded">查询</button>
        <input className="border rounded px-3 py-2" value={qStripe} onChange={e=>setQStripe(e.target.value)} placeholder="stripe_subscription_id" />
        <button onClick={onQueryStripe} className="border px-4 py-2 rounded">按 Stripe ID 查询</button>
      </div>
      {qRes && (<pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto">{JSON.stringify(qRes, null, 2)}</pre>)}
      {msg && <div className="text-sm text-gray-700">{msg}</div>}
    </div>
  )
}

