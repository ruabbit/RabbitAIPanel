import React, { useState } from 'react'
import { getPeriod } from '../../utils/api'

export default function Period() {
  const [userId, setUserId] = useState(localStorage.getItem('dev_user_id') || '1')
  const [dateFrom, setDateFrom] = useState('2025-09-01')
  const [dateTo, setDateTo] = useState('2025-09-03')
  const [groupBy, setGroupBy] = useState('total')
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true); setErr('')
    try { const res = await getPeriod({ userId, dateFrom, dateTo, groupBy }); setData(res) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  const download = async () => {
    try {
      const csv = await getPeriod({ userId, dateFrom, dateTo, groupBy, format: 'csv' })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `period_${userId}_${dateFrom}_${dateTo}_${groupBy}.csv`; a.click(); URL.revokeObjectURL(url)
    } catch (e) { alert(`下载失败: ${e}`) }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input className="border rounded px-3 py-2" value={userId} onChange={e=>setUserId(e.target.value)} />
        <input className="border rounded px-3 py-2" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
        <input className="border rounded px-3 py-2" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
        <select className="border rounded px-3 py-2" value={groupBy} onChange={e=>setGroupBy(e.target.value)}>
          <option value="total">total</option>
          <option value="model">model</option>
          <option value="day">day</option>
          <option value="model_day">model_day</option>
        </select>
        <div className="flex gap-2">
          <button onClick={load} className="bg-primary text-white px-3 py-2 rounded">加载</button>
          <button onClick={download} className="border px-3 py-2 rounded">CSV</button>
        </div>
      </div>
      {loading && <div className="text-sm text-gray-500">加载中…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}
      {data && (
        <div className="text-sm text-gray-700 space-y-1">
          <div>用量金额：{data.usage_amount_cents}¢；代币：{data.usage_tokens}</div>
          <div>充值：{data.topup_cents}¢；退款：{data.refunds_cents}¢；净充值：{data.net_topup_cents}¢</div>
          <div>余额变动：{data.balance_delta_cents}¢</div>
          {data.groups && (
            <div className="overflow-auto">
              <table className="min-w-full border mt-3">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    {groupBy === 'model' && (<><th className="p-2 border">model</th><th className="p-2 border">amount</th><th className="p-2 border">tokens</th></>)}
                    {groupBy === 'day' && (<><th className="p-2 border">date</th><th className="p-2 border">amount</th><th className="p-2 border">tokens</th></>)}
                    {groupBy === 'model_day' && (<><th className="p-2 border">date</th><th className="p-2 border">model</th><th className="p-2 border">amount</th><th className="p-2 border">tokens</th></>)}
                  </tr>
                </thead>
                <tbody>
                  {data.groups.map((g, i) => (
                    <tr key={i} className="odd:bg-white even:bg-gray-50">
                      {groupBy === 'model' && (<><td className="p-2 border">{g.model}</td><td className="p-2 border">{g.usage_amount_cents}</td><td className="p-2 border">{g.usage_tokens}</td></>)}
                      {groupBy === 'day' && (<><td className="p-2 border">{g.date}</td><td className="p-2 border">{g.usage_amount_cents}</td><td className="p-2 border">{g.usage_tokens}</td></>)}
                      {groupBy === 'model_day' && (<><td className="p-2 border">{g.date}</td><td className="p-2 border">{g.model}</td><td className="p-2 border">{g.usage_amount_cents}</td><td className="p-2 border">{g.usage_tokens}</td></>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

