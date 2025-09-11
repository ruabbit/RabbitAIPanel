import React, { useState } from 'react'
import { createCustomer } from '../../utils/api'

export default function Customers() {
  const [entityType, setEntityType] = useState('user')
  const [entityId, setEntityId] = useState('1')
  const [stripeId, setStripeId] = useState('')
  const [msg, setMsg] = useState('')
  const onCreate = async () => {
    setMsg('')
    try { const res = await createCustomer({ entityType, entityId: Number(entityId), stripeCustomerId: stripeId || undefined }); setMsg(`customer_id=${res.customer_id}`) } catch (e) { setMsg(String(e)) }
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select className="border rounded px-3 py-2" value={entityType} onChange={e=>setEntityType(e.target.value)}><option value="user">user</option><option value="team">team</option></select>
        <input className="border rounded px-3 py-2" value={entityId} onChange={e=>setEntityId(e.target.value)} placeholder="entity_id" />
        <input className="border rounded px-3 py-2" value={stripeId} onChange={e=>setStripeId(e.target.value)} placeholder="stripe_customer_id 可选" />
        <button onClick={onCreate} className="bg-primary text-white px-4 py-2 rounded">创建 Customer</button>
      </div>
      {msg && <div className="text-sm text-gray-700">{msg}</div>}
    </div>
  )
}

