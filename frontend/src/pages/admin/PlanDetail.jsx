import React, { useState } from 'react'
import { getPlan } from '../../utils/api'
import Container from '../../primer/Container'
import SectionHeading from '../../primer/SectionHeading'
import Button from '../../primer/Button'
import Card from '../../primer/Card'

export default function PlanDetail() {
  const [planId, setPlanId] = useState('')
  const [plan, setPlan] = useState(null)
  const [msg, setMsg] = useState('')
  const onQuery = async () => {
    setMsg('')
    try { const res = await getPlan(Number(planId)); setPlan(res.plan || null) } catch (e) { setMsg(String(e)) }
  }
  return (
    <Container size="md">
      <SectionHeading number="A6">计划 - 详情</SectionHeading>
      <div className="mt-6 space-y-4">
        <Card>
          <div className="flex gap-2">
            <input className="border rounded px-3 py-2" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id" />
            <Button onClick={onQuery} color="blue">查询</Button>
          </div>
          {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}
          {plan && (<pre className="mt-3 text-xs bg-gray-50 border rounded p-3 overflow-auto">{JSON.stringify(plan, null, 2)}</pre>)}
        </Card>
      </div>
    </Container>
  )
}
