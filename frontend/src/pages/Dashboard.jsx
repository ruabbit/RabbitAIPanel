import React, { useState } from 'react'
import { getBudget, getPeriod, getDailyReport, getSummaryReport, getOverdraftReport } from '../utils/api'
import Button from '../primer/Button'

export default function Dashboard() {
  const [userId, setUserId] = useState(localStorage.getItem('dev_user_id') || '1')
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const [dateFrom, setDateFrom] = useState('2025-09-01')
  const [dateTo, setDateTo] = useState('2025-09-03')
  const [groupBy, setGroupBy] = useState('total')
  const [period, setPeriod] = useState(null)
  const [dailyDate, setDailyDate] = useState('2025-09-03')
  const [daily, setDaily] = useState(null)
  const [sumDays, setSumDays] = useState(7)
  const [summary, setSummary] = useState(null)
  const [odDays, setOdDays] = useState(7)
  const [overdraft, setOverdraft] = useState(null)

  const loadBudget = async () => {
    setLoading(true); setErr('')
    try {
      const data = await getBudget(userId)
      setBudget(data)
    } catch (e) {
      setErr(String(e))
    } finally { setLoading(false) }
  }

  const loadPeriod = async () => {
    setLoading(true); setErr('')
    try {
      const data = await getPeriod({ userId, dateFrom, dateTo, groupBy })
      setPeriod(data)
    } catch (e) {
      setErr(String(e))
    } finally { setLoading(false) }
  }

  const downloadPeriodCsv = async () => {
    try {
      const csv = await getPeriod({ userId, dateFrom, dateTo, groupBy, format: 'csv' })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `period_${userId}_${dateFrom}_${dateTo}_${groupBy}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(`下载失败: ${e}`)
    }
  }

  const loadDaily = async () => {
    setLoading(true); setErr('')
    try { const data = await getDailyReport({ userId, date: dailyDate }); setDaily(data) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  const loadSummary = async () => {
    setLoading(true); setErr('')
    try { const data = await getSummaryReport({ userId, days: Number(sumDays) }); setSummary(data) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  const loadOverdraft = async () => {
    setLoading(true); setErr('')
    try { const data = await getOverdraftReport({ userId, days: Number(odDays) }); setOverdraft(data) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">用户后台</h2>

      <div className="bg-white rounded shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">user_id</label>
            <input className="w-full rr-input" value={userId} onChange={e => setUserId(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={loadBudget} color="blue" className="w-full">加载预算总览</Button>
          </div>
        </div>
        {loading && <div className="text-sm text-gray-500">加载中…</div>}
        {err && <div className="text-sm text-red-600">{err}</div>}
        {budget && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="border rounded p-4">
              <div className="font-semibold mb-2">钱包（多币种）</div>
              <ul className="text-sm text-gray-700 space-y-1">
                {(budget.wallets || []).map((w, i) => (
                  <li key={i}>{w.currency}: {w.balance_cents}¢{w.low_threshold_cents != null ? `（低阈值 ${w.low_threshold_cents}¢）` : ''}</li>
                ))}
              </ul>
            </div>
            <div className="border rounded p-4">
              <div className="font-semibold mb-2">日限额</div>
              {budget.daily_limit ? (
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>计划ID: {budget.daily_limit.plan_id}</li>
                  <li>额度: {budget.daily_limit.daily_limit_cents}¢</li>
                  <li>已用: {budget.daily_limit.spent_today_cents}¢</li>
                  <li>剩余: {budget.daily_limit.remaining_cents}¢</li>
                  <li>策略: {budget.daily_limit.overflow_policy}</li>
                </ul>
              ) : <div className="text-sm text-gray-500">无日限额</div>}
            </div>
            <div className="border rounded p-4">
              <div className="font-semibold mb-2">系统</div>
              <div className="text-sm text-gray-700">门禁：{budget.gating?.enabled ? `${budget.gating.mode}` : '关闭'}</div>
              <div className="text-sm text-gray-700">LiteLLM：{budget.litellm?.configured ? '已配置' : '未配置'}（同步 {budget.litellm?.sync_enabled ? '开' : '关'}）</div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">date_from</label>
            <input className="w-full rr-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">date_to</label>
            <input className="w-full rr-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">group_by</label>
            <select className="w-full rr-select" value={groupBy} onChange={e => setGroupBy(e.target.value)}>
              <option value="total">total</option>
              <option value="model">model</option>
              <option value="day">day</option>
              <option value="model_day">model_day</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={loadPeriod} color="blue" className="w-full">加载账期汇总</Button>
          </div>
          <div className="flex items-end">
            <Button onClick={downloadPeriodCsv} variant="outline" color="blue" className="w-full">下载 CSV</Button>
          </div>
        </div>
        {period && (
          <div className="text-sm text-gray-700 space-y-1">
            <div>用量金额：{period.usage_amount_cents}¢；代币：{period.usage_tokens}</div>
            <div>充值：{period.topup_cents}¢；退款：{period.refunds_cents}¢；净充值：{period.net_topup_cents}¢</div>
            <div>余额变动：{period.balance_delta_cents}¢</div>
            {period.groups && (
              <div className="overflow-auto">
                <table className="rr-table mt-3">
                  <thead>
                    <tr>
                      {groupBy === 'model' && (<><th scope="col">model</th><th scope="col">usage_amount_cents</th><th scope="col">usage_tokens</th></>)}
                      {groupBy === 'day' && (<><th scope="col">date</th><th scope="col">usage_amount_cents</th><th scope="col">usage_tokens</th></>)}
                      {groupBy === 'model_day' && (<><th scope="col">date</th><th scope="col">model</th><th scope="col">usage_amount_cents</th><th scope="col">usage_tokens</th></>)}
                    </tr>
                  </thead>
                  <tbody>
                    {period.groups.map((g, i) => (
                      <tr key={i}>
                        {groupBy === 'model' && (<><td>{g.model}</td><td>{g.usage_amount_cents}</td><td>{g.usage_tokens}</td></>)}
                        {groupBy === 'day' && (<><td>{g.date}</td><td>{g.usage_amount_cents}</td><td>{g.usage_tokens}</td></>)}
                        {groupBy === 'model_day' && (<><td>{g.date}</td><td>{g.model}</td><td>{g.usage_amount_cents}</td><td>{g.usage_tokens}</td></>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded shadow p-6 space-y-4">
        <div className="font-semibold">每日汇总（daily）</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">date</label>
            <input className="w-full rr-input" value={dailyDate} onChange={e => setDailyDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={loadDaily} variant="outline" color="blue" className="w-full">加载 daily</Button>
          </div>
        </div>
        {daily && (
          <div className="text-sm text-gray-700">金额：{daily.amount_cents}¢，代币：{daily.total_tokens}</div>
        )}
      </div>

      <div className="bg-white rounded shadow p-6 space-y-4">
        <div className="font-semibold">近 N 日汇总（summary）</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">days</label>
            <input className="w-full rr-input" value={sumDays} onChange={e => setSumDays(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={loadSummary} variant="outline" color="blue" className="w-full">加载 summary</Button>
          </div>
        </div>
        {summary && (
          <div className="overflow-auto">
            <table className="rr-table">
              <thead>
                <tr><th scope="col">date</th><th scope="col">amount_cents</th><th scope="col">total_tokens</th></tr>
              </thead>
              <tbody>
                {(summary.daily || []).map((d, i) => (
                  <tr key={i}>
                    <td>{d.date}</td>
                    <td>{d.amount_cents}</td>
                    <td>{d.total_tokens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded shadow p-6 space-y-4">
        <div className="font-semibold">透支/溢出事件（overdraft）</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">days</label>
            <input className="w-full rr-input" value={odDays} onChange={e => setOdDays(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={loadOverdraft} variant="outline" color="blue" className="w-full">加载 overdraft</Button>
          </div>
        </div>
        {overdraft && (
          <div className="overflow-auto">
            <table className="rr-table">
              <thead>
                <tr>
                  <th scope="col">created_at</th>
                  <th scope="col">model</th>
                  <th scope="col">request_id</th>
                  <th scope="col">overflow_policy</th>
                  <th scope="col">final_amount_cents</th>
                  <th scope="col">charged_amount_cents</th>
                  <th scope="col">remaining_before_cents</th>
                </tr>
              </thead>
              <tbody>
                {(overdraft.overdrafts || []).map((r, i) => (
                  <tr key={i}>
                    <td>{r.created_at}</td>
                    <td>{r.model}</td>
                    <td>{r.request_id}</td>
                    <td>{r.overflow_policy}</td>
                    <td>{r.final_amount_cents}</td>
                    <td>{r.charged_amount_cents}</td>
                    <td>{r.remaining_before_cents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
