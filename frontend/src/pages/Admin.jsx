import React, { useState } from 'react'
import {
  listSubscriptions,
  listInvoices,
  listPriceMappings,
  generateInvoice,
  pushInvoiceToStripe,
  // plans
  createPlan,
  upsertDailyLimit,
  upsertUsagePlan,
  addPriceRuleToPlan,
  assignPlan,
  updatePlanMeta,
  getPlan,
  // mappings CRUD
  createPriceMapping,
  updatePriceMapping,
  deletePriceMapping,
} from '../utils/api'

export default function Admin() {
  const [customerId, setCustomerId] = useState('1')
  const [planId, setPlanId] = useState('')
  const [subs, setSubs] = useState([])
  const [invoices, setInvoices] = useState([])
  const [mappings, setMappings] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const [dateFrom, setDateFrom] = useState('2025-09-01')
  const [dateTo, setDateTo] = useState('2025-09-03')
  const [invoiceId, setInvoiceId] = useState('')

  // plan management states
  const [planName, setPlanName] = useState('Test Plan')
  const [planType, setPlanType] = useState('daily_limit')
  const [planCurrency, setPlanCurrency] = useState('USD')
  const [planMeta, setPlanMeta] = useState('{"stripe_price_id":"price_xxx_optional"}')
  const [createdPlanId, setCreatedPlanId] = useState('')

  const [dlCents, setDlCents] = useState('2000')
  const [dlPolicy, setDlPolicy] = useState('block')
  const [dlReset, setDlReset] = useState('00:00')

  const [ruleModelPattern, setRuleModelPattern] = useState('gpt-*')
  const [ruleUnit, setRuleUnit] = useState('token')
  const [ruleBaseCents, setRuleBaseCents] = useState('1')
  const [ruleInputMul, setRuleInputMul] = useState('1')
  const [ruleOutputMul, setRuleOutputMul] = useState('1')
  const [rulePriceMul, setRulePriceMul] = useState('1')
  const [ruleMinCharge, setRuleMinCharge] = useState('0')

  const [assignEntityType, setAssignEntityType] = useState('user')
  const [assignEntityId, setAssignEntityId] = useState('1')

  const [queryPlanId, setQueryPlanId] = useState('')
  const [queriedPlan, setQueriedPlan] = useState(null)

  // create customer/subscription
  const [custEntityType, setCustEntityType] = useState('user')
  const [custEntityId, setCustEntityId] = useState('1')
  const [custStripeId, setCustStripeId] = useState('')
  const [createdCustomerId, setCreatedCustomerId] = useState('')
  const [subPlanId, setSubPlanId] = useState('')
  const [subStripeId, setSubStripeId] = useState('')
  const createCust = async () => {
    setLoading(true); setErr('')
    try { const res = await createCustomer({ entityType: custEntityType, entityId: Number(custEntityId), stripeCustomerId: custStripeId || undefined }); setCreatedCustomerId(String(res.customer_id)); alert(`customer_id=${res.customer_id}`) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  const createSub = async () => {
    setLoading(true); setErr('')
    try { const res = await createSubscription({ customerId: Number(createdCustomerId || customerId), planId: Number(subPlanId), stripeSubscriptionId: subStripeId || undefined }); alert(`subscription created`) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  // query invoice/subscription
  const [qInvoiceId, setQInvoiceId] = useState('')
  const [qInvoice, setQInvoice] = useState(null)
  const [qSubId, setQSubId] = useState('')
  const [qSubStripeId, setQSubStripeId] = useState('')
  const [qSub, setQSub] = useState(null)
  const queryInvoice = async () => {
    setLoading(true); setErr('')
    try { const res = await getInvoice(Number(qInvoiceId)); setQInvoice(res.invoice || null) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  const querySub = async () => {
    setLoading(true); setErr('')
    try { const res = await getSubscription(Number(qSubId)); setQSub(res.subscription || null) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  const querySubByStripe = async () => {
    setLoading(true); setErr('')
    try { const res = await getSubscriptionByStripe(qSubStripeId); setQSub(res.subscription || null) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  // assignment query
  const [assEntityType, setAssEntityType] = useState('user')
  const [assEntityId, setAssEntityId] = useState('1')
  const [assignment, setAssignment] = useState(null)
  const onGetAssignment = async () => {
    setLoading(true); setErr('')
    try { const res = await getAssignment({ entityType: assEntityType, entityId: Number(assEntityId) }); setAssignment(res.assignment || null) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  // wallets/ledger
  const [wlUserId, setWlUserId] = useState('1')
  const [wallets, setWallets] = useState(null)
  const [ledger, setLedger] = useState(null)
  const loadWallets = async () => {
    setLoading(true); setErr('')
    try { const res = await getWallets(Number(wlUserId)); setWallets(res.wallets || []) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  const loadLedger = async () => {
    setLoading(true); setErr('')
    try { const res = await getLedger(Number(wlUserId)); setLedger(res.entries || []) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  // team period
  const [teamId, setTeamId] = useState('1')
  const [tpFrom, setTpFrom] = useState('2025-09-01')
  const [tpTo, setTpTo] = useState('2025-09-03')
  const [tpGroup, setTpGroup] = useState('total')
  const [teamPeriod, setTeamPeriod] = useState(null)
  const loadTeamPeriod = async () => {
    setLoading(true); setErr('')
    try { const res = await getTeamPeriod({ teamId, dateFrom: tpFrom, dateTo: tpTo, groupBy: tpGroup }); setTeamPeriod(res) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  const loadSubs = async () => {
    setLoading(true); setErr('')
    try { const res = await listSubscriptions({ customerId, planId }); setSubs(res.subscriptions || []) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  const loadInvoices = async () => {
    setLoading(true); setErr('')
    try { const res = await listInvoices({ customerId }); setInvoices(res.invoices || []) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  const loadMappings = async () => {
    setLoading(true); setErr('')
    try { const res = await listPriceMappings({ planId }); setMappings(res.mappings || []) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  const onGenerateInvoice = async () => {
    setLoading(true); setErr('')
    try { const res = await generateInvoice({ customerId, dateFrom, dateTo }); alert(`生成成功: invoice_id=${res.invoice?.id}`) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  const onPushInvoice = async () => {
    setLoading(true); setErr('')
    try { const res = await pushInvoiceToStripe({ invoiceId }); alert(`推送成功: stripe_invoice_id=${res.stripe_invoice_id}`) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  // plan management handlers
  const onCreatePlan = async () => {
    setLoading(true); setErr('')
    try {
      let meta
      try { meta = planMeta ? JSON.parse(planMeta) : undefined } catch { throw new Error('meta 必须是合法 JSON') }
      const res = await createPlan({ name: planName, type: planType, currency: planCurrency, meta })
      const pid = res.plan_id
      setCreatedPlanId(String(pid)); alert(`创建成功 plan_id=${pid}`)
    } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  const onUpsertDailyLimit = async () => {
    setLoading(true); setErr('')
    try {
      const pid = createdPlanId || planId
      if (!pid) throw new Error('请先创建或填写 plan_id')
      await upsertDailyLimit({ planId: Number(pid), dailyLimitCents: Number(dlCents), overflowPolicy: dlPolicy, resetTime: dlReset })
      alert('日限额已更新')
    } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  const onUpsertUsagePlan = async () => {
    setLoading(true); setErr('')
    try {
      const pid = createdPlanId || planId
      if (!pid) throw new Error('请先创建或填写 plan_id')
      await upsertUsagePlan({ planId: Number(pid), billingCycle: 'monthly' })
      alert('用量计划已更新')
    } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  const onAddPriceRule = async () => {
    setLoading(true); setErr('')
    try {
      const pid = createdPlanId || planId
      if (!pid) throw new Error('请先创建或填写 plan_id')
      await addPriceRuleToPlan({
        planId: Number(pid),
        modelPattern: ruleModelPattern,
        unit: ruleUnit,
        unitBasePriceCents: Number(ruleBaseCents),
        inputMultiplier: ruleInputMul ? Number(ruleInputMul) : undefined,
        outputMultiplier: ruleOutputMul ? Number(ruleOutputMul) : undefined,
        priceMultiplier: rulePriceMul ? Number(rulePriceMul) : undefined,
        minChargeCents: ruleMinCharge ? Number(ruleMinCharge) : undefined,
      })
      alert('计价规则已添加')
    } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  const onAssignPlan = async () => {
    setLoading(true); setErr('')
    try {
      const pid = createdPlanId || planId
      if (!pid) throw new Error('请先创建或填写 plan_id')
      await assignPlan({ entityType: assignEntityType, entityId: Number(assignEntityId), planId: Number(pid) })
      alert('分配成功')
    } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  const onQueryPlan = async () => {
    setLoading(true); setErr('')
    try { const res = await getPlan(Number(queryPlanId)); setQueriedPlan(res.plan || null) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  const onUpdateMeta = async () => {
    setLoading(true); setErr('')
    try {
      if (!queryPlanId) throw new Error('请填写要更新 meta 的 plan_id')
      const meta = planMeta ? JSON.parse(planMeta) : {}
      await updatePlanMeta({ planId: Number(queryPlanId), meta })
      alert('Plan meta 已更新')
    } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  // price mapping CRUD
  const [pmPlanId, setPmPlanId] = useState('')
  const [pmCurrency, setPmCurrency] = useState('USD')
  const [pmPriceId, setPmPriceId] = useState('price_...')
  const [pmActive, setPmActive] = useState(true)
  const [pmMappingId, setPmMappingId] = useState('')
  const createPm = async () => {
    setLoading(true); setErr('')
    try { await createPriceMapping({ planId: Number(pmPlanId), stripePriceId: pmPriceId, currency: pmCurrency, active: pmActive }); alert('映射已创建'); await loadMappings() } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  const updatePm = async () => {
    setLoading(true); setErr('')
    try { await updatePriceMapping({ mappingId: Number(pmMappingId), stripePriceId: pmPriceId, currency: pmCurrency, active: pmActive }); alert('映射已更新'); await loadMappings() } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  const deletePm = async () => {
    setLoading(true); setErr('')
    try { await deletePriceMapping({ mappingId: Number(pmMappingId) }); alert('映射已删除'); await loadMappings() } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  // Stripe ensure forms
  const onEnsureCustomer = async () => {
    setLoading(true); setErr('')
    try { const res = await ensureStripeCustomer({ customerId }); alert(`stripe_customer_id=${res.stripe_customer_id || 'ok'}`) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  const [ensurePlanId, setEnsurePlanId] = useState('')
  const [ensurePriceId, setEnsurePriceId] = useState('')
  const onEnsureSubscription = async () => {
    setLoading(true); setErr('')
    try { const res = await ensureStripeSubscription({ customerId, planId: Number(ensurePlanId || 0), stripePriceId: ensurePriceId }); alert(`stripe_subscription_id=${res.stripe_subscription_id}`) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  const onEnsureSubscriptionByPlan = async () => {
    setLoading(true); setErr('')
    try { const res = await ensureStripeSubscriptionByPlan({ customerId, planId: Number(ensurePlanId || 0) }); alert(`stripe_subscription_id=${res.stripe_subscription_id}`) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">管理后台</h2>

      <div className="bg-white rounded shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">customer_id</label>
            <input className="w-full border rounded px-3 py-2" value={customerId} onChange={e => setCustomerId(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">plan_id</label>
            <input className="w-full border rounded px-3 py-2" value={planId} onChange={e => setPlanId(e.target.value)} placeholder="可空" />
          </div>
          <div className="flex items-end">
            <button onClick={loadSubs} className="bg-primary text-white px-4 py-2 rounded w-full">加载订阅</button>
          </div>
          <div className="flex items-end">
            <button onClick={loadInvoices} className="border px-4 py-2 rounded w-full">加载发票</button>
          </div>
        </div>
        {loading && <div className="text-sm text-gray-500">加载中…</div>}
        {err && <div className="text-sm text-red-600">{err}</div>}

        {!!subs.length && (
          <div>
            <div className="font-semibold mb-2">订阅</div>
            <div className="overflow-auto">
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">id</th>
                    <th className="p-2 border">customer_id</th>
                    <th className="p-2 border">plan_id</th>
                    <th className="p-2 border">status</th>
                    <th className="p-2 border">stripe_subscription_id</th>
                    <th className="p-2 border">created_at</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map(s => (
                    <tr key={s.id} className="odd:bg-white even:bg-gray-50">
                      <td className="p-2 border">{s.id}</td>
                      <td className="p-2 border">{s.customer_id}</td>
                      <td className="p-2 border">{s.plan_id}</td>
                      <td className="p-2 border">{s.status}</td>
                      <td className="p-2 border">{s.stripe_subscription_id}</td>
                      <td className="p-2 border">{s.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!!invoices.length && (
          <div>
            <div className="font-semibold mb-2">发票</div>
            <div className="overflow-auto">
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">id</th>
                    <th className="p-2 border">customer_id</th>
                    <th className="p-2 border">total_amount_cents</th>
                    <th className="p-2 border">currency</th>
                    <th className="p-2 border">status</th>
                    <th className="p-2 border">stripe_invoice_id</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="odd:bg-white even:bg-gray-50">
                      <td className="p-2 border">{inv.id}</td>
                      <td className="p-2 border">{inv.customer_id}</td>
                      <td className="p-2 border">{inv.total_amount_cents}</td>
                      <td className="p-2 border">{inv.currency}</td>
                      <td className="p-2 border">{inv.status}</td>
                      <td className="p-2 border">{inv.stripe_invoice_id || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="border rounded p-4">
          <div className="font-semibold mb-3">价格映射</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">plan_id</label>
              <input className="w-full border rounded px-3 py-2" value={planId} onChange={e => setPlanId(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={loadMappings} className="border px-4 py-2 rounded w-full">加载映射</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">plan_id</label>
              <input className="w-full border rounded px-3 py-2" value={pmPlanId} onChange={e => setPmPlanId(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">currency</label>
              <input className="w-full border rounded px-3 py-2" value={pmCurrency} onChange={e => setPmCurrency(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">stripe_price_id</label>
              <input className="w-full border rounded px-3 py-2" value={pmPriceId} onChange={e => setPmPriceId(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">active</label>
              <select className="w-full border rounded px-3 py-2" value={pmActive ? '1':'0'} onChange={e => setPmActive(e.target.value === '1')}>
                <option value="1">true</option>
                <option value="0">false</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={createPm} className="bg-primary text-white px-4 py-2 rounded w-full">创建映射</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">mapping_id</label>
              <input className="w-full border rounded px-3 py-2" value={pmMappingId} onChange={e => setPmMappingId(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={updatePm} className="border px-4 py-2 rounded w-full">更新映射</button>
            </div>
            <div className="flex items-end">
              <button onClick={deletePm} className="border px-4 py-2 rounded w-full">删除映射</button>
            </div>
          </div>
          {!!mappings.length && (
            <div className="overflow-auto">
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">id</th>
                    <th className="p-2 border">plan_id</th>
                    <th className="p-2 border">currency</th>
                    <th className="p-2 border">stripe_price_id</th>
                    <th className="p-2 border">active</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map(m => (
                    <tr key={m.id} className="odd:bg-white even:bg-gray-50">
                      <td className="p-2 border">{m.id}</td>
                      <td className="p-2 border">{m.plan_id}</td>
                      <td className="p-2 border">{m.currency}</td>
                      <td className="p-2 border">{m.stripe_price_id}</td>
                      <td className="p-2 border">{String(m.active)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="border rounded p-4">
          <div className="font-semibold mb-3">生成/推送发票</div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">customer_id</label>
              <input className="w-full border rounded px-3 py-2" value={customerId} onChange={e => setCustomerId(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">date_from</label>
              <input className="w-full border rounded px-3 py-2" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">date_to</label>
              <input className="w-full border rounded px-3 py-2" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={onGenerateInvoice} className="bg-primary text-white px-4 py-2 rounded w-full">生成发票</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">invoice_id</label>
              <input className="w-full border rounded px-3 py-2" value={invoiceId} onChange={e => setInvoiceId(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={onPushInvoice} className="border px-4 py-2 rounded w-full">推送至 Stripe</button>
            </div>
          </div>
        </div>

        <div className="border rounded p-4">
          <div className="font-semibold mb-3">创建 Customer / Subscription（测试）</div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">entity_type</label>
              <select className="w-full border rounded px-3 py-2" value={custEntityType} onChange={e => setCustEntityType(e.target.value)}>
                <option value="user">user</option>
                <option value="team">team</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">entity_id</label>
              <input className="w-full border rounded px-3 py-2" value={custEntityId} onChange={e => setCustEntityId(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">stripe_customer_id（可选）</label>
              <input className="w-full border rounded px-3 py-2" value={custStripeId} onChange={e => setCustStripeId(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={createCust} className="bg-primary text-white px-4 py-2 rounded w-full">创建 Customer</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">customer_id（留空用上面创建）</label>
              <input className="w-full border rounded px-3 py-2" value={createdCustomerId || customerId} onChange={e => setCreatedCustomerId(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">plan_id</label>
              <input className="w-full border rounded px-3 py-2" value={subPlanId} onChange={e => setSubPlanId(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">stripe_subscription_id（可选）</label>
              <input className="w-full border rounded px-3 py-2" value={subStripeId} onChange={e => setSubStripeId(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={createSub} className="border px-4 py-2 rounded w-full">创建 Subscription</button>
            </div>
          </div>
        </div>

        <div className="border rounded p-4">
          <div className="font-semibold mb-3">Stripe Ensure（可选）</div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">customer_id</label>
              <input className="w-full border rounded px-3 py-2" value={customerId} onChange={e => setCustomerId(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={onEnsureCustomer} className="border px-4 py-2 rounded w-full">Ensure Customer</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">plan_id</label>
              <input className="w-full border rounded px-3 py-2" value={ensurePlanId} onChange={e => setEnsurePlanId(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">stripe_price_id</label>
              <input className="w-full border rounded px-3 py-2" value={ensurePriceId} onChange={e => setEnsurePriceId(e.target.value)} placeholder="可选：直接用 price id" />
            </div>
            <div className="flex items-end">
              <button onClick={onEnsureSubscription} className="border px-4 py-2 rounded w-full">Ensure Subscription</button>
            </div>
            <div className="flex items-end">
              <button onClick={onEnsureSubscriptionByPlan} className="border px-4 py-2 rounded w-full">Ensure by Plan</button>
            </div>
          </div>
        </div>

        <div className="border rounded p-4">
          <div className="font-semibold mb-3">查询发票/订阅</div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">invoice_id</label>
              <input className="w-full border rounded px-3 py-2" value={qInvoiceId} onChange={e => setQInvoiceId(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={queryInvoice} className="border px-4 py-2 rounded w-full">查询发票</button>
            </div>
          </div>
          {qInvoice && (
            <pre className="text-xs bg-gray-50 border rounded p-3 mb-3 overflow-auto">{JSON.stringify(qInvoice, null, 2)}</pre>
          )}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">subscription_id</label>
              <input className="w-full border rounded px-3 py-2" value={qSubId} onChange={e => setQSubId(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={querySub} className="border px-4 py-2 rounded w-full">查询订阅</button>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">stripe_subscription_id</label>
              <input className="w-full border rounded px-3 py-2" value={qSubStripeId} onChange={e => setQSubStripeId(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={querySubByStripe} className="border px-4 py-2 rounded w-full">通过 Stripe ID 查询</button>
            </div>
          </div>
          {qSub && (
            <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto">{JSON.stringify(qSub, null, 2)}</pre>
          )}
        </div>

        <div className="border rounded p-4">
          <div className="font-semibold mb-3">Plan 分配查询 / Wallets & Ledger</div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">assignment entity_type</label>
              <select className="w-full border rounded px-3 py-2" value={assEntityType} onChange={e => setAssEntityType(e.target.value)}>
                <option value="user">user</option>
                <option value="team">team</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">assignment entity_id</label>
              <input className="w-full border rounded px-3 py-2" value={assEntityId} onChange={e => setAssEntityId(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={onGetAssignment} className="border px-4 py-2 rounded w-full">查询分配</button>
            </div>
          </div>
          {assignment && (
            <pre className="text-xs bg-gray-50 border rounded p-3 mb-3 overflow-auto">{JSON.stringify(assignment, null, 2)}</pre>
          )}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">wallet user_id</label>
              <input className="w-full border rounded px-3 py-2" value={wlUserId} onChange={e => setWlUserId(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={loadWallets} className="border px-4 py-2 rounded w-full">加载钱包</button>
            </div>
            <div className="flex items-end">
              <button onClick={loadLedger} className="border px-4 py-2 rounded w-full">加载流水</button>
            </div>
          </div>
          {(wallets && wallets.length > 0) && (
            <div className="mb-3">
              <div className="font-semibold mb-1">Wallets</div>
              <ul className="text-sm text-gray-700 list-disc pl-5">
                {wallets.map((w, i) => (
                  <li key={i}>{w.currency}: {w.balance_cents}¢</li>
                ))}
              </ul>
            </div>
          )}
          {(ledger && ledger.length > 0) && (
            <div className="overflow-auto">
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr><th className="p-2 border">created_at</th><th className="p-2 border">currency</th><th className="p-2 border">amount_cents</th><th className="p-2 border">reason</th></tr>
                </thead>
                <tbody>
                  {ledger.map((l, i) => (
                    <tr key={i} className="odd:bg-white even:bg-gray-50">
                      <td className="p-2 border">{l.created_at}</td>
                      <td className="p-2 border">{l.currency}</td>
                      <td className="p-2 border">{l.amount_cents}</td>
                      <td className="p-2 border">{l.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="border rounded p-4">
          <div className="font-semibold mb-3">团队账期（period_team）</div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">team_id</label>
              <input className="w-full border rounded px-3 py-2" value={teamId} onChange={e => setTeamId(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">date_from</label>
              <input className="w-full border rounded px-3 py-2" value={tpFrom} onChange={e => setTpFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">date_to</label>
              <input className="w-full border rounded px-3 py-2" value={tpTo} onChange={e => setTpTo(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">group_by</label>
              <select className="w-full border rounded px-3 py-2" value={tpGroup} onChange={e => setTpGroup(e.target.value)}>
                <option value="total">total</option>
                <option value="model">model</option>
                <option value="day">day</option>
                <option value="model_day">model_day</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={loadTeamPeriod} className="border px-4 py-2 rounded w-full">加载团队账期</button>
            </div>
          </div>
          {teamPeriod && (
            <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto">{JSON.stringify(teamPeriod, null, 2)}</pre>
          )}
        </div>

        <div className="border rounded p-4">
          <div className="font-semibold mb-3">计划管理（测试）</div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">name</label>
              <input className="w-full border rounded px-3 py-2" value={planName} onChange={e => setPlanName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">type</label>
              <select className="w-full border rounded px-3 py-2" value={planType} onChange={e => setPlanType(e.target.value)}>
                <option value="daily_limit">daily_limit</option>
                <option value="usage">usage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">currency</label>
              <input className="w-full border rounded px-3 py-2" value={planCurrency} onChange={e => setPlanCurrency(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">meta(JSON)</label>
              <input className="w-full border rounded px-3 py-2" value={planMeta} onChange={e => setPlanMeta(e.target.value)} />
            </div>
            <div className="md:col-span-5 flex items-end">
              <button onClick={onCreatePlan} className="bg-primary text-white px-4 py-2 rounded">创建 Plan</button>
              <span className="text-sm text-gray-500 ml-3">plan_id: {createdPlanId || '(未创建)'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">plan_id（留空则用上方创建结果）</label>
              <input className="w-full border rounded px-3 py-2" value={planId} onChange={e => setPlanId(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">daily_limit_cents</label>
              <input className="w-full border rounded px-3 py-2" value={dlCents} onChange={e => setDlCents(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">overflow_policy</label>
              <select className="w-full border rounded px-3 py-2" value={dlPolicy} onChange={e => setDlPolicy(e.target.value)}>
                <option value="block">block</option>
                <option value="grace">grace</option>
                <option value="degrade">degrade</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">reset_time</label>
              <input className="w-full border rounded px-3 py-2" value={dlReset} onChange={e => setDlReset(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={onUpsertDailyLimit} className="border px-4 py-2 rounded w-full">Upsert 日限额</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">model_pattern</label>
              <input className="w-full border rounded px-3 py-2" value={ruleModelPattern} onChange={e => setRuleModelPattern(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">unit</label>
              <select className="w-full border rounded px-3 py-2" value={ruleUnit} onChange={e => setRuleUnit(e.target.value)}>
                <option value="token">token</option>
                <option value="request">request</option>
                <option value="minute">minute</option>
                <option value="image">image</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">unit_base_price_cents</label>
              <input className="w-full border rounded px-3 py-2" value={ruleBaseCents} onChange={e => setRuleBaseCents(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">input_multiplier</label>
              <input className="w-full border rounded px-3 py-2" value={ruleInputMul} onChange={e => setRuleInputMul(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">output_multiplier</label>
              <input className="w-full border rounded px-3 py-2" value={ruleOutputMul} onChange={e => setRuleOutputMul(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">min_charge_cents</label>
              <input className="w-full border rounded px-3 py-2" value={ruleMinCharge} onChange={e => setRuleMinCharge(e.target.value)} />
            </div>
            <div className="md:col-span-6 flex items-end">
              <button onClick={onAddPriceRule} className="border px-4 py-2 rounded">添加计价规则</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">assign entity_type</label>
              <select className="w-full border rounded px-3 py-2" value={assignEntityType} onChange={e => setAssignEntityType(e.target.value)}>
                <option value="user">user</option>
                <option value="team">team</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">assign entity_id</label>
              <input className="w-full border rounded px-3 py-2" value={assignEntityId} onChange={e => setAssignEntityId(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={onAssignPlan} className="border px-4 py-2 rounded w-full">分配 Plan</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">查询 plan_id</label>
              <input className="w-full border rounded px-3 py-2" value={queryPlanId} onChange={e => setQueryPlanId(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={onQueryPlan} className="border px-4 py-2 rounded w-full">查询 Plan</button>
            </div>
            <div className="md:col-span-3 flex items-end">
              <button onClick={onUpdateMeta} className="border px-4 py-2 rounded">更新 meta(使用上方 meta JSON)</button>
            </div>
          </div>

          {queriedPlan && (
            <pre className="text-xs bg-gray-50 border rounded p-3 mt-3 overflow-auto">{JSON.stringify(queriedPlan, null, 2)}</pre>
          )}
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}
      </div>
    </div>
  )
}
