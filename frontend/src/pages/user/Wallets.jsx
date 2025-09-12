import React, { useState } from 'react'
import { getWallets } from '../../utils/api'
import Container from '../../primer/Container'
import SectionHeading from '../../primer/SectionHeading'
import Button from '../../primer/Button'
import { currentUserId } from '../../utils/dev'

export default function Wallets() {
  const [userId, setUserId] = useState(currentUserId('1'))
  const [wallets, setWallets] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const load = async () => {
    setLoading(true); setErr('')
    try { const res = await getWallets(Number(userId)); setWallets(res.wallets || []) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  return (
    <Container>
      <SectionHeading number="U5">钱包</SectionHeading>
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
      {wallets && (
        <ul className="mt-4 text-sm text-gray-700 list-disc pl-5">
          {wallets.map((w,i)=>(<li key={i}>{w.currency}: {w.balance_cents}¢</li>))}
        </ul>
      )}
    </Container>
  )
}
