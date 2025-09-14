import React, { useEffect, useState } from 'react'
import { getPeriod } from '../../utils/api'
import Button from '../../primer/Button'
import Container from '../../primer/Container'
import { currentUserId } from '../../utils/dev'

export default function Period() {
  const [userId, setUserId] = useState(currentUserId('1'))
  // 移除高级/用户ID修改入口
  const [dateFrom, setDateFrom] = useState('2025-09-01')
  const [dateTo, setDateTo] = useState('2025-09-03')
  const [groupBy, setGroupBy] = useState('total')
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async (overrideUid) => {
    setLoading(true); setErr('')
    const uid = (overrideUid ?? userId)
    try { const res = await getPeriod({ userId: uid, dateFrom, dateTo, groupBy }); setData(res) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
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

  const download = async () => {
    try {
      const csv = await getPeriod({ userId, dateFrom, dateTo, groupBy, format: 'csv' })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `period_${userId}_${dateFrom}_${dateTo}_${groupBy}.csv`; a.click(); URL.revokeObjectURL(url)
    } catch (e) { alert(`下载失败: ${e}`) }
  }

  return (
    <Container>
      {/* 标题移除 */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="rr-label" htmlFor="period-date-from">起始日期</label>
          <input id="period-date-from" className="rr-input" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} placeholder="YYYY-MM-DD" />
        </div>
        <div>
          <label className="rr-label" htmlFor="period-date-to">结束日期</label>
          <input id="period-date-to" className="rr-input" value={dateTo} onChange={e=>setDateTo(e.target.value)} placeholder="YYYY-MM-DD" />
        </div>
        <div>
          <label className="rr-label" htmlFor="period-group-by">分组</label>
          <select id="period-group-by" className="rr-select" value={groupBy} onChange={e=>setGroupBy(e.target.value)}>
            <option value="total">total</option>
            <option value="model">model</option>
            <option value="day">day</option>
            <option value="model_day">model_day</option>
          </select>
        </div>
        <div className="flex gap-2 items-end">
          <Button onClick={load} color="blue">刷新</Button>
          <Button onClick={download} variant="outline" color="blue">CSV</Button>
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
              <div className="rr-table-flow mt-3">
                <div className="rr-table-scroll">
                  <div className="rr-table-inner">
                    <table className="rr-table">
                      <thead>
                        <tr>
                          {groupBy === 'model' && (<><th scope="col">model</th><th scope="col">amount</th><th scope="col">tokens</th></>)}
                          {groupBy === 'day' && (<><th scope="col">date</th><th scope="col">amount</th><th scope="col">tokens</th></>)}
                          {groupBy === 'model_day' && (<><th scope="col">date</th><th scope="col">model</th><th scope="col">amount</th><th scope="col">tokens</th></>)}
                        </tr>
                      </thead>
                      <tbody>
                        {data.groups.map((g, i) => (
                          <tr key={i}>
                            {groupBy === 'model' && (<><td>{g.model}</td><td>{g.usage_amount_cents}</td><td>{g.usage_tokens}</td></>)}
                            {groupBy === 'day' && (<><td>{g.date}</td><td>{g.usage_amount_cents}</td><td>{g.usage_tokens}</td></>)}
                            {groupBy === 'model_day' && (<><td>{g.date}</td><td>{g.model}</td><td>{g.usage_amount_cents}</td><td>{g.usage_tokens}</td></>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
    </Container>
  )
}
