import React, { useState } from 'react'
import { getPlan } from '../../utils/api'

export default function PlanDetail() {
  const [planId, setPlanId] = useState('')
  const [plan, setPlan] = useState(null)
  const [msg, setMsg] = useState('')
  const onQuery = async () => {
    setMsg('')
    try { const res = await getPlan(Number(planId)); setPlan(res.plan || null) } catch (e) { setMsg(String(e)) }
  }
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input className="border rounded px-3 py-2" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id" />
        <button onClick={onQuery} className="bg-primary text-white px-4 py-2 rounded">查询</button>
      </div>
      {msg && <div className="text-sm text-red-600">{msg}</div>}
      {plan && (<pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto">{JSON.stringify(plan, null, 2)}</pre>)}
    </div>
  )
}

