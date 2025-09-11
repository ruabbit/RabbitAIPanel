import React, { useState } from 'react'
import { getLedger } from '../../utils/api'

export default function Ledger() {
  const [userId, setUserId] = useState(localStorage.getItem('dev_user_id') || '1')
  const [entries, setEntries] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const load = async () => {
    setLoading(true); setErr('')
    try { const res = await getLedger(Number(userId)); setEntries(res.entries || []) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input className="border rounded px-3 py-2" value={userId} onChange={e=>setUserId(e.target.value)} />
        <button onClick={load} className="bg-primary text-white px-3 py-2 rounded">加载</button>
      </div>
      {loading && <div className="text-sm text-gray-500">加载中…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}
      {entries && (
        <div className="overflow-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100"><tr><th className="p-2 border">created_at</th><th className="p-2 border">currency</th><th className="p-2 border">amount_cents</th><th className="p-2 border">reason</th></tr></thead>
            <tbody>
              {entries.map((l,i)=>(
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border">{l.created_at}</td>
                  <td className="p-2 border">{l.currency}</td>
                  <td className="p-2 border">{l.amount_cents}</td>
                  <td className="p-2 border">{l.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

