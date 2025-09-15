import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPlan, updatePlanMeta, upsertDailyLimit, upsertUsagePlan } from '../../utils/api'
import Container from '../../primer/Container'
import Button from '../../primer/Button'
import Select from '../../components/Select'
import Card from '../../primer/Card'

export default function PlanCreate() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [type, setType] = useState('daily_limit')
  const [currency, setCurrency] = useState('USD')
  const [meta, setMeta] = useState('')
  const [planId, setPlanId] = useState('')
  const [msg, setMsg] = useState('')
  // type-specific fields
  const [dlc, setDlc] = useState('')
  const [policy, setPolicy] = useState('block')
  const [reset, setReset] = useState('00:00')
  const [billing, setBilling] = useState('monthly')
  const [minCommit, setMinCommit] = useState('')
  const [creditGrant, setCreditGrant] = useState('')
  const onCreate = async () => {
    setMsg('')
    try {
      const m = meta ? JSON.parse(meta) : undefined
      const res = await createPlan({ name, type, currency, meta: m })
      const pid = Number(res.plan_id)
      setPlanId(String(pid))
      // follow-up: initialize type-specific config
      if (type === 'daily_limit') {
        await upsertDailyLimit({ planId: pid, dailyLimitCents: Number(dlc || '0'), overflowPolicy: policy, resetTime: reset })
      } else if (type === 'usage') {
        await upsertUsagePlan({ planId: pid, billingCycle: billing, minCommitCents: minCommit ? Number(minCommit) : undefined, creditGrantCents: creditGrant ? Number(creditGrant) : undefined })
      }
      setMsg(`创建成功 plan_id=${pid}`)
      // redirect to new detail page
      navigate(`/admin/plans/${encodeURIComponent(pid)}`)
    } catch (e) { setMsg(String(e)) }
  }
  const onUpdateMeta = async () => {
    setMsg('')
    try {
      if (!planId) throw new Error('plan_id 为空')
      const m = meta ? JSON.parse(meta) : {}
      await updatePlanMeta({ planId: Number(planId), meta: m })
      setMsg('Meta 已更新')
    } catch (e) { setMsg(String(e)) }
  }
  return (
    <Container size="md">
      {/* 标题移除 */}
      <div className="mt-6 space-y-4">
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="rr-label" htmlFor="pl-name">name</label>
              <input id="pl-name" className="rr-input" value={name} onChange={e=>setName(e.target.value)} placeholder="name" />
            </div>
            <div>
              <label className="rr-label" htmlFor="pl-type">type</label>
              <Select id="pl-type" value={type} onChange={v=>setType(String(v))} options={[{value:'daily_limit',label:'daily_limit'},{value:'usage',label:'usage'}]} placeholder="选择类型" />
            </div>
            <div>
              <label className="rr-label" htmlFor="pl-currency">currency</label>
              <input id="pl-currency" className="rr-input" value={currency} onChange={e=>setCurrency(e.target.value)} placeholder="USD" />
            </div>
            <div className="md:col-span-2">
              <label className="rr-label" htmlFor="pl-meta">meta JSON（可选）</label>
              <input id="pl-meta" className="rr-input" value={meta} onChange={e=>setMeta(e.target.value)} placeholder='' />
            </div>
          </div>
          {/* type-specific inputs */}
          {type === 'daily_limit' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
              <div>
                <label className="rr-label" htmlFor="pl-dlc">daily_limit_cents</label>
                <input id="pl-dlc" className="rr-input" value={dlc} onChange={e=>setDlc(e.target.value)} placeholder="例如：2000" />
              </div>
              <div>
                <label className="rr-label" htmlFor="pl-policy">overflow_policy</label>
                <Select id="pl-policy" value={policy} onChange={v=>setPolicy(String(v))} options={[{value:'block',label:'block'},{value:'grace',label:'grace'},{value:'degrade',label:'degrade'}]} placeholder="选择策略" />
              </div>
              <div>
                <label className="rr-label" htmlFor="pl-reset">reset_time</label>
                <input id="pl-reset" className="rr-input" value={reset} onChange={e=>setReset(e.target.value)} placeholder="HH:MM" />
              </div>
            </div>
          )}
          {type === 'usage' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3">
              <div>
                <label className="rr-label" htmlFor="pl-billing">billing_cycle</label>
                <Select id="pl-billing" value={billing} onChange={v=>setBilling(String(v))} options={[{value:'monthly',label:'monthly'},{value:'weekly',label:'weekly'}]} placeholder="选择周期" />
              </div>
              <div>
                <label className="rr-label" htmlFor="pl-min-commit">min_commit_cents（可选）</label>
                <input id="pl-min-commit" className="rr-input" value={minCommit} onChange={e=>setMinCommit(e.target.value)} placeholder="例如：0" />
              </div>
              <div>
                <label className="rr-label" htmlFor="pl-credit">credit_grant_cents（可选）</label>
                <input id="pl-credit" className="rr-input" value={creditGrant} onChange={e=>setCreditGrant(e.target.value)} placeholder="例如：0" />
              </div>
            </div>
          )}
          <div className="mt-4 flex gap-2 items-center">
            <Button onClick={onCreate} color="blue">创建 Plan</Button>
            <Button onClick={onUpdateMeta} variant="outline" color="blue">更新 Meta</Button>
            <span className="text-sm text-gray-500">plan_id: {planId || '(未创建)'}</span>
          </div>
          {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
        </Card>
      </div>
    </Container>
  )
}
// 弃用说明：
// 本页面属于旧版“计划-创建”入口，已由新版“计划列表/详情页（/admin/plans 与 /admin/plans/:planId）”的流程替代。
// 该文件仅在过渡期间保留以便回退，请优先使用新版页面完成计划的创建与后续配置。
