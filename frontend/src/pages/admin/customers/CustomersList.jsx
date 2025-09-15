import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Container from '../../../primer/Container'
import Card from '../../../primer/Card'
import Button from '../../../primer/Button'
import Select from '../../../components/Select'
import { listCustomers, createCustomer } from '../../../utils/api'

export default function CustomersList() {
  const navigate = useNavigate()
  const [entityType, setEntityType] = useState('all')
  const [q, setQ] = useState('')
  const [entityId, setEntityId] = useState('')
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)

  // create form
  const [newType, setNewType] = useState('user')
  const [newEntity, setNewEntity] = useState('')
  const [stripeId, setStripeId] = useState('')
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [msg, setMsg] = useState('')

  const page = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit])
  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  const load = async (opts={}) => {
    setLoading(true); setErr('')
    try {
      const res = await listCustomers({ q, entityType, entityId, limit, offset, ...opts })
      const list = res?.customers || []
      setCustomers(Array.isArray(list) ? list : [])
      setTotal(Number(res?.total || (Array.isArray(list) ? list.length : 0)))
    } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  const onCreate = async () => {
    setMsg('')
    try {
      let eid = newEntity.trim()
      if (!eid) {
        // 自动生成一个较大的随机ID，避免与常用自增ID重叠；仅用于演示/测试
        eid = String(100000 + Math.floor(Math.random()*900000))
      }
      const res = await createCustomer({ entityType: newType, entityId: Number(eid), name: (newName||undefined), email: (newEmail||undefined), stripeCustomerId: stripeId || undefined })
      setMsg(`创建成功 customer_id=${res.customer_id}（entity_id=${eid}）`)
      setNewEntity(''); setStripeId(''); setNewName(''); setNewEmail('')
      // reload first page to include new
      setOffset(0); await load({ offset: 0 })
    } catch (e) { setMsg(String(e)) }
  }

  return (
    <Container size="lg">
      <div className="mt-6 space-y-4">
        <div className="text-xl font-semibold text-gray-800">客户</div>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="rr-label" htmlFor="cu-q">关键字</label>
              <input id="cu-q" className="rr-input" value={q} onChange={e=>setQ(e.target.value)} placeholder="按名称/邮箱搜索" />
            </div>
            <div>
              <label className="rr-label" htmlFor="cu-type">实体类型</label>
              <Select id="cu-type" value={entityType} onChange={v=>setEntityType(String(v))} options={[{value:'all',label:'全部'},{value:'user',label:'user'},{value:'team',label:'team'}]} />
            </div>
            <div>
              <label className="rr-label" htmlFor="cu-id">entity_id（可选）</label>
              <input id="cu-id" className="rr-input" value={entityId} onChange={e=>setEntityId(e.target.value)} placeholder="按 entity_id 过滤（可留空）" />
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
          <div className="font-semibold mb-2">创建客户</div>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
            <div>
              <label className="rr-label" htmlFor="nc-type">entity_type</label>
              <Select id="nc-type" value={newType} onChange={v=>setNewType(String(v))} options={[{value:'user',label:'user'},{value:'team',label:'team'}]} />
            </div>
            <div>
              <label className="rr-label" htmlFor="nc-eid">entity_id（留空自动生成）</label>
              <input id="nc-eid" className="rr-input" value={newEntity} onChange={e=>setNewEntity(e.target.value)} placeholder="可留空自动生成" />
            </div>
            <div>
              <label className="rr-label" htmlFor="nc-name">name（可选）</label>
              <input id="nc-name" className="rr-input" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="客户名称" />
            </div>
            <div>
              <label className="rr-label" htmlFor="nc-email">email（可选）</label>
              <input id="nc-email" className="rr-input" value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="客户邮箱" />
            </div>
            <div className="md:col-span-2">
              <label className="rr-label" htmlFor="nc-stripe">stripe_customer_id（可选）</label>
              <input id="nc-stripe" className="rr-input" value={stripeId} onChange={e=>setStripeId(e.target.value)} placeholder="cus_xxx（可选）" />
            </div>
            <div className="flex items-end">
              <Button onClick={onCreate} color="blue" className="w-full">创建客户</Button>
            </div>
          </div>
          {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
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
                        <th scope="col">name</th>
                        <th scope="col">email</th>
                        <th scope="col">entity_type</th>
                        <th scope="col">entity_id</th>
                        <th scope="col">stripe_customer_id</th>
                        <th scope="col">created_at</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.length === 0 && (
                        <tr><td colSpan={5} className="text-center text-sm text-gray-500">无结果</td></tr>
                      )}
                      {customers.map((c, i) => (
                        <tr key={c.id || i} className="cursor-pointer hover:bg-gray-50" onClick={()=> c.id && navigate(`/admin/customers/${encodeURIComponent(c.id)}`)}>
                          <td>{c.id}</td>
                          <td>{c.name || '-'}</td>
                          <td>{c.email || '-'}</td>
                          <td>{c.entity_type}</td>
                          <td>{c.entity_id}</td>
                          <td>{c.stripe_customer_id || '-'}</td>
                          <td>{c.created_at?.slice(0,19).replace('T',' ') || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between mt-3 text-sm text-gray-700">
                    <div>共 {total} 条 · 第 {page} / {pageCount} 页</div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={()=>{ const newOffset = Math.max(0, offset - limit); setOffset(newOffset); load({ offset: newOffset }) }} disabled={offset <= 0}>上一页</Button>
                      <Button variant="outline" onClick={()=>{ const newOffset = offset + limit; if (newOffset >= total) return; setOffset(newOffset); load({ offset: newOffset }) }} disabled={offset + customers.length >= total}>下一页</Button>
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
