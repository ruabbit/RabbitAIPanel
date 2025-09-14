import React, { useEffect, useState } from 'react'
import { getDailyReport } from '../../utils/api'
import Button from '../../primer/Button'
import Container from '../../primer/Container'
import { currentUserId } from '../../utils/dev'

export default function Daily() {
  const [userId, setUserId] = useState(currentUserId('1'))
  const [date, setDate] = useState('2025-09-03')
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  // 移除高级/用户ID修改入口

  const load = async (overrideUid) => {
    setLoading(true); setErr('')
    const uid = (overrideUid ?? userId)
    try { const res = await getDailyReport({ userId: uid, date }); setData(res) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
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
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="rr-label" htmlFor="daily-date">日期</label>
          <input id="daily-date" className="rr-input" value={date} onChange={e=>setDate(e.target.value)} placeholder="YYYY-MM-DD" />
        </div>
        <div className="flex items-end">
          <Button onClick={load} color="blue" className="w-full">刷新</Button>
        </div>
      </div>
      {loading && <div className="text-sm text-gray-500">加载中…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}
      {data && (
        <div className="mt-4 bg-white rounded shadow p-5 text-sm text-gray-700">金额：{data.amount_cents}¢，代币：{data.total_tokens}</div>
      )}
    </Container>
  )
}
