import React, { useState } from 'react'
import { getLedger } from '../../utils/api'
import Container from '../../primer/Container'
import SectionHeading from '../../primer/SectionHeading'
import Button from '../../primer/Button'
import { currentUserId } from '../../utils/dev'
import Button from '../../primer/Button'

export default function Ledger() {
  const [userId, setUserId] = useState(currentUserId('1'))
  const [entries, setEntries] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const load = async () => {
    setLoading(true); setErr('')
    try { const res = await getLedger(Number(userId)); setEntries(res.entries || []) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  return (
    <Container>
      <SectionHeading number="U6">流水</SectionHeading>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <span>当前用户ID：<strong>{userId}</strong></span>
          <Button variant="outline" color="blue" onClick={()=>setAdvanced(v=>!v)}>{advanced ? '隐藏高级' : '更改用户ID'}</Button>
        </div>
        {advanced && <input className="border rounded px-3 py-2" value={userId} onChange={e=>setUserId(e.target.value)} />}
        <Button onClick={load} color="blue">加载</Button>
      </div>
      {loading && <div className="text-sm text-gray-500">加载中…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}
      {entries && (
        <div className="overflow-auto mt-4">
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
    </Container>
  )
}
