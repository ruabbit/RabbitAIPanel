import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Container from '../../../primer/Container'
import Card from '../../../primer/Card'
import Button from '../../../primer/Button'

export default function PlansList() {
  const [planId, setPlanId] = useState('')
  const navigate = useNavigate()

  return (
    <Container size="lg">
      <div className="mt-6 space-y-4">
        <div className="text-xl font-semibold text-gray-800">计划</div>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="rr-label" htmlFor="go-plan">打开计划详情</label>
              <input id="go-plan" className="rr-input" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="输入 plan_id" />
            </div>
            <div className="flex items-end">
              <Button className="w-full" color="blue" onClick={()=>{ if (planId) navigate(`/admin/plans/${encodeURIComponent(planId)}`) }}>打开</Button>
            </div>
            <div className="flex items-end">
              <Link to="/admin/plan/create" className="inline-flex items-center justify-center rr-btn rr-btn-primary w-full">创建计划（旧）</Link>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">提示：后续将提供计划搜索与筛选。在此期间，可通过 plan_id 直接进入详情页；亦可使用旧的“创建计划”入口。</div>
        </Card>

        <Card>
          <div className="text-sm text-gray-700">正在逐步将“日限额/用量/计价规则/映射/分配”等操作整合到“计划详情”中。旧页面仍保留以便回退：</div>
          <ul className="mt-2 text-sm list-disc list-inside text-gray-600 space-y-1">
            <li><Link className="text-blue-600 hover:underline" to="/admin/plan/daily">计划-日限额（旧）</Link></li>
            <li><Link className="text-blue-600 hover:underline" to="/admin/plan/usage">计划-用量（旧）</Link></li>
            <li><Link className="text-blue-600 hover:underline" to="/admin/plan/pricerule">计划-计价规则（旧）</Link></li>
            <li><Link className="text-blue-600 hover:underline" to="/admin/price-mappings">价格映射（旧）</Link></li>
            <li><Link className="text-blue-600 hover:underline" to="/admin/plan/assign">计划-分配（旧）</Link></li>
          </ul>
        </Card>
      </div>
    </Container>
  )
}

