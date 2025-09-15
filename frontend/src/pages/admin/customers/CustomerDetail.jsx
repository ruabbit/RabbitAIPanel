import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Container from '../../../primer/Container'
import Card from '../../../primer/Card'
import Button from '../../../primer/Button'
import Select from '../../../components/Select'
import {
  listSubscriptions,
  createSubscription,
  listInvoices,
  generateInvoice,
  pushInvoiceToStripe,
  ensureStripeCustomer,
} from '../../../utils/api'
import { devSeedUsage } from '../../../utils/api'
import { isDebug, currentUserId } from '../../../utils/dev'

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={(active ? 'border-blue-600 text-blue-700 ' : 'border-transparent text-gray-600 hover:text-gray-800 ') + 'px-3 py-1.5 text-sm border-b-2'}>{children}</button>
  )
}

export default function CustomerDetail() {
  const { customerId } = useParams()
  const [tab, setTab] = useState('overview')
  const cid = useMemo(()=> customerId ? Number(customerId) : undefined, [customerId])

  return (
    <Container size="xl">
      <div className="mt-6 space-y-4">
        <div className="text-sm text-gray-700">customer_id: <span className="font-mono">{customerId}</span></div>
        <div className="border-b">
          <div className="flex gap-3">
            <TabButton active={tab==='overview'} onClick={()=>setTab('overview')}>Overview</TabButton>
            <TabButton active={tab==='subs'} onClick={()=>setTab('subs')}>Subscriptions</TabButton>
            <TabButton active={tab==='invoices'} onClick={()=>setTab('invoices')}>Invoices</TabButton>
            <TabButton active={tab==='danger'} onClick={()=>setTab('danger')}>Danger</TabButton>
          </div>
        </div>

        {tab === 'overview' && (
          <Card>
            <div className="text-sm text-gray-700">在此处展示客户基础信息与最近活动（后续增强）。当前仅提供订阅与发票管理。</div>
          </Card>
        )}

        {tab === 'subs' && <TabSubscriptions customerId={cid} />}
        {tab === 'invoices' && <TabInvoices customerId={cid} />}
        {tab === 'danger' && <TabDanger customerId={cid} />}
      </div>
    </Container>
  )
}

