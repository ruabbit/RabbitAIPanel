import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Container from '../../../primer/Container'
import Card from '../../../primer/Card'
import Button from '../../../primer/Button'
import Select from '../../../components/Select'
import { listSubscriptions } from '../../../utils/api'

export default function SubscriptionsList() {
  const navigate = useNavigate()
  const [customerId, setCustomerId] = useState('')
  const [planId, setPlanId] = useState('')
  const [status, setStatus] = useState('all')
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)

  const page = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit])
  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  const load = async (opts={}) => {
    setLoading(true); setErr('')
    try {
      const res = await listSubscriptions({ customerId, planId, status, limit, offset, ...opts })
      const list = res?.subscriptions || []
      setSubs(Array.isArray(list) ? list : [])
      setTotal(Number(res?.total || (Array.isArray(list) ? list.length : 0)))
    } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  return (
    <Container size="lg">
      <div className="mt-6 space-y-4">
        <div className="text-xl font-semibold text-gray-800">订阅</div>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div>
              <label className="rr-label" htmlFor="s-cid">customer_id</label>
              <input id="s-cid" className="rr-input" value={customerId} onChange={e=>setCustomerId(e.target.value)} placeholder="可留空" />
            </div>
            <div>
              <label className="rr-label" htmlFor="s-pid">plan_id</label>
              <input id="s-pid" className="rr-input" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="可留空" />
            </div>
            <div>
              <label className="rr-label" htmlFor="s-status">状态</label>
              <Select id="s-status" value={status} onChange={v=>setStatus(String(v))} options={[{value:'all',label:'全部'},{value:'active',label:'active'},{value:'paused',label:'paused'},{value:'canceled',label:'canceled'}]} />
            </div>
            <div className="flex items-end">
              <Button onClick={()=>{ setOffset(0); load({ offset: 0 }) }} color="blue" className="w-full">筛选</Button>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={()=> load()} className="w-full">刷新</Button>
            </div>
          </div>
        </Card>

        <Card>
          {err && <div className="text-sm text-red-600">{err}</div>}
          {loading && <div className="text-sm text-gray-500">加载中…</div>}
          {!loading && (
            <div className="rr-table-flow">
              <div className="rr-table-scroll">
                <div className="rr-table-inner">
                  <table className="rr-table">
                    <thead>
                      <tr>
                        <th scope="col">id</th>
                        <th scope="col">customer_id</th>
                        <th scope="col">plan_id</th>
                        <th scope="col">status</th>
                        <th scope="col">stripe_subscription_id</th>
                        <th scope="col">created_at</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subs.length === 0 && (
                        <tr><td colSpan={6} className="text-center text-sm text-gray-500">无结果</td></tr>
                      )}
                      {subs.map((s, i) => (
                        <tr key={s.id || i} className="cursor-pointer hover:bg-gray-50" onClick={()=> s.id && navigate(`/admin/subscriptions/${encodeURIComponent(s.id)}`)}>
                          <td>{s.id}</td>
                          <td>{s.customer_id}</td>
                          <td>{s.plan_id}</td>
                          <td>{s.status}</td>
                          <td>{s.stripe_subscription_id || '-'}</td>
                          <td>{s.created_at?.slice(0,19).replace('T',' ') || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between mt-3 text-sm text-gray-700">
                    <div>共 {total} 条 · 第 {page} / {pageCount} 页</div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={()=>{ const newOffset = Math.max(0, offset - limit); setOffset(newOffset); load({ offset: newOffset }) }} disabled={offset <= 0}>上一页</Button>
                      <Button variant="outline" onClick={()=>{ const newOffset = offset + limit; if (newOffset >= total) return; setOffset(newOffset); load({ offset: newOffset }) }} disabled={offset + subs.length >= total}>下一页</Button>
                      <Select value={String(limit)} onChange={v=>{ const nl = Number(v); setLimit(nl); setOffset(0); load({ limit: nl, offset: 0 }) }} options={[{value:'10',label:'10/页'},{value:'20',label:'20/页'},{value:'50',label:'50/页'}]} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Container>
  )
}

