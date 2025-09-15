import React, { useState } from 'react'
import { assignPlan } from '../../utils/api'
import Container from '../../primer/Container'
import Button from '../../primer/Button'
import Select from '../../components/Select'
import Card from '../../primer/Card'

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
      {/* 标题移除 */}
      <div className="mt-6 space-y-4">
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="rr-label" htmlFor="pa-etype">entity_type</label>
              <Select id="pa-etype" value={entityType} onChange={v=>setEntityType(String(v))} options={[{value:'user',label:'user'},{value:'team',label:'team'}]} placeholder="选择类型" />
            </div>
            <div>
              <label className="rr-label" htmlFor="pa-eid">entity_id</label>
              <input id="pa-eid" className="rr-input" value={entityId} onChange={e=>setEntityId(e.target.value)} placeholder="entity_id" />
            </div>
            <div>
              <label className="rr-label" htmlFor="pa-plan">plan_id</label>
              <input id="pa-plan" className="rr-input" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id" />
            </div>
            <div className="flex items-end">
              <Button onClick={onAssign} color="blue" className="w-full">分配</Button>
            </div>
          </div>
          {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
        </Card>
      </div>
    </Container>
  )
}
// 弃用说明：
// 本页面属于旧版“计划-分配”入口，已由新版计划详情页的 Assignments 选项卡替代（/admin/plans/:planId）。
// 该文件仅在过渡期间保留以便回退，请优先在新版页面操作。
