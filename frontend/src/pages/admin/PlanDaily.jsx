import React, { useState } from 'react'
import { upsertDailyLimit } from '../../utils/api'

export default function PlanDaily() {
  const [planId, setPlanId] = useState('')
  const [limit, setLimit] = useState('2000')
  const [policy, setPolicy] = useState('block')
  const [reset, setReset] = useState('00:00')
  const [msg, setMsg] = useState('')
  const onSave = async () => {
    setMsg('')
    try { await upsertDailyLimit({ planId: Number(planId), dailyLimitCents: Number(limit), overflowPolicy: policy, resetTime: reset }); setMsg('已保存') } catch (e) { setMsg(String(e)) }
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input className="border rounded px-3 py-2" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id" />
        <input className="border rounded px-3 py-2" value={limit} onChange={e=>setLimit(e.target.value)} placeholder="daily_limit_cents" />
        <select className="border rounded px-3 py-2" value={policy} onChange={e=>setPolicy(e.target.value)}>
          <option value="block">block</option>
          <option value="grace">grace</option>
          <option value="degrade">degrade</option>
        </select>
        <input className="border rounded px-3 py-2" value={reset} onChange={e=>setReset(e.target.value)} placeholder="reset_time" />
      </div>
      <button onClick={onSave} className="bg-primary text-white px-4 py-2 rounded">保存</button>
      {msg && <div className="text-sm text-gray-700">{msg}</div>}
    </div>
  )
}

