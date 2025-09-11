import React, { useState } from 'react'
import { getWallets } from '../../utils/api'
import Button from '../../primer/Button'

export default function Wallets() {
  const [userId, setUserId] = useState(localStorage.getItem('dev_user_id') || '1')
  const [wallets, setWallets] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const load = async () => {
    setLoading(true); setErr('')
    try { const res = await getWallets(Number(userId)); setWallets(res.wallets || []) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input className="border rounded px-3 py-2" value={userId} onChange={e=>setUserId(e.target.value)} />
        <Button onClick={load} color="blue">加载</Button>
      </div>
      {loading && <div className="text-sm text-gray-500">加载中…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}
      {wallets && (
        <ul className="text-sm text-gray-700 list-disc pl-5">
          {wallets.map((w,i)=>(<li key={i}>{w.currency}: {w.balance_cents}¢</li>))}
        </ul>
      )}
    </div>
  )
}
