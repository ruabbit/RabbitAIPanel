import React, { useState } from 'react'
import { upsertDailyLimit } from '../../utils/api'
import Container from '../../primer/Container'
import Button from '../../primer/Button'
import Card from '../../primer/Card'

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
    <Container size="md">
      {/* 标题移除 */}
      <div className="mt-6 space-y-4">
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="rr-label" htmlFor="pd-plan">plan_id</label>
              <input id="pd-plan" className="rr-input" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id" />
            </div>
            <div>
              <label className="rr-label" htmlFor="pd-limit">daily_limit_cents</label>
              <input id="pd-limit" className="rr-input" value={limit} onChange={e=>setLimit(e.target.value)} placeholder="例如：2000" />
            </div>
            <div>
              <label className="rr-label" htmlFor="pd-policy">overflow_policy</label>
              <select id="pd-policy" className="rr-select" value={policy} onChange={e=>setPolicy(e.target.value)}>
                <option value="block">block</option>
                <option value="grace">grace</option>
                <option value="degrade">degrade</option>
              </select>
            </div>
            <div>
              <label className="rr-label" htmlFor="pd-reset">reset_time</label>
              <input id="pd-reset" className="rr-input" value={reset} onChange={e=>setReset(e.target.value)} placeholder="HH:MM" />
            </div>
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
