import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Container from '../../../primer/Container'
import Card from '../../../primer/Card'
import Button from '../../../primer/Button'
import Select from '../../../components/Select'
import {
  getPlan,
  // pricing
  addPriceRuleToPlan,
  listPriceMappings,
  createPriceMapping,
  updatePriceMapping,
  deletePriceMapping,
  // limits / usage
  upsertDailyLimit,
  upsertUsagePlan,
  // assignments
  assignPlan,
  // stripe ensure
  ensureStripeCustomer,
  ensureStripeSubscription,
  ensureStripeSubscriptionByPlan,
} from '../../../utils/api'

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={(active ? 'border-blue-600 text-blue-700 ' : 'border-transparent text-gray-600 hover:text-gray-800 ') + 'px-3 py-1.5 text-sm border-b-2'}>
      {children}
    </button>
  )
}

export default function PlanDetail() {
  const { planId: planIdParam } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [planId, setPlanId] = useState(String(planIdParam || ''))
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const pidNum = useMemo(()=> planId ? Number(planId) : undefined, [planId])

  const loadPlan = async (pid) => {
    if (!pid) return
    setLoading(true); setMsg('')
    try {
      const res = await getPlan(Number(pid))
      setPlan(res.plan || null)
    } catch (e) { setMsg(String(e)) } finally { setLoading(false) }
  }

  useEffect(() => { if (planIdParam) { setPlanId(String(planIdParam)); loadPlan(planIdParam) } }, [planIdParam])

  return (
    <Container size="xl">
      <div className="mt-6 space-y-4">
        <div className="flex items-end gap-3">
          <div className="grow max-w-64">
            <label className="rr-label" htmlFor="pd-id">plan_id</label>
            <input id="pd-id" className="rr-input" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id" />
          </div>
          <Button onClick={()=> loadPlan(planId)} color="blue">加载</Button>
          <Button variant="outline" onClick={()=> { if (planId) navigate(`/admin/plans/${encodeURIComponent(planId)}`) }}>刷新路由</Button>
        </div>

        <div className="border-b">
          <div className="flex gap-3">
            <TabButton active={tab==='overview'} onClick={()=>setTab('overview')}>Overview</TabButton>
            <TabButton active={tab==='pricing'} onClick={()=>setTab('pricing')}>Pricing</TabButton>
            <TabButton active={tab==='limits'} onClick={()=>setTab('limits')}>Limits</TabButton>
            <TabButton active={tab==='usage'} onClick={()=>setTab('usage')}>Usage Plan</TabButton>
            <TabButton active={tab==='assign'} onClick={()=>setTab('assign')}>Assignments</TabButton>
            <TabButton active={tab==='danger'} onClick={()=>setTab('danger')}>Danger</TabButton>
          </div>
        </div>

        {msg && <div className="text-sm text-red-600">{msg}</div>}
        {loading && <div className="text-sm text-gray-500">加载中…</div>}

        {tab === 'overview' && (
          <Card>
            <div className="text-sm text-gray-700">计划基础信息</div>
            {plan ? (
              <pre className="mt-3 text-xs bg-gray-50 border rounded p-3 overflow-auto">{JSON.stringify(plan, null, 2)}</pre>
            ) : (
              <div className="mt-2 text-sm text-gray-500">请输入 plan_id 并点击“加载”。</div>
            )}
          </Card>
        )}

        {tab === 'limits' && <TabLimits planId={pidNum} />}
        {tab === 'usage' && <TabUsage planId={pidNum} />}
        {tab === 'pricing' && <TabPricing planId={pidNum} />}
        {tab === 'assign' && <TabAssign planId={pidNum} />}
        {tab === 'danger' && <TabDanger planId={pidNum} />}
      </div>
    </Container>
  )
}

