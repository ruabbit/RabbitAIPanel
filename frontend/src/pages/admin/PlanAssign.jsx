import React, { useState } from 'react'
import { assignPlan } from '../../utils/api'

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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select className="border rounded px-3 py-2" value={entityType} onChange={e=>setEntityType(e.target.value)}><option value="user">user</option><option value="team">team</option></select>
        <input className="border rounded px-3 py-2" value={entityId} onChange={e=>setEntityId(e.target.value)} placeholder="entity_id" />
        <input className="border rounded px-3 py-2" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id" />
        <button onClick={onAssign} className="bg-primary text-white px-4 py-2 rounded">分配</button>
      </div>
      {msg && <div className="text-sm text-gray-700">{msg}</div>}
    </div>
  )
}

