import React, { useState } from 'react'
import { getDailyReport } from '../../utils/api'
import Button from '../../primer/Button'
import Container from '../../primer/Container'
import SectionHeading from '../../primer/SectionHeading'
import { currentUserId } from '../../utils/dev'

export default function Daily() {
  const [userId, setUserId] = useState(currentUserId('1'))
  const [date, setDate] = useState('2025-09-03')
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [advanced, setAdvanced] = useState(false)

  const load = async () => {
    setLoading(true); setErr('')
    try { const res = await getDailyReport({ userId, date }); setData(res) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  return (
    <Container>
      <SectionHeading number="U3">每日汇总</SectionHeading>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <span>当前用户ID：<strong>{userId}</strong></span>
          <Button variant="outline" color="blue" onClick={()=>setAdvanced(v=>!v)}>{advanced ? '隐藏高级' : '更改用户ID'}</Button>
        </div>
        {advanced && <input className="border rounded px-3 py-2" value={userId} onChange={e=>setUserId(e.target.value)} />}
        <input className="border rounded px-3 py-2" value={date} onChange={e=>setDate(e.target.value)} />
        <Button onClick={load} color="blue">加载</Button>
      </div>
      {loading && <div className="text-sm text-gray-500">加载中…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}
      {data && (
        <div className="mt-4 bg-white rounded shadow p-5 text-sm text-gray-700">金额：{data.amount_cents}¢，代币：{data.total_tokens}</div>
      )}
    </Container>
  )
}
