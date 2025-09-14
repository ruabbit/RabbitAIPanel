import React, { useEffect, useState } from 'react'
import { getWallets } from '../../utils/api'
import Container from '../../primer/Container'
import Button from '../../primer/Button'
import { currentUserId } from '../../utils/dev'

export default function Wallets() {
  const [userId, setUserId] = useState(currentUserId('1'))
  const [wallets, setWallets] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  // 移除高级/用户ID修改入口
  const load = async (overrideUid) => {
    setLoading(true); setErr('')
    const uid = (overrideUid ?? userId)
    try { const res = await getWallets(Number(uid)); setWallets(res.wallets || []) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  useEffect(() => {
    // 初始自动加载
    load()
    const syncAndLoad = () => {
      const uid = currentUserId('1')
      if (uid !== userId) setUserId(uid)
      load(uid)
    }
    window.addEventListener('rr:settings-saved', syncAndLoad)
    window.addEventListener('focus', syncAndLoad)
    return () => {
      window.removeEventListener('rr:settings-saved', syncAndLoad)
      window.removeEventListener('focus', syncAndLoad)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <Container>
      {/* 标题移除 */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-1 gap-3">
        <Button onClick={load} color="blue">刷新</Button>
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
