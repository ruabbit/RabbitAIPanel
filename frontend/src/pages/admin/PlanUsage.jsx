import React, { useState } from 'react'
import { upsertUsagePlan } from '../../utils/api'
import Container from '../../primer/Container'
import SectionHeading from '../../primer/SectionHeading'
import Button from '../../primer/Button'
import Card from '../../primer/Card'

export default function PlanUsage() {
  const [planId, setPlanId] = useState('')
  const [billing, setBilling] = useState('monthly')
  const [msg, setMsg] = useState('')
  const onSave = async () => {
    setMsg('')
    try { await upsertUsagePlan({ planId: Number(planId), billingCycle: billing }); setMsg('已保存') } catch (e) { setMsg(String(e)) }
  }
  return (
    <Container size="md">
      <SectionHeading number="A3">计划 - 用量</SectionHeading>
      <div className="mt-6 space-y-4">
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="border rounded px-3 py-2" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id" />
            <select className="border rounded px-3 py-2" value={billing} onChange={e=>setBilling(e.target.value)}>
              <option value="monthly">monthly</option>
              <option value="weekly">weekly</option>
            </select>
          </div>
          <div className="mt-4">
            <Button onClick={onSave} color="blue">保存</Button>
          </div>
          {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
        </Card>
      </div>
    </Container>
  )
}
