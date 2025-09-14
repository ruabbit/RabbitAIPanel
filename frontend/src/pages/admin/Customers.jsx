import React, { useState } from 'react'
import { createCustomer } from '../../utils/api'
import Container from '../../primer/Container'
import Button from '../../primer/Button'
import Select from '../../components/Select'
import Card from '../../primer/Card'

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
    <Container size="md">
      {/* 标题移除 */}
      <div className="mt-6 space-y-4">
        <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="rr-label" htmlFor="cust-etype">entity_type</label>
            <Select id="cust-etype" value={entityType} onChange={v=>setEntityType(String(v))} options={[{value:'user',label:'user'},{value:'team',label:'team'}]} placeholder="选择类型" />
          </div>
          <div>
            <label className="rr-label" htmlFor="cust-eid">entity_id</label>
            <input id="cust-eid" className="rr-input" value={entityId} onChange={e=>setEntityId(e.target.value)} placeholder="entity_id" />
          </div>
          <div>
            <label className="rr-label" htmlFor="cust-stripe">stripe_customer_id（可选）</label>
            <input id="cust-stripe" className="rr-input" value={stripeId} onChange={e=>setStripeId(e.target.value)} placeholder="cus_xxx（可选）" />
          </div>
          <div className="flex items-end">
            <Button onClick={onCreate} color="blue" className="w-full">创建 Customer</Button>
          </div>
        </div>
        {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
        </Card>
      </div>
    </Container>
  )
}