function TabLimits({ planId }) {
  const [limit, setLimit] = useState('2000')
  const [policy, setPolicy] = useState('block')
  const [reset, setReset] = useState('00:00')
  const [msg, setMsg] = useState('')
  const onSave = async () => {
    setMsg('')
    try {
      if (!planId) throw new Error('plan_id 为空')
      await upsertDailyLimit({ planId, dailyLimitCents: Number(limit), overflowPolicy: policy, resetTime: reset })
      setMsg('已保存')
    } catch (e) { setMsg(String(e)) }
  }
  return (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="rr-label" htmlFor="pd-limit">daily_limit_cents</label>
          <input id="pd-limit" className="rr-input" value={limit} onChange={e=>setLimit(e.target.value)} placeholder="例如：2000" />
        </div>
        <div>
          <label className="rr-label" htmlFor="pd-policy">overflow_policy</label>
          <Select id="pd-policy" value={policy} onChange={v=>setPolicy(String(v))} options={[{value:'block',label:'block'},{value:'grace',label:'grace'},{value:'degrade',label:'degrade'}]} placeholder="选择策略" />
        </div>
        <div>
          <label className="rr-label" htmlFor="pd-reset">reset_time</label>
          <input id="pd-reset" className="rr-input" value={reset} onChange={e=>setReset(e.target.value)} placeholder="HH:MM" />
        </div>
      </div>
      <div className="mt-4"><Button onClick={onSave} color="blue">保存</Button></div>
      {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
    </Card>
  )
}

function TabUsage({ planId }) {
  const [billing, setBilling] = useState('monthly')
  const [msg, setMsg] = useState('')
  const onSave = async () => {
    setMsg('')
    try {
      if (!planId) throw new Error('plan_id 为空')
      await upsertUsagePlan({ planId, billingCycle: billing })
      setMsg('已保存')
    } catch (e) { setMsg(String(e)) }
  }
  return (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="rr-label" htmlFor="pu-billing">billing_cycle</label>
          <Select id="pu-billing" value={billing} onChange={v=>setBilling(String(v))} options={[{value:'monthly',label:'monthly'},{value:'weekly',label:'weekly'}]} placeholder="选择周期" />
        </div>
      </div>
      <div className="mt-4"><Button onClick={onSave} color="blue">保存</Button></div>
      {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
    </Card>
  )
}

function TabPricing({ planId }) {
  // price rules
  const [modelPattern, setModelPattern] = useState('gpt-*')
  const [unit, setUnit] = useState('token')
  const [base, setBase] = useState('1')
  const [inMul, setInMul] = useState('1')
  const [outMul, setOutMul] = useState('1')
  const [priceMul, setPriceMul] = useState('1')
  const [minCharge, setMinCharge] = useState('0')
  const [msgRule, setMsgRule] = useState('')

  const addRule = async () => {
    setMsgRule('')
    try {
      if (!planId) throw new Error('plan_id 为空')
      await addPriceRuleToPlan({
        planId,
        modelPattern,
        unit,
        unitBasePriceCents: Number(base),
        inputMultiplier: Number(inMul),
        outputMultiplier: Number(outMul),
        priceMultiplier: Number(priceMul),
        minChargeCents: Number(minCharge),
      })
      setMsgRule('已添加规则')
    } catch (e) { setMsgRule(String(e)) }
  }

  // price mappings
  const [pmPlanId, setPmPlanId] = useState('')
  const [mappings, setMappings] = useState([])
  const [pmCurrency, setPmCurrency] = useState('USD')
  const [pmPriceId, setPmPriceId] = useState('price_...')
  const [pmActive, setPmActive] = useState(true)
  const [pmMappingId, setPmMappingId] = useState('')
  const [msgMap, setMsgMap] = useState('')

  useEffect(()=>{ if (planId) setPmPlanId(String(planId)) }, [planId])

  const load = async () => {
    setMsgMap('')
    try { const res = await listPriceMappings({ planId: pmPlanId }); setMappings(res.mappings || []) } catch (e) { setMsgMap(String(e)) }
  }
  const create = async () => { setMsgMap(''); try { await createPriceMapping({ planId: Number(pmPlanId), stripePriceId: pmPriceId, currency: pmCurrency, active: pmActive }); setMsgMap('已创建'); await load() } catch (e) { setMsgMap(String(e)) } }
  const update = async () => { setMsgMap(''); try { await updatePriceMapping({ mappingId: Number(pmMappingId), stripePriceId: pmPriceId, currency: pmCurrency, active: pmActive }); setMsgMap('已更新'); await load() } catch (e) { setMsgMap(String(e)) } }
  const del = async () => { setMsgMap(''); try { await deletePriceMapping({ mappingId: Number(pmMappingId) }); setMsgMap('已删除'); await load() } catch (e) { setMsgMap(String(e)) } }

  return (
    <div className="space-y-6">
      <Card>
        <div className="font-semibold mb-2">计价规则</div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          <input className="border rounded px-3 py-2" value={modelPattern} onChange={e=>setModelPattern(e.target.value)} placeholder="model_pattern" />
          <select className="border rounded px-3 py-2" value={unit} onChange={e=>setUnit(e.target.value)}>
            <option value="token">token</option><option value="request">request</option><option value="minute">minute</option><option value="image">image</option>
          </select>
          <input className="border rounded px-3 py-2" value={base} onChange={e=>setBase(e.target.value)} placeholder="base cents" />
          <input className="border rounded px-3 py-2" value={inMul} onChange={e=>setInMul(e.target.value)} placeholder="input mul" />
          <input className="border rounded px-3 py-2" value={outMul} onChange={e=>setOutMul(e.target.value)} placeholder="output mul" />
          <input className="border rounded px-3 py-2" value={priceMul} onChange={e=>setPriceMul(e.target.value)} placeholder="price mul" />
          <input className="border rounded px-3 py-2" value={minCharge} onChange={e=>setMinCharge(e.target.value)} placeholder="min charge cents" />
        </div>
        <div className="mt-4"><Button onClick={addRule} color="blue">添加规则</Button></div>
        {msgRule && <div className="mt-3 text-sm text-gray-700">{msgRule}</div>}
      </Card>

      <Card>
        <div className="font-semibold mb-2">价格映射</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="rr-label" htmlFor="pm-list-plan">plan_id（列表）</label>
            <input id="pm-list-plan" className="rr-input" value={pmPlanId} onChange={e=>setPmPlanId(e.target.value)} placeholder="plan_id" />
          </div>
          <div className="flex items-end">
            <Button onClick={load} variant="outline" color="blue" className="w-full">加载映射</Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="rr-label" htmlFor="pm-create-currency">currency</label>
            <input id="pm-create-currency" className="rr-input" value={pmCurrency} onChange={e=>setPmCurrency(e.target.value)} placeholder="USD" />
          </div>
          <div>
            <label className="rr-label" htmlFor="pm-create-price">stripe_price_id</label>
            <input id="pm-create-price" className="rr-input" value={pmPriceId} onChange={e=>setPmPriceId(e.target.value)} placeholder="price_xxx" />
          </div>
          <div>
            <label className="rr-label" htmlFor="pm-create-active">active</label>
            <Select id="pm-create-active" value={pmActive ? '1':'0'} onChange={v=>setPmActive(String(v)==='1')} options={[{value:'1',label:'active'},{value:'0',label:'inactive'}]} placeholder="选择状态" />
          </div>
          <div className="flex items-end">
            <Button onClick={create} color="blue" className="w-full">创建</Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="rr-label" htmlFor="pm-id">mapping_id</label>
            <input id="pm-id" className="rr-input" value={pmMappingId} onChange={e=>setPmMappingId(e.target.value)} placeholder="mapping_id" />
          </div>
          <div className="flex items-end">
            <Button onClick={update} variant="outline" color="blue" className="w-full">更新</Button>
          </div>
          <div className="flex items-end">
            <Button onClick={del} variant="outline" color="blue" className="w-full">删除</Button>
          </div>
        </div>
        {mappings && mappings.length > 0 && (
          <div className="rr-table-flow mt-4">
            <div className="rr-table-scroll">
              <div className="rr-table-inner">
                <table className="rr-table">
                  <thead>
                    <tr>
                      <th scope="col">id</th>
                      <th scope="col">plan_id</th>
                      <th scope="col">currency</th>
                      <th scope="col">stripe_price_id</th>
                      <th scope="col">active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.map(m => (
                      <tr key={m.id}>
                        <td>{m.id}</td>
                        <td>{m.plan_id}</td>
                        <td>{m.currency}</td>
                        <td>{m.stripe_price_id}</td>
                        <td>{String(m.active)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {msgMap && <div className="mt-3 text-sm text-gray-700">{msgMap}</div>}
      </Card>
    </div>
  )
}

function TabAssign({ planId }) {
  const [entityType, setEntityType] = useState('user')
  const [entityId, setEntityId] = useState('1')
  const [msg, setMsg] = useState('')
  const onAssign = async () => {
    setMsg('')
    try {
      if (!planId) throw new Error('plan_id 为空')
      await assignPlan({ entityType, entityId: Number(entityId), planId })
      setMsg('分配成功')
    } catch (e) { setMsg(String(e)) }
  }
  return (
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
      </div>
      <div className="mt-4"><Button onClick={onAssign} color="blue">分配</Button></div>
      {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
    </Card>
  )
}

function TabDanger({ planId }) {
  const [customerId, setCustomerId] = useState('1')
  const [priceId, setPriceId] = useState('')
  const [msg, setMsg] = useState('')

  const ensureCustomer = async () => { setMsg(''); try { const res = await ensureStripeCustomer({ customerId }); setMsg(`customer ok: ${res.stripe_customer_id || 'ok'}`) } catch(e){ setMsg(String(e)) } }
  const ensureSubscription = async () => { setMsg(''); try { await ensureStripeSubscription({ customerId, planId, stripePriceId: priceId }); setMsg('订阅已确保') } catch(e){ setMsg(String(e)) } }
  const ensureByPlan = async () => { setMsg(''); try { await ensureStripeSubscriptionByPlan({ customerId, planId }); setMsg('订阅已确保（按计划）') } catch(e){ setMsg(String(e)) } }

  return (
    <Card>
      <div className="text-sm text-gray-700">涉及外部系统的敏感操作，请谨慎操作。</div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="rr-label" htmlFor="dg-cust">customer_id</label>
          <input id="dg-cust" className="rr-input" value={customerId} onChange={e=>setCustomerId(e.target.value)} placeholder="customer_id" />
        </div>
        <div>
          <label className="rr-label" htmlFor="dg-price">stripe_price_id（可选）</label>
          <input id="dg-price" className="rr-input" value={priceId} onChange={e=>setPriceId(e.target.value)} placeholder="price_xxx（可选）" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" color="blue" onClick={ensureCustomer}>Ensure Customer</Button>
        <Button variant="outline" color="blue" onClick={ensureByPlan}>Ensure Subscription（by plan）</Button>
        <Button color="blue" onClick={ensureSubscription}>Ensure Subscription（by price）</Button>
      </div>
      {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
    </Card>
  )
}

