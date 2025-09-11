import React, { useState } from 'react'
import { assignPlan } from '../../utils/api'
import Container from '../../primer/Container'
import SectionHeading from '../../primer/SectionHeading'
import Button from '../../primer/Button'

export default function PlanAssign() {
  const [entityType, setEntityType] = useState('user')
  const [entityId, setEntityId] = useState('1')
  const [planId, setPlanId] = useState('')
  const [msg, setMsg] = useState('')
  const onAssign = async () => {
    setMsg('')
    try { await assignPlan({ entityType, entityId: Number(entityId), planId: Number(planId) }); setMsg('分配成功') } catch (e) { setMsg(String(e)) }
  }
  return (
    <Container size="md">
      <SectionHeading number="A5">计划 - 分配</SectionHeading>
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select className="border rounded px-3 py-2" value={entityType} onChange={e=>setEntityType(e.target.value)}><option value="user">user</option><option value="team">team</option></select>
          <input className="border rounded px-3 py-2" value={entityId} onChange={e=>setEntityId(e.target.value)} placeholder="entity_id" />
          <input className="border rounded px-3 py-2" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id" />
          <Button onClick={onAssign} color="blue">分配</Button>
        </div>
        {msg && <div className="text-sm text-gray-700">{msg}</div>}
      </div>
    </Container>
  )
}
