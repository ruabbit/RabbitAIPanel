import React, { useState } from 'react'
import { getDailyReport } from '../../utils/api'

export default function Daily() {
  const [userId, setUserId] = useState(localStorage.getItem('dev_user_id') || '1')
  const [date, setDate] = useState('2025-09-03')
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true); setErr('')
    try { const res = await getDailyReport({ userId, date }); setData(res) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input className="border rounded px-3 py-2" value={userId} onChange={e=>setUserId(e.target.value)} />
        <input className="border rounded px-3 py-2" value={date} onChange={e=>setDate(e.target.value)} />
        <button onClick={load} className="bg-primary text-white px-3 py-2 rounded">加载</button>
      </div>
      {loading && <div className="text-sm text-gray-500">加载中…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}
      {data && (
        <div className="bg-white rounded shadow p-5 text-sm text-gray-700">金额：{data.amount_cents}¢，代币：{data.total_tokens}</div>
      )}
    </div>
  )
}

