import React, { useEffect, useState } from 'react'
import { getSummaryReport } from '../../utils/api'
import Button from '../../primer/Button'
import Container from '../../primer/Container'
import { currentUserId } from '../../utils/dev'

export default function Summary() {
  const [userId, setUserId] = useState(currentUserId('1'))
  const [days, setDays] = useState(7)
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  // 移除高级/用户ID修改入口

  const load = async (overrideUid) => {
    setLoading(true); setErr('')
    const uid = (overrideUid ?? userId)
    try { const res = await getSummaryReport({ userId: uid, days: Number(days) }); setData(res) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
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
          <label className="rr-label" htmlFor="summary-days">天数</label>
          <input id="summary-days" className="rr-input" value={days} onChange={e=>setDays(e.target.value)} placeholder="例如：7" />
        </div>
        <div className="flex items-end">
          <Button onClick={load} color="blue" className="w-full">刷新</Button>
        </div>
      </div>
      {loading && <div className="text-sm text-gray-500">加载中…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}
      {data && (
        <div className="rr-table-flow mt-4">
          <div className="rr-table-scroll">
            <div className="rr-table-inner">
              <table className="rr-table">
                <thead>
                  <tr>
                    <th scope="col">date</th>
                    <th scope="col">amount_cents</th>
                    <th scope="col">total_tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.daily || []).map((d, i) => (
                    <tr key={i}>
                      <td>{d.date}</td>
                      <td>{d.amount_cents}</td>
                      <td>{d.total_tokens}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Container>
  )}
