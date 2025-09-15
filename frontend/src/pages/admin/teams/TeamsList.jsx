import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Container from '../../../primer/Container'
import Card from '../../../primer/Card'
import Button from '../../../primer/Button'
import { listTeams } from '../../../utils/api'

export default function TeamsList() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [orgId, setOrgId] = useState('')
  const [items, setItems] = useState([])
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
      const res = await listTeams({ q, organizationId: orgId, limit, offset, ...opts })
      const list = res?.teams || []
      setItems(Array.isArray(list) ? list : [])
      setTotal(Number(res?.total || (Array.isArray(list) ? list.length : 0)))
    } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  return (
    <Container size="lg">
      <div className="mt-6 space-y-4">
        <div className="text-xl font-semibold text-gray-800">团队</div>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="rr-label" htmlFor="t-q">关键字</label>
              <input id="t-q" className="rr-input" value={q} onChange={e=>setQ(e.target.value)} placeholder="按团队名称搜索" />
            </div>
            <div>
              <label className="rr-label" htmlFor="t-org">organization_id</label>
              <input id="t-org" className="rr-input" value={orgId} onChange={e=>setOrgId(e.target.value)} placeholder="可留空" />
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
                        <th scope="col">organization_id</th>
                        <th scope="col">name</th>
                        <th scope="col">litellm_team_id</th>
                        <th scope="col">created_at</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 && (
                        <tr><td colSpan={5} className="text-center text-sm text-gray-500">无结果</td></tr>
                      )}
                      {items.map((t, i) => (
                        <tr key={t.id || i} className="cursor-pointer hover:bg-gray-50" onClick={()=> t.id && navigate(`/admin/teams/${encodeURIComponent(t.id)}`)}>
                          <td>{t.id}</td>
                          <td>{t.organization_id}</td>
                          <td className="text-blue-600 hover:underline" onClick={(e)=>{ e.stopPropagation(); if(t.id) navigate(`/admin/teams/${encodeURIComponent(t.id)}`) }}>{t.name}</td>
                          <td>{t.litellm_team_id || '-'}</td>
                          <td>{t.created_at?.slice(0,19).replace('T',' ') || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between mt-3 text-sm text-gray-700">
                    <div>共 {total} 条 · 第 {page} / {pageCount} 页</div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={()=>{ const newOffset = Math.max(0, offset - limit); setOffset(newOffset); load({ offset: newOffset }) }} disabled={offset <= 0}>上一页</Button>
                      <Button variant="outline" onClick={()=>{ const newOffset = offset + limit; if (newOffset >= total) return; setOffset(newOffset); load({ offset: newOffset }) }} disabled={offset + items.length >= total}>下一页</Button>
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

