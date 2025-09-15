import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Container from '../../../primer/Container'
import Card from '../../../primer/Card'
import Button from '../../../primer/Button'
import Select from '../../../components/Select'
import { listPlans } from '../../../utils/api'

export default function PlansList() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('active')
  const [plans, setPlans] = useState([])
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
      const res = await listPlans({ q, type, status, limit, offset, ...opts })
      const list = res?.plans || res?.items || res?.data || []
      setPlans(Array.isArray(list) ? list : [])
      setTotal(Number(res?.total || (Array.isArray(list) ? list.length : 0)))
    } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <Container size="lg">
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold text-gray-800">计划</div>
          <Link to="/admin/plan/create" className="inline-flex items-center justify-center rr-btn rr-btn-primary">创建计划</Link>
        </div>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="rr-label" htmlFor="pl-q">关键字</label>
              <input id="pl-q" className="rr-input" value={q} onChange={e=>setQ(e.target.value)} placeholder="按名称/备注搜索" />
            </div>
            <div>
              <label className="rr-label" htmlFor="pl-type">类型</label>
              <Select id="pl-type" value={type} onChange={v=>setType(String(v))} options={[{value:'all',label:'全部'},{value:'daily_limit',label:'daily_limit'},{value:'usage',label:'usage'}]} placeholder="选择类型" />
            </div>
            <div>
              <label className="rr-label" htmlFor="pl-status">状态</label>
              <Select id="pl-status" value={status} onChange={v=>setStatus(String(v))} options={[{value:'all',label:'全部'},{value:'active',label:'active'},{value:'archived',label:'archived'}]} placeholder="选择状态" />
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
                        <th scope="col">name</th>
                        <th scope="col">type</th>
                        <th scope="col">currency</th>
                        <th scope="col">status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.length === 0 && (
                        <tr><td colSpan={4} className="text-center text-sm text-gray-500">无结果</td></tr>
                      )}
                      {plans.map((p, i) => (
                        <tr key={p.id || i} className="cursor-pointer hover:bg-gray-50" onClick={()=> p.id && navigate(`/admin/plans/${encodeURIComponent(p.id)}`)}>
                          <td>{p.id}</td>
                          <td className="text-blue-600 hover:underline" onClick={(e)=>{ e.stopPropagation(); if(p.id) navigate(`/admin/plans/${encodeURIComponent(p.id)}`) }}>{p.name || '(未命名)'}</td>
                          <td>{p.type || '-'}</td>
                          <td>{p.currency || '-'}</td>
                          <td>{p.status || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between mt-3 text-sm text-gray-700">
                    <div>共 {total} 条 · 第 {page} / {pageCount} 页</div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={()=>{ const newOffset = Math.max(0, offset - limit); setOffset(newOffset); load({ offset: newOffset }) }} disabled={offset <= 0}>上一页</Button>
                      <Button variant="outline" onClick={()=>{ const newOffset = offset + limit; if (newOffset >= total) return; setOffset(newOffset); load({ offset: newOffset }) }} disabled={offset + plans.length >= total}>下一页</Button>
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
