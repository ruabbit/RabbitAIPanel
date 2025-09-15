import React, { useState } from 'react'
import { getPlan } from '../../utils/api'
import Container from '../../primer/Container'
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
      {/* 标题移除 */}
      <div className="mt-6 space-y-4">
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="rr-label" htmlFor="pd-detail-plan">plan_id</label>
              <input id="pd-detail-plan" className="rr-input" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id" />
            </div>
            <div className="flex items-end">
              <Button onClick={onQuery} color="blue" className="w-full">查询</Button>
            </div>
          </div>
          {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}
          {plan && (<pre className="mt-3 text-xs bg-gray-50 border rounded p-3 overflow-auto">{JSON.stringify(plan, null, 2)}</pre>)}
        </Card>
      </div>
    </Container>
  )
}
// 弃用说明：
// 本页面属于旧版“计划-详情（仅查询）”入口，已由新版计划详情页（带 Tabs，/admin/plans/:planId）替代。
// 该文件仅在过渡期间保留以便回退，请优先在新版页面查看与操作。
