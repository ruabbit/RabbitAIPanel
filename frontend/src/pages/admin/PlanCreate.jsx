import React, { useState } from 'react'
import { createPlan, updatePlanMeta } from '../../utils/api'
import Container from '../../primer/Container'
import SectionHeading from '../../primer/SectionHeading'
import Button from '../../primer/Button'

export default function PlanCreate() {
  const [name, setName] = useState('Test Plan')
  const [type, setType] = useState('daily_limit')
  const [currency, setCurrency] = useState('USD')
  const [meta, setMeta] = useState('{"stripe_price_id":"price_xxx_optional"}')
  const [planId, setPlanId] = useState('')
  const [msg, setMsg] = useState('')
  const onCreate = async () => {
    setMsg('')
    try {
      const m = meta ? JSON.parse(meta) : undefined
      const res = await createPlan({ name, type, currency, meta: m })
      setPlanId(String(res.plan_id))
      setMsg(`创建成功 plan_id=${res.plan_id}`)
    } catch (e) { setMsg(String(e)) }
  }
  const onUpdateMeta = async () => {
    setMsg('')
    try {
      if (!planId) throw new Error('plan_id 为空')
      const m = meta ? JSON.parse(meta) : {}
      await updatePlanMeta({ planId: Number(planId), meta: m })
      setMsg('Meta 已更新')
    } catch (e) { setMsg(String(e)) }
  }
  return (
    <Container size="md">
      <SectionHeading number="A1">计划 - 创建</SectionHeading>
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input className="border rounded px-3 py-2" value={name} onChange={e=>setName(e.target.value)} placeholder="name" />
          <select className="border rounded px-3 py-2" value={type} onChange={e=>setType(e.target.value)}>
            <option value="daily_limit">daily_limit</option>
            <option value="usage">usage</option>
          </select>
          <input className="border rounded px-3 py-2" value={currency} onChange={e=>setCurrency(e.target.value)} placeholder="currency" />
          <input className="border rounded px-3 py-2 md:col-span-2" value={meta} onChange={e=>setMeta(e.target.value)} placeholder='meta JSON' />
        </div>
        <div className="flex gap-2 items-center">
          <Button onClick={onCreate} color="blue">创建 Plan</Button>
          <Button onClick={onUpdateMeta} variant="outline" color="blue">更新 Meta</Button>
          <span className="text-sm text-gray-500">plan_id: {planId || '(未创建)'}</span>
        </div>
        {msg && <div className="text-sm text-gray-700">{msg}</div>}
      </div>
    </Container>
  )
}
