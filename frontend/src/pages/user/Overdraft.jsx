import React, { useState } from 'react'
import { getOverdraftReport } from '../../utils/api'
import Button from '../../primer/Button'
import Container from '../../primer/Container'
import SectionHeading from '../../primer/SectionHeading'
import { currentUserId } from '../../utils/dev'

export default function Overdraft() {
  const [userId, setUserId] = useState(currentUserId('1'))
  const [days, setDays] = useState(7)
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [advanced, setAdvanced] = useState(false)

  const load = async () => {
    setLoading(true); setErr('')
    try { const res = await getOverdraftReport({ userId, days: Number(days) }); setData(res) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  return (
    <Container>
      <SectionHeading number="U7">透支/溢出</SectionHeading>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <span>当前用户ID：<strong>{userId}</strong></span>
          <Button variant="outline" color="blue" onClick={()=>setAdvanced(v=>!v)}>{advanced ? '隐藏高级' : '更改用户ID'}</Button>
        </div>
        {advanced && <input className="border rounded px-3 py-2" value={userId} onChange={e=>setUserId(e.target.value)} />}
        <input className="border rounded px-3 py-2" value={days} onChange={e=>setDays(e.target.value)} />
        <Button onClick={load} color="blue">加载</Button>
      </div>
      {loading && <div className="text-sm text-gray-500">加载中…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}
      {data && (
        <div className="overflow-auto mt-4">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">created_at</th>
                <th className="p-2 border">model</th>
                <th className="p-2 border">request_id</th>
                <th className="p-2 border">policy</th>
                <th className="p-2 border">final</th>
                <th className="p-2 border">charged</th>
                <th className="p-2 border">remaining_before</th>
              </tr>
            </thead>
            <tbody>
              {(data.overdrafts || []).map((r, i) => (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border">{r.created_at}</td>
                  <td className="p-2 border">{r.model}</td>
                  <td className="p-2 border">{r.request_id}</td>
                  <td className="p-2 border">{r.overflow_policy}</td>
                  <td className="p-2 border">{r.final_amount_cents}</td>
                  <td className="p-2 border">{r.charged_amount_cents}</td>
                  <td className="p-2 border">{r.remaining_before_cents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  )
}