function TabSubscriptions({ customerId }) {
  const [subs, setSubs] = useState([])
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const [planId, setPlanId] = useState('')
  const [msg, setMsg] = useState('')

  // debug seed
  const debug = isDebug()
  const [seedUserId, setSeedUserId] = useState(currentUserId('1'))
  const [seedCount, setSeedCount] = useState('10')
  const [seedMin, setSeedMin] = useState('100')
  const [seedMax, setSeedMax] = useState('2000')
  const [seedModel, setSeedModel] = useState('')

  const load = async (opts={}) => {
    if (!customerId) return
    setLoading(true); setErr('')
    try {
      const res = await listSubscriptions({ customerId, limit, offset, ...opts })
      setSubs(res.subscriptions || [])
      setTotal(Number(res.total || 0))
    } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  useEffect(()=>{ load({ offset: 0 }); }, [customerId])

  const onCreate = async () => {
    setMsg('')
    try {
      if (!customerId) throw new Error('customer_id 为空')
      if (!planId) throw new Error('plan_id 为空')
      await createSubscription({ customerId, planId: Number(planId) })
      setMsg('订阅已创建'); setPlanId('')
      await load({ offset: 0 })
    } catch (e) { setMsg(String(e)) }
  }

  return (
    <Card>
      <div className="font-semibold mb-2">订阅</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="rr-label" htmlFor="cs-plan">plan_id</label>
          <input id="cs-plan" className="rr-input" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id" />
        </div>
        <div className="flex items-end">
          <Button onClick={onCreate} color="blue">创建订阅</Button>
        </div>
      </div>
      {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}

      {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
      {loading && <div className="mt-2 text-sm text-gray-500">加载中…</div>}
      {!loading && (
        <div className="rr-table-flow mt-4">
          <div className="rr-table-scroll">
            <div className="rr-table-inner">
              <table className="rr-table">
                <thead>
                  <tr>
                    <th scope="col">id</th>
                    <th scope="col">plan_id</th>
                    <th scope="col">status</th>
                    <th scope="col">stripe_subscription_id</th>
                    <th scope="col">created_at</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.length === 0 && (<tr><td colSpan={5} className="text-center text-sm text-gray-500">无订阅</td></tr>)}
                  {subs.map(s => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.plan_id}</td>
                      <td>{s.status}</td>
                      <td>{s.stripe_subscription_id || '-'}</td>
                      <td>{s.created_at?.slice(0,19).replace('T',' ') || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between mt-3 text-sm text-gray-700">
                <div>共 {total} 条</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {debug && (
        <div className="mt-6 border-t pt-4">
          <div className="font-semibold mb-2 text-amber-700">调试：为用户生成用量假数据</div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div>
              <label className="rr-label" htmlFor="seed-uid">user_id</label>
              <input id="seed-uid" className="rr-input" value={seedUserId} onChange={e=>setSeedUserId(e.target.value)} placeholder="用户ID" />
            </div>
            <div>
              <label className="rr-label" htmlFor="seed-count">count</label>
              <input id="seed-count" className="rr-input" value={seedCount} onChange={e=>setSeedCount(e.target.value)} placeholder="10" />
            </div>
            <div>
              <label className="rr-label" htmlFor="seed-min">min_tokens</label>
              <input id="seed-min" className="rr-input" value={seedMin} onChange={e=>setSeedMin(e.target.value)} placeholder="100" />
            </div>
            <div>
              <label className="rr-label" htmlFor="seed-max">max_tokens</label>
              <input id="seed-max" className="rr-input" value={seedMax} onChange={e=>setSeedMax(e.target.value)} placeholder="2000" />
            </div>
            <div>
              <label className="rr-label" htmlFor="seed-model">model（可选）</label>
              <input id="seed-model" className="rr-input" value={seedModel} onChange={e=>setSeedModel(e.target.value)} placeholder="留空随机" />
            </div>
            <div className="flex items-end">
              <Button variant="outline" color="blue" onClick={async ()=>{
                try {
                  setMsg('')
                  const r = await devSeedUsage({ userId: Number(seedUserId), count: Number(seedCount||'10'), minTokens: Number(seedMin||'100'), maxTokens: Number(seedMax||'2000'), model: seedModel || undefined })
                  setMsg(`已生成 ${r.created} 条用量假数据`)
                } catch (e) { setMsg(String(e)) }
              }}>生成用量假数据</Button>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">提示：若用户未分配计划或未配置价格规则，系统将为部分记录使用最小随机费用。</div>
        </div>
      )}
    </Card>
  )
}

function TabInvoices({ customerId }) {
  const [invoices, setInvoices] = useState([])
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const [dateFrom, setDateFrom] = useState('2025-01-01')
  const [dateTo, setDateTo] = useState('2025-01-31')
  const [msg, setMsg] = useState('')

  const load = async (opts={}) => {
    if (!customerId) return
    setLoading(true); setErr('')
    try {
      const res = await listInvoices({ customerId, limit, offset, ...opts })
      setInvoices(res.invoices || [])
      setTotal(Number(res.total || 0))
    } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  useEffect(()=>{ load({ offset: 0 }) }, [customerId])

  const onGenerate = async () => {
    setMsg('')
    try {
      if (!customerId) throw new Error('customer_id 为空')
      await generateInvoice({ customerId, dateFrom, dateTo })
      setMsg('发票已生成'); await load({ offset: 0 })
    } catch (e) { setMsg(String(e)) }
  }

  return (
    <Card>
      <div className="font-semibold mb-2">发票</div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="rr-label" htmlFor="ci-from">date_from</label>
          <input id="ci-from" className="rr-input" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} placeholder="YYYY-MM-DD" />
        </div>
        <div>
          <label className="rr-label" htmlFor="ci-to">date_to</label>
          <input id="ci-to" className="rr-input" value={dateTo} onChange={e=>setDateTo(e.target.value)} placeholder="YYYY-MM-DD" />
        </div>
        <div className="flex items-end">
          <Button onClick={onGenerate} color="blue">生成发票</Button>
        </div>
      </div>
      {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}

      {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
      {loading && <div className="mt-2 text-sm text-gray-500">加载中…</div>}
      {!loading && (
        <div className="rr-table-flow mt-4">
          <div className="rr-table-scroll">
            <div className="rr-table-inner">
              <table className="rr-table">
                <thead>
                  <tr>
                    <th scope="col">id</th>
                    <th scope="col">period</th>
                    <th scope="col">total_amount_cents</th>
                    <th scope="col">status</th>
                    <th scope="col">stripe_invoice_id</th>
                    <th scope="col">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 && (<tr><td colSpan={6} className="text-center text-sm text-gray-500">无发票</td></tr>)}
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td>{inv.id}</td>
                      <td>{inv.period_start?.slice(0,10)} ~ {inv.period_end?.slice(0,10)}</td>
                      <td>{inv.total_amount_cents}</td>
                      <td>{inv.status}</td>
                      <td>{inv.stripe_invoice_id || '-'}</td>
                      <td>
                        <Button variant="outline" onClick={async ()=>{ if (!inv.id) return; try { await pushInvoiceToStripe({ invoiceId: inv.id }); await load(); } catch(e){} }}>推送至 Stripe</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between mt-3 text-sm text-gray-700">
                <div>共 {total} 条</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

function TabDanger({ customerId }) {
  const [msg, setMsg] = useState('')
  const [sc, setSc] = useState('')
  return (
    <Card>
      <div className="text-sm text-gray-700">敏感操作：确保 Stripe Customer 存在（需要配置 STRIPE_SECRET_KEY）。</div>
      <div className="mt-3 flex gap-2">
        <Button variant="outline" color="blue" onClick={async ()=>{ if (!customerId) return; try { setMsg(''); const r = await ensureStripeCustomer({ customerId }); setSc(r.stripe_customer_id || ''); setMsg('OK'); } catch(e){ setMsg(String(e)) } }}>Ensure Stripe Customer</Button>
        <div className="text-sm text-gray-700">stripe_customer_id: <span className="font-mono">{sc || '-'}</span></div>
      </div>
      {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
    </Card>
  )}
