import React, { useState } from 'react'
import { getOverdraftReport } from '../../utils/api'

export default function Overdraft() {
  const [userId, setUserId] = useState(localStorage.getItem('dev_user_id') || '1')
  const [days, setDays] = useState(7)
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true); setErr('')
    try { const res = await getOverdraftReport({ userId, days: Number(days) }); setData(res) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input className="border rounded px-3 py-2" value={userId} onChange={e=>setUserId(e.target.value)} />
        <input className="border rounded px-3 py-2" value={days} onChange={e=>setDays(e.target.value)} />
        <button onClick={load} className="bg-primary text-white px-3 py-2 rounded">加载</button>
      </div>
      {loading && <div className="text-sm text-gray-500">加载中…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}
      {data && (
        <div className="overflow-auto">
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
    </div>
  )
}

